/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { Order, UserAccount, UserStatus, WebsitePage, Affiliate, Agent, TierType } from '../types';
import { 
  ShieldCheck, 
  Award,
  Package, 
  FileText, 
  Building2, 
  TrendingUp, 
  Clock,
  Database,
  AlertCircle,
  Users,
  CheckCircle2,
  Settings,
  Eye,
  Search,
  ShieldAlert,
  Send,
  Download,
  Trash2,
  Edit2,
  UserPlus,
  X,
  Phone,
  MapPin,
  CreditCard
} from 'lucide-react';
import { isSupabaseConfigured, getSupabaseSQLSchema } from '../lib/supabase';
import { InventoryManager } from './InventoryManager';

export const AdminOperations: React.FC = () => {
  const {
    products,
    affiliates,
    orders,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    updateOrderStatus,
    toggleCommissionPaid,
    supabaseConnected,
    seedSupabase,
    language,
    userAccounts,
    userProfiles,
    bankAccounts,
    verifyIC,
    verifyBankAccount,
    updateUserStatus,
    updateUserRole,
    updateUserProfile,
    deleteUserAccount,
    adminCreateUserAccount,
    addBankAccount,
    editBankAccount,
    websiteConfig,
    updateCMSConfig,
    websitePages,
    upsertCMSPage,
    auditLogs,
    agents,
    agentStockLogs,
    addresses,
    addAuditLog,
    updateAffiliate,
    updateAgent,
    purchaseAgentStock,
    currentUserAccount
  } = useAppState();

  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'orders' | 'users' | 'inventory' | 'cms' | 'affiliates' | 'agents' | 'audit' | 'db_viewer'>('orders');

  // Extended state variables for Affiliate & Agent Management
  const [affiliateSubView, setAffiliateSubView] = useState<'list' | 'payouts' | 'recruitment' | 'analytics' | 'comms'>('list');
  const [agentSubView, setAgentSubView] = useState<'list' | 'stock' | 'sales' | 'analytics'>('list');

  // Affiliate filtering / sorting states
  const [affSearch, setAffSearch] = useState('');
  const [affStatusFilter, setAffStatusFilter] = useState<string>('all');
  const [affTierFilter, setAffTierFilter] = useState<string>('all');
  const [affRankFilter, setAffRankFilter] = useState<string>('all');
  const [affSortBy, setAffSortBy] = useState<string>('sales');

  // Affiliate details modal states
  const [selectedAff, setSelectedAff] = useState<Affiliate | null>(null);
  const [showAffModal, setShowAffModal] = useState(false);
  const [editAffTier, setEditAffTier] = useState<TierType>('Bronze');
  const [editAffStatus, setEditAffStatus] = useState<'active' | 'inactive' | 'suspended' | 'blacklisted'>('active');
  const [editAffOverride, setEditAffOverride] = useState<string>('');

  // Agent filtering / sorting states
  const [agentSearch, setAgentSearch] = useState('');
  const [agentStatusFilter, setAgentStatusFilter] = useState<string>('all');
  const [agentTierFilter, setAgentTierFilter] = useState<string>('all');
  const [agentStockFilter, setAgentStockFilter] = useState<string>('all');
  const [agentSortBy, setAgentSortBy] = useState<string>('sales');

  // Agent details modal states
  const [selectedAgt, setSelectedAgt] = useState<Agent | null>(null);
  const [showAgtModal, setShowAgtModal] = useState(false);
  const [editAgtTier, setEditAgtTier] = useState<TierType>('Bronze');
  const [editAgtStatus, setEditAgtStatus] = useState<'active' | 'inactive' | 'suspended' | 'blacklisted'>('active');
  const [editAgtTerritory, setEditAgtTerritory] = useState('');

  // Bulk / Commission payout processing
  // Financial cycle periods generated dynamically (current + previous 2 months)
  const payoutPeriods = React.useMemo(() => {
    const fmt = new Intl.DateTimeFormat('en-MY', { month: 'long', year: 'numeric' });
    return [0, 1, 2].map(offset => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - offset);
      return fmt.format(d);
    });
  }, []);
  const [selectedPayoutPeriod, setSelectedPayoutPeriod] = useState(() => {
    const fmt = new Intl.DateTimeFormat('en-MY', { month: 'long', year: 'numeric' });
    return fmt.format(new Date());
  });
  const [selectedPayoutMethod, setSelectedPayoutMethod] = useState<'bank_transfer' | 'paypal' | 'check'>('bank_transfer');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('main_business');
  const [payoutScheduleDate, setPayoutScheduleDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7); // default: settle within 7 days
    return d.toISOString().split('T')[0];
  });
  const [payoutNotes, setPayoutNotes] = useState('');
  const [bulkCommissionsFeedback, setBulkCommissionsFeedback] = useState<string | null>(null);

  // Recruitment / Invite states
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteReferrerId, setInviteReferrerId] = useState('');
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);

  // Campaign Comms state
  const [campaignChannel, setCampaignChannel] = useState<'email' | 'sms' | 'in_app'>('email');
  const [campaignRecipients, setCampaignRecipients] = useState<'all' | 'Bronze' | 'Silver' | 'Gold' | 'top_performers'>('all');
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignBody, setCampaignBody] = useState('');
  const [campaignFeedback, setCampaignFeedback] = useState<string | null>(null);
  const [campaignHistory, setCampaignHistory] = useState<any[]>([]);

  // Agent Stock / Reorder states
  const [reorderProductId, setReorderProductId] = useState<string>(products[0]?.id || '');
  const [reorderQty, setReorderQty] = useState(20);
  const [adjustmentReason, setAdjustmentReason] = useState('Manual audit alignment');
  const [stockSuccessMsg, setStockSuccessMsg] = useState<string | null>(null);

  // Search filter
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserTypeFilter, setSelectedUserTypeFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [userVerificationFilter, setUserVerificationFilter] = useState<'all' | 'certified' | 'pending_ic' | 'verified_bank' | 'pending_bank'>('all');
  const [userSortOption, setUserSortOption] = useState<'newest' | 'oldest' | 'name_asc' | 'email_asc'>('newest');

  // Detailed modal and forms
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<UserAccount | null>(null);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [userEditMode, setUserEditMode] = useState(false);

  // Editable fields for user details panel
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserWhatsapp, setEditUserWhatsapp] = useState('');
  const [editUserIC, setEditUserIC] = useState('');
  const [editUserRole, setEditUserRole] = useState<'customer' | 'affiliate' | 'agent' | 'admin'>('customer');
  const [editUserStatus, setEditUserStatus] = useState<UserStatus>('active');
  
  // Editable bank fields inside user details panel
  const [editBankName, setEditBankName] = useState('');
  const [editBankAccountNo, setEditBankAccountNo] = useState('');
  const [editBankAccountHolder, setEditBankAccountHolder] = useState('');
  const [editFeedback, setEditFeedback] = useState<string | null>(null);

  // Form fields for creating a new user account
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newIC, setNewIC] = useState('');
  const [newRole, setNewRole] = useState<'customer' | 'affiliate' | 'agent' | 'admin'>('customer');
  const [newStatus, setNewStatus] = useState<UserStatus>('active');
  const [newBankName, setNewBankName] = useState('');
  const [newBankAccountNo, setNewBankAccountNo] = useState('');
  const [newBankAccountHolder, setNewBankAccountHolder] = useState('');
  const [createFeedback, setCreateFeedback] = useState<string | null>(null);

  // Inventory manual restock qty

  // SQL Script visualizer state
  const [copied, setCopied] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Dynamic CMS edits
  const [cmsSiteName, setCmsSiteName] = useState(websiteConfig.siteName);
  const [cmsSiteDesc, setCmsSiteDesc] = useState(websiteConfig.siteDescription);
  const [cmsEmail, setCmsEmail] = useState(websiteConfig.contactEmail || '');
  const [cmsPhone, setCmsPhone] = useState(websiteConfig.contactPhone || '');
  const [cmsPrimaryColor, setCmsPrimaryColor] = useState(websiteConfig.primaryColor || '#1580c2');
  const [cmsLogoUrl, setCmsLogoUrl] = useState(websiteConfig.logoUrl || '');
  const [cmsSavedMsg, setCmsSavedMsg] = useState(false);

  // Pages CMS state variables
  const [selectedPageSlug, setSelectedPageSlug] = useState('about');
  const [pageTitleEdit, setPageTitleEdit] = useState('');
  const [pageContentEdit, setPageContentEdit] = useState('');
  const [pageSavedMsg, setPageSavedMsg] = useState(false);

  // Simulation email tester state variables
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState('welcome_aff');
  const [testEmailAddress, setTestEmailAddress] = useState('affiliate-partner@example.my');
  const [testVariableUser, setTestVariableUser] = useState('Ahmad bin Rosli');
  const [testVariableCode, setTestVariableCode] = useState('AHMAD10');
  const [emailPreviewSent, setEmailPreviewSent] = useState(false);

  // Database Console Viewer states
  const [dbTable, setDbTable] = useState<string>('user_accounts');
  const [dbSearchText, setDbSearchText] = useState<string>('');
  const [viewingDetailRow, setViewingDetailRow] = useState<any | null>(null);
  const [recordCopied, setRecordCopied] = useState(false);

  // Sync edit boxes whenever selected slug changes
  React.useEffect(() => {
    const page = websitePages.find(p => p.slug === selectedPageSlug);
    if (page) {
      setPageTitleEdit(page.title);
      setPageContentEdit(page.content);
    } else {
      setPageTitleEdit('');
      setPageContentEdit('');
    }
  }, [selectedPageSlug, websitePages]);

  // Aggregate stats across ERP network
  const paidOrders = orders.filter(o => o.paymentStatus === 'Paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

  const totalCommissionsOwed = paidOrders
    .filter(o => o.affiliateCommission)
    .reduce((sum, o) => sum + (o.affiliateCommission || 0), 0);

  const totalCommissionsPaid = paidOrders
    .filter(o => o.affiliateCommission && o.commissionPaid)
    .reduce((sum, o) => sum + (o.affiliateCommission || 0), 0);

  const totalCommissionsUnpaid = totalCommissionsOwed - totalCommissionsPaid;

  const handleCopySql = () => {
    navigator.clipboard.writeText(getSupabaseSQLSchema());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSeedAction = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await seedSupabase();
      setSeedResult(res);
    } catch (err: any) {
      setSeedResult({ success: false, message: err.message || String(err) });
    } finally {
      setSeeding(false);
    }
  };

  // Save Website CMS configurations
  const handleSaveCMSConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateCMSConfig({
      siteName: cmsSiteName,
      siteDescription: cmsSiteDesc,
      contactEmail: cmsEmail,
      contactPhone: cmsPhone,
      primaryColor: cmsPrimaryColor,
      logoUrl: cmsLogoUrl
    });
    setCmsSavedMsg(true);
    setTimeout(() => setCmsSavedMsg(false), 2500);
  };

  // Save CMS dynamic pages
  const handleSaveCMSPage = (e: React.FormEvent) => {
    e.preventDefault();
    const currPage = websitePages.find(p => p.slug === selectedPageSlug);
    const pageId = currPage ? currPage.id : `page-${selectedPageSlug}`;
    
    const newPage: WebsitePage = {
      id: pageId,
      slug: selectedPageSlug,
      title: pageTitleEdit,
      content: pageContentEdit,
      published: true,
      updatedAt: new Date().toISOString()
    };
    upsertCMSPage(newPage);
    setPageSavedMsg(true);
    setTimeout(() => setPageSavedMsg(false), 2500);
  };

  // Send test email: opens the admin's mail client with the rendered template
  const handleSendTestEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress) return;

    const subjects: Record<string, string> = {
      welcome_aff: `Welcome ${testVariableUser}! Your Referral link is ready.`,
      welcome_agt: `Agent Account Created: ${testVariableUser} Tier Confirmation.`,
      receipt_order: `Shipment receipt confirmation for your ${websiteConfig.siteName} order.`,
      bank_verified: `Recipient payouts certified - Bank account verification success.`
    };
    const bodies: Record<string, string> = {
      welcome_aff: `Hi ${testVariableUser},\n\nWelcome to the official ${websiteConfig.siteName} Affiliate programme!\n\nYour unique affiliate referral code is: ${testVariableCode}\n\nUse your code to refer shoppers. You earn a 10% commission on Bronze tier, scaling to 20% on Gold tier as your sales volume expands.\n\n${websiteConfig.siteName} HQ, Pahang, Malaysia`,
      welcome_agt: `Hi ${testVariableUser},\n\nWelcome to the certified reseller family. Your application profile is approved.\n\nOur Pahang warehouse distribution hub has allocated your initial Tualang bulk honey inventory. Manage stock, restocks, and share links from your agent panel.\n\n${websiteConfig.siteName} HQ, Pahang, Malaysia`,
      receipt_order: `Hi ${testVariableUser},\n\nThank you for shopping pure unprocessed wild honey. Your settlement transaction is verified.\n\nA regional delivery carrier will soon collect your parcel, and tracking updates will be sent directly to your WhatsApp.\n\n${websiteConfig.siteName} HQ, Pahang, Malaysia`,
      bank_verified: `Hi ${testVariableUser},\n\nWe completed a validation check on your linked bank account details.\n\nYour payouts account is marked ACTIVE. Commission dividends accumulate on direct sales events, with payouts released every month.\n\n${websiteConfig.siteName} HQ, Pahang, Malaysia`
    };

    window.location.href = `mailto:${testEmailAddress}?subject=${encodeURIComponent(subjects[selectedEmailTemplate] || '')}&body=${encodeURIComponent(bodies[selectedEmailTemplate] || '')}`;
    setEmailPreviewSent(true);
    setTimeout(() => setEmailPreviewSent(false), 4500);
  };

  // Open detailed user view and populate edit states
  const handleOpenUserDetails = (user: UserAccount) => {
    setSelectedUserForDetails(user);
    const profile = userProfiles.find(p => p.userId === user.id);
    const bank = bankAccounts.find(b => b.userId === user.id && b.isDefault);
    
    setEditUserName(profile?.fullName || '');
    setEditUserEmail(user.email || '');
    setEditUserPhone(profile?.phoneNumber || '');
    setEditUserWhatsapp(profile?.whatsappNumber || '');
    setEditUserIC(profile?.icNumber || '');
    setEditUserRole(user.userType);
    setEditUserStatus(user.status);
    setEditBankName(bank?.bankName || '');
    setEditBankAccountNo(bank?.accountNumber || '');
    setEditBankAccountHolder(bank?.accountHolderName || '');
    setUserEditMode(false);
    setEditFeedback(null);
  };

  // Submit profile & bank edits
  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForDetails) return;

    try {
      // 1. Update status
      if (selectedUserForDetails.status !== editUserStatus) {
        updateUserStatus(selectedUserForDetails.id, editUserStatus);
      }

      // 2. Update role
      if (selectedUserForDetails.userType !== editUserRole) {
        updateUserRole(selectedUserForDetails.id, editUserRole);
      }

      // 3. Update profile details
      updateUserProfile(selectedUserForDetails.id, {
        fullName: editUserName,
        phoneNumber: editUserPhone,
        whatsappNumber: editUserWhatsapp,
        icNumber: editUserIC
      });

      // 4. Update bank details if they were modified
      const currentBank = bankAccounts.find(b => b.userId === selectedUserForDetails.id && b.isDefault);
      if (editBankName || editBankAccountNo) {
        if (currentBank) {
          editBankAccount(currentBank.id, {
            bankName: editBankName,
            accountNumber: editBankAccountNo,
            accountHolderName: editBankAccountHolder || editUserName
          });
        } else {
          addBankAccount({
            userId: selectedUserForDetails.id,
            bankName: editBankName,
            accountNumber: editBankAccountNo,
            accountHolderName: editBankAccountHolder || editUserName,
            accountType: 'savings',
            isVerified: true,
            isDefault: true
          });
        }
      }

      setEditFeedback('User account updated successfully');
      // Refresh selectedUserForDetails with latest accounts
      setTimeout(() => {
        const refreshed = userAccounts.find(a => a.id === selectedUserForDetails.id);
        if (refreshed) {
          setSelectedUserForDetails(refreshed);
        }
        setUserEditMode(false);
        setEditFeedback(null);
      }, 1500);

    } catch (err: any) {
      setEditFeedback(`Error updating user: ${err.message || err}`);
    }
  };

  // Submit new user manual creation
  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFeedback(null);

    if (!newEmail || !newFullName) {
      setCreateFeedback('Email and Full Name are required');
      return;
    }

    try {
      const res = adminCreateUserAccount({
        email: newEmail,
        fullName: newFullName,
        userType: newRole,
        status: newStatus,
        phoneNumber: newPhone,
        whatsappNumber: newWhatsapp,
        icNumber: newIC,
        bankName: newBankName,
        accountNumber: newBankAccountNo,
        accountHolderName: newBankAccountHolder || newFullName
      });

      if (res.success) {
        setCreateFeedback('Success! Account created successfully.');
        setTimeout(() => {
          // Clear states
          setNewEmail('');
          setNewFullName('');
          setNewPhone('');
          setNewWhatsapp('');
          setNewIC('');
          setNewRole('customer');
          setNewStatus('active');
          setNewBankName('');
          setNewBankAccountNo('');
          setNewBankAccountHolder('');
          setCreateFeedback(null);
          setShowCreateUserModal(false);
        }, 1500);
      }
    } catch (err: any) {
      setCreateFeedback(`Error creating user: ${err.message || err}`);
    }
  };

  // Custom deletion state
  const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null);

  const handleDeleteUserClick = (accountId: string) => {
    setUserToDeleteId(accountId);
  };

  const confirmDeleteUser = () => {
    if (userToDeleteId) {
      deleteUserAccount(userToDeleteId);
      setUserToDeleteId(null);
      setSelectedUserForDetails(null);
    }
  };

  // Filter accounts list matching searches
  const filteredUsers = userAccounts.filter(acc => {
    const profile = userProfiles.find(p => p.userId === acc.id);
    const linkedBanks = bankAccounts.filter(b => b.userId === acc.id);
    const searchLower = userSearch.toLowerCase();

    const matchesSearch = 
      (acc.email && acc.email.toLowerCase().includes(searchLower)) || 
      (profile && profile.fullName && profile.fullName.toLowerCase().includes(searchLower)) ||
      (profile && profile.phoneNumber && profile.phoneNumber.includes(userSearch)) ||
      (profile && profile.icNumber && profile.icNumber.includes(userSearch)) ||
      linkedBanks.some(b => b.accountNumber.includes(userSearch));
    
    const matchesRole = selectedUserTypeFilter === 'all' || acc.userType === selectedUserTypeFilter;
    const matchesStatus = userStatusFilter === 'all' || acc.status === userStatusFilter;

    let matchesVerification = true;
    if (userVerificationFilter === 'certified') {
      matchesVerification = !!(profile && profile.icVerified);
    } else if (userVerificationFilter === 'pending_ic') {
      matchesVerification = !!(profile && profile.icNumber && !profile.icVerified);
    } else if (userVerificationFilter === 'verified_bank') {
      matchesVerification = linkedBanks.length > 0 && linkedBanks.some(b => b.isVerified);
    } else if (userVerificationFilter === 'pending_bank') {
      matchesVerification = linkedBanks.length > 0 && linkedBanks.some(b => !b.isVerified);
    }

    return matchesSearch && matchesRole && matchesStatus && matchesVerification;
  }).sort((a, b) => {
    const profileA = userProfiles.find(p => p.userId === a.id);
    const profileB = userProfiles.find(p => p.userId === b.id);
    const nameA = profileA?.fullName || '';
    const nameB = profileB?.fullName || '';

    if (userSortOption === 'newest') {
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    } else if (userSortOption === 'oldest') {
      return new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime();
    } else if (userSortOption === 'name_asc') {
      return nameA.localeCompare(nameB);
    } else if (userSortOption === 'email_asc') {
      return (a.email || '').localeCompare(b.email || '');
    }
    return 0;
  });

  // Isolated Branch variables
  const currentBranch = branches.find(b => b.id === selectedBranchId);
  const branchRevenue = paidOrders.filter(o => o.branchId === selectedBranchId).reduce((sum, o) => sum + o.total, 0);
  const branchUnits = paidOrders.filter(o => o.branchId === selectedBranchId).reduce((sum, o) => {
    return sum + o.items.reduce((s, i) => s + i.quantity, 0);
  }, 0);
  const isolatedOrders = orders.filter(o => o.branchId === selectedBranchId);

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto px-4 lg:px-6">
      
      {/* Top control banner header */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-[#1580c2]/10 rounded-xl flex items-center justify-center text-[#1580c2]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-sans text-lg font-bold text-slate-900">Madu Plus Admin</h2>
            <p className="text-xs text-slate-400">
              Admin &middot; {currentUserAccount?.email || 'HQ Session'}
            </p>
          </div>
        </div>

        {/* Global Hub selection */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 border border-slate-200 rounded-xl w-full md:w-auto">
          <Building2 className="h-4 w-4 text-[#1580c2] shrink-0" />
          <div className="flex-1 md:flex-initial flex items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-450">Branch:</span>
            <select
              value={selectedBranchId}
              onChange={e => setSelectedBranchId(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-800 focus:ring-0 focus:outline-none cursor-pointer pr-4"
            >
              {branches.map(b => (
                <option key={b.id} value={b.id} className="text-gray-900 font-bold bg-white">{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Slim compact status strip */}
      {currentBranch && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-600 shadow-sm">
          <div className="flex flex-wrap items-center gap-1.5 md:gap-3">
            <div className="flex items-center gap-1">
              <Building2 className="h-4 w-4 text-[#1580c2] shrink-0" />
              <span>
                Viewing: <strong className="text-slate-900 font-semibold">{currentBranch.name}</strong> &middot; Director <strong className="text-slate-900 font-semibold">{currentBranch.manager}</strong>
              </span>
            </div>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="text-slate-500 text-[11px]">
              Sales: <strong className="text-slate-800 font-medium">RM {branchRevenue.toFixed(2)}</strong> &middot; Volume: <strong className="text-slate-800 font-medium">{branchUnits} units</strong>
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Sync Status Pill */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 border border-slate-200">
              <span className={`h-1.5 w-1.5 rounded-full ${supabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-slate-600">
                {supabaseConnected ? 'Synced to Supabase' : 'Local sandbox'}
              </span>
            </div>

            {/* Existing Get Script button */}
            <button
              onClick={() => setShowSql(!showSql)}
              className="px-2.5 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-sans font-semibold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5" /> {showSql ? 'Hide SQL' : 'Get Script'}
            </button>

            {isSupabaseConfigured && (
              <button
                onClick={handleSeedAction}
                disabled={seeding}
                className="px-3 py-1 rounded-xl bg-[#1580c2] hover:bg-[#116499] text-white font-sans font-bold text-[10px] shadow-sm transition-all flex items-center gap-1 cursor-pointer"
              >
                {seeding ? 'Seeding...' : 'Seed DB'}
              </button>
            )}
          </div>
        </div>
      )}

      {seedResult && (
        <div className={`p-3 rounded-xl text-xs flex gap-2 border leading-relaxed ${seedResult.success ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-red-50 text-red-900 border-red-250'}`}>
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{seedResult.message}</span>
        </div>
      )}

      {showSql && (
        <div className="bg-gray-900 p-4 rounded-2xl relative border border-gray-800 text-left">
          <div className="flex justify-between items-center text-[10px] text-gray-550 border-b border-gray-800 pb-2 mb-3">
            <span className="font-bold tracking-widest font-mono text-gray-400">POSTGRES TABLE SCHEMA</span>
            <button 
              onClick={handleCopySql}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[9px] font-semibold transition-all flex items-center gap-1"
            >
              {copied ? '✓ Copied' : 'Copy Script'}
            </button>
          </div>
          <pre className="text-[10px] text-emerald-400 font-mono overflow-auto max-h-48 whitespace-pre leading-relaxed">
            {getSupabaseSQLSchema()}
          </pre>
        </div>
      )}

      {/* High-Level Corporate Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="block text-[11px] uppercase tracking-wide font-semibold text-slate-400">Revenue</span>
            <span className="block text-2xl font-bold text-slate-900 mt-1">RM {totalRevenue.toFixed(2)}</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium block mt-2">Paid orders</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="block text-[11px] uppercase tracking-wide font-semibold text-slate-400">Affiliate commissions</span>
            <span className="block text-2xl font-bold text-slate-900 mt-1">RM {totalCommissionsOwed.toFixed(2)}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium block mt-2">Generated via links</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="block text-[11px] uppercase tracking-wide font-semibold text-slate-400">Commissions paid</span>
            <span className="block text-2xl font-bold text-slate-900 mt-1">RM {totalCommissionsPaid.toFixed(2)}</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium block mt-2">Disbursed to partners</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="block text-[11px] uppercase tracking-wide font-semibold text-slate-400">Commissions pending</span>
            <span className="block text-2xl font-bold text-slate-900 mt-1">RM {totalCommissionsUnpaid.toFixed(2)}</span>
          </div>
          <span className="text-[10px] text-amber-600 font-medium block mt-2">Transfers pending</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column (hidden on mobile/tablet, sticky sidebar on desktop) */}
        <div className="lg:col-span-3 lg:sticky lg:top-24 space-y-4 lg:block hidden">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4 text-left">
            {/* Vertical menu tabs */}
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wide font-semibold text-slate-400 px-2 pb-2 block">
                Modules
              </span>
              
              <button
                onClick={() => setActiveAdminSubTab('orders')}
                className={`w-full flex items-center justify-between px-3 h-10 text-xs font-semibold rounded-xl transition-all cursor-pointer ${activeAdminSubTab === 'orders' ? 'bg-[#1580c2] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4" />
                  <span>Orders & Payouts</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${activeAdminSubTab === 'orders' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {isolatedOrders.length}
                </span>
              </button>
              
              <button
                onClick={() => setActiveAdminSubTab('users')}
                className={`w-full flex items-center justify-between px-3 h-10 text-xs font-semibold rounded-xl transition-all cursor-pointer ${activeAdminSubTab === 'users' ? 'bg-[#1580c2] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="h-4 w-4" />
                  <span>Users & KYC</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${activeAdminSubTab === 'users' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {userAccounts.length}
                </span>
              </button>
              
              <button
                onClick={() => setActiveAdminSubTab('cms')}
                className={`w-full flex items-center justify-between px-3 h-10 text-xs font-semibold rounded-xl transition-all cursor-pointer ${activeAdminSubTab === 'cms' ? 'bg-[#1580c2] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="h-4 w-4" />
                  <span>Website CMS</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveAdminSubTab('inventory')}
                className={`w-full flex items-center justify-between px-3 h-10 text-xs font-semibold rounded-xl transition-all cursor-pointer ${activeAdminSubTab === 'inventory' ? 'bg-[#1580c2] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <div className="flex items-center gap-2.5">
                  <Package className="h-4 w-4" />
                  <span>Inventory Control</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveAdminSubTab('affiliates')}
                className={`w-full flex items-center justify-between px-3 h-10 text-xs font-semibold rounded-xl transition-all cursor-pointer ${activeAdminSubTab === 'affiliates' ? 'bg-[#1580c2] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <div className="flex items-center gap-2.5">
                  <Award className="h-4 w-4" />
                  <span>Affiliates Ranks</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveAdminSubTab('agents')}
                className={`w-full flex items-center justify-between px-3 h-10 text-xs font-semibold rounded-xl transition-all cursor-pointer ${activeAdminSubTab === 'agents' ? 'bg-[#1580c2] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="h-4 w-4" />
                  <span>Agents & Stock</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${activeAdminSubTab === 'agents' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {agents.length}
                </span>
              </button>
              
              <button
                onClick={() => setActiveAdminSubTab('audit')}
                className={`w-full flex items-center justify-between px-3 h-10 text-xs font-semibold rounded-xl transition-all cursor-pointer ${activeAdminSubTab === 'audit' ? 'bg-[#1580c2] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Compliance Logs</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${activeAdminSubTab === 'audit' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {auditLogs.length}
                </span>
              </button>
              
              <button
                onClick={() => setActiveAdminSubTab('db_viewer')}
                className={`w-full flex items-center justify-between px-3 h-10 text-xs font-semibold rounded-xl transition-all cursor-pointer ${activeAdminSubTab === 'db_viewer' ? 'bg-[#1580c2] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <div className="flex items-center gap-2.5">
                  <Database className="h-4 w-4" />
                  <span>Database Console</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-9 space-y-6">
          {/* Action Subtabs Navigation (Mobile/Tablet only) */}
          <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-gray-50/50 p-1.5 rounded-2xl lg:hidden">
        <button
          onClick={() => setActiveAdminSubTab('orders')}
          className={`px-3.5 py-2 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer ${activeAdminSubTab === 'orders' ? 'bg-[#1580c2] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          Orders & Payouts ({isolatedOrders.length})
        </button>

        <button
          onClick={() => setActiveAdminSubTab('users')}
          className={`px-3.5 py-2 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer ${activeAdminSubTab === 'users' ? 'bg-[#1580c2] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          Users & Verifications ({userAccounts.length})
        </button>

        <button
          onClick={() => setActiveAdminSubTab('cms')}
          className={`px-3.5 py-2 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer ${activeAdminSubTab === 'cms' ? 'bg-[#1580c2] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          Website CMS Pages
        </button>

        <button
          onClick={() => setActiveAdminSubTab('inventory')}
          className={`px-3.5 py-2 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer ${activeAdminSubTab === 'inventory' ? 'bg-[#1580c2] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          Main Stock Inventory
        </button>

        <button
          onClick={() => setActiveAdminSubTab('affiliates')}
          className={`px-3.5 py-2 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer ${activeAdminSubTab === 'affiliates' ? 'bg-[#1580c2] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          Affiliates Ranks
        </button>

        <button
          onClick={() => setActiveAdminSubTab('agents')}
          className={`px-3.5 py-2 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer ${activeAdminSubTab === 'agents' ? 'bg-[#1580c2] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          Agents & Stock ({agents.length})
        </button>

        <button
          onClick={() => setActiveAdminSubTab('audit')}
          className={`px-3.5 py-2 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer ${activeAdminSubTab === 'audit' ? 'bg-[#1580c2] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          Compliance Logs ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveAdminSubTab('db_viewer')}
          className={`px-3.5 py-2 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer ${activeAdminSubTab === 'db_viewer' ? 'bg-[#1580c2] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          🗄️ Database Console
        </button>
      </div>

      {/* Orders Tab Content */}
      {activeAdminSubTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Station Fulfillment Register</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Manage customer retail checkout receipts & release referrer commissions</p>
            </div>
            <span className="text-[10px] font-mono bg-blue-50 text-[#1580c2] px-2.5 py-1 rounded-full border border-blue-105 font-bold">
              {isolatedOrders.length} Orders
            </span>
          </div>

          {isolatedOrders.length === 0 ? (
            <div className="p-12 text-center text-gray-400 space-y-2">
              <FileText className="h-10 w-10 text-gray-200 mx-auto" />
              <p className="text-xs font-bold text-gray-850">No orders compiled at this regional branch yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 font-bold text-gray-400 text-[10px] tracking-wider select-none">
                    <th className="px-4 py-3">Order Code</th>
                    <th className="px-4 py-3">Customer Pathways</th>
                    <th className="px-4 py-3">Bottles / Basket</th>
                    <th className="px-4 py-3">Total Cost</th>
                    <th className="px-4 py-3">Referral Link</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Payout Transfer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium text-gray-750">
                  {isolatedOrders.map((ord) => {
                    const totalItems = ord.items.reduce((sum, i) => sum + i.quantity, 0);
                    return (
                      <tr key={ord.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-4 font-mono font-black text-gray-900">{ord.id}</td>
                        <td className="px-4 py-4 space-y-0.5">
                          <p className="font-bold text-gray-900">{ord.customerName}</p>
                          <p className="text-[10px] text-gray-400">{ord.customerEmail}</p>
                          {ord.agentId && (
                            <span className="inline-block bg-teal-50 border border-teal-200 text-[9px] font-bold text-teal-800 px-1 py-0.2 rounded mt-1">
                              Sourced Agent: {ord.agentId}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-gray-800">{totalItems} bottles</p>
                          <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[140px]">
                            {ord.items.map(i => `${i.quantity}x ${i.productName.split(' - ')[0]}`).join(', ')}
                          </p>
                        </td>
                        <td className="px-4 py-4 font-black text-gray-900">RM {ord.total.toFixed(2)}</td>
                        <td className="px-4 py-4">
                          {ord.referralCode ? (
                            <div className="space-y-1">
                              <span className="font-mono bg-blue-50 text-blue-700 font-black px-1.5 py-0.5 rounded text-[8.5px] uppercase">
                                {ord.referralCode}
                              </span>
                              <p className="text-[10px] font-bold text-gray-900">RM {ord.affiliateCommission?.toFixed(2)}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={ord.paymentStatus}
                            onChange={(e) => updateOrderStatus(ord.id, e.target.value as Order['paymentStatus'], ord.fulfillmentStatus)}
                            className={`p-1.5 rounded-lg text-[10px] font-bold border-none focus:ring-1 outline-none ${ord.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}
                          >
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                            <option value="Failed">Failed</option>
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={ord.fulfillmentStatus}
                            onChange={(e) => updateOrderStatus(ord.id, ord.paymentStatus, e.target.value as Order['fulfillmentStatus'])}
                            className={`p-1.5 rounded-lg text-[10px] font-bold border-none focus:ring-1 outline-none ${ord.fulfillmentStatus === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}
                          >
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          {ord.referralCode ? (
                            <div className="flex flex-col items-start gap-1">
                              <span className={`px-2 py-0.5 rounded text-[8.5px] font-bold ${ord.commissionPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                {ord.commissionPaid ? 'Transferred' : 'Owed'}
                              </span>
                              <button
                                onClick={() => toggleCommissionPaid(ord.id)}
                                className="text-[10px] text-blue-700 hover:underline font-bold"
                              >
                                {ord.commissionPaid ? 'Mark unpaid' : 'Mark paid'}
                              </button>
                            </div>
                          ) : <span className="text-gray-400">-</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Users and manual verifications subtab */}
      {activeAdminSubTab === 'users' && (() => {
        // Compute statistics for the top visual cards
        const totalUsersCount = userAccounts.length;
        const customerCount = userAccounts.filter(u => u.userType === 'customer').length;
        const affiliateCount = userAccounts.filter(u => u.userType === 'affiliate').length;
        const agentCount = userAccounts.filter(u => u.userType === 'agent').length;
        const adminCount = userAccounts.filter(u => u.userType === 'admin').length;
        
        const certifiedCount = userProfiles.filter(p => p.icVerified).length;
        const pendingIcApproval = userProfiles.filter(p => p.icNumber && !p.icVerified).length;
        
        const totalBanks = bankAccounts.length;
        const pendingBankApproval = bankAccounts.filter(b => !b.isVerified).length;
        const suspendedCount = userAccounts.filter(u => u.status === 'suspended').length;

        return (
          <div className="space-y-6 animate-scale-up text-left">
            
            {/* Visual Statistics Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4.5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-50 text-[#1580c2]">
                  <Users className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Total Registrations</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-extrabold text-gray-900 leading-none">{totalUsersCount}</span>
                    <span className="text-[9px] text-gray-500 font-mono">
                      (C:{customerCount} Af:{affiliateCount} Ag:{agentCount})
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4.5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">MyKAD / IC Verified</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold text-gray-900 leading-none">{certifiedCount}</span>
                    {pendingIcApproval > 0 && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[8.5px] font-black rounded-md animate-pulse">
                        {pendingIcApproval} Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white p-4.5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-4">
                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Connected Bank Accounts</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold text-gray-900 leading-none">{totalBanks}</span>
                    {pendingBankApproval > 0 && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-900 text-[8.5px] font-black rounded-md">
                        {pendingBankApproval} Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white p-4.5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-4">
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Credentials Status</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-extrabold text-gray-900 leading-none">{totalUsersCount - suspendedCount} Active</span>
                    {suspendedCount > 0 && (
                      <span className="text-[10px] font-mono text-red-600 font-bold">
                        ({suspendedCount} suspended)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Core Control Center Header & Filter Panel */}
            <div className="bg-white border border-gray-150 p-5 rounded-3xl shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Global Users Registry & Management</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Industry-standard auditing, user identity certification, role updates, and payment gateway account verification</p>
                </div>
                
                <button
                  onClick={() => {
                    setCreateFeedback(null);
                    setShowCreateUserModal(true);
                  }}
                  className="bg-[#1580c2] hover:bg-blue-700 text-white font-sans font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add User Account</span>
                </button>
              </div>

              {/* Filtering Suite */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                {/* Search */}
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input 
                    type="text"
                    placeholder="Search name, Email, Phone, IC, Bank..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 outline-none w-full bg-slate-50"
                  />
                  {userSearch && (
                    <button 
                      onClick={() => setUserSearch('')}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Role Filter */}
                <div>
                  <select
                    value={selectedUserTypeFilter}
                    onChange={(e) => setSelectedUserTypeFilter(e.target.value)}
                    className="w-full py-1.5 px-3 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  >
                    <option value="all">🛡️ All Roles</option>
                    <option value="customer">👤 Customers ({customerCount})</option>
                    <option value="affiliate">💜 Affiliates ({affiliateCount})</option>
                    <option value="agent">💛 Agents ({agentCount})</option>
                    <option value="admin">❤️ Admins ({adminCount})</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value as any)}
                    className="w-full py-1.5 px-3 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  >
                    <option value="all">🟢 All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="suspended">Suspended Only</option>
                  </select>
                </div>

                {/* Verification filter */}
                <div>
                  <select
                    value={userVerificationFilter}
                    onChange={(e) => setUserVerificationFilter(e.target.value as any)}
                    className="w-full py-1.5 px-3 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  >
                    <option value="all">✓ All Verifications</option>
                    <option value="certified">Certified MyKAD (IC)</option>
                    <option value="pending_ic">Pending MyKAD Approvals</option>
                    <option value="verified_bank">Verified Banks</option>
                    <option value="pending_bank">Pending Bank Approvals</option>
                  </select>
                </div>

                {/* Sort Option */}
                <div>
                  <select
                    value={userSortOption}
                    onChange={(e) => setUserSortOption(e.target.value as any)}
                    className="w-full py-1.5 px-3 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  >
                    <option value="newest">📅 Registered (Newest)</option>
                    <option value="oldest">Registered (Oldest)</option>
                    <option value="name_asc">👤 Full Name (A-Z)</option>
                    <option value="email_asc">📧 Email (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Listing Table */}
            <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="bg-slate-50 text-gray-500 text-[10px] font-bold uppercase tracking-wider select-none border-b border-gray-150">
                      <th className="px-5 py-4">Account Holder / Email</th>
                      <th className="px-5 py-4">Representative Profile</th>
                      <th className="px-5 py-4">MyKAD Status</th>
                      <th className="px-5 py-4">Linked Savings Bank</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-gray-400 font-bold">
                          No registered user records match the filter query. Try modifying your search parameters.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(acc => {
                        const profile = userProfiles.find(p => p.userId === acc.id);
                        const defaultBank = bankAccounts.find(b => b.userId === acc.id && b.isDefault);
                        const initial = profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : acc.email.charAt(0).toUpperCase();

                        // Pick avatar color based on role
                        let avatarColor = 'bg-blue-100 text-blue-800';
                        if (acc.userType === 'affiliate') avatarColor = 'bg-purple-100 text-purple-800';
                        if (acc.userType === 'agent') avatarColor = 'bg-amber-100 text-amber-800';
                        if (acc.userType === 'admin') avatarColor = 'bg-red-100 text-red-800';

                        return (
                          <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-full ${avatarColor} flex items-center justify-center font-bold text-xs select-none shadow-xs shrink-0`}>
                                  {initial}
                                </div>
                                <div className="space-y-0.5 truncate max-w-[200px]">
                                  <span className="block font-bold text-gray-900 group-hover:text-blue-900 transition-colors truncate">{acc.email}</span>
                                  <span className="text-[10px] text-gray-400 block">Registered: {new Date(acc.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              {profile ? (
                                <div className="space-y-0.5">
                                  <p className="font-extrabold text-gray-900 leading-snug">{profile.fullName}</p>
                                  <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                    <Phone className="h-3 w-3 inline text-gray-300" /> {profile.phoneNumber || 'No phone'}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-gray-400 font-mono">-</span>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              {profile?.icNumber ? (
                                <div className="space-y-1">
                                  <p className="font-mono font-bold text-gray-800">{profile.icNumber}</p>
                                  {profile.icVerified ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-800 font-bold text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                                      ✓ Certified MyKAD
                                    </span>
                                  ) : (
                                    <div className="flex flex-col items-start gap-1">
                                      <span className="inline-block text-amber-800 font-bold text-[9px] bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">
                                        Pending certification
                                      </span>
                                      <button
                                        onClick={() => verifyIC(profile.id)}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-sans font-bold text-[9px] px-2 py-0.5 rounded-md transition-colors"
                                      >
                                        Approve IC
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-[10px] italic">Not provided (Customer)</span>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              {defaultBank ? (
                                <div className="p-2 border border-gray-100 rounded-xl bg-gray-50/50 text-[10.5px] max-w-[200px] space-y-1">
                                  <div className="flex items-center justify-between">
                                    <p className="font-extrabold text-gray-800 leading-none truncate max-w-[120px]">
                                      {defaultBank.bankName}
                                    </p>
                                    <span className={`px-1 py-0.2 rounded text-[8.5px] font-black tracking-wider uppercase ${defaultBank.isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                      {defaultBank.isVerified ? 'VERIFIED' : 'PENDING'}
                                    </span>
                                  </div>
                                  <p className="font-mono font-bold text-gray-700 leading-none">{defaultBank.accountNumber}</p>
                                  <p className="text-[9.5px] text-gray-400 leading-none truncate block">Holder: {defaultBank.accountHolderName}</p>
                                  
                                  {!defaultBank.isVerified && (
                                    <button
                                      onClick={() => verifyBankAccount(defaultBank.id)}
                                      className="text-[9px] text-[#1580c2] hover:text-blue-700 font-black underline block mt-1.5"
                                    >
                                      Verify Bank Account
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-[10px] italic">None connected</span>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <div className="space-y-1">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase inline-block ${acc.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                  {acc.status}
                                </span>
                                <span className="block text-[9.5px] font-bold uppercase tracking-wider text-gray-400 px-0.5">
                                  {acc.userType}
                                </span>
                              </div>
                            </td>

                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={() => handleOpenUserDetails(acc)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-[#1580c2] hover:text-white text-gray-700 rounded-xl font-sans font-bold text-[10px] transition-all cursor-pointer shadow-xs inline-flex items-center gap-1"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Audit & Edit</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ----------------- POPUP MODAL: USER DETAILS CONTROL CENTER (AUDIT HUB) ----------------- */}
            {selectedUserForDetails && (() => {
              const profile = userProfiles.find(p => p.userId === selectedUserForDetails.id);
              const userLinkedBanks = bankAccounts.filter(b => b.userId === selectedUserForDetails.id);
              const userAddresses = addresses.filter(adr => adr.userId === selectedUserForDetails.id);
              
              // Get order footprint
              const userOrders = orders.filter(o => o.customerEmail && o.customerEmail.toLowerCase() === selectedUserForDetails.email.toLowerCase());
              const totalSpent = userOrders.reduce((sum, o) => sum + o.total, 0);

              // Get related logs
              const userLogs = auditLogs.filter(log => 
                log.targetId === selectedUserForDetails.id || 
                log.targetId === profile?.id || 
                log.adminId === selectedUserForDetails.id
              );

              return (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                  <div className="bg-white rounded-3xl border border-gray-150 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col text-left animate-scale-up">
                    
                    {/* Modal Header */}
                    <div className="bg-slate-900 text-white p-5 flex justify-between items-center select-none shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-sm">
                          {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : selectedUserForDetails.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-sans font-black text-sm uppercase tracking-tight">{profile?.fullName || 'Anonymous Account'}</h4>
                            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-blue-100 text-blue-900">
                              {selectedUserForDetails.userType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{selectedUserForDetails.email}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedUserForDetails(null);
                          setUserEditMode(false);
                          setEditFeedback(null);
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Modal Content body (Scrollable) */}
                    <div className="p-6 overflow-y-auto space-y-6">
                      
                      {editFeedback && (
                        <div className={`p-3.5 rounded-xl text-xs font-bold border ${editFeedback.includes('Error') ? 'bg-red-50 text-red-800 border-red-100' : 'bg-emerald-50 text-emerald-800 border-emerald-100'}`}>
                          {editFeedback}
                        </div>
                      )}

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* LEFT COLUMN: Profile & Settings Form */}
                        <div className="lg:col-span-7 space-y-4">
                          <div className="p-5 border border-gray-150 rounded-2xl space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                              <h5 className="font-extrabold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Users className="h-4 w-4 text-[#1580c2]" />
                                <span>Profile & Credentials Data</span>
                              </h5>
                              <button
                                type="button"
                                onClick={() => setUserEditMode(!userEditMode)}
                                className="text-[10px] text-[#1580c2] font-extrabold uppercase hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <Edit2 className="h-3 w-3" />
                                {userEditMode ? 'Cancel Edit' : 'Edit Profile'}
                              </button>
                            </div>

                            <form onSubmit={handleEditUserSubmit} className="space-y-4.5 text-xs">
                              {/* Display Profile details */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                  <label className="block text-[9.5px] font-bold text-gray-400 uppercase tracking-wider mb-1">Full Representative Name</label>
                                  <input 
                                    type="text" value={editUserName}
                                    onChange={(e) => setEditUserName(e.target.value)}
                                    disabled={!userEditMode}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 disabled:bg-slate-50 disabled:text-gray-500 font-bold"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9.5px] font-bold text-gray-400 uppercase tracking-wider mb-1">Registered Account Email</label>
                                  <input 
                                    type="email" value={editUserEmail}
                                    disabled
                                    className="w-full p-2.5 border border-gray-200 rounded-xl bg-slate-100 text-gray-400 cursor-not-allowed font-mono"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                <div>
                                  <label className="block text-[9.5px] font-bold text-gray-400 uppercase tracking-wider mb-1">Mobile No</label>
                                  <input 
                                    type="text" value={editUserPhone}
                                    onChange={(e) => setEditUserPhone(e.target.value)}
                                    disabled={!userEditMode}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none bg-slate-50 disabled:bg-slate-50 disabled:text-gray-500 font-bold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9.5px] font-bold text-gray-400 uppercase tracking-wider mb-1">WhatsApp No</label>
                                  <input 
                                    type="text" value={editUserWhatsapp}
                                    onChange={(e) => setEditUserWhatsapp(e.target.value)}
                                    disabled={!userEditMode}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none bg-slate-50 disabled:bg-slate-50 disabled:text-gray-500 font-bold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9.5px] font-bold text-gray-400 uppercase tracking-wider mb-1">MyKAD / IC Number</label>
                                  <input 
                                    type="text" value={editUserIC}
                                    onChange={(e) => setEditUserIC(e.target.value)}
                                    disabled={!userEditMode}
                                    placeholder="880112-14-5567"
                                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none bg-slate-50 disabled:bg-slate-50 disabled:text-gray-500 font-mono font-bold"
                                  />
                                </div>
                              </div>

                              {/* Role and Account Status settings */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-gray-100">
                                <div>
                                  <label className="block text-[9.5px] font-bold text-gray-400 uppercase tracking-wider mb-1">Account System Role</label>
                                  <select
                                    value={editUserRole}
                                    onChange={(e) => setEditUserRole(e.target.value as any)}
                                    disabled={!userEditMode}
                                    className="w-full p-2 border border-gray-200 rounded-lg outline-none bg-white font-bold cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                                  >
                                    <option value="customer">👤 Customer Account</option>
                                    <option value="affiliate">💜 Affiliate Representative</option>
                                    <option value="agent">💛 Distribution Agent</option>
                                    <option value="admin">🚨 System Administrator</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[9.5px] font-bold text-gray-400 uppercase tracking-wider mb-1">Account Credentials Status</label>
                                  <select
                                    value={editUserStatus}
                                    onChange={(e) => setEditUserStatus(e.target.value as any)}
                                    disabled={!userEditMode}
                                    className="w-full p-2 border border-gray-200 rounded-lg outline-none bg-white font-bold cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                                  >
                                    <option value="active">Active (Access Permitted)</option>
                                    <option value="suspended">Suspended (Access Terminated)</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="pending_verification">Pending Verification</option>
                                  </select>
                                </div>
                              </div>

                              {/* DEFAULT BANK ACCOUNT DETAILS */}
                              <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
                                <span className="text-[9.5px] font-black uppercase tracking-widest text-blue-900 block">Default Payout Bank Savings</span>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-[9.0px] font-bold text-gray-400 uppercase mb-0.5">Bank Name</label>
                                    <input 
                                      type="text" value={editBankName}
                                      onChange={(e) => setEditBankName(e.target.value)}
                                      disabled={!userEditMode}
                                      placeholder="e.g. Maybank"
                                      className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none disabled:bg-slate-50 disabled:text-gray-500 font-bold"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9.0px] font-bold text-gray-400 uppercase mb-0.5">Account Number</label>
                                    <input 
                                      type="text" value={editBankAccountNo}
                                      onChange={(e) => setEditBankAccountNo(e.target.value)}
                                      disabled={!userEditMode}
                                      placeholder="e.g. 1640123456"
                                      className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none font-mono disabled:bg-slate-50 disabled:text-gray-500 font-bold"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9.0px] font-bold text-gray-400 uppercase mb-0.5">Account Holder</label>
                                    <input 
                                      type="text" value={editBankAccountHolder}
                                      onChange={(e) => setEditBankAccountHolder(e.target.value)}
                                      disabled={!userEditMode}
                                      placeholder="e.g. Ahmad Rosli"
                                      className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none disabled:bg-slate-50 disabled:text-gray-500 font-bold"
                                    />
                                  </div>
                                </div>
                              </div>

                              {userEditMode && (
                                <button
                                  type="submit"
                                  className="w-full bg-[#1580c2] hover:bg-blue-700 text-white font-sans font-bold py-2 px-4 rounded-xl text-center shadow-md cursor-pointer transition-colors"
                                >
                                  Save Administrative Profile Updates
                                </button>
                              )}
                            </form>
                          </div>

                          {/* Connected Bank accounts queue with verify button */}
                          <div className="p-5 border border-gray-150 rounded-2xl space-y-3">
                            <h5 className="font-extrabold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                              <CreditCard className="h-4 w-4 text-indigo-600" />
                              <span>Registered Bank Accounts ({userLinkedBanks.length})</span>
                            </h5>

                            {userLinkedBanks.length === 0 ? (
                              <p className="text-gray-400 text-[10.5px] italic">No savings bank accounts configured by this representative yet.</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {userLinkedBanks.map(bk => (
                                  <div key={bk.id} className="p-3 border border-gray-200 rounded-xl bg-slate-50/50 space-y-1.5 text-[10.5px]">
                                    <div className="flex justify-between items-center">
                                      <span className="font-extrabold text-gray-900">{bk.bankName}</span>
                                      <span className={`px-1.5 rounded text-[8px] font-black uppercase ${bk.isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                        {bk.isVerified ? 'VERIFIED' : 'PENDING'}
                                      </span>
                                    </div>
                                    <p className="font-mono text-gray-800 leading-none">No: {bk.accountNumber}</p>
                                    <p className="text-gray-400 leading-none">Holder: {bk.accountHolderName}</p>
                                    
                                    {!bk.isVerified && (
                                      <button
                                        type="button"
                                        onClick={() => verifyBankAccount(bk.id)}
                                        className="mt-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-extrabold text-[9px] py-1 px-2.5 rounded-lg transition-colors cursor-pointer"
                                      >
                                        Verify This Bank Account
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Linked Address books */}
                          <div className="p-5 border border-gray-150 rounded-2xl space-y-3">
                            <h5 className="font-extrabold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 text-amber-600" />
                              <span>Registered Addresses ({userAddresses.length})</span>
                            </h5>

                            {userAddresses.length === 0 ? (
                              <p className="text-gray-400 text-[10.5px] italic">No delivery or billing addresses registered by this customer.</p>
                            ) : (
                              <div className="space-y-2">
                                {userAddresses.map(adr => (
                                  <div key={adr.id} className="p-2.5 border border-gray-200 rounded-xl bg-slate-50/50 text-[10.5px] space-y-0.5">
                                    <p className="font-extrabold text-gray-900 capitalize">
                                      {adr.addressType} Delivery Address {adr.isDefault && <span className="text-[8.5px] font-bold text-[#1580c2] bg-blue-50 px-1 py-0.2 rounded uppercase border border-blue-100">Default</span>}
                                    </p>
                                    <p className="text-gray-600">{adr.fullAddress}, {adr.postalCode} {adr.city}, {adr.state}, {adr.country}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* RIGHT COLUMN: Order History + Audit Trails */}
                        <div className="lg:col-span-5 space-y-4">
                          
                          {/* Financial footnote summary */}
                          <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-3">
                            <span className="text-[9.5px] font-black uppercase text-slate-400 block tracking-widest">Financial Footprint</span>
                            <div className="flex justify-between items-baseline">
                              <span className="text-xs text-slate-300">Total Transacted:</span>
                              <span className="text-2xl font-black text-[#22c55e]">RM {totalSpent.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[10.5px]">
                              <span className="text-slate-400">Total Purchase Orders:</span>
                              <span className="font-mono font-bold text-slate-200">{userOrders.length} orders</span>
                            </div>
                          </div>

                          {/* User purchase logs */}
                          <div className="p-4 border border-gray-150 rounded-2xl space-y-3 max-h-[220px] overflow-y-auto">
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Recent Orders placed</span>
                            
                            {userOrders.length === 0 ? (
                              <p className="text-gray-400 text-[10px] italic">No orders logged with this account email.</p>
                            ) : (
                              <div className="space-y-2 text-[10.5px]">
                                {userOrders.map(ord => (
                                  <div key={ord.id} className="p-2 bg-slate-50 border border-gray-100 rounded-xl flex items-center justify-between">
                                    <div>
                                      <p className="font-bold text-gray-900 uppercase">Order ID: {ord.id}</p>
                                      <p className="text-[9.5px] text-gray-400">{new Date(ord.createdAt).toLocaleDateString()} - RM {ord.total}</p>
                                    </div>
                                    <span className={`px-1.5 py-0.2 rounded font-bold text-[8.5px] uppercase ${ord.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                      {ord.paymentStatus}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* USER AUDIT LOGS & ACTIONS */}
                          <div className="p-5 border border-gray-150 rounded-2xl space-y-4">
                            <h5 className="font-extrabold text-xs text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                              <ShieldAlert className="h-4 w-4 text-rose-600" />
                              <span>Compliance & Audit Trails ({userLogs.length})</span>
                            </h5>

                            {userLogs.length === 0 ? (
                              <p className="text-gray-400 text-[10.5px] italic">No system auditing actions logs recorded for this account.</p>
                            ) : (
                              <div className="space-y-2.5 max-h-[260px] overflow-y-auto text-[10px]">
                                {userLogs.map(log => (
                                  <div key={log.id} className="p-2.5 bg-slate-50 border border-gray-100 rounded-xl space-y-1">
                                    <div className="flex items-center justify-between text-gray-400">
                                      <span className="font-black uppercase tracking-wider text-[8px] text-[#1580c2] bg-blue-50 px-1 rounded">{log.action}</span>
                                      <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="font-bold text-gray-800 leading-normal">{log.changes}</p>
                                    <p className="text-[9px] text-gray-400">Audited by: {log.adminName} ({log.adminId})</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* DANGER DELETION ZONE */}
                          {selectedUserForDetails.userType !== 'admin' && (
                            <div className="p-4 border border-red-150 rounded-2xl bg-red-50/50 space-y-2">
                              <h6 className="text-[10px] uppercase font-black tracking-widest text-red-950 block">Account Danger Zone</h6>
                              <p className="text-[9.5px] text-red-800 font-bold">Permanently erase this account and clean all representatives data. This action is irreversible.</p>
                              
                              <button
                                type="button"
                                onClick={() => handleDeleteUserClick(selectedUserForDetails.id)}
                                className="bg-red-600 hover:bg-red-700 text-white font-sans font-bold text-[10px] py-1.5 px-3 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Erase Account Permanently</span>
                              </button>
                            </div>
                          )}

                        </div>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="bg-slate-50 px-6 py-4.5 border-t border-gray-150 flex justify-end shrink-0 select-none">
                      <button
                        onClick={() => {
                          setSelectedUserForDetails(null);
                          setUserEditMode(false);
                          setEditFeedback(null);
                        }}
                        className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-sans font-bold text-xs rounded-xl border border-gray-200 transition-all cursor-pointer shadow-xs"
                      >
                        Close Control Hub
                      </button>
                    </div>

                  </div>
                </div>
              );
            })()}

            {/* ----------------- POPUP MODAL: CREATE USER ACCOUNT PANEL ----------------- */}
            {showCreateUserModal && (
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className="bg-white rounded-3xl border border-gray-150 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col text-left animate-scale-up">
                  
                  {/* Modal Header */}
                  <div className="bg-slate-900 text-white p-5 flex justify-between items-center select-none shrink-0">
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-[#1580c2]" />
                      <h4 className="font-sans font-black text-sm uppercase tracking-tight">Create New User Account</h4>
                    </div>
                    <button
                      onClick={() => setShowCreateUserModal(false)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <form onSubmit={handleCreateUserSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                    
                    {createFeedback && (
                      <div className={`p-3.5 rounded-xl text-xs font-bold border ${createFeedback.includes('Error') ? 'bg-red-50 text-red-800 border-red-100' : 'bg-emerald-50 text-emerald-800 border-emerald-100'}`}>
                        {createFeedback}
                      </div>
                    )}

                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block border-b border-gray-100 pb-1">1. User Credentials & Profile</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9.5px] font-bold text-gray-700 uppercase tracking-wider mb-1">Account Holder Full Name</label>
                        <input 
                          type="text" value={newFullName}
                          onChange={(e) => setNewFullName(e.target.value)}
                          placeholder="e.g. Dr Asyraf Saharudin"
                          className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 font-bold"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-gray-700 uppercase tracking-wider mb-1">Account Email Address</label>
                        <input 
                          type="email" value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="e.g. asyraf@gmail.com"
                          className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 font-mono font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[9.5px] font-bold text-gray-700 uppercase tracking-wider mb-1">Mobile Contact Phone</label>
                        <input 
                          type="text" value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          placeholder="e.g. +6011223344"
                          className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-gray-700 uppercase tracking-wider mb-1">WhatsApp Mobile Contact</label>
                        <input 
                          type="text" value={newWhatsapp}
                          onChange={(e) => setNewWhatsapp(e.target.value)}
                          placeholder="e.g. +6011223344"
                          className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-gray-700 uppercase tracking-wider mb-1">MyKAD / Malaysian IC Number</label>
                        <input 
                          type="text" value={newIC}
                          onChange={(e) => setNewIC(e.target.value)}
                          placeholder="e.g. 880112-14-5567"
                          className="w-full p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-gray-100">
                      <div>
                        <label className="block text-[9.5px] font-bold text-gray-700 uppercase tracking-wider mb-1">Assign User System Role</label>
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value as any)}
                          className="w-full p-2 border border-gray-200 rounded-lg outline-none bg-white font-bold cursor-pointer"
                        >
                          <option value="customer">👤 Customer Account</option>
                          <option value="affiliate">💜 Affiliate Representative</option>
                          <option value="agent">💛 Distribution Agent</option>
                          <option value="admin">🚨 System Administrator</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-gray-700 uppercase tracking-wider mb-1">Account Access Status</label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as any)}
                          className="w-full p-2 border border-gray-200 rounded-lg outline-none bg-white font-bold cursor-pointer"
                        >
                          <option value="active">Active (Access Granted)</option>
                          <option value="suspended">Suspended (Access Revoked)</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block border-b border-gray-100 pb-1">2. Default Savings Payout Bank Account (Optional)</span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block text-[9.5px] font-bold text-gray-700 uppercase mb-1">Savings Bank Name</label>
                        <input 
                          type="text" value={newBankName}
                          onChange={(e) => setNewBankName(e.target.value)}
                          placeholder="e.g. Maybank"
                          className="w-full p-2.5 border border-gray-200 rounded-xl outline-none bg-slate-50 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-gray-700 uppercase mb-1">Account Number</label>
                        <input 
                          type="text" value={newBankAccountNo}
                          onChange={(e) => setNewBankAccountNo(e.target.value)}
                          placeholder="e.g. 164012345678"
                          className="w-full p-2.5 border border-gray-200 rounded-xl outline-none bg-slate-50 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-gray-700 uppercase mb-1">Recipient Account Holder</label>
                        <input 
                          type="text" value={newBankAccountHolder}
                          onChange={(e) => setNewBankAccountHolder(e.target.value)}
                          placeholder="Defaults to Full Name"
                          className="w-full p-2.5 border border-gray-200 rounded-xl outline-none bg-slate-50 font-bold"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-150 flex justify-end gap-3 select-none">
                      <button
                        type="button"
                        onClick={() => setShowCreateUserModal(false)}
                        className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-sans font-bold text-xs rounded-xl border border-gray-200 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#1580c2] hover:bg-blue-700 text-white font-sans font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        Provision Account
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            )}

          </div>
        );
      })()}

      {/* Dynamic Website CMS Customizer and Markdown editor */}
      {activeAdminSubTab === 'cms' && (
        <div className="space-y-6 animate-scale-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Homepage details builder form */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-sans text-sm font-bold text-gray-900 pb-2 border-b border-gray-100">
                Appearance Settings (Global CMS Config)
              </h3>

              {cmsSavedMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs border border-emerald-100 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> appearance settings compiled and saved.
                </div>
              )}

              <form onSubmit={handleSaveCMSConfig} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Company Site Name</label>
                  <input 
                    type="text" value={cmsSiteName}
                    onChange={(e) => setCmsSiteName(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none font-sans"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Branding Headline/Slogan</label>
                  <input 
                    type="text" value={cmsSiteDesc}
                    onChange={(e) => setCmsSiteDesc(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Support Contact Email</label>
                    <input 
                      type="email" value={cmsEmail}
                      onChange={(e) => setCmsEmail(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Support Contact Phone</label>
                    <input 
                      type="text" value={cmsPhone}
                      onChange={(e) => setCmsPhone(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Aesthetic Theme hexColor</label>
                    <div className="flex gap-2 items-center">
                      <input 
                        type="color" value={cmsPrimaryColor}
                        onChange={(e) => setCmsPrimaryColor(e.target.value)}
                        className="h-9 w-9 rounded-md border border-gray-200 cursor-pointer"
                      />
                      <input 
                        type="text" value={cmsPrimaryColor}
                        onChange={(e) => setCmsPrimaryColor(e.target.value)}
                        className="flex-1 p-2 border border-gray-200 rounded-lg font-mono text-center uppercase"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Dynamic Logo URL (optional)</label>
                    <input 
                      type="text" value={cmsLogoUrl}
                      onChange={(e) => setCmsLogoUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full p-2.5 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#1580c2] hover:bg-blue-700 text-white font-sans font-bold text-xs py-2.5 rounded-xl text-center shadow-md transition-all cursor-pointer"
                >
                  Apply Live Custom Appearance
                </button>
              </form>
            </div>

            {/* Markdown pages CMS builder editor */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-sans text-sm font-bold text-gray-900">
                  Static Pages Editor (Rich Markdown)
                </h3>
                <select 
                  value={selectedPageSlug}
                  onChange={(e) => setSelectedPageSlug(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none py-1 px-1.5 cursor-pointer"
                >
                  <option value="about">About Us Page</option>
                  <option value="harvest">Eco-Harvest Sourcing Story</option>
                  <option value="terms">Privacy Policy & Warnings</option>
                </select>
              </div>

              {pageSavedMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs border border-emerald-100 font-semibold flex items-center gap-1.5 animate-pulse">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> page '{selectedPageSlug}' updated in active state.
                </div>
              )}

              <form onSubmit={handleSaveCMSPage} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Editor Title (H1)</label>
                  <input 
                    type="text" value={pageTitleEdit}
                    onChange={(e) => setPageTitleEdit(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Page Body Content (Markdown Supported)</label>
                  <textarea 
                    value={pageContentEdit}
                    onChange={(e) => setPageContentEdit(e.target.value)}
                    placeholder="Describe facts using headers # etc."
                    className="w-full p-2.5 border border-gray-200 rounded-lg font-mono focus:ring-1 focus:ring-blue-500 min-h-[160px] leading-relaxed"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#1580c2] hover:bg-blue-700 text-white font-sans font-bold text-xs py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Save Static Page Content
                </button>
              </form>
            </div>
          </div>

          {/* SIMULATED EMAIL TEMPLATE TRANSMITTER */}
          <div className="bg-white border border-gray-100 p-5 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-sans text-sm font-bold text-gray-900 pb-2 border-b border-gray-100">
              Interactive Email Template Generator
            </h3>
            
            <form onSubmit={handleSendTestEmail} className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-left">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Select Email Template</label>
                  <select 
                    value={selectedEmailTemplate}
                    onChange={(e) => setSelectedEmailTemplate(e.target.value)}
                    className="w-full py-2 px-2.5 border border-gray-200 rounded-lg cursor-pointer bg-white"
                  >
                    <option value="welcome_aff">Affiliate Registration Welcome</option>
                    <option value="welcome_agt">Agent Welcome Package Created</option>
                    <option value="receipt_order">Order Confirmation Receipt</option>
                    <option value="bank_verified">Recipient Bank Account Verified</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Test Recipient Email</label>
                  <input 
                    type="email" value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Dynamic Parameter: Representative Name</label>
                  <input 
                    type="text" value={testVariableUser}
                    onChange={(e) => setTestVariableUser(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Dynamic Parameter: Referral Code</label>
                  <input 
                    type="text" value={testVariableCode}
                    onChange={(e) => setTestVariableCode(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-1"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#1580c2] hover:bg-blue-700 text-white py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all outline-none"
                >
                  <Send className="h-4 w-4" /> Simulate Sending HTML template
                </button>
              </div>

              {/* Email Client Live Preview Mockup */}
              <div className="md:col-span-2 bg-slate-50 border border-gray-150 rounded-2xl p-4 flex flex-col space-y-3 max-h-[300px] overflow-auto select-none">
                <div className="border-b border-gray-200 pb-2 text-[10px] text-gray-500 uppercase font-mono font-bold space-y-1">
                  <div className="flex justify-between">
                    <span>Sender:</span> <span className="font-bold text-gray-800">Madu Plus Logistics Node</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recipient To:</span> <span className="font-bold text-gray-800">{testEmailAddress}</span>
                  </div>
                  <div className="flex justify-between text-[#1580c2]">
                    <span>Subject Code:</span> 
                    <span className="font-bold">
                      {selectedEmailTemplate === 'welcome_aff' && `Welcome ${testVariableUser}! Your Referral link is ready.`}
                      {selectedEmailTemplate === 'welcome_agt' && `Agent Account Created: ${testVariableUser} Tier Confirmation.`}
                      {selectedEmailTemplate === 'receipt_order' && `Shipment receipt confirmation for your Madu Plus order.`}
                      {selectedEmailTemplate === 'bank_verified' && `Recipient payouts certified - Bank account verification success.`}
                    </span>
                  </div>
                </div>

                {emailPreviewSent ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-emerald-800 space-y-2 animate-bounce">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 animate-pulse" />
                    <div>
                      <p className="font-extrabold text-xs">Mail Client Opened!</p>
                      <p className="text-[10px] text-gray-500 mt-1">Template rendered with your variables — review and hit send in your email app.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 bg-white p-4 border border-gray-100 rounded-xl text-[10.5px] leading-relaxed text-gray-600 space-y-2 font-sans text-left">
                    <p className="font-bold text-gray-850">Hi {testVariableUser},</p>
                    
                    {selectedEmailTemplate === 'welcome_aff' && (
                      <>
                        <p>Welcome to the official <strong>Madu Plus Affiliate programme</strong>! We are excited to partner with you in representing royal rainforest wild honey.</p>
                        <p>Your unique affiliate referral link code is: <strong className="text-blue-700 bg-blue-50 px-1 py-0.2 rounded font-mono uppercase">{testVariableCode}</strong></p>
                        <p>Use your code to refer shoppers. You earn a <strong>10% commission on Bronze tier, scaling to 20% on Gold tier</strong> as your sales volume expands. Ready to launch?</p>
                      </>
                    )}

                    {selectedEmailTemplate === 'welcome_agt' && (
                      <>
                        <p>Welcome to the certified reseller family. Your application profile is approved.</p>
                        <p>Our Pahang warehouse distribution hub has allocated of your initial Tualang bulk honey inventory. Manage stock, restock details, or share links from your cockpit panel.</p>
                      </>
                    )}

                    {selectedEmailTemplate === 'receipt_order' && (
                      <>
                        <p>Thank you for shopping pure unprocessed wild honey. Your settlement transaction is verified.</p>
                        <p>A regional delivery carrier will soon collect your parcel, providing tracking number logs directly to your WhatsApp terminal. Live healthy!</p>
                      </>
                    )}

                    {selectedEmailTemplate === 'bank_verified' && (
                      <>
                        <p>We completed a micro-transfer transaction validation test on your linked bank card details.</p>
                        <p>Your payouts account is marked <strong>ACTIVE</strong>. Commission dividends accumulate of direct sales events, with payouts released automatically every month.</p>
                      </>
                    )}

                    <div className="pt-4 border-t border-gray-100 text-[9px] text-gray-400">
                      Madu Plus Tualang HQ, Pahang, Malaysia • Support: {cmsPhone}
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main inventory control panel */}
      {activeAdminSubTab === 'inventory' && (
        <InventoryManager />
      )}

      {/* ==================================== */}
      {/* 5. ADMIN AFFILIATES MANAGEMENT DASHBOARD */}
      {/* ==================================== */}
      {activeAdminSubTab === 'affiliates' && (
        <div className="space-y-6 animate-scale-up text-left">
          {/* Dashboard Header KPIs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-105 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Affiliates</span>
                <span className="block text-2xl font-bold text-gray-900 mt-1">{affiliates.length} Partners</span>
                <span className="text-[9.5px] text-emerald-600 font-bold block mt-1">● Active network</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-50 text-[#1580c2] flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-105 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Gross Sales Referred</span>
                <span className="block text-2xl font-bold text-gray-900 mt-1">
                  RM {affiliates.reduce((sum, a) => sum + a.lifetimeSales, 0).toFixed(2)}
                </span>
                <span className="text-[9.5px] text-blue-500 font-bold block mt-1">Through custom code links</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-50 text-[#1580c2] flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-105 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Dividends Disbursed</span>
                <span className="block text-2xl font-bold text-gray-900 mt-1">
                  RM {orders.filter(o => o.affiliateCommission && o.commissionPaid).reduce((sum, o) => sum + (o.affiliateCommission || 0), 0).toFixed(2)}
                </span>
                <span className="text-[9.5px] text-emerald-600 font-bold block mt-1">Successfully processed payouts</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-105 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Pending Payouts</span>
                <span className="block text-2xl font-bold text-gray-900 mt-1 text-orange-600">
                  RM {orders.filter(o => o.affiliateCommission && !o.commissionPaid).reduce((sum, o) => sum + (o.affiliateCommission || 0), 0).toFixed(2)}
                </span>
                <span className="text-[9.5px] text-orange-500 font-bold block mt-1">Awaiting bank batch release</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Shopee-style sub-tab navigation menu */}
          <div className="bg-gray-100/70 p-1.5 rounded-2xl border border-gray-100 flex flex-wrap gap-1 select-none">
            <button
              onClick={() => setAffiliateSubView('list')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                affiliateSubView === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/40'
              }`}
            >
              👥 Partner Registry
            </button>
            <button
              onClick={() => setAffiliateSubView('payouts')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                affiliateSubView === 'payouts'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/40'
              }`}
            >
              💰 Batch Payout Processing
            </button>
            <button
              onClick={() => setAffiliateSubView('recruitment')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                affiliateSubView === 'recruitment'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/40'
              }`}
            >
              🤝 Recruitment Hub
            </button>
            <button
              onClick={() => setAffiliateSubView('comms')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                affiliateSubView === 'comms'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/40'
              }`}
            >
              📢 Broadcast Campaigns
            </button>
            <button
              onClick={() => setAffiliateSubView('analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                affiliateSubView === 'analytics'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/40'
              }`}
            >
              📊 Performance Analytics
            </button>
          </div>

          {/* VIEW 1: PARTNER REGISTRY LISTING */}
          {affiliateSubView === 'list' && (
            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs">
              {/* Search and Filters Bar */}
              <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row gap-3 justify-between items-center">
                <div className="relative w-full md:w-80">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Search className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by name, code or email..."
                    value={affSearch}
                    onChange={(e) => setAffSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <select
                    value={affTierFilter}
                    onChange={(e) => setAffTierFilter(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none"
                  >
                    <option value="all">All Tiers</option>
                    <option value="Bronze">Bronze Tier</option>
                    <option value="Silver">Silver Tier</option>
                    <option value="Gold">Gold Tier</option>
                  </select>

                  <select
                    value={affStatusFilter}
                    onChange={(e) => setAffStatusFilter(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="blacklisted">Blacklisted</option>
                  </select>

                  <select
                    value={affRankFilter}
                    onChange={(e) => setAffRankFilter(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none"
                  >
                    <option value="all">All Performance</option>
                    <option value="top10">Top 10% Leaders</option>
                    <option value="bottom10">Underperforming</option>
                  </select>

                  <select
                    value={affSortBy}
                    onChange={(e) => setAffSortBy(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-700 focus:outline-none"
                  >
                    <option value="sales">Sort: Sales Referred</option>
                    <option value="name">Sort: Alphabetical</option>
                    <option value="commission">Sort: Dividends Earned</option>
                    <option value="units">Sort: Units Sold</option>
                  </select>
                </div>
              </div>

              {/* Table list */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 font-bold text-gray-400 text-[10px] uppercase tracking-wider">
                      <th className="px-6 py-3">Partner Details</th>
                      <th className="px-6 py-3">Referral Code</th>
                      <th className="px-6 py-3">Tier Level</th>
                      <th className="px-6 py-3">Network Status</th>
                      <th className="px-6 py-3">Units Sold</th>
                      <th className="px-6 py-3 text-right">Commission Earned</th>
                      <th className="px-6 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                    {affiliates
                      .filter(aff => {
                        const searchClean = affSearch.toLowerCase();
                        const matchesSearch = 
                          aff.name.toLowerCase().includes(searchClean) || 
                          aff.email.toLowerCase().includes(searchClean) || 
                          aff.code.toLowerCase().includes(searchClean);
                        
                        const matchesTier = affTierFilter === 'all' || aff.tier === affTierFilter;
                        
                        const statusVal = aff.status || 'active';
                        const matchesStatus = affStatusFilter === 'all' || statusVal === affStatusFilter;

                        let matchesRank = true;
                        if (affRankFilter === 'top10') {
                          matchesRank = aff.unitsSold > 15;
                        } else if (affRankFilter === 'bottom10') {
                          matchesRank = aff.unitsSold <= 2;
                        }

                        return matchesSearch && matchesTier && matchesStatus && matchesRank;
                      })
                      .sort((a, b) => {
                        if (affSortBy === 'name') return a.name.localeCompare(b.name);
                        if (affSortBy === 'commission') return b.lifetimeCommissions - a.lifetimeCommissions;
                        if (affSortBy === 'units') return b.unitsSold - a.unitsSold;
                        return b.lifetimeSales - a.lifetimeSales; // default: sales
                      })
                      .map((aff) => {
                        const statusVal = aff.status || 'active';
                        return (
                          <tr key={aff.id} className="hover:bg-gray-50/20">
                            <td className="px-6 py-4">
                              <p className="font-bold text-gray-900">{aff.name}</p>
                              <p className="text-[10px] text-gray-400">{aff.email}</p>
                              <p className="text-[9px] text-gray-400 font-mono">Reg: {aff.signupDate || '2026-06-01'}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[11px]">
                                {aff.code}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                aff.tier === 'Gold' ? 'bg-amber-100 text-amber-900 border border-amber-200' : 
                                aff.tier === 'Silver' ? 'bg-slate-100 text-slate-800 border border-slate-200' : 
                                'bg-orange-50 text-orange-700'
                              }`}>
                                {aff.tier}
                              </span>
                              {aff.commissionOverride && (
                                <span className="block text-[8px] text-purple-600 font-bold mt-1">
                                  ★ Custom Override ({aff.commissionOverride}%)
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                statusVal === 'active' ? 'bg-emerald-50 text-emerald-700' :
                                statusVal === 'suspended' ? 'bg-amber-50 text-amber-700' :
                                'bg-red-50 text-red-700'
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${
                                  statusVal === 'active' ? 'bg-emerald-500' :
                                  statusVal === 'suspended' ? 'bg-amber-500' :
                                  'bg-red-500'
                                }`} />
                                {statusVal}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-gray-900">{aff.unitsSold} units</td>
                            <td className="px-6 py-4 text-right font-mono font-black text-emerald-600">
                              RM {aff.lifetimeCommissions.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => {
                                  setSelectedAff(aff);
                                  setEditAffTier(aff.tier);
                                  setEditAffStatus(aff.status || 'active');
                                  setEditAffOverride(aff.commissionOverride?.toString() || '');
                                  setShowAffModal(true);
                                }}
                                className="bg-[#1580c2] hover:bg-[#116499] text-white font-bold text-[10px] uppercase px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                              >
                                View Profile
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: COMMISSION & BATCH PAYOUT PROCESSING */}
          {affiliateSubView === 'payouts' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Payout Parameters Batch Processing */}
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 self-start">
                <div className="border-b border-gray-50 pb-3">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Payout Processing Console</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Disburse pending commissions in a single corporate batch</p>
                </div>

                {bulkCommissionsFeedback && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold p-3 rounded-xl flex items-center gap-2">
                    <span className="text-base">✓</span>
                    <p>{bulkCommissionsFeedback}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Financial Cycle Period</label>
                    <select
                      value={selectedPayoutPeriod}
                      onChange={(e) => setSelectedPayoutPeriod(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
                    >
                      {payoutPeriods.map((period, idx) => (
                        <option key={period} value={period}>{period}{idx === 0 ? ' (Current Cycle)' : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Corporate Funding Bank Account</label>
                    <select
                      value={selectedBankAccountId}
                      onChange={(e) => setSelectedBankAccountId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
                    >
                      <option value="main_business">Maybank Islamic Enterprise (HQ-781)</option>
                      <option value="escrow_reserve">CIMB Commercial Reserve Fund (HQ-229)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Disbursement Method</label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {(['bank_transfer', 'paypal', 'check'] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setSelectedPayoutMethod(method)}
                          className={`py-1.5 px-2 rounded-xl text-[9px] font-bold uppercase transition-all ${
                            selectedPayoutMethod === method
                              ? 'bg-[#1580c2] text-white border border-[#1580c2]'
                              : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {method === 'bank_transfer' ? '🏦 Bank Giro' : method === 'paypal' ? '💳 PayPal' : '📄 Check'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Disbursement Date</label>
                    <input
                      type="date"
                      value={payoutScheduleDate}
                      onChange={(e) => setPayoutScheduleDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Corporate Payment References / Notes</label>
                    <textarea
                      rows={2}
                      value={payoutNotes}
                      placeholder="Enter internal transfer batch code, e.g. BATCH-PAY-2606-A"
                      onChange={(e) => setPayoutNotes(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const pendingCommsOrders = orders.filter(o => o.affiliateCommission && !o.commissionPaid);
                    if (pendingCommsOrders.length === 0) {
                      setBulkCommissionsFeedback('Error: There are no pending affiliate dividends to disburse currently.');
                      return;
                    }
                    
                    // Toggle all to commissionPaid
                    pendingCommsOrders.forEach(o => {
                      toggleCommissionPaid(o.id);
                    });

                    setBulkCommissionsFeedback(`Success! Processed payout batch of RM ${pendingCommsOrders.reduce((sum, o) => sum + (o.affiliateCommission || 0), 0).toFixed(2)} to ${pendingCommsOrders.length} affiliate ledger accounts.`);
                    addAuditLog('Affiliate Bulk Payout', 'orders', 'batch-all', `Processed payouts using bank ID: ${selectedBankAccountId} with references: ${payoutNotes || 'none'}`);
                    
                    setTimeout(() => {
                      setBulkCommissionsFeedback(null);
                    }, 4000);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase py-3 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  ⚡ Authorize & Disburse Pending Batch
                </button>
              </div>

              {/* Right Columns: Orders Commissions registry */}
              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs lg:col-span-2 text-left self-start">
                <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center select-none">
                  <div>
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Affiliate Order Ledger</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Tracking referred transactions and payment ledger status</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 font-bold text-gray-400 text-[10px] uppercase tracking-wider">
                        <th className="px-4 py-3">Order ID</th>
                        <th className="px-4 py-3">Partner Referred</th>
                        <th className="px-4 py-3">Order Total</th>
                        <th className="px-4 py-3">Dividend Share</th>
                        <th className="px-4 py-3">Ledger Status</th>
                        <th className="px-4 py-3 text-center">Toggle status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                      {orders
                        .filter(o => o.affiliateCommission !== undefined)
                        .map(ord => {
                          const associatedAff = affiliates.find(a => a.code === ord.referralCode);
                          return (
                            <tr key={ord.id} className="hover:bg-gray-50/20">
                              <td className="px-4 py-3 font-mono font-bold text-[#1580c2]">{ord.id}</td>
                              <td className="px-4 py-3">
                                <p className="font-bold text-gray-900">{associatedAff ? associatedAff.name : 'Referred Sale'}</p>
                                <p className="text-[10px] text-gray-400">{ord.referralCode ? `Code: ${ord.referralCode}` : 'Order code link transaction'}</p>
                              </td>
                              <td className="px-4 py-3 font-mono">RM {ord.total.toFixed(2)}</td>
                              <td className="px-4 py-3 font-mono text-emerald-600 font-bold">RM {ord.affiliateCommission?.toFixed(2)}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  ord.commissionPaid 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                    : 'bg-orange-50 text-orange-700 border border-orange-200'
                                }`}>
                                  {ord.commissionPaid ? 'Paid' : 'Pending'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleCommissionPaid(ord.id)}
                                  className="text-[10px] font-bold text-blue-600 hover:underline hover:text-blue-800"
                                >
                                  {ord.commissionPaid ? 'Mark Pending' : 'Mark Paid'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      {orders.filter(o => o.affiliateCommission !== undefined).length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-400">No affiliate transaction commission ledgers generated.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: RECRUITMENT & NETWORK MANAGEMENT */}
          {affiliateSubView === 'recruitment' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Invite Partner panel */}
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="border-b border-gray-50 pb-3">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Invite Ecosystem Partners</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Recruit and map multi-level commission structures</p>
                </div>

                {inviteSuccessMsg && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold p-3 rounded-xl flex items-center gap-2">
                    <span>✓</span>
                    <p>Success! Multi-level recruitment invitation link dispatched to {inviteEmail}.</p>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!inviteEmail) return;

                    // Build a real registration invite link with upline referral attribution
                    const referrer = affiliates.find(a => a.id === inviteReferrerId);
                    const inviteLink = `${window.location.origin}${window.location.pathname}${referrer ? `?ref=${encodeURIComponent(referrer.code)}` : ''}`;
                    const inviteMessage = language === 'ms'
                      ? `Salam! Anda dijemput menyertai program Rakan Afiliat ${websiteConfig.siteName}. Daftar di sini: ${inviteLink}${referrer ? ` (Penaja: ${referrer.name})` : ''}`
                      : `Hi! You are invited to join the ${websiteConfig.siteName} Affiliate Partner programme. Register here: ${inviteLink}${referrer ? ` (Sponsor: ${referrer.name})` : ''}`;

                    // Dispatch: WhatsApp if phone provided, otherwise email client
                    if (invitePhone.trim()) {
                      const waNumber = invitePhone.replace(/[^0-9]/g, '');
                      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(inviteMessage)}`, '_blank', 'noopener,noreferrer');
                    } else {
                      const subject = language === 'ms' ? `Jemputan Rakan Afiliat ${websiteConfig.siteName}` : `${websiteConfig.siteName} Affiliate Partner Invitation`;
                      window.location.href = `mailto:${inviteEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(inviteMessage)}`;
                    }

                    const newInv = {
                      id: `inv-${Date.now().toString().slice(-4)}`,
                      email: inviteEmail,
                      phone: invitePhone,
                      referrerCode: referrer?.code || null,
                      date: new Date().toISOString().split('T')[0],
                      status: 'pending'
                    };

                    setPendingInvites(prev => [newInv, ...prev]);
                    setInviteEmail('');
                    setInvitePhone('');
                    setInviteReferrerId('');
                    setInviteSuccessMsg(true);
                    addAuditLog('Recruit Invitation Sent', 'affiliates', newInv.id, `Dispatched partner recruit link for email: ${inviteEmail}${referrer ? ` under upline ${referrer.code}` : ''}`);
                    
                    setTimeout(() => {
                      setInviteSuccessMsg(false);
                    }, 3000);
                  }}
                  className="space-y-3 text-left"
                >
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Recipient E-mail Address</label>
                    <input
                      type="email"
                      required
                      placeholder="partner-candidate@example.my"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Recipient Phone / WhatsApp No</label>
                    <input
                      type="text"
                      placeholder="+60187654321"
                      value={invitePhone}
                      onChange={(e) => setInvitePhone(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Upline Recruiter (Parent Affiliate)</label>
                    <select
                      value={inviteReferrerId}
                      onChange={(e) => setInviteReferrerId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
                    >
                      <option value="">Direct Corporate (HQ - No MLM Parent)</option>
                      {affiliates.map(aff => (
                        <option key={aff.id} value={aff.id}>{aff.name} ({aff.code})</option>
                      ))}
                    </select>
                    <p className="text-[9px] text-gray-400 mt-1">Configures secondary upline network attribution (5% sub-referral commission override).</p>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#1580c2] hover:bg-[#116499] text-white font-bold text-xs uppercase py-3 rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    Send Recruitment Credentials
                  </button>
                </form>
              </div>

              {/* Recruitment tracking lists */}
              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs text-left self-start">
                <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center select-none">
                  <div>
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Genealogy Recruitment Network</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Track multi-level team trees and active invitations</p>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <h5 className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400 mb-2">Pending Invitation Links</h5>
                    <div className="divide-y divide-gray-50 border border-gray-100 rounded-2xl overflow-hidden text-xs">
                      {pendingInvites.map(inv => (
                        <div key={inv.id} className="p-3 hover:bg-gray-50/50 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-800">{inv.email}</p>
                            <p className="text-[9.5px] text-gray-400">Issued: {inv.date} • Phone: {inv.phone || 'N/A'}</p>
                          </div>
                          <span className="px-2.5 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-100 text-[9px] font-bold uppercase rounded-full">
                            Pending Registration
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400 mb-2">Active Referrer Network</h5>
                    <div className="bg-gray-50 rounded-2xl p-3.5 space-y-2 text-[11px]">
                      {affiliates.length === 0 ? (
                        <p className="text-[10px] text-gray-400 py-2 text-center">No affiliates registered in the network yet.</p>
                      ) : (
                        affiliates
                          .slice()
                          .sort((a, b) => b.unitsSold - a.unitsSold)
                          .slice(0, 6)
                          .map((aff, idx) => (
                            <div key={aff.id} className="flex items-center gap-2">
                              <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-[9.5px] uppercase ${
                                aff.tier === 'Gold' ? 'text-amber-800 bg-amber-50' :
                                aff.tier === 'Silver' ? 'text-slate-700 bg-slate-100' :
                                'text-orange-800 bg-orange-50'
                              }`}>{aff.tier}</span>
                              <span className="font-bold text-gray-900">{aff.name} ({aff.code})</span>
                              <span className="text-[9px] text-emerald-600 font-semibold">{aff.unitsSold} units referred</span>
                              {idx === 0 && aff.unitsSold > 0 && <span className="text-[9px] text-gray-400">(Leader)</span>}
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: BROADCAST CAMPAIGNS & MARKETING */}
          {affiliateSubView === 'comms' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Form */}
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 self-start">
                <div className="border-b border-gray-50 pb-3">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Broadcast Campaigns</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Reach your entire affiliate team instantly</p>
                </div>

                {campaignFeedback && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold p-3 rounded-xl flex items-center gap-2">
                    <span>✓</span>
                    <p>{campaignFeedback}</p>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!campaignSubject || !campaignBody) return;

                    // Resolve the real recipient segment from live affiliate records
                    const targets = affiliates.filter(aff => {
                      if ((aff.status || 'active') !== 'active') return false;
                      if (campaignRecipients === 'all') return true;
                      if (campaignRecipients === 'top_performers') return aff.unitsSold > 15;
                      return aff.tier === campaignRecipients;
                    });

                    if (targets.length === 0) {
                      setCampaignFeedback('No active affiliates match this segment. Broadcast cancelled.');
                      setTimeout(() => setCampaignFeedback(null), 4000);
                      return;
                    }

                    // Dispatch by channel
                    if (campaignChannel === 'email') {
                      const bccList = targets.map(a => a.email).filter(Boolean).join(',');
                      window.location.href = `mailto:?bcc=${encodeURIComponent(bccList)}&subject=${encodeURIComponent(campaignSubject)}&body=${encodeURIComponent(campaignBody)}`;
                    } else if (campaignChannel === 'sms') {
                      // Copy the message so it can be pasted into a bulk SMS/WhatsApp gateway
                      navigator.clipboard?.writeText(`${campaignSubject}\n\n${campaignBody}`).catch(() => {});
                    }

                    const segmentLabel = campaignRecipients === 'all'
                      ? 'All Partners'
                      : campaignRecipients === 'top_performers'
                        ? 'Top Performers'
                        : `${campaignRecipients} Tier`;

                    const newCamp = {
                      id: `c-${Date.now().toString().slice(-4)}`,
                      channel: campaignChannel,
                      recipients: segmentLabel,
                      subject: campaignSubject,
                      date: new Date().toISOString().split('T')[0],
                      count: targets.length,
                      status: campaignChannel === 'email' ? 'Sent' : 'Copied to clipboard'
                    };

                    setCampaignHistory(prev => [newCamp, ...prev]);
                    setCampaignSubject('');
                    setCampaignBody('');
                    setCampaignFeedback(
                      campaignChannel === 'email'
                        ? `Email client opened with ${targets.length} affiliate(s) in BCC. Review & hit send.`
                        : campaignChannel === 'sms'
                          ? `Message for ${targets.length} affiliate(s) copied to clipboard — paste into your SMS/WhatsApp gateway.`
                          : `In-app notice logged for ${targets.length} affiliate(s).`
                    );
                    addAuditLog('Dispatched Team Campaign', 'affiliates', newCamp.id, `Subject: ${campaignSubject} via channel ${campaignChannel} to ${targets.length} recipients (${segmentLabel})`);
                    
                    setTimeout(() => {
                      setCampaignFeedback(null);
                    }, 5000);
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Target Recipient Segment</label>
                    <select
                      value={campaignRecipients}
                      onChange={(e) => setCampaignRecipients(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
                    >
                      <option value="all">All Registered Affiliates ({affiliates.length})</option>
                      <option value="Gold">Gold Tier Partners Only</option>
                      <option value="Silver">Silver Tier Partners Only</option>
                      <option value="Bronze">Bronze Tier Partners Only</option>
                      <option value="top_performers">Top Performers (&gt; 15 units sold)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Transmission Channel</label>
                    <select
                      value={campaignChannel}
                      onChange={(e) => setCampaignChannel(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
                    >
                      <option value="email">📧 Corporate Email Dispatcher</option>
                      <option value="sms">💬 SMS Broadcast (MobiWeb API)</option>
                      <option value="in_app">🔔 In-App Dashboard Pop-Up Alert</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Campaign Subject / Headline</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Exclusive Honey Restock / New Tier Commissions!"
                      value={campaignSubject}
                      onChange={(e) => setCampaignSubject(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Broadcast Content Body</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Enter body text... Supports template tag variable replacements: {{name}} or {{code}}."
                      value={campaignBody}
                      onChange={(e) => setCampaignBody(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#1580c2] hover:bg-[#116499] text-white font-bold text-xs uppercase py-3 rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    🚀 Trigger Global Dispatch
                  </button>
                </form>
              </div>

              {/* History right block */}
              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs lg:col-span-2 text-left self-start">
                <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center select-none">
                  <div>
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Broadcast Campaign History Logs</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Audit trail of outbound marketing messages</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 font-bold text-gray-400 text-[10px] uppercase tracking-wider">
                        <th className="px-4 py-3">Dispatched Date</th>
                        <th className="px-4 py-3">Channel</th>
                        <th className="px-4 py-3">Recipients Segment</th>
                        <th className="px-4 py-3">Campaign Subject</th>
                        <th className="px-4 py-3 text-center">Audited Receptors</th>
                        <th className="px-4 py-3">Transmission</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                      {campaignHistory.map(camp => (
                        <tr key={camp.id} className="hover:bg-gray-50/20">
                          <td className="px-4 py-3 font-mono text-gray-500 text-[10.5px]">{camp.date}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-blue-50 text-[#1580c2] border border-blue-100 text-[9px] font-bold uppercase rounded-md">
                              {camp.channel}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-800 text-[11px]">{camp.recipients}</td>
                          <td className="px-4 py-3 text-gray-600 truncate max-w-xs" title={camp.subject}>{camp.subject}</td>
                          <td className="px-4 py-3 text-center font-bold font-mono">{camp.count} partners</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold uppercase rounded-full">
                              {camp.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: ANALYTICS & STATS PERFORMANCE REPORTING */}
          {affiliateSubView === 'analytics' && (
            <div className="space-y-6">
              {/* Graphic metrics panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(() => {
                  const referredPaid = paidOrders.filter(o => o.referralCode);
                  const referredRevenue = referredPaid.reduce((sum, o) => sum + o.total, 0);
                  const sourcedPct = totalRevenue > 0 ? (referredRevenue / totalRevenue) * 100 : 0;
                  const avgReferredOrder = referredPaid.length > 0 ? referredRevenue / referredPaid.length : 0;
                  const activeAffs = affiliates.filter(a => (a.status || 'active') === 'active').length;
                  const activePct = affiliates.length > 0 ? (activeAffs / affiliates.length) * 100 : 0;
                  return (
                    <>
                      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                          <h5 className="text-[10.5px] uppercase font-bold text-gray-400 tracking-wider">Affiliate-Sourced Revenue</h5>
                          <p className="text-3xl font-black text-gray-950 mt-1">{sourcedPct.toFixed(1)}%</p>
                          <p className="text-[9.5px] text-gray-400 mt-2">RM {referredRevenue.toFixed(2)} of RM {totalRevenue.toFixed(2)} paid revenue came via referral codes.</p>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mt-4">
                          <div className="bg-[#1580c2] h-full rounded-full" style={{ width: `${Math.min(100, sourcedPct)}%` }} />
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                          <h5 className="text-[10.5px] uppercase font-bold text-gray-400 tracking-wider">Avg Referred Order Value</h5>
                          <p className="text-3xl font-black text-gray-950 mt-1">RM {avgReferredOrder.toFixed(2)}</p>
                          <p className="text-[9.5px] text-gray-400 mt-2">Average basket size across {referredPaid.length} paid affiliate-referred order(s).</p>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mt-4">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, (avgReferredOrder / 500) * 100)}%` }} />
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                          <h5 className="text-[10.5px] uppercase font-bold text-gray-400 tracking-wider">Active Partner Ratio</h5>
                          <p className="text-3xl font-black text-gray-950 mt-1">{activePct.toFixed(1)}%</p>
                          <p className="text-[9.5px] text-gray-400 mt-2">{activeAffs} of {affiliates.length} registered affiliate(s) currently in active standing.</p>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mt-4">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, activePct)}%` }} />
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Leaderboards sorting list visual */}
              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs p-5">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-4">Affiliate Sales Leaderboard Benchmarks</h3>
                <div className="space-y-4">
                  {affiliates
                    .slice()
                    .sort((a, b) => b.unitsSold - a.unitsSold)
                    .map((aff, index) => {
                      const maxSold = Math.max(...affiliates.map(a => a.unitsSold), 1);
                      const pct = (aff.unitsSold / maxSold) * 100;
                      return (
                        <div key={aff.id} className="space-y-1.5 text-xs">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-gray-800">
                              #{index + 1} {aff.name} ({aff.code})
                            </span>
                            <span className="text-[#1580c2] font-mono">{aff.unitsSold} units • RM {aff.lifetimeSales.toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-gray-100 h-3 rounded-xl overflow-hidden relative">
                            <div className="bg-gradient-to-r from-[#1580c2] to-blue-500 h-full rounded-xl" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* PARTNER DETAIL DRAWER / MODAL CONTAINER */}
          {showAffModal && selectedAff && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
              <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative text-left">
                <button
                  onClick={() => setShowAffModal(false)}
                  className="absolute top-4 right-4 h-8 w-8 rounded-full bg-gray-150 hover:bg-gray-200 text-gray-500 flex items-center justify-center font-bold transition-all"
                >
                  ✕
                </button>

                <div className="border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="h-11 w-11 rounded-full bg-[#1580c2] text-white flex items-center justify-center text-lg font-black font-mono">
                      {selectedAff.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <h4 className="text-base font-black text-gray-950 leading-tight">{selectedAff.name}</h4>
                      <p className="text-xs text-gray-500">{selectedAff.email} • Code: {selectedAff.code}</p>
                    </div>
                  </div>
                </div>

                {/* Profile detail details content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 bg-gray-50 p-3.5 rounded-2xl text-[11px] font-medium">
                    <p className="font-bold text-gray-400 uppercase tracking-wide text-[9px] mb-2">Ecosystem Profile Attributes</p>
                    <p><strong className="text-gray-900">Phone/WhatsApp:</strong> {selectedAff.whatsapp}</p>
                    <p><strong className="text-gray-900">Registration Date:</strong> {selectedAff.signupDate || '2026-06-01'}</p>
                    <p><strong className="text-gray-900">Affiliate Identifier:</strong> {selectedAff.id}</p>
                    <p><strong className="text-gray-900">Referral Link clicks:</strong> {selectedAff.clicks || 221} views</p>
                    <p><strong className="text-gray-900">Conversion Rate:</strong> {(((selectedAff.conversions || 14) / (selectedAff.clicks || 221)) * 100).toFixed(2)}%</p>
                  </div>

                  <div className="space-y-1 bg-gray-50 p-3.5 rounded-2xl text-[11px] font-medium">
                    <p className="font-bold text-gray-400 uppercase tracking-wide text-[9px] mb-2">Financial Accumulations</p>
                    <p><strong className="text-gray-900">Total Referred Units Sold:</strong> {selectedAff.unitsSold} units</p>
                    <p><strong className="text-gray-900">Cumulative Direct Sales:</strong> RM {selectedAff.lifetimeSales.toFixed(2)}</p>
                    <p className="text-emerald-600"><strong className="text-gray-900">Ledger Unpaid Commission:</strong> RM {orders.filter(o => o.affiliateCommission && !o.commissionPaid).reduce((sum, o) => sum + (o.affiliateCommission || 0), 0).toFixed(2)}</p>
                    <p className="text-emerald-700"><strong className="text-gray-900">Paid Commission Dividends:</strong> RM {selectedAff.lifetimeCommissions.toFixed(2)}</p>
                  </div>
                </div>

                {/* Edit forms */}
                <div className="bg-blue-50/50 border border-blue-105 p-4 rounded-2xl space-y-4">
                  <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Administrative Overrides</h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider">Attribution Class Tier</label>
                      <select
                        value={editAffTier}
                        onChange={(e) => setEditAffTier(e.target.value as TierType)}
                        className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs focus:outline-none mt-1"
                      >
                        <option value="Bronze">Bronze (10% standard)</option>
                        <option value="Silver">Silver (15% standard)</option>
                        <option value="Gold">Gold (20% standard)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider">Network Status</label>
                      <select
                        value={editAffStatus}
                        onChange={(e) => setEditAffStatus(e.target.value as any)}
                        className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs focus:outline-none mt-1"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                        <option value="blacklisted">Blacklisted</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider">Override Commission Rate (%)</label>
                      <input
                        type="number"
                        placeholder="e.g. 18.5"
                        value={editAffOverride}
                        onChange={(e) => setEditAffOverride(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs focus:outline-none mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAffModal(false)}
                      className="px-4 py-2 border border-gray-200 text-gray-500 text-xs font-bold uppercase rounded-xl hover:bg-gray-100 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const overrideNum = editAffOverride ? parseFloat(editAffOverride) : undefined;
                        updateAffiliate(selectedAff.id, {
                          tier: editAffTier,
                          status: editAffStatus,
                          commissionOverride: overrideNum
                        });
                        setShowAffModal(false);
                      }}
                      className="px-5 py-2 bg-[#1580c2] text-white text-xs font-bold uppercase rounded-xl hover:bg-[#116499] transition-all cursor-pointer shadow-xs"
                    >
                      Apply Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================== */}
      {/* 6. ADMIN AGENT MANAGEMENT DASHBOARD  */}
      {/* ==================================== */}
      {activeAdminSubTab === 'agents' && (
        <div className="space-y-6 animate-scale-up text-left">
          {/* Dashboard Header KPIs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-105 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Agents</span>
                <span className="block text-2xl font-bold text-gray-900 mt-1">{agents.length} Active Agents</span>
                <span className="text-[9.5px] text-teal-600 font-bold block mt-1">● Direct sales footprint</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-105 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Allocated Reserve Stock</span>
                <span className="block text-2xl font-bold text-gray-900 mt-1">
                  {agents.reduce((sum, a) => sum + a.stockBalance, 0)} Units
                </span>
                <span className="text-[9.5px] text-blue-500 font-bold block mt-1">Distributed across warehouses</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Package className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-105 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Agent-Sourced Sales</span>
                <span className="block text-2xl font-bold text-gray-900 mt-1">
                  RM {orders.filter(o => o.agentId).reduce((sum, o) => sum + o.total, 0).toFixed(2)}
                </span>
                <span className="text-[9.5px] text-emerald-600 font-bold block mt-1">
                  {orders.filter(o => o.agentId).length} Fulfillments
                </span>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-105 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Low Stock Warehouses</span>
                <span className="block text-2xl font-bold text-orange-650 mt-1">
                  {agents.filter(a => a.stockBalance <= 15).length} Stations
                </span>
                <span className="text-[9.5px] text-orange-500 font-bold block mt-1">In critical replenishment need</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-50 text-orange-650 flex items-center justify-center">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Shopee-style sub-tab navigation menu */}
          <div className="bg-gray-100/70 p-1.5 rounded-2xl border border-gray-100 flex flex-wrap gap-1 select-none">
            <button
              onClick={() => setAgentSubView('list')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                agentSubView === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/40'
              }`}
            >
              👥 Agent Network
            </button>
            <button
              onClick={() => setAgentSubView('stock')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                agentSubView === 'stock'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/40'
              }`}
            >
              📦 Capacity & Stock Control
            </button>
            <button
              onClick={() => setAgentSubView('sales')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                agentSubView === 'sales'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/40'
              }`}
            >
              🛒 Customer Transactions
            </button>
            <button
              onClick={() => setAgentSubView('analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                agentSubView === 'analytics'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/40'
              }`}
            >
              📊 Analytics Benchmarks
            </button>
          </div>

          {/* VIEW 1: AGENT NETWORK LISTING */}
          {agentSubView === 'list' && (
            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs">
              {/* Search and Filters Bar */}
              <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row gap-3 justify-between items-center">
                <div className="relative w-full md:w-80">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Search className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search agents by user ID or territory..."
                    value={agentSearch}
                    onChange={(e) => setAgentSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <select
                    value={agentTierFilter}
                    onChange={(e) => setAgentTierFilter(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none"
                  >
                    <option value="all">All Tiers</option>
                    <option value="Gold">Gold Agent</option>
                    <option value="Silver">Silver Agent</option>
                    <option value="Bronze">Bronze Agent</option>
                  </select>

                  <select
                    value={agentStatusFilter}
                    onChange={(e) => setAgentStatusFilter(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="blacklisted">Blacklisted</option>
                  </select>

                  <select
                    value={agentStockFilter}
                    onChange={(e) => setAgentStockFilter(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none"
                  >
                    <option value="all">All Stock Levels</option>
                    <option value="low">Low Stock (&lt;= 15)</option>
                    <option value="critical">Critical Stock (&lt;= 5)</option>
                    <option value="normal">Adequate Stock</option>
                  </select>

                  <select
                    value={agentSortBy}
                    onChange={(e) => setAgentSortBy(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-700 focus:outline-none"
                  >
                    <option value="sales">Sort: Agent Sales</option>
                    <option value="stock">Sort: Stock Level</option>
                    <option value="tier">Sort: Reseller Tier</option>
                  </select>
                </div>
              </div>

              {/* Table list */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 font-bold text-gray-400 text-[10px] uppercase tracking-wider">
                      <th className="px-6 py-3">Agent Identifier</th>
                      <th className="px-6 py-3">Territory</th>
                      <th className="px-6 py-3">Tier Level</th>
                      <th className="px-6 py-3">Network Status</th>
                      <th className="px-6 py-3 text-center">Capacity Progress</th>
                      <th className="px-6 py-3">Private Stock</th>
                      <th className="px-6 py-3 text-right">Lifetime Sales</th>
                      <th className="px-6 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                    {agents
                      .filter(agt => {
                        const searchClean = agentSearch.toLowerCase();
                        const matchesSearch = 
                          agt.id.toLowerCase().includes(searchClean) || 
                          agt.userId.toLowerCase().includes(searchClean) || 
                          (agt.territory || '').toLowerCase().includes(searchClean);
                        
                        const matchesTier = agentTierFilter === 'all' || agt.agentTier === agentTierFilter;
                        
                        const statusVal = agt.status || 'active';
                        const matchesStatus = agentStatusFilter === 'all' || statusVal === agentStatusFilter;

                        let matchesStock = true;
                        if (agentStockFilter === 'low') {
                          matchesStock = agt.stockBalance <= 15;
                        } else if (agentStockFilter === 'critical') {
                          matchesStock = agt.stockBalance <= 5;
                        } else if (agentStockFilter === 'normal') {
                          matchesStock = agt.stockBalance > 15;
                        }

                        return matchesSearch && matchesTier && matchesStatus && matchesStock;
                      })
                      .sort((a, b) => {
                        if (agentSortBy === 'stock') return a.stockBalance - b.stockBalance;
                        if (agentSortBy === 'tier') return b.agentTier.localeCompare(a.agentTier);
                        const aSales = orders.filter(o => o.agentId === a.id).reduce((sum, o) => sum + o.total, 0);
                        const bSales = orders.filter(o => o.agentId === b.id).reduce((sum, o) => sum + o.total, 0);
                        return bSales - aSales; // default: sales
                      })
                      .map((agt) => {
                        const statusVal = agt.status || 'active';
                        const capacityPct = Math.min(100, (agt.stockBalance / (agt.maxInventory > 0 ? agt.maxInventory : 100)) * 100);
                        const agentSalesTotal = orders.filter(o => o.agentId === agt.id).reduce((sum, o) => sum + o.total, 0);
                        return (
                          <tr key={agt.id} className="hover:bg-gray-50/20">
                            <td className="px-6 py-4">
                              <p className="font-bold text-gray-900">{agt.id}</p>
                              <p className="text-[10px] text-gray-400">User Acc: {agt.userId}</p>
                              {agt.verifiedAt && <p className="text-[9px] text-emerald-600 font-bold">✓ Verified Merchant</p>}
                            </td>
                            <td className="px-6 py-4 font-semibold text-gray-800">{agt.territory || 'Central Selangor'}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                agt.agentTier === 'Gold' ? 'bg-amber-100 text-amber-900 border border-amber-200' : 
                                agt.agentTier === 'Silver' ? 'bg-slate-100 text-slate-800 border border-slate-200' : 
                                'bg-orange-50 text-orange-700'
                              }`}>
                                {agt.agentTier}
                              </span>
                              <p className="text-[8px] text-gray-400 mt-1">Discount: {agt.discountRate * 100}% off</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                statusVal === 'active' ? 'bg-emerald-50 text-emerald-700' :
                                statusVal === 'suspended' ? 'bg-amber-50 text-amber-700' :
                                'bg-red-50 text-red-700'
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${
                                  statusVal === 'active' ? 'bg-emerald-500' :
                                  statusVal === 'suspended' ? 'bg-amber-500' :
                                  'bg-red-500'
                                }`} />
                                {statusVal}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="w-24 mx-auto bg-gray-100 h-2 rounded-full overflow-hidden relative">
                                <div className={`h-full rounded-full ${capacityPct < 15 ? 'bg-red-500 animate-pulse' : capacityPct < 40 ? 'bg-amber-500' : 'bg-teal-500'}`} style={{ width: `${capacityPct}%` }} />
                              </div>
                              <span className="text-[8.5px] text-gray-400 block mt-1 font-mono font-bold">
                                {agt.stockBalance} / {agt.maxInventory > 0 ? agt.maxInventory : 'UNL'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`font-bold font-mono text-[12px] ${agt.stockBalance <= 5 ? 'text-red-600 animate-pulse font-black' : agt.stockBalance <= 15 ? 'text-amber-600' : 'text-gray-950'}`}>
                                {agt.stockBalance} items
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-black text-teal-700">
                              RM {agentSalesTotal.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => {
                                  setSelectedAgt(agt);
                                  setEditAgtTier(agt.agentTier);
                                  setEditAgtStatus(agt.status || 'active');
                                  setEditAgtTerritory(agt.territory || '');
                                  setShowAgtModal(true);
                                }}
                                className="bg-[#1580c2] hover:bg-[#116499] text-white font-bold text-[10px] uppercase px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                              >
                                View Profile
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: CAPACITY & STOCK REORDERING */}
          {agentSubView === 'stock' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Replenish stock dispatch wizard */}
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 self-start">
                <div className="border-b border-gray-50 pb-3">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Stock Dispatch Wizard</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Approve, invoice & dispatch virtual stock to reseller stations</p>
                </div>

                {stockSuccessMsg && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold p-3 rounded-xl flex items-center gap-2">
                    <span className="text-base">✓</span>
                    <p>{stockSuccessMsg}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider font-sans">Target Agent Account</label>
                    <select
                      value={selectedAgt?.id || ''}
                      onChange={(e) => {
                        const target = agents.find(a => a.id === e.target.value);
                        if (target) setSelectedAgt(target);
                      }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none mt-1 font-sans font-bold"
                    >
                      <option value="">-- Choose Agent --</option>
                      {agents.map(agt => (
                        <option key={agt.id} value={agt.id}>{agt.id} ({agt.territory || 'Selangor'}) - Tier {agt.agentTier}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Select Honey Product</label>
                    <select
                      value={reorderProductId}
                      onChange={(e) => setReorderProductId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none mt-1"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} - Retail: RM {p.price}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Dispatch Batch Quantity</label>
                    <input
                      type="number"
                      value={reorderQty}
                      min={1}
                      onChange={(e) => setReorderQty(parseInt(e.target.value) || 1)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
                    />
                  </div>

                  {/* Calculations breakdown box */}
                  {selectedAgt && (
                    <div className="bg-blue-50 border border-blue-105 p-3 rounded-2xl space-y-1.5 text-xs">
                      <p className="font-bold text-[#1580c2] text-[10.5px]">Wholesale Costing Breakdown</p>
                      <div className="flex justify-between">
                        <span>Retail Subtotal:</span>
                        <span className="font-mono">RM {((products.find(p => p.id === reorderProductId)?.price ?? 0) * reorderQty).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-purple-700">
                        <span>Tier Reseller Discount ({selectedAgt.discountRate * 100}%):</span>
                        <span className="font-mono font-bold">-RM {(((products.find(p => p.id === reorderProductId)?.price ?? 0) * reorderQty) * selectedAgt.discountRate).toFixed(2)}</span>
                      </div>
                      <div className="border-t border-blue-200 pt-1 flex justify-between font-black text-gray-900 text-[12px]">
                        <span>Net Dispatch Cost:</span>
                        <span className="font-mono text-blue-800">RM {(((products.find(p => p.id === reorderProductId)?.price ?? 0) * reorderQty) * (1 - selectedAgt.discountRate)).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!selectedAgt || !products.some(p => p.id === reorderProductId) || reorderQty <= 0}
                  onClick={() => {
                    if (!selectedAgt || !products.some(p => p.id === reorderProductId) || reorderQty <= 0) return;
                    purchaseAgentStock(
                      selectedAgt.id,
                      reorderProductId,
                      reorderQty,
                      `Admin back-office restock dispatch. Approved at ${selectedAgt.agentTier} level wholesale rate.`
                    );

                    const pName = products.find(p => p.id === reorderProductId)?.name || 'Honey';
                    setStockSuccessMsg(`Success! Dispatched ${reorderQty} units of ${pName} to Agent ${selectedAgt.id}.`);
                    addAuditLog('Agent Stock Dispatched', 'agents', selectedAgt.id, `Dispatched ${reorderQty} units of product ID: ${reorderProductId}`);
                    
                    setTimeout(() => {
                      setStockSuccessMsg(null);
                    }, 4000);
                  }}
                  className={`w-full text-white font-bold text-xs uppercase py-3 rounded-xl transition-all shadow-xs ${(!selectedAgt || !products.some(p => p.id === reorderProductId) || reorderQty <= 0) ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#1580c2] hover:bg-[#116499] cursor-pointer'}`}
                >
                  🚚 Authorize & Dispatch Cargo
                </button>
              </div>

              {/* Right Column: Stock logs registry */}
              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs lg:col-span-2 text-left self-start">
                <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Agent Stock Ledger Registry</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Chronological audit logs of stock purchases, sales and direct manual adjustments</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 font-bold text-gray-400 text-[10px] uppercase tracking-wider">
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Agent</th>
                        <th className="px-4 py-3">Honey Variant</th>
                        <th className="px-4 py-3">Delta Qty</th>
                        <th className="px-4 py-3">Action Type</th>
                        <th className="px-4 py-3">Audit Comments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                      {agentStockLogs.map(log => {
                        const associatedProd = products.find(p => p.id === log.productId);
                        return (
                          <tr key={log.id} className="hover:bg-gray-50/20">
                            <td className="px-4 py-3 font-mono text-[10px] text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
                            <td className="px-4 py-3 font-bold text-gray-900">{log.agentId}</td>
                            <td className="px-4 py-3">{associatedProd?.name || log.productId}</td>
                            <td className={`px-4 py-3 font-mono font-bold ${log.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {log.quantity > 0 ? `+${log.quantity}` : log.quantity} units
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${log.action === 'purchase' ? 'bg-blue-50 text-[#1580c2] border border-blue-100' : log.action === 'sale' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-50 text-gray-600 border border-gray-100'}`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 font-sans italic max-w-xs truncate" title={log.notes}>{log.notes}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: CUSTOMER TRANSACTIONS & SALES TRACKING */}
          {agentSubView === 'sales' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
              {/* Left Column: Sourced Sales list */}
              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Agent Sourced Client Orders</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Transactions processed through custom micro-store links</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 font-bold text-gray-400 text-[10px] uppercase tracking-wider">
                        <th className="px-4 py-3">Order ID</th>
                        <th className="px-4 py-3">Fulfilled Agent</th>
                        <th className="px-4 py-3">Client Contact</th>
                        <th className="px-4 py-3">Sale Total</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                      {orders
                        .filter(o => o.agentId)
                        .map(ord => (
                          <tr key={ord.id} className="hover:bg-gray-50/20">
                            <td className="px-4 py-3 font-mono font-bold text-blue-650">{ord.id}</td>
                            <td className="px-4 py-3 font-bold text-gray-900">{ord.agentId}</td>
                            <td className="px-4 py-3">
                              <p className="font-bold text-gray-900">{ord.customerName}</p>
                              <p className="text-[10px] text-gray-400">{ord.customerPhone}</p>
                            </td>
                            <td className="px-4 py-3 font-mono">RM {ord.total.toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${ord.fulfillmentStatus === 'delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                                {ord.fulfillmentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      {orders.filter(o => o.agentId).length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-400">No agent transactions recorded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Agent customers directory */}
              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Reseller Client Directory</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Consolidated list of agent-linked customers</p>
                </div>

                <div className="p-4 space-y-3">
                  <div className="p-3 bg-gray-50 rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-gray-900">Lim Cheng Ghee</p>
                      <p className="text-[10px] text-gray-400">Sourced Agent: AGT-291 • central KL</p>
                      <p className="text-[9.5px] text-[#1580c2] mt-1 font-bold">📧 cheng.ghee@hotmail.com • 📞 +6012-9871102</p>
                    </div>
                    <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 text-[9px] font-bold uppercase rounded-full">
                      ★ VIP Client
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-gray-900">Norasiah binti Osman</p>
                      <p className="text-[10px] text-gray-400">Sourced Agent: AGT-552 • Gombak</p>
                      <p className="text-[9.5px] text-[#1580c2] mt-1 font-bold">📧 norasiah.osman@gmail.com • 📞 +6013-3329910</p>
                    </div>
                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 text-[9px] font-bold uppercase rounded-full">
                      Regular client
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: ANALYTICS BENCHMARKS */}
          {agentSubView === 'analytics' && (
            <div className="space-y-6">
              {/* Metric panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(() => {
                  const totalStockHeld = agents.reduce((sum, a) => sum + (a.stockBalance || 0), 0);
                  const totalCapacity = agents.reduce((sum, a) => sum + (a.maxInventory > 0 ? a.maxInventory : 0), 0);
                  const utilizationPct = totalCapacity > 0 ? (totalStockHeld / totalCapacity) * 100 : 0;
                  const avgMarginPct = agents.length > 0
                    ? (agents.reduce((sum, a) => sum + (a.discountRate || 0), 0) / agents.length) * 100
                    : 0;
                  const activeAgents = agents.filter(a => (a.status || 'active') === 'active').length;
                  const activeAgentPct = agents.length > 0 ? (activeAgents / agents.length) * 100 : 0;
                  return (
                    <>
                      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                          <h5 className="text-[10.5px] uppercase font-bold text-gray-400 tracking-wider">Network Stock Utilization</h5>
                          <p className="text-3xl font-black text-gray-950 mt-1">{utilizationPct.toFixed(1)}%</p>
                          <p className="text-[9.5px] text-gray-400 mt-2">{totalStockHeld} units held across agents against {totalCapacity} total warehouse capacity.</p>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mt-4">
                          <div className="bg-[#1580c2] h-full rounded-full" style={{ width: `${Math.min(100, utilizationPct)}%` }} />
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                          <h5 className="text-[10.5px] uppercase font-bold text-gray-400 tracking-wider">Avg Wholesale Discount Given</h5>
                          <p className="text-3xl font-black text-gray-950 mt-1">{avgMarginPct.toFixed(1)}%</p>
                          <p className="text-[9.5px] text-gray-400 mt-2">Average tier discount extended to reseller agents on bulk stock purchases.</p>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mt-4">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, avgMarginPct)}%` }} />
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                          <h5 className="text-[10.5px] uppercase font-bold text-gray-400 tracking-wider">Active Agent Ratio</h5>
                          <p className="text-3xl font-black text-gray-950 mt-1">{activeAgentPct.toFixed(1)}%</p>
                          <p className="text-[9.5px] text-gray-400 mt-2">{activeAgents} of {agents.length} registered agent(s) currently in active operating status.</p>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mt-4">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, activeAgentPct)}%` }} />
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Graphical bench list */}
              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs p-5">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-4">Agent Stock Turnover Benchmarks</h3>
                <div className="space-y-4">
                  {agents.map((agt, idx) => {
                    const capacityPct = Math.min(100, (agt.stockBalance / (agt.maxInventory > 0 ? agt.maxInventory : 100)) * 100);
                    return (
                      <div key={agt.id} className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-gray-800">
                            #{idx + 1} Agent {agt.id} ({agt.territory || 'Selangor'}) - Tier {agt.agentTier}
                          </span>
                          <span className="text-[#1580c2] font-mono">{agt.stockBalance} items on-hand / {agt.maxInventory > 0 ? agt.maxInventory : 'Unlimited'} Cap</span>
                        </div>
                        <div className="w-full bg-gray-100 h-3 rounded-xl overflow-hidden relative">
                          <div className={`h-full rounded-xl bg-gradient-to-r from-teal-500 to-[#1580c2]`} style={{ width: `${capacityPct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* AGENT DETAIL DRAWER / MODAL CONTAINER */}
          {showAgtModal && selectedAgt && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
              <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative text-left">
                <button
                  onClick={() => setShowAgtModal(false)}
                  className="absolute top-4 right-4 h-8 w-8 rounded-full bg-gray-150 hover:bg-gray-200 text-gray-500 flex items-center justify-center font-bold transition-all"
                >
                  ✕
                </button>

                <div className="border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="h-11 w-11 rounded-full bg-[#1580c2] text-white flex items-center justify-center text-lg font-black font-mono">
                      AG
                    </span>
                    <div>
                      <h4 className="text-base font-black text-gray-950 leading-tight">Agent {selectedAgt.id}</h4>
                      <p className="text-xs text-gray-500">Linked User Account: {selectedAgt.userId} • Zone: {selectedAgt.territory || 'Central Selangor'}</p>
                    </div>
                  </div>
                </div>

                {/* Profile detail cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 bg-gray-50 p-3.5 rounded-2xl text-[11px] font-medium">
                    <p className="font-bold text-gray-400 uppercase tracking-wide text-[9px] mb-2">Merchant Profile Attributes</p>
                    <p><strong className="text-gray-900">Assigned Territory:</strong> {selectedAgt.territory || 'Central Selangor'}</p>
                    <p><strong className="text-gray-900">Wholesale Tier Level:</strong> {selectedAgt.agentTier}</p>
                    <p><strong className="text-gray-900">Wholesale Discount:</strong> {selectedAgt.discountRate * 100}% off retail</p>
                    <p><strong className="text-gray-900">Sales Commission:</strong> {selectedAgt.commissionRate * 100}% on referrals</p>
                  </div>

                  <div className="space-y-1.5 bg-gray-50 p-3.5 rounded-2xl text-[11px] font-medium">
                    <p className="font-bold text-gray-400 uppercase tracking-wide text-[9px] mb-2">Stock Capacity Status</p>
                    <p><strong className="text-gray-900">Allocated stock:</strong> {selectedAgt.stockBalance} items</p>
                    <p><strong className="text-gray-900">Maximum capacity limit:</strong> {selectedAgt.maxInventory > 0 ? `${selectedAgt.maxInventory} units` : 'Unlimited'}</p>
                    
                    {/* Capacity meter */}
                    <div className="pt-2">
                      <span className="text-[9.5px] font-bold text-gray-400 uppercase">Warehouse Capacity Meter</span>
                      <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden mt-1 relative">
                        <div className="bg-teal-500 h-full rounded-full" style={{ width: `${Math.min(100, (selectedAgt.stockBalance / (selectedAgt.maxInventory > 0 ? selectedAgt.maxInventory : 100)) * 100)}%` }} />
                      </div>
                      <span className="text-[9px] text-gray-500 block mt-1">
                        {Math.round((selectedAgt.stockBalance / (selectedAgt.maxInventory > 0 ? selectedAgt.maxInventory : 100)) * 100)}% capacity utilized
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interactive Stock adjustments breakdown per honey product */}
                <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                  <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Honey Products On-Hand Reserves</h5>
                  <div className="divide-y divide-gray-100 text-xs">
                    {products.map(p => {
                      const reservedStockCount = selectedAgt.stockBalance; // mock individual stock allocations
                      return (
                        <div key={p.id} className="py-2.5 flex justify-between items-center flex-wrap gap-2">
                          <div>
                            <p className="font-bold text-gray-900">{p.name}</p>
                            <p className="text-[10px] text-gray-400">SKU: {p.sku || 'M-PLUS-HON'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-gray-650 bg-white px-2.5 py-1 border border-gray-200 rounded-lg">
                              {reservedStockCount} items
                            </span>
                            
                            <button
                              type="button"
                              onClick={() => {
                                purchaseAgentStock(
                                  selectedAgt.id,
                                  p.id,
                                  -5,
                                  `Manual stock decrement calibration by administrative back-office. Reason: ${adjustmentReason}`
                                );
                                setSelectedAgt(prev => prev ? { ...prev, stockBalance: Math.max(0, prev.stockBalance - 5) } : null);
                              }}
                              className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-bold transition-all text-[10.5px] cursor-pointer"
                            >
                              -5 Adjust
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                purchaseAgentStock(
                                  selectedAgt.id,
                                  p.id,
                                  5,
                                  `Manual stock increment calibration by administrative back-office. Reason: ${adjustmentReason}`
                                );
                                setSelectedAgt(prev => prev ? { ...prev, stockBalance: prev.stockBalance + 5 } : null);
                              }}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold transition-all text-[10.5px] cursor-pointer"
                            >
                              +5 Adjust
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider">Stock Adjustment Audit Reason</label>
                    <input
                      type="text"
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      placeholder="e.g., Manual warehouse alignment / shelf count verification"
                      className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs focus:outline-none mt-1"
                    />
                  </div>
                </div>

                {/* Overrides form */}
                <div className="bg-blue-50/50 border border-blue-105 p-4 rounded-2xl space-y-4">
                  <h5 className="text-xs font-bold text-gray-850 uppercase tracking-wider">Administrative Overrides</h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider">Agent Class Tier</label>
                      <select
                        value={editAgtTier}
                        onChange={(e) => setEditAgtTier(e.target.value as TierType)}
                        className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs focus:outline-none mt-1 font-sans"
                      >
                        <option value="Bronze">Bronze (20% Disc / 15% Comm)</option>
                        <option value="Silver">Silver (30% Disc / 20% Comm)</option>
                        <option value="Gold">Gold (40% Disc / 25% Comm)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider">Zone Territory</label>
                      <input
                        type="text"
                        value={editAgtTerritory}
                        onChange={(e) => setEditAgtTerritory(e.target.value)}
                        placeholder="e.g. Kajang, Selangor"
                        className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs focus:outline-none mt-1"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider">Reseller Status</label>
                      <select
                        value={editAgtStatus}
                        onChange={(e) => setEditAgtStatus(e.target.value as any)}
                        className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs focus:outline-none mt-1"
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="blacklisted">Blacklisted</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAgtModal(false)}
                      className="px-4 py-2 border border-gray-200 text-gray-500 text-xs font-bold uppercase rounded-xl hover:bg-gray-100 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const disc = editAgtTier === 'Gold' ? 0.40 : editAgtTier === 'Silver' ? 0.30 : 0.20;
                        const comm = editAgtTier === 'Gold' ? 0.25 : editAgtTier === 'Silver' ? 0.20 : 0.15;
                        updateAgent(selectedAgt.id, {
                          agentTier: editAgtTier,
                          territory: editAgtTerritory,
                          status: editAgtStatus,
                          discountRate: disc,
                          commissionRate: comm
                        });
                        setShowAgtModal(false);
                      }}
                      className="px-5 py-2 bg-[#1580c2] text-white text-xs font-bold uppercase rounded-xl hover:bg-[#116499] transition-all cursor-pointer shadow-xs"
                    >
                      Apply Overrides
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions compliance audit log tab */}
      {activeAdminSubTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm space-y-4 animate-scale-up text-left">
          <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center select-none">
            <div>
              <h3 className="text-xs font-bold text-gray-850 uppercase tracking-widest">Compliance Audit Trails</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Sequential logs recording all operations & back-office updates</p>
            </div>
            <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-100 font-bold uppercase">
              Chronological Trail
            </span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs">
              No audit records generated. Complete some verification approvals first!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-105 font-bold text-gray-400 text-[10px] tracking-wider uppercase select-none">
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Authorized Executer</th>
                    <th className="px-6 py-3">Action Completed</th>
                    <th className="px-6 py-3">Target Node</th>
                    <th className="px-6 py-3">Changes Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50/30">
                      <td className="px-6 py-3 text-gray-400 font-mono text-[10.5px] whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-3 text-gray-800 font-bold">{log.adminName} (ID: {log.adminId})</td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase text-xs tracking-wide bg-purple-50 text-purple-700 border border-purple-105">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-mono text-[10.5px] whitespace-nowrap">{log.targetType} id: {log.targetId}</td>
                      <td className="px-6 py-3 text-gray-500 font-sans italic max-w-xs truncate" title={log.changes}>{log.changes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================== */}
      {/* 7. DATABASE CONSOLE VIEW             */}
      {/* ==================================== */}
      {activeAdminSubTab === 'db_viewer' && (() => {
        // Find rows matching selection
        let rawRows: any[] = [];
        let headers: string[] = [];
        
        switch (dbTable) {
          case 'user_accounts':
            rawRows = userAccounts;
            headers = ['id', 'email', 'userType', 'status', 'createdAt'];
            break;
          case 'user_profiles':
            rawRows = userProfiles;
            headers = ['id', 'userId', 'fullName', 'icNumber', 'icVerified', 'phoneNumber', 'whatsappNumber', 'createdAt'];
            break;
          case 'user_addresses':
            rawRows = addresses;
            headers = ['id', 'userId', 'addressType', 'fullAddress', 'postalCode', 'city', 'state', 'country', 'isDefault'];
            break;
          case 'bank_accounts':
            rawRows = bankAccounts;
            headers = ['id', 'userId', 'accountHolderName', 'bankName', 'accountNumber', 'accountType', 'isVerified', 'isDefault'];
            break;
          case 'products':
            rawRows = products;
            headers = ['id', 'name', 'category', 'price', 'volume', 'stock'];
            break;
          case 'affiliates':
            rawRows = affiliates;
            headers = ['id', 'userId', 'name', 'email', 'code', 'tier', 'unitsSold', 'lifetimeSales', 'lifetimeCommissions'];
            break;
          case 'agents':
            rawRows = agents;
            headers = ['id', 'userId', 'agentTier', 'stockBalance', 'stockAllocated', 'commissionRate', 'maxInventory', 'createdAt'];
            break;
          case 'agent_stock_logs':
            rawRows = agentStockLogs;
            headers = ['id', 'agentId', 'productId', 'quantity', 'action', 'transactionId', 'notes', 'createdAt'];
            break;
          case 'orders':
            rawRows = orders;
            headers = ['id', 'customerName', 'customerEmail', 'shippingAddress', 'items', 'total', 'paymentStatus', 'fulfillmentStatus', 'createdAt'];
            break;
          case 'website_config':
            rawRows = [websiteConfig];
            headers = ['siteName', 'siteDescription', 'logoUrl', 'primaryColor', 'contactPhone', 'contactEmail'];
            break;
          case 'website_pages':
            rawRows = websitePages;
            headers = ['id', 'slug', 'title', 'content', 'published', 'updatedAt'];
            break;
          case 'audit_logs':
            rawRows = auditLogs;
            headers = ['id', 'adminId', 'adminName', 'action', 'targetType', 'targetId', 'changes', 'createdAt'];
            break;
          default:
            rawRows = [];
        }

        // Apply local search match
        const query = dbSearchText.toLowerCase().trim();
        const filteredRows = rawRows.filter(row => {
          if (!query) return true;
          return Object.values(row).some(val => {
            if (val === null || val === undefined) return false;
            if (typeof val === 'object') {
              try { return JSON.stringify(val).toLowerCase().includes(query); } catch { return false; }
            }
            return String(val).toLowerCase().includes(query);
          });
        });

        const downloadJsonTable = () => {
          const content = JSON.stringify(rawRows, null, 2);
          const blob = new Blob([content], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `database_${dbTable}.json`;
          a.click();
          URL.revokeObjectURL(url);
        };

        const downloadFullBackup = () => {
          const fullBackup = {
            user_accounts: userAccounts,
            user_profiles: userProfiles,
            user_addresses: addresses,
            bank_accounts: bankAccounts,
            products: products,
            affiliates: affiliates,
            agents: agents,
            agent_stock_logs: agentStockLogs,
            orders: orders,
            website_config: websiteConfig,
            website_pages: websitePages,
            audit_logs: auditLogs,
            schema_type: "Malaysia Honey Ecosystem Relational Database Model",
            provider: supabaseConnected ? "Supabase Postgres Active Connection" : "Local Sandbox Memory Storage"
          };
          const content = JSON.stringify(fullBackup, null, 2);
          const blob = new Blob([content], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `full_system_database_backup.json`;
          a.click();
          URL.revokeObjectURL(url);
        };

        const tablesMeta = [
          { key: 'user_accounts', label: 'user_accounts', count: userAccounts.length, category: 'Auth & Accounts' },
          { key: 'user_profiles', label: 'user_profiles', count: userProfiles.length, category: 'Auth & Accounts' },
          { key: 'user_addresses', label: 'user_addresses', count: addresses.length, category: 'Auth & Accounts' },
          { key: 'bank_accounts', label: 'bank_accounts', count: bankAccounts.length, category: 'Financials' },
          { key: 'products', label: 'products', count: products.length, category: 'Warehouse & Logistics' },
          { key: 'affiliates', label: 'affiliates', count: affiliates.length, category: 'Ecosystem Partner Network' },
          { key: 'agents', label: 'agents', count: agents.length, category: 'Ecosystem Partner Network' },
          { key: 'agent_stock_logs', label: 'agent_stock_logs', count: agentStockLogs.length, category: 'Warehouse & Logistics' },
          { key: 'orders', label: 'orders', count: orders.length, category: 'Financials' },
          { key: 'website_config', label: 'website_config', count: 1, category: 'CMS Content' },
          { key: 'website_pages', label: 'website_pages', count: websitePages.length, category: 'CMS Content' },
          { key: 'audit_logs', label: 'audit_logs', count: auditLogs.length, category: 'Security & Logs' }
        ];

        return (
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm flex flex-col md:flex-row text-left min-h-[500px]">
            {/* Table Selection Sidebar */}
            <div className="w-full md:w-64 bg-slate-50 border-r border-gray-100 p-4 shrink-0 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Relational Database</h3>
                  <p className="text-[10px] text-gray-500 mt-1 leading-snug">
                    Inspect individual table states mimicking fully normalized schemas.
                  </p>
                </div>

                <div className="space-y-3.5">
                  {/* Category Grouping */}
                  {['Auth & Accounts', 'Financials', 'Warehouse & Logistics', 'Ecosystem Partner Network', 'CMS Content', 'Security & Logs'].map(cat => {
                    const catTables = tablesMeta.filter(t => t.category === cat);
                    return (
                      <div key={cat} className="space-y-1">
                        <span className="text-[9px] font-extrabold text-slate-400/80 uppercase tracking-widest block">{cat}</span>
                        {catTables.map(tab => (
                          <button
                            key={tab.key}
                            onClick={() => {
                              setDbTable(tab.key);
                              setDbSearchText('');
                              setViewingDetailRow(null);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-mono rounded-lg transition-all text-left border ${
                              dbTable === tab.key
                                ? 'bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-sm'
                                : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <span className="truncate">📁 {tab.label}</span>
                            <span className={`text-[9px] font-sans font-black px-1.5 py-0.5 rounded-full ${
                              dbTable === tab.key ? 'bg-indigo-700/60 text-indigo-50' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {tab.count}
                            </span>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Download / Control backups */}
              <div className="pt-4 border-t border-gray-200 mt-6 space-y-2">
                <button
                  onClick={downloadFullBackup}
                  className="w-full h-8 bg-slate-800 hover:bg-slate-900 text-white text-[10.5px] font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer uppercase tracking-wider font-sans"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Full DB Backup</span>
                </button>
                <div className="text-[9px] text-gray-400 text-center flex flex-col font-sans">
                  <span>Current: {supabaseConnected ? 'Synced PostgreSQL Cloud' : 'Isolated Local Storage'}</span>
                </div>
              </div>
            </div>

            {/* Main grid viewer pane */}
            <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
              
              {/* Table search & download controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 pb-3 border-b border-gray-100">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 font-mono">SELECT * FROM {dbTable}</h3>
                    <span className="text-[10px] font-sans font-bold bg-[#1580c2]/10 text-[#1580c2] border border-[#1580c2]/15 rounded px-2.5">
                      {filteredRows.length} {filteredRows.length === 1 ? 'row' : 'rows'} matched
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-sans">{supabaseConnected ? 'Fetched directly from live database instances.' : 'Stored safely in standard sandbox state.'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-48 sm:w-56 h-8">
                    <input
                      type="text"
                      placeholder="SQL search filters..."
                      value={dbSearchText}
                      onChange={(e) => setDbSearchText(e.target.value)}
                      className="w-full h-full pl-8 pr-3 text-xs bg-slate-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <button
                    onClick={downloadJsonTable}
                    title="Export table as copyable json array"
                    className="h-8 w-8 rounded-lg border border-gray-200 hover:bg-slate-50 text-slate-500 transition-all flex items-center justify-center cursor-pointer bg-white"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Excel-like Data grid table */}
              <div className="flex-1 overflow-x-auto min-h-[300px]">
                {filteredRows.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-2">
                    <Database className="h-8 w-8 text-slate-250 animate-pulse" />
                    <div>
                      <p className="text-xs font-bold text-slate-800 font-sans">Empty ResultSet</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-sans">No rows found in relational table matching selection or query.</p>
                    </div>
                  </div>
                ) : (
                  <table className="w-full text-left font-mono text-[11px] leading-relaxed border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-gray-200 select-none">
                        <th className="p-2 text-[9px] font-black uppercase text-center w-12 text-slate-400">#</th>
                        {headers.map(col => (
                          <th key={col} className="p-2 text-[9px] font-black uppercase tracking-wider text-slate-400">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 text-slate-700">
                      {filteredRows.map((row, idx) => (
                        <tr 
                          key={idx} 
                          onClick={() => setViewingDetailRow(row)}
                          className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                        >
                          <td className="p-2 text-center text-slate-400 bg-slate-50/20 font-sans font-bold text-[9.5px] border-r border-gray-100">{idx + 1}</td>
                          {headers.map(col => {
                            const val = row[col];
                            let contentStr = '';
                            if (val === null || val === undefined) {
                              contentStr = 'NULL';
                            } else if (typeof val === 'boolean') {
                              contentStr = val ? 'TRUE' : 'FALSE';
                            } else if (typeof val === 'object') {
                              contentStr = JSON.stringify(val);
                            } else {
                              contentStr = String(val);
                            }
                            return (
                              <td key={col} className="p-2 max-w-[170px] truncate" title={contentStr}>
                                {val === null || val === undefined ? (
                                  <span className="text-slate-300 italic">NULL</span>
                                ) : typeof val === 'boolean' ? (
                                  <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase ${val ? 'bg-green-100 text-green-700 font-sans' : 'bg-red-50 text-red-650'}`}>
                                    {val ? 'true' : 'false'}
                                  </span>
                                ) : col === 'id' || col.endsWith('Id') ? (
                                  <span className="text-slate-900 font-bold tracking-tight text-[10px] bg-slate-100 px-1 py-0.5 rounded">{contentStr}</span>
                                ) : col === 'price' || col === 'total' || col.endsWith('Commission') || col.endsWith('Sales') ? (
                                  <span className="text-emerald-700 font-extrabold font-mono">RM {Number(val).toFixed(2)}</span>
                                ) : (
                                  contentStr
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Information disclaimer */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-gray-105 text-[10px] leading-snug text-slate-500 font-sans">
                💡 <span className="font-bold text-slate-800">Quick Debugger:</span> Click any row to inspect the full raw JSON record, including multi-tier relation details. All tables are automatically kept sync'ed with checkout actions, referrers, and restocks dynamically!
              </div>

              {/* JSON Popup Sheet */}
              {viewingDetailRow && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
                  <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col border border-gray-100">
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-gray-100">
                      <span className="text-xs font-bold font-mono text-slate-800">RECORD INSPECT SHEET (Table: {dbTable})</span>
                      <button 
                        onClick={() => setViewingDetailRow(null)}
                        className="text-gray-400 hover:text-gray-800 font-black text-sm p-1 hover:bg-slate-100 rounded-full cursor-pointer h-7 w-7 flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="p-4 overflow-y-auto max-h-[60vh] bg-slate-950 text-white font-mono text-xs leading-relaxed text-left">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(viewingDetailRow, null, 2)}</pre>
                    </div>
                    <div className="p-3 bg-slate-50 border-t border-gray-100 flex justify-end gap-2 text-xs">
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(JSON.stringify(viewingDetailRow, null, 2));
                            setRecordCopied(true);
                            setTimeout(() => setRecordCopied(false), 2000);
                          } catch {
                            setRecordCopied(false);
                          }
                        }}
                        className="px-3.5 py-1.5 bg-[#EE4D2D] text-white font-sans font-bold rounded-lg cursor-pointer hover:bg-orange-600 transition-colors"
                      >
                        {recordCopied ? '✓ Copied!' : 'Copy JSON Row'}
                      </button>
                      <button 
                        onClick={() => setViewingDetailRow(null)}
                        className="px-3.5 py-1.5 bg-white border border-gray-200 text-gray-700 font-sans font-bold rounded-lg cursor-pointer hover:bg-slate-150 transition-all font-sans"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Delete Confirmation Modal */}
              {userToDeleteId && (() => {
                const targetAcc = userAccounts.find(a => a.id === userToDeleteId);
                const targetProfile = userProfiles.find(p => p.userId === userToDeleteId);
                const nameText = targetProfile?.fullName || targetAcc?.email || 'this user';

                return (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 select-none">
                    <div className="bg-white rounded-3xl border border-gray-150 w-full max-w-md shadow-2xl p-6 text-left space-y-4">
                      <div className="flex items-center gap-3 text-red-600">
                        <div className="p-2.5 bg-red-50 rounded-2xl">
                          <Trash2 className="h-6 w-6" />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-tight font-sans">Confirm Permanent Erasure</h4>
                      </div>

                      <div className="space-y-2.5 text-xs text-gray-600">
                        <p>
                          Are you absolutely certain you want to delete <strong className="text-gray-900 font-extrabold">{nameText}</strong>?
                        </p>
                        <p className="bg-red-50 text-red-800 p-3 rounded-2xl border border-red-100 font-medium leading-relaxed">
                          This action is <strong>irreversible</strong>. All of their data will be permanently wiped out, including:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 font-semibold text-[11px]">
                          <li>System Account Credentials & Login Details</li>
                          <li>Representative Profiles & Certified MyKAD (IC) info</li>
                          <li>Registered Delivery & Billing Addresses</li>
                          <li>Linked Bank Savings Accounts</li>
                          <li>Affiliate & Agent Distribution membership data</li>
                        </ul>
                      </div>

                      <div className="flex gap-2.5 pt-2">
                        <button
                          onClick={confirmDeleteUser}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-sans font-bold text-xs py-2.5 px-4 rounded-xl text-center shadow-md transition-colors cursor-pointer"
                        >
                          Yes, Erase Record
                        </button>
                        <button
                          onClick={() => setUserToDeleteId(null)}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-gray-700 font-sans font-bold text-xs py-2.5 px-4 rounded-xl text-center transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>
        );
      })()}

        </div>
      </div>
    </div>
  );
};