/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { TierType } from '../types';
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  FileText, 
  Briefcase, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  CreditCard, 
  MapPin, 
  HelpCircle,
  TrendingUp,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';

interface AuthWindowProps {
  onSuccess: () => void;
  initialMode?: 'login' | 'signup' | 'affiliate' | 'agent';
}

export const validateMalaysianIC = (ic: string): boolean => {
  const clean = ic.replace(/-/g, '');
  if (clean.length !== 12) return false;
  if (!/^\d{12}$/.test(clean)) return false;
  
  // Check date validity (YYMMDD)
  const month = parseInt(clean.substring(2, 4));
  const day = parseInt(clean.substring(4, 6));
  
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  return true;
};

export const AuthWindow: React.FC<AuthWindowProps> = ({ onSuccess, initialMode = 'login' }) => {
  const { login, setPassword, registerCustomer, registerAffiliateEx, registerAgentEx } = useAppState();
  const [mode, setMode] = useState<'login' | 'signup' | 'affiliate' | 'agent'>(initialMode);

  // Alert logs
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);

  // Basic Fields
  const [email, setEmail] = useState('');
  const [password, setPasswordValue] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [icNumber, setIcNumber] = useState('');

  // First-login password claim flow, for accounts that predate password auth (e.g. admin-created accounts)
  const [claimAccount, setClaimAccount] = useState<{ id: string; email: string } | null>(null);
  const [claimPassword, setClaimPassword] = useState('');
  const [claimConfirmPassword, setClaimConfirmPassword] = useState('');
  
  // Extra Fields for Affiliates & Agents
  const [whatsapp, setWhatsapp] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [bankName, setBankName] = useState('Maybank');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankHolderName, setBankHolderName] = useState('');
  
  // Agent exclusive values
  const [selectedAgentTier, setSelectedAgentTier] = useState<TierType>('Bronze');

  // Submit operations
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setSuccessStatus(null);

    try {
      if (mode === 'login') {
        if (!email || !password) return setErrorStatus('Email and password are required.');
        const res = await login(email, password);
        if (res.success) {
          setSuccessStatus(res.user?.userType === 'admin' ? 'Welcome back Admin!' : 'Successfully signed in!');
          setTimeout(() => {
            onSuccess();
          }, 1000);
        } else if (res.needsPasswordSetup && res.user) {
          setClaimAccount({ id: res.user.id, email: res.user.email });
        } else {
          setErrorStatus(res.error || 'Invalid email or password.');
        }
      }

      else if (mode === 'signup') {
        if (!fullName || !email || !password) {
          return setErrorStatus('Full name, email and password are required.');
        }
        if (password.length < 6) return setErrorStatus('Password must be at least 6 characters.');
        if (password !== confirmPassword) return setErrorStatus('Passwords do not match.');
        const res = await registerCustomer(fullName, email, phone, password);
        if (res.success) {
          setSuccessStatus('Customer profile registered successfully!');
          setTimeout(() => {
            onSuccess();
          }, 1000);
        } else {
          setErrorStatus(res.error || 'Failed registration.');
        }
      }

      else if (mode === 'affiliate') {
        if (!fullName || !email || !icNumber || !whatsapp || !fullAddress || !bankAccountNo || !password) {
          return setErrorStatus('Please fill in all required fields.');
        }
        if (password.length < 6) return setErrorStatus('Password must be at least 6 characters.');
        if (password !== confirmPassword) return setErrorStatus('Passwords do not match.');
        if (!validateMalaysianIC(icNumber)) {
          return setErrorStatus('Invalid Malaysian IC format. Must be YYMMDD-XX-XXXX (12 digits total).');
        }

        const res = await registerAffiliateEx({
          name: fullName,
          email,
          ic: icNumber,
          whatsapp,
          address: fullAddress,
          bankName,
          bankNo: bankAccountNo,
          holderName: bankHolderName || fullName,
          password
        });

        if (res.success) {
          setSuccessStatus('Congratulations! Your Tualang plus Affiliate ID is registered.');
          setTimeout(() => {
            onSuccess();
          }, 1200);
        } else {
          setErrorStatus(res.error || 'Unable to register affiliate account.');
        }
      }

      else if (mode === 'agent') {
        if (!fullName || !email || !icNumber || !whatsapp || !fullAddress || !bankAccountNo || !password) {
          return setErrorStatus('Please fill in all core fields to apply.');
        }
        if (password.length < 6) return setErrorStatus('Password must be at least 6 characters.');
        if (password !== confirmPassword) return setErrorStatus('Passwords do not match.');
        if (!validateMalaysianIC(icNumber)) {
          return setErrorStatus('Invalid MyKAD format verification failed.');
        }

        const res = await registerAgentEx({
          name: fullName,
          email,
          ic: icNumber,
          whatsapp,
          address: fullAddress,
          bankName,
          bankNo: bankAccountNo,
          holderName: bankHolderName || fullName,
          tier: selectedAgentTier,
          password
        });

        if (res.success) {
          setSuccessStatus(`Agent profile registered successfully at Tier ${selectedAgentTier}! Stock has been added to your log.`);
          setTimeout(() => {
            onSuccess();
          }, 1400);
        } else {
          setErrorStatus(res.error || 'Registration failed.');
        }
      }
    } catch (err: any) {
      setErrorStatus(err.message || 'An unknown incident occurred.');
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setSuccessStatus(null);
    if (!claimAccount) return;

    if (claimPassword.length < 6) return setErrorStatus('Password must be at least 6 characters.');
    if (claimPassword !== claimConfirmPassword) return setErrorStatus('Passwords do not match.');

    try {
      const res = await setPassword(claimAccount.id, claimPassword);
      if (res.success) {
        setSuccessStatus('Password set! Signing you in...');
        setTimeout(() => {
          onSuccess();
        }, 800);
      } else {
        setErrorStatus(res.error || 'Failed to set password.');
      }
    } catch (err: any) {
      setErrorStatus(err.message || 'An unknown incident occurred.');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 max-w-lg mx-auto">
      {/* Header design config */}
      <div className="bg-gradient-to-r from-blue-700 to-[#1580c2] px-6 py-8 text-white relative">
        <div className="absolute right-4 top-4 opacity-15 pointer-events-none">
          <Sparkles className="h-20 w-20" />
        </div>
        <h2 id="auth-title" className="font-sans text-2xl font-bold tracking-tight">
          {claimAccount && 'Set Your Password'}
          {!claimAccount && mode === 'login' && 'Sign In Portal'}
          {!claimAccount && mode === 'signup' && 'Customer Account Registration'}
          {!claimAccount && mode === 'affiliate' && 'Register Affiliate Account'}
          {!claimAccount && mode === 'agent' && 'Apply as Official Agent'}
        </h2>
        <p className="font-sans text-xs text-blue-105 mt-1">
          {claimAccount && 'This account has no password yet — set one to continue.'}
          {!claimAccount && mode === 'login' && 'Access your personalized Tualang Plus system dashboard'}
          {!claimAccount && mode === 'signup' && 'Create a simple retail shopper profile'}
          {!claimAccount && mode === 'affiliate' && 'Earn dynamic lifetime commissions through automated sharing links'}
          {!claimAccount && mode === 'agent' && 'Access tiered bulk pricing discounts with live micro-inventories'}
        </p>

        {/* Dynamic Navigation Selectors — two-step: Sign In vs Create Account, then account type */}
        {!claimAccount && (
          <div className="mt-6 space-y-2.5">
            <div className="grid grid-cols-2 gap-1 bg-white/10 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => { setMode('login'); setErrorStatus(null); }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${mode === 'login' ? 'bg-white text-blue-700 shadow-sm' : 'text-white hover:bg-white/10'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { if (mode === 'login') setMode('signup'); setErrorStatus(null); }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${mode !== 'login' ? 'bg-white text-blue-700 shadow-sm' : 'text-white hover:bg-white/10'}`}
              >
                Create Account
              </button>
            </div>

            {mode !== 'login' && (
              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold uppercase tracking-wide animate-fade-in">
                <button
                  onClick={() => { setMode('signup'); setErrorStatus(null); }}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${mode === 'signup' ? 'bg-white/25 text-white ring-1 ring-white/40' : 'bg-white/5 text-blue-100 hover:bg-white/15'}`}
                >
                  Customer
                </button>
                <button
                  onClick={() => { setMode('affiliate'); setErrorStatus(null); }}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${mode === 'affiliate' ? 'bg-white/25 text-white ring-1 ring-white/40' : 'bg-white/5 text-blue-100 hover:bg-white/15'}`}
                >
                  Affiliate
                </button>
                <button
                  onClick={() => { setMode('agent'); setErrorStatus(null); }}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${mode === 'agent' ? 'bg-white/25 text-white ring-1 ring-white/40' : 'bg-white/5 text-blue-100 hover:bg-white/15'}`}
                >
                  Agent
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {claimAccount ? (
        <form onSubmit={handleClaimSubmit} className="p-6 space-y-4">
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

          <div className="bg-blue-50 text-blue-900 border border-blue-100 p-3 rounded-lg text-xs">
            No password is set yet for <strong>{claimAccount.email}</strong>. Choose one now to secure this account going forward.
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                value={claimPassword}
                onChange={(e) => setClaimPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                value={claimConfirmPassword}
                onChange={(e) => setClaimConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-4 bg-[#1580c2] hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl font-sans font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="h-4 w-4" />
            Set Password & Sign In
          </button>

          <button
            type="button"
            onClick={() => {
              setClaimAccount(null);
              setClaimPassword('');
              setClaimConfirmPassword('');
              setErrorStatus(null);
              setSuccessStatus(null);
            }}
            className="w-full text-[10px] text-center text-gray-400 hover:text-gray-600"
          >
            Cancel
          </button>
        </form>
      ) : (
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Alerts */}
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

        {/* Basic Credentials */}
        <div className="space-y-3">
          {mode !== 'login' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name (per MyKAD)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <User className="h-4 w-4" />
                </span>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ahmad bin Rosli" 
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. user@example.my"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPasswordValue(e.target.value)}
                placeholder={mode === 'login' ? 'Enter your password' : 'At least 6 characters'}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {mode !== 'login' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number (optional)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <Phone className="h-4 w-4" />
                </span>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +60124445555" 
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Affiliate & Agent Common Registration extensions */}
        {(mode === 'affiliate' || mode === 'agent') && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-blue-600" />
              Malaysian National Identity Verification (MyKAD)
            </h3>

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
                  onChange={(e) => {
                    let val = e.target.value.replace(/[^\d-]/g, '');
                    setIcNumber(val);
                  }}
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

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Delivery Address (for raw Honey logistics)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <MapPin className="h-4 w-4" />
                </span>
                <textarea 
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder="No, Street, Taman/Kondominium, City, State..." 
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[50px]"
                  required
                />
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1.5 mb-2">
                <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                Affiliated Bank Coordinates (For Commission Payouts)
              </h3>

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
                    required
                  />
                </div>
              </div>

              <div className="mt-2">
                <label className="block text-[10px] font-semibold text-gray-700 mb-1">Bank Account Holder (must match MyKAD name)</label>
                <input 
                  type="text"
                  value={bankHolderName}
                  onChange={(e) => setBankHolderName(e.target.value)}
                  placeholder="Leave empty to auto-use Full Name"
                  className="w-full py-2 px-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-[9px] text-amber-600 mt-1 block font-medium">
                  Note: verification transfer test requires name-account conformity.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Agent Exclusive Tier Settings */}
        {mode === 'agent' && (
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

        {/* Action Button */}
        <button
          type="submit"
          className="w-full mt-4 bg-[#1580c2] hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl font-sans font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
        >
          <ShieldCheck className="h-4 w-4" />
          {mode === 'login' && 'Validate Credentials & Sign In'}
          {mode === 'signup' && 'Create Free Shopper Profile'}
          {mode === 'affiliate' && 'Register Affiliate Account'}
          {mode === 'agent' && `Confirm & Initiate RM ${selectedAgentTier === 'Gold' ? '15,000' : selectedAgentTier === 'Silver' ? '5,000' : '1,000'} Payment`}
        </button>

        {mode === 'login' ? (
          <p className="text-[10px] text-center text-gray-400 mt-2">
            No registered credentials yet? Click on <strong className="text-blue-600 cursor-pointer" onClick={() => setMode('signup')}>Create Account</strong> above to sign up as a customer, affiliate, or agent.
          </p>
        ) : (
          <p className="text-[10px] text-center text-gray-400 mt-2">
            Already registered? Click on <strong className="text-blue-600 cursor-pointer" onClick={() => setMode('login')}>Sign In</strong> to load your session.
          </p>
        )}
      </form>
      )}
    </div>
  );
};
