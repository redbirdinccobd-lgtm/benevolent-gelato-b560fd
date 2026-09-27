
import React, { useState } from 'react';
import { OrderPlan } from '../types';
import { db } from '../src/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Calendar, Clock, DollarSign, Package, CheckCircle2 } from 'lucide-react';

const OrderPlanningModule: React.FC = () => {
  const [plans, setPlans] = useState<Partial<OrderPlan>[]>([
    { id: '1', orderNumber: 'RB-001', startDate: '2026-05-10', paymentDate: '2026-05-15', shipmentDate: '2026-06-20', status: 'Active' }
  ]);

  const [newPlan, setNewPlan] = useState<Partial<OrderPlan>>({
    orderNumber: `PLAN-${Date.now().toString().slice(-4)}`,
    status: 'Draft',
    supplierId: '',
    buyerId: ''
  });

  const addPlan = async () => {
    if (!newPlan.buyerId || !newPlan.supplierId) {
      alert('Please provide Buyer and Supplier names');
      return;
    }
    try {
      await addDoc(collection(db, 'order_plans'), {
        ...newPlan,
        createdAt: serverTimestamp()
      });
      alert('Order Planning Profile Created Successfully');
      setNewPlan({
        orderNumber: `PLAN-${Date.now().toString().slice(-4)}`,
        status: 'Draft',
        supplierId: '',
        buyerId: ''
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      {/* New Implementation Form */}
      <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-slate-900 flex items-center space-x-3">
             <div className="p-2 bg-red-100 text-red-600 rounded-xl">
               <Calendar size={20} />
             </div>
             <span>Create Order Execution Plan</span>
          </h3>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3 py-1 bg-slate-50 border rounded-full">
            Automated Timeline Profiling
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Order / Style / PO #</label>
            <input
              type="text"
              placeholder="e.g. RB-ZARA-2024"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:bg-white focus:ring-4 focus:ring-red-100 transition-all outline-none"
              value={newPlan.orderNumber}
              onChange={e => setNewPlan({...newPlan, orderNumber: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Supplier / Factory Name</label>
            <input
              type="text"
              placeholder="e.g. Red Bird Unit 1"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:bg-white focus:ring-4 focus:ring-red-100 transition-all outline-none"
              value={newPlan.supplierId}
              onChange={e => setNewPlan({...newPlan, supplierId: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Buyer / Consignee Name</label>
            <input
              type="text"
              placeholder="e.g. H&M Global"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:bg-white focus:ring-4 focus:ring-red-100 transition-all outline-none"
              value={newPlan.buyerId}
              onChange={e => setNewPlan({...newPlan, buyerId: e.target.value})}
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Process Kick-off Date</label>
            <input 
              type="date" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none" 
              onChange={e => setNewPlan({...newPlan, startDate: e.target.value})} 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Payment Maturity Date</label>
            <input 
              type="date" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none border-red-100" 
              onChange={e => setNewPlan({...newPlan, paymentDate: e.target.value})} 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Final Shipment Date</label>
            <input 
              type="date" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none border-green-100" 
              onChange={e => setNewPlan({...newPlan, shipmentDate: e.target.value})} 
            />
          </div>
        </div>
        
        <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
          <button
            onClick={addPlan}
            className="px-10 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all shadow-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 group"
          >
            <CheckCircle2 size={18} className="text-red-500 group-hover:scale-110 transition-transform" />
            Initialize Execution Profile
          </button>
        </div>
      </div>

      {/* Active Plans Timeline */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Active Production & Payment Timeline</h3>
        <div className="space-y-6">
          {plans.map(plan => (
            <div key={plan.id} className="relative pl-8 border-l-2 border-slate-100 pb-2 transition-all hover:border-red-400">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#ba3e3e] border-2 border-white shadow-sm" />
              <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight">{plan.orderNumber}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black uppercase text-slate-400">Buyer:</span>
                      <span className="text-xs font-bold text-slate-700">{plan.buyerId}</span>
                      <span className="text-[10px] text-slate-300">|</span>
                      <span className="text-[10px] font-black uppercase text-slate-400">Supplier:</span>
                      <span className="text-xs font-bold text-slate-700">{plan.supplierId}</span>
                    </div>
                  </div>
                  <div className="flex space-x-6">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start</span>
                       <span className="text-xs font-bold text-slate-900">{plan.startDate}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Payment Due</span>
                       <span className="text-xs font-bold text-red-600">{plan.paymentDate}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">ETD</span>
                       <span className="text-xs font-bold text-green-600">{plan.shipmentDate}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6 mt-4 md:mt-0">
                  <div className="flex flex-col items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm min-w-[80px]">
                    <Package className="text-slate-200 mb-1" size={24} />
                    <span className="text-[10px] text-slate-400 uppercase font-black">Status</span>
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-tighter">{plan.status}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderPlanningModule;
