/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { ShieldCheck, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AdminLoginWindowProps {
  onSuccess: () => void;
}

export const AdminLoginWindow: React.FC<AdminLoginWindowProps> = ({ onSuccess }) => {
  const { login, setPassword, logout } = useAppState();

  const [email, setEmail] = useState('');
  const [password, setPasswordValue] = useState('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);

  // First-login password claim flow, for admin accounts created before password auth existed
  const [claimAccount, setClaimAccount] = useState<{ id: string; email: string } | null>(null);
  const [claimPassword, setClaimPassword] = useState('');
  const [claimConfirmPassword, setClaimConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setSuccessStatus(null);

    if (!email || !password) {
      setErrorStatus('Email and password are required.');
      return;
    }

    try {
      const res = await login(email, password);
      if (res.success) {
        if (res.user?.userType !== 'admin') {
          logout();
          setErrorStatus('This portal is restricted to HQ administrator accounts.');
          return;
        }
        setSuccessStatus('Welcome back, Admin!');
        setTimeout(() => onSuccess(), 800);
      } else if (res.needsPasswordSetup && res.user) {
        if (res.user.userType !== 'admin') {
          setErrorStatus('This portal is restricted to HQ administrator accounts.');
          return;
        }
        setClaimAccount({ id: res.user.id, email: res.user.email });
      } else {
        setErrorStatus(res.error || 'Invalid email or password.');
      }
    } catch (err: any) {
      setErrorStatus(err.message || 'An unknown incident occurred.');
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    if (!claimAccount) return;

    if (claimPassword.length < 6) return setErrorStatus('Password must be at least 6 characters.');
    if (claimPassword !== claimConfirmPassword) return setErrorStatus('Passwords do not match.');

    try {
      const res = await setPassword(claimAccount.id, claimPassword);
      if (res.success) {
        setSuccessStatus('Password set! Signing you in...');
        setTimeout(() => onSuccess(), 800);
      } else {
        setErrorStatus(res.error || 'Failed to set password.');
      }
    } catch (err: any) {
      setErrorStatus(err.message || 'An unknown incident occurred.');
    }
  };

  if (claimAccount) {
    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 max-w-sm mx-auto">
        <div className="bg-gradient-to-r from-slate-900 to-purple-950 px-6 py-7 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-purple-300" />
            <h2 className="font-sans text-lg font-bold tracking-tight">Set Admin Password</h2>
          </div>
          <p className="font-sans text-xs text-purple-200 mt-1">This admin account has no password yet.</p>
        </div>

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

          <div className="bg-purple-50 text-purple-900 border border-purple-100 p-3 rounded-lg text-xs">
            No password is set yet for <strong>{claimAccount.email}</strong>. Choose one now to secure this admin account.
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
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-purple-900 hover:bg-purple-950 text-white py-2.5 px-4 rounded-xl font-sans font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
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
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 max-w-sm mx-auto">
      <div className="bg-gradient-to-r from-slate-900 to-purple-950 px-6 py-7 text-white">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-purple-300" />
          <h2 className="font-sans text-lg font-bold tracking-tight">HQ Admin Access</h2>
        </div>
        <p className="font-sans text-xs text-purple-200 mt-1">Restricted to authorized administrator accounts only.</p>
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

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Admin Email</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400">
              <Mail className="h-4 w-4" />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.my"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
              placeholder="Enter your password"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-purple-900 hover:bg-purple-950 text-white py-2.5 px-4 rounded-xl font-sans font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
        >
          <ShieldCheck className="h-4 w-4" />
          Validate HQ Credentials
        </button>
      </form>
    </div>
  );
};
