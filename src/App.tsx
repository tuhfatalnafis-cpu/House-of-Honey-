/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AppProvider, useAppState } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { ProductCatalog } from './components/ProductCatalog';
import { AffiliateDashboard } from './components/AffiliateDashboard';
import { AdminOperations } from './components/AdminOperations';
import { UserProfileWindow } from './components/UserProfileWindow';
import { AgentDashboard } from './components/AgentDashboard';
import { AuthWindow } from './components/AuthWindow';
import { AdminLoginWindow } from './components/AdminLoginWindow';
import { UpgradeAccountWindow } from './components/UpgradeAccountWindow';
import { Cart } from './components/Cart';
import {
  Home,
  Search,
  ShoppingCart,
  User,
  Award,
  ShieldAlert,
  Package,
  MapPin,
  LogOut,
  ChevronRight,
  Sparkles
} from 'lucide-react';

// Admin sign-in is not linked anywhere in the public UI — reaching it requires this URL param,
// known only to admins (e.g. bookmarked as https://yoursite/?hqadmin=1).
const hasSecretAdminLink = () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('hqadmin');

// Set by server/routes/callback.js when redirecting a payer back from the payment gateway.
const hasCheckoutReturn = () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('checkout_result');

function MainLayout() {
  const [currentTab, setCurrentTab] = useState<'home' | 'search' | 'cart' | 'account'>(() => hasCheckoutReturn() ? 'cart' : hasSecretAdminLink() ? 'account' : 'home');
  const [activeSubPanel, setActiveSubPanel] = useState<'affiliate' | 'agent' | 'admin' | 'profile_editor' | null>(() => hasSecretAdminLink() ? 'admin' : null);

  const { 
    language, 
    currentUserAccount, 
    affiliates, 
    agents,
    logout,
    cart
  } = useAppState();

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const widthClass = activeSubPanel === 'admin' 
    ? 'max-w-7xl' 
    : (activeSubPanel === 'agent' || activeSubPanel === 'affiliate')
      ? 'max-w-5xl'
      : 'max-w-lg';

  // Resolve whether active email matches existing roles
  const activeAffiliateRecord = currentUserAccount 
    ? affiliates.find(aff => 
        (aff.userId && aff.userId === currentUserAccount.id) || 
        (aff.email && currentUserAccount.email && aff.email.toLowerCase() === currentUserAccount.email.toLowerCase())
      )
    : null;

  const activeAgentRecord = currentUserAccount
    ? agents.find(agt => agt.userId === currentUserAccount.id)
    : null;

  // Custom function to handle navigation and resetting deep views
  const handleTabChange = (tab: 'home' | 'search' | 'cart' | 'account') => {
    setCurrentTab(tab);
    setActiveSubPanel(null); // Reset deep pages on tab toggle
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToFromCatalog = (tab: 'home' | 'search' | 'cart' | 'account', subPanel: any = null) => {
    setCurrentTab(tab);
    setActiveSubPanel(subPanel);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col font-sans selection:bg-[#EE4D2D]/20 selection:text-[#EE4D2D] text-left">
      
      {/* 1. TOP NAV HEADER */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
        activeSubPanel={activeSubPanel}
        setActiveSubPanel={setActiveSubPanel}
      />

      {/* 2. MAIN SCROLLABLE CONTENT */}
      <main className={`flex-1 mx-auto w-full ${widthClass} px-4 pt-4 pb-20 sm:px-6 transition-all duration-300`}>
        
        {/* Dynamic Context Breadcrumb */}
        {activeSubPanel === null && (
          <div className="flex items-center space-x-1.5 text-[10px] font-mono font-bold tracking-widest text-[#EE4D2D] uppercase mb-4 select-none animate-fade-in bg-white/70 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-gray-150 justify-center">
            {currentTab === 'home' && (
              <>
                <span className="text-xs">🏠</span>
                <span>{language === 'ms' ? 'Laman Utama Madu Plus' : 'Madu Plus Home Experience'}</span>
              </>
            )}
            {currentTab === 'search' && (
              <>
                <Search className="h-3 w-3 text-[#EE4D2D]" />
                <span>{language === 'ms' ? 'Katalog Raw Hutan Pahang' : 'Pahang Hutan Woods Catalog'}</span>
              </>
            )}
            {currentTab === 'cart' && (
              <>
                <ShoppingCart className="h-3 w-3 text-[#EE4D2D]" />
                <span>{language === 'ms' ? 'Langkah Daftar & Bayar' : 'Verify Order details'}</span>
              </>
            )}
            {currentTab === 'account' && (
              <>
                <User className="h-3 w-3 text-[#EE4D2D]" />
                <span>{language === 'ms' ? 'Hab Komuniti Partner & Profil' : 'Partner Central Hub'}</span>
              </>
            )}
          </div>
        )}

        {/* 3. CORE SUB-VIEW DISPATCHER */}
        <div className="min-h-[420px] transition-all">
          
          {/* ================================== */}
          {/* TAB 1: HOME                        */}
          {/* ================================== */}
          {currentTab === 'home' && (
            <ProductCatalog mode="home" onNavigate={navigateToFromCatalog} />
          )}

          {/* ================================== */}
          {/* TAB 2: SEARCH CATALOG              */}
          {/* ================================== */}
          {currentTab === 'search' && (
            <ProductCatalog mode="search" onNavigate={navigateToFromCatalog} />
          )}

          {/* ================================== */}
          {/* TAB 3: IN-PAGE SHOPPING CART       */}
          {/* ================================== */}
          {currentTab === 'cart' && (
            <Cart isOpen={true} onClose={() => {}} inPage={true} />
          )}

          {/* ================================== */}
          {/* TAB 4: ACCOUNT OVERVIEW & PORTALS  */}
          {/* ================================== */}
          {currentTab === 'account' && (
            <>
              {activeSubPanel === null ? (
                // 4A: Main Account Dashboard list
                <div className="space-y-4 animate-fade-in text-left">
                  
                  {/* High-fidelity Shopee Profile Banner Card */}
                  <div className="rounded-xl border border-gray-150 bg-gradient-to-tr from-slate-900 to-slate-800 text-white p-5 shadow-xs relative overflow-hidden">
                    <div className="absolute right-[-15px] top-[-15px] text-7xl opacity-15 pointer-events-none">🍯</div>
                    
                    {currentUserAccount ? (
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-mono font-black text-amber-400 tracking-widest uppercase">
                            {language === 'ms' ? 'Akaun Berdaftar' : 'Verified Partner'}
                          </p>
                          <h3 className="font-sans text-sm font-black truncate max-w-[200px] text-white">
                            {currentUserAccount.email}
                          </h3>
                          <div className="flex gap-1 items-center pt-1">
                            <span className="text-[8.5px] bg-[#EE4D2D] text-white font-mono font-extrabold px-1.5 py-0.2 rounded uppercase">
                              {currentUserAccount.userType}
                            </span>
                            {activeAffiliateRecord && (
                              <span className="text-[8.5px] bg-indigo-600 text-white font-mono font-extrabold px-1.5 py-0.2 rounded uppercase">
                                Affiliate
                              </span>
                            )}
                            {activeAgentRecord && (
                              <span className="text-[8.5px] bg-teal-600 text-white font-mono font-extrabold px-1.5 py-0.2 rounded">
                                Agent ({activeAgentRecord.agentTier})
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            logout();
                            handleTabChange('home');
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 hover:text-red-300 transition-colors cursor-pointer shrink-0"
                          title={language === 'ms' ? 'Log Keluar' : 'Sign Out'}
                        >
                          <LogOut className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-[11px] text-gray-300">
                          {language === 'ms' 
                            ? 'Sila daftar masuk untuk mengakses alamat, urus akaun bank atau sertai rangkaian ejen / afiliat penjual madu Pahang.'
                            : 'Log in securely to save delivery addresses, register bank payouts, or build commercial commissions with us.'}
                        </p>
                        <div className="pt-1">
                          <button
                            onClick={() => {
                              // We open login view fallbacks within the tab
                              setActiveSubPanel('profile_editor');
                            }}
                            className="bg-yellow-400 hover:bg-yellow-350 text-slate-900 font-sans font-black text-xs px-5 py-2.5 rounded-lg cursor-pointer transition-transform active:scale-95 shadow-xs"
                          >
                            {language === 'ms' ? 'Log Masuk / Daftar' : 'Sign In Now'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Portal menus */}
                  <div className="space-y-1.5 bg-white border border-gray-150 rounded-xl p-3 shadow-2xs select-none">
                    <p className="text-[9.5px] font-black text-gray-400 tracking-wider uppercase px-2 pb-1.5 border-b border-gray-50">
                      {language === 'ms' ? 'Menu Pentadbiran & Profil' : 'Operations & Account settings'}
                    </p>

                    {/* Button 1: Addresses and Banks details */}
                    <button
                      onClick={() => setActiveSubPanel('profile_editor')}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-orange-50 text-[#EE4D2D] flex items-center justify-center">
                          <MapPin className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 group-hover:text-[#EE4D2D] transition-colors">
                            {language === 'ms' ? 'Alamat & Bank Saya' : 'My Addresses & Bank details'}
                          </p>
                          <p className="text-[10px] text-gray-400 leading-none mt-0.5">
                            {language === 'ms' ? 'Urus destinasi kurier & akaun simpanan' : 'Coordinate drop-offs & payment setups'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </button>

                    {/* Button 2: Affiliate Hub */}
                    <button
                      onClick={() => setActiveSubPanel('affiliate')}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <Award className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-gray-900 group-hover:text-[#EE4D2D] transition-colors">
                              {language === 'ms' ? 'Portal Rakan Afiliat' : 'Affiliate Partner Portal'}
                            </p>
                            {activeAffiliateRecord && (
                              <span className="text-[8px] bg-green-100 text-green-800 font-extrabold px-1 rounded uppercase">Aktif</span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 leading-none mt-0.5">
                            {language === 'ms' ? 'Komisen rujukan, kod unik & slip komisen' : 'Track referrals, unique codes & slip payouts'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </button>

                    {/* Button 3: Agent Hub */}
                    <button
                      onClick={() => setActiveSubPanel('agent')}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                          <Package className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-gray-900 group-hover:text-[#EE4D2D] transition-colors">
                              {language === 'ms' ? 'Rangkaian Ejen Reseller' : 'Reseller Agent System'}
                            </p>
                            {activeAgentRecord && (
                              <span className="text-[8px] bg-green-100 text-green-800 font-extrabold px-1 rounded uppercase">Active ({activeAgentRecord.agentTier})</span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 leading-none mt-0.5">
                            {language === 'ms' ? 'Pembelian borong murah & log stok simpanan' : 'Wholesale stocking & personal microstores'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </button>

                    {/* Button 4: HQ Operational Admin — only ever shown to accounts that are already admins.
                        Non-admins never see this exists; the only way in is the secret ?hqadmin=1 URL. */}
                    {currentUserAccount?.userType === 'admin' && (
                      <button
                        onClick={() => setActiveSubPanel('admin')}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                            <ShieldAlert className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-gray-900 group-hover:text-[#EE4D2D] transition-colors">
                                {language === 'ms' ? 'Operasi Admin HQ' : 'HQ Admin Operational'}
                              </p>
                              <span className="text-[7.5px] bg-red-100 text-red-800 font-black px-1 rounded uppercase">HQ ACCESS</span>
                            </div>
                            <p className="text-[10px] text-gray-400 leading-none mt-0.5">
                              {language === 'ms' ? 'Kelulusan kelayakan e-KYC bank & log pesanan' : 'Auditing, e-KYC verify & ledger settlements'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                      </button>
                    )}
                  </div>

                  {/* Quality Seal Assurance footer card */}
                  <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-200/50 text-left space-y-1">
                    <p className="text-xs font-bold text-[#EE4D2D] flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" /> Jaminan Keselamatan Madu Plus
                    </p>
                    <p className="text-[10.5px] text-slate-600 leading-normal">
                      Sesi log masuk disulitkan secara terbina bagi menjamin privasi butiran transaksi, akaun bank simpanan commission, dan dokumen identiti e-KYC anda.
                    </p>
                  </div>
                </div>
              ) : (
                // 4B: Render active subpanels with deep fallbacks
                <div className="animate-fade-in text-left">
                  
                  {/* Deep View: Profile editor */}
                  {activeSubPanel === 'profile_editor' && (
                    currentUserAccount ? (
                      <UserProfileWindow />
                    ) : (
                      <div className="max-w-md mx-auto py-4">
                        <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl mb-4 text-xs text-orange-950 font-semibold leading-relaxed">
                          ⚠️ Sila daftar masuk terlebih dahulu untuk mengakses pengurusan alamat penyerahan dan butiran akaun bank payout anda.
                        </div>
                        <AuthWindow onSuccess={() => setActiveSubPanel('profile_editor')} initialMode="login" />
                      </div>
                    )
                  )}

                  {/* Deep View: Affiliate Partner */}
                  {activeSubPanel === 'affiliate' && (
                    currentUserAccount ? (
                      activeAffiliateRecord ? (
                        <AffiliateDashboard />
                      ) : (
                        <div className="max-w-md mx-auto space-y-4">
                          <div className="bg-indigo-50 border border-indigo-100 p-4.5 rounded-xl text-xs text-indigo-950 space-y-1.5 leading-relaxed">
                            <p className="font-extrabold uppercase tracking-wider text-indigo-900 block">🏅 Pendaftaran Rakan Afiliat</p>
                            <p>
                              Daftar sebagai agen promosi berlesen! Kongsi kod sponsor anda sendiri, bantu pelanggan dapatkan madu tulen Pahang, & raih slab komisen 10% - 20% terus ke simpanan anda.
                            </p>
                          </div>
                          <UpgradeAccountWindow onSuccess={() => setActiveSubPanel('affiliate')} targetType="affiliate" />
                        </div>
                      )
                    ) : (
                      <div className="max-w-md mx-auto py-4">
                        <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-xl mb-4 text-xs text-indigo-950 font-bold">
                          🔑 Log masuk ke akaun Madu Plus anda untuk mula mendaftar pautan afiliat berbayar.
                        </div>
                        <AuthWindow onSuccess={() => setActiveSubPanel('affiliate')} initialMode="login" />
                      </div>
                    )
                  )}

                  {/* Deep View: Reseller Agent */}
                  {activeSubPanel === 'agent' && (
                    currentUserAccount ? (
                      activeAgentRecord ? (
                        <AgentDashboard />
                      ) : (
                        <div className="max-w-md mx-auto space-y-4">
                          <div className="bg-teal-50 border border-teal-100 p-4.5 rounded-xl text-xs text-teal-950 space-y-1.5 leading-relaxed">
                            <p className="font-extrabold uppercase tracking-wider text-teal-900 block">💼 Program Reseller Ejen Madu</p>
                            <p>
                              Ambil bahagian borong pukal dengan diskaun modal tinggi. Urus simpanan stok setempat, lancarkan jualan tempatan, and binakan ledger perniagaan anda sendiri!
                            </p>
                          </div>
                          <UpgradeAccountWindow onSuccess={() => setActiveSubPanel('agent')} targetType="agent" />
                        </div>
                      )
                    ) : (
                      <div className="max-w-md mx-auto py-4">
                        <div className="bg-teal-50 border border-teal-150 p-4 rounded-xl mb-4 text-xs text-teal-950 font-bold">
                          🔑 Sila daftar masuk untuk mengakses data perolehan stok & logistik agensi ejen borong.
                        </div>
                        <AuthWindow onSuccess={() => setActiveSubPanel('agent')} initialMode="login" />
                      </div>
                    )
                  )}

                  {/* Deep View: HQ Admin Operations */}
                  {activeSubPanel === 'admin' && (
                    currentUserAccount ? (
                      currentUserAccount.userType === 'admin' ? (
                        <AdminOperations />
                      ) : (
                        <div className="max-w-md mx-auto bg-white p-6 rounded-2xl border border-gray-150 text-center space-y-4 shadow-sm">
                          <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 mx-auto">
                            <ShieldAlert className="h-6 w-6" />
                          </div>
                          <h3 className="font-sans text-xs font-black uppercase text-slate-900">HAD KAWALAN HADIRIN</h3>
                          <p className="text-xs text-slate-500 leading-normal">
                            Maaf, akaun anda tidak mempunyai kelayakan bertaraf pegawai admin HQ. Kebenaran modul audit transaksi perbankan & KYC simpanan MyKAD dihadkan dengan ketat.
                          </p>
                          <div className="p-3 bg-red-50 text-red-950 text-[10.5px] border border-red-100 rounded-lg font-mono">
                            Akses terhad kepada akaun pentadbir HQ yang diluluskan sahaja.
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="max-w-md mx-auto space-y-4">
                        <div className="bg-purple-100/50 border border-purple-200 text-purple-950 px-4 py-3 rounded-2xl text-[10.5px] font-bold flex gap-2 items-center">
                          <ShieldAlert className="h-4 w-4 shrink-0 text-purple-700 animate-bounce" />
                          <span>Modul ini terhad kepada pentadbir HQ. Sila log masuk dengan akaun admin anda.</span>
                        </div>
                        <AdminLoginWindow onSuccess={() => setActiveSubPanel('admin')} />
                      </div>
                    )
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* ================================== */}
      {/* 4. PERSISTENT BOTTOM TAB BAR      */}
      {/* ================================== */}
      <nav id="shopee-bottom-tab-bar" className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-[#E8E8E8] z-45 flex items-center justify-around pb-1.5 select-none shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        <div className={`w-full ${widthClass} mx-auto flex items-center justify-around px-2 transition-all duration-300`}>
          
          {/* TAB 1: Home */}
          <button
            onClick={() => handleTabChange('home')}
            className={`flex flex-col items-center justify-center flex-1 h-12 transition-colors cursor-pointer relative ${
              currentTab === 'home' ? 'text-[#EE4D2D]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-[9px] font-black tracking-wide mt-0.5">
              {language === 'ms' ? 'Utama' : 'Home'}
            </span>
          </button>

          {/* TAB 2: Search */}
          <button
            onClick={() => handleTabChange('search')}
            className={`flex flex-col items-center justify-center flex-1 h-12 transition-colors cursor-pointer relative ${
              currentTab === 'search' ? 'text-[#EE4D2D]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Search className="h-5 w-5" />
            <span className="text-[9px] font-black tracking-wide mt-0.5">
              {language === 'ms' ? 'Carian' : 'Search'}
            </span>
          </button>

          {/* TAB 3: Cart */}
          <button
            onClick={() => handleTabChange('cart')}
            className={`flex flex-col items-center justify-center flex-1 h-12 transition-colors cursor-pointer relative ${
              currentTab === 'cart' ? 'text-[#EE4D2D]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-600 text-[8.5px] font-black text-white border border-white">
                  {totalCartItems}
                </span>
              )}
            </div>
            <span className="text-[9px] font-black tracking-wide mt-0.5">
              {language === 'ms' ? 'Troli' : 'Cart'}
            </span>
          </button>

          {/* TAB 4: Account */}
          <button
            onClick={() => handleTabChange('account')}
            className={`flex flex-col items-center justify-center flex-1 h-12 transition-colors cursor-pointer relative ${
              currentTab === 'account' ? 'text-[#EE4D2D]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-[9px] font-black tracking-wide mt-0.5">
              {language === 'ms' ? 'Saya' : 'Account'}
            </span>
          </button>

        </div>
      </nav>

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}