/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAppState } from '../context/AppContext';
import { 
  ChevronLeft, 
  ShoppingCart, 
  RefreshCw,
  Search,
  Globe
} from 'lucide-react';
import { translations } from '../lib/translations';

interface NavbarProps {
  currentTab: 'home' | 'search' | 'cart' | 'account';
  setCurrentTab: (tab: 'home' | 'search' | 'cart' | 'account') => void;
  activeSubPanel: 'affiliate' | 'agent' | 'admin' | 'profile_editor' | null;
  setActiveSubPanel: (panel: 'affiliate' | 'agent' | 'admin' | 'profile_editor' | null) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentTab, 
  setCurrentTab, 
  activeSubPanel, 
  setActiveSubPanel 
}) => {
  const { 
    cart, 
    referralCode, 
    resetToDefaults, 
    language, 
    setLanguage 
  } = useAppState();
  
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Determine back navigation and page titles
  const isDeep = activeSubPanel !== null;

  const getPageTitle = () => {
    if (activeSubPanel === 'profile_editor') {
      return language === 'ms' ? 'Urus Alamat & Bank' : 'Addresses & Bank Settings';
    }
    if (activeSubPanel === 'affiliate') {
      return language === 'ms' ? 'Portal Rakan Afiliat' : 'Affiliate Partner Hub';
    }
    if (activeSubPanel === 'agent') {
      return language === 'ms' ? 'Sistem Ejen Madu' : 'Agent Honey System';
    }
    if (activeSubPanel === 'admin') {
      return language === 'ms' ? 'Operasi Admin HQ' : 'Admin Operations HQ';
    }

    switch (currentTab) {
      case 'home':
        return 'Madu Plus Tualang';
      case 'search':
        return language === 'ms' ? 'Cari Produk' : 'Search Products';
      case 'cart':
        return language === 'ms' ? 'Troli Beli-Belah' : 'Shopping Cart';
      case 'account':
        return language === 'ms' ? 'Akaun Saya' : 'My Account';
      default:
        return 'Madu Plus';
    }
  };

  const widthClass = activeSubPanel === 'admin' 
    ? 'max-w-7xl' 
    : (activeSubPanel === 'agent' || activeSubPanel === 'affiliate')
      ? 'max-w-5xl'
      : 'max-w-lg';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#EE4D2D] text-white shadow-md">
      <div className={`mx-auto flex h-14 w-full ${widthClass} items-center justify-between px-4 transition-all duration-300`}>
        
        {/* Left Side: Back trigger or dynamic brand icon */}
        <div className="flex items-center space-x-2">
          {isDeep ? (
            <button
              onClick={() => setActiveSubPanel(null)}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>
          ) : (
            <div 
              onClick={() => {
                setCurrentTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center space-x-1.5 cursor-pointer active:scale-95 transition-transform"
            >
              <span className="text-xl">🍯</span>
              <span className="font-sans text-sm font-black tracking-tight hidden sm:inline">Madu Plus</span>
            </div>
          )}
        </div>

        {/* Center Title or active search redirect */}
        <div className="flex-1 px-4 text-center">
          {currentTab === 'home' && !isDeep ? (
            <div 
              onClick={() => setCurrentTab('search')}
              className="mx-auto flex h-8 max-w-xs items-center gap-2 rounded-lg bg-white/15 px-3 py-1 cursor-pointer hover:bg-white/20 active:opacity-90 transition-all text-white/80"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="text-[11px] font-sans truncate text-left">
                {language === 'ms' ? 'Cari madu asli tualang...' : 'Search pure wild honey...'}
              </span>
            </div>
          ) : (
            <h1 className="font-sans text-sm font-black tracking-tight truncate leading-none uppercase">
              {getPageTitle()}
            </h1>
          )}
        </div>

        {/* Right Side Tools: Language selector, cart, or developer reset */}
        <div className="flex items-center space-x-1">
          {/* Active referral badge code */}
          {referralCode && (
            <div className="hidden md:flex items-center bg-amber-500/35 border border-white/20 px-2 py-0.5 rounded-full text-[9px] text-amber-100 font-bold">
              Ref: <span className="underline ml-1 font-mono">{referralCode}</span>
            </div>
          )}

          {/* Language toggle element inline */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ms' : 'en')}
            className="flex h-8 px-2.5 items-center gap-1 rounded-lg hover:bg-white/10 transition-colors text-xs font-extrabold cursor-pointer uppercase"
            title="Tukar Bahasa / Change Language"
          >
            <Globe className="h-3 w-3" />
            <span>{language === 'en' ? 'BM' : 'EN'}</span>
          </button>

          {/* Cart with dynamic badge */}
          <button
            onClick={() => setCurrentTab('cart')}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Shopping Cart"
          >
            <ShoppingCart className="h-4.5 w-4.5" />
            {totalCartItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[8.5px] font-black text-slate-900 border border-[#EE4D2D]">
                {totalCartItems}
              </span>
            )}
          </button>

          {/* Quick core DB refresh to clear and reset defaults */}
          <button
            onClick={() => {
              if (window.confirm(translations.resetConfirm[language])) {
                resetToDefaults();
                alert(translations.resetSuccess[language]);
                window.location.reload();
              }
            }}
            className="p-1.5 text-white/50 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Developer Database Reset"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
      </div>
    </header>
  );
};
