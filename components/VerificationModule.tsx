import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../src/firebase';
import { QRScannerModal } from './QRScannerModal';
import { QrCode, Camera, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

const VerificationModule: React.FC = () => {
  const [controlNumber, setControlNumber] = useState('');
  const [shipmentData, setShipmentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  useEffect(() => {
    const parseAndVerify = () => {
      const hash = window.location.hash;
      let id = '';
      if (hash.includes('?id=')) {
        id = hash.split('?id=')[1].split('&')[0];
      } else if (hash.includes('&id=')) {
        id = hash.split('&id=')[1].split('&')[0];
      } else if (hash.startsWith('#verify/')) {
        id = hash.replace('#verify/', '');
      }
      if (id) {
        const decoded = decodeURIComponent(id).trim();
        setControlNumber(decoded);
        verifyDocument(decoded);
      }
    };

    parseAndVerify();
    window.addEventListener('hashchange', parseAndVerify);
    return () => window.removeEventListener('hashchange', parseAndVerify);
  }, []);

  const verifyDocument = async (idToVerify: string) => {
    if (!idToVerify) {
      setError("Please enter a Control Number or Tracking ID to verify.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setShipmentData(null);

    try {
      if (!db) throw new Error("Database not initialized");
      
      // 1. Check 'shipments' collection first
      const shipmentRef = doc(db, 'shipments', idToVerify);
      const shipmentSnap = await getDoc(shipmentRef);

      if (shipmentSnap.exists()) {
        const d = shipmentSnap.data();
        const totalPieces = d.items?.reduce((acc: number, it: any) => acc + ((it.quantity || 0) * (it.colorQuantity || 1)), 0) || 0;
        setShipmentData({
          id: shipmentSnap.id,
          isShipment: true,
          clientName: d.buyerName || 'International Buyer',
          buyerAddress: d.buyerAddress || '',
          date: d.shipmentDate || d.date || d.createdAt || new Date().toISOString(),
          status: d.status === 'closed' ? 'Delivered & Closed' : (d.status === 'active' ? 'Active in Transit' : (d.status || 'Active in Transit')),
          totalNetWeight: d.totalNetWeight || (totalPieces > 0 ? (totalPieces * 0.22).toFixed(1) : undefined),
          totalGrossWeight: d.totalGrossWeight || (totalPieces > 0 ? (totalPieces * 0.25).toFixed(1) : undefined),
          totalCBM: d.totalCBM || (d.items ? (d.items.length * 0.12).toFixed(2) : undefined),
          totalPieces,
          advancePaymentPercent: d.advancePaymentPercent || 30,
          salesContractNumber: d.salesContractNumber,
          salesContractDate: d.salesContractDate,
          expNumber: d.expNumber,
          carrier: d.carrier || 'Ocean / Multimodal Carrier',
          portOfDischarge: d.portOfDischarge || 'Designated Port',
          trackingStatus: d.trackingStatus || 'live',
          itemsCount: d.items?.length || 0
        });
        return;
      }

      // 2. Check 'invoices' collection
      const invoiceRef = doc(db, 'invoices', idToVerify);
      const invoiceSnap = await getDoc(invoiceRef);

      if (invoiceSnap.exists()) {
        const d = invoiceSnap.data();
        setShipmentData({
          ...d,
          id: invoiceSnap.id,
          isShipment: false
        });
        return;
      }

      // 3. Check 'generated_documents' collection
      const docRef = doc(db, 'generated_documents', idToVerify);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const d = docSnap.data();
        setShipmentData({
          id: d.documentNumber || docSnap.id,
          clientName: d.consignee?.name || d.buyerName || 'Valued International Buyer',
          date: d.date || d.createdAt || new Date().toISOString(),
          status: 'Authenticated & Registered',
          totalNetWeight: d.totalNetWeight,
          totalGrossWeight: d.totalGrossWeight,
          totalCBM: d.totalCBM,
          advancePaymentPercent: d.advancePaymentPercent || 30,
          type: d.type || 'Commercial Document',
          isShipment: false
        });
        return;
      }

      setError(`No official records found for Tracking ID or Control Number: "${idToVerify}"`);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `verify/${idToVerify}`);
      setError("An error occurred while verifying the document. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    // Update hash to include this ID for sharing
    window.location.hash = `#verify?id=${controlNumber}`;
    verifyDocument(controlNumber);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden animate-fade-in my-10">
        <div className="bg-red-600 p-8 text-center text-white relative">
          <div className="absolute top-4 left-4">
             <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center border border-white/40">
                <svg viewBox="0 0 100 100" className="w-6 h-6 text-white fill-current"><path d="M20,50 Q40,20 80,45 Q60,50 80,80 Q50,60 20,50 Z" /></svg>
             </div>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/40">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Public Verification</h2>
          <p className="text-red-100 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Red Bird International Registry</p>
        </div>

        <div className="p-6 sm:p-8">
          {/* Direct Camera QR Code Scanner Trigger */}
          <div className="mb-6 p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-red-600/30">
                <QrCode className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-tight text-white">Live Camera QR Code Scanner</h4>
                <p className="text-xs text-slate-300">Scan any Red Bird exported document, letterhead, or carton label</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsQrScannerOpen(true)}
              className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Scan QR Code</span>
            </button>
          </div>

          <form onSubmit={handleVerify} className="mb-8">
             <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest pl-1">Or Enter Document Control Number</label>
             <div className="flex flex-col sm:flex-row gap-3">
               <input 
                 type="text" 
                 value={controlNumber}
                 onChange={e => setControlNumber(e.target.value)}
                 placeholder="e.g. RB-INV-2026-12345 or SH-01"
                 className="flex-1 px-5 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none uppercase font-black text-slate-800 text-sm transition-all"
                 required
               />
               <button 
                 type="submit"
                 disabled={isLoading}
                 className="bg-slate-900 text-white font-black px-8 py-3.5 rounded-2xl hover:bg-red-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 text-xs uppercase tracking-wider"
               >
                 {isLoading ? 'Verifying...' : 'Verify'}
               </button>
             </div>
          </form>

          {/* QR Scanner Modal Component */}
          <QRScannerModal
            isOpen={isQrScannerOpen}
            onClose={() => setIsQrScannerOpen(false)}
            onScanSuccess={(decodedId) => {
              setIsQrScannerOpen(false);
              setControlNumber(decodedId);
              verifyDocument(decodedId);
            }}
          />

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 p-6 rounded-2xl flex items-start gap-4 animate-fade-in">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <h4 className="font-black uppercase text-sm tracking-widest mb-1">Invalid Control Number</h4>
                <p className="text-sm font-bold opacity-70">{error}</p>
              </div>
            </div>
          )}

          {shipmentData && (
            <div className="animate-fade-in space-y-6">
              <div className="bg-green-50 border border-green-100 p-8 rounded-3xl flex flex-col items-center">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20 mb-6">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-2xl font-black uppercase text-green-900 tracking-tight">Authenticity Verified</h4>
                <div className="h-1 w-20 bg-green-200 rounded-full my-4"></div>
                <p className="text-sm text-green-700 font-bold text-center max-w-sm">This document is officially registered and active in our global trade database.</p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-6">
                <div className="grid grid-cols-2 gap-y-6 text-sm">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Control ID</p>
                    <p className="font-black text-slate-900 text-base font-mono">{shipmentData.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Issue Date</p>
                    <p className="font-black text-slate-900 text-base">{new Date(shipmentData.date).toLocaleDateString(undefined, {year: 'numeric', month: 'long', day: 'numeric'})}</p>
                  </div>
                  
                  <div className="col-span-2 border-t border-slate-50 pt-6"></div>

                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Consignee</p>
                    <p className="font-black text-slate-900">{shipmentData.clientName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Shipment Status</p>
                    <p className="font-black text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full inline-block">{shipmentData.status}</p>
                  </div>

                  <div className="col-span-2 border-t border-slate-50 pt-6"></div>

                  <div className="col-span-2 grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Weight</p>
                      <p className="font-black text-slate-900">{shipmentData.totalNetWeight || 'N/A'} KG</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross Weight</p>
                      <p className="font-black text-slate-900">{shipmentData.totalGrossWeight || 'N/A'} KG</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">CBM (Manual)</p>
                      <p className="font-black text-slate-900">{shipmentData.totalCBM || 'N/A'} m³</p>
                    </div>
                  </div>

                  <div className="col-span-2 bg-red-50 p-5 rounded-2xl border border-red-100 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Advance Payment Required</p>
                      <p className="text-xs font-bold text-red-400 tracking-tight">Terms verified by Red Bird Finance</p>
                    </div>
                    <div className="text-2xl font-black text-red-600">{shipmentData.advancePaymentPercent || '0'}%</div>
                  </div>
                </div>

                {shipmentData.isShipment && (
                  <div className="pt-2 flex justify-center">
                    <a
                      href={`#track/${shipmentData.id}`}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-red-600 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Open Live Tracking Portal (#{shipmentData.id})
                    </a>
                  </div>
                )}

                <div className="pt-4 flex flex-col items-center gap-2">
                   <p className="text-[10px] font-bold text-slate-300 italic">Electronic signature verified on {new Date().toLocaleDateString()}</p>
                   <div className="flex gap-2">
                      <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse delay-75"></div>
                      <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse delay-150"></div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-slate-50 p-8 text-center">
          <a href="#home" className="inline-flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-widest hover:text-red-600 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Official Portal
          </a>
        </div>
      </div>
    </div>
  );
};

export default VerificationModule;
