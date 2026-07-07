/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { 
  Briefcase, 
  Layers, 
  Package, 
  TrendingUp, 
  PlusCircle, 
  ShoppingCart, 
  Copy, 
  Check, 
  AlertTriangle, 
  DollarSign, 
  History,
  Info,
  CheckCircle2
} from 'lucide-react';

export const AgentDashboard: React.FC = () => {
  const { 
    currentUserAccount, 
    agents, 
    agentStockLogs, 
    products, 
    purchaseAgentStock,
    orders
  } = useAppState();

  const [copiedLink, setCopiedLink] = useState(false);
  const [purchaseQty, setPurchaseQty] = useState(10);
  const [purchaseProductId, setPurchaseProductId] = useState('p1');
  const [purchaseStatus, setPurchaseStatus] = useState<string | null>(null);

  if (!currentUserAccount || currentUserAccount.userType !== 'agent') {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-sm mx-auto text-center space-y-3">
        <Briefcase className="h-10 w-10 text-gray-400 mx-auto" />
        <h3 className="font-sans text-base font-bold text-gray-900">Agent Access Only</h3>
        <p className="font-sans text-xs text-gray-500">Only approved Madu Plus business agents can launch this stock metrics dashboard.</p>
      </div>
    );
  }

  // Find corresponding agent profile
  const activeAgent = agents.find(a => a.userId === currentUserAccount.id);

  if (!activeAgent) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 max-w-md mx-auto text-center space-y-2">
        <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
        <p className="text-xs text-gray-600 font-medium">Your account type is Agent, but no allocation details were initialized. Please contact backend database admins.</p>
      </div>
    );
  }

  // Retrieve stock logs and active sales
  const myStockLogs = agentStockLogs.filter(log => log.agentId === activeAgent.id);
  const myRetailSales = orders.filter(ord => ord.agentId === activeAgent.id);

  // Auto calculate discount rates
  const selectedProduct = products.find(p => p.id === purchaseProductId) || products[0];
  const unitPrice = selectedProduct ? selectedProduct.price : 120;
  const originalCost = unitPrice * purchaseQty;
  const discountedCost = originalCost * (1 - activeAgent.discountRate);

  const handleStockReplenish = (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseQty <= 0) return;

    purchaseAgentStock(
      activeAgent.id,
      purchaseProductId,
      purchaseQty,
      `Agent bulk replenishment order paid at ${activeAgent.agentTier} level discount rate.`
    );

    setPurchaseStatus(`Success! Purchased ${purchaseQty} units of ${selectedProduct?.name}. Virtual stock has been allocated.`);
    setTimeout(() => {
      setPurchaseStatus(null);
    }, 3000);
  };

  // Generate unique URL
  const agentStoreLink = `${window.location.origin}${window.location.pathname}?agent=${activeAgent.id}`;

  const copyStoreLink = () => {
    navigator.clipboard.writeText(agentStoreLink);
    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      
      {/* Top Banner Stats Grid */}
      <div className="bg-gradient-to-r from-teal-800 to-indigo-900 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-1/2 right-10 -translate-y-1/2 opacity-10">
          <Layers className="h-40 w-40" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/20 text-teal-100 uppercase tracking-widest">
                Official Agent
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-yellow-500 text-gray-900 uppercase tracking-wider">
                {activeAgent.agentTier} Level
              </span>
            </div>
            <h2 className="font-sans text-xl font-bold tracking-tight mt-2">Agent Reseller Operations</h2>
            <p className="text-xs text-teal-105 mt-0.5">Manage your private stock inventory and launch custom retail transactions</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex gap-6 border border-white/10">
            <div>
              <span className="block text-[10px] text-teal-200">Tier Discount</span>
              <span className="block text-xl font-bold font-mono mt-0.5">{activeAgent.discountRate * 100}% Off</span>
            </div>
            <div className="border-l border-white/10" />
            <div>
              <span className="block text-[10px] text-teal-200">Commission Rate</span>
              <span className="block text-xl font-bold font-mono mt-0.5">{activeAgent.commissionRate * 100}%</span>
            </div>
            <div className="border-l border-white/10" />
            <div>
              <span className="block text-[10px] text-teal-200">Private stock</span>
              <span className="block text-xl font-bold font-mono mt-0.5">{activeAgent.stockBalance} Units</span>
            </div>
          </div>
        </div>
      </div>

      {/* Copy Link Utility Block */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-[#1580c2]">
            <Copy className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900">My Customized Micro-Store Link</h4>
            <p className="text-[10px] text-gray-400 mt-0.5">Share with clients; checkout transactions automatically deduct items from your reserve stock.</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <input 
            type="text" 
            value={agentStoreLink} 
            readOnly
            className="flex-1 sm:w-64 bg-gray-50 text-[10px] font-mono px-3 py-2 border border-gray-150 rounded-xl focus:outline-none"
          />
          <button
            onClick={copyStoreLink}
            className="bg-[#1580c2] hover:bg-blue-600 px-3.5 py-2 rounded-xl text-white font-sans font-semibold text-[10px] flex items-center gap-1 transition-all"
          >
            {copiedLink ? (
              <>
                <Check className="h-3 w-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" /> Copy URL
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bulk Replenish Store Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 lg:col-span-1">
          <h3 className="font-sans text-sm font-bold text-gray-900 flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-[#1580c2]" />
            Purchase Bulk Inventory
          </h3>

          {purchaseStatus && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-[10px] border border-emerald-100 flex items-start gap-1.5 leading-relaxed">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{purchaseStatus}</span>
            </div>
          )}

          <form onSubmit={handleStockReplenish} className="space-y-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-700 mb-1">Select Product</label>
              <select 
                value={purchaseProductId}
                onChange={(e) => setPurchaseProductId(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (RM {p.price})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-700 mb-1">Quantity (bottles)</label>
              <input 
                type="number" 
                value={purchaseQty}
                onChange={(e) => setPurchaseQty(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                min={1}
              />
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-150 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-500 text-[11px]">
                <span>Original retail price</span>
                <span>RM {originalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#1580c2] font-semibold text-[11px]">
                <span>{activeAgent.agentTier} Tier Price ({activeAgent.discountRate * 100}% Off)</span>
                <span>- RM {(originalCost * activeAgent.discountRate).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-1.5 flex justify-between font-bold text-gray-900">
                <span>Total Amount Due</span>
                <span>RM {discountedCost.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#1580c2] hover:bg-blue-600 text-white font-sans font-bold text-xs py-2 px-4 rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <ShoppingCart className="h-4 w-4" />
              Pay & Restock Reserve
            </button>
          </form>
        </div>

        {/* Ledger logs & Private allocations */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 lg:col-span-2">
          
          {/* Visual Alert threshold warnings */}
          {activeAgent.stockBalance < 20 && (
            <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-100 text-[10px] leading-relaxed flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong>Low Stock Alert:</strong> Your stock reserve has fallen below 20 bottles. Purchase bulk stock now to avoid order rejects.
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="font-sans text-sm font-bold text-gray-900 flex items-center gap-2">
              <History className="h-4 w-4 text-[#1580c2]" />
              Stock transactions & Ledger Audits
            </h3>
            <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">
              {myStockLogs.length} Records
            </span>
          </div>

          {myStockLogs.length === 0 ? (
            <div className="text-center p-8 text-gray-400 text-xs">
              No recorded stock history events found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase font-bold text-[9px] tracking-wider">
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Action</th>
                    <th className="py-2.5">Product</th>
                    <th className="py-2.5 text-right">Qty</th>
                    <th className="py-2.5">Reference / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {myStockLogs.slice(0, 10).map(log => {
                    const matchItem = products.find(p => p.id === log.productId);
                    return (
                      <tr key={log.id} className="hover:bg-gray-50/50">
                        <td className="py-2 text-gray-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleDateString()}</td>
                        <td className="py-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase leading-none ${log.action === 'purchase' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2 text-gray-900 font-medium truncate max-w-xs">{matchItem ? matchItem.name : 'Raw Honey'}</td>
                        <td className={`py-2 text-right font-mono font-bold whitespace-nowrap ${log.quantity > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                        </td>
                        <td className="py-2 text-gray-400 max-w-xs truncate">{log.notes || log.transactionId}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Connected retail customers list */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-gray-900 mb-2">Direct Retail Sales Sourced from My Stock</h4>
            {myRetailSales.length === 0 ? (
              <p className="text-[10px] text-gray-400 font-medium">No sales transactions have been fulfilled from your local inventory yet.</p>
            ) : (
              <div className="space-y-1.5">
                {myRetailSales.map(ord => (
                  <div key={ord.id} className="p-2 border border-gray-100 bg-gray-50/50 rounded-lg flex justify-between text-[11px]">
                    <div>
                      <span className="font-bold text-gray-800">{ord.customerName}</span> (Order {ord.id})
                      <span className="text-[10px] text-gray-400 block">{new Date(ord.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className="font-mono font-bold text-blue-700">RM {ord.total}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
