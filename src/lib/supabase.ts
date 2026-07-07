/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { createClient } from '@supabase/supabase-js';
import { 
  Product, 
  Affiliate, 
  Order, 
  UserAccount, 
  UserProfile, 
  UserAddress, 
  BankAccount, 
  Agent, 
  AgentStockLog, 
  WebsiteConfig, 
  WebsitePage, 
  AuditLog 
} from '../types';

// Read config from Vite environment variables
const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

// Determine if Supabase is fully configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseUrl !== 'undefined' && supabaseAnonKey && supabaseAnonKey !== 'undefined');

// Standard client initialization
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * SQL generation helper that gives users copy-pasteable queries to setup Supabase
 */
export const getSupabaseSQLSchema = (): string => {
  return `-- Copy and run this script in the Supabase SQL Editor to prepare your database:

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create User Accounts
CREATE TABLE IF NOT EXISTS user_accounts (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  user_type TEXT NOT NULL, -- 'customer', 'affiliate', 'agent', 'admin'
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);

-- 2. Create User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES user_accounts(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  ic_number TEXT UNIQUE, -- Format: 123456-12-1234
  ic_verified BOOLEAN NOT NULL DEFAULT false,
  date_of_birth TEXT,
  phone_number TEXT,
  whatsapp_number TEXT,
  avatar_url TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- 3. Create User Addresses
CREATE TABLE IF NOT EXISTS user_addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES user_accounts(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL, -- 'billing', 'delivery', 'both'
  full_address TEXT NOT NULL,
  postal_code TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Malaysia',
  is_default BOOLEAN NOT NULL DEFAULT false
);

-- 4. Create Bank Accounts
CREATE TABLE IF NOT EXISTS bank_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES user_accounts(id) ON DELETE CASCADE,
  account_holder_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT UNIQUE NOT NULL,
  account_type TEXT NOT NULL, -- 'savings', 'current'
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false
);

-- 5. Create Products Table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  stock INT NOT NULL DEFAULT 0,
  volume TEXT,
  image TEXT
);

-- 6. Create Affiliates Table
CREATE TABLE IF NOT EXISTS affiliates (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  whatsapp TEXT,
  code TEXT UNIQUE NOT NULL,
  signup_date TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'Bronze',
  units_sold INT NOT NULL DEFAULT 0,
  lifetime_sales NUMERIC NOT NULL DEFAULT 0,
  lifetime_commissions NUMERIC NOT NULL DEFAULT 0,
  bank_account_id TEXT
);

-- 7. Create Agents Table
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES user_accounts(id) ON DELETE CASCADE,
  agent_tier TEXT NOT NULL DEFAULT 'Bronze', -- 'Bronze', 'Silver', 'Gold'
  initial_stock_purchase NUMERIC NOT NULL DEFAULT 0,
  stock_balance INT NOT NULL DEFAULT 0,
  stock_allocated INT NOT NULL DEFAULT 0,
  discount_rate NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 0,
  max_inventory INT NOT NULL DEFAULT 0,
  bank_account_id TEXT,
  verified_at TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- 8. Create Agent Stock Logs
CREATE TABLE IF NOT EXISTS agent_stock_log (
  id TEXT PRIMARY KEY,
  agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL,
  action TEXT NOT NULL, -- 'purchase', 'sale', 'return', 'adjustment'
  transaction_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL
);

-- 9. Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  shipping_address TEXT,
  branch_id TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total NUMERIC NOT NULL,
  referral_code TEXT,
  affiliate_commission NUMERIC,
  affiliate_id TEXT,
  agent_id TEXT,
  commission_paid BOOLEAN NOT NULL DEFAULT false,
  payment_status TEXT NOT NULL DEFAULT 'Pending',
  fulfillment_status TEXT NOT NULL DEFAULT 'Processing',
  created_at TEXT NOT NULL
);

-- 10. Website Config (CMS) Table
CREATE TABLE IF NOT EXISTS website_config (
  id TEXT PRIMARY KEY,
  site_name TEXT NOT NULL,
  site_description TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#EE4D2D',
  secondary_color TEXT DEFAULT '#C0392B',
  contact_phone TEXT,
  contact_email TEXT,
  facebook_link TEXT,
  instagram_link TEXT
);

-- 11. Website Pages (CMS) Table
CREATE TABLE IF NOT EXISTS website_pages (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT true,
  updated_at TEXT NOT NULL
);

-- 12. Admin Audit Log Table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  changes TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Enable Row Level Security (RLS) but allow anonymous access for sandbox MVP
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_stock_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Create Policies for open anonymous read/write access
CREATE POLICY "Allow public select user_accounts" ON user_accounts FOR SELECT USING (true);
CREATE POLICY "Allow public all user_accounts" ON user_accounts FOR ALL USING (true);

CREATE POLICY "Allow public select user_profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public all user_profiles" ON user_profiles FOR ALL USING (true);

CREATE POLICY "Allow public select user_addresses" ON user_addresses FOR SELECT USING (true);
CREATE POLICY "Allow public all user_addresses" ON user_addresses FOR ALL USING (true);

CREATE POLICY "Allow public select bank_accounts" ON bank_accounts FOR SELECT USING (true);
CREATE POLICY "Allow public all bank_accounts" ON bank_accounts FOR ALL USING (true);

CREATE POLICY "Allow public select products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public all products" ON products FOR ALL USING (true);

CREATE POLICY "Allow public select affiliates" ON affiliates FOR SELECT USING (true);
CREATE POLICY "Allow public all affiliates" ON affiliates FOR ALL USING (true);

CREATE POLICY "Allow public select agents" ON agents FOR SELECT USING (true);
CREATE POLICY "Allow public all agents" ON agents FOR ALL USING (true);

CREATE POLICY "Allow public select agent_stock_log" ON agent_stock_log FOR SELECT USING (true);
CREATE POLICY "Allow public all agent_stock_log" ON agent_stock_log FOR ALL USING (true);

CREATE POLICY "Allow public select orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public all orders" ON orders FOR ALL USING (true);

CREATE POLICY "Allow public select website_config" ON website_config FOR SELECT USING (true);
CREATE POLICY "Allow public all website_config" ON website_config FOR ALL USING (true);

CREATE POLICY "Allow public select website_pages" ON website_pages FOR SELECT USING (true);
CREATE POLICY "Allow public all website_pages" ON website_pages FOR ALL USING (true);

CREATE POLICY "Allow public select admin_audit_log" ON admin_audit_log FOR SELECT USING (true);
CREATE POLICY "Allow public all admin_audit_log" ON admin_audit_log FOR ALL USING (true);

-- Insert a baseline layout page & CMS setting
INSERT INTO website_config (id, site_name, site_description, primary_color, secondary_color, contact_email)
VALUES ('default', 'Madu Plus Tualang', 'Direct raw wild Tualang Honey from Malaysian jungles with unified multi-level affiliate network.', '#EE4D2D', '#C0392B', 'info@maduplus.my')
ON CONFLICT (id) DO NOTHING;

INSERT INTO website_pages (id, slug, title, content, published, updated_at)
VALUES ('about', 'about', 'About Our Honey', 'Madu Plus delivers 100% pure, unprocessed, raw wild honey harvested direct from Tualang Trees deep in the Malaysian rain forest canopy. No additives, no heating.', true, '2026-06-21T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
`;
};

// Database row mapping functions
function mapUserAccount(row: any): UserAccount {
  return {
    id: row.id,
    email: row.email,
    userType: row.user_type,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapUserProfile(row: any): UserProfile {
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    icNumber: row.ic_number || '',
    icVerified: !!row.ic_verified,
    dateOfBirth: row.date_of_birth || '',
    phoneNumber: row.phone_number || '',
    whatsappNumber: row.whatsapp_number || '',
    avatarUrl: row.avatar_url || '',
  };
}

function mapUserAddress(row: any): UserAddress {
  return {
    id: row.id,
    userId: row.user_id,
    addressType: row.address_type,
    fullAddress: row.full_address,
    postalCode: row.postal_code || '',
    city: row.city || '',
    state: row.state || '',
    country: row.country || 'Malaysia',
    isDefault: !!row.is_default
  };
}

function mapBankAccount(row: any): BankAccount {
  return {
    id: row.id,
    userId: row.user_id,
    accountHolderName: row.account_holder_name,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    accountType: row.account_type,
    isVerified: !!row.is_verified,
    isDefault: !!row.is_default,
  };
}

function mapProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    description: row.description || '',
    stock: Number(row.stock),
    volume: row.volume || '',
    image: row.image || '',
  };
}

function mapAffiliate(row: any): Affiliate {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    name: row.name,
    email: row.email,
    whatsapp: row.whatsapp || '',
    code: row.code,
    signupDate: row.signup_date || '',
    tier: row.tier || 'Bronze',
    unitsSold: Number(row.units_sold || 0),
    lifetimeSales: Number(row.lifetime_sales || 0),
    lifetimeCommissions: Number(row.lifetime_commissions || 0),
    bankAccountId: row.bank_account_id || undefined,
  };
}

function mapAgent(row: any): Agent {
  return {
    id: row.id,
    userId: row.user_id,
    agentTier: row.agent_tier,
    initialStockPurchase: Number(row.initial_stock_purchase || 0),
    stockBalance: Number(row.stock_balance || 0),
    stockAllocated: Number(row.stock_allocated || 0),
    discountRate: Number(row.discount_rate || 0),
    commissionRate: Number(row.commission_rate || 0),
    maxInventory: Number(row.max_inventory || 0),
    bankAccountId: row.bank_account_id || undefined,
    verifiedAt: row.verified_at || undefined,
  };
}

function mapAgentStockLog(row: any): AgentStockLog {
  return {
    id: row.id,
    agentId: row.agent_id,
    productId: row.product_id,
    quantity: Number(row.quantity),
    action: row.action,
    transactionId: row.transaction_id || undefined,
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

function mapOrder(row: any): Order {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerEmail: row.customer_email || '',
    customerPhone: row.customer_phone || '',
    shippingAddress: row.shipping_address || '',
    branchId: row.branch_id || 'b1',
    items: Array.isArray(row.items) ? row.items : JSON.parse(row.items || '[]'),
    total: Number(row.total),
    referralCode: row.referral_code || undefined,
    affiliateCommission: row.affiliate_commission ? Number(row.affiliate_commission) : undefined,
    affiliateId: row.affiliate_id || undefined,
    agentId: row.agent_id || undefined,
    commissionPaid: !!row.commission_paid,
    paymentStatus: row.payment_status || 'Pending',
    fulfillmentStatus: row.fulfillment_status || 'Processing',
    createdAt: row.created_at,
  };
}

function mapWebsiteConfig(row: any): WebsiteConfig {
  return {
    siteName: row.site_name,
    siteDescription: row.site_description,
    logoUrl: row.logo_url || '',
    primaryColor: row.primary_color || '#EE4D2D',
    secondaryColor: row.secondary_color || '#C0392B',
    contactPhone: row.contact_phone || '',
    contactEmail: row.contact_email || '',
    facebookLink: row.facebook_link || '',
    instagramLink: row.instagram_link || '',
  };
}

function mapWebsitePage(row: any): WebsitePage {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content,
    published: !!row.published,
    updatedAt: row.updated_at,
  };
}

function mapAuditLog(row: any): AuditLog {
  return {
    id: row.id,
    adminId: row.admin_id,
    adminName: row.admin_name,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    changes: row.changes,
    createdAt: row.created_at,
  };
}

// Data Fetching and Mutation APIs
export const supabaseDb = {
  // USER ACCOUNTS
  async getUserAccounts(): Promise<UserAccount[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('user_accounts').select('*');
      if (error) return null;
      return data.map(mapUserAccount);
    } catch {
      return null;
    }
  },

  async upsertUserAccounts(accounts: UserAccount[]): Promise<boolean> {
    if (!supabase) return false;
    try {
      const rows = accounts.map(a => ({
        id: a.id,
        email: a.email,
        user_type: a.userType,
        status: a.status,
        created_at: a.createdAt,
      }));
      const { error } = await supabase.from('user_accounts').upsert(rows);
      return !error;
    } catch {
      return false;
    }
  },

  async deleteUserAccount(id: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      await supabase.from('affiliates').delete().eq('user_id', id);
      const { error } = await supabase.from('user_accounts').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  // USER PROFILES
  async getUserProfiles(): Promise<UserProfile[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('user_profiles').select('*');
      if (error) return null;
      return data.map(mapUserProfile);
    } catch {
      return null;
    }
  },

  async upsertUserProfiles(profiles: UserProfile[]): Promise<boolean> {
    if (!supabase) return false;
    try {
      const rows = profiles.map(p => ({
        id: p.id,
        user_id: p.userId,
        full_name: p.fullName,
        ic_number: p.icNumber,
        ic_verified: p.icVerified,
        date_of_birth: p.dateOfBirth,
        phone_number: p.phoneNumber,
        whatsapp_number: p.whatsappNumber,
        avatar_url: p.avatarUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      const { error } = await supabase.from('user_profiles').upsert(rows);
      return !error;
    } catch {
      return false;
    }
  },

  // USER ADDRESSES
  async getUserAddresses(): Promise<UserAddress[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('user_addresses').select('*');
      if (error) return null;
      return data.map(mapUserAddress);
    } catch {
      return null;
    }
  },

  async upsertUserAddresses(addresses: UserAddress[]): Promise<boolean> {
    if (!supabase) return false;
    try {
      const rows = addresses.map(a => ({
        id: a.id,
        user_id: a.userId,
        address_type: a.addressType,
        full_address: a.fullAddress,
        postal_code: a.postalCode,
        city: a.city,
        state: a.state,
        country: a.country,
        is_default: a.isDefault,
      }));
      const { error } = await supabase.from('user_addresses').upsert(rows);
      return !error;
    } catch {
      return false;
    }
  },

  // BANK ACCOUNTS
  async getBankAccounts(): Promise<BankAccount[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('bank_accounts').select('*');
      if (error) return null;
      return data.map(mapBankAccount);
    } catch {
      return null;
    }
  },

  async upsertBankAccounts(bankAccounts: BankAccount[]): Promise<boolean> {
    if (!supabase) return false;
    try {
      const rows = bankAccounts.map(b => ({
        id: b.id,
        user_id: b.userId,
        account_holder_name: b.accountHolderName,
        bank_name: b.bankName,
        account_number: b.accountNumber,
        account_type: b.accountType,
        is_verified: b.isVerified,
        is_default: b.isDefault,
      }));
      const { error } = await supabase.from('bank_accounts').upsert(rows);
      return !error;
    } catch {
      return false;
    }
  },

  // PRODUCTS
  async getProducts(): Promise<Product[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) return null;
      return data.map(mapProduct);
    } catch {
      return null;
    }
  },

  async upsertProducts(products: Product[]): Promise<boolean> {
    if (!supabase) return false;
    try {
      const rows = products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        description: p.description,
        stock: p.stock,
        volume: p.volume,
        image: p.image
      }));
      const { error } = await supabase.from('products').upsert(rows);
      return !error;
    } catch {
      return false;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  async deleteProducts(ids: string[]): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('products').delete().in('id', ids);
      return !error;
    } catch {
      return false;
    }
  },

  // AFFILIATES
  async getAffiliates(): Promise<Affiliate[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('affiliates').select('*');
      if (error) return null;
      return data.map(mapAffiliate);
    } catch {
      return null;
    }
  },

  async upsertAffiliates(affiliates: Affiliate[]): Promise<boolean> {
    if (!supabase) return false;
    try {
      const rows = affiliates.map(a => ({
        id: a.id,
        user_id: a.userId || null,
        name: a.name,
        email: a.email,
        whatsapp: a.whatsapp,
        code: a.code,
        signup_date: a.signupDate,
        tier: a.tier,
        units_sold: a.unitsSold,
        lifetime_sales: a.lifetimeSales,
        lifetime_commissions: a.lifetimeCommissions,
        bank_account_id: a.bankAccountId || null
      }));
      const { error } = await supabase.from('affiliates').upsert(rows);
      return !error;
    } catch {
      return false;
    }
  },

  // AGENTS
  async getAgents(): Promise<Agent[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('agents').select('*');
      if (error) return null;
      return data.map(mapAgent);
    } catch {
      return null;
    }
  },

  async upsertAgents(agents: Agent[]): Promise<boolean> {
    if (!supabase) return false;
    try {
      const rows = agents.map(a => ({
        id: a.id,
        user_id: a.userId,
        agent_tier: a.agentTier,
        initial_stock_purchase: a.initialStockPurchase,
        stock_balance: a.stockBalance,
        stock_allocated: a.stockAllocated,
        discount_rate: a.discountRate,
        commission_rate: a.commissionRate,
        max_inventory: a.maxInventory,
        bank_account_id: a.bankAccountId || null,
        verified_at: a.verifiedAt || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      const { error } = await supabase.from('agents').upsert(rows);
      return !error;
    } catch {
      return false;
    }
  },

  // AGENT STOCK LOGS
  async getAgentStockLogs(): Promise<AgentStockLog[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('agent_stock_log').select('*');
      if (error) return null;
      return data.map(mapAgentStockLog);
    } catch {
      return null;
    }
  },

  async upsertAgentStockLogs(logs: AgentStockLog[]): Promise<boolean> {
    if (!supabase) return false;
    try {
      const rows = logs.map(l => ({
        id: l.id,
        agent_id: l.agentId,
        product_id: l.productId,
        quantity: l.quantity,
        action: l.action,
        transaction_id: l.transactionId || null,
        notes: l.notes || '',
        created_at: l.createdAt
      }));
      const { error } = await supabase.from('agent_stock_log').upsert(rows);
      return !error;
    } catch {
      return false;
    }
  },

  // ORDERS
  async getOrders(): Promise<Order[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) return null;
      return data.map(mapOrder);
    } catch {
      return null;
    }
  },

  async upsertOrders(orders: Order[]): Promise<boolean> {
    if (!supabase) return false;
    try {
      const rows = orders.map(o => ({
        id: o.id,
        customer_name: o.customerName,
        customer_email: o.customerEmail,
        customer_phone: o.customerPhone,
        shipping_address: o.shippingAddress,
        branch_id: o.branchId,
        items: JSON.stringify(o.items),
        total: o.total,
        referral_code: o.referralCode || null,
        affiliate_commission: o.affiliateCommission || null,
        affiliate_id: o.affiliateId || null,
        agent_id: o.agentId || null,
        commission_paid: o.commissionPaid,
        payment_status: o.paymentStatus,
        fulfillment_status: o.fulfillmentStatus,
        created_at: o.createdAt
      }));
      const { error } = await supabase.from('orders').upsert(rows);
      return !error;
    } catch {
      return false;
    }
  },

  // CMS WEBSITE CONFIG
  async getWebsiteConfig(): Promise<WebsiteConfig | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('website_config').select('*').eq('id', 'default').maybeSingle();
      if (error || !data) return null;
      return mapWebsiteConfig(data);
    } catch {
      return null;
    }
  },

  async updateWebsiteConfig(config: WebsiteConfig): Promise<boolean> {
    if (!supabase) return false;
    try {
      const row = {
        id: 'default',
        site_name: config.siteName,
        site_description: config.siteDescription,
        logo_url: config.logoUrl || null,
        primary_color: config.primaryColor || '#EE4D2D',
        secondary_color: config.secondaryColor || '#C0392B',
        contact_phone: config.contactPhone || null,
        contact_email: config.contactEmail || null,
        facebook_link: config.facebookLink || null,
        instagram_link: config.instagramLink || null
      };
      const { error } = await supabase.from('website_config').upsert(row);
      return !error;
    } catch {
      return false;
    }
  },

  // CMS PAGES
  async getWebsitePages(): Promise<WebsitePage[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('website_pages').select('*');
      if (error) return null;
      return data.map(mapWebsitePage);
    } catch {
      return null;
    }
  },

  async upsertWebsitePages(pages: WebsitePage[]): Promise<boolean> {
    if (!supabase) return false;
    try {
      const rows = pages.map(p => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        content: p.content,
        published: p.published,
        updated_at: p.updatedAt,
      }));
      const { error } = await supabase.from('website_pages').upsert(rows);
      return !error;
    } catch {
      return false;
    }
  },

  // AUDIT LOGS
  async getAuditLogs(): Promise<AuditLog[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false });
      if (error) return null;
      return data.map(mapAuditLog);
    } catch {
      return null;
    }
  },

  async createAuditLog(log: AuditLog): Promise<boolean> {
    if (!supabase) return false;
    try {
      const row = {
        id: log.id,
        admin_id: log.adminId,
        admin_name: log.adminName,
        action: log.action,
        target_type: log.targetType,
        target_id: log.targetId,
        changes: log.changes,
        created_at: log.createdAt
      };
      const { error } = await supabase.from('admin_audit_log').insert([row]);
      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Seed baseline demo data into the supabase database tables
   */
  async seedBaselineData(
    defaultProducts: Product[],
    defaultAffiliates: Affiliate[],
    defaultOrders: Order[],
    defaultAccounts: UserAccount[],
    defaultProfiles: UserProfile[],
    defaultAddresses: UserAddress[],
    defaultBankAccounts: BankAccount[],
    defaultAgents: Agent[],
    defaultLogs: AgentStockLog[],
    defaultPages: WebsitePage[]
  ): Promise<{ success: boolean; message: string }> {
    if (!supabase) {
      return { success: false, message: 'Supabase variables are not configured.' };
    }
    try {
      // Step-by-step seeding to respect foreign keys
      const accountsOk = await this.upsertUserAccounts(defaultAccounts);
      const profilesOk = await this.upsertUserProfiles(defaultProfiles);
      const addressesOk = await this.upsertUserAddresses(defaultAddresses);
      const bankAccountsOk = await this.upsertBankAccounts(defaultBankAccounts);
      const prodsOk = await this.upsertProducts(defaultProducts);
      const affiliatesOk = await this.upsertAffiliates(defaultAffiliates);
      const agentsOk = await this.upsertAgents(defaultAgents);
      const stockLogsOk = await this.upsertAgentStockLogs(defaultLogs);
      const ordersOk = await this.upsertOrders(defaultOrders);
      const pagesOk = await this.upsertWebsitePages(defaultPages);

      const allSuccess = 
        accountsOk && profilesOk && addressesOk && bankAccountsOk && 
        prodsOk && affiliatesOk && agentsOk && stockLogsOk && ordersOk && pagesOk;

      if (allSuccess) {
        return { success: true, message: 'All baseline modular tables successfully seeded in Supabase!' };
      } else {
        return { 
          success: false, 
          message: `Check DB schema: Accounts: ${accountsOk}, Profiles: ${profilesOk}, Adr: ${addressesOk}, Bank: ${bankAccountsOk}, Prods: ${prodsOk}, Affs: ${affiliatesOk}, Agts: ${agentsOk}, Logs: ${stockLogsOk}, Ords: ${ordersOk}, CMS: ${pagesOk}` 
        };
      }
    } catch (e: any) {
      return { success: false, message: `Failed to seed: ${e.message || e}` };
    }
  }
};
