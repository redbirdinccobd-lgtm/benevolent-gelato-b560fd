import React, { useRef } from 'react';
import { Printer, Download, Ship, User, MapPin, Calendar, CheckCircle2, FileText, Anchor, ArrowRight, TrendingUp } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ShipmentProfile, ShipmentNote } from '../types';

interface ShipmentSummaryReportProps {
  shipment: ShipmentProfile;
}

export const ShipmentSummaryReport: React.FC<ShipmentSummaryReportProps> = ({ shipment }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const totalQuantity = shipment.items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 0;
  const totalCartons = shipment.items?.reduce((sum, item) => sum + (Number(item.cartonNumber) || Math.ceil((Number(item.quantity) || 1000) / 40)), 0) || 0;

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm animate-fade-in no-print">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Shipment Summary Report
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
              Live Verified
            </span>
          </h2>
          <p className="text-slate-500 font-medium leading-tight mt-1">Official export logistics summary and audit trail for {shipment.id}.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-slate-900/20 active:scale-95"
          >
            <Printer size={16} />
            Print Report
          </button>
        </div>
      </div>

      {/* Actual Printable Content */}
      <div 
        ref={printRef}
        className="print:p-0 print:m-0 print:w-full bg-white print:text-black font-sans"
      >
        {/* Printable Header */}
        <div className="hidden print:flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-950 uppercase tracking-tight">RED BIRD INTERNATIONAL</h1>
            <p className="text-xs font-bold text-slate-600 tracking-wider">GLOBAL TRADE & LOGISTICS ADVISORY</p>
            <p className="text-[10px] mt-2 max-w-xs text-slate-500">
              Plot-100, Majar Chow Road, Uttarkhan Majhar, Uttarkhan, Dhaka-1230, Bangladesh
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-black uppercase mb-1">SHIPMENT SUMMARY</h2>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-[10px] font-bold text-slate-500">Document No:</span>
              <span className="text-sm font-black text-slate-900">{shipment.id}</span>
            </div>
            <div className="flex items-center gap-2 justify-end mt-1">
              <span className="text-[10px] font-bold text-slate-500">Date Issued:</span>
              <span className="text-sm font-bold text-slate-900">{new Date().toLocaleDateString('en-GB')}</span>
            </div>
          </div>
        </div>

        {/* Top Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:grid-cols-3 print:gap-4">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 print:bg-white print:border-slate-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-600 rounded-xl text-white print:text-black">
                <User size={18} />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Buyer Entity</h4>
            </div>
            <p className="text-lg font-black text-slate-900 leading-tight">{shipment.buyerName}</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">{shipment.buyerAddress}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Tel: {shipment.buyerPhone}</p>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 print:bg-white print:border-slate-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-600 rounded-xl text-white print:text-black">
                <Anchor size={18} />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Logistics Hubs</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin size={12} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Loading</p>
                  <p className="text-sm font-black text-slate-900">{shipment.portOfLoading || 'Chittagong Port (BDCGP)'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ArrowRight size={12} className="text-slate-400 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Discharge</p>
                  <p className="text-sm font-black text-slate-900">{shipment.portOfDischarge || 'Busan Port (KRPUS)'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 print:bg-white print:border-slate-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-600 rounded-xl text-white print:text-black">
                <Calendar size={18} />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Milestones</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Ship Date</span>
                <span className="text-sm font-black text-slate-900">{shipment.shipmentDate || shipment.issueDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                  shipment.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 
                  shipment.status === 'Shipped' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {shipment.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">EXP No</span>
                <span className="text-sm font-black text-slate-900 font-mono tracking-tighter">{shipment.expNumber || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Details Table */}
        <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 print:border-slate-400 print:rounded-none">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white print:bg-slate-100 print:text-black">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Item Description</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Style / Color</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Quantity</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Cartons</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-slate-300">
              {shipment.items?.map((item, idx) => (
                <tr key={idx} className="bg-white hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-900">{item.itemName}</p>
                    <p className="text-[10px] text-slate-500 font-medium">HS Code: 6109.10.00 | Made in Bangladesh</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="text-sm font-bold text-slate-700">{item.styleNumber}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black">{item.color}</p>
                  </td>
                  <td className="px-6 py-4 text-center font-black text-slate-900">{Number(item.quantity).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-700">{item.cartonNumber}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 print:bg-white font-black">
                <td colSpan={2} className="px-6 py-5 text-right text-xs uppercase tracking-widest text-slate-500">Aggregated Totals:</td>
                <td className="px-6 py-5 text-center text-lg text-red-600">{totalQuantity.toLocaleString()} PCS</td>
                <td className="px-6 py-5 text-right text-lg text-slate-900">{totalCartons} CTNS</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* History Audit Trail */}
        <div className="mb-8">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" />
            Verified Audit Trail & Operational Events
          </h4>
          <div className="space-y-3">
            {shipment.notes?.slice(-5).map((note, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-start gap-4 print:border-slate-200">
                <div className="w-20 shrink-0 text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase">
                    {new Date(note.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                    {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="w-px h-10 bg-slate-100 self-stretch print:bg-slate-300"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-widest border border-slate-200">
                      {note.category}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">By {note.author}</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">{note.content}</p>
                </div>
              </div>
            ))}
            {(!shipment.notes || shipment.notes.length === 0) && (
              <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-xs font-medium">
                No historical events logged for this shipment.
              </div>
            )}
          </div>
        </div>

        {/* Printable Footer */}
        <div className="mt-auto pt-8 border-t border-slate-200 grid grid-cols-2 gap-12 items-end">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm">
              <QRCodeSVG value={`${window.location.origin}/#verify?id=${shipment.id}`} size={64} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-900 uppercase tracking-tight">Security Document Verification</p>
              <p className="text-[8px] text-slate-500 max-w-[200px] mt-0.5 leading-tight">
                Scan QR code to verify this shipment summary directly on the Red Bird Global Trade Platform. This is a computer-generated official summary.
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="h-10 border-b border-slate-900 mb-2 flex items-end justify-center">
               <span className="text-sm font-bold italic text-slate-800 opacity-50">Authorized Signature</span>
            </div>
            <p className="text-[10px] font-black uppercase text-slate-900 tracking-wider">Logistics Director</p>
            <p className="text-[8px] text-slate-500 uppercase">RED BIRD INTERNATIONAL</p>
          </div>
        </div>

        <div className="mt-6 text-center">
           <p className="text-[7px] text-slate-300 font-mono uppercase tracking-[0.3em]">
             AUTHENTICATED EXPORT LOGISTICS SUMMARY • RED BIRD INTERNATIONAL DHAKA • ISO 9001:2015 COMPLIANT
           </p>
        </div>
      </div>
    </div>
  );
};

export default ShipmentSummaryReport;
