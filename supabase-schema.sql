-- ====================================================================
-- MADU PLUS TUALANG - SUPABASE BACKEND MASTER RELATIONAL DATABASE SCHEMA & Baseline Mock Dataset
-- ====================================================================
-- Copy and execute this script inside the Supabase SQL Editor to prepare your PostgreSQL database.
-- These tables perfectly mirror our modular state architecture and include correct primary-foreign key cascades.

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if needed (optional safety, disabled by default to avoid accidental loss)
-- DROP TABLE IF EXISTS admin_audit_log CASCADE;
-- DROP TABLE IF EXISTS website_pages CASCADE;
-- DROP TABLE IF EXISTS website_config CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS agent_stock_log CASCADE;
-- DROP TABLE IF EXISTS agents CASCADE;
-- DROP TABLE IF EXISTS affiliates CASCADE;
-- DROP TABLE IF EXISTS bank_accounts CASCADE;
-- DROP TABLE IF EXISTS user_addresses CASCADE;
-- DROP TABLE IF EXISTS user_profiles CASCADE;
-- DROP TABLE IF EXISTS user_accounts CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;

-- --------------------------------------------------------------------
-- 1. Create User Accounts
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_accounts (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  user_type TEXT NOT NULL, -- 'customer', 'affiliate', 'agent', 'admin'
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);

-- --------------------------------------------------------------------
-- 2. Create User Profiles
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- 3. Create User Addresses
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- 4. Create Bank Accounts
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- 5. Create Products Table
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- 6. Create Affiliates Table
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- 7. Create Agents Table
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- 8. Create Agent Stock Logs
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- 9. Create Orders Table
-- --------------------------------------------------------------------
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
  affiliate_commission  NUMERIC,
  affiliate_id TEXT,
  agent_id TEXT,
  commission_paid BOOLEAN NOT NULL DEFAULT false,
  payment_status TEXT NOT NULL DEFAULT 'Pending',
  fulfillment_status TEXT NOT NULL DEFAULT 'Processing',
  created_at TEXT NOT NULL,
  payment_ref TEXT,
  gateway_bill_id TEXT,
  payment_channel TEXT,
  payment_confirmed_at TEXT
);

-- Migration for existing databases: adds the payment-gateway columns above if the
-- orders table was already created before this app supported real gateway payments.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_ref TEXT,
  ADD COLUMN IF NOT EXISTS gateway_bill_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_channel TEXT,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at TEXT;

-- --------------------------------------------------------------------
-- 10. Website Config (CMS) Table
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- 11. Website Pages (CMS) Table
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS website_pages (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT true,
  updated_at TEXT NOT NULL
);

-- --------------------------------------------------------------------
-- 12. Admin Audit Log Table
-- --------------------------------------------------------------------
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

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
-- Enable Row Level Security (RLS) to secure your production database.
-- Note: These configurations allow open read/write access for easy MVP debugging,
-- but you can customize them based on Auth policies.

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

-- Anonymous full access policies (ideal for quick prototyping with standard anon keys)
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

-- ====================================================================
-- BASELINE MOCKUP DATASEEDING INSERTS
-- ====================================================================

-- 1. Products Insert
INSERT INTO products (id, name, category, price, description, stock, volume, image)
VALUES
('p1', 'Madu Tualang Genting - Raw Wild Honey', 'Honey', 120, 'Pure, unprocessed wild honey harvested from giant Tualang trees in Genting highlands, Pahang. Rich in antioxidants with a distinctive floral note.', 40, '500g', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400'),
('p2', 'Madu Tualang Lipis - Premium Black Honey', 'Honey', 150, 'Rare black wild honey (Madu Hitam) from Kuala Lipis. Harvested from older combs deep in the jungle. Recommended for immune support and stamina.', 25, '500g', 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&q=80&w=400')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  stock = EXCLUDED.stock,
  volume = EXCLUDED.volume,
  image = EXCLUDED.image;

-- 2. User Accounts Insert
INSERT INTO user_accounts (id, email, password_hash, user_type, status, created_at)
VALUES
('acc-admin', 'asyraf@klinikara.com', NULL, 'admin', 'active', '2026-01-01T00:00:00Z'),
('acc-ahmad', 'ahmad.rosli@example.my', NULL, 'affiliate', 'active', '2026-04-10T11:00:00Z'),
('acc-sarah', 'sarah.ismail@example.my', NULL, 'affiliate', 'active', '2026-03-12T14:30:00Z'),
('acc-kamal', 'kamal.ariffin@example.my', NULL, 'agent', 'active', '2026-01-01T10:00:00Z'),
('acc-lee', 'chongwei@example.com', NULL, 'customer', 'active', '2026-06-18T09:12:00Z')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  user_type = EXCLUDED.user_type,
  status = EXCLUDED.status,
  created_at = EXCLUDED.created_at;

-- 3. User Profiles Insert
INSERT INTO user_profiles (id, user_id, full_name, ic_number, ic_verified, date_of_birth, phone_number, whatsapp_number, avatar_url, created_at, updated_at)
VALUES
('prof-admin', 'acc-admin', 'Dr Asyraf Saharudin', '880112-14-5567', true, '1988-01-12', '+6011223344', '+6011223344', NULL, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
('prof-ahmad', 'acc-ahmad', 'Ahmad bin Rosli', '920410-06-5321', true, '1992-04-10', '+60112345678', '+60112345678', NULL, '2026-04-10T11:00:00Z', '2026-04-10T11:00:00Z'),
('prof-sarah', 'acc-sarah', 'Sarah binti Ismail', '950312-08-5432', true, '1995-03-12', '+60198765432', '+60198765432', NULL, '2026-03-12T14:30:00Z', '2026-03-12T14:30:00Z'),
('prof-kamal', 'acc-kamal', 'Kamal bin Ariffin', '890105-03-5123', true, '1989-01-05', '+60133334444', '+60133334444', NULL, '2026-01-01T10:00:00Z', '2026-01-01T10:00:00Z'),
('prof-lee', 'acc-lee', 'Lee Chong Wei', '821021-08-6677', false, '1982-10-21', '+60124445555', '+60124445555', NULL, '2026-06-18T09:12:00Z', '2026-06-18T09:12:00Z')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  ic_number = EXCLUDED.ic_number,
  ic_verified = EXCLUDED.ic_verified,
  date_of_birth = EXCLUDED.date_of_birth,
  phone_number = EXCLUDED.phone_number,
  whatsapp_number = EXCLUDED.whatsapp_number,
  updated_at = EXCLUDED.updated_at;

-- 4. User Addresses Insert
INSERT INTO user_addresses (id, user_id, address_type, full_address, postal_code, city, state, country, is_default)
VALUES
('adr-ahmad', 'acc-ahmad', 'delivery', 'Jalan Bukit Bintang, Pavilion Residences, Tower A-5-2', '55100', 'Kuala Lumpur', 'Wilayah Persekutuan', 'Malaysia', true),
('adr-sarah', 'acc-sarah', 'both', 'A-12-3, Vista Kondo, Ampang', '68000', 'Ampang', 'Selangor', 'Malaysia', true),
('adr-kamal', 'acc-kamal', 'delivery', 'Kampung Sungai Miang', '26600', 'Pekan', 'Pahang', 'Malaysia', true)
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  address_type = EXCLUDED.address_type,
  full_address = EXCLUDED.full_address,
  postal_code = EXCLUDED.postal_code,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  is_default = EXCLUDED.is_default;

-- 5. Bank Accounts Insert
INSERT INTO bank_accounts (id, user_id, account_holder_name, bank_name, account_number, account_type, is_verified, is_default)
VALUES
('bnk-ahmad', 'acc-ahmad', 'Ahmad bin Rosli', 'Maybank', '164012345678', 'savings', true, true),
('bnk-sarah', 'acc-sarah', 'Sarah binti Ismail', 'CIMB Bank', '701234567890', 'savings', true, true),
('bnk-kamal', 'acc-kamal', 'Kamal bin Ariffin', 'Public Bank', '302456782', 'current', true, true)
ON CONFLICT (id) DO UPDATE SET
  account_holder_name = EXCLUDED.account_holder_name,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  account_type = EXCLUDED.account_type,
  is_verified = EXCLUDED.is_verified,
  is_default = EXCLUDED.is_default;

-- 6. Affiliates Insert
INSERT INTO affiliates (id, user_id, name, email, whatsapp, code, signup_date, tier, units_sold, lifetime_sales, lifetime_commissions, bank_account_id)
VALUES
('aff-ahmad', 'acc-ahmad', 'Ahmad bin Rosli', 'ahmad.rosli@example.my', '+60112345678', 'AHMAD10', '2026-04-10', 'Bronze', 22, 2420, 242, 'bnk-ahmad'),
('aff-sarah', 'acc-sarah', 'Sarah binti Ismail', 'sarah.ismail@example.my', '+60198765432', 'SARAH15', '2026-03-12', 'Silver', 85, 11050, 1657.5, 'bnk-sarah')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  whatsapp = EXCLUDED.whatsapp,
  code = EXCLUDED.code,
  tier = EXCLUDED.tier,
  units_sold = EXCLUDED.units_sold,
  lifetime_sales = EXCLUDED.lifetime_sales,
  lifetime_commissions = EXCLUDED.lifetime_commissions,
  bank_account_id = EXCLUDED.bank_account_id;

-- 7. Agents Insert
INSERT INTO agents (id, user_id, agent_tier, initial_stock_purchase, stock_balance, stock_allocated, discount_rate, commission_rate, max_inventory, bank_account_id, verified_at, created_at, updated_at)
VALUES
('agt-kamal', 'acc-kamal', 'Gold', 15000, 176, 176, 0.40, 0.25, -1, 'bnk-kamal', '2026-01-01T11:00:00Z', '2026-01-01T10:00:00Z', '2026-01-01T10:00:00Z')
ON CONFLICT (id) DO UPDATE SET
  agent_tier = EXCLUDED.agent_tier,
  initial_stock_purchase = EXCLUDED.initial_stock_purchase,
  stock_balance = EXCLUDED.stock_balance,
  stock_allocated = EXCLUDED.stock_allocated,
  discount_rate = EXCLUDED.discount_rate,
  commission_rate = EXCLUDED.commission_rate,
  max_inventory = EXCLUDED.max_inventory,
  bank_account_id = EXCLUDED.bank_account_id,
  verified_at = EXCLUDED.verified_at;

-- 8. Agent Stock Logs Insert
INSERT INTO agent_stock_log (id, agent_id, product_id, quantity, action, transaction_id, notes, created_at)
VALUES
('log-1', 'agt-kamal', 'p1', 100, 'purchase', 'txn-initial-gold', 'Initial Tier Gold Purchase Bundle allocation.', '2026-01-01T10:30:00Z'),
('log-2', 'agt-kamal', 'p2', 76, 'purchase', 'txn-initial-gold', 'Initial Tier Gold Purchase Bundle allocation.', '2026-01-01T10:30:00Z')
ON CONFLICT (id) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  action = EXCLUDED.action,
  notes = EXCLUDED.notes;

-- 9. Orders Insert
INSERT INTO orders (id, customer_name, customer_email, customer_phone, shipping_address, branch_id, items, total, referral_code, affiliate_commission, affiliate_id, agent_id, commission_paid, payment_status, fulfillment_status, created_at)
VALUES
('ord-1001', 'Lee Chong Wei', 'chongwei@example.com', '+60124445555', 'A-12-3, Vista Kondo, Ampang, Selangor', 'b2', '[{"productId": "p2", "productName": "Madu Tualang Lipis - Premium Black Honey", "quantity": 2, "price": 150}]'::jsonb, 300, 'SARAH15', 45, 'aff-sarah', NULL, true, 'Paid', 'Shipped', '2026-06-18T10:30:00Z')
ON CONFLICT (id) DO UPDATE SET
  customer_name = EXCLUDED.customer_name,
  customer_email = EXCLUDED.customer_email,
  total = EXCLUDED.total,
  payment_status = EXCLUDED.payment_status,
  fulfillment_status = EXCLUDED.fulfillment_status;

-- 10. Website Config (CMS) Insert
INSERT INTO website_config (id, site_name, site_description, logo_url, primary_color, secondary_color, contact_phone, contact_email, facebook_link, instagram_link)
VALUES
('default', 'Madu Plus Tualang', 'Direct, premium raw wild Tualang Honey. Authentic jungle curation & modern affiliate structure.', NULL, '#EE4D2D', '#C0392B', '+6011-223344', 'hq@maduplus.my', 'https://fb.com/maduplus', 'https://instagram.com/maduplus')
ON CONFLICT (id) DO UPDATE SET
  site_name = EXCLUDED.site_name,
  site_description = EXCLUDED.site_description,
  contact_phone = EXCLUDED.contact_phone,
  contact_email = EXCLUDED.contact_email;

-- 11. Website Pages (CMS) Insert
INSERT INTO website_pages (id, slug, title, content, published, updated_at)
VALUES
('page-about', 'about', 'Pure Harvesting Legacy', '### Sourced Direct From Tualang Giants

Unlike commercially farm-raised honey, **Madu Plus** is strictly hand-harvested by veteran climbers scaling 80-meter high Tualang trees (**Koompassia excelsa**) in Pahang tropical woodlands. Our hunters extract the raw wild honey in limited quantities, maintaining the highest bio-active nutrients possible.

### Benefits of Wild Tualang Honey

* **Anti-Bacterial Core:** Combats winter cold and cough naturally.
* **Lower Glycemic Impact:** Perfect substitute for table sugars.
* **Antioxidant Enriched:** Contains high organic phenolic acid structures.

Enjoy pure nectar, unfiltered, direct from nature''s canopy.', true, '2026-06-21T00:00:00Z')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  published = EXCLUDED.published,
  updated_at = EXCLUDED.updated_at;

-- ====================================================================
-- SEEDING SUCCESS ACKNOWLEDGEMENT QUERY
-- ====================================================================
SELECT 'Madu Plus Tualang Supabase Backend tables created & seeded successfully!' as status;
