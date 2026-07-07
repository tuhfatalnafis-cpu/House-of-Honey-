/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { Award, Copy, Check, LogOut, ArrowRight, UserPlus, LogIn, Clock } from 'lucide-react';
import { translations } from '../lib/translations';

export const AffiliateDashboard: React.FC = () => {
  const {
    affiliates,
    orders,
    currentAffiliate,
    registerAffiliate,
    loginAffiliate,
    logoutAffiliate,
    language
  } = useAppState();

  // Switch between Login and Signup modes
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  // Login variables
  const [loginCode, setLoginCode] = useState('');
  const [loginErr, setLoginErr] = useState('');

  // Signup variables
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpWhatsApp, setSignUpWhatsApp] = useState('');
  const [signUpCode, setSignUpCode] = useState('');
  const [signUpErr, setSignUpErr] = useState('');

  // UI status trackers
  const [copiedLink, setCopiedLink] = useState(false);

  // Authentication handles
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr('');
    const res = loginAffiliate(loginCode);
    if (!res.success) {
      setLoginErr(res.error || 'Authentication failed');
    } else {
      setLoginCode('');
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpErr('');

    if (!signUpName || !signUpEmail || !signUpWhatsApp || !signUpCode) {
      setSignUpErr(language === 'ms' ? 'Semua maklumat pendaftaran wajib diisi.' : 'All registration fields are required.');
      return;
    }

    const res = registerAffiliate(signUpName, signUpEmail, signUpWhatsApp, signUpCode);
    if (!res.success) {
      setSignUpErr(res.error || 'Failed to register affiliate');
    } else {
      // blank form states
      setSignUpName('');
      setSignUpEmail('');
      setSignUpWhatsApp('');
      setSignUpCode('');
    }
  };

  // If a session exists, render the comprehensive KPI metrics panel
  if (currentAffiliate) {
    const affiliateOrders = orders.filter(
      o => o.affiliateId === currentAffiliate.id && o.paymentStatus === 'Paid'
    );

    // Calculate dynamic commission statistics from verified orders
    const unpaidCommissions = affiliateOrders
      .filter(o => !o.commissionPaid)
      .reduce((sum, o) => sum + (o.affiliateCommission || 0), 0);

    const paidCommissions = affiliateOrders
      .filter(o => o.commissionPaid)
      .reduce((sum, o) => sum + (o.affiliateCommission || 0), 0);

    // Build unique sharing link matching the AI Studio development server hosting URL.
    const referralUrl = `${window.location.origin}/?ref=${currentAffiliate.code}`;

    const handleCopyLink = () => {
      navigator.clipboard.writeText(referralUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    };

    // Calculate progression details
    const nextTierConfig = (sold: number) => {
      if (sold <= 50) {
        return { next: 'Silver', remaining: 51 - sold, rate: '15%', target: 51 };
      } else if (sold <= 200) {
        return { next: 'Gold', remaining: 201 - sold, rate: '20%', target: 201 };
      }
      return null;
    };

    const nextTier = nextTierConfig(currentAffiliate.unitsSold);
    const progressPercent = nextTier 
      ? Math.min(100, (currentAffiliate.unitsSold / nextTier.target) * 100) 
      : 100;

    return (
      <div id="affiliate-portal-dashboard" className="space-y-8 animate-fade-in">
        {/* Profile Card & Copy Link rail */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#1580c2] to-blue-400 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-blue-500/10">
              {currentAffiliate.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans text-lg font-bold text-gray-950">{currentAffiliate.name}</h3>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  currentAffiliate.tier === 'Gold' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                  currentAffiliate.tier === 'Silver' ? 'bg-slate-100 text-slate-800 border border-slate-200' :
                  'bg-orange-50 text-orange-850 border border-orange-100'
                }`}>
                  {currentAffiliate.tier} {translations.agentBadge[language]}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">{currentAffiliate.email} • {currentAffiliate.whatsapp}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            {/* Direct Copy Link field block */}
            <div className="flex-1 sm:flex-initial flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <span className="font-mono text-xs font-semibold text-gray-500 truncate max-w-[200px] sm:max-w-xs">{referralUrl}</span>
              <button
                onClick={handleCopyLink}
                className="ml-3 p-1.5 rounded-lg text-gray-400 hover:text-[#1580c2] hover:bg-white transition-all duration-150 cursor-pointer"
                title="Copy Affiliate Url"
              >
                {copiedLink ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            <button
              onClick={logoutAffiliate}
              className="flex items-center justify-center gap-1.5 px-4 h-[42px] border border-gray-200 text-gray-600 hover:text-red-500 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer"
            >
              <LogOut className="h-4 w-4" /> {translations.signOutBtn[language]}
            </button>
          </div>
        </div>

        {/* Dynamic Tier Progression Tracker */}
        <div className="bg-gradient-to-br from-amber-50/60 to-amber-50/20 border border-amber-100 p-6 md:p-8 rounded-3xl space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-amber-800">
                {translations.promotionTrackerTitle[language]}
              </p>
              <h4 className="text-lg font-extrabold text-[#1580c2] font-sans tracking-tight mt-1">
                {translations.currentLevelText[language]}: <span className="text-amber-600">{currentAffiliate.tier}</span> ({currentAffiliate.tier === 'Gold' ? '20%' : currentAffiliate.tier === 'Silver' ? '15%' : '10%'} {translations.commissionText[language]})
              </h4>
            </div>
            <div className="text-right">
              <span className="text-xs font-extrabold text-amber-900 bg-amber-100 border border-amber-200 px-3 py-1 rounded-full">
                {translations.referredUnitsLabel[language].replace('{count}', String(currentAffiliate.unitsSold))}
              </span>
            </div>
          </div>

          {/* Visual Progress Slider bar */}
          <div className="space-y-2">
            <div className="relative h-3 w-full bg-amber-200/40 rounded-full overflow-hidden border border-amber-200/60">
              <div
                style={{ width: `${progressPercent}%` }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
              />
            </div>
            <div className="flex justify-between text-[11px] font-bold text-gray-500">
              <span>Bronze (10%)</span>
              <span className="text-gray-400">50 {translations.unitsText[language]}</span>
              <span>Silver (15%)</span>
              <span className="text-gray-400">200 {translations.unitsText[language]}</span>
              <span>Gold (20%)</span>
            </div>
          </div>

          {nextTier ? (
            <p className="text-xs text-amber-950 font-medium">
              🐝 {translations.keepGoingText[language].replace('{remaining}', String(nextTier.remaining)).replace('{next}', nextTier.next).replace('{rate}', nextTier.rate)}
            </p>
          ) : (
            <p className="text-xs text-green-700 font-bold">
              {translations.eliteStatusAchieved[language]}
            </p>
          )}
        </div>

        {/* Sales Statistics KPI grid */}
        <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-xs">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{translations.grossSalesReferred[language]}</p>
            <p className="text-xl font-black text-gray-900 font-sans tracking-tight mt-1">
              RM {currentAffiliate.lifetimeSales.toFixed(2)}
            </p>
            <span className="text-[10px] text-green-600 font-bold mt-1 inline-block">{translations.referredPurchases[language]}</span>
          </div>

          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-xs">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{translations.totalCommissionsLabel[language]}</p>
            <p className="text-xl font-black text-[#1580c2] font-sans tracking-tight mt-1 animate-pulse">
              RM {currentAffiliate.lifetimeCommissions.toFixed(2)}
            </p>
            <span className="text-[10px] text-[#1580c2] font-bold mt-1 inline-block">{translations.tierRateMsg[language]}</span>
          </div>

          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-xs">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{translations.pendingPayoutsLabel[language]}</p>
            <p className="text-xl font-black text-amber-600 font-sans tracking-tight mt-1">
              RM {unpaidCommissions.toFixed(2)}
            </p>
            <span className="text-[10px] text-amber-500 font-bold mt-1 inline-block">{translations.processingVerification[language]}</span>
          </div>

          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-xs">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{translations.paidCommissionsLabel[language]}</p>
            <p className="text-xl font-black text-emerald-600 font-sans tracking-tight mt-1">
              RM {paidCommissions.toFixed(2)}
            </p>
            <span className="text-[10px] text-emerald-600 font-bold mt-1 inline-block">{translations.transferredToBank[language]}</span>
          </div>
        </div>

        {/* Referred Orders Table */}
         <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs">
          <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <h4 className="font-sans text-sm font-extrabold text-gray-900 uppercase tracking-wider">
              {translations.referredHistoryTitle[language].replace('{count}', String(affiliateOrders.length))}
            </h4>
            <span className="font-mono text-[10px] text-gray-500">{translations.liveSyncLogs[language]}</span>
          </div>

          {affiliateOrders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Clock className="mx-auto h-8 w-8 text-gray-300 mb-2 animate-pulse" />
              <p className="text-sm font-bold text-gray-800">{translations.noReferredOrders[language]}</p>
              <p className="text-xs text-gray-500 mt-1">{translations.shareRefCodeMsg[language]}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead className="bg-gray-50/60 font-bold text-gray-400 border-b border-gray-50 select-none">
                  <tr>
                    <th className="px-6 py-3">{translations.tableOrderId[language]}</th>
                    <th className="px-6 py-3">{translations.tableClientName[language]}</th>
                    <th className="px-6 py-3">{translations.tableDate[language]}</th>
                    <th className="px-6 py-3 text-center">{translations.tableBottles[language]}</th>
                    <th className="px-6 py-3">{translations.tableSubtotal[language]}</th>
                    <th className="px-6 py-3">{translations.tableCommission[language]}</th>
                    <th className="px-6 py-3">{translations.tableStatus[language]}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
                  {affiliateOrders.map(ord => {
                    const commissionPart = ord.affiliateCommission || 0;
                    const itemsQty = ord.items.reduce((sum, item) => sum + item.quantity, 0);

                    return (
                      <tr key={ord.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-mono font-bold text-gray-900 uppercase">{ord.id}</td>
                        <td className="px-6 py-4 text-gray-950 font-bold">{ord.customerName}</td>
                        <td className="px-6 py-4 text-gray-500">{new Date(ord.createdAt).toISOString().split('T')[0]}</td>
                        <td className="px-6 py-4 text-center text-gray-900 font-bold">{itemsQty}</td>
                        <td className="px-6 py-4 font-bold">RM {ord.total.toFixed(2)}</td>
                        <td className="px-6 py-4 font-extrabold text-[#1580c2]">RM {commissionPart.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          {ord.commissionPaid ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                              {translations.statusPaidOut[language]}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                              {translations.statusPendingPayout[language]}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dual Auth Login / Register view if session empty
  return (
    <div id="affiliate-portal-auth" className="max-w-md mx-auto bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xl shadow-blue-500/5 animate-fade-in my-8">
      {/* Switch Header tabs */}
      <div className="grid grid-cols-2 border-b border-gray-100 bg-gray-50/80">
        <button
          onClick={() => {
            setAuthMode('signup');
            setSignUpErr('');
          }}
          className={`py-4 text-xs font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            authMode === 'signup'
              ? 'bg-white border-b-2 border-[#1580c2] text-[#1580c2]'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <UserPlus className="h-4 w-4" /> {translations.agentSelfSignup[language]}
        </button>
        <button
          onClick={() => {
            setAuthMode('login');
            setLoginErr('');
          }}
          className={`py-4 text-xs font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            authMode === 'login'
              ? 'bg-white border-b-2 border-[#1580c2] text-[#1580c2]'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <LogIn className="h-4 w-4" /> {translations.signInHub[language]}
        </button>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="font-sans text-xl font-bold tracking-tight text-gray-900">
            {authMode === 'signup' ? translations.startEarningTitle[language] : translations.welcomeBackAgent[language]}
          </h2>
          <p className="text-xs text-gray-500 mt-1 leading-normal">
            {authMode === 'signup' ? translations.signupPitch[language] : translations.signInPitch[language]}
          </p>
        </div>

        {authMode === 'signup' ? (
          <form onSubmit={handleSignUp} className="space-y-4">
            {signUpErr && (
              <div className="bg-red-50 text-red-700 border border-red-150 p-3 rounded-xl text-xs font-bold flex gap-1.5">
                <span>⚠️</span> <p className="leading-snug">{signUpErr}</p>
              </div>
            )}

            <div className="space-y-3.5">
              <label className="block">
                <span className="text-xs font-semibold text-gray-500 block mb-1">{translations.fullRepName[language]}</span>
                <input
                  required
                  type="text"
                  placeholder="E.g. Hazim Roslan"
                  value={signUpName}
                  onChange={e => setSignUpName(e.target.value)}
                  className="w-full text-base sm:text-xs font-medium h-12 px-4 border border-gray-200 rounded-xl focus:border-[#1580c2] outline-none shadow-xs bg-white"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-gray-500 block mb-1">{translations.emailRepInput[language]}</span>
                <input
                  required
                  type="email"
                  placeholder="E.g. hazim@example.my"
                  value={signUpEmail}
                  onChange={e => setSignUpEmail(e.target.value)}
                  className="w-full text-base sm:text-xs font-medium h-12 px-4 border border-gray-200 rounded-xl focus:border-[#1580c2] outline-none shadow-xs bg-white"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-gray-500 block mb-1">{translations.whatsappRepInput[language]}</span>
                <input
                  required
                  type="tel"
                  placeholder="E.g. +60134567890"
                  value={signUpWhatsApp}
                  onChange={e => setSignUpWhatsApp(e.target.value)}
                  className="w-full text-base sm:text-xs font-medium h-12 px-4 border border-gray-200 rounded-xl focus:border-[#1580c2] outline-none shadow-xs bg-white"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-gray-500 block mb-1">{translations.desiredRepCode[language]}</span>
                <input
                  required
                  type="text"
                  placeholder="E.g. HAZIM10 (Alphanumeric only)"
                  value={signUpCode}
                  onChange={e => setSignUpCode(e.target.value)}
                  className="w-full text-base sm:text-xs font-black px-4 h-12 border border-gray-200 rounded-xl focus:border-[#1580c2] outline-none uppercase tracking-widest shadow-xs bg-white"
                />
                <span className="text-[10px] text-gray-400 block mt-1">
                  {translations.repCodeHelp[language]}
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-[#1580c2] hover:bg-blue-600 text-white h-12 rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {translations.signUpNowBtn[language]} <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {loginErr && (
              <div className="bg-red-50 text-red-700 border border-red-150 p-3 rounded-xl text-xs font-bold leading-normal">
                {loginErr}
              </div>
            )}

            <label className="block">
              <span className="text-xs font-semibold text-gray-500 block mb-3">
                {translations.repCodeLabel[language]}
              </span>
              <input
                required
                type="text"
                placeholder="ENTER YOUR REGISTERED CODE E.G. SARAH15"
                value={loginCode}
                onChange={e => setLoginCode(e.target.value)}
                className="w-full text-base sm:text-xs font-black px-4 h-12 border border-gray-200 rounded-xl focus:border-[#1580c2] outline-none uppercase tracking-widest text-center shadow-xs bg-white"
              />
            </label>

            <button
              type="submit"
              className="w-full bg-[#1580c2] hover:bg-blue-600 text-white h-12 rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {translations.enterDashboardBtn[language]} <ArrowRight className="h-4.5 w-4.5" />
            </button>

            {/* Quick Demo Assist options */}
            <div className="border border-dashed border-gray-200 rounded-2xl p-4 bg-gray-50 space-y-2.5">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
                {translations.quickDevSignIn[language]}
              </span>
              <div className="grid grid-cols-3 gap-2.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setLoginCode('AHMAD10');
                    setLoginErr('');
                  }}
                  className="bg-white hover:bg-gray-100 border border-gray-200 h-10 flex items-center justify-center rounded-xl font-mono text-center cursor-pointer active:scale-95"
                >
                  AHMAD10
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginCode('SARAH15');
                    setLoginErr('');
                  }}
                  className="bg-white hover:bg-gray-100 border border-gray-200 h-10 flex items-center justify-center rounded-xl font-mono text-center cursor-pointer active:scale-95"
                >
                  SARAH15
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginCode('KAMAL20');
                    setLoginErr('');
                  }}
                  className="bg-white hover:bg-gray-100 border border-gray-200 h-10 flex items-center justify-center rounded-xl font-mono text-center cursor-pointer active:scale-95"
                >
                  KAMAL20
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
