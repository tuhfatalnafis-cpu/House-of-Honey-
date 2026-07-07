import React, { useState, useMemo } from 'react';
import { useAppState } from '../context/AppContext';
import { getProductTranslation } from '../lib/translations';
import { 
  Package, 
  Layers, 
  Activity, 
  AlertTriangle, 
  Building, 
  Plus, 
  Edit, 
  Copy, 
  Trash, 
  CheckCircle, 
  RefreshCw, 
  Warehouse, 
  FileText, 
  Tag, 
  BarChart2, 
  ArrowRightLeft, 
  Check, 
  X, 
  Sliders, 
  Filter, 
  Search, 
  Info, 
  ArrowUpDown, 
  TrendingUp,
  FileSpreadsheet,
  Boxes,
  Briefcase,
  AlertCircle,
  Truck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Product, InventoryItem, StockMovement, StockAlert, ProductSupplier, ProductCategory, StockMovementType } from '../types';

export const InventoryManager: React.FC = () => {
  const {
    products,
    branches,
    inventory,
    stockMovements,
    stockAlerts,
    pricingHistory,
    suppliers,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    recordStockMovement,
    bulkStockChange,
    bulkPricesChange,
    bulkStatusChange,
    bulkDeleteProducts,
    setSuppliers,
    setCategories,
    setStockAlerts,
    language,
    currentUserAccount
  } = useAppState();

  // Internal Sub-tabs for the Inventory Dashboard
  const [internalTab, setInternalTab] = useState<'overview' | 'catalog' | 'warehouses' | 'movements' | 'alerts' | 'suppliers' | 'bulk'>('overview');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form Modals states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  
  // Clone duplication states
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [productToDuplicate, setProductToDuplicate] = useState<Product | null>(null);
  const [duplicateName, setDuplicateName] = useState('');
  const [duplicateSku, setDuplicateSku] = useState('');
  const [copyFlags, setCopyFlags] = useState({
    images: true,
    desc: true,
    price: true,
    specs: true,
    stock: false
  });

  // Custom confirmation modal states for safe deletion
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Supplier state CRUD
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [selectedSupplierForEdit, setSelectedSupplierForEdit] = useState<ProductSupplier | null>(null);
  const [supplierForm, setSupplierForm] = useState<Partial<ProductSupplier>>({
    supplierName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    paymentTerms: 'COD',
    minOrderQuantity: 10,
    leadTimeDays: 7,
    isActive: true
  });

  // Stock movement manual lodgement state
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [movementForm, setMovementForm] = useState({
    productId: '',
    warehouseId: 'b1',
    movementType: 'stock_in' as StockMovementType,
    quantity: 10,
    reason: 'Restock Shipment Received',
    referenceNumber: '',
    notes: '',
    fromWarehouseId: '',
    toWarehouseId: ''
  });

  // Bulk action operations state
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkPriceType, setBulkPriceType] = useState<'fixed' | 'percentage'>('fixed');
  const [bulkPriceAmount, setBulkPriceAmount] = useState(10);
  const [bulkPriceReason, setBulkPriceReason] = useState('Promo Update');
  const [bulkStatusToApply, setBulkStatusToApply] = useState<'active' | 'inactive'>('active');
  const [bulkStockQty, setBulkStockQty] = useState(50);
  const [bulkStockWarehouseId, setBulkStockWarehouseId] = useState('b1');
  const [bulkStockReason, setBulkStockReason] = useState('Bulk Warehouse Deployment');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Add / Edit Product form state
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    category: 'Honey',
    price: 120,
    costPrice: 60,
    description: '',
    longDescription: '',
    stock: 0,
    image: '',
    volume: '500g',
    sku: '',
    weight: 500,
    dimensions: '10 x 10 x 15 cm',
    barcode: '',
    status: 'draft',
    isHalalCertified: true,
    halalCertNumber: 'JAKIM/(S)/(22.00)/492/2/1 042-01/2021',
    isBumiputera: true,
    healthWarning: 'Not recommended for children under 1 year old.'
  });

  const [newImageLink, setNewImageLink] = useState('');

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files: File[] = Array.from(e.target.files);
    
    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProductForm(prev => {
          const currentImages = prev.images || [];
          if (currentImages.includes(result)) return prev;
          const updatedImages = [...currentImages, result];
          // If no primary image is set, make this new image the primary one!
          const primaryImage = prev.image ? prev.image : result;
          return {
            ...prev,
            images: updatedImages,
            image: primaryImage
          };
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageLink = () => {
    if (!newImageLink.trim()) return;
    setProductForm(prev => {
      const currentImages = prev.images || [];
      if (currentImages.includes(newImageLink)) return prev;
      const updatedImages = [...currentImages, newImageLink];
      const primaryImage = prev.image ? prev.image : newImageLink;
      return {
        ...prev,
        images: updatedImages,
        image: primaryImage
      };
    });
    setNewImageLink('');
  };

  const handleRemoveFormImage = (urlToRemove: string) => {
    setProductForm(prev => {
      const currentImages = prev.images || [];
      const updatedImages = currentImages.filter(img => img !== urlToRemove);
      
      // If we removed the primary image, select the next available one as primary!
      let newPrimary = prev.image;
      if (prev.image === urlToRemove) {
        newPrimary = updatedImages[0] || '';
      }
      
      return {
        ...prev,
        images: updatedImages,
        image: newPrimary
      };
    });
  };

  const handleSetPrimaryImage = (url: string) => {
    setProductForm(prev => ({
      ...prev,
      image: url
    }));
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    const totalSkus = products.length;
    const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
    const lowStockAlerts = inventory.filter(i => i.quantityOnHand <= i.reorderLevel).length;
    
    // Estimate stock value
    const totalStockValueRM = products.reduce((acc, p) => {
      const parentStock = p.stock;
      return acc + (parentStock * p.price);
    }, 0);

    const totalCostValueRM = products.reduce((acc, p) => {
      const cost = p.costPrice || (p.price * 0.5);
      return acc + (p.stock * cost);
    }, 0);

    return {
      totalSkus,
      totalStock,
      lowStockAlerts,
      totalStockValueRM,
      totalCostValueRM,
      estimatedProfitRM: totalStockValueRM - totalCostValueRM
    };
  }, [products, inventory]);

  const chartData = useMemo(() => {
    return products.map(p => {
      const translatedName = getProductTranslation(p.id, 'name', language, p.name);
      const nameShort = translatedName.split('-')[0].trim();
      
      const kajangStock = inventory.find(i => i.productId === p.id && i.warehouseId === 'b1')?.quantityOnHand || 0;
      const klangStock = inventory.find(i => i.productId === p.id && i.warehouseId === 'b2')?.quantityOnHand || 0;
      const penangStock = inventory.find(i => i.productId === p.id && i.warehouseId === 'b3')?.quantityOnHand || 0;

      return {
        name: nameShort,
        'Pahang HQ': kajangStock,
        'Klang Valley': klangStock,
        'Penang Branch': penangStock,
        'Total stock': p.stock
      };
    });
  }, [products, inventory, language]);

  const pieChartData = useMemo(() => {
    const counts = products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + p.stock;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [products]);

  const categoryColors = ['#EE4D2D', '#2D9CDB', '#27AE60', '#F2994A'];

  // Filter products catalog
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, searchTerm, selectedCategory, statusFilter]);

  // Handle product edit launch
  const handleEditProductClick = (product: Product) => {
    setSelectedProductForEdit(product);
    setProductForm({
      ...product,
      sku: product.sku || `MAD-TU-${Math.floor(Math.random()*1000)}`,
      status: product.status || 'draft',
      costPrice: product.costPrice || product.price * 0.5,
      weight: product.weight || 500,
      dimensions: product.dimensions || '10 x 10 x 15 cm',
      barcode: product.barcode || `BAR-${Math.floor(Math.random()*100000)}`,
      longDescription: product.longDescription || product.description,
      isHalalCertified: product.isHalalCertified ?? true,
      halalCertNumber: product.halalCertNumber || 'JAKIM/(S)/(22.00)/492/2/1 042-01/2021',
      isBumiputera: product.isBumiputera ?? true,
      healthWarning: product.healthWarning || 'Not recommended for children under 1 year old.',
      images: product.images || [product.image].filter(Boolean)
    });
    setShowAddEditModal(true);
  };

  const handleAddNewProductClick = () => {
    setSelectedProductForEdit(null);
    setProductForm({
      name: '',
      category: 'Honey',
      price: 120,
      costPrice: 65,
      description: '',
      longDescription: '',
      stock: 0,
      image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400',
      images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400'],
      volume: '500g',
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      weight: 500,
      dimensions: '10 x 10 x 15 cm',
      barcode: `BAR-${Math.floor(Math.random()*1000000)}`,
      status: 'draft',
      isHalalCertified: true,
      halalCertNumber: 'JAKIM/(S)/(22.00)/492/2/1 042-01/2021',
      isBumiputera: true,
      healthWarning: 'Not recommended for children under 1 year old.'
    });
    setShowAddEditModal(true);
  };

  const saveProductForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.sku) {
      showNotice('Product Name and SKU are required.');
      return;
    }

    if (selectedProductForEdit) {
      updateProduct(selectedProductForEdit.id, productForm);
    } else {
      const generatedId = `p-${Date.now()}`;
      addProduct({
        id: generatedId,
        name: productForm.name!,
        category: productForm.category as 'Honey' | 'Coconut Oil',
        price: Number(productForm.price),
        description: productForm.description || '',
        stock: Number(productForm.stock || 0),
        image: productForm.image || 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=400',
        images: productForm.images || [productForm.image].filter(Boolean) as string[],
        volume: productForm.volume || '500g',
        
        sku: productForm.sku,
        costPrice: Number(productForm.costPrice),
        longDescription: productForm.longDescription,
        weight: Number(productForm.weight),
        dimensions: productForm.dimensions,
        barcode: productForm.barcode,
        status: (productForm.status || 'draft') as any,
        isHalalCertified: productForm.isHalalCertified,
        halalCertNumber: productForm.halalCertNumber,
        isBumiputera: productForm.isBumiputera,
        healthWarning: productForm.healthWarning
      });
    }

    setShowAddEditModal(false);
    showNotice(selectedProductForEdit ? 'Product successfully saved!' : 'Product added successfully!');
  };

  // Duplicate process triggers
  const handleLaunchDuplicate = (product: Product) => {
    setProductToDuplicate(product);
    setDuplicateName(`${product.name} (Copy)`);
    setDuplicateSku(`${product.sku || 'SKU'}-COPY`);
    setShowDuplicateModal(true);
  };

  const executeDuplication = () => {
    if (!productToDuplicate || !duplicateSku) return;
    duplicateProduct(productToDuplicate.id, duplicateName, duplicateSku, copyFlags);
    setShowDuplicateModal(false);
    showNotice('SKU Duplicated successfully as Draft status.');
  };

  // Supplier save edit triggers
  const handleAddNewSupplierClick = () => {
    setSelectedSupplierForEdit(null);
    setSupplierForm({
      supplierName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      paymentTerms: 'COD',
      minOrderQuantity: 10,
      leadTimeDays: 7,
      isActive: true
    });
    setShowSupplierModal(true);
  };

  const handleEditSupplierClick = (sup: ProductSupplier) => {
    setSelectedSupplierForEdit(sup);
    setSupplierForm(sup);
    setShowSupplierModal(true);
  };

  const saveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.supplierName) return;

    if (selectedSupplierForEdit) {
      setSuppliers(prev => prev.map(s => s.id === selectedSupplierForEdit.id ? { ...s, ...supplierForm } as ProductSupplier : s));
    } else {
      const newSup: ProductSupplier = {
        id: `sup-${Date.now()}`,
        supplierName: supplierForm.supplierName!,
        contactPerson: supplierForm.contactPerson || '',
        email: supplierForm.email || '',
        phone: supplierForm.phone || '',
        address: supplierForm.address || '',
        paymentTerms: supplierForm.paymentTerms || 'COD',
        minOrderQuantity: Number(supplierForm.minOrderQuantity || 10),
        leadTimeDays: Number(supplierForm.leadTimeDays || 7),
        isActive: supplierForm.isActive ?? true
      };
      setSuppliers(prev => [...prev, newSup]);
    }

    setShowSupplierModal(false);
    showNotice('Supplier directory updated!');
  };

  // Stock movement triggers
  const lodgeStockMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementForm.productId) {
      showNotice('Please select a product first.');
      return;
    }

    // record movement (multiplies quantity by -1 if out elements)
    const sign = ['stock_out', 'transfer_out', 'damaged', 'expired', 'sale', 'write_off'].includes(movementForm.movementType) ? -1 : 1;
    const finalQty = Math.abs(movementForm.quantity) * sign;

    recordStockMovement(
      movementForm.productId,
      movementForm.warehouseId,
      movementForm.movementType,
      finalQty,
      movementForm.reason,
      movementForm.referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
      movementForm.notes,
      movementForm.movementType === 'transfer_out' ? movementForm.warehouseId : undefined,
      movementForm.movementType === 'transfer_in' ? movementForm.warehouseId : undefined
    );

    setShowMovementForm(false);
    showNotice('Stock movement lodged successfully!');
  };

  // Bulk actions executions
  const handleBulkPriceAlter = () => {
    if (selectedProductIds.length === 0) {
      showNotice('Please select at least one SKU.');
      return;
    }
    bulkPricesChange(selectedProductIds, bulkPriceType, bulkPriceAmount, bulkPriceReason);
    setSelectedProductIds([]);
    showNotice(`Bulk RM pricing adjusted for ${selectedProductIds.length} SKUs!`);
  };

  const handleBulkStatusAlter = () => {
    if (selectedProductIds.length === 0) {
      showNotice('Please select at least one SKU.');
      return;
    }
    bulkStatusChange(selectedProductIds, bulkStatusToApply);
    setSelectedProductIds([]);
    showNotice(`Status updated to "${bulkStatusToApply}" for ${selectedProductIds.length} items.`);
  };

  const handleBulkStockAddition = () => {
    if (selectedProductIds.length === 0) {
      showNotice('Please select at least one SKU.');
      return;
    }
    const changesArray = selectedProductIds.map(id => ({ productId: id, quantity: bulkStockQty }));
    bulkStockChange(changesArray, bulkStockWarehouseId, 'stock_in', bulkStockReason, `BULK-M-ADD`);
    setSelectedProductIds([]);
    showNotice(`Successfully added ${bulkStockQty} units to ${selectedProductIds.length} items at targeted Branch.`);
  };

  const handleBulkDelete = () => {
    if (selectedProductIds.length === 0) {
      showNotice('Please select at least one SKU.');
      return;
    }
    setShowBulkDeleteConfirm(true);
  };

  const executeBulkDelete = () => {
    bulkDeleteProducts(selectedProductIds);
    const count = selectedProductIds.length;
    setSelectedProductIds([]);
    setShowBulkDeleteConfirm(false);
    showNotice(`Permanently shredded ${count} SKUs from layout.`);
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllProducts = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };

  const resolveAlert = (id: string) => {
    setStockAlerts(prev => prev.map(a => a.id === id ? { ...a, isResolved: true, resolvedAt: new Date().toISOString() } : a));
    showNotice('Alert resolved and marked settled!');
  };

  const showNotice = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg('');
    }, 4000);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Toast Notice */}
      {feedbackMsg && (
        <div className="fixed bottom-5 right-5 bg-slate-900 border border-slate-800 text-emerald-400 p-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 font-semibold text-xs animate-bounce">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Corporate Multi-Warehouse Header with controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-3xl border border-gray-150">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-tomato-500 text-amber-600" />
            <h2 className="text-sm font-black uppercase text-gray-900 tracking-wider">Shopee-Style Advanced Inventory Control</h2>
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">Control SKUs, check multi-regional warehouse states, lodge batch transactions, and execute bulk automation overrides synchronously.</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowMovementForm(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            <span>Lodge Movement</span>
          </button>
          <button
            onClick={handleAddNewProductClick}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4.5 py-2 bg-amber-500 hover:bg-amber-600 font-bold text-xs text-white rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add New SKU</span>
          </button>
        </div>
      </div>

      {/* Shopee Style Status Row KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-gray-150 flex items-center gap-4">
          <div className="h-10 w-10 bg-orange-50 text-[#EE4D2D] rounded-xl flex items-center justify-center shrink-0">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[9px] font-bold text-gray-400 uppercase">Registered SKUs</span>
            <span className="block text-base font-black font-mono text-gray-900 mt-0.5">{kpis.totalSkus} Products</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-150 flex items-center gap-4">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Warehouse className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[9px] font-bold text-gray-400 uppercase">Total Stock (HQ+Hubs)</span>
            <span className="block text-base font-black font-mono text-emerald-700 mt-0.5">{kpis.totalStock} Units</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-150 flex items-center gap-4">
          <div className="h-10 w-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[9px] font-bold text-gray-400 uppercase">Low Stock Triggers</span>
            <span className="block text-base font-black font-mono text-red-600 mt-0.5">{kpis.lowStockAlerts} Warning slots</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-150 flex items-center gap-4">
          <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[9px] font-bold text-gray-400 uppercase">Stock Valuation</span>
            <span className="block text-base font-black font-mono text-blue-700 mt-0.5">RM {kpis.totalStockValueRM.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Shopee-style Admin Navigation Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-gray-50/50 p-1 rounded-2xl">
        <button
          onClick={() => setInternalTab('overview')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer ${internalTab === 'overview' ? 'bg-[#EE4D2D] text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <BarChart2 className="h-3.5 w-3.5" />
          <span>Dashboard & Charts</span>
        </button>

        <button
          onClick={() => setInternalTab('catalog')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer ${internalTab === 'catalog' ? 'bg-[#EE4D2D] text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <Tag className="h-3.5 w-3.5" />
          <span>All SKUs Catalog ({products.length})</span>
        </button>

        <button
          onClick={() => setInternalTab('warehouses')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer ${internalTab === 'warehouses' ? 'bg-[#EE4D2D] text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <Building className="h-3.5 w-3.5" />
          <span>Multi-Warehouse Levels</span>
        </button>

        <button
          onClick={() => setInternalTab('movements')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer ${internalTab === 'movements' ? 'bg-[#EE4D2D] text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>Movements Register ({stockMovements.length})</span>
        </button>

        <button
          onClick={() => setInternalTab('alerts')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer ${internalTab === 'alerts' ? 'bg-[#EE4D2D] text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Batch & Expiry alerts ({stockAlerts.filter(a => !a.isResolved).length})</span>
        </button>

        <button
          onClick={() => setInternalTab('suppliers')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer ${internalTab === 'suppliers' ? 'bg-[#EE4D2D] text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <Truck className="h-3.5 w-3.5" />
          <span>Suppliers Registry ({suppliers.length})</span>
        </button>

        <button
          onClick={() => setInternalTab('bulk')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer ${internalTab === 'bulk' ? 'bg-[#EE4D2D] text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Bulk Tools Toolbar</span>
        </button>
      </div>

      {/* 1. OVERVIEW GRAPH TAB */}
      {internalTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-gray-150">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Multi-Warehouse Station Distribution</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Real-time comparison of stock quantities grouped by regional Malaysian branches.</p>
              </div>
            </div>

            <div className="h-72 w-full font-mono text-[11px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} bottles`]} />
                  <Legend />
                  <Bar dataKey="Pahang HQ" fill="#EE4D2D" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Klang Valley" fill="#2D9CDB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Penang Branch" fill="#27AE60" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Side stats breakdown */}
          <div className="bg-white p-5 rounded-3xl border border-gray-150 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Stock Category Distribution</h3>
              <p className="text-[10px] text-gray-400 mt-0.5 mb-4">Percentage allocation of product reserves in inventory.</p>
              
              <div className="h-40 w-full flex items-center justify-center font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} bottles`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 mt-4 text-xs font-sans">
                {pieChartData.map((entry, idx) => (
                  <div key={entry.name} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColors[idx % categoryColors.length] }} />
                      <span className="font-medium text-gray-700">{entry.name}</span>
                    </div>
                    <span className="font-mono font-bold text-gray-900">{entry.value} bottles</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 text-xs">
              <div className="flex items-center gap-1 text-[#EE4D2D] font-bold">
                <Info className="h-3.5 w-3.5" />
                <span>Financial Forecast: RM {kpis.estimatedProfitRM.toLocaleString()} profit margin.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ALL SKU CATALOG GRID */}
      {internalTab === 'catalog' && (
        <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-sm">
          {/* Filter Bar */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search SKU code, name, barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border rounded-xl focus:border-[#EE4D2D] bg-white text-gray-800"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Category filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="p-2 text-xs bg-white border border-gray-200 rounded-xl"
              >
                <option value="all">All Categories</option>
                <option value="Honey">Honey</option>
                <option value="Coconut Oil">Coconut Oil</option>
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 text-xs bg-white border border-gray-200 rounded-xl"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>

              <button
                onClick={() => { setSelectedProductIds([]); toggleSelectAllProducts(); }}
                className="p-2 border rounded-xl hover:bg-gray-100 text-xs text-gray-600 font-bold"
              >
                Toggle All
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 font-bold text-gray-400 text-[10px] tracking-wider uppercase">
                  <th className="px-5 py-3.5 w-10">Select</th>
                  <th className="px-5 py-3.5">Image & Name</th>
                  <th className="px-5 py-3.5">SKU Code</th>
                  <th className="px-5 py-3.5">Barcode</th>
                  <th className="px-5 py-3.5 text-right">Cost Price</th>
                  <th className="px-5 py-3.5 text-right">Selling Price</th>
                  <th className="px-5 py-3.5 text-right">Total Stock</th>
                  <th className="px-5 py-3.5">Certificates</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map(p => {
                  const isLow = p.stock < 35;
                  const isChecked = selectedProductIds.includes(p.id);
                  return (
                    <tr key={p.id} className={`hover:bg-gray-50/50 transition-colors ${isChecked ? 'bg-orange-50/30' : ''}`}>
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectProduct(p.id)}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-[#EE4D2D] focus:ring-[#EE4D2D]"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="h-10 w-10 object-cover rounded-xl border border-gray-100 shrink-0"
                          />
                          <div>
                            <span className="font-extrabold text-gray-850 block text-xs tracking-tight line-clamp-1 leading-snug">
                              {getProductTranslation(p.id, 'name', language, p.name)}
                            </span>
                            <span className="text-[10px] text-gray-400 block tracking-tight">{p.volume} • {p.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-gray-800">{p.sku || 'N/A'}</td>
                      <td className="px-5 py-4 font-mono text-gray-400">{p.barcode || 'N/A'}</td>
                      <td className="px-5 py-4 text-right font-mono text-slate-500">RM {p.costPrice ? p.costPrice.toFixed(2) : (p.price * 0.55).toFixed(2)}</td>
                      <td className="px-5 py-4 text-right font-mono font-extrabold text-gray-900">RM {p.price.toFixed(2)}</td>
                      <td className="px-5 py-4 text-right font-mono">
                        <span className={`font-black ${isLow ? 'text-red-600' : 'text-emerald-700'}`}>
                          {p.stock}
                        </span>
                        <span className="text-[10px] text-gray-400 block">units</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1 flex-wrap">
                          {p.isHalalCertified && (
                            <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[8px] font-black uppercase tracking-tight py-0.2 px-2.5 rounded-full">HQ HALAL</span>
                          )}
                          {p.isBumiputera && (
                            <span className="bg-blue-50 border border-blue-100 text-blue-700 text-[8px] font-black uppercase tracking-tight py-0.2 px-2.5 rounded-full">BUMIPUTERA</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {p.status === 'active' && (
                          <span className="inline-flex bg-emerald-55 text-emerald-805 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">ACTIVE</span>
                        )}
                        {p.status === 'inactive' && (
                          <span className="inline-flex bg-slate-100 text-slate-600 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">INACTIVE</span>
                        )}
                        {(p.status === 'draft' || !p.status) && (
                          <span className="inline-flex bg-amber-50 text-amber-700 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-amber-100">DRAFT</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex gap-1.5 items-center justify-center">
                          <button
                            onClick={() => handleEditProductClick(p)}
                            title="Edit SKU Details"
                            className="p-1 px-2 border rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleLaunchDuplicate(p)}
                            title="Duplicate SKU Draft"
                            className="p-1 px-2 border rounded-lg text-gray-600 hover:text-amber-600 hover:bg-slate-50 transition-colors"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setProductToDelete(p);
                              setShowDeleteConfirm(true);
                            }}
                            title="Delete SKU"
                            className="p-1 px-2 border rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. MULTI-WAREHOUSE STOCK GRID */}
      {internalTab === 'warehouses' && (
        <div className="space-y-6">
          {/* Warehouse location Selector */}
          <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl w-fit">
            <button
              onClick={() => setSelectedWarehouseId('all')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${selectedWarehouseId === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              All Warehouses
            </button>
            {branches.map(branch => (
              <button
                key={branch.id}
                onClick={() => setSelectedWarehouseId(branch.id)}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${selectedWarehouseId === branch.id ? 'bg-white text-slate-800 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                🏢 {branch.name.split('(')[0]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map(branch => {
              if (selectedWarehouseId !== 'all' && selectedWarehouseId !== branch.id) return null;

              // Filter inventory items matching this warehouse
              const branchItems = inventory.filter(i => i.warehouseId === branch.id);
              
              return (
                <div key={branch.id} className="bg-white border border-gray-150 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between">
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <div>
                      <h4 className="font-extrabold text-xs text-gray-800 uppercase tracking-wide">{branch.name}</h4>
                      <p className="text-[9px] text-gray-400 font-medium">State: {branch.state} • Manager: {branch.manager}</p>
                    </div>
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-mono font-bold py-0.5 px-2.5 rounded-full">
                      {branchItems.reduce((sum, item) => sum + item.quantityOnHand, 0)} units
                    </span>
                  </div>

                  <div className="divide-y divide-gray-100 py-1">
                    {branchItems.map(item => {
                      const correlatedProd = products.find(p => p.id === item.productId);
                      if (!correlatedProd) return null;

                      const isCriticalLow = item.quantityOnHand < item.reorderLevel;

                      return (
                        <div key={item.id} className="p-4.5 flex justify-between items-center hover:bg-slate-50/40">
                          <div className="flex items-center gap-3">
                            <img
                              src={correlatedProd.image}
                              alt={correlatedProd.name}
                              className="h-8 w-8 object-cover rounded-lg shrink-0"
                            />
                            <div>
                              <span className="font-bold text-gray-800 text-xs block leading-tight">
                                {getProductTranslation(correlatedProd.id, 'name', language, correlatedProd.name).split('-')[0].trim()}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                SKU: {correlatedProd.sku || 'N/A'} • Batch: {item.batchNumber || 'N/A'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`block font-mono font-black text-xs ${isCriticalLow ? 'text-red-500 font-bold' : 'text-slate-800'}`}>
                              {item.quantityOnHand} units
                            </span>
                            {isCriticalLow ? (
                              <span className="text-[8px] font-bold text-red-500 uppercase tracking-tight block">Below Minimum</span>
                            ) : (
                              <span className="text-[8px] font-bold text-emerald-600 block">Stock Secure</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-1.5">
                    <button
                      onClick={() => {
                        setMovementForm(prev => ({ ...prev, warehouseId: branch.id, movementType: 'stock_in' }));
                        setShowMovementForm(true);
                      }}
                      className="px-2.5 py-1.5 border hover:bg-gray-100 text-[10px] font-bold text-slate-700 rounded-lg cursor-pointer"
                    >
                      + Stock In
                    </button>
                    <button
                      onClick={() => {
                        setMovementForm(prev => ({ ...prev, warehouseId: branch.id, movementType: 'transfer_out' }));
                        setShowMovementForm(true);
                      }}
                      className="px-2.5 py-1.5 border hover:bg-gray-100 text-[10px] font-bold text-slate-700 rounded-lg cursor-pointer"
                    >
                      Branch Transfer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. MOVEMENTS HISTORIC REGISTER REGISTER */}
      {internalTab === 'movements' && (
        <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Enterprise Inventory Actions Ledger</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Comprehensive audit trail of stock inputs, transfers, sales, and write-offs.</p>
            </div>
            <button
              onClick={() => setShowMovementForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EE4D2D] text-white font-bold text-xs rounded-xl hover:bg-orange-600 shadow-md transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Record Stock Action</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 font-bold text-gray-400 text-[10px] uppercase">
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Product Name</th>
                  <th className="px-5 py-3">Branch Location</th>
                  <th className="px-5 py-3">Action Type</th>
                  <th className="px-5 py-3 text-right">Qty</th>
                  <th className="px-5 py-3">Reason / Ref No</th>
                  <th className="px-5 py-3">Lodged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {stockMovements.map(mv => {
                  const correlatedP = products.find(p => p.id === mv.productId);
                  const correlatedW = branches.find(w => w.id === mv.warehouseId);
                  
                  const isPositive = mv.quantity > 0;
                  
                  let badgeColors = 'bg-slate-100 text-slate-700';
                  if (mv.movementType === 'stock_in') badgeColors = 'bg-emerald-50 text-emerald-800 border border-emerald-100';
                  if (mv.movementType === 'stock_out') badgeColors = 'bg-red-50 text-red-800 border border-red-100';
                  if (mv.movementType.includes('transfer')) badgeColors = 'bg-blue-50 text-blue-800 border border-blue-100';
                  if (mv.movementType === 'damaged' || mv.movementType === 'write_off') badgeColors = 'bg-amber-50 text-amber-800 border border-amber-100';

                  return (
                    <tr key={mv.id} className="hover:bg-slate-50/40">
                      <td className="px-5 py-3.5 font-mono text-gray-400 text-[10px]">{new Date(mv.createdAt).toLocaleString()}</td>
                      <td className="px-5 py-3.5 font-bold text-gray-800">
                        {correlatedP ? getProductTranslation(correlatedP.id, 'name', language, correlatedP.name).split('-')[0].trim() : 'Unknown Product'}
                        <span className="block text-[10px] font-mono font-normal text-gray-400">{correlatedP?.sku || 'N/A'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 font-semibold">{correlatedW ? correlatedW.name.split('(')[0] : 'General Hub'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block text-[9px] font-black uppercase py-0.5 px-2.5 rounded-full ${badgeColors}`}>
                          {mv.movementType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className={`px-5 py-3.5 text-right font-mono font-black text-xs ${isPositive ? 'text-emerald-700' : 'text-red-650'}`}>
                        {isPositive ? '+' : ''}{mv.quantity}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        <span className="font-semibold block">{mv.reason}</span>
                        <span className="text-[10px] font-mono text-slate-400">Ref: {mv.referenceNumber || 'N/A'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-[10px]">{mv.createdBy === 'acc-admin' ? 'SYSTEM ADMIN' : mv.createdBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. LIVE ALERTS & EXPIRY */}
      {internalTab === 'alerts' && (
        <div className="space-y-6">
          <div className="flex gap-4 items-center bg-red-50 border border-red-150 p-4.5 rounded-2xl text-red-805">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <h5 className="font-black text-xs uppercase">Minimum Stock threshold violation flagged!</h5>
              <p className="text-[10px] leading-relaxed mt-0.5">The regional inventory levels listed below have slipped past configured margins. High-commission affiliates may suffer checkout errors if products drop to zero in their localized regions.</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Batches Expiry & Live Alerts Log</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Control product freshness and physical inventory shelf warnings.</p>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {stockAlerts.map(alert => {
                const correlatedP = products.find(p => p.id === alert.productId);
                const correlatedW = branches.find(w => w.id === alert.warehouseId);
                const linkedInventorySlot = inventory.find(i => i.productId === alert.productId && i.warehouseId === alert.warehouseId);

                return (
                  <div key={alert.id} className={`p-4.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${alert.isResolved ? 'opacity-55' : ''}`}>
                    <div className="flex gap-3 items-start">
                      <div className={`p-2 rounded-xl shrink-0 ${alert.isResolved ? 'bg-slate-100 text-slate-400' : 'bg-red-50 text-red-650'}`}>
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-xs text-gray-800">
                            {correlatedP ? getProductTranslation(correlatedP.id, 'name', language, correlatedP.name) : 'Unknown Product'}
                          </h4>
                          <span className="bg-red-50 text-red-700 text-[8px] font-bold uppercase py-0.2 px-2 rounded">
                            {alert.alertType.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">Warehouse: {correlatedW?.name || 'All Warehouses'}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                          Current on-hand quantity: <span className="font-bold text-red-650">{alert.currentQuantity} units</span> (Ref trigger limit: {alert.thresholdValue} units)
                        </p>
                        {linkedInventorySlot?.expiryDate && (
                          <p className="text-[10px] text-amber-600 font-bold mt-1">Batch Expiry Target: {linkedInventorySlot.expiryDate}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!alert.isResolved ? (
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase rounded-xl shadow cursor-pointer transition-all"
                        >
                          Mark Settled & Restocked
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" />
                          <span>Resolved at {new Date(alert.resolvedAt!).toLocaleDateString()}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. SUPPLIERS REGISTRY */}
      {internalTab === 'suppliers' && (
        <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Sourcing Partners & Suppliers Registry</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Manage contacts, Orang Asli harvesters unions, or bulk packaging processors.</p>
            </div>
            <button
              onClick={handleAddNewSupplierClick}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 shadow"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Supplier Link</span>
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {suppliers.map(sup => (
              <div key={sup.id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-gray-50/30">
                <div className="space-y-1 md:max-w-xl">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-tight">{sup.supplierName}</h4>
                    {sup.isActive ? (
                      <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase py-0.2 px-2 rounded-full">Primary</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 text-[8px] font-black uppercase py-0.2 px-2 rounded-full">Suspended</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-600 font-semibold">Contact Person: {sup.contactPerson || 'N/A'} • {sup.phone} • {sup.email}</p>
                  <p className="text-[10px] text-gray-400">{sup.address}</p>
                  <p className="text-[9px] text-[#EE4D2D] font-bold">MOQ Limit: {sup.minOrderQuantity} packs • Sourcing Lead time: {sup.leadTimeDays} days • Terms: {sup.paymentTerms}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditSupplierClick(sup)}
                    className="p-1 px-3 border text-xs text-gray-600 font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Edit Contacts
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. BULK TOOLS TOOLBAR */}
      {internalTab === 'bulk' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-150 p-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-1">SKU Multi-Selection Controller Toolbar</h3>
            <p className="text-[10px] text-gray-400 mb-5">Select products in the "All SKUs Catalog" tab first, then return here to run batch commands across indices.</p>

            {/* Selected feedback count */}
            <div className="bg-slate-50 p-4 rounded-2xl border mb-6 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-800">Selected Products Cache:</span>
              <span className="bg-[#EE4D2D] text-white text-xs font-black px-3.5 py-1 rounded-full">
                {selectedProductIds.length} Products Chosen
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Box 1: Prices */}
              <div className="p-4 rounded-2xl border border-gray-200 space-y-3.5">
                <h4 className="text-xs font-extrabold text-blue-700 uppercase">1. Batch Price Adjustment</h4>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Calculation Type</label>
                  <select
                    value={bulkPriceType}
                    onChange={(e) => setBulkPriceType(e.target.value as any)}
                    className="w-full text-xs p-2 bg-white border border-gray-200 rounded-xl"
                  >
                    <option value="fixed">Fixed Rate Increase/Decrease (MYR)</option>
                    <option value="percentage">Percentage Markup/Markdown (%)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Difference Value (+/-)</label>
                  <input
                    type="number"
                    value={bulkPriceAmount}
                    onChange={(e) => setBulkPriceAmount(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Audit Log Reason</label>
                  <input
                    type="text"
                    value={bulkPriceReason}
                    onChange={(e) => setBulkPriceReason(e.target.value)}
                    className="w-full text-xs p-2 border rounded-xl"
                  />
                </div>
                <button
                  onClick={handleBulkPriceAlter}
                  className="w-full p-2 bg-blue-700 font-bold text-xs text-white uppercase rounded-xl hover:bg-blue-800 tracking-wider shadow cursor-pointer transition-all"
                >
                  Adjust Prices
                </button>
              </div>

              {/* Box 2: Stock Allocation */}
              <div className="p-4 rounded-2xl border border-gray-200 space-y-3.5">
                <h4 className="text-xs font-extrabold text-emerald-600 uppercase">2. Batch Stock Injection</h4>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Target Regional Warehouse</label>
                  <select
                    value={bulkStockWarehouseId}
                    onChange={(e) => setBulkStockWarehouseId(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-gray-200 rounded-xl"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name.split('(')[0]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Arrival Quantity per SKU</label>
                  <input
                    type="number"
                    value={bulkStockQty}
                    onChange={(e) => setBulkStockQty(parseInt(e.target.value) || 0)}
                    className="w-full text-xs p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Delivery Reference</label>
                  <input
                    type="text"
                    value={bulkStockReason}
                    onChange={(e) => setBulkStockReason(e.target.value)}
                    className="w-full text-xs p-2 border rounded-xl"
                  />
                </div>
                <button
                  onClick={handleBulkStockAddition}
                  className="w-full p-2 bg-emerald-600 font-bold text-xs text-white uppercase rounded-xl hover:bg-emerald-700 tracking-wider shadow cursor-pointer transition-all"
                >
                  Inject Stock
                </button>
              </div>

              {/* Box 3: Status Actions */}
              <div className="p-4 rounded-2xl border border-gray-200 space-y-3.5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase mb-3 text-amber-600">3. Status & Destruction</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Status State to apply</label>
                      <select
                        value={bulkStatusToApply}
                        onChange={(e) => setBulkStatusToApply(e.target.value as any)}
                        className="w-full text-xs p-2 bg-white border border-gray-200 rounded-xl"
                      >
                        <option value="active">Active (Visible to customers)</option>
                        <option value="inactive">Inactive (Hidden)</option>
                      </select>
                    </div>
                    <button
                      onClick={handleBulkStatusAlter}
                      className="w-full p-2 bg-slate-800 font-bold text-xs text-white uppercase rounded-xl hover:bg-slate-900 tracking-wider cursor-pointer"
                    >
                      Update Visibility Status
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={handleBulkDelete}
                    className="w-full p-2.5 bg-red-650 font-bold text-xs text-white uppercase rounded-xl hover:bg-red-700 shadow-md tracking-wider cursor-pointer"
                  >
                    Permanently Delete Selected
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL 1: ADD EDITS PRODUCT */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto font-sans text-gray-800">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-sm uppercase text-gray-900">
                {selectedProductForEdit ? '📝 Modify Product parameters' : '📦 Spawn New SKU'}
              </h3>
              <button onClick={() => setShowAddEditModal(false)} className="text-gray-400 hover:text-gray-900">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={saveProductForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Product Name (Fallback)</label>
                  <input
                    type="text"
                    required
                    value={productForm.name || ''}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2 border rounded-xl"
                    placeholder="e.g. Madu Tualang Genting"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">SKU Identification Code (Required Unique)</label>
                  <input
                    type="text"
                    required
                    value={productForm.sku || ''}
                    onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full p-2 border rounded-xl font-mono text-gray-900"
                    placeholder="e.g. MAD-TU-GENT"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Category Type</label>
                  <select
                    value={productForm.category || 'Honey'}
                    onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full p-2 bg-white border border-gray-200 rounded-xl"
                  >
                    <option value="Honey">Honey</option>
                    <option value="Coconut Oil">Coconut Oil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Status Code</label>
                  <select
                    value={productForm.status || 'draft'}
                    onChange={(e) => setProductForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full p-2 bg-white border border-gray-200 rounded-xl"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Selling Value (RM)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price || ''}
                    onChange={(e) => setProductForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-2 border rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cost / Sourcing Price (RM)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.costPrice || ''}
                    onChange={(e) => setProductForm(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-2 border rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Volume Units</label>
                  <input
                    type="text"
                    value={productForm.volume || '500g'}
                    onChange={(e) => setProductForm(prev => ({ ...prev, volume: e.target.value }))}
                    className="w-full p-2 border rounded-xl"
                    placeholder="e.g. 500g, 250ml"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Net Weight (grams)</label>
                  <input
                    type="number"
                    value={productForm.weight || 500}
                    onChange={(e) => setProductForm(prev => ({ ...prev, weight: parseInt(e.target.value) || 0 }))}
                    className="w-full p-2 border rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Dimensions (Length x Width x Height)</label>
                  <input
                    type="text"
                    value={productForm.dimensions || ''}
                    onChange={(e) => setProductForm(prev => ({ ...prev, dimensions: e.target.value }))}
                    className="w-full p-2 border rounded-xl"
                    placeholder="e.g. 10 x 10 x 15 cm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">UPC Barcode Code</label>
                  <input
                    type="text"
                    value={productForm.barcode || ''}
                    onChange={(e) => setProductForm(prev => ({ ...prev, barcode: e.target.value }))}
                    className="w-full p-2 border rounded-xl font-mono"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5 bg-slate-50 p-3 rounded-2xl border">
                  <span className="block text-[10px] font-black text-slate-800 uppercase">Malaysia Sourcing Compliance</span>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 font-bold text-gray-700">
                      <input
                        type="checkbox"
                        checked={productForm.isHalalCertified ?? true}
                        onChange={(e) => setProductForm(prev => ({ ...prev, isHalalCertified: e.target.checked }))}
                        className="h-4 w-4 text-[#EE4D2D]"
                      />
                      <span>Is Halal Certified (JAKIM)</span>
                    </label>

                    <label className="flex items-center gap-2 font-bold text-gray-700">
                      <input
                        type="checkbox"
                        checked={productForm.isBumiputera ?? true}
                        onChange={(e) => setProductForm(prev => ({ ...prev, isBumiputera: e.target.checked }))}
                        className="h-4 w-4 text-[#EE4D2D]"
                      />
                      <span>Bumiputera Harvesters</span>
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-3 bg-gray-50 border border-gray-200 p-4 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <span className="block text-[10px] font-extrabold text-gray-700 uppercase tracking-wider">
                      Product Media Gallery (Multiple Posters & Images)
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 bg-white border px-2 py-0.5 rounded-full">
                      {(productForm.images || []).length} added
                    </span>
                  </div>

                  {/* Image Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(productForm.images && productForm.images.length > 0) ? (
                      productForm.images.map((imgUrl, i) => {
                        const isPrimary = productForm.image === imgUrl;
                        return (
                          <div 
                            key={i} 
                            className={`group relative aspect-square bg-white rounded-xl border-2 transition-all overflow-hidden flex flex-col justify-between p-1.5 ${
                              isPrimary ? 'border-[#EE4D2D] shadow-sm ring-1 ring-[#EE4D2D]/20' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {/* Image Preview */}
                            <div className="w-full h-[76%] rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                              <img 
                                src={imgUrl} 
                                alt={`Poster ${i}`} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>

                            {/* Set Primary Button / Indicator */}
                            <div className="flex gap-1 items-center justify-between mt-1">
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryImage(imgUrl)}
                                className={`flex-1 text-[9px] font-extrabold py-1 px-1.5 rounded-md transition-colors text-center ${
                                  isPrimary 
                                    ? 'bg-[#EE4D2D]/10 text-[#EE4D2D]' 
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                }`}
                              >
                                {isPrimary ? '★ Primary' : 'Set First'}
                              </button>

                              {/* Remove Button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveFormImage(imgUrl)}
                                className="p-1 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                title="Remove Image"
                              >
                                <Trash className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-2 sm:col-span-4 py-8 flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-xl bg-white text-gray-400">
                        <AlertTriangle className="h-5 w-5 text-amber-500 mb-1" />
                        <span className="text-[10px] font-bold">No images attached. Please upload or link at least one.</span>
                      </div>
                    )}
                  </div>

                  {/* Adding options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-dashed">
                    {/* Option A: File Uploader */}
                    <div className="flex flex-col justify-center">
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">
                        Option A: Upload local poster files
                      </label>
                      <label className="flex items-center justify-center gap-2 border border-dashed border-gray-300 hover:border-[#EE4D2D] hover:bg-white text-[#EE4D2D] rounded-xl p-3 cursor-pointer transition-all bg-white shadow-sm font-bold text-center">
                        <Plus className="h-4 w-4" />
                        <span>Select Files</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleLocalImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Option B: URL Linker */}
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">
                        Option B: Paste high-res image URL
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="e.g. https://images.unsplash.com/..."
                          value={newImageLink}
                          onChange={(e) => setNewImageLink(e.target.value)}
                          className="flex-1 p-2 border rounded-xl font-mono text-[10px] bg-white text-gray-800 focus:ring-1 focus:ring-[#EE4D2D] focus:border-[#EE4D2D] outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddImageLink}
                          className="px-3 py-2 bg-slate-850 hover:bg-slate-900 border border-slate-700 text-white font-extrabold rounded-xl transition-colors uppercase text-[9px]"
                        >
                          Add Link
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Simple Description</label>
                  <input
                    type="text"
                    value={productForm.description || ''}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Long Editorial Story (supports markdown)</label>
                  <textarea
                    rows={4}
                    value={productForm.longDescription || ''}
                    onChange={(e) => setProductForm(prev => ({ ...prev, longDescription: e.target.value }))}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-gray-100 text-gray-600 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#EE4D2D] hover:bg-orange-600 text-white font-bold rounded-xl shadow cursor-pointer"
                >
                  Save Product parameters
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORM MODAL 2: DUPLUCTION CLONE FLAGS */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-sm uppercase text-gray-900 flex items-center gap-1">
                <Copy className="h-4 w-4 text-emerald-600" />
                <span>Save as Copy (Duplicate SKU)</span>
              </h3>
              <button onClick={() => setShowDuplicateModal(false)} className="text-gray-400 hover:text-gray-900">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">New Spurred Name</label>
                <input
                  type="text"
                  value={duplicateName}
                  onChange={(e) => setDuplicateName(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">New Segment SKU Code</label>
                <input
                  type="text"
                  value={duplicateSku}
                  onChange={(e) => setDuplicateSku(e.target.value)}
                  className="w-full p-2 border rounded-xl font-mono"
                />
              </div>

              <div className="bg-slate-50 p-4 border rounded-2xl space-y-2">
                <span className="block text-[10px] font-black text-slate-700 uppercase mb-1">Parameters to Clone:</span>
                
                <label className="flex items-center gap-2.5 font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={copyFlags.images}
                    onChange={(e) => setCopyFlags(prev => ({ ...prev, images: e.target.checked }))}
                    className="h-4 w-4 text-[#EE4D2D]"
                  />
                  <span>Clone product image vectors</span>
                </label>

                <label className="flex items-center gap-2.5 font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={copyFlags.desc}
                    onChange={(e) => setCopyFlags(prev => ({ ...prev, desc: e.target.checked }))}
                    className="h-4 w-4 text-[#EE4D2D]"
                  />
                  <span>Clone descriptions & long-story text</span>
                </label>

                <label className="flex items-center gap-2.5 font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={copyFlags.price}
                    onChange={(e) => setCopyFlags(prev => ({ ...prev, price: e.target.checked }))}
                    className="h-4 w-4 text-[#EE4D2D]"
                  />
                  <span>Clone pricing & cost matrices</span>
                </label>

                <label className="flex items-center gap-2.5 font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={copyFlags.specs}
                    onChange={(e) => setCopyFlags(prev => ({ ...prev, specs: e.target.checked }))}
                    className="h-4 w-4 text-[#EE4D2D]"
                  />
                  <span>Clone physical specifications (Weight/Dim)</span>
                </label>

                <label className="flex items-center gap-2.5 font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={copyFlags.stock}
                    onChange={(e) => setCopyFlags(prev => ({ ...prev, stock: e.target.checked }))}
                    className="h-4 w-4 text-[#EE4D2D]"
                  />
                  <span>Clone existing stock counts across hubs</span>
                </label>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2 text-xs">
                <button
                  onClick={() => setShowDuplicateModal(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-slate-50 text-gray-500 font-bold"
                >
                  Discard
                </button>
                <button
                  onClick={executeDuplication}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow"
                >
                  Duplicate Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL 3: MANUAL MOVEMENT LODGEMENT */}
      {showMovementForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-sm uppercase text-gray-900">
                📥 Manual Stock Action Lodgement
              </h3>
              <button onClick={() => setShowMovementForm(false)} className="text-gray-400 hover:text-gray-900">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={lodgeStockMovement} className="space-y-4 text-xs font-sans text-gray-700">
              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Target Product SKU</label>
                <select
                  required
                  value={movementForm.productId}
                  onChange={(e) => setMovementForm(prev => ({ ...prev, productId: e.target.value }))}
                  className="w-full p-2.5 bg-white border rounded-xl text-gray-950 font-bold"
                >
                  <option value="">Select Targeted SKU...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>[{p.sku || 'SKU'}] {getProductTranslation(p.id, 'name', language, p.name).split('-')[0].trim()}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Regional Branch Hub</label>
                  <select
                    value={movementForm.warehouseId}
                    onChange={(e) => setMovementForm(prev => ({ ...prev, warehouseId: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name.split('(')[0]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Transaction Action Type</label>
                  <select
                    value={movementForm.movementType}
                    onChange={(e) => setMovementForm(prev => ({ ...prev, movementType: e.target.value as any }))}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-bold"
                  >
                    <option value="stock_in">📦 Stock In (Purchase Arrival)</option>
                    <option value="stock_out">📦 Stock Out (Manual dispatch)</option>
                    <option value="transfer_in">🚚 Transfer In</option>
                    <option value="transfer_out">🚚 Transfer Out (Redistribute)</option>
                    <option value="damaged">⚠️ Log as Damaged (Write-off)</option>
                    <option value="expired">⌛ Log as Expired (Wedge)</option>
                    <option value="adjustment">🛠️ General Adjustment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Units Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={movementForm.quantity}
                    onChange={(e) => setMovementForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="w-full p-2 border rounded-xl font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Reference PO / Dispatch Code</label>
                  <input
                    type="text"
                    placeholder="e.g. PO-5923"
                    value={movementForm.referenceNumber}
                    onChange={(e) => setMovementForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                    className="w-full p-2 border rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1 font-bold">Brief action justification (Reason)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sourced fresh batch Orang Asli Pekan arrivals"
                  value={movementForm.reason}
                  onChange={(e) => setMovementForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Audit commentary notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Additional delivery comments..."
                  value={movementForm.notes}
                  onChange={(e) => setMovementForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMovementForm(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-gray-100 text-gray-600 font-bold cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#EE4D2D] hover:bg-orange-600 text-white font-bold rounded-xl shadow cursor-pointer uppercase tracking-wider"
                >
                  Audit Lodge Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORM MODAL 4: SUPPLIER DETAILS */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-sm uppercase text-gray-900">
                {selectedSupplierForEdit ? '📝 Edit Supplier contacts' : '🚚 Register Supplier connection'}
              </h3>
              <button onClick={() => setShowSupplierModal(false)} className="text-gray-400 hover:text-gray-900">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={saveSupplier} className="space-y-4 text-xs font-sans text-gray-700">
              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Supplier Company Name</label>
                <input
                  type="text"
                  required
                  value={supplierForm.supplierName || ''}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, supplierName: e.target.value }))}
                  className="w-full p-2 border rounded-xl font-bold text-gray-900"
                  placeholder="e.g. Lipis Gold Rainforest..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Contact Person name</label>
                  <input
                    type="text"
                    value={supplierForm.contactPerson || ''}
                    onChange={(e) => setSupplierForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Sourcing Terms</label>
                  <select
                    value={supplierForm.paymentTerms || 'COD'}
                    onChange={(e) => setSupplierForm(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    className="w-full p-2 bg-white border border-gray-200 rounded-xl"
                  >
                    <option value="COD">COD (Cash on Delivery)</option>
                    <option value="Net 30">Net 30 invoice credit</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Prepaid">Prepaid partial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={supplierForm.email || ''}
                    onChange={(e) => setSupplierForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Mobile Contact No</label>
                  <input
                    type="text"
                    value={supplierForm.phone || ''}
                    onChange={(e) => setSupplierForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-2 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1 font-bold">Minimum Order Qty (MOQ)</label>
                  <input
                    type="number"
                    value={supplierForm.minOrderQuantity || 10}
                    onChange={(e) => setSupplierForm(prev => ({ ...prev, minOrderQuantity: parseInt(e.target.value) || 10 }))}
                    className="w-full p-2 border rounded-xl font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Lead Time (Days)</label>
                  <input
                    type="number"
                    value={supplierForm.leadTimeDays || 7}
                    onChange={(e) => setSupplierForm(prev => ({ ...prev, leadTimeDays: parseInt(e.target.value) || 7 }))}
                    className="w-full p-2 border rounded-xl font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Harvester HQ Address</label>
                <input
                  type="text"
                  value={supplierForm.address || ''}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <label className="flex items-center gap-2 font-bold text-gray-700 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={supplierForm.isActive ?? true}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-[#EE4D2D]"
                />
                <span>Active Harvester Status</span>
              </label>

              <div className="pt-3 border-t flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 border rounded-xl hover:bg-gray-100 text-gray-600 font-bold cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-slate-900 border hover:bg-slate-800 text-white font-bold rounded-xl shadow cursor-pointer uppercase"
                >
                  Save Partner supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL: SINGLE SKU DELETE */}
      {showDeleteConfirm && productToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-sm uppercase text-red-600 flex items-center gap-1.5">
                <AlertTriangle className="h-4.5 w-4.5 text-red-600 animate-pulse" />
                <span>Delete SKU Registry</span>
              </h3>
              <button 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setProductToDelete(null);
                }} 
                className="text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-gray-600 leading-relaxed">
                Are you absolutely sure you want to permanently delete the following SKU from your central catalog? This action is <strong className="text-red-600">irreversible</strong> and will clear all regional stock levels.
              </p>

              {/* Product Info Card */}
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-150 p-3 rounded-2xl">
                <img 
                  src={productToDelete.image} 
                  alt={productToDelete.name} 
                  className="h-12 w-12 object-cover rounded-xl border border-gray-200 bg-white"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <span className="block font-black text-gray-900 text-xs truncate">
                    {productToDelete.name}
                  </span>
                  <span className="block text-[10px] text-gray-400 font-mono">
                    SKU: {productToDelete.sku || 'N/A'} • {productToDelete.volume}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 border rounded-xl hover:bg-slate-50 text-gray-500 font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteProduct(productToDelete.id);
                  setShowDeleteConfirm(false);
                  setProductToDelete(null);
                  showNotice('SKU registry successfully deleted.');
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow transition-colors flex items-center gap-1.5"
              >
                <Trash className="h-3.5 w-3.5" />
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL: BULK SKU DELETE */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-150">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-sm uppercase text-red-600 flex items-center gap-1.5">
                <AlertTriangle className="h-4.5 w-4.5 text-red-600 animate-pulse" />
                <span>Bulk SKU Destruction</span>
              </h3>
              <button 
                onClick={() => setShowBulkDeleteConfirm(false)} 
                className="text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-gray-600 leading-relaxed">
                You are about to permanently destroy <strong className="text-red-600 font-black">{selectedProductIds.length} selected SKUs</strong>. All inventory allocations, price points, and metadata will be permanently shredded.
              </p>

              <div className="bg-red-50 border border-red-100 p-3.5 rounded-2xl flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div className="text-[10px] text-red-700 font-bold leading-normal">
                  WARNING: This will instantly sync down to branch registers and remove these products from customer portals.
                </div>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="px-4 py-2 border rounded-xl hover:bg-slate-50 text-gray-500 font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeBulkDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow transition-colors flex items-center gap-1.5"
              >
                <Trash className="h-3.5 w-3.5" />
                <span>Destroy Selected ({selectedProductIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
