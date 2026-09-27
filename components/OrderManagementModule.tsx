import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Calendar, DollarSign, PieChart, FileCheck, Layers, ChevronRight, Plus, TrendingUp, Info, Sparkles, FileText } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../src/firebase';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { DetailedOrder } from '../types';

interface OrderManagementModuleProps {
  isMasterAdmin: boolean;
  onDraftDocuments?: (order: DetailedOrder) => void;
}

const OrderManagementModule: React.FC<OrderManagementModuleProps> = ({ isMasterAdmin, onDraftDocuments }) => {
  const [view, setView] = useState<'overview' | 'add' | 'details'>('overview');
  const [orders, setOrders] = useState<DetailedOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<DetailedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<DetailedOrder>>({
    controlNumber: `RB-ORD-${Math.floor(Math.random() * 100000)}`,
    buyerName: '',
    factoryName: '',
    supplierName: '',
    startProductionDate: '',
    paymentDate: '',
    shipmentDate: '',
    handoverDate: '',
    buyingPricePerUnit: 0,
    sellingPricePerUnit: 0,
    quantity: 0,
    otherExpenses: 0,
    currency: 'USD',
    exchangeRate: 110,
    status: 'In Production'
  });

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'detailed_orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ords = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as DetailedOrder));
      setOrders(ords);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'detailed_orders');
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsLoading(true);
    try {
      const orderData = {
        ...formData,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'detailed_orders'), orderData);
      setView('overview');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'detailed_orders');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProfit = (order: DetailedOrder) => {
    const totalBuying = order.buyingPricePerUnit * order.quantity;
    const totalSelling = order.sellingPricePerUnit * order.quantity;
    const grossProfit = totalSelling - totalBuying - order.otherExpenses;
    const profitBDT = grossProfit * order.exchangeRate;
    return { grossProfit, profitBDT };
  };

  const StatusBadge = ({ status }: { status: DetailedOrder['status'] }) => {
    const colors = {
      'In Production': 'bg-blue-100 text-blue-600',
      'Payment Pending': 'bg-amber-100 text-amber-600',
      'Shipped': 'bg-red-100 text-red-600',
      'Closed': 'bg-slate-900 text-white'
    };
    return <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${colors[status]}`}>{status}</span>;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Order Management</h2>
          <p className="text-slate-500 font-medium tracking-tight">Track full lifecycle from production to final profit analysis.</p>
        </div>
        <button 
          onClick={() => setView(view === 'add' ? 'overview' : 'add')}
          className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-red-600/20"
        >
          {view === 'add' ? 'Close Form' : <><Plus size={18} /> New Order Profile</>}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {view === 'overview' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 gap-6"
          >
            {orders.length === 0 ? (
               <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-100">
                  <ShoppingBag className="mx-auto text-slate-200 mb-6" size={64} />
                  <h3 className="text-2xl font-black text-slate-400 uppercase tracking-widest leading-none">Scanning for Orders...</h3>
                  <p className="text-slate-400 mt-2 font-medium">No active order records found in the database.</p>
               </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                   <div className="absolute top-0 right-0 w-4 h-full bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   
                   <div className="flex flex-wrap items-center justify-between gap-8">
                      <div className="flex items-center gap-6">
                         <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400">
                            <Layers size={24} />
                         </div>
                         <div>
                            <div className="flex items-center gap-3 mb-1">
                               <h3 className="text-lg font-black text-slate-900 leading-none uppercase">{order.controlNumber}</h3>
                               <StatusBadge status={order.status} />
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{order.buyerName} • {order.factoryName}</p>
                         </div>
                      </div>

                      <div className="flex gap-12 text-center border-x border-slate-50 px-12">
                         <div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 leading-none">Shipment Date</p>
                            <p className="font-black text-slate-900">{order.shipmentDate || 'TBD'}</p>
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 leading-none">Quantity</p>
                            <p className="font-black text-slate-900">{order.quantity.toLocaleString()} Pcs</p>
                         </div>
                      </div>

                      <div className="flex items-center gap-3">
                         {onDraftDocuments && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDraftDocuments(order);
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-red-50 hover:bg-red-600 text-red-600 hover:text-white text-xs font-black uppercase tracking-wider transition-all border border-red-200 hover:border-red-600 shadow-sm cursor-pointer"
                              title="Draft Commercial Invoice & Packing List with Gemini AI"
                            >
                              <Sparkles size={14} className="animate-pulse" />
                              <span>AI Draft Docs</span>
                            </button>
                         )}
                         {isMasterAdmin && order.status === 'Closed' && (
                            <div className="text-right">
                               <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1 leading-none">Final Profit (USD)</p>
                               <p className="text-xl font-black text-slate-900 leading-none">${calculateProfit(order).grossProfit.toLocaleString()}</p>
                            </div>
                         )}
                         <button 
                           onClick={() => { setSelectedOrder(order); setView('details'); }}
                           className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all cursor-pointer"
                         >
                            <ChevronRight size={20} />
                         </button>
                      </div>
                   </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {view === 'add' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100"
          >
            <form onSubmit={handleSubmit} className="space-y-12">
               {/* Basic Info */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Control Number</label>
                    <input type="text" value={formData.controlNumber} readOnly className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 font-black text-red-600 tracking-tight" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Buyer Details</label>
                    <input type="text" required value={formData.buyerName} onChange={e => setFormData({...formData, buyerName: e.target.value})} className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 font-bold" placeholder="e.g. South Korea Co." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Factory Name</label>
                    <input type="text" required value={formData.factoryName} onChange={e => setFormData({...formData, factoryName: e.target.value})} className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 font-bold" placeholder="e.g. Dhaka Textile Ltd" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Supplier Name</label>
                    <input type="text" required value={formData.supplierName} onChange={e => setFormData({...formData, supplierName: e.target.value})} className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 font-bold" placeholder="e.g. Red Bird Sourcing" />
                  </div>
               </div>

               {/* Timeline */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-8 bg-slate-50 p-8 rounded-[2rem]">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Calendar size={12}/> Production Start</label>
                    <input type="date" value={formData.startProductionDate} onChange={e => setFormData({...formData, startProductionDate: e.target.value})} className="w-full bg-white border-0 rounded-xl px-4 py-3 font-medium" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><DollarSign size={12}/> Payment Date</label>
                    <input type="date" value={formData.paymentDate} onChange={e => setFormData({...formData, paymentDate: e.target.value})} className="w-full bg-white border-0 rounded-xl px-4 py-3 font-medium" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><TrendingUp size={12}/> Shipment Date</label>
                    <input type="date" value={formData.shipmentDate} onChange={e => setFormData({...formData, shipmentDate: e.target.value})} className="w-full bg-white border-0 rounded-xl px-4 py-3 font-medium" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><FileCheck size={12}/> Handover Date</label>
                    <input type="date" value={formData.handoverDate} onChange={e => setFormData({...formData, handoverDate: e.target.value})} className="w-full bg-white border-0 rounded-xl px-4 py-3 font-medium" />
                  </div>
               </div>

               {/* Financials */}
               <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Order Quantity</label>
                    <input type="number" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Buying Price (Unit)</label>
                    <input type="number" step="0.01" required value={formData.buyingPricePerUnit} onChange={e => setFormData({...formData, buyingPricePerUnit: Number(e.target.value)})} className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Selling Price (Unit)</label>
                    <input type="number" step="0.01" required value={formData.sellingPricePerUnit} onChange={e => setFormData({...formData, sellingPricePerUnit: Number(e.target.value)})} className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Other Expenses</label>
                    <input type="number" value={formData.otherExpenses} onChange={e => setFormData({...formData, otherExpenses: Number(e.target.value)})} className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Exch. Rate (1 USD)</label>
                    <input type="number" value={formData.exchangeRate} onChange={e => setFormData({...formData, exchangeRate: Number(e.target.value)})} className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 font-bold" />
                  </div>
               </div>

               <div className="flex justify-end gap-4 pt-12 border-t border-slate-50">
                  <button type="button" onClick={() => setView('overview')} className="px-10 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest">Cancel</button>
                  <button type="submit" disabled={isLoading} className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-red-600 transition-all">
                     {isLoading ? 'Processing...' : 'Create Order Profile'}
                  </button>
               </div>
            </form>
          </motion.div>
        )}

        {view === 'details' && selectedOrder && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                  <button onClick={() => setView('overview')} className="bg-white p-3 rounded-xl border border-slate-100 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer">←</button>
                  <div>
                     <h3 className="text-2xl font-black text-slate-900 leading-none uppercase">{selectedOrder.controlNumber} Details</h3>
                     <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Lifecycle Analysis & Profit Documentation</p>
                  </div>
               </div>

               {onDraftDocuments && (
                  <button
                    type="button"
                    onClick={() => onDraftDocuments(selectedOrder)}
                    className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all active:scale-95 cursor-pointer"
                  >
                     <Sparkles size={16} className="animate-pulse" />
                     <span>AI Draft Commercial Invoice & Packing List</span>
                  </button>
               )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm grid grid-cols-2 gap-12">
                     <div>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2"><Layers size={14}/> Operations</p>
                        <div className="space-y-4">
                           <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Factory</p>
                              <p className="font-black text-slate-900">{selectedOrder.factoryName}</p>
                           </div>
                           <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Supplier</p>
                              <p className="font-black text-slate-900">{selectedOrder.supplierName}</p>
                           </div>
                        </div>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2"><Calendar size={14}/> Timeline</p>
                        <div className="space-y-4">
                           <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                              <span className="text-[9px] font-black text-slate-400 uppercase">Production Start</span>
                              <span className="font-black text-slate-900 text-xs">{selectedOrder.startProductionDate}</span>
                           </div>
                           <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                              <span className="text-[9px] font-black text-slate-400 uppercase">Estimated Shipment</span>
                              <span className="font-black text-slate-900 text-xs">{selectedOrder.shipmentDate}</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-slate-950 p-12 rounded-[3rem] text-white overflow-hidden relative">
                     <div className="absolute top-0 right-0 p-12 opacity-10">
                        <TrendingUp size={120} />
                     </div>
                     <h4 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                        <TrendingUp size={24} className="text-red-600" />
                        Financial Analysis Profile
                     </h4>
                     
                     {isMasterAdmin ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                           <div className="space-y-8">
                              <div>
                                 <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Revenue Snapshot (Est.)</p>
                                 <p className="text-4xl font-black text-white">${(selectedOrder.sellingPricePerUnit * selectedOrder.quantity).toLocaleString()}</p>
                                 <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Selling Price: ${selectedOrder.sellingPricePerUnit} x {selectedOrder.quantity}</p>
                              </div>
                              <div>
                                 <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Cost Analysis (Est.)</p>
                                 <p className="text-2xl font-black text-red-600">-${(selectedOrder.buyingPricePerUnit * selectedOrder.quantity + selectedOrder.otherExpenses).toLocaleString()}</p>
                                 <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Buying: ${selectedOrder.buyingPricePerUnit} | Expenses: ${selectedOrder.otherExpenses}</p>
                              </div>
                           </div>
                           <div className="bg-white/5 p-8 rounded-3xl border border-white/10 flex flex-col justify-center">
                              <div>
                                 <p className="text-xs font-black text-green-500 uppercase tracking-widest mb-2">Net Estimated Profit</p>
                                 <p className="text-5xl font-black text-white leading-none">${calculateProfit(selectedOrder).grossProfit.toLocaleString()}</p>
                                 <div className="mt-8 pt-8 border-t border-white/10">
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Local Conversion (BDT)</p>
                                    <p className="text-3xl font-black text-green-500">৳{calculateProfit(selectedOrder).profitBDT.toLocaleString()}</p>
                                    <p className="text-[9px] font-bold text-slate-600 mt-1 uppercase tracking-widest">Rate Used: 1 USD = {selectedOrder.exchangeRate} BDT</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     ) : (
                        <div className="bg-red-600/10 p-12 rounded-[2rem] border border-red-600/20 text-center">
                           <Info className="mx-auto text-red-600 mb-4" size={48} />
                           <h5 className="text-xl font-black uppercase mb-2">Access Restricted</h5>
                           <p className="text-slate-400 font-medium">Profit analysis and financial documentation are only visible to the Master Admin.</p>
                        </div>
                     )}
                  </div>
               </div>

               <div className="space-y-8">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100">
                     <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-4">Order Status</p>
                     <div className="space-y-3">
                        {(['In Production', 'Payment Pending', 'Shipped', 'Closed'] as const).map(s => (
                           <button 
                             key={s}
                             onClick={async () => {
                               if (!db) return;
                               await updateDoc(doc(db, 'detailed_orders', selectedOrder.id), { status: s });
                               setSelectedOrder({...selectedOrder, status: s});
                             }}
                             className={`w-full py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest text-left transition-all flex justify-between items-center ${selectedOrder.status === s ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                           >
                              {s}
                              {selectedOrder.status === s && <FileCheck size={16} />}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 text-center">
                     <PieChart className="mx-auto text-red-600 mb-4" size={32} />
                     <p className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Stock Status</p>
                     <p className="text-3xl font-black text-slate-900">{selectedOrder.quantity.toLocaleString()}</p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pending Shipment</p>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderManagementModule;
