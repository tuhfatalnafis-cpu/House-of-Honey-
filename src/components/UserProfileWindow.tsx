/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { UserAddress, BankAccount } from '../types';
import { 
  User, 
  MapPin, 
  CreditCard, 
  Plus, 
  Trash2, 
  Check, 
  Building2, 
  Sparkles, 
  X, 
  LogOut,
  Mail,
  Phone,
  HelpCircle,
  FileText
} from 'lucide-react';

export const UserProfileWindow: React.FC = () => {
  const { 
    currentUserAccount, 
    currentUserProfile, 
    addresses, 
    bankAccounts, 
    addAddress, 
    editAddress, 
    deleteAddress, 
    addBankAccount, 
    editBankAccount, 
    logout 
  } = useAppState();

  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);

  // Address Form state
  const [addrType, setAddrType] = useState<'billing' | 'delivery' | 'both'>('delivery');
  const [fullAddress, setFullAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Pahang');
  const [isAddrDefault, setIsAddrDefault] = useState(true);

  // Bank Form state
  const [bankName, setBankName] = useState('Maybank');
  const [bankAcctNo, setBankAcctNo] = useState('');
  const [holderName, setHolderName] = useState('');
  const [acctType, setAcctType] = useState<'savings' | 'current'>('savings');

  if (!currentUserAccount) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm text-center border border-gray-100 max-w-md mx-auto">
        <HelpCircle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
        <h3 className="font-sans text-base font-bold text-gray-900">Access Restricted</h3>
        <p className="font-sans text-xs text-gray-500 mt-1 mb-4">Please log in to manage your customer delivery profiles and bank records.</p>
      </div>
    );
  }

  // Filter lists for current logged in user
  const myAddresses = addresses.filter(a => a.userId === currentUserAccount.id);
  const myBankAccounts = bankAccounts.filter(b => b.userId === currentUserAccount.id);

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullAddress.trim()) return;

    addAddress({
      userId: currentUserAccount.id,
      addressType: addrType,
      fullAddress: fullAddress.trim(),
      postalCode,
      city,
      state,
      country: 'Malaysia',
      isDefault: isAddrDefault
    });

    // Reset
    setFullAddress('');
    setPostalCode('');
    setCity('');
    setAddressModalOpen(false);
  };

  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankAcctNo.trim()) return;

    addBankAccount({
      userId: currentUserAccount.id,
      accountHolderName: holderName.trim() || currentUserProfile?.fullName || 'Valuable Reseller',
      bankName,
      accountNumber: bankAcctNo.trim(),
      accountType: acctType,
      isVerified: false,
      isDefault: true
    });

    setBankAcctNo('');
    setHolderName('');
    setBankModalOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Upper Profile Overview */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bg-blue-50/50 p-6 rounded-bl-3xl">
          <Sparkles className="h-10 w-10 text-blue-500/20" />
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-gradient-to-tr from-blue-600 to-[#1580c2] text-white rounded-2xl flex items-center justify-center font-sans font-bold text-xl uppercase shadow-md shrink-0">
              {currentUserProfile?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-sans text-lg font-bold text-gray-900">{currentUserProfile?.fullName || 'Valuable Guest'}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wider">
                  {currentUserAccount.userType}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5 flex items-center gap-1.5">
                <Mail className="h-3 w-3" /> {currentUserAccount.email}
              </p>
              {currentUserProfile?.icNumber && (
                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <FileText className="h-3 w-3 text-gray-400" />
                  MyKAD: {currentUserProfile.icNumber} {currentUserProfile.icVerified ? '(Verified)' : '(Pending manual approval)'}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-sans font-semibold text-xs px-3.5 py-2 rounded-xl transition-all"
          >
            <LogOut className="h-4 w-4" />
            Logout Account
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Adresses Container */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans text-sm font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              My Saved Addresses
            </h3>
            <button
              onClick={() => setAddressModalOpen(true)}
              className="flex items-center gap-1 bg-[#1580c2] hover:bg-blue-600 text-white font-sans font-semibold text-[10px] px-2.5 py-1.5 rounded-lg transition-all"
            >
              <Plus className="h-3 w-3" />
              Add New
            </button>
          </div>

          {myAddresses.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-gray-100 rounded-xl">
              <p className="text-xs text-gray-400">No registered delivery addresses yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myAddresses.map(addr => (
                <div key={addr.id} className={`p-3.5 rounded-xl border text-left transition-all relative ${addr.isDefault ? 'border-blue-500 bg-blue-50/20' : 'border-gray-150 bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-700 capitalize tracking-wide">
                      {addr.addressType}
                    </span>
                    {addr.isDefault && (
                      <span className="text-[10px] text-blue-700 font-bold flex items-center gap-0.5">
                        <Check className="h-3 w-3" /> Default Code
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-800 leading-relaxed mt-2">{addr.fullAddress}</p>
                  {(addr.city || addr.postalCode) && (
                    <p className="text-[10px] text-gray-500 mt-1">
                      {addr.postalCode} {addr.city}, {addr.state}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-gray-100/50 pt-2">
                    {!addr.isDefault ? (
                      <button 
                        onClick={() => editAddress(addr.id, { isDefault: true })}
                        className="text-[10px] text-blue-700 hover:underline font-semibold"
                      >
                        Set as Default
                      </button>
                    ) : <span />}
                    <button 
                      onClick={() => deleteAddress(addr.id)}
                      className="text-gray-400 hover:text-red-600 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bank Account Container */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans text-sm font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              Recipient Bank Accounts
            </h3>
            <button
              onClick={() => setBankModalOpen(true)}
              className="flex items-center gap-1 bg-[#1580c2] hover:bg-blue-600 text-white font-sans font-semibold text-[10px] px-2.5 py-1.5 rounded-lg transition-all"
            >
              <Plus className="h-3 w-3" />
              Link Bank
            </button>
          </div>

          {myBankAccounts.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-gray-100 rounded-xl">
              <p className="text-xs text-gray-400">No linked bank accounts found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myBankAccounts.map(bank => (
                <div key={bank.id} className={`p-4 rounded-xl border text-left transition-all ${bank.isVerified ? 'border-emerald-500 bg-emerald-50/10' : 'border-gray-150 bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      {bank.bankName}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${bank.isVerified ? 'bg-emerald-100 text-emerald-850' : 'bg-amber-100 text-amber-800'}`}>
                      {bank.isVerified ? 'Verified Payout' : 'Pending Verification'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Account: <span className="font-mono text-gray-900 font-bold">•••• •••• {bank.accountNumber.slice(-4)}</span></p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Holder: {bank.accountHolderName}</p>
                  {!bank.isVerified && (
                    <div className="mt-3 bg-amber-50 p-2 rounded-lg border border-amber-100 text-[9px] text-amber-850 leading-relaxed">
                      HQ manual test deposit (RM 0.01) is active. Verified updates trigger within 24h.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Address modal form */}
      {addressModalOpen && (
        <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative border border-gray-100 space-y-4 shadow-xl">
            <button 
              onClick={() => setAddressModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="font-sans text-sm font-bold text-gray-900">Add saved addresses</h3>
            
            <form onSubmit={handleAddressSubmit} className="space-y-3 text-left">
              <div>
                <label className="block text-[10px] font-semibold text-gray-700 mb-1">Address Label</label>
                <div className="flex gap-2 text-xs">
                  {['delivery', 'billing', 'both'].map((t: any) => (
                    <button
                      type="button" key={t}
                      onClick={() => setAddrType(t)}
                      className={`px-3 py-1.5 rounded-lg border capitalize font-semibold transition-all ${addrType === t ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-700 mb-1">Full Address Description</label>
                <textarea
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder="e.g. Unit 34-01, Sky Block, Residensi Merak, Jalan Damai"
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 min-h-[60px]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 mb-1">Postal Code</label>
                  <input
                    type="text" value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="e.g. 50450"
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 mb-1">City</label>
                  <input
                    type="text" value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Kuala Lumpur"
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 mb-1">State</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg"
                  >
                    {['Pahang', 'Selangor', 'Kuala Lumpur', 'Penang', 'Johor', 'Sabah', 'Sarawak', 'Kelantan', 'Terengganu'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 mb-1">Country</label>
                  <input
                    type="text" value="Malaysia" disabled
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox" id="is_default_check"
                  checked={isAddrDefault}
                  onChange={(e) => setIsAddrDefault(e.target.checked)}
                  className="rounded text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="is_default_check" className="text-xs text-gray-600 font-medium">Set as primary default address</label>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1580c2] hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-bold mt-2 shadow-sm transition-all"
              >
                Save New Address Row
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bank link modal form */}
      {bankModalOpen && (
        <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative border border-gray-100 space-y-4 shadow-xl">
            <button 
              onClick={() => setBankModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="font-sans text-sm font-bold text-gray-900">Link Bank Account</h3>
            
            <form onSubmit={handleBankSubmit} className="space-y-3 text-left">
              <div>
                <label className="block text-[10px] font-semibold text-gray-700 mb-1">Select Bank</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg"
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
                  type="text" value={bankAcctNo}
                  onChange={(e) => setBankAcctNo(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="e.g. 16401123456"
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-700 mb-1">Holder Name (Match MyKAD identity)</label>
                <input
                  type="text" value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  placeholder="e.g. Ahmad bin Rosli"
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-700 mb-1">Account Type</label>
                <div className="flex gap-2">
                  {['savings', 'current'].map((t: any) => (
                    <button
                      type="button" key={t}
                      onClick={() => setAcctType(t)}
                      className={`px-3 py-1.5 rounded-lg border capitalize text-xs font-semibold ${acctType === t ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 p-2 rounded-lg border border-amber-100 text-[9px] text-amber-850 leading-relaxed">
                Notice: Accounts are set to 'Pending Verification' upon entry. Payouts require active approval from operations management.
              </div>

              <button
                type="submit"
                className="w-full bg-[#1580c2] hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-bold mt-2 shadow-sm transition-all"
              >
                Register Recipient Account
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
