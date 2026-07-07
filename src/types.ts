/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TierType = 'Bronze' | 'Silver' | 'Gold';
export type UserType = 'customer' | 'affiliate' | 'agent' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'inactive' | 'pending_verification';

export interface UserAccount {
  id: string;
  email: string;
  userType: UserType;
  status: UserStatus;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  fullName: string;
  icNumber: string; // 12-digit Malaysian IC format: 123456-12-1234
  icVerified: boolean;
  dateOfBirth?: string; // extracted from IC
  phoneNumber?: string;
  whatsappNumber?: string;
  avatarUrl?: string;
}

export interface UserAddress {
  id: string;
  userId: string;
  addressType: 'billing' | 'delivery' | 'both';
  fullAddress: string;
  postalCode: string;
  city: string;
  state: string;
  country: string; // default "Malaysia"
  isDefault: boolean;
}

export interface BankAccount {
  id: string;
  userId: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  accountType: 'savings' | 'current';
  isVerified: boolean;
  isDefault: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: 'Honey' | 'Coconut Oil';
  price: number; // in MYR (RM)
  description: string;
  stock: number;
  image: string;
  volume: string; // e.g. "500g", "250ml"
  images?: string[];
  
  // Extended SKU / Inventory attributes
  sku?: string;
  costPrice?: number;
  longDescription?: string;
  weight?: number; // in grams
  dimensions?: string;
  barcode?: string;
  status?: 'active' | 'inactive' | 'discontinued' | 'draft';
  isHalalCertified?: boolean;
  halalCertNumber?: string;
  isBumiputera?: boolean;
  healthWarning?: string;
  isFeatured?: boolean;
  featuredUntil?: string;
  isFlashSale?: boolean;
  flashSalePrice?: number;
  flashSaleStart?: string;
  flashSaleEnd?: string;
  discountPercentage?: number;
  avgRating?: number;
  totalReviews?: number;
  totalSales?: number;
  slug?: string;
  createdAt?: string;
}

export interface ProductCategory {
  id: string;
  categoryName: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

export interface InventoryItem {
  id: string;
  productId: string;
  warehouseId: string; // matches branchId
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderLevel: number;
  reorderQuantity: number;
  batchNumber?: string;
  expiryDate?: string;
  manufactureDate?: string;
  isLowStock?: boolean;
  isOutOfStock?: boolean;
  lastPurchasePrice?: number;
  lastPurchaseDate?: string;
}

export type StockMovementType = 
  | 'stock_in' 
  | 'stock_out' 
  | 'transfer_out'
  | 'transfer_in'
  | 'adjustment'
  | 'damaged'
  | 'expired'
  | 'sale'
  | 'return'
  | 'write_off';

export interface StockMovement {
  id: string;
  productId: string;
  warehouseId: string; // matches branchId
  movementType: StockMovementType;
  quantity: number; // positive or negative
  reason: string;
  referenceNumber?: string;
  notes?: string;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  orderId?: string;
  requiresApproval?: boolean;
  approvedBy?: string;
  approvedAt?: string;
  approvalNotes?: string;
  createdBy: string;
  createdAt: string;
}

export interface StockAlert {
  id: string;
  productId: string;
  warehouseId: string;
  alertType: 'low_stock' | 'out_of_stock' | 'expired_soon' | 'expiry_reached' | 'overstock';
  currentQuantity: number;
  thresholdValue: number;
  isResolved: boolean;
  resolvedAt?: string;
  createdAt: string;
}

export interface ProductPricingHistory {
  id: string;
  productId: string;
  oldPrice: number;
  newPrice: number;
  changeReason: string;
  effectiveDate: string;
  changedBy: string;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  parentProductId: string;
  variantSku: string;
  variantName: string;
  variantValue: string;
  additionalPrice: number;
  imageUrl?: string;
}

export interface ProductSupplier {
  id: string;
  supplierName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  minOrderQuantity?: number;
  leadTimeDays?: number;
  isActive: boolean;
}

export interface Affiliate {
  id: string;
  userId?: string;
  name: string;
  email: string;
  whatsapp: string;
  code: string; // e.g., "TUALANG123"
  signupDate: string;
  tier: TierType;
  unitsSold: number;
  lifetimeSales: number;
  lifetimeCommissions: number;
  bankAccountId?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'blacklisted';
  recruitedBy?: string; // id of recruiter affiliate
  clicks?: number;
  conversions?: number;
  commissionOverride?: number; // Override percentage (e.g. 18.5)
  taxId?: string;
}

export interface Agent {
  id: string; // AGT---
  userId: string;
  agentTier: TierType;
  initialStockPurchase: number;
  stockBalance: number;
  stockAllocated: number;
  discountRate: number; // e.g. 0.20, 0.30, 0.40
  commissionRate: number; // e.g. 0.15, 0.20, 0.25
  maxInventory: number; // e.g. 100, 500, -1 (unlimited)
  bankAccountId?: string;
  verifiedAt?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'blacklisted';
  territory?: string;
  recruitedBy?: string;
  totalSalesVolume?: number;
  totalSalesAmount?: number;
  lifetimePayouts?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgentStockLog {
  id: string;
  agentId: string;
  productId: string;
  quantity: number;
  action: 'purchase' | 'sale' | 'return' | 'adjustment';
  transactionId?: string;
  notes?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  branchId: string;
  items: OrderItem[];
  total: number;
  referralCode?: string;
  affiliateCommission?: number;
  affiliateId?: string;
  agentId?: string; // linked if agent purchased or fulfilled
  commissionPaid: boolean;
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  fulfillmentStatus: 'Processing' | 'Shipped' | 'Delivered';
  createdAt: string;
}

export interface Branch {
  id: string;
  name: string;
  state: string;
  manager: string;
}

// Website CMS & Config schema
export interface WebsiteConfig {
  siteName: string;
  siteDescription: string;
  logoUrl?: string;
  primaryColor?: string; // Hex code
  secondaryColor?: string; // Hex code
  contactPhone?: string;
  contactEmail?: string;
  facebookLink?: string;
  instagramLink?: string;
}

export interface WebsitePage {
  id: string;
  slug: string;
  title: string;
  content: string; // Markdown or rich text
  published: boolean;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  changes: string;
  createdAt: string;
}
