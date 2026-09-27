import React, { useState } from 'react';
import { 
  Building2, Globe, TrendingUp, DollarSign, Package, CheckCircle2, 
  ArrowRight, Plus, Search, Star, ShieldCheck, FileText, Truck, Sparkles
} from 'lucide-react';

interface BuyerSourcingProps {
  onDraftInvoiceForBuyer?: (buyer: any) => void;
  onGenerateLabelForBuyer?: (buyer: any) => void;
  onSchedulePickupForBuyer?: (buyer: any) => void;
  onCreateShipmentForBuyer?: (buyer: any) => void;
}

export const BuyerSourcingIntelligence: React.FC<BuyerSourcingProps> = ({
  onDraftInvoiceForBuyer,
  onGenerateLabelForBuyer,
  onSchedulePickupForBuyer,
  onCreateShipmentForBuyer
}) => {
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>('B-01');
  const [searchQuery, setSearchQuery] = useState('');

  const buyers = [
    {
      id: 'B-01',
      name: 'Hanwha Apparel Group',
      country: 'South Korea',
      city: 'Seoul',
      port: 'Busan Port (KRPUS)',
      rating: 'AAA Tier (Premium Buyer)',
      totalVolumePcs: 145000,
      activeOrders: 3,
      totalFobUsd: '$616,250',
      avgFobPrice: '$4.25 / Pc',
      keyProducts: "Men's Combed Cotton Polo, Woven Dress Shirts, Chino Pants",
      paymentTerms: '100% Irrevocable L/C at Sight (Woori Bank Seoul)',
      creditLimit: '$1,500,000 USD',
      onTimeDeliveryRate: '99.4%',
      nextShipmentDate: '2026-03-26',
      contactPerson: 'Mr. Min-jun Park (VP Global Procurement)',
      contactEmail: 'm.park@hanwha-apparel.kr',
      verified: true
    },
    {
      id: 'B-02',
      name: 'Nordic Pacific Imports LLC',
      country: 'United States',
      city: 'Los Angeles, CA',
      port: 'Long Beach Port (USLGB)',
      rating: 'AA+ Tier',
      totalVolumePcs: 98000,
      activeOrders: 2,
      totalFobUsd: '$441,000',
      avgFobPrice: '$4.50 / Pc',
      keyProducts: 'Heavyweight Fleece Crewneck Sweaters, Organic Hoodies',
      paymentTerms: 'TT 30% Advance, 70% against B/L Copy (Chase Manhattan)',
      creditLimit: '$1,000,000 USD',
      onTimeDeliveryRate: '98.8%',
      nextShipmentDate: '2026-04-02',
      contactPerson: 'Ms. Sarah Jenkins (Sourcing Director)',
      contactEmail: 's.jenkins@nordicpacific.com',
      verified: true
    },
    {
      id: 'B-03',
      name: 'Hamburg Mode Kontor GmbH',
      country: 'Germany',
      city: 'Hamburg',
      port: 'Hamburg Port (DEHAM)',
      rating: 'AA Tier (EU Eco-Certified)',
      totalVolumePcs: 74000,
      activeOrders: 2,
      totalFobUsd: '$355,200',
      avgFobPrice: '$4.80 / Pc',
      keyProducts: 'GOTS Certified Organic Cotton T-Shirts, Knit Pullovers',
      paymentTerms: 'L/C 60 Days Usance (Deutsche Bank Hamburg)',
      creditLimit: '$850,000 USD',
      onTimeDeliveryRate: '98.5%',
      nextShipmentDate: '2026-04-19',
      contactPerson: 'Herr Lukas Weber (Head of Supply Chain)',
      contactEmail: 'weber@hamburg-mode.de',
      verified: true
    },
    {
      id: 'B-04',
      name: 'Tokyo Trading & Apparel Co.',
      country: 'Japan',
      city: 'Tokyo',
      port: 'Yokohama Port (JPYOK)',
      rating: 'AAA Tier (Precision QC)',
      totalVolumePcs: 62000,
      activeOrders: 1,
      totalFobUsd: '$297,600',
      avgFobPrice: '$4.80 / Pc',
      keyProducts: 'Casual Chino Trousers, Twill Shorts, Fine Gauge Knits',
      paymentTerms: '100% L/C at Sight (MUFG Bank Tokyo)',
      creditLimit: '$900,000 USD',
      onTimeDeliveryRate: '99.8%',
      nextShipmentDate: '2026-03-31',
      contactPerson: 'Mr. Kenji Sato (Senior Merchandiser)',
      contactEmail: 'k-sato@tokyotrading.co.jp',
      verified: true
    },
    {
      id: 'B-05',
      name: 'London Premier Fashion Ltd',
      country: 'United Kingdom',
      city: 'London',
      port: 'Felixstowe Port (GBFXT)',
      rating: 'A+ Tier',
      totalVolumePcs: 45000,
      activeOrders: 1,
      totalFobUsd: '$211,500',
      avgFobPrice: '$4.70 / Pc',
      keyProducts: 'Brushed Cotton Flannel Shirts, Casual Denim Overshirts',
      paymentTerms: 'TT 45 Days Net (Barclays Commercial UK)',
      creditLimit: '$600,000 USD',
      onTimeDeliveryRate: '97.9%',
      nextShipmentDate: '2026-04-12',
      contactPerson: 'Mr. Oliver Wright (Brand Buying Manager)',
      contactEmail: 'o.wright@londonpremierfashion.co.uk',
      verified: true
    }
  ];

  const filteredBuyers = buyers.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.port.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedBuyer = buyers.find(b => b.id === selectedBuyerId) || buyers[0];

  return (
    <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <span>Global Buyer Sourcing & Intelligence Network</span>
                <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                  AI Evaluated
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Comprehensive profile analysis, recurring order pipelines, and direct export actions for international garment buyers.
              </p>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search buyers by name, country, port..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>
      </div>

      {/* Main Grid: Buyer Selection & Detailed Intelligence Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
            Verified Global Buyer Directory ({filteredBuyers.length})
          </span>

          <div className="space-y-2.5">
            {filteredBuyers.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBuyerId(b.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedBuyerId === b.id
                    ? 'bg-red-50/70 border-red-300 ring-2 ring-red-500/20 shadow-sm'
                    : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                      <span>{b.name}</span>
                      {b.verified && <CheckCircle2 size={13} className="text-emerald-600" />}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {b.city}, {b.country} • {b.port.split('(')[0]}
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-red-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                    {b.rating.split(' ')[0]}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-200/60 text-[10px]">
                  <div>
                    <span className="text-slate-400 block">Total Volume</span>
                    <strong className="text-slate-900 font-bold">{b.totalVolumePcs.toLocaleString()} Pcs</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Total FOB</span>
                    <strong className="text-slate-900 font-bold">{b.totalFobUsd}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block">Active Orders</span>
                    <strong className="text-red-600 font-bold">{b.activeOrders} Shipments</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Detail Pane (7 cols) */}
        <div className="lg:col-span-7 bg-slate-50 p-6 rounded-3xl border border-slate-200/90 space-y-5">
          {/* Header of selected buyer */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                  {selectedBuyer.id}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck size={12} /> {selectedBuyer.rating}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-950 mt-1">
                {selectedBuyer.name}
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                {selectedBuyer.city}, {selectedBuyer.country} • Discharge Port: <strong className="text-slate-900">{selectedBuyer.port}</strong>
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Next Shipment</span>
              <strong className="text-sm font-black text-red-600">{selectedBuyer.nextShipmentDate}</strong>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-2xl border border-slate-200">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">FOB Export Run</span>
              <p className="text-base font-black text-slate-900 mt-0.5">{selectedBuyer.totalFobUsd}</p>
              <span className="text-[10px] text-emerald-600 font-bold">{selectedBuyer.avgFobPrice}</span>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Pcs Sourced</span>
              <p className="text-base font-black text-slate-900 mt-0.5">{selectedBuyer.totalVolumePcs.toLocaleString()}</p>
              <span className="text-[10px] text-slate-500 font-medium">Garment Pieces</span>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Credit Standing</span>
              <p className="text-base font-black text-slate-900 mt-0.5">{selectedBuyer.creditLimit}</p>
              <span className="text-[10px] text-blue-600 font-bold">100% Backed</span>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">SLA Precision</span>
              <p className="text-base font-black text-emerald-600 mt-0.5">{selectedBuyer.onTimeDeliveryRate}</p>
              <span className="text-[10px] text-slate-500 font-medium">Zero Delays</span>
            </div>
          </div>

          {/* Sourcing Specifications & Commercial Terms */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <h5 className="font-black text-slate-900 uppercase text-[11px] flex items-center gap-1.5">
              <Sparkles size={13} className="text-red-600" />
              <span>Sourcing Profile & Commercial Agreement</span>
            </h5>
            <div className="space-y-1.5 text-slate-700">
              <p>
                <strong className="text-slate-900">Key Apparel Categories:</strong> {selectedBuyer.keyProducts}
              </p>
              <p>
                <strong className="text-slate-900">Payment & Bank Terms:</strong> {selectedBuyer.paymentTerms}
              </p>
              <p>
                <strong className="text-slate-900">Buyer Representative:</strong> {selectedBuyer.contactPerson} ({selectedBuyer.contactEmail})
              </p>
            </div>
          </div>

          {/* Fast Direct Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-bold">
              Instant Actions for {selectedBuyer.name.split(' ')[0]}:
            </span>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onDraftInvoiceForBuyer && onDraftInvoiceForBuyer(selectedBuyer)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <FileText size={14} />
                <span>Create New Invoice</span>
              </button>

              <button
                type="button"
                onClick={() => onGenerateLabelForBuyer && onGenerateLabelForBuyer(selectedBuyer)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Package size={14} />
                <span>Shipping Label</span>
              </button>

              <button
                type="button"
                onClick={() => onSchedulePickupForBuyer && onSchedulePickupForBuyer(selectedBuyer)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Truck size={14} />
                <span>Schedule Pickup</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerSourcingIntelligence;
