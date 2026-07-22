/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, 
  Affiliate, 
  Order, 
  CartItem, 
  Branch, 
  TierType,
  UserAccount,
  UserProfile,
  UserAddress,
  BankAccount,
  Agent,
  AgentStockLog,
  WebsiteConfig,
  WebsitePage,
  AuditLog,
  UserStatus,
  ProductCategory,
  InventoryItem,
  StockMovement,
  StockMovementType,
  StockAlert,
  ProductPricingHistory,
  ProductVariant,
  ProductSupplier,
  RecruitmentInvite,
  Campaign
} from '../types';
import { supabaseDb, isSupabaseConfigured } from '../lib/supabase';
import { hashPassword, verifyPassword } from '../lib/passwordHash';

interface AppContextType {
  // Authentication & Session
  currentUserAccount: UserAccount | null;
  currentUserProfile: UserProfile | null;
  userAccounts: UserAccount[];
  userProfiles: UserProfile[];
  
  // Addresses & Bank Accounts
  addresses: UserAddress[];
  bankAccounts: BankAccount[];
  
  // Base Data Entities
  products: Product[];
  affiliates: Affiliate[];
  agents: Agent[];
  agentStockLogs: AgentStockLog[];
  orders: Order[];
  branches: Branch[];
  
  // Website Customization & CMS
  websiteConfig: WebsiteConfig;
  websitePages: WebsitePage[];
  auditLogs: AuditLog[];
  recruitmentInvites: RecruitmentInvite[];
  campaigns: Campaign[];
  
  // Advanced Product & Inventory Schema Extensions
  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  stockAlerts: StockAlert[];
  pricingHistory: ProductPricingHistory[];
  variants: ProductVariant[];
  suppliers: ProductSupplier[];
  categories: ProductCategory[];

  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  setStockMovements: React.Dispatch<React.SetStateAction<StockMovement[]>>;
  setStockAlerts: React.Dispatch<React.SetStateAction<StockAlert[]>>;
  setPricingHistory: React.Dispatch<React.SetStateAction<ProductPricingHistory[]>>;
  setVariants: React.Dispatch<React.SetStateAction<ProductVariant[]>>;
  setSuppliers: React.Dispatch<React.SetStateAction<ProductSupplier[]>>;
  setCategories: React.Dispatch<React.SetStateAction<ProductCategory[]>>;

  addProduct: (product: Product) => Promise<{ success: boolean; error?: string }>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<{ success: boolean; error?: string }>;
  deleteProduct: (id: string) => void;
  duplicateProduct: (id: string, name: string, newSku: string, copyFlags: { images: boolean; desc: boolean; price: boolean; specs: boolean; stock: boolean }) => void;
  recordStockMovement: (productId: string, warehouseId: string, movementType: StockMovementType, quantity: number, reason: string, refNum?: string, notes?: string, fromId?: string, toId?: string) => Promise<{ success: boolean; error?: string }>;
  bulkStockChange: (changes: { productId: string; quantity: number }[], warehouseId: string, movementType: StockMovementType, reason: string, refNum?: string) => Promise<{ success: boolean; error?: string; failedCount?: number }>;
  bulkPricesChange: (productIds: string[], type: 'fixed' | 'percentage', changeAmount: number, reason: string) => void;
  bulkStatusChange: (productIds: string[], status: 'active' | 'inactive') => void;
  bulkDeleteProducts: (productIds: string[]) => void;
  
  // Active Utility States
  cart: CartItem[];
  referralCode: string | null;
  selectedBranchId: string;
  language: 'en' | 'ms';
  supabaseConnected: boolean;
  supabaseLoading: boolean;

  // Active Setters & Core Mutation APIs
  setReferralCode: (code: string | null) => void;
  setSelectedBranchId: (id: string) => void;
  setLanguage: (lang: 'en' | 'ms') => void;
  
  // Authentication Core Action Handlers
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: UserAccount; needsPasswordSetup?: boolean }>;
  setPassword: (accountId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  registerCustomer: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerAffiliateEx: (fields: {
    name: string;
    email: string;
    ic: string;
    whatsapp: string;
    address: string;
    bankName: string;
    bankNo: string;
    holderName: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  registerAgentEx: (fields: {
    name: string;
    email: string;
    ic: string;
    whatsapp: string;
    address: string;
    bankName: string;
    bankNo: string;
    holderName: string;
    tier: TierType;
    password: string;
  }) => Promise<{ success: boolean; error?: string; agentId?: string }>;
  // Upgrade an already-logged-in customer account to affiliate/agent status without
  // re-collecting name/email/password, and reusing IC/bank details already on file.
  upgradeToAffiliate: (fields: {
    ic: string;
    whatsapp: string;
    bankAccountId?: string;
    newBank?: { bankName: string; bankNo: string; holderName: string };
  }) => Promise<{ success: boolean; error?: string }>;
  upgradeToAgent: (fields: {
    ic: string;
    whatsapp: string;
    tier: TierType;
    bankAccountId?: string;
    newBank?: { bankName: string; bankNo: string; holderName: string };
  }) => Promise<{ success: boolean; error?: string; agentId?: string }>;
  logout: () => void;

  // Multi-Addresses Management APIs
  addAddress: (fields: Omit<UserAddress, 'id'>) => void;
  editAddress: (id: string, fields: Partial<UserAddress>) => void;
  deleteAddress: (id: string) => void;

  // Bank Accounts Management APIs
  addBankAccount: (fields: Omit<BankAccount, 'id'>) => void;
  editBankAccount: (id: string, fields: Partial<BankAccount>) => void;
  verifyBankAccount: (id: string) => void; // Admin action
  
  // Agent Inventory Operations
  purchaseAgentStock: (agentId: string, productId: string, quantity: number, notes?: string) => void;
  
  // CMS & Config Editors
  updateCMSConfig: (config: WebsiteConfig) => void;
  upsertCMSPage: (page: WebsitePage) => void;

  // Shopping Cart & Order Checkout
  addToCart: (productId: string, quantity: number) => void;
  updateCartQty: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  checkout: (details: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: string;
    isGuest?: boolean;
    agentId?: string; // buy from specific agent's micro-stock
  }) => { success: boolean; orderId?: string; error?: string };

  // Admin Dashboard Management Operations
  verifyIC: (profileId: string) => void;
  addAuditLog: (action: string, targetType: string, targetId: string, changes: string) => void;
  updateUserStatus: (accountId: string, status: UserStatus) => void;
  updateUserRole: (accountId: string, userType: UserAccount['userType']) => void;
  updateUserProfile: (userId: string, updates: Partial<UserProfile>) => void;
  deleteUserAccount: (accountId: string) => void;
  adminCreateUserAccount: (fields: {
    email: string;
    userType: UserAccount['userType'];
    status: UserStatus;
    fullName: string;
    icNumber?: string;
    phoneNumber?: string;
    whatsappNumber?: string;
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
  }) => { success: boolean; accountId: string };
  updateOrderStatus: (orderId: string, paymentStatus: Order['paymentStatus'], fulfillmentStatus: Order['fulfillmentStatus']) => void;
  toggleCommissionPaid: (orderId: string) => void;
  restockProduct: (productId: string, quantity: number) => void;
  addMockOrder: (order: Order) => void;
  updateAffiliate: (id: string, updates: Partial<Affiliate>) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  addAffiliate: (aff: Affiliate) => void;
  addAgent: (agt: Agent) => void;
  resetToDefaults: () => void;
  seedSupabase: () => Promise<{ success: boolean; message: string }>;
  addRecruitmentInvite: (invite: Omit<RecruitmentInvite, 'id' | 'createdAt'>) => Promise<RecruitmentInvite>;
  addCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt'>) => Promise<Campaign>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Standard Mock Baseline Data
const DEFAULT_PRODUCTS: Product[] = [];

const DEFAULT_ACCOUNTS: UserAccount[] = [];

const DEFAULT_PROFILES: UserProfile[] = [];

const DEFAULT_ADDRESSES: UserAddress[] = [];

const DEFAULT_BANK_ACCOUNTS: BankAccount[] = [];

const DEFAULT_AFFILIATES: Affiliate[] = [];

const DEFAULT_AGENTS: Agent[] = [];

const DEFAULT_STOCK_LOGS: AgentStockLog[] = [];

const DEFAULT_BRANCHES: Branch[] = [];

const DEFAULT_CATEGORIES: ProductCategory[] = [];

const DEFAULT_SUPPLIERS: ProductSupplier[] = [];

const DEFAULT_INVENTORY: InventoryItem[] = [];

const DEFAULT_STOCK_MOVEMENTS: StockMovement[] = [];

const DEFAULT_STOCK_ALERTS: StockAlert[] = [];

const DEFAULT_PRICING_HISTORY: ProductPricingHistory[] = [];

const DEFAULT_VARIANTS: ProductVariant[] = [];

const DEFAULT_ORDERS: Order[] = [];

const DEFAULT_CMS_CONFIG: WebsiteConfig = {
  siteName: 'Madu Plus Tualang',
  siteDescription: 'Direct, premium raw wild Tualang Honey.',
  logoUrl: '',
  primaryColor: '#1580c2',
  secondaryColor: '#64748b',
  contactPhone: '',
  contactEmail: '',
  facebookLink: '',
  instagramLink: ''
};

const DEFAULT_CMS_PAGES: WebsitePage[] = [];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Offline-first LocalStorage Hydrators
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('mp_accounts');
    return saved ? JSON.parse(saved) : DEFAULT_ACCOUNTS;
  });

  const [userProfiles, setUserProfiles] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('mp_profiles');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILES;
  });

  const [addresses, setAddresses] = useState<UserAddress[]>(() => {
    const saved = localStorage.getItem('mp_addresses');
    return saved ? JSON.parse(saved) : DEFAULT_ADDRESSES;
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('mp_bank_accounts');
    return saved ? JSON.parse(saved) : DEFAULT_BANK_ACCOUNTS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('mp_products');
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
  });

  const [affiliates, setAffiliates] = useState<Affiliate[]>(() => {
    const saved = localStorage.getItem('mp_affiliates');
    return saved ? JSON.parse(saved) : DEFAULT_AFFILIATES;
  });

  const [agents, setAgents] = useState<Agent[]>(() => {
    const saved = localStorage.getItem('mp_agents');
    return saved ? JSON.parse(saved) : DEFAULT_AGENTS;
  });

  const [agentStockLogs, setAgentStockLogs] = useState<AgentStockLog[]>(() => {
    const saved = localStorage.getItem('mp_stock_logs');
    return saved ? JSON.parse(saved) : DEFAULT_STOCK_LOGS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('mp_orders');
    return saved ? JSON.parse(saved) : DEFAULT_ORDERS;
  });

  const [websiteConfig, setWebsiteConfig] = useState<WebsiteConfig>(() => {
    const saved = localStorage.getItem('mp_website_config');
    return saved ? JSON.parse(saved) : DEFAULT_CMS_CONFIG;
  });

  const [websitePages, setWebsitePages] = useState<WebsitePage[]>(() => {
    const saved = localStorage.getItem('mp_website_pages');
    return saved ? JSON.parse(saved) : DEFAULT_CMS_PAGES;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [recruitmentInvites, setRecruitmentInvites] = useState<RecruitmentInvite[]>(() => {
    const saved = localStorage.getItem('mp_recruitment_invites');
    return saved ? JSON.parse(saved) : [];
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const saved = localStorage.getItem('mp_campaigns');
    return saved ? JSON.parse(saved) : [];
  });

  // Advanced Product & Inventory States
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('mp_inventory_items');
    return saved ? JSON.parse(saved) : DEFAULT_INVENTORY;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem('mp_stock_movements');
    return saved ? JSON.parse(saved) : DEFAULT_STOCK_MOVEMENTS;
  });

  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>(() => {
    const saved = localStorage.getItem('mp_stock_alerts');
    return saved ? JSON.parse(saved) : DEFAULT_STOCK_ALERTS;
  });

  const [pricingHistory, setPricingHistory] = useState<ProductPricingHistory[]>(() => {
    const saved = localStorage.getItem('mp_pricing_history');
    return saved ? JSON.parse(saved) : DEFAULT_PRICING_HISTORY;
  });

  const [variants, setVariants] = useState<ProductVariant[]>(() => {
    const saved = localStorage.getItem('mp_variants');
    return saved ? JSON.parse(saved) : DEFAULT_VARIANTS;
  });

  const [suppliers, setSuppliers] = useState<ProductSupplier[]>(() => {
    const saved = localStorage.getItem('mp_suppliers');
    return saved ? JSON.parse(saved) : DEFAULT_SUPPLIERS;
  });

  const [categories, setCategories] = useState<ProductCategory[]>(() => {
    const saved = localStorage.getItem('mp_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  // Session state (Current Logged In user)
  const [currentUserAccount, setCurrentUserAccount] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('mp_current_account');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('mp_current_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('mp_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [referralCode, setReferralCode] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRef = params.get('ref');
      if (urlRef) {
        localStorage.setItem('mp_referral_code', urlRef);
        localStorage.setItem('MP_referral_code', urlRef);
        return urlRef;
      }
    }
    return localStorage.getItem('mp_referral_code') || localStorage.getItem('MP_referral_code');
  });

  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    return DEFAULT_BRANCHES[0]?.id || '';
  });

  const [language, setLanguageState] = useState<'en' | 'ms'>(() => {
    const saved = localStorage.getItem('mp_language');
    return (saved === 'en' || saved === 'ms') ? saved : 'en';
  });

  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem('mp_branches');
    return saved ? JSON.parse(saved) : DEFAULT_BRANCHES;
  });

  useEffect(() => {
    localStorage.setItem('mp_branches', JSON.stringify(branches));
  }, [branches]);
  
  // Supabase states
  const [supabaseLoading, setSupabaseLoading] = useState<boolean>(true);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);

  // Sync to database if Supabase configured
  useEffect(() => {
    const loadSupabaseData = async () => {
      if (!isSupabaseConfigured) {
        setSupabaseLoading(false);
        return;
      }
      try {
        const [
          dbProducts, dbAffiliates, dbOrders, dbAccounts, 
          dbProfiles, dbAddresses, dbBankAccounts, 
          dbAgents, dbLogs, dbConfig, dbPages, dbAudit,
          dbInvites, dbCampaigns
        ] = await Promise.all([
          supabaseDb.getProducts(),
          supabaseDb.getAffiliates(),
          supabaseDb.getOrders(),
          supabaseDb.getUserAccounts(),
          supabaseDb.getUserProfiles(),
          supabaseDb.getUserAddresses(),
          supabaseDb.getBankAccounts(),
          supabaseDb.getAgents(),
          supabaseDb.getAgentStockLogs(),
          supabaseDb.getWebsiteConfig(),
          supabaseDb.getWebsitePages(),
          supabaseDb.getAuditLogs(),
          supabaseDb.getRecruitmentInvites(),
          supabaseDb.getCampaigns()
        ]);
        
        let connectedCount = 0;
        if (dbProducts !== null) { setProducts(dbProducts); connectedCount++; }
        if (dbAffiliates !== null) { setAffiliates(dbAffiliates); connectedCount++; }
        if (dbOrders !== null) { setOrders(dbOrders); connectedCount++; }
        if (dbAccounts !== null) { setUserAccounts(dbAccounts); connectedCount++; }
        if (dbProfiles !== null) { setUserProfiles(dbProfiles); connectedCount++; }
        if (dbAddresses !== null) { setAddresses(dbAddresses); connectedCount++; }
        if (dbBankAccounts !== null) { setBankAccounts(dbBankAccounts); connectedCount++; }
        if (dbAgents !== null) { setAgents(dbAgents); connectedCount++; }
        if (dbLogs !== null) { setAgentStockLogs(dbLogs); connectedCount++; }
        if (dbConfig !== null) { setWebsiteConfig(dbConfig); connectedCount++; }
        if (dbPages !== null) { setWebsitePages(dbPages); connectedCount++; }
        if (dbAudit !== null) { setAuditLogs(dbAudit); connectedCount++; }
        if (dbInvites !== null) { setRecruitmentInvites(dbInvites); connectedCount++; }
        if (dbCampaigns !== null) { setCampaigns(dbCampaigns); connectedCount++; }
        
        if (connectedCount > 0) {
          setSupabaseConnected(true);
          console.log('[Supabase Setup] Synced all active CRM schemas securely.');
        }
      } catch (err) {
        console.warn('Failed to load from Supabase:', err);
      } finally {
        setSupabaseLoading(false);
      }
    };
    loadSupabaseData();
  }, []);

  // Sync state variables back to offline localStorage caches
  useEffect(() => { localStorage.setItem('mp_accounts', JSON.stringify(userAccounts)); }, [userAccounts]);
  useEffect(() => { localStorage.setItem('mp_profiles', JSON.stringify(userProfiles)); }, [userProfiles]);
  useEffect(() => { localStorage.setItem('mp_addresses', JSON.stringify(addresses)); }, [addresses]);
  useEffect(() => { localStorage.setItem('mp_bank_accounts', JSON.stringify(bankAccounts)); }, [bankAccounts]);
  useEffect(() => { localStorage.setItem('mp_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('mp_affiliates', JSON.stringify(affiliates)); }, [affiliates]);
  useEffect(() => { localStorage.setItem('mp_agents', JSON.stringify(agents)); }, [agents]);
  useEffect(() => { localStorage.setItem('mp_stock_logs', JSON.stringify(agentStockLogs)); }, [agentStockLogs]);
  useEffect(() => { localStorage.setItem('mp_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('mp_website_config', JSON.stringify(websiteConfig)); }, [websiteConfig]);
  useEffect(() => { localStorage.setItem('mp_website_pages', JSON.stringify(websitePages)); }, [websitePages]);
  useEffect(() => { localStorage.setItem('mp_inventory_items', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('mp_stock_movements', JSON.stringify(stockMovements)); }, [stockMovements]);
  useEffect(() => { localStorage.setItem('mp_stock_alerts', JSON.stringify(stockAlerts)); }, [stockAlerts]);
  useEffect(() => { localStorage.setItem('mp_pricing_history', JSON.stringify(pricingHistory)); }, [pricingHistory]);
  useEffect(() => { localStorage.setItem('mp_variants', JSON.stringify(variants)); }, [variants]);
  useEffect(() => { localStorage.setItem('mp_suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem('mp_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('mp_recruitment_invites', JSON.stringify(recruitmentInvites)); }, [recruitmentInvites]);
  useEffect(() => { localStorage.setItem('mp_campaigns', JSON.stringify(campaigns)); }, [campaigns]);
  useEffect(() => {
    if (currentUserAccount) {
      localStorage.setItem('mp_current_account', JSON.stringify(currentUserAccount));
    } else {
      localStorage.removeItem('mp_current_account');
    }
  }, [currentUserAccount]);

  useEffect(() => {
    if (currentUserProfile) {
      localStorage.setItem('mp_current_profile', JSON.stringify(currentUserProfile));
    } else {
      localStorage.removeItem('mp_current_profile');
    }
  }, [currentUserProfile]);

  useEffect(() => { localStorage.setItem('mp_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => {
    if (referralCode) {
      localStorage.setItem('MP_referral_code', referralCode);
    } else {
      localStorage.removeItem('mp_referral_code');
    }
  }, [referralCode]);

  // URL parsing of active affiliate referrers
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      const token = ref.toUpperCase().trim();
      const existing = affiliates.find(a => a.code.toUpperCase() === token);
      if (existing) {
        setReferralCode(existing.code);
        console.log(`[Referral Applied] Active Code: ${existing.code}`);
      }
    }
  }, [affiliates]);

  const setLanguage = (lang: 'en' | 'ms') => {
    setLanguageState(lang);
    localStorage.setItem('mp_language', lang);
  };

  // Helper commission details
  const getCommissionRate = (tier: TierType): number => {
    if (tier === 'Gold') return 0.20;
    if (tier === 'Silver') return 0.15;
    return 0.10;
  };

  const getTierFromUnits = (units: number): TierType => {
    if (units > 200) return 'Gold';
    if (units > 50) return 'Silver';
    return 'Bronze';
  };

  // IC extraction date of birth (YYMMDD-XX-XXXX)
  const extractDOBFromIC = (ic: string): string => {
    const clean = ic.replace(/-/g, '');
    if (clean.length < 6) return '';
    const yy = clean.substring(0, 2);
    const mm = clean.substring(2, 4);
    const dd = clean.substring(4, 6);
    const yearPrefix = parseInt(yy) > 26 ? '19' : '20'; // Pivot year 26 for MVP context
    return `${yearPrefix}${yy}-${mm}-${dd}`;
  };

  /**
   * AUTHENTICATION FLOW: Unified login matching email passwords safely
   */
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: UserAccount; needsPasswordSetup?: boolean }> => {
    const cleanEmail = (email || '').toLowerCase().trim();
    const account = userAccounts.find(a => a.email && a.email.toLowerCase() === cleanEmail);
    if (!account) {
      return { success: false, error: 'Invalid email or password.' };
    }
    if (account.status === 'suspended') {
      return { success: false, error: 'This account has been suspended by HQ.' };
    }

    // Accounts created before password auth existed (or by an admin without one) have no hash yet —
    // route them through a one-time "set your password" step instead of granting access on email alone.
    if (!account.passwordHash) {
      return { success: false, needsPasswordSetup: true, user: account };
    }

    const match = await verifyPassword(password, account.passwordHash);
    if (!match) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const profile = userProfiles.find(p => p.userId === account.id);
    setCurrentUserAccount(account);
    setCurrentUserProfile(profile || null);

    return { success: true, user: account };
  };

  const setPassword = async (accountId: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const account = userAccounts.find(a => a.id === accountId);
    if (!account) {
      return { success: false, error: 'Account not found.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const passwordHash = await hashPassword(newPassword);
    const updatedAccount: UserAccount = { ...account, passwordHash };

    if (isSupabaseConfigured) {
      const ok = await supabaseDb.upsertUserAccounts([updatedAccount]);
      if (!ok) {
        return { success: false, error: 'Failed to save the new password to Supabase. Please try again.' };
      }
    }

    setUserAccounts(prev => prev.map(a => a.id === accountId ? updatedAccount : a));

    const profile = userProfiles.find(p => p.userId === accountId);
    setCurrentUserAccount(updatedAccount);
    setCurrentUserProfile(profile || null);

    return { success: true };
  };

  const logout = () => {
    setCurrentUserAccount(null);
    setCurrentUserProfile(null);
  };

  /**
   * AUTH SERVICE: Register Customer accounts
   */
  const registerCustomer = async (name: string, email: string, phone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (userAccounts.some(a => a.email && a.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Email already registered.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const newAccId = `acc-cust-${Date.now().toString().slice(-4)}`;
    const newAcc: UserAccount = {
      id: newAccId,
      email: cleanEmail,
      userType: 'customer',
      status: 'active',
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString()
    };

    const newProf: UserProfile = {
      id: `prof-cust-${Date.now().toString().slice(-4)}`,
      userId: newAccId,
      fullName: name.trim(),
      icNumber: '',
      icVerified: false,
      phoneNumber: phone,
      whatsappNumber: phone
    };

    setUserAccounts(prev => [...prev, newAcc]);
    setUserProfiles(prev => [...prev, newProf]);

    if (isSupabaseConfigured) {
      await supabaseDb.upsertUserAccounts([newAcc]);
      await supabaseDb.upsertUserProfiles([newProf]);
    }

    setCurrentUserAccount(newAcc);
    setCurrentUserProfile(newProf);

    return { success: true };
  };

  /**
   * AUTH SERVICE: Register Affiliate accounts with auto generated coupon code
   */
  const registerAffiliateEx = async (fields: {
    name: string;
    email: string;
    ic: string;
    whatsapp: string;
    address: string;
    bankName: string;
    bankNo: string;
    holderName: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = (fields.email || '').toLowerCase().trim();
    if (userAccounts.some(a => a.email && a.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Email already registered.' };
    }
    if (!fields.password || fields.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const uniqueCode = 'AFX' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const uniqueToken = Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const newAccId = `acc-aff-${uniqueToken}`;

    const newAcc: UserAccount = {
      id: newAccId,
      email: cleanEmail,
      userType: 'affiliate',
      status: 'active',
      passwordHash: await hashPassword(fields.password),
      createdAt: new Date().toISOString()
    };

    // Extract DOB from MyKAD
    const dob = extractDOBFromIC(fields.ic);

    const newProf: UserProfile = {
      id: `prof-aff-${uniqueToken}`,
      userId: newAccId,
      fullName: fields.name,
      icNumber: fields.ic,
      icVerified: false,
      dateOfBirth: dob,
      phoneNumber: fields.whatsapp,
      whatsappNumber: fields.whatsapp
    };

    const newAddr: UserAddress = {
      id: `adr-aff-${uniqueToken}`,
      userId: newAccId,
      addressType: 'both',
      fullAddress: fields.address,
      postalCode: '',
      city: '',
      state: '',
      country: 'Malaysia',
      isDefault: true
    };

    const newBank: BankAccount = {
      id: `bnk-aff-${uniqueToken}`,
      userId: newAccId,
      accountHolderName: fields.holderName || fields.name,
      bankName: fields.bankName,
      accountNumber: fields.bankNo,
      accountType: 'savings',
      isVerified: false,
      isDefault: true
    };

    // Check referral code
    let recruitedBy: string | undefined = undefined;
    const activeRefCode = referralCode || localStorage.getItem('mp_referral_code') || localStorage.getItem('MP_referral_code');
    if (activeRefCode) {
      const upline = affiliates.find(a => a.code.toUpperCase() === activeRefCode.toUpperCase());
      if (upline) {
        recruitedBy = upline.id;
        // update the upline affiliate's stats: conversions + 1
        setAffiliates(prev => {
          const nextAffs = prev.map(a => {
            if (a.id === upline.id) {
              const updatedUpline = { ...a, conversions: (a.conversions || 0) + 1 };
              if (isSupabaseConfigured) {
                supabaseDb.upsertAffiliates([updatedUpline]).catch(e => {
                  console.error("Failed to update upline conversions in Supabase:", e);
                });
              }
              return updatedUpline;
            }
            return a;
          });
          localStorage.setItem('mp_affiliates', JSON.stringify(nextAffs));
          return nextAffs;
        });
        addAuditLog('Referral Attribution', 'affiliates', upline.id, `Attributed conversion from new registration under code ${activeRefCode}`);
      }
    }

    const newAff: Affiliate = {
      id: `aff-${uniqueToken}`,
      userId: newAccId,
      name: fields.name,
      email: cleanEmail,
      whatsapp: fields.whatsapp,
      code: uniqueCode,
      signupDate: new Date().toISOString().split('T')[0],
      tier: 'Bronze',
      unitsSold: 0,
      lifetimeSales: 0,
      lifetimeCommissions: 0,
      bankAccountId: newBank.id,
      recruitedBy: recruitedBy
    };

    setUserAccounts(prev => [...prev, newAcc]);
    setUserProfiles(prev => [...prev, newProf]);
    setAddresses(prev => [...prev, newAddr]);
    setBankAccounts(prev => [...prev, newBank]);
    setAffiliates(prev => [...prev, newAff]);

    if (isSupabaseConfigured) {
      await supabaseDb.upsertUserAccounts([newAcc]);
      await supabaseDb.upsertUserProfiles([newProf]);
      await supabaseDb.upsertUserAddresses([newAddr]);
      await supabaseDb.upsertBankAccounts([newBank]);
      await supabaseDb.upsertAffiliates([newAff]);
    }

    setCurrentUserAccount(newAcc);
    setCurrentUserProfile(newProf);

    return { success: true };
  };

  /**
   * AUTH SERVICE: Register Agent accounts (includes instant tier stock purchase)
   */
  const registerAgentEx = async (fields: {
    name: string;
    email: string;
    ic: string;
    whatsapp: string;
    address: string;
    bankName: string;
    bankNo: string;
    holderName: string;
    tier: TierType;
    password: string;
  }): Promise<{ success: boolean; error?: string; agentId?: string }> => {
    const cleanEmail = (fields.email || '').toLowerCase().trim();
    if (userAccounts.some(a => a.email && a.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Email already registered.' };
    }
    if (!fields.password || fields.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    // Set initial configuration parameters
    let minPurchase = 1000;
    let discount = 0.20;
    let comm = 0.15;
    let initialBtls = 11;
    let maxInv = 100;

    if (fields.tier === 'Silver') {
      minPurchase = 5000;
      discount = 0.30;
      comm = 0.20;
      initialBtls = 59;
      maxInv = 500;
    } else if (fields.tier === 'Gold') {
      minPurchase = 15000;
      discount = 0.40;
      comm = 0.25;
      initialBtls = 176;
      maxInv = -1; // Unlimited
    }

    const uniqueToken = Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const newAccId = `acc-agt-${uniqueToken}`;

    const newAcc: UserAccount = {
      id: newAccId,
      email: cleanEmail,
      userType: 'agent',
      status: 'active',
      passwordHash: await hashPassword(fields.password),
      createdAt: new Date().toISOString()
    };

    const dob = extractDOBFromIC(fields.ic);

    const newProf: UserProfile = {
      id: `prof-agt-${uniqueToken}`,
      userId: newAccId,
      fullName: fields.name,
      icNumber: fields.ic,
      icVerified: false,
      dateOfBirth: dob,
      phoneNumber: fields.whatsapp,
      whatsappNumber: fields.whatsapp
    };

    const newAddr: UserAddress = {
      id: `adr-agt-${uniqueToken}`,
      userId: newAccId,
      addressType: 'both',
      fullAddress: fields.address,
      postalCode: '',
      city: '',
      state: '',
      country: 'Malaysia',
      isDefault: true
    };

    const newBank: BankAccount = {
      id: `bnk-agt-${uniqueToken}`,
      userId: newAccId,
      accountHolderName: fields.holderName || fields.name,
      bankName: fields.bankName,
      accountNumber: fields.bankNo,
      accountType: 'savings',
      isVerified: false,
      isDefault: true
    };

    // Check referral code
    let recruitedBy: string | undefined = undefined;
    const activeRefCode = referralCode || localStorage.getItem('mp_referral_code') || localStorage.getItem('MP_referral_code');
    if (activeRefCode) {
      const upline = affiliates.find(a => a.code.toUpperCase() === activeRefCode.toUpperCase());
      if (upline) {
        recruitedBy = upline.id;
        // update the upline affiliate's stats: conversions + 1
        setAffiliates(prev => {
          const nextAffs = prev.map(a => {
            if (a.id === upline.id) {
              const updatedUpline = { ...a, conversions: (a.conversions || 0) + 1 };
              if (isSupabaseConfigured) {
                supabaseDb.upsertAffiliates([updatedUpline]).catch(e => {
                  console.error("Failed to update upline conversions in Supabase:", e);
                });
              }
              return updatedUpline;
            }
            return a;
          });
          localStorage.setItem('mp_affiliates', JSON.stringify(nextAffs));
          return nextAffs;
        });
        addAuditLog('Referral Attribution', 'affiliates', upline.id, `Attributed conversion from new registration under code ${activeRefCode}`);
      }
    }

    const agtId = `agt-${uniqueToken}`;
    const newAgent: Agent = {
      id: agtId,
      userId: newAccId,
      agentTier: fields.tier,
      initialStockPurchase: minPurchase,
      stockBalance: initialBtls,
      stockAllocated: initialBtls,
      discountRate: discount,
      commissionRate: comm,
      maxInventory: maxInv,
      bankAccountId: newBank.id,
      verifiedAt: new Date().toISOString(),
      recruitedBy: recruitedBy
    };

    // Create Initial stock log transaction
    const initialLog: AgentStockLog = {
      id: `log-agt-${uniqueToken}`,
      agentId: agtId,
      productId: 'p1', // Sourced to default raw wild honey
      quantity: initialBtls,
      action: 'purchase',
      transactionId: `pay-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      notes: `Signup bundle purchase of ${initialBtls} bottles at ${fields.tier} level discount.`,
      createdAt: new Date().toISOString()
    };

    setUserAccounts(prev => [...prev, newAcc]);
    setUserProfiles(prev => [...prev, newProf]);
    setAddresses(prev => [...prev, newAddr]);
    setBankAccounts(prev => [...prev, newBank]);
    setAgents(prev => [...prev, newAgent]);
    setAgentStockLogs(prev => [initialLog, ...prev]);

    if (isSupabaseConfigured) {
      await supabaseDb.upsertUserAccounts([newAcc]);
      await supabaseDb.upsertUserProfiles([newProf]);
      await supabaseDb.upsertUserAddresses([newAddr]);
      await supabaseDb.upsertBankAccounts([newBank]);
      await supabaseDb.upsertAgents([newAgent]);
      await supabaseDb.upsertAgentStockLogs([initialLog]);
    }

    setCurrentUserAccount(newAcc);
    setCurrentUserProfile(newProf);

    return { success: true, agentId: agtId };
  };

  /**
   * UPGRADE SERVICE: Attach an Affiliate record to an already-logged-in account.
   * Reuses the existing name/email/IC/bank on file instead of re-collecting them.
   */
  const upgradeToAffiliate = async (fields: {
    ic: string;
    whatsapp: string;
    bankAccountId?: string;
    newBank?: { bankName: string; bankNo: string; holderName: string };
  }): Promise<{ success: boolean; error?: string }> => {
    if (!currentUserAccount) {
      return { success: false, error: 'You must be logged in.' };
    }
    if (affiliates.some(a => a.userId === currentUserAccount.id)) {
      return { success: false, error: 'This account is already registered as an affiliate.' };
    }

    let bankAccountId = fields.bankAccountId;
    if (!bankAccountId && fields.newBank) {
      const uniqueToken = Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
      const newBank: BankAccount = {
        id: `bnk-aff-${uniqueToken}`,
        userId: currentUserAccount.id,
        accountHolderName: fields.newBank.holderName || currentUserProfile?.fullName || currentUserAccount.email,
        bankName: fields.newBank.bankName,
        accountNumber: fields.newBank.bankNo,
        accountType: 'savings',
        isVerified: false,
        isDefault: !bankAccounts.some(b => b.userId === currentUserAccount.id)
      };
      setBankAccounts(prev => [...prev, newBank]);
      if (isSupabaseConfigured) {
        await supabaseDb.upsertBankAccounts([newBank]);
      }
      bankAccountId = newBank.id;
    }

    if (!bankAccountId) {
      return { success: false, error: 'A payout bank account is required.' };
    }

    if (currentUserProfile && !currentUserProfile.icNumber && fields.ic) {
      updateUserProfile(currentUserAccount.id, { icNumber: fields.ic, dateOfBirth: extractDOBFromIC(fields.ic), whatsappNumber: fields.whatsapp });
    } else if (currentUserProfile) {
      updateUserProfile(currentUserAccount.id, { whatsappNumber: fields.whatsapp });
    }

    let recruitedBy: string | undefined = undefined;
    const activeRefCode = referralCode || localStorage.getItem('mp_referral_code') || localStorage.getItem('MP_referral_code');
    if (activeRefCode) {
      const upline = affiliates.find(a => a.code.toUpperCase() === activeRefCode.toUpperCase());
      if (upline) {
        recruitedBy = upline.id;
        setAffiliates(prev => {
          const nextAffs = prev.map(a => {
            if (a.id === upline.id) {
              const updatedUpline = { ...a, conversions: (a.conversions || 0) + 1 };
              if (isSupabaseConfigured) {
                supabaseDb.upsertAffiliates([updatedUpline]).catch(e => {
                  console.error("Failed to update upline conversions in Supabase:", e);
                });
              }
              return updatedUpline;
            }
            return a;
          });
          localStorage.setItem('mp_affiliates', JSON.stringify(nextAffs));
          return nextAffs;
        });
        addAuditLog('Referral Attribution', 'affiliates', upline.id, `Attributed conversion from upgraded registration under code ${activeRefCode}`);
      }
    }

    const uniqueToken = Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const newAff: Affiliate = {
      id: `aff-${uniqueToken}`,
      userId: currentUserAccount.id,
      name: currentUserProfile?.fullName || currentUserAccount.email,
      email: currentUserAccount.email,
      whatsapp: fields.whatsapp,
      code: 'AFX' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      signupDate: new Date().toISOString().split('T')[0],
      tier: 'Bronze',
      unitsSold: 0,
      lifetimeSales: 0,
      lifetimeCommissions: 0,
      bankAccountId,
      recruitedBy
    };

    setAffiliates(prev => [...prev, newAff]);
    if (isSupabaseConfigured) {
      await supabaseDb.upsertAffiliates([newAff]);
    }

    const updatedAcc: UserAccount = { ...currentUserAccount, userType: 'affiliate' };
    setUserAccounts(prev => prev.map(a => a.id === updatedAcc.id ? updatedAcc : a));
    setCurrentUserAccount(updatedAcc);
    if (isSupabaseConfigured) {
      await supabaseDb.upsertUserAccounts([updatedAcc]);
    }

    addAuditLog('Affiliate Upgrade', 'affiliates', newAff.id, `Existing account ${currentUserAccount.email} upgraded to affiliate`);

    return { success: true };
  };

  /**
   * UPGRADE SERVICE: Attach an Agent record to an already-logged-in account.
   * Reuses the existing name/email/IC/bank on file instead of re-collecting them.
   */
  const upgradeToAgent = async (fields: {
    ic: string;
    whatsapp: string;
    tier: TierType;
    bankAccountId?: string;
    newBank?: { bankName: string; bankNo: string; holderName: string };
  }): Promise<{ success: boolean; error?: string; agentId?: string }> => {
    if (!currentUserAccount) {
      return { success: false, error: 'You must be logged in.' };
    }
    if (agents.some(a => a.userId === currentUserAccount.id)) {
      return { success: false, error: 'This account is already registered as an agent.' };
    }

    let bankAccountId = fields.bankAccountId;
    if (!bankAccountId && fields.newBank) {
      const uniqueToken = Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
      const newBank: BankAccount = {
        id: `bnk-agt-${uniqueToken}`,
        userId: currentUserAccount.id,
        accountHolderName: fields.newBank.holderName || currentUserProfile?.fullName || currentUserAccount.email,
        bankName: fields.newBank.bankName,
        accountNumber: fields.newBank.bankNo,
        accountType: 'savings',
        isVerified: false,
        isDefault: !bankAccounts.some(b => b.userId === currentUserAccount.id)
      };
      setBankAccounts(prev => [...prev, newBank]);
      if (isSupabaseConfigured) {
        await supabaseDb.upsertBankAccounts([newBank]);
      }
      bankAccountId = newBank.id;
    }

    if (!bankAccountId) {
      return { success: false, error: 'A payout bank account is required.' };
    }

    if (currentUserProfile && !currentUserProfile.icNumber && fields.ic) {
      updateUserProfile(currentUserAccount.id, { icNumber: fields.ic, dateOfBirth: extractDOBFromIC(fields.ic), whatsappNumber: fields.whatsapp });
    } else if (currentUserProfile) {
      updateUserProfile(currentUserAccount.id, { whatsappNumber: fields.whatsapp });
    }

    let minPurchase = 1000;
    let discount = 0.20;
    let comm = 0.15;
    let initialBtls = 11;
    let maxInv = 100;

    if (fields.tier === 'Silver') {
      minPurchase = 5000;
      discount = 0.30;
      comm = 0.20;
      initialBtls = 59;
      maxInv = 500;
    } else if (fields.tier === 'Gold') {
      minPurchase = 15000;
      discount = 0.40;
      comm = 0.25;
      initialBtls = 176;
      maxInv = -1; // Unlimited
    }

    let recruitedBy: string | undefined = undefined;
    const activeRefCode = referralCode || localStorage.getItem('mp_referral_code') || localStorage.getItem('MP_referral_code');
    if (activeRefCode) {
      const upline = affiliates.find(a => a.code.toUpperCase() === activeRefCode.toUpperCase());
      if (upline) {
        recruitedBy = upline.id;
        setAffiliates(prev => {
          const nextAffs = prev.map(a => {
            if (a.id === upline.id) {
              const updatedUpline = { ...a, conversions: (a.conversions || 0) + 1 };
              if (isSupabaseConfigured) {
                supabaseDb.upsertAffiliates([updatedUpline]).catch(e => {
                  console.error("Failed to update upline conversions in Supabase:", e);
                });
              }
              return updatedUpline;
            }
            return a;
          });
          localStorage.setItem('mp_affiliates', JSON.stringify(nextAffs));
          return nextAffs;
        });
        addAuditLog('Referral Attribution', 'affiliates', upline.id, `Attributed conversion from upgraded registration under code ${activeRefCode}`);
      }
    }

    const uniqueToken = Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const agtId = `agt-${uniqueToken}`;
    const newAgent: Agent = {
      id: agtId,
      userId: currentUserAccount.id,
      agentTier: fields.tier,
      initialStockPurchase: minPurchase,
      stockBalance: initialBtls,
      stockAllocated: initialBtls,
      discountRate: discount,
      commissionRate: comm,
      maxInventory: maxInv,
      bankAccountId,
      verifiedAt: new Date().toISOString(),
      recruitedBy
    };

    const initialLog: AgentStockLog = {
      id: `log-agt-${uniqueToken}`,
      agentId: agtId,
      productId: 'p1',
      quantity: initialBtls,
      action: 'purchase',
      transactionId: `pay-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      notes: `Signup bundle purchase of ${initialBtls} bottles at ${fields.tier} level discount.`,
      createdAt: new Date().toISOString()
    };

    setAgents(prev => [...prev, newAgent]);
    setAgentStockLogs(prev => [initialLog, ...prev]);

    if (isSupabaseConfigured) {
      await supabaseDb.upsertAgents([newAgent]);
      await supabaseDb.upsertAgentStockLogs([initialLog]);
    }

    const updatedAcc: UserAccount = { ...currentUserAccount, userType: 'agent' };
    setUserAccounts(prev => prev.map(a => a.id === updatedAcc.id ? updatedAcc : a));
    setCurrentUserAccount(updatedAcc);
    if (isSupabaseConfigured) {
      await supabaseDb.upsertUserAccounts([updatedAcc]);
    }

    addAuditLog('Agent Upgrade', 'agents', agtId, `Existing account ${currentUserAccount.email} upgraded to ${fields.tier} agent`);

    return { success: true, agentId: agtId };
  };

  /**
   * ADDR SERVICE: Add, Edit, Delete address records
   */
  const addAddress = (fields: Omit<UserAddress, 'id'>) => {
    const newId = `adr-${Date.now().toString().slice(-4)}`;
    const newAddr: UserAddress = { id: newId, ...fields };

    setAddresses(prev => {
      let updated = [...prev];
      if (fields.isDefault) {
        updated = updated.map(a => a.userId === fields.userId ? { ...a, isDefault: false } : a);
      }
      return [...updated, newAddr];
    });

    if (isSupabaseConfigured) {
      supabaseDb.upsertUserAddresses([newAddr]);
    }
  };

  const editAddress = (id: string, fields: Partial<UserAddress>) => {
    setAddresses(prev => {
      let updated = prev.map(a => a.id === id ? { ...a, ...fields } as UserAddress : a);
      if (fields.isDefault) {
        const match = prev.find(a => a.id === id);
        if (match) {
          updated = updated.map(a => (a.userId === match.userId && a.id !== id) ? { ...a, isDefault: false } : a);
        }
      }
      // write back to Supabase
      const altered = updated.find(a => a.id === id);
      if (isSupabaseConfigured && altered) {
        supabaseDb.upsertUserAddresses([altered]);
      }
      return updated;
    });
  };

  const deleteAddress = (id: string) => {
    setAddresses(prev => prev.filter(a => a.id !== id));
  };

  /**
   * BANK SERVICE: Add, Edit, Verify Bank Accounts
   */
  const addBankAccount = (fields: Omit<BankAccount, 'id'>) => {
    const newId = `bnk-${Date.now().toString().slice(-4)}`;
    const newBank: BankAccount = { id: newId, ...fields };

    setBankAccounts(prev => {
      let updated = [...prev];
      if (fields.isDefault) {
        updated = updated.map(b => b.userId === fields.userId ? { ...b, isDefault: false } : b);
      }
      return [...updated, newBank];
    });

    if (isSupabaseConfigured) {
      supabaseDb.upsertBankAccounts([newBank]);
    }
  };

  const editBankAccount = (id: string, fields: Partial<BankAccount>) => {
    setBankAccounts(prev => {
      let updated = prev.map(b => b.id === id ? { ...b, ...fields } as BankAccount : b);
      if (fields.isDefault) {
        const match = prev.find(b => b.id === id);
        if (match) {
          updated = updated.map(b => (b.userId === match.userId && b.id !== id) ? { ...b, isDefault: false } : b);
        }
      }
      const altered = updated.find(b => b.id === id);
      if (isSupabaseConfigured && altered) {
        supabaseDb.upsertBankAccounts([altered]);
      }
      return updated;
    });
  };

  const verifyBankAccount = (id: string) => {
    setBankAccounts(prev => {
      const updated = prev.map(b => b.id === id ? { ...b, isVerified: true } : b);
      const target = updated.find(b => b.id === id);
      if (isSupabaseConfigured && target) {
        supabaseDb.upsertBankAccounts([target]);
      }
      return updated;
    });
    addAuditLog('Verify Bank Account', 'bank_accounts', id, 'is_verified transitions to true');
  };

  /**
   * INVENTORY AGENTS SERVICE: Purchase additional agent bulk stocks
   */
  const purchaseAgentStock = (agentId: string, productId: string, quantity: number, notes?: string) => {
    setAgents(prev => {
      const updated = prev.map(agt => {
        if (agt.id === agentId) {
          const nextBal = agt.stockBalance + quantity;
          const nextAlloc = agt.stockAllocated + quantity;
          const updatedAgt = { ...agt, stockBalance: nextBal, stockAllocated: nextAlloc };
          
          if (isSupabaseConfigured) {
            supabaseDb.upsertAgents([updatedAgt]);
          }
          return updatedAgt;
        }
        return agt;
      });
      return updated;
    });

    const newLog: AgentStockLog = {
      id: `log-stock-${Date.now().toString().slice(-4)}`,
      agentId,
      productId,
      quantity,
      action: 'purchase',
      transactionId: `bulk-add-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      notes: notes || 'HQ Restock distribution purchase.',
      createdAt: new Date().toISOString()
    };

    setAgentStockLogs(prev => [newLog, ...prev]);
    if (isSupabaseConfigured) {
      supabaseDb.upsertAgentStockLogs([newLog]);
    }
  };

  /**
   * WEBSITE DYNAMIC CMS WRIPOUT
   */
  const updateCMSConfig = (config: WebsiteConfig) => {
    setWebsiteConfig(config);
    if (isSupabaseConfigured) {
      supabaseDb.updateWebsiteConfig(config);
    }
    addAuditLog('Update CMS Config', 'website_config', 'default', JSON.stringify(config));
  };

  const upsertCMSPage = (page: WebsitePage) => {
    setWebsitePages(prev => {
      const index = prev.findIndex(p => p.id === page.id);
      let updated;
      if (index > -1) {
        updated = prev.map(p => p.id === page.id ? page : p);
      } else {
        updated = [...prev, page];
      }
      if (isSupabaseConfigured) {
        supabaseDb.upsertWebsitePages([page]);
      }
      return updated;
    });
    addAuditLog('Update Website Page', 'website_pages', page.slug, page.title);
  };

  // Shopper Cart Utilities
  const addToCart = (productId: string, quantity: number) => {
    setCart(prev => {
      const prod = products.find(p => p.id === productId);
      if (!prod) return prev;

      const existingIndex = prev.findIndex(item => item.product.id === productId);
      if (existingIndex > -1) {
        const nextCart = [...prev];
        const newQty = nextCart[existingIndex].quantity + quantity;
        nextCart[existingIndex].quantity = Math.min(newQty, prod.stock);
        return nextCart;
      } else {
        return [...prev, { product: prod, quantity: Math.min(quantity, prod.stock) }];
      }
    });
  };

  const updateCartQty = (productId: string, quantity: number) => {
    setCart(prev => {
      const prod = products.find(p => p.id === productId);
      if (!prod) return prev;
      return prev.map(item => {
        if (item.product.id === productId) {
          return { ...item, quantity: Math.max(1, Math.min(quantity, prod.stock)) };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  /**
   * CORE CHECKOUT FLOW - Double checks inventory, referral commissions, agent logs, and updates DB
   */
  const checkout = (details: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: string;
    isGuest?: boolean;
    agentId?: string; // buy from specific agent's micro-stock
  }) => {
    if (cart.length === 0) {
      return { success: false, error: 'Shopping cart is empty' };
    }

    // Verify stock availability
    if (details.agentId) {
      const targetAgent = agents.find(g => g.id === details.agentId);
      if (!targetAgent) {
        return { success: false, error: 'Target agent micro-seller not found.' };
      }
      const cartTotalQty = cart.reduce((acc, it) => acc + it.quantity, 0);
      if (targetAgent.stockBalance < cartTotalQty) {
        return { success: false, error: `Inadequate micro-stock. Only ${targetAgent.stockBalance} bottles available in this agent's store.` };
      }
    } else {
      for (const item of cart) {
        const currentProd = products.find(p => p.id === item.product.id);
        if (!currentProd || currentProd.stock < item.quantity) {
          return { success: false, error: `Inadequate main branch stock for ${item.product.name}.` };
        }
      }
    }

    const orderId = `ord-${Date.now().toString().slice(-4)}`;
    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

    let orderReferralCode = referralCode || undefined;
    let orderAffiliateId = undefined;
    let commissionAmt = 0;

    if (orderReferralCode) {
      const affiliate = affiliates.find(a => a.code.toUpperCase() === orderReferralCode?.toUpperCase().trim());
      if (affiliate) {
        orderAffiliateId = affiliate.id;
        const currentRate = getCommissionRate(affiliate.tier);
        commissionAmt = parseFloat((subtotal * currentRate).toFixed(2));
      } else {
        orderReferralCode = undefined;
      }
    }

    const orderItems = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      price: item.product.price
    }));

    const newOrder: Order = {
      id: orderId,
      customerName: details.customerName,
      customerEmail: details.customerEmail,
      customerPhone: details.customerPhone,
      shippingAddress: details.shippingAddress,
      branchId: selectedBranchId,
      items: orderItems,
      total: subtotal,
      referralCode: orderReferralCode,
      affiliateCommission: commissionAmt > 0 ? commissionAmt : undefined,
      affiliateId: orderAffiliateId,
      agentId: details.agentId,
      commissionPaid: false,
      paymentStatus: 'Paid',
      fulfillmentStatus: 'Processing',
      createdAt: new Date().toISOString()
    };

    // Update main inventories if HQ order
    if (!details.agentId) {
      setProducts(prev => {
        const updated = prev.map(p => {
          const cartMatch = cart.find(item => item.product.id === p.id);
          return cartMatch ? { ...p, stock: Math.max(0, p.stock - cartMatch.quantity) } : p;
        });
        if (isSupabaseConfigured) supabaseDb.upsertProducts(updated);
        return updated;
      });
    } else {
      // Decrement micro stock from agent allocation
      setAgents(prev => {
        const updated = prev.map(agt => {
          if (agt.id === details.agentId) {
            const nextBal = Math.max(0, agt.stockBalance - totalQty);
            const updatedAgt = { ...agt, stockBalance: nextBal };
            if (isSupabaseConfigured) {
              supabaseDb.upsertAgents([updatedAgt]);
            }
            return updatedAgt;
          }
          return agt;
        });
        return updated;
      });

      // Log the Stock Log Sale
      cart.forEach(item => {
        const itemLog: AgentStockLog = {
          id: `log-sale-${Date.now().toString().slice(-4)}-${item.product.id}`,
          agentId: details.agentId!,
          productId: item.product.id,
          quantity: -item.quantity,
          action: 'sale',
          transactionId: orderId,
          notes: `Retail sales order fulfillment #${orderId}.`,
          createdAt: new Date().toISOString()
        };
        setAgentStockLogs(prev => [itemLog, ...prev]);
        if (isSupabaseConfigured) {
          supabaseDb.upsertAgentStockLogs([itemLog]);
        }
      });
    }

    // Allocate referral rewards
    if (orderAffiliateId) {
      setAffiliates(prev => {
        const updated = prev.map(aff => {
          if (aff.id === orderAffiliateId) {
            const newUnitsSold = aff.unitsSold + totalQty;
            const newLifetimeSales = aff.lifetimeSales + subtotal;
            const newLifetimeCommissions = aff.lifetimeCommissions + commissionAmt;
            const newTier = getTierFromUnits(newUnitsSold);

            return {
              ...aff,
              unitsSold: newUnitsSold,
              lifetimeSales: newLifetimeSales,
              lifetimeCommissions: parseFloat(newLifetimeCommissions.toFixed(2)),
              tier: newTier
            };
          }
          return aff;
        });
        if (isSupabaseConfigured) supabaseDb.upsertAffiliates(updated);
        return updated;
      });
    }

    setOrders(prev => {
      const updated = [newOrder, ...prev];
      if (isSupabaseConfigured) supabaseDb.upsertOrders([newOrder]);
      return updated;
    });

    clearCart();
    return { success: true, orderId };
  };

  /**
   * ADMINISTRATION PORTAL ACTIONS
   */
  const verifyIC = (profileId: string) => {
    setUserProfiles(prev => {
      const updated = prev.map(p => p.id === profileId ? { ...p, icVerified: true } : p);
      const altered = updated.find(p => p.id === profileId);
      if (isSupabaseConfigured && altered) {
        supabaseDb.upsertUserProfiles([altered]);
      }
      return updated;
    });
    addAuditLog('Verify IC (MyKAD)', 'user_profiles', profileId, 'icVerified transitions to true');
  };

  const updateUserStatus = (accountId: string, status: UserStatus) => {
    setUserAccounts(prev => {
      const updated = prev.map(a => a.id === accountId ? { ...a, status } : a);
      const altered = updated.find(a => a.id === accountId);
      if (isSupabaseConfigured && altered) {
        supabaseDb.upsertUserAccounts([altered]);
      }
      return updated;
    });
    addAuditLog('Update User Status', 'user_accounts', accountId, `Account status changed to ${status}`);
  };

  const updateUserRole = (accountId: string, userType: UserAccount['userType']) => {
    setUserAccounts(prev => {
      const updated = prev.map(a => a.id === accountId ? { ...a, userType } : a);
      const altered = updated.find(a => a.id === accountId);
      if (isSupabaseConfigured && altered) {
        supabaseDb.upsertUserAccounts([altered]);
      }
      return updated;
    });
    addAuditLog('Update User Role', 'user_accounts', accountId, `Account type changed to ${userType}`);
  };

  const updateUserProfile = (userId: string, updates: Partial<UserProfile>) => {
    setUserProfiles(prev => {
      const updated = prev.map(p => p.userId === userId ? { ...p, ...updates } : p);
      const altered = updated.find(p => p.userId === userId);
      if (isSupabaseConfigured && altered) {
        supabaseDb.upsertUserProfiles([altered]);
      }
      return updated;
    });
    addAuditLog('Update User Profile', 'user_profiles', userId, `Updated fields: ${Object.keys(updates).join(', ')}`);
  };

  const deleteUserAccount = (accountId: string) => {
    setUserAccounts(prev => prev.filter(a => a.id !== accountId));
    setUserProfiles(prev => prev.filter(p => p.userId !== accountId));
    setAddresses(prev => prev.filter(adr => adr.userId !== accountId));
    setBankAccounts(prev => prev.filter(bnk => bnk.userId !== accountId));
    setAffiliates(prev => prev.filter(aff => aff.userId !== accountId));
    setAgents(prev => prev.filter(agt => agt.userId !== accountId));
    
    if (isSupabaseConfigured) {
      supabaseDb.deleteUserAccount(accountId).catch(e => {
        console.error("Failed to delete user account from Supabase:", e);
      });
    }

    addAuditLog('Delete User Account', 'user_accounts', accountId, `User account and associated records deleted`);
  };

  const adminCreateUserAccount = (fields: {
    email: string;
    userType: UserAccount['userType'];
    status: UserStatus;
    fullName: string;
    icNumber?: string;
    phoneNumber?: string;
    whatsappNumber?: string;
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
  }) => {
    const accountId = `acc-${Date.now().toString().slice(-6)}`;
    const newAcc: UserAccount = {
      id: accountId,
      email: fields.email,
      userType: fields.userType,
      status: fields.status,
      createdAt: new Date().toISOString()
    };
    
    const profileId = `prof-${Date.now().toString().slice(-6)}`;
    const newProfile: UserProfile = {
      id: profileId,
      userId: accountId,
      fullName: fields.fullName,
      icNumber: fields.icNumber || '',
      icVerified: fields.icNumber ? true : false,
      phoneNumber: fields.phoneNumber || '',
      whatsappNumber: fields.whatsappNumber || '',
      dateOfBirth: fields.icNumber && fields.icNumber.length >= 6 ? `19${fields.icNumber.slice(0, 2)}-${fields.icNumber.slice(2, 4)}-${fields.icNumber.slice(4, 6)}` : undefined
    };

    setUserAccounts(prev => [...prev, newAcc]);
    setUserProfiles(prev => [...prev, newProfile]);

    if (fields.bankName && fields.accountNumber) {
      const bankId = `bnk-${Date.now().toString().slice(-6)}`;
      const newBank: BankAccount = {
        id: bankId,
        userId: accountId,
        accountHolderName: fields.accountHolderName || fields.fullName,
        bankName: fields.bankName,
        accountNumber: fields.accountNumber,
        accountType: 'savings',
        isVerified: true,
        isDefault: true
      };
      setBankAccounts(prev => [...prev, newBank]);
    }

    if (isSupabaseConfigured) {
      supabaseDb.upsertUserAccounts([newAcc]);
      supabaseDb.upsertUserProfiles([newProfile]);
    }

    // if affiliate or agent, add representation
    if (fields.userType === 'affiliate') {
      const newAff: Affiliate = {
        id: `aff-${accountId.slice(-4)}`,
        userId: accountId,
        name: fields.fullName,
        email: fields.email,
        whatsapp: fields.whatsappNumber || '',
        code: (fields.fullName.split(' ')[0] || 'REF').toUpperCase() + accountId.slice(-4),
        signupDate: new Date().toISOString(),
        tier: 'Bronze',
        unitsSold: 0,
        lifetimeSales: 0,
        lifetimeCommissions: 0,
        status: fields.status === 'active' ? 'active' : 'suspended'
      };
      setAffiliates(prev => [...prev, newAff]);
    } else if (fields.userType === 'agent') {
      const newAgt: Agent = {
        id: `agt-${accountId.slice(-4)}`,
        userId: accountId,
        agentTier: 'Bronze',
        initialStockPurchase: 0,
        stockBalance: 0,
        stockAllocated: 0,
        discountRate: 0.20,
        commissionRate: 0.15,
        maxInventory: 100,
        status: fields.status === 'active' ? 'active' : 'suspended',
        createdAt: new Date().toISOString()
      };
      setAgents(prev => [...prev, newAgt]);
    }

    addAuditLog('Admin Create User', 'user_accounts', accountId, `Created ${fields.userType} account for ${fields.fullName}`);
    return { success: true, accountId };
  };

  const addAuditLog = (action: string, targetType: string, targetId: string, changes: string) => {
    const newLog: AuditLog = {
      id: `adt-${Date.now().toString().slice(-4)}`,
      adminId: currentUserAccount?.id || 'sys',
      adminName: currentUserProfile?.fullName || 'System',
      action,
      targetType,
      targetId,
      changes,
      createdAt: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
    if (isSupabaseConfigured) {
      supabaseDb.createAuditLog(newLog);
    }
  };

  const updateOrderStatus = (orderId: string, paymentStatus: Order['paymentStatus'], fulfillmentStatus: Order['fulfillmentStatus']) => {
    setOrders(prev => {
      const nextOrders = prev.map(ord => {
        if (ord.id === orderId) {
          const nextOrd = { ...ord, paymentStatus, fulfillmentStatus };
          if (isSupabaseConfigured) supabaseDb.upsertOrders([nextOrd]);
          return nextOrd;
        }
        return ord;
      });
      return nextOrders;
    });
    addAuditLog('Update Order Status', 'orders', orderId, `Payment: ${paymentStatus}, Fulfillment: ${fulfillmentStatus}`);
  };

  const toggleCommissionPaid = (orderId: string) => {
    setOrders(prev => {
      const updated = prev.map(ord => {
        if (ord.id === orderId) {
          const nextOrd = { ...ord, commissionPaid: !ord.commissionPaid };
          if (isSupabaseConfigured) supabaseDb.upsertOrders([nextOrd]);
          return nextOrd;
        }
        return ord;
      });
      return updated;
    });
    addAuditLog('Toggle Commission Payout', 'orders', orderId, 'commissionPaid state inversion');
  };

  const restockProduct = (productId: string, quantity: number) => {
    setProducts(prev => {
      const updated = prev.map(p => p.id === productId ? { ...p, stock: p.stock + quantity } : p);
      if (isSupabaseConfigured) supabaseDb.upsertProducts(updated);
      return updated;
    });
    addAuditLog('HQ Main Stock Insertion', 'products', productId, `Restocked ${quantity} bottles`);
  };

  const addMockOrder = (order: Order) => {
    setOrders(prev => {
      const updated = [order, ...prev];
      if (isSupabaseConfigured) supabaseDb.upsertOrders([order]);
      return updated;
    });
  };

  const seedSupabase = async () => {
    const res = await supabaseDb.seedBaselineData(
      DEFAULT_PRODUCTS,
      DEFAULT_AFFILIATES,
      DEFAULT_ORDERS,
      DEFAULT_ACCOUNTS,
      DEFAULT_PROFILES,
      DEFAULT_ADDRESSES,
      DEFAULT_BANK_ACCOUNTS,
      DEFAULT_AGENTS,
      DEFAULT_STOCK_LOGS,
      DEFAULT_CMS_PAGES
    );
    if (res.success) {
      setUserAccounts(DEFAULT_ACCOUNTS);
      setUserProfiles(DEFAULT_PROFILES);
      setAddresses(DEFAULT_ADDRESSES);
      setBankAccounts(DEFAULT_BANK_ACCOUNTS);
      setProducts(DEFAULT_PRODUCTS);
      setAffiliates(DEFAULT_AFFILIATES);
      setAgents(DEFAULT_AGENTS);
      setAgentStockLogs(DEFAULT_STOCK_LOGS);
      setOrders(DEFAULT_ORDERS);
      setWebsiteConfig(DEFAULT_CMS_CONFIG);
      setWebsitePages(DEFAULT_CMS_PAGES);
      setSupabaseConnected(true);
    }
    return res;
  };

  const addProduct = async (product: Product): Promise<{ success: boolean; error?: string }> => {
    const newProduct: Product = {
      ...product,
      sku: product.sku || `MAD-TU-${Math.floor(Math.random()*1000)}`,
      status: product.status || 'draft',
      createdAt: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      const ok = await supabaseDb.upsertProducts([newProduct]);
      if (!ok) {
        return { success: false, error: `Failed to save "${newProduct.name}" to Supabase. The product was not added.` };
      }
    }

    setProducts(prev => [...prev, newProduct]);

    setInventory(prev => {
      const newItems = branches.map(branch => ({
        id: `inv-${Date.now()}-${branch.id}-${Math.floor(Math.random()*1000)}`,
        productId: newProduct.id,
        warehouseId: branch.id,
        quantityOnHand: 0,
        quantityReserved: 0,
        quantityAvailable: 0,
        reorderLevel: 20,
        reorderQuantity: 50,
        isLowStock: true
      }));
      return [...prev, ...newItems];
    });

    addAuditLog('Product Created', 'products', newProduct.id, `New SKU: ${newProduct.sku}`);
    return { success: true };
  };

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<{ success: boolean; error?: string }> => {
    const current = products.find(p => p.id === id);
    if (!current) {
      return { success: false, error: 'Product not found.' };
    }

    const updatedProduct: Product = { ...current, ...updates };

    if (isSupabaseConfigured) {
      const ok = await supabaseDb.upsertProducts([updatedProduct]);
      if (!ok) {
        return { success: false, error: `Failed to save changes to "${current.name}" to Supabase. No changes were applied.` };
      }
    }

    setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));

    if (updates.price !== undefined && updates.price !== current.price) {
      setPricingHistory(prev => [
        {
          id: `prh-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          productId: id,
          oldPrice: current.price,
          newPrice: updates.price!,
          changeReason: updates.discountPercentage ? 'Campaign Discount Activation' : 'Administrative Cost Adjustment',
          effectiveDate: new Date().toISOString(),
          changedBy: currentUserAccount?.id || 'acc-admin',
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);
    }

    if (updates.stock !== undefined) {
      setInventory(prev => {
        return prev.map(item => {
          if (item.productId === id && item.warehouseId === 'b1') {
            const newOnHand = updates.stock!;
            return {
              ...item,
              quantityOnHand: newOnHand,
              quantityAvailable: Math.max(0, newOnHand - item.quantityReserved),
              isLowStock: newOnHand < item.reorderLevel,
              isOutOfStock: newOnHand === 0
            };
          }
          return item;
        });
      });
    }

    addAuditLog('Product Updated', 'products', id, JSON.stringify(updates));
    return { success: true };
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== id);
      if (isSupabaseConfigured) {
        try { supabaseDb.deleteProduct(id); } catch (e) { console.error(e); }
      }
      return updated;
    });

    setInventory(prev => prev.filter(item => item.productId !== id));
    addAuditLog('Product Deleted', 'products', id, 'Deleted from registry');
  };

  const duplicateProduct = (
    id: string,
    name: string,
    newSku: string,
    copyFlags: { images: boolean; desc: boolean; price: boolean; specs: boolean; stock: boolean }
  ) => {
    const original = products.find(p => p.id === id);
    if (!original) return;

    const newProductId = `p-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const newProduct: Product = {
      id: newProductId,
      name,
      category: original.category,
      price: copyFlags.price ? original.price : 0,
      description: copyFlags.desc ? original.description : '',
      stock: copyFlags.stock ? original.stock : 0,
      image: copyFlags.images ? original.image : 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400',
      images: copyFlags.images ? (original.images || [original.image].filter(Boolean)) : [],
      volume: original.volume,
      
      sku: newSku,
      costPrice: copyFlags.price ? original.costPrice : 0,
      longDescription: copyFlags.desc ? original.longDescription : '',
      weight: copyFlags.specs ? original.weight : 0,
      dimensions: copyFlags.specs ? original.dimensions : '',
      barcode: `BAR-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      status: 'draft',
      isHalalCertified: original.isHalalCertified,
      halalCertNumber: original.halalCertNumber,
      isBumiputera: original.isBumiputera,
      healthWarning: original.healthWarning,
      createdAt: new Date().toISOString()
    };

    setProducts(prev => {
      const updated = [...prev, newProduct];
      if (isSupabaseConfigured) {
        try { supabaseDb.upsertProducts(updated); } catch (e) { console.error(e); }
      }
      return updated;
    });

    setInventory(prev => {
      const newSlots = branches.map(branch => {
        const matchingOrigSlot = inventory.find(slot => slot.productId === id && slot.warehouseId === branch.id);
        const stockQty = (copyFlags.stock && matchingOrigSlot) ? matchingOrigSlot.quantityOnHand : 0;
        return {
          id: `inv-${Date.now()}-${branch.id}-${Math.floor(Math.random()*1000)}`,
          productId: newProductId,
          warehouseId: branch.id,
          quantityOnHand: stockQty,
          quantityReserved: 0,
          quantityAvailable: stockQty,
          reorderLevel: matchingOrigSlot ? matchingOrigSlot.reorderLevel : 20,
          reorderQuantity: matchingOrigSlot ? matchingOrigSlot.reorderQuantity : 50,
          isLowStock: stockQty < (matchingOrigSlot ? matchingOrigSlot.reorderLevel : 20)
        };
      });
      return [...prev, ...newSlots];
    });

    addAuditLog('Product Duplicated', 'products', id, `Cloned into new SKU ${newSku}`);
  };

  const recordStockMovement = async (
    productId: string,
    warehouseId: string,
    movementType: StockMovementType,
    quantity: number,
    reason: string,
    refNum?: string,
    notes?: string,
    fromId?: string,
    toId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) {
      return { success: false, error: 'Product not found.' };
    }

    // The product's stock is the single source of truth for the catalog/checkout — apply the
    // movement as a direct delta on it. (Deriving it by summing per-warehouse InventoryItem rows
    // is unreliable because branches/warehouses have no creation UI, so that ledger is normally empty.)
    const newStock = Math.max(0, targetProduct.stock + quantity);
    const updatedProduct: Product = { ...targetProduct, stock: newStock };

    if (isSupabaseConfigured) {
      const ok = await supabaseDb.upsertProducts([updatedProduct]);
      if (!ok) {
        return { success: false, error: `Failed to sync stock update for "${targetProduct.name}" to Supabase. No changes were applied.` };
      }
    }

    const movementId = `mv-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const newMovement: StockMovement = {
      id: movementId,
      productId,
      warehouseId,
      movementType,
      quantity,
      reason,
      referenceNumber: refNum,
      notes,
      fromWarehouseId: fromId,
      toWarehouseId: toId,
      createdBy: currentUserAccount?.id || 'acc-admin',
      createdAt: new Date().toISOString()
    };

    setStockMovements(prev => [newMovement, ...prev]);
    setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));

    // Upsert (create-if-missing) the matching warehouse's inventory ledger row so the Inventory
    // tab reflects this movement too — this is a secondary, local-only display ledger and does
    // not drive the product's stock figure above.
    let resultingItemQty = 0;
    let resultingReorderLevel = 20;
    setInventory(prev => {
      const idx = prev.findIndex(item => item.productId === productId && item.warehouseId === warehouseId);
      if (idx === -1) {
        resultingItemQty = Math.max(0, quantity);
        const newItem: InventoryItem = {
          id: `inv-${Date.now()}-${warehouseId}-${Math.floor(Math.random()*1000)}`,
          productId,
          warehouseId,
          quantityOnHand: resultingItemQty,
          quantityReserved: 0,
          quantityAvailable: resultingItemQty,
          reorderLevel: resultingReorderLevel,
          reorderQuantity: 50,
          isLowStock: resultingItemQty < resultingReorderLevel,
          isOutOfStock: resultingItemQty === 0
        };
        return [...prev, newItem];
      }
      return prev.map((item, i) => {
        if (i !== idx) return item;
        const newOnHand = Math.max(0, item.quantityOnHand + quantity);
        resultingItemQty = newOnHand;
        resultingReorderLevel = item.reorderLevel;
        return {
          ...item,
          quantityOnHand: newOnHand,
          quantityAvailable: Math.max(0, newOnHand - item.quantityReserved),
          isLowStock: newOnHand < item.reorderLevel,
          isOutOfStock: newOnHand === 0
        };
      });
    });

    if (resultingItemQty === 0) {
      setStockAlerts(prev => [
        {
          id: `al-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          productId,
          warehouseId,
          alertType: 'out_of_stock',
          currentQuantity: 0,
          thresholdValue: resultingReorderLevel,
          isResolved: false,
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);
    } else if (resultingItemQty < resultingReorderLevel) {
      setStockAlerts(prev => [
        {
          id: `al-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          productId,
          warehouseId,
          alertType: 'low_stock',
          currentQuantity: resultingItemQty,
          thresholdValue: resultingReorderLevel,
          isResolved: false,
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);
    }

    addAuditLog('Stock Movement Logged', 'inventory', productId, `${movementType}: ${quantity} units`);
    return { success: true };
  };

  const bulkStockChange = async (
    changes: { productId: string; quantity: number }[],
    warehouseId: string,
    movementType: StockMovementType,
    reason: string,
    refNum?: string
  ): Promise<{ success: boolean; error?: string; failedCount?: number }> => {
    const failures: string[] = [];
    for (const change of changes) {
      const result = await recordStockMovement(
        change.productId,
        warehouseId,
        movementType,
        change.quantity,
        reason,
        refNum,
        'Bulk Stock Change operation'
      );
      if (!result.success) {
        failures.push(result.error || change.productId);
      }
    }

    if (failures.length > 0) {
      return {
        success: false,
        error: `${failures.length} of ${changes.length} stock updates failed to sync to Supabase: ${failures.join('; ')}`,
        failedCount: failures.length
      };
    }
    return { success: true };
  };

  const bulkPricesChange = (
    productIds: string[],
    type: 'fixed' | 'percentage',
    changeAmount: number,
    reason: string
  ) => {
    productIds.forEach(id => {
      const current = products.find(p => p.id === id);
      if (!current) return;
      
      let newPrice = current.price;
      if (type === 'fixed') {
        newPrice = Math.max(1, current.price + changeAmount);
      } else {
        newPrice = Math.max(1, current.price * (1 + changeAmount / 100));
      }
      
      updateProduct(id, { price: parseFloat(newPrice.toFixed(2)) });
    });
  };

  const bulkStatusChange = (productIds: string[], status: 'active' | 'inactive') => {
    productIds.forEach(id => {
      updateProduct(id, { status });
    });
  };

  const bulkDeleteProducts = (productIds: string[]) => {
    setProducts(prev => {
      const updated = prev.filter(p => !productIds.includes(p.id));
      if (isSupabaseConfigured) {
        try { supabaseDb.deleteProducts(productIds); } catch (e) { console.error(e); }
      }
      return updated;
    });

    setInventory(prev => prev.filter(item => !productIds.includes(item.productId)));
    productIds.forEach(id => {
      addAuditLog('Product Deleted', 'products', id, 'Deleted from registry in bulk');
    });
  };

  const updateAffiliate = (id: string, updates: Partial<Affiliate>) => {
    setAffiliates(prev => {
      const updated = prev.map(aff => {
        if (aff.id === id) {
          const nextAff = { ...aff, ...updates };
          if (isSupabaseConfigured) {
            try { supabaseDb.upsertAffiliates([nextAff]); } catch (e) { console.error(e); }
          }
          return nextAff;
        }
        return aff;
      });
      localStorage.setItem('mp_affiliates', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Update Affiliate', 'affiliates', id, JSON.stringify(updates));
  };

  const updateAgent = (id: string, updates: Partial<Agent>) => {
    setAgents(prev => {
      const updated = prev.map(agt => {
        if (agt.id === id) {
          const nextAgt = { ...agt, ...updates };
          if (isSupabaseConfigured) {
            try { supabaseDb.upsertAgents([nextAgt]); } catch (e) { console.error(e); }
          }
          return nextAgt;
        }
        return agt;
      });
      localStorage.setItem('mp_agents', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Update Agent', 'agents', id, JSON.stringify(updates));
  };

  const addAffiliate = (aff: Affiliate) => {
    setAffiliates(prev => {
      const updated = [...prev, aff];
      localStorage.setItem('mp_affiliates', JSON.stringify(updated));
      if (isSupabaseConfigured) {
        try { supabaseDb.upsertAffiliates([aff]); } catch (e) { console.error(e); }
      }
      return updated;
    });
    addAuditLog('Add Affiliate', 'affiliates', aff.id, JSON.stringify(aff));
  };

  const addAgent = (agt: Agent) => {
    setAgents(prev => {
      const updated = [...prev, agt];
      localStorage.setItem('mp_agents', JSON.stringify(updated));
      if (isSupabaseConfigured) {
        try { supabaseDb.upsertAgents([agt]); } catch (e) { console.error(e); }
      }
      return updated;
    });
    addAuditLog('Add Agent', 'agents', agt.id, JSON.stringify(agt));
  };

  const addRecruitmentInvite = async (invite: Omit<RecruitmentInvite, 'id' | 'createdAt'>): Promise<RecruitmentInvite> => {
    const newInvite: RecruitmentInvite = {
      ...invite,
      id: `inv-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString()
    };
    setRecruitmentInvites(prev => {
      const updated = [newInvite, ...prev];
      return updated;
    });
    if (isSupabaseConfigured) {
      await supabaseDb.upsertRecruitmentInvites([newInvite]).catch(e => {
        console.error("Failed to upsert recruitment invite to Supabase:", e);
      });
    }
    addAuditLog('Recruitment Invite Created', 'recruitment_invites', newInvite.id, JSON.stringify(invite));
    return newInvite;
  };

  const addCampaign = async (campaign: Omit<Campaign, 'id' | 'createdAt'>): Promise<Campaign> => {
    const newCampaign: Campaign = {
      ...campaign,
      id: `cmp-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString()
    };
    setCampaigns(prev => {
      const updated = [newCampaign, ...prev];
      return updated;
    });
    if (isSupabaseConfigured) {
      await supabaseDb.upsertCampaigns([newCampaign]).catch(e => {
        console.error("Failed to upsert campaign to Supabase:", e);
      });
    }
    addAuditLog('Campaign Broadcast Created', 'campaigns', newCampaign.id, JSON.stringify(campaign));
    return newCampaign;
  };

  const resetToDefaults = () => {
    setUserAccounts(DEFAULT_ACCOUNTS);
    setUserProfiles(DEFAULT_PROFILES);
    setAddresses(DEFAULT_ADDRESSES);
    setBankAccounts(DEFAULT_BANK_ACCOUNTS);
    setProducts(DEFAULT_PRODUCTS);
    setAffiliates(DEFAULT_AFFILIATES);
    setAgents(DEFAULT_AGENTS);
    setAgentStockLogs(DEFAULT_STOCK_LOGS);
    setOrders(DEFAULT_ORDERS);
    setWebsiteConfig(DEFAULT_CMS_CONFIG);
    setWebsitePages(DEFAULT_CMS_PAGES);
    setInventory(DEFAULT_INVENTORY);
    setStockMovements(DEFAULT_STOCK_MOVEMENTS);
    setStockAlerts(DEFAULT_STOCK_ALERTS);
    setPricingHistory(DEFAULT_PRICING_HISTORY);
    setVariants(DEFAULT_VARIANTS);
    setSuppliers(DEFAULT_SUPPLIERS);
    setCategories(DEFAULT_CATEGORIES);
    setBranches(DEFAULT_BRANCHES);
    setCurrentUserAccount(null);
    setCurrentUserProfile(null);
    setCart([]);
    setReferralCode(null);
    setSelectedBranchId(DEFAULT_BRANCHES[0]?.id || '');

    // Wipe cached items
    const keys = [
      'mp_accounts', 'mp_profiles', 'mp_addresses', 'mp_bank_accounts', 'mp_products',
      'mp_affiliates', 'mp_agents', 'mp_stock_logs', 'mp_orders', 'mp_website_config',
      'mp_website_pages', 'mp_current_account', 'mp_current_profile', 'mp_cart', 'mp_referral_code',
      'mp_inventory_items', 'mp_stock_movements', 'mp_stock_alerts', 'mp_pricing_history',
      'mp_variants', 'mp_suppliers', 'mp_categories', 'mp_branches'
    ];
    keys.forEach(k => localStorage.removeItem(k));

    if (isSupabaseConfigured) {
      try {
        supabaseDb.upsertUserAccounts(DEFAULT_ACCOUNTS);
        supabaseDb.upsertUserProfiles(DEFAULT_PROFILES);
        supabaseDb.upsertUserAddresses(DEFAULT_ADDRESSES);
        supabaseDb.upsertBankAccounts(DEFAULT_BANK_ACCOUNTS);
        supabaseDb.upsertProducts(DEFAULT_PRODUCTS);
        supabaseDb.upsertAffiliates(DEFAULT_AFFILIATES);
        supabaseDb.upsertAgents(DEFAULT_AGENTS);
        supabaseDb.upsertAgentStockLogs(DEFAULT_STOCK_LOGS);
        supabaseDb.upsertOrders(DEFAULT_ORDERS);
        supabaseDb.updateWebsiteConfig(DEFAULT_CMS_CONFIG);
        supabaseDb.upsertWebsitePages(DEFAULT_CMS_PAGES);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUserAccount,
        currentUserProfile,
        userAccounts,
        userProfiles,
        addresses,
        bankAccounts,
        products,
        affiliates,
        agents,
        agentStockLogs,
        orders,
        branches,
        websiteConfig,
        websitePages,
        auditLogs,
        inventory,
        stockMovements,
        stockAlerts,
        pricingHistory,
        variants,
        suppliers,
        categories,
        setInventory,
        setStockMovements,
        setStockAlerts,
        setPricingHistory,
        setVariants,
        setSuppliers,
        setCategories,
        addProduct,
        updateProduct,
        deleteProduct,
        duplicateProduct,
        recordStockMovement,
        bulkStockChange,
        bulkPricesChange,
        bulkStatusChange,
        bulkDeleteProducts,
        cart,
        referralCode,
        selectedBranchId,
        language,
        supabaseConnected,
        supabaseLoading,
        setReferralCode,
        setSelectedBranchId,
        setLanguage,
        login,
        setPassword,
        registerCustomer,
        registerAffiliateEx,
        registerAgentEx,
        upgradeToAffiliate,
        upgradeToAgent,
        logout,
        addAddress,
        editAddress,
        deleteAddress,
        addBankAccount,
        editBankAccount,
        verifyBankAccount,
        purchaseAgentStock,
        updateCMSConfig,
        upsertCMSPage,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        checkout,
        verifyIC,
        addAuditLog,
        updateUserStatus,
        updateUserRole,
        updateUserProfile,
        deleteUserAccount,
        adminCreateUserAccount,
        updateOrderStatus,
        toggleCommissionPaid,
        restockProduct,
        addMockOrder,
        updateAffiliate,
        updateAgent,
        addAffiliate,
        addAgent,
        recruitmentInvites,
        campaigns,
        addRecruitmentInvite,
        addCampaign,
        resetToDefaults,
        seedSupabase
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
};
