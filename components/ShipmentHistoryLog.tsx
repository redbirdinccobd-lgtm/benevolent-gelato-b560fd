import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../src/firebase';
import { ShipmentNote, ShipmentProfile } from '../types';
import { 
  Clock, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  ArrowRight, 
  MessageSquare, 
  Tag, 
  Ship, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Download,
  RefreshCw,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryEntry extends ShipmentNote {
  shipmentId: string;
  buyerName: string;
}

export const ShipmentHistoryLog: React.FC = () => {
  const [shipments, setShipments] = useState<ShipmentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  useEffect(() => {
    if (!db) return;

    setLoading(true);
    const q = query(collection(db, 'shipments'), orderBy('date', 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShipmentProfile));
      setShipments(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'shipments');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const historyEntries = useMemo(() => {
    const entries: HistoryEntry[] = [];
    shipments.forEach(s => {
      if (s.notes && Array.isArray(s.notes)) {
        s.notes.forEach(n => {
          entries.push({
            ...n,
            shipmentId: s.id,
            buyerName: s.buyerName
          });
        });
      }
    });

    // Sort chronologically (newest first)
    return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [shipments]);

  const filteredEntries = useMemo(() => {
    return historyEntries.filter(e => {
      const matchesSearch = 
        e.shipmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.author.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter;
      const matchesStatus = statusFilter === 'All' || e.statusTag === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [historyEntries, searchTerm, categoryFilter, statusFilter]);

  const categories = ['All', 'Status Update', 'Customs & Clearance', 'Freight & Logistics', 'Quality Inspection', 'Financial & Remittance', 'General'];
  const statuses = ['All', 'Info', 'In Progress', 'Alert', 'Milestone', 'Cleared'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw className="text-red-600 animate-spin" size={40} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Synchronizing Audit Logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Shipment Audit History</h2>
          <p className="text-slate-500 font-medium leading-tight">Chronological log of all operational events and status updates.</p>
        </div>
        
        <div className="flex bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 items-center gap-2 shadow-sm">
          <TrendingUp className="text-emerald-600" size={16} />
          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
            {filteredEntries.length} Records Verified
          </span>
        </div>
      </header>

      {/* Filter Toolbar */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search by ID, Buyer, Author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border-0 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-600 transition-all"
          />
        </div>

        <div>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-600 appearance-none"
          >
            {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
          </select>
        </div>

        <div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-600 appearance-none"
          >
            {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Status Tags' : s}</option>)}
          </select>
        </div>

        <button className="bg-slate-900 text-white rounded-2xl px-6 py-3 font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2">
          <Download size={14} />
          Export Log
        </button>
      </div>

      {/* History Timeline */}
      <div className="relative space-y-4">
        <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-100 hidden md:block"></div>

        <AnimatePresence mode="popLayout">
          {filteredEntries.map((entry, idx) => (
            <motion.div 
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.03 }}
              className="relative flex flex-col md:flex-row gap-6 group"
            >
              {/* Date & Time Column */}
              <div className="md:w-32 flex-shrink-0 flex flex-col items-center md:items-end justify-center">
                <div className="bg-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1">
                  {new Date(entry.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </div>
                <div className="text-[11px] font-bold text-slate-400">
                  {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Icon Marker */}
              <div className="hidden md:flex absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-slate-200 group-hover:border-red-600 transition-colors z-10 items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-red-600 transition-colors"></div>
              </div>

              {/* Entry Card */}
              <div className="flex-1 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl ${
                      entry.statusTag === 'Cleared' ? 'bg-emerald-50 text-emerald-600' :
                      entry.statusTag === 'Alert' ? 'bg-red-50 text-red-600' :
                      entry.statusTag === 'In Progress' ? 'bg-blue-50 text-blue-600' :
                      'bg-slate-50 text-slate-600'
                    }`}>
                      {entry.category === 'Freight & Logistics' ? <Ship size={18} /> :
                       entry.category === 'Customs & Clearance' ? <CheckCircle2 size={18} /> :
                       entry.category === 'Financial & Remittance' ? <TrendingUp size={18} /> :
                       entry.category === 'Quality Inspection' ? <Calendar size={18} /> :
                       <MessageSquare size={18} />}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                        {entry.category}
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
                          entry.statusTag === 'Cleared' ? 'bg-emerald-100 text-emerald-600' :
                          entry.statusTag === 'Alert' ? 'bg-red-100 text-red-600' :
                          entry.statusTag === 'In Progress' ? 'bg-blue-100 text-blue-600' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {entry.statusTag}
                        </span>
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                        <Ship size={10} />
                        Shipment: <span className="text-red-600">{entry.shipmentId}</span>
                        <span className="text-slate-300">•</span>
                        Buyer: <span className="text-slate-600">{entry.buyerName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    <User size={12} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{entry.author}</span>
                  </div>
                </div>

                <div className="relative">
                  <p className="text-slate-700 text-sm leading-relaxed font-medium">
                    {entry.content}
                  </p>
                  {entry.isInternal && (
                    <div className="mt-3 flex items-center gap-1.5 text-[9px] font-black text-red-600/60 uppercase tracking-[0.2em]">
                      <AlertCircle size={10} />
                      INTERNAL AUDIT LOG • CONFIDENTIAL
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredEntries.length === 0 && (
          <div className="bg-white p-20 rounded-[3rem] border border-slate-100 text-center space-y-4 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
              <Search size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase">No History Records Found</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">Adjust your filters or search terms to find specific shipment milestones and audit events.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipmentHistoryLog;
