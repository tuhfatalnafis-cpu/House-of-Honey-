/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    ms: string;
  };
}

export const translations: TranslationDictionary = {
  // Brand & General UI
  brandTitle: {
    en: "Madu Plus Tualang",
    ms: "Madu Tualang Plus"
  },
  mvpPortalDesc: {
    en: "Affiliate MVP Portal",
    ms: "Portal MVP Afiliat"
  },
  shopTab: {
    en: "E-Commerce Shop",
    ms: "Kedai E-Dagang"
  },
  affiliateTab: {
    en: "Affiliate Portal",
    ms: "Portal Afiliat"
  },
  adminTab: {
    en: "Admin Operations",
    ms: "Operasi Admin"
  },
  activeReferralCode: {
    en: "Active Referral",
    ms: "Ejen Rujukan Aktif"
  },
  supportingAgent: {
    en: "Supporting Agent",
    ms: "Ejen Penyokong"
  },
  referralCodeText: {
    en: "Referral Code",
    ms: "Kod Syor"
  },
  resetSandbox: {
    en: "Reset Sandbox Data",
    ms: "Set Semula Data Sandbox"
  },
  resetConfirm: {
    en: "Restore mockup database to defaults? This will reset all localized sales, signups, and stock metrics.",
    ms: "Pulihkan pangkalan data simulator kepada lalai? Ini akan menolak semula jualan, pendaftaran, dan data stok."
  },
  resetSuccess: {
    en: "Sandbox successfully restored to base defaults.",
    ms: "Sandbox berjaya dipulihkan kepada data lalai asas."
  },

  // Navbar stage alerts
  stageShop: {
    en: "Wellness Store Catalog / Direct Purchases",
    ms: "Katalog Kedai Kesejahteraan / Pembelian Terus"
  },
  stageAffiliate: {
    en: "Affiliate Partnership Central / Represent Logs",
    ms: "Pusat Kerjasama Afiliat / Rekod Wakil"
  },
  stageAdmin: {
    en: "Operational Control Panel / Node Branches",
    ms: "Panel Kawalan Operasi / Cawangan Nod"
  },

  // Catalog Section
  purityStamp: {
    en: "100% Raw Wild Harvest",
    ms: "100% Hasil Liar Semulajadi"
  },
  heroTitle: {
    en: "Pure Jungle Madu Tualang",
    ms: "Madu Tualang Hutan Tulen"
  },
  heroSubtitle: {
    en: "Direct From Pahang Rainforest",
    ms: "Terus Dari Hutan Hujan Pahang"
  },
  heroDesc: {
    en: "Our honey is hand-harvested by local experts from wild combs built on giant Tualang trees deep within Pahang’s virgin rainforest. Sourced responsibly, raw, and unpasteurized.",
    ms: "Madu kami dituai dengan tangan oleh pakar tempatan dari sarang lebah liar di atas pokok Tualang gergasi di dalam hutan hujan dara Pahang. Diambil secara bertanggungjawab, mentah, dan tidak dipasteur."
  },
  ecoHarvested: {
    en: "Eco-harvested",
    ms: "Dituai Ekologi"
  },
  pureLabTested: {
    en: "Pure & Lab Tested",
    ms: "Tulen & Diuji Makmal"
  },
  fairTrade: {
    en: "Fair-trade Community",
    ms: "Komuniti Dagangan Adil"
  },
  supportingMessage: {
    en: "You are purchasing using referral link {code}. A commission from this sale goes directly to support them.",
    ms: "Anda sedang membeli menggunakan kod syor {code}. Komisen daripada jualan ini akan terus diberikan untuk menyokong mereka."
  },
  referralActiveBadge: {
    en: "Referral Active",
    ms: "Syor Diaktifkan"
  },
  catalogHeading: {
    en: "Madu Tualang Pahang Variants",
    ms: "Variasi Madu Tualang Pahang"
  },
  catalogBadge: {
    en: "4 Rare Wild Compositions",
    ms: "4 Komposisi Liar Nadir"
  },
  priceLabel: {
    en: "Price",
    ms: "Harga"
  },
  stockLabel: {
    en: "Stock",
    ms: "Stok"
  },
  outOfStock: {
    en: "Out of Stock",
    ms: "Kehabisan Stok"
  },
  unitsText: {
    en: "units",
    ms: "unit"
  },
  qtyLabel: {
    en: "Qty",
    ms: "Kuantiti"
  },
  addToCartLabel: {
    en: "Add to Shopping Cart",
    ms: "Tambah Ke Troli"
  },
  addedSuccessfully: {
    en: "Added successfully!",
    ms: "Berjaya ditambah!"
  },
  addedLabel: {
    en: "Added!",
    ms: "Ditambah!"
  },
  soldOutBtn: {
    en: "Temporarily Sold Out",
    ms: "Habis Dijual Sementara"
  },
  wellnessProducts: {
    en: "Synergistic Wellness Products",
    ms: "Produk Sinergi Kesejahteraan"
  },
  wellnessBadge: {
    en: "Virgin Coconut Oil",
    ms: "Minyak Kelapa Dara"
  },
  coldPressed: {
    en: "Cold Pressed Oil",
    ms: "Minyak Perahan Sejuk"
  },
  volumeLabel: {
    en: "Volume",
    ms: "Isipadu"
  },

  // Cart / Checkout Drawer
  checkoutPortalTitle: {
    en: "Shopping Checkout Portal",
    ms: "Portal Pembayaran / Troli"
  },
  verifyDetails: {
    en: "Verify order details",
    ms: "Sahkan butiran pesanan"
  },
  enterAddress: {
    en: "Enter shipping destination",
    ms: "Masukkan destinasi penghantaran"
  },
  routingGateway: {
    en: "Routing payment gateway",
    ms: "Menghubungkan gerbang pembayaran"
  },
  receiptStepTitle: {
    en: "Completed successfully!",
    ms: "Selesai dengan jaya!"
  },
  emptyCartTitle: {
    en: "Your shopping cart is flat empty",
    ms: "Troli beli-belah anda kosong"
  },
  emptyCartDesc: {
    en: "Go add pure wild honey variants from our catalog!",
    ms: "Sila masukkan pilihan madu tualang hutan tulen dari katalog kami!"
  },
  browseCatalogBtn: {
    en: "Browse Catalog",
    ms: "Lihat Katalog"
  },
  productBottlesHeader: {
    en: "PRODUCT BOTTLES",
    ms: "BOTOL PRODUK"
  },
  subtotalHeader: {
    en: "SUBTOTAL",
    ms: "JUMLAH KECIL"
  },
  referralDiscountHeader: {
    en: "Referral Commission Discount",
    ms: "Diskaun Komisen Syor"
  },
  codeAppliedLabel: {
    en: "Code Applied",
    ms: "Kod Syor Digunakan"
  },
  commissionRecipientMsg: {
    en: "Commission generated by this checkout will be awarded to {name}.",
    ms: "Komisen daripada pembelian ini akan disalurkan kepada {name}."
  },
  clearCodeBtn: {
    en: "Clear code",
    ms: "Padam kod"
  },
  referralFormPrompt: {
    en: "Apply an Affiliate referral link key to support your local network agent!",
    ms: "Masukkan kod rujukan Afiliat untuk menyokong ejen rangkaian tempatan anda!"
  },
  applyBtn: {
    en: "Apply",
    ms: "Guna"
  },
  enterCodeErr: {
    en: "Enter code first",
    ms: "Sila masukkan kod dahulu"
  },
  codeAppliedSuccess: {
    en: "Code applied! Referred by {name}",
    ms: "Kod berjaya digunakan! Disyorkan oleh {name}"
  },
  codeNotFoundErr: {
    en: "Code not found. Enter other code.",
    ms: "Kod tidak ditemui. Sila cuba kod lain."
  },

  // Shipping Form
  shippingHeader: {
    en: "Fulfillment Logistics & Shipping Info",
    ms: "Logistik & Maklumat Penghantaran"
  },
  shippingHubLabel: {
    en: "Shipping Hub/Branch Isolation",
    ms: "Pusat Penghantaran / Cawangan"
  },
  shippingHubDesc: {
    en: "Select a regional distribution hub. Inventory will automatically synchronize and ship from this node.",
    ms: "Pilih hab pengedaran serantau. Stok inventori akan disegerakkan secara automatik dan menyusul dari cawangan ini."
  },
  fullNameLabel: {
    en: "Customer Full Name",
    ms: "Nama Penuh Pelanggan"
  },
  fullNamePlaceholder: {
    en: "E.g. Muhammad Asyraf",
    ms: "Contoh: Muhammad Asyraf"
  },
  emailLabel: {
    en: "Email Address",
    ms: "Alamat E-mel"
  },
  emailPlaceholder: {
    en: "e.g. customer@gmail.com",
    ms: "Contoh: pelanggan@gmail.com"
  },
  phoneLabel: {
    en: "WhatsApp / Contact Phone",
    ms: "WhatsApp / No. Telefon"
  },
  phonePlaceholder: {
    en: "E.g. +60123456789",
    ms: "Contoh: +60123456789"
  },
  addressLabel: {
    en: "Delivery Destination Address",
    ms: "Alamat Destinasi Penghantaran"
  },
  addressPlaceholder: {
    en: "Full shipping address (Street name, Area, Postcode, State/F.T.)",
    ms: "Alamat penghantaran lengkap (Jalan, Kawasan, Poskod, Negeri)"
  },
  termsReminder: {
    en: "Our products are securely sealed. In case of damage during courier transport, please submit your unpacked photo evidence to WhatsApp customer support within 48 hours for immediate Replacement.",
    ms: "Produk kami dimeterai dengan selamat. Jika terdapat kerosakan semasa proses kurier, sila hantar bukti foto pembungkusan kepada sokongan WhatsApp kami dalam masa 48 jam untuk penggantian segera."
  },
  backToCartBtn: {
    en: "Back to Cart",
    ms: "Kembali ke Troli"
  },
  confirmPaymentBtn: {
    en: "Confirm & Pay (FPX)",
    ms: "Sahkan & Bayar (FPX)"
  },

  // Payment Gateway simulation
  gatewayTitle: {
    en: "Securing Direct Bank Transfer",
    ms: "Memproses Pindahan Bank Selamat"
  },
  gatewayDesc: {
    en: "Communicating with payment infrastructure, preparing secure session token, and registering referral attribution logs...",
    ms: "Menghubungi infrastruktur gerbang pembayaran, memproses token transaksi, dan mendaftarkan komisen agen..."
  },
  noRefreshWarning: {
    en: "DO NOT REFRESH OR HIT BACK BUTTON",
    ms: "JANGAN SEGAR SEMULA ATAU TEKAN BUTANG KEMBALI"
  },
  paymentFailedTitle: {
    en: "Payment Not Completed",
    ms: "Pembayaran Tidak Berjaya"
  },
  paymentFailedDesc: {
    en: "Your payment could not be completed or was cancelled. Your cart and delivery details have been kept — you can try again.",
    ms: "Pembayaran anda tidak dapat diselesaikan atau telah dibatalkan. Troli dan butiran penghantaran anda telah disimpan — anda boleh cuba lagi."
  },

  // Receipt
  orderSucceeded: {
    en: "Order Succeeded!",
    ms: "Pesanan Berjaya!"
  },
  orderSucceededDesc: {
    en: "Thank you! Your wild honey shipment order is now registered at {branch}.",
    ms: "Terima kasih! Pesanan penghantaran madu hutan liar anda kini didaftarkan di {branch}."
  },
  paymentReceiptHeader: {
    en: "PAYMENT RECEIPT",
    ms: "RESIT PEMBAYARAN"
  },
  orderIdLabel: {
    en: "Order ID",
    ms: "ID Pesanan"
  },
  clientNameLabel: {
    en: "Client Name",
    ms: "Nama Pelanggan"
  },
  gatewayLabel: {
    en: "Gateway",
    ms: "Gerbang"
  },
  realGatewayName: {
    en: "FPX via Fintrixpay",
    ms: "FPX melalui Fintrixpay"
  },
  locationHubLabel: {
    en: "Location Hub",
    ms: "Cawangan Hab"
  },
  affiliateAttributionLabel: {
    en: "Affiliate Attribution",
    ms: "Kaitan Afiliat"
  },
  payoutEarnedLabel: {
    en: "Payout Earned",
    ms: "Komisen Dijana"
  },
  bottlesOrderedLabel: {
    en: "Bottles Ordered",
    ms: "Botol Dipesan"
  },
  totalContainersShipped: {
    en: "{count} Total Wellness Containers Slipped",
    ms: "Jumlah {count} Bekas Kesejahteraan Dihantar"
  },
  totalAmountLabel: {
    en: "TOTAL AMOUNT",
    ms: "JUMLAH KESELURUHAN"
  },
  continueShoppingBtn: {
    en: "Continue Honey Shopping",
    ms: "Teruskan Beli Madu"
  },

  // Cart Footer
  cartSubtotalText: {
    en: "Sub-total ({count} items)",
    ms: "Jumlah kecil ({count} item)"
  },
  shippingCourierText: {
    en: "Fulfillment Courier Delivery",
    ms: "Servis Kurier Penghantaran"
  },
  freeShippingText: {
    en: "FREE SHIPPING",
    ms: "PENGHANTARAN PERCUMA"
  },
  totalPurchaseText: {
    en: "Total Purchase",
    ms: "Jumlah Pembelian"
  },
  continueToShippingBtn: {
    en: "Continue to Shipping Address",
    ms: "Teruskan ke Alamat Penghantaran"
  },

  // Affiliate Portal (Auth)
  agentSelfSignup: {
    en: "Self-Signup Agent",
    ms: "Daftar Ejen Afiliat"
  },
  signInHub: {
    en: "Sign In Hub",
    ms: "Log Masuk Ejen"
  },
  startEarningTitle: {
    en: "Start Earning Royal Honey Commissions",
    ms: "Mula Jana Komisen Madu Diraja"
  },
  welcomeBackAgent: {
    en: "Welcome Back Agent",
    ms: "Selamat Kembali Ejen"
  },
  signupPitch: {
    en: "Join our Madu Tualang Pahang direct selling team. Recommend health products to friends and earn 10% to 20% in commissions.",
    ms: "Sertai pasukan jualan langsung Madu Tualang Pahang kami. Syorkan produk kesihatan berkualiti tinggi dan jana komisen 10% hingga 20%."
  },
  signInPitch: {
    en: "Access your analytics panel. Verify referred commissions, trace payout statuses, and monitor your volume tier level.",
    ms: "Akses panel analitik anda. Selidik sejarah komisen syor, jejak status pembayaran, dan lihat aras sasaran jualan anda."
  },
  fullRepName: {
    en: "Full Representative Name",
    ms: "Nama Penuh Wakil Ejen"
  },
  emailRepInput: {
    en: "Email Address (Primary Contact)",
    ms: "Alamat E-mel (Hubungan Utama)"
  },
  whatsappRepInput: {
    en: "WhatsApp Mobile Contact",
    ms: "No. Telefon WhatsApp"
  },
  desiredRepCode: {
    en: "Desired Unique Referral Code",
    ms: "Pilihan Kod Rujukan Unik"
  },
  repCodeHelp: {
    en: "We will use this to generate your custom url links.",
    ms: "Kami akan menggunakan ini untuk menjana link rujukan tersuai anda."
  },
  signUpNowBtn: {
    en: "Sign Up Now",
    ms: "Daftar Sekarang"
  },
  repCodeLabel: {
    en: "Representative Referral Code",
    ms: "Kod Rujukan Wakil Ejen"
  },
  enterDashboardBtn: {
    en: "Enter Dashboard",
    ms: "Masuk ke Dashboard"
  },
  quickDevSignIn: {
    en: "Quick Dev Sign-In Assist",
    ms: "Masuk Pantas Simulator"
  },

  // Affiliate Dashboard (Logged In)
  agentBadge: {
    en: "Agent",
    ms: "Ejen"
  },
  signOutBtn: {
    en: "Sign Out",
    ms: "Log Keluar"
  },
  promotionTrackerTitle: {
    en: "Direct Volume Tier Promotion",
    ms: "Evolusi Aras Komisen Jualan"
  },
  currentLevelText: {
    en: "Current Level",
    ms: "Pangkat Semasa"
  },
  commissionText: {
    en: "Commission",
    ms: "Komisen"
  },
  referredUnitsLabel: {
    en: "{count} units referred",
    ms: "{count} unit dirujuk"
  },
  keepGoingText: {
    en: "Keep going! Sell {remaining} more units to automatically upgrade to {next} Tier, earning {rate} commissions on subsequent sales.",
    ms: "Teruskan lagi! Jual {remaining} unit lagi untuk naik pangkat secara automatik ke Tier {next}, dan jana komisen jualan {rate}."
  },
  eliteStatusAchieved: {
    en: "Elite Status Achieved! You have unlocked maximum Gold tier payouts (20% on all referrals).",
    ms: "Gelar Elite Berjaya Dicapai! Anda telah mengaktifkan kadar komisen maksimum Gold (20% untuk semua jualan)."
  },
  grossSalesReferred: {
    en: "Gross Sales Referred",
    ms: "Jumlah Jualan Dirujuk"
  },
  referredPurchases: {
    en: "Referred purchases",
    ms: "Nilai jualan kasar"
  },
  totalCommissionsLabel: {
    en: "Total Commissions",
    ms: "Jumlah Komisen"
  },
  tierRateMsg: {
    en: "10% - 20% Tier Rate",
    ms: "Kadar Komisen 10% - 20%"
  },
  pendingPayoutsLabel: {
    en: "Pending Payouts",
    ms: "Komisen Tertunggak"
  },
  processingVerification: {
    en: "Processing verification",
    ms: "Dalam proses pengesahan"
  },
  paidCommissionsLabel: {
    en: "Paid Commissions",
    ms: "Komisen Telah Dibayar"
  },
  transferredToBank: {
    en: "Transferred to Bank/e-Wallet",
    ms: "Dikecilkan ke Bank/e-Dompet"
  },
  referredHistoryTitle: {
    en: "Referred Customers Order History ({count})",
    ms: "Rekod Pesanan Pelanggan Dirujuk ({count})"
  },
  liveSyncLogs: {
    en: "Live Sync Logs",
    ms: "Log Segerak Langsung"
  },
  noReferredOrders: {
    en: "No referred orders recorded yet",
    ms: "Tiada rekod pesanan dirujuk lagi"
  },
  shareRefCodeMsg: {
    en: "Share your affiliate code overlay link to drive customer referrals!",
    ms: "Kongsi pautan syor kod ejen anda untuk menjana jualan rujukan!"
  },
  tableOrderId: {
    en: "ORDER ID",
    ms: "ID PESANAN"
  },
  tableClientName: {
    en: "CLIENT NAME",
    ms: "NAMA PELANGGAN"
  },
  tableDate: {
    en: "DATE SOURCED",
    ms: "TARIKH RUJUKAN"
  },
  tableBottles: {
    en: "BOTTLES",
    ms: "BOTOL"
  },
  tableSubtotal: {
    en: "SUB-TOTAL",
    ms: "JUMLAH KECIL"
  },
  tableCommission: {
    en: "COMMISSION",
    ms: "KADAR KOMISEN"
  },
  tableStatus: {
    en: "STATUS",
    ms: "STATUS"
  },
  statusPaidOut: {
    en: "Paid Out",
    ms: "Telah Dibayar"
  },
  statusPendingPayout: {
    en: "Pending Payout",
    ms: "Belum Dibayar"
  },

  // Language Selector Customer Prompt
  selectLang: {
    en: "Select Language",
    ms: "Pilih Bahasa"
  },
  customerModeTip: {
    en: "Customer Language Mode",
    ms: "Mod Bahasa Pelanggan"
  }
};

interface TranslatedProductMeta {
  name: { en: string; ms: string };
  description: { en: string; ms: string };
}

export const productTranslations: { [productId: string]: TranslatedProductMeta } = {
  p1: {
    name: {
      en: "Madu Tualang Genting - Raw Wild Honey",
      ms: "Madu Tualang Genting - Madu Liar Mentah"
    },
    description: {
      en: "Pure, unprocessed wild honey harvested from giant Tualang trees in Genting highlands, Pahang. Rich in antioxidants with a distinctive floral note.",
      ms: "Madu liar mentah gergasi tanpa proses dari tanah tinggi Genting, Pahang. Kaya antioksidan dengan keunikan aroma haruman bungaan rimba."
    }
  },
  p2: {
    name: {
      en: "Madu Tualang Lipis - Premium Black Honey",
      ms: "Madu Tualang Lipis - Madu Hitam Premium"
    },
    description: {
      en: "Rare black wild honey (Madu Hitam) from Kuala Lipis. Harvested from older combs deep in the jungle. Recommended for immune support and stamina.",
      ms: "Madu hitam tualang liar yang sangat bernilai tinggi dari Kuala Lipis. Dituai dari sarang tua madu lebah jauh di dalam hutan rimba. Sesuai untuk stamina."
    }
  },
  p3: {
    name: {
      en: "Madu Tualang Jerantut - Royal Red Honey",
      ms: "Madu Tualang Jerantut - Madu Merah Diraja"
    },
    description: {
      en: "Amber-red Tualang wild honey from Jerantut, near Taman Negara. High in pollen diversity with a perfect balance of sweet and mildly tangy flavor.",
      ms: "Madu merah ambar liar dari Jerantut, berhampiran Taman Negara. Tinggi debunga bermutu tinggi dengan imbangan manis dan kelat-kelat masam manis."
    }
  },
  p4: {
    name: {
      en: "Madu Tualang Temerloh - Classic Yellow",
      ms: "Madu Tualang Temerloh - Kuning Klasik"
    },
    description: {
      en: "Light yellow wild honey from the freshwater swamp regions of Temerloh. Highly energetic, popular for daily wellness beverage mixing.",
      ms: "Madu Tualang kuning klasik hasil segar paya air tawar Temerloh. Membekalkan tenaga bugar harian, amat digemari sebagai minuman madu harian."
    }
  },
  p5: {
    name: {
      en: "Premium Virgin Coconut Oil",
      ms: "Minyak Kelapa Dara Premium"
    },
    description: {
      en: "Cold-pressed virgin coconut oil (Minyak Kelapa Dara). Sourced from organic coastal plantations in Pahang. Multi-purpose dietary supplement.",
      ms: "Minyak kelapa dara perahan sejuk tulen tanpa pemanasan. Diambil dari ladang kelapa pesisir pantai organik di Pahang. Khasiat serba guna harian."
    }
  }
};

export const getProductTranslation = (id: string, field: 'name' | 'description', lang: 'en' | 'ms', fallback: string): string => {
  const trans = productTranslations[id];
  if (trans && trans[field]) {
    return trans[field][lang];
  }
  return fallback;
};

