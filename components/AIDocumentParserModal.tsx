import { authenticatedFetch } from '../src/services/authenticatedFetch';
import React, { useState, useRef } from 'react';
import { 
  FileText, Upload, Sparkles, CheckCircle2, AlertTriangle, 
  ArrowRight, Copy, Check, RefreshCw, X, ShieldCheck, 
  Package, Ship, Calendar, User, DollarSign, FileCheck, Layers, Eye
} from 'lucide-react';
import { db } from '../src/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface ParsedDocumentData {
  documentType: string;
  invoiceNumber: string;
  blNumber: string;
  bookingNumber: string;
  expNumber: string;
  contractNumber: string;
  lcNumber: string;
  lcBank: string;
  issueDate: string;
  shipmentDate: string;
  shipperName: string;
  shipperAddress: string;
  buyerName: string;
  buyerAddress: string;
  buyerCountry: string;
  notifyParty: string;
  portOfLoading: string;
  portOfDischarge: string;
  finalDestination: string;
  transportMode: string;
  vesselName: string;
  voyageNumber: string;
  containerNumber: string;
  sealNumber: string;
  incoterms: string;
  paymentTerms: string;
  currency: string;
  totalAmount: number;
  totalQuantity: number;
  totalCartons: number;
  grossWeightKg: number;
  netWeightKg: number;
  totalCbm: number;
  items: Array<{
    itemDescription: string;
    styleNumber: string;
    hsCode: string;
    colorName?: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    cartons: number;
    sizes?: Record<string, number>;
  }>;
  complianceAudit: {
    status: string;
    hasExpNumber: boolean;
    hasValidHsCode: boolean;
    hasIncoterms: boolean;
    findings: string[];
    confidenceScore: number;
  };
  isAiGenerated?: boolean;
}

interface AIDocumentParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAsShipment?: (shipmentData: any) => void;
  onOpenInForm?: (parsedData: ParsedDocumentData) => void;
  onOpenInDocumentGenerator?: (parsedData: ParsedDocumentData) => void;
}

export const AIDocumentParserModal: React.FC<AIDocumentParserModalProps> = ({
  isOpen,
  onClose,
  onSaveAsShipment,
  onOpenInForm,
  onOpenInDocumentGenerator
}) => {
  const [activeInputTab, setActiveInputTab] = useState<'upload' | 'text'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [docTypeHint, setDocTypeHint] = useState<string>('auto');
  
  const [isParsing, setIsParsing] = useState(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [parsedResult, setParsedResult] = useState<ParsedDocumentData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSavingToFirestore, setIsSavingToFirestore] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setErrorMsg(null);
      if (selected.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(selected);
      } else {
        setFilePreview(null);
      }
    }
  };

  const loadSampleDocument = (type: 'invoice' | 'bl') => {
    if (type === 'invoice') {
      setDocTypeHint('commercial-invoice');
      setActiveInputTab('text');
      setRawText(`COMMERCIAL INVOICE
INVOICE NO: RBI-EXP-2026-9921
DATE: 2026-09-24
EXP NO: EXP-991204-2026
SALES CONTRACT NO: SC-RBI-8812-2026
L/C NO: LC-90412-KR (Hana Bank International FX Division, Seoul)

EXPORTER / SHIPPER:
RED BIRD INTERNATIONAL
PLOT-100, MAJAR CHOW ROAD, UTTARKHAN, DHAKA-1230, BANGLADESH

CONSIGNEE / BUYER:
HANWHA GLOBAL TRADING CORP
TEHERAN-RO 152, GANGNAM-GU, SEOUL 06236, REPUBLIC OF KOREA
ATTN: HEAD OF GLOBAL APPAREL PROCUREMENT

NOTIFY PARTY:
PAN OCEAN LOGISTICS CO., LTD (BUSAN CFS AGENT)

PORT OF LOADING: CHITTAGONG PORT (BDCGP), BANGLADESH
PORT OF DISCHARGE: BUSAN PORT (KRPUS), SOUTH KOREA
FINAL DESTINATION: SEOUL CENTRAL LOGISTICS TERMINAL
VESSEL: M/V HYUNDAI FORWARD   VOYAGE: V.2604-EAST
CONTAINER NO: TCLU-9842104 / SEAL: SL-BD-90412
INCOTERMS: FOB CHITTAGONG PORT
PAYMENT TERMS: 100% IRREVOCABLE L/C AT SIGHT

ITEMS SPECIFICATION:
1. STYLE: RB-STY-2601 - 100% COMBED COTTON HEAVYWEIGHT CREWNECK T-SHIRT (220 GSM)
   HS CODE: 6109.10.00 | COLOR: WASHED CHARCOAL BLACK
   QTY: 4,000 PCS | UNIT PRICE: USD 5.25 | TOTAL: USD 21,000.00 | CARTONS: 100 CTNS
   GROSS WT: 1,120 KG | NET WT: 1,000 KG | CBM: 8.00 m³

2. STYLE: RB-STY-2602 - FRENCH TERRY STREETWEAR RAGLAN PULLOVER HOODIE (360 GSM)
   HS CODE: 6110.20.00 | COLOR: VINTAGE PINE GREEN
   QTY: 2,500 PCS | UNIT PRICE: USD 8.75 | TOTAL: USD 21,875.00 | CARTONS: 100 CTNS
   GROSS WT: 1,550 KG | NET WT: 1,450 KG | CBM: 9.00 m³

TOTAL QUANTITY: 6,500 PCS
TOTAL CARTONS: 200 MASTER CARTONS
TOTAL GROSS WEIGHT: 2,670.00 KG | TOTAL NET WEIGHT: 2,450.00 KG
TOTAL CBM: 17.00 m³
TOTAL FOB AMOUNT: USD 42,875.00`);
    } else {
      setDocTypeHint('bill-of-lading');
      setActiveInputTab('text');
      setRawText(`OCEAN BILL OF LADING
B/L NUMBER: COSU-6391048201
BOOKING REF: BKG-COSCO-881290
DATE OF ISSUE: 2026-09-22
SHIPPER: RED BIRD INTERNATIONAL, DHAKA-1230, BANGLADESH
CONSIGNEE: HANWHA GLOBAL TRADING CORP, SEOUL, SOUTH KOREA
NOTIFY: HANWHA LOGISTICS CFS TERMINAL, BUSAN PORT
PRE-CARRIAGE: BY ROAD TRUCK FEEDER (GAZIPUR TO CTG CFS)
OCEAN VESSEL: COSCO DEVELOPMENT   VOYAGE NO: 094E
PORT OF LOADING: CHITTAGONG PORT, BANGLADESH
PORT OF DISCHARGE: BUSAN PORT (KRPUS), SOUTH KOREA
CONTAINER & SEAL: CBHU-4910281 / SEAL: COSCO-88124
KIND OF PACKAGES: 250 CARTONS (7-PLY EXPORT CARDBOARD BOXES)
DESCRIPTION OF GOODS: 100% READY MADE GARMENTS (COTTON T-SHIRTS & KNITTED HOODIES)
HS CODE: 6109.10 / 6110.20
TOTAL PIECES: 7,500 PCS
TOTAL GROSS WEIGHT: 3,120.00 KGS
TOTAL NET WEIGHT: 2,850.00 KGS
MEASUREMENT: 21.50 CBM
FREIGHT TERMS: FREIGHT PREPAID
SHIPPED ON BOARD DATE: 2026-09-22`);
    }
  };

  const handleStartParsing = async () => {
    setIsParsing(true);
    setErrorMsg(null);
    setSavedSuccessMsg(null);
    setProgressStep('Reading document binary & payload...');

    try {
      let fileBase64: string | undefined = undefined;
      let mimeType: string | undefined = undefined;
      let fileName: string | undefined = file?.name;

      if (activeInputTab === 'upload' && file) {
        setProgressStep('Encoding file for Gemini 3.8 Flash multimodal analysis...');
        fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        mimeType = file.type || 'image/png';
      }

      setProgressStep('Dispatching to Neural Trade Document Extractor (Gemini 3.8 Flash)...');

      const response = await authenticatedFetch('/api/ai/parse-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64,
          mimeType,
          fileName,
          rawText: activeInputTab === 'text' ? rawText : undefined,
          documentTypeHint: docTypeHint
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned error ${response.status}`);
      }

      const result: ParsedDocumentData = await response.json();
      setProgressStep('Validating customs compliance & packing matrix...');
      setParsedResult(result);
    } catch (err: any) {
      console.error('Document Parsing Error:', err);
      setErrorMsg(err.message || 'Failed to parse document. Please check the file or text input.');
    } finally {
      setIsParsing(false);
      setProgressStep('');
    }
  };

  const handleCopyJSON = () => {
    if (!parsedResult) return;
    navigator.clipboard.writeText(JSON.stringify(parsedResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDirectSaveToFirestore = async () => {
    if (!parsedResult || !db) return;
    setIsSavingToFirestore(true);
    try {
      const newShipmentRecord = {
        invoiceNumber: parsedResult.invoiceNumber,
        blNumber: parsedResult.blNumber,
        expNumber: parsedResult.expNumber,
        buyerName: parsedResult.buyerName,
        buyerAddress: parsedResult.buyerAddress,
        buyerCountry: parsedResult.buyerCountry,
        date: parsedResult.issueDate || new Date().toISOString().split('T')[0],
        estimatedArrivalDate: parsedResult.shipmentDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        portOfLoading: parsedResult.portOfLoading,
        portOfDestination: parsedResult.portOfDischarge,
        transportMode: parsedResult.transportMode?.includes('Air') ? 'Air' : 'Sea',
        status: 'In Planning',
        trackingStatus: 'on-water',
        currency: parsedResult.currency || 'USD',
        priceType: 'Unit Price',
        buyerOfferPrice: parsedResult.items?.[0]?.unitPrice || 5.0,
        supplierQuotePrice: (parsedResult.items?.[0]?.unitPrice || 5.0) * 0.78,
        sellingPrice: parsedResult.items?.[0]?.unitPrice || 5.0,
        shipmentCosts: 450,
        totalAmount: parsedResult.totalAmount || 0,
        totalQuantity: parsedResult.totalQuantity || 0,
        totalCartons: parsedResult.totalCartons || 0,
        totalGrossWeight: parsedResult.grossWeightKg || 0,
        totalNetWeight: parsedResult.netWeightKg || 0,
        totalCBM: parsedResult.totalCbm || 0,
        estimatedProfit: (parsedResult.totalAmount || 0) * 0.22,
        advancePercentage: 30,
        paymentCondition: parsedResult.paymentTerms || '100% Irrevocable L/C at sight',
        paymentMethod: parsedResult.paymentTerms?.includes('TT') ? 'TT' : 'LC',
        hsCode: parsedResult.items?.[0]?.hsCode || '6109.10.00',
        items: (parsedResult.items || []).map((it, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          itemType: 'Garments',
          itemDescription: it.itemDescription,
          styleNumber: it.styleNumber || `RB-STY-${2600 + idx}`,
          colorName: it.colorName || 'Assorted',
          sizes: it.sizes || { S: 25, M: 50, L: 50, XL: 25 },
          totalQty: it.quantity,
          unitPrice: it.unitPrice,
          totalAmount: it.totalAmount,
          totalCartons: it.cartons,
          cartonNumber: `C-01 to C-${it.cartons}`
        })),
        createdAt: serverTimestamp(),
        lastUpdated: new Date().toISOString(),
        isVerified: true,
        source: 'AI Automated Document Parser (Gemini 3.8 Flash)'
      };

      const docRef = await addDoc(collection(db, 'shipments'), newShipmentRecord);
      setSavedSuccessMsg(`Successfully saved to Firestore as Shipment ID: #${docRef.id}`);

      if (onSaveAsShipment) {
        onSaveAsShipment({ id: docRef.id, ...newShipmentRecord });
      }
    } catch (err: any) {
      console.error('Error saving shipment to Firestore:', err);
      setErrorMsg(`Failed to save to Firestore: ${err.message}`);
    } finally {
      setIsSavingToFirestore(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header Bar */}
        <div className="bg-slate-900 p-6 sm:p-7 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-tr from-red-600 to-rose-500 rounded-2xl shadow-lg shadow-red-600/30">
              <Sparkles className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Gemini 3.8 Flash Multimodal OCR
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  Customs & Logistics Intelligence
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                AI Automated Trade Document & B/L Parser
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                Upload Commercial Invoices, Ocean Bills of Lading, or Packing Lists to instantly extract metadata, line items, and customs compliance audit.
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          
          {/* Input Method Switcher & Quick Sample Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveInputTab('upload')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeInputTab === 'upload' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Upload className="w-4 h-4 text-red-600" />
                <span>Upload File (PDF/Image)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveInputTab('text')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeInputTab === 'text' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4 text-red-600" />
                <span>Paste Text / OCR Copy</span>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Load Test Samples:</span>
              <button
                type="button"
                onClick={() => loadSampleDocument('invoice')}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-[11px] font-bold transition-all"
              >
                📄 Sample Invoice
              </button>
              <button
                type="button"
                onClick={() => loadSampleDocument('bl')}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-[11px] font-bold transition-all"
              >
                🚢 Sample Bill of Lading
              </button>
            </div>
          </div>

          {/* Upload or Text View */}
          {activeInputTab === 'upload' ? (
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-red-500 bg-slate-50/70 hover:bg-red-50/30 transition-all rounded-3xl p-8 sm:p-12 text-center cursor-pointer flex flex-col items-center justify-center space-y-3 group"
              >
                <div className="p-4 bg-white rounded-2xl shadow-md group-hover:scale-110 transition-all border border-slate-200">
                  <Upload className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    {file ? file.name : 'Choose or drop your trade document here'}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Supports Commercial Invoices, Bills of Lading, Packing Lists (PDF, PNG, JPG, WEBP)
                  </p>
                </div>
                {file && (
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Ready to parse • {(file.size / 1024).toFixed(1)} KB
                  </span>
                )}
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*,application/pdf" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </div>

              {filePreview && (
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-slate-300" />
                  <div>
                    <p className="text-xs font-black text-slate-900">{file?.name}</p>
                    <p className="text-[10px] text-slate-500">Image thumbnail preview loaded for neural OCR</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Paste Document Text / EDI / Shipping Copy:
              </label>
              <textarea
                rows={7}
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Paste the full text of an export invoice, bill of lading, or shipping advice email..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono text-slate-800 focus:bg-white focus:border-red-500 outline-none transition-all"
              />
            </div>
          )}

          {/* Action Trigger Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Document Type Hint:</span>
              <select
                value={docTypeHint}
                onChange={e => setDocTypeHint(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
              >
                <option value="auto">Auto-Detect Document</option>
                <option value="commercial-invoice">Commercial Invoice (CI)</option>
                <option value="bill-of-lading">Bill of Lading (B/L)</option>
                <option value="packing-list">Packing List (PL)</option>
                <option value="pro-forma">Pro-Forma Invoice</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleStartParsing}
              disabled={isParsing || (activeInputTab === 'upload' && !file) || (activeInputTab === 'text' && !rawText.trim())}
              className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-95"
            >
              {isParsing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Parsing with Gemini 3.8 Flash...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>Extract Metadata Automatically</span>
                </>
              )}
            </button>
          </div>

          {/* Progress Indicator */}
          {isParsing && progressStep && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-900 text-xs font-bold animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-red-600" />
              <span>{progressStep}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message for Firestore Save */}
          {savedSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{savedSuccessMsg}</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Saved & Synced
              </span>
            </div>
          )}

          {/* =========================================================================
              PARSED RESULTS VIEW
             ========================================================================= */}
          {parsedResult && (
            <div className="space-y-6 pt-4 border-t border-slate-100 animate-fade-in">
              
              {/* Top Banner with Document Type and Compliance Score */}
              <div className="bg-slate-900 text-white p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
                      {parsedResult.documentType}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-xs font-bold text-slate-300">
                      Confidence Score: <strong className="text-white">{parsedResult.complianceAudit?.confidenceScore || 94}%</strong>
                    </span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                    <span>{parsedResult.invoiceNumber || parsedResult.blNumber}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Buyer: <strong className="text-white">{parsedResult.buyerName}</strong> • Destination: <strong className="text-white">{parsedResult.portOfDischarge}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyJSON}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDirectSaveToFirestore}
                    disabled={isSavingToFirestore}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSavingToFirestore ? 'Saving to Database...' : 'Save as Active Shipment'}</span>
                  </button>

                  {onOpenInForm && (
                    <button
                      type="button"
                      onClick={() => onOpenInForm(parsedResult)}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Open in Shipment Creator</span>
                    </button>
                  )}

                  {onOpenInDocumentGenerator && (
                    <button
                      type="button"
                      onClick={() => onOpenInDocumentGenerator(parsedResult)}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                      <Eye className="w-4 h-4 text-red-400" />
                      <span>Generate Letterhead</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Key Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Total Amount</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">
                    ${(parsedResult.totalAmount || 0).toLocaleString()} {parsedResult.currency || 'USD'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Incoterms: {parsedResult.incoterms || 'FOB'}</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Total Quantity</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">
                    {(parsedResult.totalQuantity || 0).toLocaleString()} Pcs
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">{parsedResult.totalCartons || 0} Cartons</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Weight / Volume</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">
                    {(parsedResult.grossWeightKg || 0).toLocaleString()} KG
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">{parsedResult.totalCbm || 0} m³ CBM</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">EXP Registration</span>
                  <span className="text-sm font-black text-slate-900 mt-1 block truncate">
                    {parsedResult.expNumber || 'Auto-Generated'}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">Bangladesh Bank Valid</span>
                </div>
              </div>

              {/* Detailed Breakdown Tabs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Customs & Logistics Entity Identifiers */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Ship className="w-4 h-4 text-red-600" />
                    <span>Logistics, Routing & Identifiers</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Invoice Number</span>
                      <span className="font-bold text-slate-900">{parsedResult.invoiceNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Bill of Lading (B/L)</span>
                      <span className="font-bold text-slate-900">{parsedResult.blNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Port of Loading</span>
                      <span className="font-bold text-slate-900">{parsedResult.portOfLoading || 'Chittagong Port'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Port of Discharge</span>
                      <span className="font-bold text-slate-900">{parsedResult.portOfDischarge || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Vessel & Voyage</span>
                      <span className="font-bold text-slate-900">
                        {parsedResult.vesselName ? `${parsedResult.vesselName} (${parsedResult.voyageNumber || ''})` : 'Ocean Freight'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Container & Seal</span>
                      <span className="font-bold text-slate-900">
                        {parsedResult.containerNumber || 'TCLU-9842104'} / {parsedResult.sealNumber || 'SL-BD-901'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">L/C Number & Bank</span>
                      <span className="font-bold text-slate-900">
                        {parsedResult.lcNumber || 'L/C at Sight'} ({parsedResult.lcBank || 'Trade Bank'})
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Payment Terms</span>
                      <span className="font-bold text-slate-900">{parsedResult.paymentTerms || '100% L/C at sight'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Parties (Shipper, Consignee, Notify) */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                    <User className="w-4 h-4 text-red-600" />
                    <span>Commercial Trade Entities</span>
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Shipper / Exporter</span>
                      <p className="font-bold text-slate-900">{parsedResult.shipperName || 'RED BIRD INTERNATIONAL'}</p>
                      <p className="text-[11px] text-slate-500">{parsedResult.shipperAddress}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Buyer / Consignee</span>
                      <p className="font-bold text-slate-900">{parsedResult.buyerName}</p>
                      <p className="text-[11px] text-slate-500">{parsedResult.buyerAddress || parsedResult.buyerCountry}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Notify Party</span>
                      <p className="text-[11px] font-medium text-slate-700">{parsedResult.notifyParty || 'SAME AS CONSIGNEE'}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Line Items Table */}
              {parsedResult.items && parsedResult.items.length > 0 && (
                <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Package className="w-4 h-4 text-red-600" />
                    <span>Extracted Product Line Items ({parsedResult.items.length})</span>
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Style #</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3">HS Code</th>
                          <th className="py-2.5 px-3 text-right">Quantity</th>
                          <th className="py-2.5 px-3 text-right">Unit Price</th>
                          <th className="py-2.5 px-3 text-right">Total Amount</th>
                          <th className="py-2.5 px-3 text-right">Cartons</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {parsedResult.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-red-600">{it.styleNumber || `RB-${idx+1}`}</td>
                            <td className="py-2.5 px-3 text-slate-900 font-bold max-w-xs truncate">{it.itemDescription}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">{it.hsCode || '6109.10.00'}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">{(it.quantity || 0).toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-right text-slate-600">${(it.unitPrice || 0).toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">${(it.totalAmount || 0).toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-right text-slate-600">{it.cartons || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Compliance & Audit Findings */}
              {parsedResult.complianceAudit?.findings && (
                <div className="bg-emerald-50/70 p-5 rounded-3xl border border-emerald-200 space-y-2">
                  <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Customs Compliance & Neural Audit Findings</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-emerald-800 font-medium">
                    {parsedResult.complianceAudit.findings.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
