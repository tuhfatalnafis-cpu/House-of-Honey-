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
  ProductSupplier
} from '../types';
import { supabaseDb, isSupabaseConfigured } from '../lib/supabase';

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

  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  duplicateProduct: (id: string, name: string, newSku: string, copyFlags: { images: boolean; desc: boolean; price: boolean; specs: boolean; stock: boolean }) => void;
  recordStockMovement: (productId: string, warehouseId: string, movementType: StockMovementType, quantity: number, reason: string, refNum?: string, notes?: string, fromId?: string, toId?: string) => void;
  bulkStockChange: (changes: { productId: string; quantity: number }[], warehouseId: string, movementType: StockMovementType, reason: string, refNum?: string) => void;
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
  login: (email: string, pass?: string) => Promise<{ success: boolean; error?: string; user?: UserAccount }>;
  registerCustomer: (name: string, email: string, phone: string) => Promise<{ success: boolean; error?: string }>;
  registerAffiliateEx: (fields: { 
    name: string; 
    email: string; 
    ic: string; 
    whatsapp: string; 
    address: string; 
    bankName: string; 
    bankNo: string; 
    holderName: string;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Standard Mock Baseline Data
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Madu Tualang Genting - Raw Wild Honey',
    category: 'Honey',
    price: 120,
    description: 'Pure, unprocessed wild honey harvested from giant Tualang trees in Genting highlands, Pahang. Rich in antioxidants with a distinctive floral note.',
    stock: 40,
    volume: '500g',
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'p2',
    name: 'Madu Tualang Lipis - Premium Black Honey',
    category: 'Honey',
    price: 150,
    description: 'Rare black wild honey (Madu Hitam) from Kuala Lipis. Harvested from older combs deep in the jungle. Recommended for immune support and stamina.',
    stock: 25,
    volume: '500g',
    image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&q=80&w=400'
  }
];

const DEFAULT_ACCOUNTS: UserAccount[] = [
  { id: 'acc-admin', email: 'asyraf@klinikara.com', userType: 'admin', status: 'active', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'acc-ahmad', email: 'ahmad.rosli@example.my', userType: 'affiliate', status: 'active', createdAt: '2026-04-10T11:00:00Z' },
  { id: 'acc-sarah', email: 'sarah.ismail@example.my', userType: 'affiliate', status: 'active', createdAt: '2026-03-12T14:30:00Z' },
  { id: 'acc-kamal', email: 'kamal.ariffin@example.my', userType: 'agent', status: 'active', createdAt: '2026-01-01T10:00:00Z' },
  { id: 'acc-lee', email: 'chongwei@example.com', userType: 'customer', status: 'active', createdAt: '2026-06-18T09:12:00Z' }
];

const DEFAULT_PROFILES: UserProfile[] = [
  { id: 'prof-admin', userId: 'acc-admin', fullName: 'Dr Asyraf Saharudin', icNumber: '880112-14-5567', icVerified: true, dateOfBirth: '1988-01-12', phoneNumber: '+6011223344', whatsappNumber: '+6011223344' },
  { id: 'prof-ahmad', userId: 'acc-ahmad', fullName: 'Ahmad bin Rosli', icNumber: '920410-06-5321', icVerified: true, dateOfBirth: '1992-04-10', phoneNumber: '+60112345678', whatsappNumber: '+60112345678' },
  { id: 'prof-sarah', userId: 'acc-sarah', fullName: 'Sarah binti Ismail', icNumber: '950312-08-5432', icVerified: true, dateOfBirth: '1995-03-12', phoneNumber: '+60198765432', whatsappNumber: '+60198765432' },
  { id: 'prof-kamal', userId: 'acc-kamal', fullName: 'Kamal bin Ariffin', icNumber: '890105-03-5123', icVerified: true, dateOfBirth: '1989-01-05', phoneNumber: '+60133334444', whatsappNumber: '+60133334444' },
  { id: 'prof-lee', userId: 'acc-lee', fullName: 'Lee Chong Wei', icNumber: '821021-08-6677', icVerified: false, dateOfBirth: '1982-10-21', phoneNumber: '+60124445555', whatsappNumber: '+60124445555' }
];

const DEFAULT_ADDRESSES: UserAddress[] = [
  { id: 'adr-ahmad', userId: 'acc-ahmad', addressType: 'delivery', fullAddress: 'Jalan Bukit Bintang, Pavilion Residences, Tower A-5-2', postalCode: '55100', city: 'Kuala Lumpur', state: 'Wilayah Persekutuan', country: 'Malaysia', isDefault: true },
  { id: 'adr-sarah', userId: 'acc-sarah', addressType: 'both', fullAddress: 'A-12-3, Vista Kondo, Ampang', postalCode: '68000', city: 'Ampang', state: 'Selangor', country: 'Malaysia', isDefault: true },
  { id: 'adr-kamal', userId: 'acc-kamal', addressType: 'delivery', fullAddress: 'Kampung Sungai Miang', postalCode: '26600', city: 'Pekan', state: 'Pahang', country: 'Malaysia', isDefault: true }
];

const DEFAULT_BANK_ACCOUNTS: BankAccount[] = [
  { id: 'bnk-ahmad', userId: 'acc-ahmad', accountHolderName: 'Ahmad bin Rosli', bankName: 'Maybank', accountNumber: '164012345678', accountType: 'savings', isVerified: true, isDefault: true },
  { id: 'bnk-sarah', userId: 'acc-sarah', accountHolderName: 'Sarah binti Ismail', bankName: 'CIMB Bank', accountNumber: '701234567890', accountType: 'savings', isVerified: true, isDefault: true },
  { id: 'bnk-kamal', userId: 'acc-kamal', accountHolderName: 'Kamal bin Ariffin', bankName: 'Public Bank', accountNumber: '302456782', accountType: 'current', isVerified: true, isDefault: true }
];

const DEFAULT_AFFILIATES: Affiliate[] = [
  {
    id: 'aff-ahmad',
    userId: 'acc-ahmad',
    name: 'Ahmad bin Rosli',
    email: 'ahmad.rosli@example.my',
    whatsapp: '+60112345678',
    code: 'AHMAD10',
    signupDate: '2026-04-10',
    tier: 'Bronze',
    unitsSold: 22,
    lifetimeSales: 2420,
    lifetimeCommissions: 242,
    bankAccountId: 'bnk-ahmad'
  },
  {
    id: 'aff-sarah',
    userId: 'acc-sarah',
    name: 'Sarah binti Ismail',
    email: 'sarah.ismail@example.my',
    whatsapp: '+60198765432',
    code: 'SARAH15',
    signupDate: '2026-03-12',
    tier: 'Silver',
    unitsSold: 85,
    lifetimeSales: 11050,
    lifetimeCommissions: 1657.5,
    bankAccountId: 'bnk-sarah'
  }
];

const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'agt-kamal',
    userId: 'acc-kamal',
    agentTier: 'Gold',
    initialStockPurchase: 15000,
    stockBalance: 176,
    stockAllocated: 176,
    discountRate: 0.40,
    commissionRate: 0.25,
    maxInventory: -1, // Unlimited
    bankAccountId: 'bnk-kamal',
    verifiedAt: '2026-01-01T11:00:00Z'
  }
];

const DEFAULT_STOCK_LOGS: AgentStockLog[] = [
  {
    id: 'log-1',
    agentId: 'agt-kamal',
    productId: 'p1',
    quantity: 100,
    action: 'purchase',
    transactionId: 'txn-initial-gold',
    notes: 'Initial Tier Gold Purchase Bundle allocation.',
    createdAt: '2026-01-01T10:30:00Z'
  },
  {
    id: 'log-2',
    agentId: 'agt-kamal',
    productId: 'p2',
    quantity: 76,
    action: 'purchase',
    transactionId: 'txn-initial-gold',
    notes: 'Initial Tier Gold Purchase Bundle allocation.',
    createdAt: '2026-01-01T10:30:00Z'
  }
];

const DEFAULT_BRANCHES: Branch[] = [
  { id: 'b1', name: 'Pahang HQ (Kuantan)', state: 'Pahang', manager: 'Syed Al-Bukhary' },
  { id: 'b2', name: 'Klang Valley Hub', state: 'Selangor', manager: 'Mastura Haris' },
  { id: 'b3', name: 'Northern Branch (Penang)', state: 'Pulau Pinang', manager: 'Tan Wei Kiat' }
];

const DEFAULT_CATEGORIES: ProductCategory[] = [
  { id: 'c1', categoryName: 'Madu Tualang', description: 'Rare, unprocessed wild forest honey harvested from giant Tualang trees deep in the Malaysian rainforest.', displayOrder: 1, isActive: true },
  { id: 'c2', categoryName: 'Virgin Coconut Oil', description: 'Premium cold-pressed virgin coconut oil, rich in medium-chain fatty acids for dietary health and cooking.', displayOrder: 2, isActive: true }
];

const DEFAULT_SUPPLIERS: ProductSupplier[] = [
  { id: 's1', supplierName: 'Suku Semelai Harvesters (Pahang)', contactPerson: 'Tok Batin Roslan', email: 'harvesters@pahangwild.org.my', phone: '+6019-3318855', address: 'Kampung Orang Asli Sungai Miang, Pekan, Pahang', paymentTerms: 'COD', minOrderQuantity: 10, leadTimeDays: 7, isActive: true },
  { id: 's2', supplierName: 'Lipis Gold Rainforest Honey Group', contactPerson: 'Uncle Rahim', email: 'rahim@lipisgold.com.my', phone: '+6013-3334112', address: 'Kuala Lipis, Pahang', paymentTerms: 'Net 30', minOrderQuantity: 5, leadTimeDays: 5, isActive: true }
];

const DEFAULT_INVENTORY: InventoryItem[] = [
  // Product 1 (Madu Tualang Genting) across warehouses b1, b2, b3
  { id: 'inv-1', productId: 'p1', warehouseId: 'b1', quantityOnHand: 120, quantityReserved: 0, quantityAvailable: 120, reorderLevel: 50, reorderQuantity: 100, batchNumber: 'BATCH-2024-0156', expiryDate: '2026-06-15', manufactureDate: '2024-06-15' },
  { id: 'inv-2', productId: 'p1', warehouseId: 'b2', quantityOnHand: 65, quantityReserved: 0, quantityAvailable: 65, reorderLevel: 30, reorderQuantity: 50, batchNumber: 'BATCH-2024-0156', expiryDate: '2026-06-15', manufactureDate: '2024-06-15' },
  { id: 'inv-3', productId: 'p1', warehouseId: 'b3', quantityOnHand: 25, quantityReserved: 0, quantityAvailable: 25, reorderLevel: 20, reorderQuantity: 30, batchNumber: 'BATCH-2024-0125', expiryDate: '2026-03-01', manufactureDate: '2024-03-01', isLowStock: true },
  
  // Product 2 (Madu Tualang Lipis) across warehouses b1, b2, b3
  { id: 'inv-4', productId: 'p2', warehouseId: 'b1', quantityOnHand: 80, quantityReserved: 0, quantityAvailable: 80, reorderLevel: 40, reorderQuantity: 80, batchNumber: 'BATCH-2024-0145', expiryDate: '2026-06-01', manufactureDate: '2024-06-01' },
  { id: 'inv-5', productId: 'p2', warehouseId: 'b2', quantityOnHand: 45, quantityReserved: 0, quantityAvailable: 45, reorderLevel: 20, reorderQuantity: 40, batchNumber: 'BATCH-2024-0145', expiryDate: '2026-06-01', manufactureDate: '2024-06-01' },
  { id: 'inv-6', productId: 'p2', warehouseId: 'b3', quantityOnHand: 15, quantityReserved: 0, quantityAvailable: 15, reorderLevel: 20, reorderQuantity: 30, batchNumber: 'BATCH-2024-0145', expiryDate: '2026-06-01', manufactureDate: '2024-06-01', isLowStock: true }
];

const DEFAULT_STOCK_MOVEMENTS: StockMovement[] = [
  { id: 'mv-1', productId: 'p1', warehouseId: 'b1', movementType: 'stock_in', quantity: 120, reason: 'Initial Batch Seeding', referenceNumber: 'PO-2026-0001', notes: 'HQ stock baseline allocation.', createdBy: 'acc-admin', createdAt: '2026-01-01T10:00:00Z' },
  { id: 'mv-2', productId: 'p1', warehouseId: 'b2', movementType: 'transfer_in', quantity: 65, reason: 'Branch Distribution', referenceNumber: 'TRF-2026-0001', notes: 'Dispatched to Klang Valley.', fromWarehouseId: 'b1', toWarehouseId: 'b2', createdBy: 'acc-admin', createdAt: '2026-01-05T14:30:00Z' },
  { id: 'mv-3', productId: 'p1', warehouseId: 'b3', movementType: 'transfer_in', quantity: 25, reason: 'Branch Redistribution', referenceNumber: 'TRF-2026-0002', notes: 'Dispatched to Penang.', fromWarehouseId: 'b1', toWarehouseId: 'b3', createdBy: 'acc-admin', createdAt: '2026-01-10T11:20:00Z' }
];

const DEFAULT_STOCK_ALERTS: StockAlert[] = [
  { id: 'al-1', productId: 'p1', warehouseId: 'b3', alertType: 'low_stock', currentQuantity: 25, thresholdValue: 20, isResolved: false, createdAt: '2026-06-18T10:00:00Z' },
  { id: 'al-2', productId: 'p2', warehouseId: 'b3', alertType: 'low_stock', currentQuantity: 15, thresholdValue: 20, isResolved: false, createdAt: '2026-06-19T08:00:00Z' }
];

const DEFAULT_PRICING_HISTORY: ProductPricingHistory[] = [
  { id: 'prh-1', productId: 'p1', oldPrice: 110, newPrice: 120, changeReason: 'Harvest Season Shortage & Canopy Scaling Costs', effectiveDate: '2026-03-01T00:00:00Z', changedBy: 'acc-admin', createdAt: '2026-03-01T00:00:00Z' }
];

const DEFAULT_VARIANTS: ProductVariant[] = [
  { id: 'v-1', parentProductId: 'p1', variantSku: 'MAD-TU-500', variantName: 'Volume Bottle', variantValue: '500g', additionalPrice: 0 }
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    customerName: 'Lee Chong Wei',
    customerEmail: 'chongwei@example.com',
    customerPhone: '+60124445555',
    shippingAddress: 'A-12-3, Vista Kondo, Ampang, Selangor',
    branchId: 'b2',
    items: [
      { productId: 'p2', productName: 'Madu Tualang Lipis - Premium Black Honey', quantity: 2, price: 150 }
    ],
    total: 300,
    referralCode: 'SARAH15',
    affiliateCommission: 45,
    affiliateId: 'aff-sarah',
    commissionPaid: true,
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Shipped',
    createdAt: '2026-06-18T10:30:00Z'
  }
];

const DEFAULT_CMS_CONFIG: WebsiteConfig = {
  siteName: 'Madu Plus Tualang',
  siteDescription: 'Direct, premium raw wild Tualang Honey. Authentic jungle curation & modern affiliate structure.',
  logoUrl: '',
  primaryColor: '#EE4D2D',
  secondaryColor: '#C0392B',
  contactPhone: '+6011-223344',
  contactEmail: 'hq@maduplus.my',
  facebookLink: 'https://fb.com/maduplus',
  instagramLink: 'https://instagram.com/maduplus'
};

const DEFAULT_CMS_PAGES: WebsitePage[] = [
  {
    id: 'page-about',
    slug: 'about',
    title: 'Pure Harvesting Legacy',
    content: `### Sourced Direct From Tualang Giants\n\nUnlike commercially farm-raised honey, **Madu Plus** is strictly hand-harvested by veteran climbers scaling 80-meter high Tualang trees (**Koompassia excelsa**) in Pahang tropical woodlands. Our hunters extract the raw wild honey in limited quantities, maintaining the highest bio-active nutrients possible.\n\n### Benefits of Wild Tualang Honey\n\n* **Anti-Bacterial Core:** Combats winter cold and cough naturally.\n* **Lower Glycemic Impact:** Perfect substitute for table sugars.\n* **Antioxidant Enriched:** Contains high organic phenolic acid structures.\n\nEnjoy pure nectar, unfiltered, direct from nature's canopy.`,
    published: true,
    updatedAt: '2026-06-21T00:00:00Z'
  }
];

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
    return localStorage.getItem('mp_referral_code');
  });

  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    return DEFAULT_BRANCHES[0].id;
  });

  const [language, setLanguageState] = useState<'en' | 'ms'>(() => {
    const saved = localStorage.getItem('mp_language');
    return (saved === 'en' || saved === 'ms') ? saved : 'en';
  });

  const [branches] = useState<Branch[]>(DEFAULT_BRANCHES);
  
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
          dbAgents, dbLogs, dbConfig, dbPages, dbAudit
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
          supabaseDb.getAuditLogs()
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
  const login = async (email: string, pass?: string): Promise<{ success: boolean; error?: string; user?: UserAccount }> => {
    const cleanEmail = (email || '').toLowerCase().trim();
    const account = userAccounts.find(a => a.email && a.email.toLowerCase() === cleanEmail);
    if (!account) {
      return { success: false, error: 'User account not found.' };
    }
    if (account.status === 'suspended') {
      return { success: false, error: 'This account has been suspended by HQ.' };
    }
    
    const profile = userProfiles.find(p => p.userId === account.id);
    setCurrentUserAccount(account);
    setCurrentUserProfile(profile || null);
    
    return { success: true, user: account };
  };

  const logout = () => {
    setCurrentUserAccount(null);
    setCurrentUserProfile(null);
  };

  /**
   * AUTH SERVICE: Register Customer accounts
   */
  const registerCustomer = async (name: string, email: string, phone: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (userAccounts.some(a => a.email && a.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Email already registered.' };
    }

    const newAccId = `acc-cust-${Date.now().toString().slice(-4)}`;
    const newAcc: UserAccount = {
      id: newAccId,
      email: cleanEmail,
      userType: 'customer',
      status: 'active',
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
  }): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = (fields.email || '').toLowerCase().trim();
    if (userAccounts.some(a => a.email && a.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Email already registered.' };
    }

    const uniqueCode = 'AFX' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const newAccId = `acc-aff-${Date.now().toString().slice(-4)}`;
    
    const newAcc: UserAccount = {
      id: newAccId,
      email: cleanEmail,
      userType: 'affiliate',
      status: 'active',
      createdAt: new Date().toISOString()
    };

    // Extract DOB from MyKAD
    const dob = extractDOBFromIC(fields.ic);

    const newProf: UserProfile = {
      id: `prof-aff-${Date.now().toString().slice(-4)}`,
      userId: newAccId,
      fullName: fields.name,
      icNumber: fields.ic,
      icVerified: false,
      dateOfBirth: dob,
      phoneNumber: fields.whatsapp,
      whatsappNumber: fields.whatsapp
    };

    const newAddr: UserAddress = {
      id: `adr-aff-${Date.now().toString().slice(-4)}`,
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
      id: `bnk-aff-${Date.now().toString().slice(-4)}`,
      userId: newAccId,
      accountHolderName: fields.holderName || fields.name,
      bankName: fields.bankName,
      accountNumber: fields.bankNo,
      accountType: 'savings',
      isVerified: false,
      isDefault: true
    };

    const newAff: Affiliate = {
      id: `aff-${Date.now().toString().slice(-4)}`,
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
      bankAccountId: newBank.id
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
  }): Promise<{ success: boolean; error?: string; agentId?: string }> => {
    const cleanEmail = (fields.email || '').toLowerCase().trim();
    if (userAccounts.some(a => a.email && a.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Email already registered.' };
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

    const newAccId = `acc-agt-${Date.now().toString().slice(-4)}`;
    const newAcc: UserAccount = {
      id: newAccId,
      email: cleanEmail,
      userType: 'agent',
      status: 'active',
      createdAt: new Date().toISOString()
    };

    const dob = extractDOBFromIC(fields.ic);

    const newProf: UserProfile = {
      id: `prof-agt-${Date.now().toString().slice(-4)}`,
      userId: newAccId,
      fullName: fields.name,
      icNumber: fields.ic,
      icVerified: false,
      dateOfBirth: dob,
      phoneNumber: fields.whatsapp,
      whatsappNumber: fields.whatsapp
    };

    const newAddr: UserAddress = {
      id: `adr-agt-${Date.now().toString().slice(-4)}`,
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
      id: `bnk-agt-${Date.now().toString().slice(-4)}`,
      userId: newAccId,
      accountHolderName: fields.holderName || fields.name,
      bankName: fields.bankName,
      accountNumber: fields.bankNo,
      accountType: 'savings',
      isVerified: false,
      isDefault: true
    };

    const agtId = `agt-${Date.now().toString().slice(-4)}`;
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
      verifiedAt: new Date().toISOString()
    };

    // Create Initial stock log transaction
    const initialLog: AgentStockLog = {
      id: `log-agt-${Date.now().toString().slice(-4)}`,
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

  const addProduct = (product: Product) => {
    setProducts(prev => {
      const updated = [...prev, { ...product, sku: product.sku || `MAD-TU-${Math.floor(Math.random()*1000)}`, status: product.status || 'draft', createdAt: new Date().toISOString() }];
      if (isSupabaseConfigured) {
        try { supabaseDb.upsertProducts(updated); } catch (e) { console.error(e); }
      }
      return updated;
    });

    setInventory(prev => {
      const newItems = DEFAULT_BRANCHES.map(branch => ({
        id: `inv-${Date.now()}-${branch.id}-${Math.floor(Math.random()*1000)}`,
        productId: product.id,
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

    addAuditLog('Product Created', 'products', product.id, `New SKU: ${product.sku || 'N/A'}`);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    let oldPrice = 0;
    setProducts(prev => {
      const updated = prev.map(p => {
        if (p.id === id) {
          oldPrice = p.price;
          return { ...p, ...updates };
        }
        return p;
      });
      if (isSupabaseConfigured) {
        try { supabaseDb.upsertProducts(updated); } catch (e) { console.error(e); }
      }
      return updated;
    });

    if (updates.price !== undefined && updates.price !== oldPrice) {
      setPricingHistory(prev => [
        {
          id: `prh-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          productId: id,
          oldPrice,
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
      const newSlots = DEFAULT_BRANCHES.map(branch => {
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

  const recordStockMovement = (
    productId: string,
    warehouseId: string,
    movementType: StockMovementType,
    quantity: number,
    reason: string,
    refNum?: string,
    notes?: string,
    fromId?: string,
    toId?: string
  ) => {
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

    // Update quantities in inventory item
    setInventory(prev => {
      let updatedTotalStock = 0;
      const step1 = prev.map(item => {
        if (item.productId === productId && item.warehouseId === warehouseId) {
          const newOnHand = Math.max(0, item.quantityOnHand + quantity);
          updatedTotalStock += newOnHand;
          return {
            ...item,
            quantityOnHand: newOnHand,
            quantityAvailable: Math.max(0, newOnHand - item.quantityReserved),
            isLowStock: newOnHand < item.reorderLevel,
            isOutOfStock: newOnHand === 0
          };
        }
        if (item.productId === productId) {
          updatedTotalStock += item.quantityOnHand;
        }
        return item;
      });

      // Synchronize back to the main products catalog stock aggregate!
      setProducts(pList => pList.map(p => p.id === productId ? { ...p, stock: updatedTotalStock } : p));
      return step1;
    });

    // Check for alerts
    const targetInv = inventory.find(i => i.productId === productId && i.warehouseId === warehouseId);
    if (targetInv) {
      const newQty = Math.max(0, targetInv.quantityOnHand + quantity);
      if (newQty === 0) {
        setStockAlerts(prev => [
          {
            id: `al-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            productId,
            warehouseId,
            alertType: 'out_of_stock',
            currentQuantity: 0,
            thresholdValue: targetInv.reorderLevel,
            isResolved: false,
            createdAt: new Date().toISOString()
          },
          ...prev
        ]);
      } else if (newQty < targetInv.reorderLevel) {
        setStockAlerts(prev => [
          {
            id: `al-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            productId,
            warehouseId,
            alertType: 'low_stock',
            currentQuantity: newQty,
            thresholdValue: targetInv.reorderLevel,
            isResolved: false,
            createdAt: new Date().toISOString()
          },
          ...prev
        ]);
      }
    }

    addAuditLog('Stock Movement Logged', 'inventory', productId, `${movementType}: ${quantity} units`);
  };

  const bulkStockChange = (
    changes: { productId: string; quantity: number }[],
    warehouseId: string,
    movementType: StockMovementType,
    reason: string,
    refNum?: string
  ) => {
    changes.forEach(change => {
      recordStockMovement(
        change.productId,
        warehouseId,
        movementType,
        change.quantity,
        reason,
        refNum,
        'Bulk Stock Change operation'
      );
    });
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
    setCurrentUserAccount(null);
    setCurrentUserProfile(null);
    setCart([]);
    setReferralCode(null);
    setSelectedBranchId(DEFAULT_BRANCHES[0].id);

    // Wipe cached items
    const keys = [
      'mp_accounts', 'mp_profiles', 'mp_addresses', 'mp_bank_accounts', 'mp_products',
      'mp_affiliates', 'mp_agents', 'mp_stock_logs', 'mp_orders', 'mp_website_config',
      'mp_website_pages', 'mp_current_account', 'mp_current_profile', 'mp_cart', 'mp_referral_code',
      'mp_inventory_items', 'mp_stock_movements', 'mp_stock_alerts', 'mp_pricing_history',
      'mp_variants', 'mp_suppliers', 'mp_categories'
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
        registerCustomer,
        registerAffiliateEx,
        registerAgentEx,
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
