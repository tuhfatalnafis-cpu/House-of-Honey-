/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAppState } from '../context/AppContext';
import { X, Trash2, ShoppingCart, User, Mail, Phone, MapPin, Check, CreditCard, Sparkles, Building2 } from 'lucide-react';
import { translations, getProductTranslation } from '../lib/translations';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  inPage?: boolean;
}

export const Cart: React.FC<CartProps> = ({ isOpen, onClose, inPage }) => {
  const {
    cart,
    updateCartQty,
    removeFromCart,
    referralCode,
    setReferralCode,
    affiliates,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    checkout,
    orders,
    checkoutReturnPending,
    language
  } = useAppState();

  // Checkout Form States
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');

  // Referral code manual entry state
  const [enteredCode, setEnteredCode] = useState('');
  const [codeFeedback, setCodeFeedback] = useState<{ status: 'idle' | 'success' | 'error'; msg: string }>({ status: 'idle', msg: '' });

  // Order status checkout tracking
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'payment_processing' | 'receipt' | 'failed'>('cart');
  const [generatedReceiptId, setGeneratedReceiptId] = useState('');
  const [estimatedCommission, setEstimatedCommission] = useState(0);

  if (!isOpen && !inPage) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getCommissionRate = (tier: string): number => {
    if (tier === 'Gold') return 0.20;
    if (tier === 'Silver') return 0.15;
    return 0.10;
  };

  // Manual code entry check
  const handleApplyReferral = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = enteredCode.toUpperCase().trim();
    if (!cleanCode) {
      setCodeFeedback({ status: 'error', msg: translations.enterCodeErr[language] });
      return;
    }

    const match = affiliates.find(a => a.code.toUpperCase() === cleanCode);
    if (match) {
      setReferralCode(match.code);
      setCodeFeedback({
        status: 'success',
        msg: translations.codeAppliedSuccess[language].replace('{name}', match.name)
      });
      setEnteredCode('');
    } else {
      setCodeFeedback({ status: 'error', msg: translations.codeNotFoundErr[language] });
    }
  };

  const clearReferral = () => {
    setReferralCode(null);
    setCodeFeedback({ status: 'idle', msg: '' });
  };

  // Checkout process trigger
  const handleCheckoutProgress = () => {
    if (checkoutStep === 'cart') {
      setCheckoutStep('shipping');
    }
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !customerPhone || !shippingAddress) {
      if (language === 'ms') {
        alert('Sila isi semua butiran yang diperlukan untuk memastikan penghantaran lancar.');
      } else {
        alert('Please fill in all requested fields to guarantee smooth shipping.');
      }
      return;
    }

    setIsSubmitting(true);
    setCheckoutStep('payment_processing');

    // Calculate commission ahead to show as an estimate once the receipt appears
    let calculatedComm = 0;
    if (referralCode) {
      const match = affiliates.find(a => a.code.toUpperCase() === referralCode.toUpperCase().trim());
      if (match) {
        calculatedComm = subtotal * getCommissionRate(match.tier);
      }
    }
    setEstimatedCommission(calculatedComm);

    const result = await checkout({
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress
    });

    if (result.redirecting) {
      // Browser is about to navigate to the gateway's hosted payment page — keep the spinner up.
      return;
    }

    // Any non-redirecting outcome here means checkout() couldn't even reach the gateway.
    setIsSubmitting(false);
    setCheckoutStep('failed');
  };

  // Returning from the payment gateway redirect: reflect the confirmed outcome once
  // AppContext's own status re-verify (triggered from the ?checkout_result URL param) resolves.
  // Captured once on mount, not re-read on every run — AppContext strips these params from
  // the URL once it resolves, which would otherwise race with this effect re-reading them.
  const [pendingCheckoutRefId, setPendingCheckoutRefId] = useState(() => new URLSearchParams(window.location.search).get('ref_id'));

  useEffect(() => {
    if (!pendingCheckoutRefId) return;

    if (checkoutReturnPending) {
      setCheckoutStep('payment_processing');
      return;
    }

    const match = orders.find(o => o.paymentRef === pendingCheckoutRefId || o.id === pendingCheckoutRefId);
    if (!match) return;

    // Resolved — clear the tracked ref so this effect goes inert. Without this, any later
    // `orders` change (e.g. a brand-new checkout attempt creating its own Pending order) would
    // re-run this effect, find this same now-stale order still Paid/Failed, and snap
    // checkoutStep back to receipt/failed in the middle of the new attempt.
    setPendingCheckoutRefId(null);

    if (match.paymentStatus === 'Paid') {
      setGeneratedReceiptId(match.id);
      setEstimatedCommission(match.affiliateCommission || 0);
      setCheckoutStep('receipt');
    } else if (match.paymentStatus === 'Failed') {
      setCheckoutStep('failed');
    }
  }, [pendingCheckoutRefId, checkoutReturnPending, orders]);

  const resetCheckoutFlow = () => {
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setShippingAddress('');
    setCheckoutStep('cart');
    onClose();
  };

  // After a failed/cancelled payment, return to the order cart — keeps the shipping details
  // the shopper already entered so they don't need to retype them if they check out again.
  const handleRetryPayment = () => {
    setCheckoutStep('cart');
  };

  return (
    <div 
      id={inPage ? undefined : "cart-drawer-overlay"} 
      className={inPage ? "w-full max-w-lg mx-auto bg-white rounded-xl border border-gray-150 overflow-hidden text-left shadow-xs h-[100%] flex flex-col" : "fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity overflow-hidden"}
    >
      {/* Background click dismiss */}
      {!inPage && <div className="absolute inset-0" onClick={checkoutStep !== 'payment_processing' ? onClose : undefined} />}

      {/* Cart Container Drawer */}
      <div className={inPage ? "relative w-full max-w-lg bg-white h-full flex flex-col justify-between" : "relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-left"}>
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <div>
              <h3 className="text-base font-bold text-gray-900 font-sans tracking-tight">
                {translations.checkoutPortalTitle[language]}
              </h3>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest leading-none mt-1">
                {checkoutStep === 'cart' && translations.verifyDetails[language]}
                {checkoutStep === 'shipping' && translations.enterAddress[language]}
                {checkoutStep === 'payment_processing' && translations.routingGateway[language]}
                {checkoutStep === 'receipt' && translations.receiptStepTitle[language]}
                {checkoutStep === 'failed' && translations.paymentFailedTitle[language]}
              </p>
            </div>
          </div>
          {checkoutStep !== 'payment_processing' && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-900 transition-colors cursor-pointer hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Dynamic Inner Step Views */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {checkoutStep === 'cart' && (
            <>
              {/* Cart Items List */}
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center space-y-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-[#EE4D2D]">
                    <ShoppingCart className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{translations.emptyCartTitle[language]}</p>
                    <p className="text-xs text-gray-500 mt-1">{translations.emptyCartDesc[language]}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#EE4D2D] text-white hover:bg-[#FF6B4A] cursor-pointer"
                  >
                    {translations.browseCatalogBtn[language]}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between font-bold text-xs text-gray-400 border-b border-gray-50 pb-2">
                    <span>{translations.productBottlesHeader[language]}</span>
                    <span>{translations.subtotalHeader[language]}</span>
                  </div>
                  {cart.map(item => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 rounded-xl px-1"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.product.image}
                          alt={getProductTranslation(item.product.id, 'name', language, item.product.name)}
                          referrerPolicy="no-referrer"
                          className="h-12 w-12 rounded-lg object-cover border border-gray-100 shadow-xs"
                        />
                        <div>
                          <p className="text-xs font-bold text-gray-900 leading-tight line-clamp-1">
                            {getProductTranslation(item.product.id, 'name', language, item.product.name)}
                          </p>
                          <p className="text-[10px] text-gray-500 font-semibold">RM {item.product.price.toFixed(2)} / {item.product.volume}</p>
                          
                          {/* Counter adjustments */}
                          <div className="flex items-center space-x-3 mt-2">
                            <button
                              onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                              className="h-10 w-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold flex items-center justify-center text-sm transition-all cursor-pointer border border-gray-200/50 active:scale-90"
                            >
                              -
                            </button>
                            <span className="text-xs font-black text-gray-900 w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                              className="h-10 w-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold flex items-center justify-center text-sm transition-all cursor-pointer border border-gray-200/50 active:scale-95"
                              disabled={item.quantity >= item.product.stock}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="text-xs font-bold text-gray-950">
                          RM {(item.product.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete from cart"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Referral verification block */}
              {cart.length > 0 && (
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                    {translations.referralDiscountHeader[language]}
                  </span>

                  {referralCode ? (
                    <div className="flex items-start justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                          <Check className="h-4 w-4 text-emerald-600" />
                          {translations.codeAppliedLabel[language]}: {referralCode}
                        </p>
                        {affiliates.find(a => a.code.toUpperCase() === referralCode.toUpperCase()) && (
                          <p className="text-[10px] text-emerald-800 font-medium">
                            {translations.commissionRecipientMsg[language].replace(
                              '{name}',
                              affiliates.find(a => a.code.toUpperCase() === referralCode.toUpperCase())?.name || ''
                            )}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={clearReferral}
                        className="text-xs font-bold text-emerald-700 hover:text-red-600 underline cursor-pointer"
                      >
                        {translations.clearCodeBtn[language]}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyReferral} className="space-y-2">
                      <p className="text-[11px] text-gray-600 leading-snug">
                        {translations.referralFormPrompt[language]}
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={enteredCode}
                          onChange={e => setEnteredCode(e.target.value)}
                          placeholder="E.g., SARAH15, AHMAD10"
                          className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:border-[#EE4D2D] outline-none font-bold uppercase"
                        />
                        <button
                          type="submit"
                          className="bg-[#EE4D2D] hover:bg-[#FF6B4A] text-white font-bold text-xs px-4 py-1.5 rounded-xl cursor-pointer"
                        >
                          {translations.applyBtn[language]}
                        </button>
                      </div>
                      {codeFeedback.msg && (
                        <p className={`text-[10px] font-semibold ${codeFeedback.status === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                          {codeFeedback.msg}
                        </p>
                      )}
                    </form>
                  )}
                </div>
              )}
            </>
          )}

          {checkoutStep === 'shipping' && (
            <form onSubmit={handleConfirmOrder} className="space-y-4">
              <h4 className="text-xs font-semibold uppercase text-gray-400 tracking-wider">
                {translations.shippingHeader[language]}
              </h4>

              {/* Multi-Branch Selector block */}
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-gray-950 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-[#EE4D2D]" />
                  {translations.shippingHubLabel[language]}
                </p>
                <p className="text-[11px] text-gray-600 leading-snug">
                  {translations.shippingHubDesc[language]}
                </p>
                <select
                  value={selectedBranchId}
                  onChange={e => setSelectedBranchId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:border-[#EE4D2D] outline-none cursor-pointer"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.state})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-semibold text-gray-500 block mb-1">{translations.fullNameLabel[language]}</span>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                    <input
                      required
                      type="text"
                      placeholder={translations.fullNamePlaceholder[language]}
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl h-11 pl-10 pr-4 text-base sm:text-xs font-medium focus:border-[#EE4D2D] outline-none shadow-xs bg-white"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-gray-500 block mb-1">{translations.emailLabel[language]}</span>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                    <input
                      required
                      type="email"
                      placeholder={translations.emailPlaceholder[language]}
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl h-11 pl-10 pr-4 text-base sm:text-xs font-medium focus:border-[#EE4D2D] outline-none shadow-xs bg-white"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-gray-500 block mb-1">{translations.phoneLabel[language]}</span>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                    <input
                      required
                      type="tel"
                      placeholder={translations.phonePlaceholder[language]}
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl h-11 pl-10 pr-4 text-base sm:text-xs font-medium focus:border-[#EE4D2D] outline-none shadow-xs bg-white"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-gray-500 block mb-1">{translations.addressLabel[language]}</span>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <textarea
                      required
                      rows={3}
                      placeholder={translations.addressPlaceholder[language]}
                      value={shippingAddress}
                      onChange={e => setShippingAddress(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-base sm:text-xs font-medium focus:border-[#EE4D2D] outline-none shadow-xs resize-none bg-white"
                    />
                  </div>
                </label>
              </div>

              {/* Terms of Purchase reminder */}
              <div className="border border-amber-100 rounded-xl bg-amber-50/40 p-3 flex gap-2">
                <span>🛡️</span>
                <p className="text-[10px] text-gray-600 leading-normal">
                  {translations.termsReminder[language]}
                </p>
              </div>

              {/* Form buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('cart')}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 bg-white font-bold rounded-xl text-xs hover:bg-gray-50 cursor-pointer"
                >
                  {translations.backToCartBtn[language]}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 text-white py-2.5 font-bold rounded-xl text-xs hover:bg-amber-600 shadow-sm cursor-pointer"
                >
                  {translations.confirmPaymentBtn[language]}
                </button>
              </div>
            </form>
          )}

          {checkoutStep === 'payment_processing' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center animate-pulse">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-amber-200" />
                <div className="absolute inset-0 rounded-full border-4 border-amber-600 border-t-transparent animate-spin" />
                <CreditCard className="h-8 w-8 text-[#EE4D2D]" />
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-extrabold text-gray-900 font-sans tracking-tight">
                  {translations.gatewayTitle[language]}
                </h4>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                  {translations.gatewayDesc[language]}
                </p>
              </div>
              <div className="bg-amber-50 text-amber-900 border border-amber-100 px-4 py-2 rounded-xl text-[10px] font-bold">
                {translations.noRefreshWarning[language]}
              </div>
            </div>
          )}

          {checkoutStep === 'failed' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center animate-scale-up">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                <X className="h-8 w-8" strokeWidth={3} />
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-extrabold text-gray-900 font-sans tracking-tight">
                  {translations.paymentFailedTitle[language]}
                </h4>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                  {translations.paymentFailedDesc[language]}
                </p>
              </div>
              <button
                onClick={handleRetryPayment}
                className="bg-[#EE4D2D] hover:bg-[#FF6B4A] text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-sm cursor-pointer"
              >
                {translations.backToCartBtn[language]}
              </button>
            </div>
          )}

          {checkoutStep === 'receipt' && (
            <div className="space-y-6 py-4 animate-scale-up">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-150 text-emerald-800 shadow-sm">
                  <span className="text-2xl animate-bounce">🐝</span>
                </div>
                <h4 className="text-lg font-extrabold text-[#EE4D2D] font-sans tracking-tight">
                  {translations.orderSucceeded[language]}
                </h4>
                <p className="text-xs text-gray-500">
                  {translations.orderSucceededDesc[language].replace(
                    '{branch}',
                    branches.find(b => b.id === selectedBranchId)?.name || ''
                  )}
                </p>
              </div>

              {/* Customer summary print card */}
              <div className="border border-dashed border-gray-300 rounded-2xl bg-gray-50/50 p-5 space-y-4 font-sans text-xs">
                <div className="flex justify-between font-mono text-[10px] font-bold text-gray-400">
                  <span>{translations.paymentReceiptHeader[language]}</span>
                  <span>{new Date().toISOString().split('T')[0]}</span>
                </div>

                <div className="grid grid-cols-2 gap-y-1 bg-white p-3 rounded-lg border border-gray-100">
                  <span className="text-gray-400 font-semibold">{translations.orderIdLabel[language]}</span>
                  <span className="text-right font-mono font-bold text-gray-900 uppercase">{generatedReceiptId}</span>

                  <span className="text-gray-400 font-semibold">{translations.clientNameLabel[language]}</span>
                  <span className="text-right font-bold text-gray-900 truncate">{customerName}</span>

                  <span className="text-gray-400 font-semibold">{translations.gatewayLabel[language]}</span>
                  <span className="text-right font-bold text-[#EE4D2D]">
                    {translations.realGatewayName[language]}
                  </span>

                  <span className="text-gray-400 font-semibold">{translations.locationHubLabel[language]}</span>
                  <span className="text-right text-[11px] font-bold text-gray-800 shrink-0">
                    {branches.find(b => b.id === selectedBranchId)?.name}
                  </span>
                </div>

                {/* Referral stats */}
                {referralCode && (
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-emerald-800 font-bold">{translations.affiliateAttributionLabel[language]}</p>
                      <p className="text-[11px] font-extrabold text-emerald-950">{translations.referralCodeText[language]}: {referralCode}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-emerald-800 font-bold">{translations.payoutEarnedLabel[language]}</p>
                      <p className="text-xs font-black text-emerald-950">RM {estimatedCommission.toFixed(2)}</p>
                    </div>
                  </div>
                )}

                {/* Ordered Items summary list */}
                <div className="space-y-1 pt-1">
                  <p className="font-semibold text-gray-400 text-[10px] uppercase">{translations.bottlesOrderedLabel[language]}</p>
                  <p className="font-bold text-gray-800">
                    {translations.totalContainersShipped[language].replace('{count}', String(totalItems))}
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-3 flex justify-between items-center bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/20">
                  <span className="text-sm font-black text-amber-950 font-sans">{translations.totalAmountLabel[language]}</span>
                  <span className="text-base font-black text-amber-950 font-sans">
                    RM {subtotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={resetCheckoutFlow}
                className="w-full bg-[#EE4D2D] hover:bg-[#FF6B4A] text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer shadow-sm text-center block"
              >
                {translations.continueShoppingBtn[language]}
              </button>
            </div>
          )}
        </div>

        {/* Floating Cart Footer (Visible during item screening step) */}
        {checkoutStep === 'cart' && cart.length > 0 && (
          <div className="border-t border-gray-100 p-6 bg-gray-50/80 backdrop-blur-md space-y-4">
            <div className="space-y-1.5 font-sans">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{translations.cartSubtotalText[language].replace('{count}', String(totalItems))}</span>
                <span className="font-semibold text-gray-800">RM {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{translations.shippingCourierText[language]}</span>
                <span className="text-green-600 font-bold">{translations.freeShippingText[language]}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm font-bold text-gray-900">{translations.totalPurchaseText[language]}</span>
                <span className="text-lg font-black text-gray-900 font-sans text-[#EE4D2D]">
                  RM {subtotal.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              id="checkout-progress-btn"
              onClick={handleCheckoutProgress}
              className="w-full bg-[#EE4D2D] hover:bg-[#FF6B4A] text-white font-bold py-3 rounded-xl text-xs shadow-sm shadow-[#EE4D2D]/10 cursor-pointer text-center block animate-pulse hover:animate-none"
            >
              {translations.continueToShippingBtn[language]}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
