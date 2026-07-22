/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { validateMalaysianIC } from './AuthWindow';
import { TierType } from '../types';
import {
  User,
  Mail,
  Phone,
  FileText,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Layers,
  Package,
  CheckCircle,
  Building2
} from 'lucide-react';

interface UpgradeAccountWindowProps {
  targetType: 'affiliate' | 'agent';
  onSuccess: () => void;
}

export const UpgradeAccountWindow: React.FC<UpgradeAccountWindowProps> = ({ targetType, onSuccess }) => {
  const { currentUserAccount, currentUserProfile, bankAccounts, upgradeToAffiliate, upgradeToAgent } = useAppState();

  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);

  const hasIC = !!currentUserProfile?.icNumber;
  const [icNumber, setIcNumber] = useState('');
  const [whatsapp, setWhatsapp] = useState(currentUserProfile?.whatsappNumber || currentUserProfile?.phoneNumber || '');

  const existingBank = currentUserAccount
    ? bankAccounts.find(b => b.userId === currentUserAccount.id && b.isDefault) || bankAccounts.find(b => b.userId === currentUserAccount.id)
    : undefined;
  const [useSavedBank, setUseSavedBank] = useState(!!existingBank);
  const [bankName, setBankName] = useState('Maybank');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankHolderName, setBankHolderName] = useState('');

  const [selectedAgentTier, setSelectedAgentTier] = useState<TierType>('Bronze');

  if (!currentUserAccount) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setSuccessStatus(null);

    if (!whatsapp) {
      return setErrorStatus('WhatsApp number is required.');
    }
    if (!hasIC) {
      if (!icNumber) return setErrorStatus('IC Number (MyKAD) is required.');
      if (!validateMalaysianIC(icNumber)) {
        return setErrorStatus('Invalid Malaysian IC format. Must be YYMMDD-XX-XXXX (12 digits total).');
      }
    }
    if (!useSavedBank && !bankAccountNo) {
      return setErrorStatus('Bank account number is required.');
    }

    const bankFields = useSavedBank
      ? { bankAccountId: existingBank?.id }
      : { newBank: { bankName, bankNo: bankAccountNo, holderName: bankHolderName } };

    try {
      if (targetType === 'affiliate') {
        const res = await upgradeToAffiliate({
          ic: hasIC ? currentUserProfile!.icNumber : icNumber,
          whatsapp,
          ...bankFields
        });
        if (res.success) {
          setSuccessStatus('Congratulations! Your Tualang Plus Affiliate ID is registered.');
          setTimeout(() => onSuccess(), 1200);
        } else {
          setErrorStatus(res.error || 'Unable to register affiliate account.');
        }
      } else {
        const res = await upgradeToAgent({
          ic: hasIC ? currentUserProfile!.icNumber : icNumber,
          whatsapp,
          tier: selectedAgentTier,
          ...bankFields
        });
        if (res.success) {
          setSuccessStatus(`Agent profile registered successfully at Tier ${selectedAgentTier}! Stock has been added to your log.`);
          setTimeout(() => onSuccess(), 1400);
        } else {
          setErrorStatus(res.error || 'Registration failed.');
        }
      }
    } catch (err: any) {
      setErrorStatus(err.message || 'An unknown incident occurred.');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 max-w-lg mx-auto">
      <div className="bg-gradient-to-r from-blue-700 to-[#1580c2] px-6 py-8 text-white">
        <h2 className="font-sans text-2xl font-bold tracking-tight">
          {targetType === 'affiliate' ? 'Register Affiliate Account' : 'Apply as Official Agent'}
        </h2>
        <p className="font-sans text-xs text-blue-105 mt-1">
          {targetType === 'affiliate'
            ? 'Earn dynamic lifetime commissions through automated sharing links'
            : 'Access tiered bulk pricing discounts with live micro-inventories'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {errorStatus && (
          <div className="flex items-start gap-2 bg-red-50 text-red-700 p-3 rounded-lg border border-red-100 text-xs text-left">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorStatus}</span>
          </div>
        )}
        {successStatus && (
          <div className="flex items-start gap-2 bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100 text-xs text-left">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successStatus}</span>
          </div>
        )}

        {/* Existing account confirmation — no re-entry of name/email/password */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            {currentUserProfile?.fullName?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{currentUserProfile?.fullName || 'Your account'}</p>
            <p className="text-[10px] text-gray-500 flex items-center gap-1 truncate">
              <Mail className="h-3 w-3 shrink-0" /> {currentUserAccount.email}
            </p>
          </div>
        </div>

        {/* IC — only asked if not already on file */}
        {hasIC ? (
          <div className="flex items-center gap-2 text-[10.5px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>MyKAD on file: <strong className="text-gray-700">{currentUserProfile!.icNumber}</strong></span>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">IC Number (MyKAD)</label>
              <div className="group relative">
                <HelpCircle className="h-3.5 w-3.5 text-gray-400 hover:text-blue-500 cursor-pointer" />
                <div className="absolute bottom-5 right-0 hidden group-hover:block w-48 bg-gray-900 text-white rounded p-2 text-[9px] leading-relaxed shadow-lg z-50">
                  Input 12 digits directly (e.g., 920410065321). System automatically converts YYMMDD components to date-of-birth records.
                </div>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">
                <FileText className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={icNumber}
                onChange={(e) => setIcNumber(e.target.value.replace(/[^\d-]/g, ''))}
                placeholder="YYMMDD-XX-XXXX"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                maxLength={14}
                required
              />
            </div>
            {icNumber && (
              <p className={`text-[10px] mt-1 flex items-center gap-1 ${validateMalaysianIC(icNumber) ? 'text-emerald-700' : 'text-amber-700'}`}>
                {validateMalaysianIC(icNumber)
                  ? '✓ Correct MyKAD validation check completed. DOB ready.'
                  : '⚠ Please verify formatting YYMMDD-XX-XXXX (12 digits required).'}
              </p>
            )}
          </div>
        )}

        {/* WhatsApp — prefilled from profile if available */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Direct WhatsApp Number</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400">
              <Phone className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="e.g. +6012345678"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Bank account — reuse saved default, or collect a new one */}
        <div className="pt-2 border-t border-gray-100 space-y-2.5">
          <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-blue-600" />
            Payout Bank Account
          </h3>

          {existingBank && (
            <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${useSavedBank ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}>
              <input type="radio" checked={useSavedBank} onChange={() => setUseSavedBank(true)} className="accent-blue-600" />
              <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-gray-900">{existingBank.bankName} •••• {existingBank.accountNumber.slice(-4)}</p>
                <p className="text-[10px] text-gray-500">{existingBank.accountHolderName} (on file)</p>
              </div>
            </label>
          )}

          <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${!useSavedBank ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}>
            <input type="radio" checked={!useSavedBank} onChange={() => setUseSavedBank(false)} className="accent-blue-600" />
            <span className="text-xs font-bold text-gray-900">{existingBank ? 'Use a different bank account' : 'Add payout bank account'}</span>
          </label>

          {!useSavedBank && (
            <div className="space-y-2 pl-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 mb-1">Bank Name</label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full py-2 px-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Maybank">Maybank</option>
                    <option value="CIMB Bank">CIMB Bank</option>
                    <option value="Public Bank">Public Bank</option>
                    <option value="Bank Islam">Bank Islam</option>
                    <option value="RHB Bank">RHB Bank</option>
                    <option value="Hong Leong">Hong Leong</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={bankAccountNo}
                    onChange={(e) => setBankAccountNo(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="12 digits"
                    className="w-full py-2 px-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required={!useSavedBank}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-700 mb-1">Bank Account Holder (must match MyKAD name)</label>
                <input
                  type="text"
                  value={bankHolderName}
                  onChange={(e) => setBankHolderName(e.target.value)}
                  placeholder={currentUserProfile?.fullName || 'Leave empty to auto-use profile name'}
                  className="w-full py-2 px-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Agent-only tier selection */}
        {targetType === 'agent' && (
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-blue-600" />
              Select Your Initial Agent Tier & Bulk Pricing
            </h3>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedAgentTier('Bronze')}
                className={`p-2.5 rounded-xl border text-center transition-all ${selectedAgentTier === 'Bronze' ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20' : 'bg-white hover:bg-gray-50 border-gray-200'}`}
              >
                <span className="block text-[11px] font-bold text-amber-800">Bronze Agent</span>
                <span className="block text-[13px] font-bold text-gray-900 mt-1">RM 1,000</span>
                <span className="block text-[9px] text-gray-500 mt-0.5">11 Bottles (20% Off)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAgentTier('Silver')}
                className={`p-2.5 rounded-xl border text-center transition-all ${selectedAgentTier === 'Silver' ? 'bg-slate-50 border-slate-400 ring-2 ring-slate-400/20' : 'bg-white hover:bg-gray-50 border-gray-200'}`}
              >
                <span className="block text-[11px] font-bold text-slate-700">Silver Agent</span>
                <span className="block text-[13px] font-bold text-gray-900 mt-1">RM 5,000</span>
                <span className="block text-[9px] text-gray-500 mt-0.5">59 Bottles (30% Off)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAgentTier('Gold')}
                className={`p-2.5 rounded-xl border text-center transition-all ${selectedAgentTier === 'Gold' ? 'bg-yellow-50 border-yellow-500 ring-2 ring-yellow-500/20' : 'bg-white hover:bg-gray-50 border-gray-200'}`}
              >
                <span className="block text-[11px] font-bold text-yellow-700">Gold Agent</span>
                <span className="block text-[13px] font-bold text-gray-900 mt-1">RM 15,000</span>
                <span className="block text-[9px] text-gray-500 mt-0.5">176 Bottles (40% Off)</span>
              </button>
            </div>

            <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex items-start gap-2.5">
              <Package className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" />
              <div className="text-[10px] leading-relaxed text-blue-900">
                <strong>Inventory Package:</strong> By upgrading to <strong>{selectedAgentTier}</strong>, your account is pre-loaded with virtual inventory of honey products. You earn a <strong>{selectedAgentTier === 'Gold' ? '25%' : selectedAgentTier === 'Silver' ? '20%' : '15%'} commission</strong> from affiliate links and possess total control to list micro-inventories dynamically.
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full mt-4 bg-[#1580c2] hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl font-sans font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
        >
          <ShieldCheck className="h-4 w-4" />
          {targetType === 'affiliate'
            ? 'Register Affiliate Account'
            : `Confirm & Initiate RM ${selectedAgentTier === 'Gold' ? '15,000' : selectedAgentTier === 'Silver' ? '5,000' : '1,000'} Payment`}
        </button>
      </form>
    </div>
  );
};
