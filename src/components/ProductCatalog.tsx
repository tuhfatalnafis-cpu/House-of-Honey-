/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useAppState } from '../context/AppContext';
import { Product } from '../types';
import { 
  ShoppingCart, 
  Check, 
  Star, 
  Leaf, 
  AlertCircle, 
  Sparkles,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  PackageCheck,
  TrendingUp,
  Award,
  X,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { translations, getProductTranslation } from '../lib/translations';
import { AnimatePresence, motion } from 'motion/react';

interface ProductCatalogProps {
  mode: 'home' | 'search';
  onNavigate?: (tab: 'home' | 'search' | 'cart' | 'account', subPanel?: 'affiliate' | 'agent' | 'admin' | 'profile_editor' | null) => void;
}

// Extended details specifications dictionary for Shopee catalog authenticity
const PRODUCT_SPECS: {
  [key: string]: {
    origin: { ms: string; en: string };
    harvestMethod: { ms: string; en: string };
    moisture: string;
    labTest: string;
    benefits: { ms: string; en: string }[];
  };
} = {
  p1: {
    origin: { ms: "Tanah Tinggi Genting, Pahang", en: "Genting Highlands, Pahang" },
    harvestMethod: { ms: "Liar & Mentah dari Pohon Tualang Tinggi", en: "Raw & Unfiltered from Giant Tualang Tree Canopy" },
    moisture: "17.2%",
    labTest: "UNIPEK-MS-2026-P1 (Lulus Ketulenan)",
    benefits: [
      { ms: "Meningkatkan tenaga bugar harian dengan pantas", en: "Supercharges daily physical energy levels" },
      { ms: "Kaya dengan antioksidan semulajadi dan enzim aktif", en: "Loaded with natural antioxidants and active live enzymes" },
      { ms: "Membantu melegakan batuk dan sakit tekak ringan", en: "Soothes throat irritation and coughs" }
    ]
  },
  p2: {
    origin: { ms: "Hutan Rimba Kuala Lipis, Pahang", en: "Kuala Lipis Deep Jungle, Pahang" },
    harvestMethod: { ms: "Madu Hitam Liar (Sarang Lebah Tua)", en: "Wild Premium Black Honey (Aged Mature Comb)" },
    moisture: "16.1%",
    labTest: "UNIPEK-MS-2026-P2 (Lulus Ketulenan)",
    benefits: [
      { ms: "Sangat disyorkan untuk ketahanan sistem imuniti badan", en: "Highly recommended for robust immune support" },
      { ms: "Citarasa herba pahit-manis yang unik dan pekat", en: "Distinctive deep bitter-sweet herbal profile" },
      { ms: "Membantu melancarkan peredaran darah", en: "Promotes cardiovascular and blood circulation wellness" }
    ]
  },
  p3: {
    origin: { ms: "Rimba Sempadan Jerantut, Pahang (Taman Negara)", en: "Jerantut Virgin Forest, Pahang (National Park Border)" },
    harvestMethod: { ms: "Madu Merah Diraja Liar (Apis Dorsata)", en: "Wild Royal Red Honey (Giant Apis Dorsata Bee)" },
    moisture: "17.9%",
    labTest: "UNIPEK-MS-2026-P3 (Lulus Ketulenan)",
    benefits: [
      { ms: "Kaya dengan kepelbagaian debunga bunga hutan liar", en: "Rich in wild rainforest bee pollen diversity" },
      { ms: "Citarasa manis berkrim dengan nota buah-buahan", en: "Sweet creamy profile with light wild berry undertones" },
      { ms: "Membantu kualiti tidur yang lebih lena", en: "Promotes sound, deep and restful sleep quality" }
    ]
  },
  p4: {
    origin: { ms: "Kawasan Paya Air Tawar, Temerloh, Pahang", en: "Temerloh Freshwater Swamp Area, Pahang" },
    harvestMethod: { ms: "Madu Kuning Klasik Liar Kelulut/Lebah Rimba", en: "Wild Classic Yellow Honey (Forest Swarm Collection)" },
    moisture: "19.2%",
    labTest: "UNIPEK-MS-2026-P4 (Lulus Ketulenan)",
    benefits: [
      { ms: "Sumber vitamin C rimba semulajadi yang tinggi", en: "Excellent source of organic wild vitamin intake" },
      { ms: "Sangat sesuai dijadikan pemanis semulajadi teh & herba", en: "Highly energetic, perfect for natural beverage sweetener" },
      { ms: "Membantu sistem pencernaan dan lawas perut", en: "Favors healthy, balanced digestive transit and health" }
    ]
  },
  p5: {
    origin: { ms: "Ladang Kelapa Pantai Kuantan, Pahang", en: "Kuantan Coastal Organic Coconut Farms, Pahang" },
    harvestMethod: { ms: "Perahan Sejuk Segara (Minyak Kelapa Dara)", en: "First Cold-Press Centrifugal Extraction" },
    moisture: "< 0.05% (Kadar Minyak Organik)",
    labTest: "VCO-MQA-2026-P5 (Standard ISO 9001)",
    benefits: [
      { ms: "Minyak Kelapa Dara tulen untuk tenaga diet sihat harian", en: "Premium energy fuel for metabolic support & diet regimes" },
      { ms: "Sangat bagus untuk mengekalkan kelembapan kulit & rambut", en: "Nourishes glowing skin barrier & soft lustrous hair" },
      { ms: "Membantu metabolisme badan & kesihatan kolesterol", en: "Supports healthy cholesterol and thyroid functionalities" }
    ]
  }
};

const MOCK_REVIEWS = [
  {
    name: "Mohd Nor Azri",
    rating: 5,
    date: "18 Jun 2026",
    comment: {
      ms: "Madu Tualang paling asli pernah saya rasa. Cukup kelat manis madu liar sebenar. QR code ujian makmal memang sahih. Penghantaran sekat 1 hari saja!",
      en: "This is the most genuine Tualang honey I've tasted. Has that real signature wild bite. Lab certificate checked out perfectly. 1-day delivery!"
    }
  },
  {
    name: "Fatin Liyana",
    rating: 5,
    date: "14 Jun 2026",
    comment: {
      ms: "Minyak kelapa dara wangi, tak rasa meloyakan. Madu merah jerantut sangat manis berkrim, anak-anak suka minum pagi dicampur susu hangat.",
      en: "The VCO smells sweet, not nauseating at all. The Jerantut royal red honey is beautifully sweet, children love taking it every morning."
    }
  },
  {
    name: "Tan Wei Chong",
    rating: 5,
    date: "04 Jun 2026",
    comment: {
      ms: "Trusted brand sourcing wild honey. Supporting Pahang tree climbers. Genuine lab stats are unmatched. Second purchase already recommended!",
      en: "Trusted brand sourcing wild honey. Supporting Pahang tree climbers. Genuine lab stats are unmatched. Second purchase already recommended!"
    }
  }
];

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ mode, onNavigate }) => {
  const { products, addToCart, referralCode, affiliates, language } = useAppState();
  
  // Shopping quantity steppers and notifications
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [justAddedMsg, setJustAddedMsg] = useState<{ [key: string]: boolean }>({});

  // Search & Filter state variables
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Honey' | 'Coconut Oil'>('All');
  const [sortBy, setSortBy] = useState<'popular' | 'priceAsc' | 'priceDesc'>('popular');

  // Interactive Carousel index
  const [activeBanner, setActiveBanner] = useState(0);

  // PRODUCT DETAIL SHEET PORTAL STATE
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sheetQty, setSheetQty] = useState(1);
  const [sheetActiveThumb, setSheetActiveThumb] = useState(0);
  const [sheetAdded, setSheetAdded] = useState(false);

  const openProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setSheetQty(1);
    setSheetActiveThumb(0);
    setSheetAdded(false);
  };

  const handleBuyNowFromSheet = (product: Product, quantity: number) => {
    addToCart(product.id, quantity);
    setSelectedProduct(null);
    if (onNavigate) {
      onNavigate('cart');
    }
  };

  const handleAddToCartFromSheet = (product: Product, quantity: number) => {
    addToCart(product.id, quantity);
    setSheetAdded(true);
    setTimeout(() => {
      setSheetAdded(false);
    }, 1800);
  };

  const getProductThumbnails = (productId: string, mainImage: string): string[] => {
    const foundProd = products.find(p => p.id === productId);
    if (foundProd?.images && foundProd.images.length > 0) {
      const otherImages = foundProd.images.filter(img => img !== mainImage);
      return [mainImage, ...otherImages].filter(Boolean);
    }
    if (productId.startsWith('p5') || productId.includes('coconut')) {
      return [
        mainImage,
        "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&q=80&w=400"
      ];
    }
    return [
      mainImage,
      "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400"
    ];
  };

  const bannerArticles = [
    {
      title_ms: "🍯 MADU TUALANG BULAN PERAYAAN",
      title_en: "🍯 FESTIVE SEASON TUALANG PROMO",
      desc_ms: "Beli mana-mana 2 botol Madu Tualang & Dapatkan Penghantaran PERCUMA ke seluruh Malaysia!",
      desc_en: "Buy any 2 Tualang honey items & score FREE Premium Shipping to anywhere in Malaysia!",
      tag_ms: "Jimat Hebat",
      tag_en: "Top Offer",
      bgGradient: "from-amber-600 to-red-600"
    },
    {
      title_ms: "💫 JADI RAKAN AFILIAT MADU PLUS",
      title_en: "💫 BECOME A CERTIFIED AFFILIATE",
      desc_ms: "Kongsi pautan promosi dan raih komisen lumayan sehingga 20% bagi setiap pembelian rakan!",
      desc_en: "Drop your sponsor code, activate dynamic cashbacks, & cash in up to 20% commission cuts!",
      tag_ms: "Komisen 20%",
      tag_en: "Earn 20%",
      bgGradient: "from-red-600 to-amber-700"
    }
  ];

  const activeAffiliate = referralCode
    ? affiliates.find(a => a.code.toUpperCase() === referralCode.toUpperCase().trim())
    : null;

  const handleQtyChange = (productId: string, delta: number, maxStock: number) => {
    const current = quantities[productId] || 1;
    const nextVal = Math.max(1, Math.min(maxStock, current + delta));
    setQuantities(prev => ({ ...prev, [productId]: nextVal }));
  };

  const handleAddToCart = (productId: string, maxStock: number) => {
    if (maxStock <= 0) return;
    const qty = quantities[productId] || 1;
    addToCart(productId, qty);
    
    setJustAddedMsg(prev => ({ ...prev, [productId]: true }));
    setTimeout(() => {
      setJustAddedMsg(prev => ({ ...prev, [productId]: false }));
    }, 1800);
  };

  // Filter & sort search records
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => {
        const transName = getProductTranslation(p.id, 'name', language, p.name).toLowerCase();
        const transDesc = getProductTranslation(p.id, 'description', language, p.description).toLowerCase();
        return transName.includes(q) || transDesc.includes(q) || p.category.toLowerCase().includes(q);
      });
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === (selectedCategory === 'Honey' ? 'Honey' : 'Coconut Oil'));
    }

    // Sort matching
    if (sortBy === 'priceAsc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'priceDesc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, searchQuery, selectedCategory, sortBy, language]);

  return (
    <div className="space-y-5 flex flex-col justify-start max-w-lg mx-auto pb-6">

      {/* RETAIL HEADS-UP SPONSOR INDICATION */}
      {activeAffiliate && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-orange-50 border border-orange-200/60 p-3 shadow-xs animate-fade-in text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-orange text-white text-xs">
              <Sparkles className="h-4 w-4 animate-pulse text-yellow-300" />
            </div>
            <div>
              <p className="text-[12px] font-extrabold text-slate-900">
                Sponsor: <span className="text-brand-orange">{activeAffiliate.name}</span>
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {language === 'ms' 
                  ? `Kod rujukan "${activeAffiliate.code}" diaktifkan - Penghantaran Premium Cepat!` 
                  : `Referral code "${activeAffiliate.code}" active - Fast Premium Delivery!`}
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded bg-green-100 text-green-800 text-[9px] font-black uppercase px-2 py-0.5">
            {translations.referralActiveBadge[language]}
          </span>
        </div>
      )}

      {/* ==================================== */}
      {/* 1. HOME TAB MODE                     */}
      {/* ==================================== */}
      {mode === 'home' && (
        <>
          {/* Shopee-style Swipeable Promo Carousel */}
          <div className="relative overflow-hidden rounded-xl shadow-xs border border-gray-100 text-left bg-slate-900 text-white">
            <div className={`p-5 min-h-[140px] bg-gradient-to-r ${bannerArticles[activeBanner].bgGradient} flex flex-col justify-between transition-all duration-300`}>
              <div className="space-y-1">
                <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-black uppercase text-white tracking-widest leading-none">
                  {language === 'ms' ? bannerArticles[activeBanner].tag_ms : bannerArticles[activeBanner].tag_en}
                </span>
                <h3 className="font-sans text-sm font-black tracking-tight leading-tight pt-1">
                  {language === 'ms' ? bannerArticles[activeBanner].title_ms : bannerArticles[activeBanner].title_en}
                </h3>
              </div>
              
              <p className="text-[11px] text-white/90 leading-tight">
                {language === 'ms' ? bannerArticles[activeBanner].desc_ms : bannerArticles[activeBanner].desc_en}
              </p>
            </div>
            
            {/* Carousel controller indicators */}
            <div className="absolute right-3 bottom-2.5 flex space-x-1.5 z-10">
              {bannerArticles.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveBanner(idx)}
                  className={`h-1.5 w-1.5 rounded-full transition-all cursor-pointer ${activeBanner === idx ? 'w-3.5 bg-yellow-400' : 'bg-white/45'}`}
                />
              ))}
            </div>
          </div>

          {/* Quick Informative Stamps Bar */}
          <div className="grid grid-cols-3 gap-2 py-1 justify-items-center select-none text-[10.5px]">
            <span className="flex items-center gap-1 font-bold text-gray-700">
              <Leaf className="h-3.5 w-3.5 text-green-600" /> {language === 'ms' ? 'Asli 100%' : '100% Pure'}
            </span>
            <span className="flex items-center gap-1 font-bold text-gray-700">
              🛡️ {language === 'ms' ? 'Ujian Makmal' : 'Lab Tested'}
            </span>
            <span className="flex items-center gap-1 font-bold text-gray-700">
              🤝 {language === 'ms' ? 'Bumiputera' : 'Local Sourced'}
            </span>
          </div>

          {/* Horizontal Category Quick Links */}
          <div className="space-y-2 text-left">
            <h4 className="font-sans text-xs font-black uppercase text-gray-400 tracking-wider">
              {language === 'ms' ? 'Kategori Utama' : 'Main Categories'}
            </h4>
            <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin select-none">
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  if (onNavigate) onNavigate('search');
                }}
                className="flex flex-col items-center gap-1 p-2 rounded-xl border border-gray-100 bg-white shadow-xs shrink-0 w-20 hover:border-orange-200 active:scale-95 transition-all text-center cursor-pointer"
              >
                <span className="text-xl">🛍️</span>
                <span className="text-[10px] font-black text-gray-800">{language === 'ms' ? 'Semua' : 'All Shop'}</span>
              </button>

              <button
                onClick={() => {
                  setSelectedCategory('Honey');
                  if (onNavigate) onNavigate('search');
                }}
                className="flex flex-col items-center gap-1 p-2 rounded-xl border border-gray-100 bg-white shadow-xs shrink-0 w-22 hover:border-orange-200 active:scale-95 transition-all text-center cursor-pointer"
              >
                <span className="text-xl">🍯</span>
                <span className="text-[10px] font-black text-gray-800">Madu Tualang</span>
              </button>

              <button
                onClick={() => {
                  setSelectedCategory('Coconut Oil');
                  if (onNavigate) onNavigate('search');
                }}
                className="flex flex-col items-center gap-1 p-2 rounded-xl border border-gray-100 bg-white shadow-xs shrink-0 w-22 hover:border-orange-200 active:scale-95 transition-all text-center cursor-pointer"
              >
                <span className="text-xl">🥥</span>
                <span className="text-[10px] font-black text-gray-800">{language === 'ms' ? 'Minyak Kelapa' : 'Coconut Oil'}</span>
              </button>
            </div>
          </div>

          {/* Golden Bumiputera Certification Campaign Info */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-1.5 text-left">
            <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-[12px]">
              <PackageCheck className="h-4.5 w-4.5 text-amber-600" />
              <span>Jaminan Kualiti Madu Plus Pahang</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-normal">
              Semua madu dituai secara liar dari pohon Tualang gergasi di hutan hujan Pahang. Diuji ketulenan tinggi untuk menjamin khasiat semula jadi terbaik kepada keluarga anda.
            </p>
          </div>

          {/* Become an Affiliate Orange Call-to-Action Card */}
          <div className="rounded-xl bg-gradient-to-tr from-orange-600 to-red-500 text-white p-4.5 shadow-md flex justify-between items-center gap-4 text-left">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-sans font-black text-sm tracking-tight text-white leading-none">
                <TrendingUp className="h-4 w-4 text-yellow-300" />
                <span>Jana Pendapatan 10% - 20%</span>
              </div>
              <p className="text-[10.5px] text-white/90 leading-tight">
                Daftar program afiliat/ejen percuma, kongsikan pautan anda & semak kemasukan untung!
              </p>
            </div>
            <button
              onClick={() => {
                if (onNavigate) onNavigate('account');
              }}
              className="shrink-0 bg-yellow-400 hover:bg-yellow-350 text-slate-900 font-black text-[11px] px-3.5 py-2 rounded-lg cursor-pointer transition-colors active:scale-95"
            >
              Layari Portal
            </button>
          </div>

          {/* TOP DEEPLY SELECTED/RECOMMENDED LISTING (Compact view of products) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
              <h3 className="font-sans text-xs font-black uppercase text-gray-400 tracking-wider">
                🔥 {language === 'ms' ? 'Produk Pilihan Shopee' : 'Hot Recommended'}
              </h3>
              <button
                onClick={() => {
                  if (onNavigate) onNavigate('search');
                }}
                className="text-[11px] font-black text-brand-orange hover:underline cursor-pointer"
              >
                {language === 'ms' ? 'Lihat Semua' : 'View All'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {products.slice(0, 2).map(product => {
                const isOut = product.stock <= 0;
                const isHoney = product.category === 'Honey';

                return (
                  <div
                    key={product.id}
                    className="flex flex-col justify-between overflow-hidden rounded-xl border border-gray-150/80 bg-white p-2.5 transition-all hover:border-orange-350 hover:shadow-md cursor-pointer text-left"
                    onClick={() => openProductDetails(product)}
                  >
                    <div className="space-y-2">
                      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-50 border border-gray-50">
                        <img
                          src={product.image}
                          alt={getProductTranslation(product.id, 'name', language, product.name)}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover object-center"
                        />
                        <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white tracking-wide">
                          {product.volume}
                        </span>
                        <span className="absolute top-1.5 right-1.5 rounded bg-[#EE4D2D]/95 px-1.5 py-0.5 text-[8.5px] font-extrabold text-white uppercase tracking-wider">
                          HOT SALE
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h5 className="font-sans text-[11.5px] font-bold text-slate-900 leading-snug line-clamp-2 h-8">
                          {getProductTranslation(product.id, 'name', language, product.name)}
                        </h5>
                        <p className="font-mono text-[10px] text-gray-400">{product.category}</p>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-gray-50 flex items-center justify-between">
                      <p className="text-[13px] font-black text-[#EE4D2D]">
                        RM {product.price.toFixed(2)}
                      </p>
                      <span className="text-[8.5px] font-mono text-gray-500 font-semibold bg-gray-100 px-1 rounded">
                        Stok: {product.stock}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ==================================== */}
      {/* 2. SEARCH TAB & FILTERS MODE         */}
      {/* ==================================== */}
      {mode === 'search' && (
        <>
          {/* SEARCH INPUT FIELD WITH CLEAR TRIGGER */}
          <div className="relative text-left flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={language === 'ms' ? 'Cari madu asli, minyak kelapa...' : 'Search honey, virgin coconut oil...'}
                className="w-full h-10 pl-9 pr-8 text-[12.5px] font-bold bg-white border border-gray-200 rounded-xl focus:border-brand-orange outline-none shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3.5 text-xs font-bold text-gray-400 hover:text-gray-900 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* ACTIVE CATEGORY PILL SELECTORS */}
          <div className="flex gap-2 justify-start scrollbar-none overflow-x-auto select-none py-0.5">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-black tracking-wide border cursor-pointer transition-all ${
                selectedCategory === 'All' 
                  ? 'bg-[#EE4D2D] text-white border-[#EE4D2D] shadow-xs' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {language === 'ms' ? 'Semua Produk' : 'All Categories'}
            </button>
            <button
              onClick={() => setSelectedCategory('Honey')}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-black tracking-wide border cursor-pointer transition-all ${
                selectedCategory === 'Honey' 
                  ? 'bg-[#EE4D2D] text-white border-[#EE4D2D] shadow-xs' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              Madu Tualang
            </button>
            <button
              onClick={() => setSelectedCategory('Coconut Oil')}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-black tracking-wide border cursor-pointer transition-all ${
                selectedCategory === 'Coconut Oil' 
                  ? 'bg-[#EE4D2D] text-white border-[#EE4D2D] shadow-xs' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              Minyak Kelapa (VCO)
            </button>
          </div>

          {/* SORT HEADERS BLOCK */}
          <div className="flex justify-between items-center text-left bg-white px-3 py-2 rounded-xl border border-gray-150 text-[11px] font-black select-none">
            <span className="text-gray-400 uppercase tracking-widest">{language === 'ms' ? 'Isih Jualan' : 'Sort Options'}</span>
            <div className="flex gap-3">
              <button 
                onClick={() => setSortBy('popular')}
                className={`cursor-pointer transition-colors ${sortBy === 'popular' ? 'text-brand-orange' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {language === 'ms' ? 'Hots' : 'Popular'}
              </button>
              <button 
                onClick={() => setSortBy('priceAsc')}
                className={`cursor-pointer transition-colors ${sortBy === 'priceAsc' ? 'text-brand-orange' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Harga: ↑
              </button>
              <button 
                onClick={() => setSortBy('priceDesc')}
                className={`cursor-pointer transition-colors ${sortBy === 'priceDesc' ? 'text-brand-orange' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Harga: ↓
              </button>
            </div>
          </div>

          {/* MATCHING RESULTS COUNTER */}
          <div className="text-left">
            <span className="font-mono text-[10px] text-gray-400">
              {filteredProducts.length} {language === 'ms' ? 'reka produk ditemui' : 'items match your filters'}
            </span>
          </div>

          {/* 2-COLUMN RESPONSIVE MOBILE PRODUCT GRID */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center space-y-2">
              <span className="text-3xl block">🔍</span>
              <p className="text-xs font-bold text-gray-900">{language === 'ms' ? 'Tiada produk dijumpai' : 'No matching products found'}</p>
              <p className="text-[10.5px] text-gray-500 leading-snug">{language === 'ms' ? 'Cuba ubah suai kata kunci carian atau kategori penapis anda.' : 'Please adjust your search keyword or active categories filters'}</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="mt-3 px-4 py-1.5 bg-[#EE4D2D] hover:bg-[#FF6B4A] text-white text-[10px] font-black rounded-lg cursor-pointer"
              >
                {language === 'ms' ? 'Set Semula Penapis' : 'Reset Filters'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              {filteredProducts.map(product => {
                const qty = quantities[product.id] || 1;
                const isOut = product.stock <= 0;
                const isAdded = justAddedMsg[product.id];

                return (
                  <div
                    key={product.id}
                    id={`product-card-${product.id}`}
                    className="group flex flex-col justify-between overflow-hidden rounded-xl border border-gray-200 bg-white p-2.5 transition-all text-left shadow-xs hover:border-[#EE4D2D]/60 hover:shadow"
                  >
                    <div 
                      className="space-y-2 cursor-pointer group-hover:opacity-90 active:opacity-75 transition-opacity"
                      onClick={() => openProductDetails(product)}
                    >
                      {/* Image block in 1:1 format */}
                      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-50 border border-gray-100">
                        <img
                          src={product.image}
                          alt={getProductTranslation(product.id, 'name', language, product.name)}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover object-center transition-transform hover:scale-102"
                        />
                        <span className="absolute bottom-1.5 left-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[8.5px] font-extrabold text-white tracking-wide">
                          {product.volume}
                        </span>
                        
                        {/* Free Shipping or Premium quality Label badge */}
                        <span className="absolute top-1.5 left-1.5 rounded bg-emerald-600 px-1 py-0.2 text-[7px] font-black text-white uppercase tracking-widest">
                          {language === 'ms' ? 'Penghantaran Percuma' : 'Free Shipping'}
                        </span>

                        {isHoney ? (
                          <span className="absolute top-1.5 right-1.5 rounded bg-amber-500/90 text-white text-[7.5px] font-extrabold px-1 py-0.2 uppercase">
                            RAW WILD
                          </span>
                        ) : (
                          <span className="absolute top-1.5 right-1.5 rounded bg-teal-600/90 text-white text-[7.5px] font-extrabold px-1 py-0.2 uppercase">
                            COLD PRESS
                          </span>
                        )}
                      </div>

                      {/* Product details */}
                      <div className="space-y-1">
                        <h4 className="font-sans text-[11.5px] font-black text-slate-900 leading-snug line-clamp-2 h-8 hover:text-brand-orange transition-colors">
                          {getProductTranslation(product.id, 'name', language, product.name)}
                        </h4>
                        
                        {/* Star Rating and Units Sold Indicator */}
                        <div className="flex items-center gap-1">
                          <div className="flex text-amber-500">
                            <Star className="h-2.5 w-2.5 fill-current" />
                          </div>
                          <span className="text-[9px] font-extrabold text-slate-800">4.8</span>
                          <span className="font-mono text-[8.5px] text-slate-400">({language === 'ms' ? '120+ Terjual' : '120+ Sold'})</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2.5 pt-2 border-t border-gray-50">
                      {/* Price & Stock Display */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[13px] font-black text-[#EE4D2D] leading-none">
                            RM {product.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          {isOut ? (
                            <span className="text-[9px] font-bold text-red-500 block leading-none">{translations.outOfStock[language]}</span>
                          ) : (
                            <span className={`text-[9px] font-bold block leading-none ${product.stock < 10 ? 'text-amber-500' : 'text-green-600'}`}>
                              Stok: {product.stock}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity stepper & Action CTA */}
                      {!isOut ? (
                        <div className="space-y-1.5">
                          {/* Mini Stepper selector */}
                          <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-slate-100 h-8">
                            <button
                              onClick={() => handleQtyChange(product.id, -1, product.stock)}
                              className="flex h-5 w-5 items-center justify-center rounded bg-white text-slate-700 hover:bg-slate-100 font-extrabold text-xs cursor-pointer border border-slate-200"
                              disabled={qty <= 1}
                            >
                              -
                            </button>
                            <span className="text-[10px] font-black text-slate-900 text-center">{qty}</span>
                            <button
                              onClick={() => handleQtyChange(product.id, 1, product.stock)}
                              className="flex h-5 w-5 items-center justify-center rounded bg-white text-slate-700 hover:bg-slate-100 font-extrabold text-xs cursor-pointer border border-slate-200"
                              disabled={qty >= product.stock}
                            >
                              +
                            </button>
                          </div>

                          {/* Trigger Add element */}
                          <button
                            onClick={() => handleAddToCart(product.id, product.stock)}
                            className={`w-full flex h-8 items-center justify-center gap-1 rounded-lg text-[9.5px] font-black tracking-wide cursor-pointer transition-all ${
                              isAdded 
                                ? 'bg-green-600 text-white' 
                                : 'bg-[#EE4D2D] hover:bg-[#FF6B4A] text-white shadow-xs'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="h-3 w-3" /> {language === 'ms' ? 'Ditambah!' : 'Added Successfully!'}
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="h-3 w-3" /> {language === 'ms' ? 'Masuk Troli' : 'Add to Cart'}
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled
                          className="w-full h-8 rounded-lg text-[9px] font-bold bg-slate-100 text-slate-400 cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          <AlertCircle className="h-3.5 w-3.5" /> {translations.soldOutBtn[language]}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ==================================== */}
      {/* 3. FULL PRODUCT DETAIL SHEET         */}
      {/* ==================================== */}
      <AnimatePresence>
        {selectedProduct && (() => {
          const spec = PRODUCT_SPECS[selectedProduct.id];
          const isOut = selectedProduct.stock <= 0;
          const thumbs = getProductThumbnails(selectedProduct.id, selectedProduct.image);
          
          return (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs px-4">
              {/* Tap backdrop to close */}
              <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedProduct(null)} />
              
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="relative w-full max-w-md bg-white rounded-t-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col select-none border-t border-gray-100"
              >
                {/* Header title & close action */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-1.5 text-left">
                    <span className="text-[10px] font-mono bg-[#EE4D2D]/10 text-[#EE4D2D] font-extrabold px-2 py-0.5 rounded uppercase">
                      {selectedProduct.category === 'Honey' ? 'Madu Tualang' : 'VCO Coconut Oil'}
                    </span>
                    <span className="text-[9px] font-mono text-gray-400">
                      ID: {selectedProduct.id.toUpperCase()}
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Scrollable details wrapper */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin text-left">
                  
                  {/* Photo Carousel Area */}
                  <div className="space-y-2.5">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                      <img 
                        src={thumbs[sheetActiveThumb]} 
                        alt={selectedProduct.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover object-center transition-all duration-350"
                      />
                      <span className="absolute bottom-2 right-2 rounded bg-black/75 px-2 py-0.5 text-[9px] font-black text-white tracking-widest uppercase">
                        {selectedProduct.volume}
                      </span>
                      
                      {/* Premium Standard Tag overlay */}
                      <span className="absolute top-2 left-2 rounded bg-amber-500 text-white font-mono text-[8px] font-black uppercase px-2 py-0.5 tracking-wider flex items-center gap-1 shadow-sm">
                        <Sparkles className="h-2.5 w-2.5 text-yellow-250 animate-pulse" />
                        <span>PREMIUM SELECTION</span>
                      </span>
                    </div>

                    {/* Miniature thumbnail carousel selectors */}
                    <div className="flex gap-2 justify-center">
                      {thumbs.map((thumbUrl, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSheetActiveThumb(idx)}
                          className={`h-11 w-11 rounded-lg overflow-hidden border-2 transition-all cursor-pointer bg-slate-50 ${
                            sheetActiveThumb === idx ? 'border-[#EE4D2D] opacity-100 ring-2 ring-[#EE4D2D]/10' : 'border-gray-150 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={thumbUrl} alt="prev" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Core Product identity info */}
                  <div className="space-y-1">
                    <h3 className="font-sans text-sm font-black text-slate-900 leading-snug">
                      {getProductTranslation(selectedProduct.id, 'name', language, selectedProduct.name)}
                    </h3>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-black text-[#EE4D2D]">
                        RM {selectedProduct.price.toFixed(2)}
                      </p>
                      <span className="text-[10px] text-gray-400 font-medium line-through">
                        RM {(selectedProduct.price * 1.25).toFixed(2)}
                      </span>
                      <span className="text-[8.5px] font-mono bg-red-100 text-red-700 font-extrabold px-1.5 rounded uppercase leading-none py-0.5">
                        -20% OFF
                      </span>
                    </div>
                    
                    {/* Star ratings and verified purchasers counter */}
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex items-center text-amber-400">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                      <span className="text-[11px] font-black text-slate-800">4.9</span>
                      <span className="text-gray-300">|</span>
                      <span className="text-[10.5px] text-gray-500 font-medium">98% {language === 'ms' ? 'Pembeli Puas Hati' : 'Satisfied Buyers'}</span>
                    </div>
                  </div>

                  {/* High quality specification table & Origin details */}
                  {spec && (
                    <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 space-y-2">
                      <p className="text-[10px] font-black text-slate-400 tracking-wider uppercase border-b border-slate-100 pb-1.5">
                        {language === 'ms' ? 'SPESIFIKASI PRODUK' : 'PRODUCT SPECIFICATIONS'}
                      </p>
                      <div className="grid grid-cols-2 gap-y-2 text-[11px]">
                        <div>
                          <span className="text-gray-400 font-medium">{language === 'ms' ? 'Asal Usul' : 'Origin Sourced'}</span>
                          <p className="font-sans font-extrabold text-slate-900">{spec.origin[language]}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 font-medium">{language === 'ms' ? 'Kaedah Tuai' : 'Harvest Method'}</span>
                          <p className="font-sans font-extrabold text-slate-900">{spec.harvestMethod[language]}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 font-medium">{language === 'ms' ? 'Tahap Kelembapan' : 'Moisture Limit'}</span>
                          <p className="font-mono font-extrabold text-[#EE4D2D]">{spec.moisture}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 font-medium">{language === 'ms' ? 'Kod Lab Kelulusan' : 'Lab Test Approved'}</span>
                          <p className="font-mono font-bold text-slate-900 flex items-center gap-0.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span className="text-[10px] truncate">{spec.labTest}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Guaranteed organic benefits checklist */}
                  {spec && (
                    <div className="space-y-2 text-left">
                      <p className="text-[10px] font-black text-slate-400 tracking-wider uppercase">
                        ⭐ {language === 'ms' ? 'KHASIAT & MANFAAT UTAMA' : 'KEY HEALTH BENEFITS'}
                      </p>
                      <ul className="space-y-1.5 text-[11px] leading-relaxed">
                        {spec.benefits.map((b, bIdx) => (
                          <li key={bIdx} className="flex gap-2 items-start text-slate-700">
                            <span className="text-emerald-700 font-mono mt-0.5">✔</span>
                            <span className="font-medium">{b[language]}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Sourced with standard write-up */}
                  <div className="space-y-1 bg-amber-50/30 p-3 rounded-lg border border-amber-100/50">
                    <p className="text-[10.5px] font-extrabold text-amber-900 flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                      <span>{language === 'ms' ? 'Penerangan Khasiat' : 'Therapeutic Description'}</span>
                    </p>
                    <p className="text-[10.5px] text-slate-600 leading-snug">
                      {getProductTranslation(selectedProduct.id, 'description', language, selectedProduct.description)}
                    </p>
                  </div>

                  {/* Verified Customer reviews section */}
                  <div className="space-y-3.5 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-slate-400 tracking-wider uppercase">
                        💬 {language === 'ms' ? 'ULASAN PEMBELI (VERIFIED)' : 'VERIFIED REVIEWS'}
                      </p>
                      <span className="text-[9px] bg-slate-100 text-slate-600 font-mono font-extrabold px-1.5 rounded uppercase">HPLC Certificate</span>
                    </div>

                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                      {MOCK_REVIEWS.map((rev, revIdx) => (
                        <div key={revIdx} className="p-2.5 rounded-lg border border-gray-100 bg-white/50 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <div className="flex gap-1 items-center">
                              <span className="font-extrabold text-slate-900">{rev.name}</span>
                              <span className="text-[8px] bg-emerald-50 text-emerald-800 font-black px-1 rounded uppercase">Verified</span>
                            </div>
                            <span className="font-mono text-gray-400 text-[9px]">{rev.date}</span>
                          </div>
                          
                          <div className="flex text-amber-400">
                            {[1,2,3,4,5].slice(0, rev.rating).map(xs => (
                              <Star key={xs} className="h-2.5 w-2.5 fill-current" />
                            ))}
                          </div>

                          <p className="text-[10.5px] text-slate-600 italic leading-snug">
                            "{rev.comment[language]}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Footer buy controller block */}
                <div className="bg-slate-50 border-t border-gray-100 p-4 space-y-3">
                  
                  {/* Top: Row with Quantity Stepper and Stock notification */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      {translations.qtyLabel[language]}
                    </span>
                    
                    {!isOut ? (
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-slate-400 font-semibold">
                          {language === 'ms' ? `Stok: ${selectedProduct.stock} unit` : `Stock: ${selectedProduct.stock} units`}
                        </span>
                        
                        <div className="flex items-center justify-between bg-white p-1.5 rounded-lg border border-gray-200 h-9 w-28">
                          <button
                            onClick={() => setSheetQty(q => Math.max(1, q - 1))}
                            className="flex h-6 w-6 items-center justify-center rounded bg-slate-50 text-slate-700 hover:bg-slate-100 font-black text-sm cursor-pointer border border-gray-150"
                            disabled={sheetQty <= 1}
                          >
                            -
                          </button>
                          <span className="text-xs font-black text-slate-900 text-center">{sheetQty}</span>
                          <button
                            onClick={() => setSheetQty(q => Math.min(selectedProduct.stock, q + 1))}
                            className="flex h-6 w-6 items-center justify-center rounded bg-slate-50 text-slate-700 hover:bg-slate-100 font-black text-sm cursor-pointer border border-gray-150"
                            disabled={sheetQty >= selectedProduct.stock}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10.5px] text-red-500 font-bold">{translations.outOfStock[language]}</span>
                    )}
                  </div>

                  {/* Feedback Msg */}
                  {sheetAdded && (
                    <div className="rounded-lg bg-green-50 border border-green-200/50 p-2 text-center text-green-800 text-[11px] font-bold animate-fade-in uppercase tracking-wider">
                      👍 {language === 'ms' ? 'Berjaya ditambah ke troli!' : 'Added to cart successfully!'}
                    </div>
                  )}

                  {/* Bottom Checkout & Add Cart CTAs */}
                  <div className="grid grid-cols-2 gap-3">
                    {!isOut ? (
                      <>
                        <button
                          onClick={() => handleAddToCartFromSheet(selectedProduct, sheetQty)}
                          className="h-11 border border-[#EE4D2D] text-[#EE4D2D] hover:bg-orange-50 font-sans font-black text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors uppercase tracking-wider"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          <span>{language === 'ms' ? 'Masuk Troli' : 'Add to Cart'}</span>
                        </button>
                        
                        <button
                          onClick={() => handleBuyNowFromSheet(selectedProduct, sheetQty)}
                          className="h-11 bg-[#EE4D2D] hover:bg-[#FF6B4A] text-white font-sans font-black text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-500/10 uppercase tracking-wider active:scale-95"
                        >
                          <span>{language === 'ms' ? 'Beli Sekarang' : 'Buy Now'}</span>
                        </button>
                      </>
                    ) : (
                      <button
                        disabled
                        className="col-span-2 h-11 bg-slate-100 text-slate-400 font-sans font-bold text-xs rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        <AlertCircle className="h-4.5 w-4.5" />
                        <span>{translations.soldOutBtn[language]}</span>
                      </button>
                    )}
                  </div>

                </div>

              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
};

const isHoney = (productId: string): boolean => {
  return productId.startsWith('p1') || productId.startsWith('p2') || productId.includes('honey');
};
