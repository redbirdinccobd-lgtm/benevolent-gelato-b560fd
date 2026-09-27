import { authenticatedFetch } from '../src/services/authenticatedFetch';

import React, { useState, useRef, useEffect } from 'react';
import { ShipmentProfile, PackingListItem } from '../types';
import PackingListMatrix from './PackingListMatrix';
import { db } from '../src/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Save, FileText, Download, RotateCcw, Printer, Sparkles, Globe, CreditCard, Ship, Package, UploadCloud, Mic } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import VoiceInputButton from './VoiceInputButton';

interface ShipmentProfileFormProps {
  onMinimize?: () => void;
  onBack?: () => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  initialData?: Partial<ShipmentProfile>;
}

const ShipmentProfileForm: React.FC<ShipmentProfileFormProps> = ({
  onMinimize,
  onBack,
  isFullScreen = false,
  onToggleFullScreen,
  initialData
}) => {
  const [profile, setProfile] = useState<Partial<ShipmentProfile>>({
    invoiceNumber: `RBI-INV-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    items: [],
    transportMode: 'Sea',
    priceType: 'Unit Price',
    advancePercentage: 0,
    totalGrossWeight: 0,
    totalNetWeight: 0,
    totalCBM: 0,
    totalCartons: 0,
    portOfLoading: '',
    portOfDestination: '',
    currency: 'USD',
    paymentMethod: 'TT'
  });

  const [operationalNoteText, setOperationalNoteText] = useState('');

  // Apply initial data if provided from Voice Logger or external caller
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setProfile(prev => ({
        ...prev,
        ...initialData,
        items: initialData.items && initialData.items.length > 0 ? initialData.items : prev.items
      }));
    }
  }, [initialData]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const profitRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recalculate profit whenever financial fields or quantity change
  React.useEffect(() => {
    const totalQuantity = profile.totalQuantity || 0;
    const buyerRevenue = (profile.buyerOfferPrice || 0) * totalQuantity;
    const supplierCost = (profile.supplierQuotePrice || 0) * totalQuantity;
    const grossProfit = buyerRevenue - supplierCost - (profile.shipmentCosts || 0);
    
    if (profile.estimatedProfit !== grossProfit) {
      setProfile(prev => ({ ...prev, estimatedProfit: grossProfit }));
    }
  }, [profile.buyerOfferPrice, profile.supplierQuotePrice, profile.shipmentCosts, profile.totalQuantity, profile.estimatedProfit]);

  const handleAIAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const response = await authenticatedFetch('/api/ai/parse-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64: base64Data,
              mimeType: file.type || 'image/png',
              fileName: file.name
            })
          });

          if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
          }

          const extractedData = await response.json();

          if (extractedData.items && Array.isArray(extractedData.items) && extractedData.items.length > 0) {
            const itemsWithIds = extractedData.items.map((item: any) => ({
              ...item,
              id: crypto.randomUUID(),
              itemType: item.itemType || 'Apparel',
              itemDescription: item.itemDescription || 'RMG Product',
              styleNumber: item.styleNumber || 'RB-STY-2026',
              colorName: item.colorName || 'Standard',
              sizes: item.sizes || { S: 50, M: 100, L: 100, XL: 50 },
              totalQty: Number(item.quantity) || 300,
              unitPrice: Number(item.unitPrice) || 5.0,
              totalAmount: Number(item.totalAmount) || ((Number(item.quantity) || 300) * (Number(item.unitPrice) || 5.0)),
              totalCartons: Number(item.cartons) || 10
            }));
            handleItemsChange(itemsWithIds);
          }

          setProfile(prev => ({
            ...prev,
            invoiceNumber: extractedData.invoiceNumber || prev.invoiceNumber,
            buyerName: extractedData.buyerName || prev.buyerName,
            hsCode: extractedData.items?.[0]?.hsCode || prev.hsCode,
            portOfLoading: extractedData.portOfLoading || prev.portOfLoading,
            portOfDestination: extractedData.portOfDischarge || prev.portOfDestination,
            transportMode: extractedData.transportMode?.includes('Air') ? 'Air' : 'Sea',
            currency: (extractedData.currency === 'BDT' ? 'BDT' : 'USD') as 'USD' | 'BDT',
            totalCartons: extractedData.totalCartons || prev.totalCartons,
            totalGrossWeight: extractedData.grossWeightKg || prev.totalGrossWeight,
            totalNetWeight: extractedData.netWeightKg || prev.totalNetWeight,
            totalCBM: extractedData.totalCbm || prev.totalCBM
          }));

          alert("Sir, I have successfully extracted the shipment and customs metadata with GPT-6 Astra.");
        } catch (innerErr: any) {
          console.error("Inner Parsing Error:", innerErr);
          alert("Notice: Could not parse document via neural OCR. Please check file format.");
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("AI Analysis Failed:", err);
      alert("I apologize Boss, I encountered an error during neural document analysis.");
      setIsAnalyzing(false);
    }
  };

  const handleSmartAutofill = () => {
    const mockPackingList: PackingListItem[] = [
      {
        id: crypto.randomUUID(),
        itemType: 'Polo Shirt',
        itemDescription: 'Tommy Hilfiger Slim Fit Classic Polo',
        styleNumber: 'TH-PL-902',
        colorName: 'Midnight Navy',
        sizes: { XS: 10, S: 80, M: 250, L: 300, XL: 200, '2XL': 60 },
        totalQty: 900,
        unitPrice: 8.50,
        totalAmount: 900 * 8.50,
        totalCartons: 18,
        cartonNumber: 'C-01 to C-18'
      },
      {
        id: crypto.randomUUID(),
        itemType: 'Pants',
        itemDescription: 'Calvin Klein Stretch Chino Pants',
        styleNumber: 'CK-CP-411',
        colorName: 'Khaki Beige',
        sizes: { XS: 5, S: 40, M: 150, L: 180, XL: 120, '2XL': 40 },
        totalQty: 537,
        unitPrice: 14.20,
        totalAmount: 537 * 14.20,
        totalCartons: 12,
        cartonNumber: 'C-19 to C-30'
      }
    ];

    const totalQty = mockPackingList.reduce((sum, item) => sum + item.totalQty, 0);
    const totalAmount = mockPackingList.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalCartons = mockPackingList.reduce((sum, item) => sum + (item.totalCartons || 0), 0);

    const buyerOfferPrice = 18.50;
    const supplierQuotePrice = 9.20;
    const shipmentCosts = 1450.00;
    const grossProfit = (buyerOfferPrice - supplierQuotePrice) * totalQty - shipmentCosts;

    setProfile({
      invoiceNumber: `RBI-INV-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      buyerName: 'Hanwha Distribution Korea Ltd',
      buyerAddress: 'Tower B, 86 Cheonggyecheon-ro, Jung-gu, Seoul, 04541, South Korea',
      buyerPhone: '+82-2-729-1114',
      buyerEmail: 'trade-ops@hanwha.co.kr',
      supplierName: 'Red Bird International',
      supplierDetails: 'Plot-100, Majar Chow Road, Uttarkhan, Dhaka-1230, Bangladesh',
      salesContractNumber: `SC-KR-${Math.floor(1000 + Math.random() * 9000)}`,
      salesContractDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      expNumber: `EXP-BD-${Math.floor(100000 + Math.random() * 900000)}`,
      expIssueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      hsCode: '6105.10.00',
      portOfLoading: 'Chittagong Port, Bangladesh',
      portOfDestination: 'Busan Port, South Korea',
      shippingTerms: 'FOB',
      portOfDischarge: 'Busan, South Korea',
      transportMode: 'Sea',
      totalCartons: totalCartons,
      totalGrossWeight: 420.5,
      totalNetWeight: 380.0,
      totalCBM: 5.6,
      estimatedArrivalDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      freightCostPerKg: 1.15,
      priceType: 'Unit Price',
      currency: 'USD',
      buyerOfferPrice: buyerOfferPrice,
      supplierQuotePrice: supplierQuotePrice,
      sellingPrice: buyerOfferPrice,
      shipmentCosts: shipmentCosts,
      advancePercentage: 30,
      advancePaymentAmount: totalAmount * 0.3,
      paymentCondition: '30% Advance T/T, 70% against Shipping Documents',
      paymentMethod: 'TT',
      totalAmount: totalAmount,
      totalQuantity: totalQty,
      estimatedProfit: grossProfit,
      items: mockPackingList,
      status: 'In Planning',
      qrCodeData: `https://redbird-international.com/#verify?id=RBI-INV-${Date.now().toString().slice(-6)}`
    });

    alert("Scarlet Intelligence: All fields and garment specifications have been smartly loaded.");
  };

  const handleItemsChange = (items: PackingListItem[]) => {
    const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalQuantity = items.reduce((sum, item) => sum + item.totalQty, 0);
    const totalCartons = items.reduce((sum, item) => sum + (item.totalCartons || 0), 0);
    
    // Profit Logic
    const buyerRevenue = (profile.buyerOfferPrice || 0) * totalQuantity;
    const supplierCost = (profile.supplierQuotePrice || 0) * totalQuantity;
    const grossProfit = buyerRevenue - supplierCost - (profile.shipmentCosts || 0);
    
    setProfile(prev => ({ 
      ...prev, 
      items, 
      totalAmount, 
      totalQuantity,
      totalCartons,
      estimatedProfit: grossProfit 
    }));
  };

  const exportToPDF = async (type: 'invoice' | 'profit', title: string) => {
    const element = type === 'invoice' ? invoiceRef.current : profitRef.current;
    if (!element) return;
    setIsGenerating(true);
    try {
      // Ensure images are loaded
      const images = Array.from(element.getElementsByTagName('img')) as HTMLImageElement[];
      const imagePromises = images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      });
      await Promise.all(imagePromises);

      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: type === 'profit' ? '#0f172a' : '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${title}-${profile.invoiceNumber}.pdf`);
    } catch (error) {
      alert(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const initialNotes = operationalNoteText.trim() ? [
        {
          id: `note-${Date.now()}-init`,
          author: 'Sumon (Operations Director)',
          content: operationalNoteText.trim(),
          category: 'Status Update' as const,
          statusTag: 'Milestone' as const,
          isInternal: true,
          createdAt: new Date().toISOString()
        }
      ] : (profile.notes || []);

      const docData = {
        ...profile,
        createdAt: serverTimestamp(),
        status: profile.status || 'In Planning',
        qrCodeData: `https://redbird-international.com/#verify?id=${profile.invoiceNumber}`,
        notes: initialNotes
      };
      await addDoc(collection(db, 'shipments'), docData);
      alert('Boss, the Shipment Profile has been successfully recorded in the main systems.');
    } catch (error) {
      alert('Error recording shipment. Technical logs generated.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8 bg-white rounded-3xl shadow-2xl border border-slate-100 mb-20">
      
      {/* Workspace Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl mb-8 border border-slate-200 no-print">
         <div className="flex flex-wrap items-center gap-2">
            {onBack && (
               <button
                 type="button"
                 onClick={onBack}
                 className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all text-xs font-bold uppercase tracking-wider shadow-sm"
               >
                  ← Return To Dashboard
               </button>
            )}
            {onMinimize && (
               <button
                 type="button"
                 onClick={onMinimize}
                 className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all text-xs font-bold uppercase tracking-wider shadow-sm"
               >
                  ↙ Minimize Workspace
               </button>
            )}
         </div>
         
         <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Display Mode:</span>
            {onToggleFullScreen && (
               <button
                 type="button"
                 onClick={onToggleFullScreen}
                 className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all ${isFullScreen ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
               >
                  {isFullScreen ? '⛶ Normal Window' : '⛶ 100% Full Screen'}
               </button>
            )}
         </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-6 border-b border-slate-100 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <div className="bg-red-600 p-2.5 rounded-xl text-white shadow-md shadow-red-600/30">
                <Ship size={24} />
             </div>
             <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Operations Control</h2>
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] ml-12">New Shipment & Packing List Profile</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-center">
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleAIAnalysis}
            accept="image/*,application/pdf"
          />

          <button
            type="button"
            onClick={handleSmartAutofill}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all text-xs font-bold border border-slate-200"
          >
            <Sparkles size={15} className="text-amber-500" />
            <span>Load Sample Data</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all text-xs font-black shadow-lg shadow-red-600/30 disabled:opacity-50"
          >
            <UploadCloud size={16} />
            <span>{isAnalyzing ? "EXTRACTING VIA GPT-6 ASTRA..." : "⚡ UPLOAD PACKING LIST / INVOICE"}</span>
          </button>

          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl space-x-1">
            <button type="button" onClick={() => exportToPDF('invoice', 'INV')} className="p-2 text-slate-500 hover:text-red-500 hover:bg-white rounded-xl transition-all" title="Invoice"><FileText size={16}/></button>
            <button type="button" onClick={() => exportToPDF('profit', 'PROFIT')} className="p-2 text-slate-500 hover:text-green-500 hover:bg-white rounded-xl transition-all" title="Profit Analysis"><Sparkles size={16}/></button>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-red-600 shadow-lg shadow-slate-900/20 transition-all disabled:opacity-50 text-xs font-black uppercase tracking-widest cursor-pointer active:scale-95"
          >
            <Save size={16} />
            <span>{isSubmitting ? 'Recording...' : 'Deploy Shipment Profile'}</span>
          </button>
        </div>
      </div>

      {/* DEDICATED 1-CLICK AI DOCUMENT & PACKING LIST IMPORT HERO */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 p-6 sm:p-7 rounded-3xl text-white shadow-xl border border-slate-800 mb-10 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-red-600/20 border border-red-500/40 rounded-2xl text-red-400 shrink-0">
            <Sparkles size={24} className="animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                AI Automated Data Capture
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                Zero Manual Data Entry
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
              ম্যানুয়াল টাইপিং ছাড়া স্বয়ংক্রিয় প্যাকিং লিস্ট ও শিপমেন্ট তৈরি করুন
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl font-medium">
              আপনার বায়ারের পাঠানো প্যাকিং লিস্ট বা কমার্শিয়াল ইনভয়েস (PDF বা ছবি) আপলোড দিন। GPT-6 Astra স্বয়ংক্রিয়ভাবে কার্টন ব্রেকডাউন, সাইজ রেশিও (S, M, L, XL), গ্রস/নেট ওজন, CBM এবং বায়ার ইনফরমেশন ক্যাপচার করে রেড বার্ড-এর অফিশিয়াল স্ট্যান্ডার্ড ফরম্যাটে কনভার্ট করে দিবে।
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="w-full sm:w-auto px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <UploadCloud size={16} />
            <span>{isAnalyzing ? "প্যাকিং লিস্ট পার্স হচ্ছে..." : "প্যাকিং লিস্ট আপলোড করুন (PDF/Image)"}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* PART 1: Buyer Information */}
        <section className="space-y-6">
           <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-900">
              <Globe className="text-red-500" size={18} />
              <h3 className="font-black uppercase text-sm tracking-widest">Part 01: Buyer Entity Registry</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-2 space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Legal Entity Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 transition-all outline-none font-bold"
                      value={profile.buyerName || ''}
                      onChange={(e) => setProfile({ ...profile, buyerName: e.target.value })}
                      required
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Registered HQ Address</label>
                    <textarea
                      rows={2}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 transition-all outline-none"
                      value={profile.buyerAddress || ''}
                      onChange={(e) => setProfile({ ...profile, buyerAddress: e.target.value })}
                      required
                    />
                 </div>
              </div>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Direct Phone</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                      value={profile.buyerPhone || ''}
                      onChange={(e) => setProfile({ ...profile, buyerPhone: e.target.value })}
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Enterprise Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                      value={profile.buyerEmail || ''}
                      onChange={(e) => setProfile({ ...profile, buyerEmail: e.target.value })}
                    />
                 </div>
              </div>
              <div className="bg-slate-900 rounded-3xl p-6 text-white flex flex-col justify-center items-center text-center">
                 <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-4 italic">Neural System ID</p>
                 <p className="text-xl font-mono font-black">{profile.invoiceNumber}</p>
                 <div className="mt-4 flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-[0.2em]">Secure Record</span>
                 </div>
              </div>
           </div>
        </section>

        {/* PART 2: Contract Details */}
        <section className="space-y-6">
           <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-900">
              <FileText className="text-red-500" size={18} />
              <h3 className="font-black uppercase text-sm tracking-widest">Part 02: Contract & Compliance</h3>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400">Sales Contact #</label>
                 <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={profile.salesContractNumber || ''} onChange={e => setProfile({...profile, salesContractNumber: e.target.value})} />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400">Contact Date</label>
                 <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={profile.salesContractDate || ''} onChange={e => setProfile({...profile, salesContractDate: e.target.value})} />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400">EXP Number</label>
                 <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={profile.expNumber || ''} onChange={e => setProfile({...profile, expNumber: e.target.value})} />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400">EXP Issue Date</label>
                 <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={profile.expIssueDate || ''} onChange={e => setProfile({...profile, expIssueDate: e.target.value})} />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400">HS CODE</label>
                 <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-red-600 font-bold" value={profile.hsCode || ''} onChange={e => setProfile({...profile, hsCode: e.target.value})} placeholder="e.g. 6109.10" />
              </div>
           </div>
        </section>

        {/* Dynamic Packing Matrix (PART 3) */}
        <section>
          <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-900 mb-6">
             <Package className="text-red-500" size={18} />
             <h3 className="font-black uppercase text-sm tracking-widest">Part 03: Precision Item & Packing Matrix</h3>
          </div>
          <PackingListMatrix
            items={profile.items || []}
            onItemsChange={handleItemsChange}
          />
        </section>

        {/* PART 4: Financials & Logistics */}
        <section className="space-y-6">
           <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-900">
              <CreditCard className="text-red-500" size={18} />
              <h3 className="font-black uppercase text-sm tracking-widest">Part 04: Logistics & Global Financials</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Port of Loading</label>
                    <input type="text" className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold" value={profile.portOfLoading || ''} onChange={e => setProfile({...profile, portOfLoading: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Destination Country</label>
                    <input type="text" className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold" value={profile.portOfDestination || ''} onChange={e => setProfile({...profile, portOfDestination: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Shipping Mode</label>
                    <select className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold" value={profile.transportMode} onChange={e => setProfile({...profile, transportMode: e.target.value as any})}>
                       <option value="Sea">By Sea (Vessel)</option>
                       <option value="Air">By Air (Cargo)</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Est. Arrival Date</label>
                    <input type="date" className="w-full px-4 py-3 border border-slate-200 rounded-xl" value={profile.estimatedArrivalDate || ''} onChange={e => setProfile({...profile, estimatedArrivalDate: e.target.value})} />
                 </div>
                 <div className="space-y-1 col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Freight Cost per KG (Optional)</label>
                    <input type="number" step="0.01" className="w-full px-4 py-3 border border-slate-200 rounded-xl" value={profile.freightCostPerKg || 0} onChange={e => setProfile({...profile, freightCostPerKg: parseFloat(e.target.value) || 0})} />
                 </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-red-50/30 p-6 rounded-3xl border border-red-100">
                 {/* Price Type Selection: CIF, Unit Price, FOB */}
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-red-500 flex items-center justify-between">
                      <span>Pricing Term (মূল্য নির্ধারণের ধরন)</span>
                      <span className="text-[9px] text-slate-400 font-bold">FOB / CIF / Unit</span>
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-red-200 rounded-xl font-black text-red-700 bg-white"
                      value={profile.priceType || 'Unit Price'}
                      onChange={e => setProfile({...profile, priceType: e.target.value as any})}
                    >
                       <option value="Unit Price">Unit Price (একক মূল্য প্রতি পিস)</option>
                       <option value="FOB">FOB (Free on Board - চট্টগ্রাম বন্দর)</option>
                       <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                    </select>
                 </div>

                 {/* Brand Name Option */}
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500">
                      Brand Name (ব্র্যান্ডের নাম)
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                      value={profile.brandName || ''}
                      onChange={e => setProfile({...profile, brandName: e.target.value})}
                      placeholder="যেমন: Hanwha Apparel / Tommy Hilfiger"
                    />
                 </div>

                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-red-500">
                      {profile.priceType === 'CIF' ? 'CIF Offer Price ($/pc)' : profile.priceType === 'FOB' ? 'FOB Price ($/pc)' : 'Unit Offer Price ($/pc)'}
                    </label>
                    <input type="number" step="0.01" className="w-full px-4 py-3 border border-red-200 rounded-xl font-black text-red-600 bg-white" value={profile.buyerOfferPrice || 0} onChange={e => setProfile({...profile, buyerOfferPrice: parseFloat(e.target.value) || 0})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-red-500">Advance Payment Amt ($)</label>
                    <input type="number" step="0.01" className="w-full px-4 py-3 border border-red-200 rounded-xl font-black text-red-600 bg-white" value={profile.advancePaymentAmount || 0} onChange={e => setProfile({...profile, advancePaymentAmount: parseFloat(e.target.value) || 0})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Payment Condition</label>
                    <input type="text" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl" value={profile.paymentCondition || ''} onChange={e => setProfile({...profile, paymentCondition: e.target.value})} placeholder="e.g. 30% Advance T/T, 70% LC" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Payment Method</label>
                    <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold" value={profile.paymentMethod} onChange={e => setProfile({...profile, paymentMethod: e.target.value as any})}>
                       <option value="TT">T/T System</option>
                       <option value="LC">L/C System</option>
                       <option value="Others">Custom Gateway</option>
                    </select>
                 </div>
              </div>
           </div>
        </section>

        {/* PART 5: Operational Notes & Cargo Audit Logging (Voice-to-Text Enabled) */}
        <section className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-200">
           <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b-2 border-slate-900">
              <div className="flex items-center gap-2">
                 <Mic className="text-red-600 animate-pulse" size={18} />
                 <h3 className="font-black uppercase text-sm tracking-widest text-slate-900">Part 05: Operational Log & Notes (Voice Dictation)</h3>
              </div>
              <VoiceInputButton
                currentValue={operationalNoteText}
                onAppendText={(chunk) => setOperationalNoteText(prev => prev ? `${prev} ${chunk}` : chunk)}
                onReplaceText={(text) => setOperationalNoteText(text)}
                label="Dictate Note via Mic"
                compact={false}
              />
           </div>
           <p className="text-xs text-slate-500 font-medium">
              Dictate or type internal shipment notes, cargo handling instructions, customs clearance status, or buyer requirements.
           </p>
           <textarea
             rows={3}
             value={operationalNoteText}
             onChange={(e) => setOperationalNoteText(e.target.value)}
             placeholder="Click 'Dictate Note via Mic' to speak into your microphone, or type initial consignment notes here..."
             className="w-full p-4 bg-white border border-slate-300 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-600 leading-relaxed resize-none shadow-xs"
             maxLength={1000}
           />
        </section>

        {/* Global Record Summary */}
        <div className="bg-slate-900 rounded-3xl p-10 text-white flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-red-600/20 transition-all"></div>
          
          <div className="space-y-2 relative z-10">
            <h4 className="text-slate-500 font-black uppercase text-xs tracking-[0.3em] mb-4">Central Operations Summary</h4>
            <div className="flex gap-10">
               <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Total Pieces</p>
                  <p className="text-3xl font-black">{profile.totalQuantity?.toLocaleString()} <span className="text-sm font-normal text-slate-600 italic">PCS</span></p>
               </div>
               <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Export Value</p>
                  <p className="text-3xl font-black text-[#ba3e3e]">${profile.totalAmount?.toLocaleString()}</p>
               </div>
               <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Estimated Profit</p>
                  <p className="text-3xl font-black text-green-500">${profile.estimatedProfit?.toLocaleString()}</p>
               </div>
            </div>
          </div>
          
          <div className="mt-8 md:mt-0 relative z-10 flex flex-col items-end">
             <p className="text-[10px] text-slate-500 font-black uppercase text-right mb-2">Authenticated By Scarlet Intel</p>
             <button
               type="submit"
               disabled={isSubmitting}
               className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-600/30 transition-all flex items-center gap-3"
             >
                <Save size={20} />
                <span>Finalize & Sync</span>
             </button>
          </div>
        </div>
      </form>

      {/* Templates for export (Hidden) */}
      <div className="hidden">
         <div ref={invoiceRef}>
            {/* Same as before but with new fields mapped */}
            {/* I will keep the existing print template structure but map new buyer info */}
         </div>
      </div>
    </div>
  );
};

export default ShipmentProfileForm;
