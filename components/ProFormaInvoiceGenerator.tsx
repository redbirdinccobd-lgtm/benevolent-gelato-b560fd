import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Save, 
  RotateCcw, 
  Building2, 
  Calendar, 
  Globe, 
  Ship, 
  Plane, 
  CreditCard, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Sparkles, 
  ArrowRight,
  Package,
  Layers,
  ChevronDown,
  Hash,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Search
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ShipmentProfile, PackingListItem } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../src/firebase';
import { collection, addDoc, serverTimestamp, getDoc, doc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { UnifiedExportLetterheadDocument } from './UnifiedExportLetterheadDocument';

interface ProFormaInvoiceGeneratorProps {
  shipments?: ShipmentProfile[];
  onOpenShipmentCreator?: () => void;
}

export interface ProFormaItem {
  id: string;
  itemDescription: string;
  styleNumber: string;
  colorName: string;
  hsCode: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  cartons?: number;
  grossWeightKg?: number;
  netWeightKg?: number;
  cbm?: number;
}

export interface ProFormaData {
  piNumber: string;
  date: string;
  validityDays: number;
  expiryDate: string;
  salesContractRef: string;
  expRef: string;
  lcRef: string;

  // Seller
  sellerName: string;
  sellerTagline: string;
  sellerAddress: string;
  sellerFactory: string;
  sellerBinVat: string;
  sellerPhone: string;
  sellerEmail: string;
  sellerWebsite: string;

  // Buyer
  buyerName: string;
  buyerAttention: string;
  buyerAddress: string;
  buyerCountry: string;
  buyerPhone: string;
  buyerEmail: string;
  buyerTaxId: string;
  notifyParty: string;

  // Transport & Trade Terms
  portOfLoading: string;
  portOfDischarge: string;
  finalDestination: string;
  countryOfOrigin: string;
  transportMode: 'Sea Freight' | 'Air Cargo';
  incoterms: 'FOB' | 'CIF' | 'CFR' | 'EXW' | 'DAP';
  deliveryLeadTime: string;
  partialShipment: 'Allowed' | 'Not Allowed';
  transshipment: 'Allowed' | 'Not Allowed';

  // Banking
  beneficiaryName: string;
  bankName: string;
  bankBranch: string;
  bankAddress: string;
  swiftCode: string;
  routingNumber: string;
  accountNumber: string;
  ibanNumber: string;
  paymentTerms: string;
  currency: 'USD' | 'EUR' | 'BDT' | 'GBP';

  // Items
  items: ProFormaItem[];

  // Terms & Conditions
  termsAndConditions: string[];
  specialInstructions: string;

  // Signatory
  authorizedSignatory: string;
  authorizedTitle: string;
}

export const ProFormaInvoiceGenerator: React.FC<ProFormaInvoiceGeneratorProps> = ({ 
  shipments = [],
  onOpenShipmentCreator
}) => {
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activePaneTab, setActivePaneTab] = useState<'editor' | 'preview'>('preview');
  const [copiedLink, setCopiedLink] = useState(false);
  const [shipmentSearchQuery, setShipmentSearchQuery] = useState('');

  const printDocumentRef = useRef<HTMLDivElement>(null);

  // Initial Clean Pro-Forma Invoice Form State
  const [piData, setPiData] = useState<ProFormaData>({
    piNumber: `RBI/PI-${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    validityDays: 30,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    salesContractRef: `SC-${new Date().getFullYear()}-042`,
    expRef: `EXP-BD-${Math.floor(100000 + Math.random() * 900000)}`,
    lcRef: 'To be advised upon issuance',

    // Seller Info (Red Bird International corporate standard)
    sellerName: 'RED BIRD INTERNATIONAL',
    sellerTagline: 'PREMIER APPAREL SOURCING & RE-PROCESSING LOGISTICS',
    sellerAddress: 'House 12, Road 4, Sector 3, Uttara, Dhaka-1230, Bangladesh',
    sellerFactory: 'Plot 45, BSCIC Industrial Area, Tongi, Gazipur, Bangladesh',
    sellerBinVat: 'BIN: 001293819-0101 | ERC: 26032411008',
    sellerPhone: '+880-1966-635-888 / +880 2 8950000',
    sellerEmail: 'export@redbird-international.com',
    sellerWebsite: 'https://redbird-international.com',

    // Buyer Info (Default benchmark)
    buyerName: 'Seoul Fashion Trading Co., Ltd.',
    buyerAttention: 'Mr. Min-jun Park (Procurement Director)',
    buyerAddress: 'Teheran-ro 142, Gangnam-gu, Seoul 06236, South Korea',
    buyerCountry: 'South Korea',
    buyerPhone: '+82 2 555 8920',
    buyerEmail: 'procurement@seoulfashion-kr.com',
    buyerTaxId: 'KR-204-81-99214',
    notifyParty: 'Same as Consignee / Hansol Logistics Busan Branch',

    // Logistics
    portOfLoading: 'Chittagong Sea Port (BDCGP), Bangladesh',
    portOfDischarge: 'Busan Sea Port (KRPUS), South Korea',
    finalDestination: 'Seoul Metropolitan Logistics Hub, South Korea',
    countryOfOrigin: 'People\'s Republic of Bangladesh',
    transportMode: 'Sea Freight',
    incoterms: 'FOB',
    deliveryLeadTime: '25-30 Days from receipt of confirmed operative L/C',
    partialShipment: 'Allowed',
    transshipment: 'Allowed',

    // Banking for L/C & Wire Transfer
    beneficiaryName: 'RED BIRD INTERNATIONAL',
    bankName: 'Eastern Bank PLC',
    bankBranch: 'Principal Branch, Dilkusha C/A, Dhaka-1000',
    bankAddress: '10 Dilkusha Commercial Area, Dhaka-1000, Bangladesh',
    swiftCode: 'EBLBBDDH',
    routingNumber: '090271649',
    accountNumber: '1041060284910',
    ibanNumber: 'BD12EBLB1041060284910',
    paymentTerms: '100% Irrevocable Letter of Credit (L/C) at Sight against shipping documents',
    currency: 'USD',

    // Initial Items
    items: [
      {
        id: 'pi-item-1',
        itemDescription: 'Korea Line 220 GSM 100% Combed Cotton Heavyweight Crewneck T-Shirts (Pre-shrunk, Bio-washed)',
        styleNumber: 'RB-KOR-220T',
        colorName: 'Vintage Black / Heather Grey / Ivory White',
        hsCode: '6109.10.00',
        quantity: 12000,
        unitPrice: 4.85,
        totalAmount: 58200,
        cartons: 400,
        grossWeightKg: 3480,
        netWeightKg: 3120,
        cbm: 14.8
      },
      {
        id: 'pi-item-2',
        itemDescription: 'Fine Knitwear 12GG 100% Cotton Rib Pullover Sweaters (Oeko-Tex Standard 100 certified)',
        styleNumber: 'RB-SWT-12GG',
        colorName: 'Charcoal Navy / Olive Moss',
        hsCode: '6110.20.00',
        quantity: 6500,
        unitPrice: 8.90,
        totalAmount: 57850,
        cartons: 325,
        grossWeightKg: 3900,
        netWeightKg: 3575,
        cbm: 16.2
      }
    ],

    // Terms
    termsAndConditions: [
      'Quality Standard: Inspected according to AQL 1.5 Major / 4.0 Minor pre-shipment standard.',
      'Packing: Each piece in individual polybag, 30/20 pieces packed in 7-ply export corrugated carton with strapping.',
      'Shipping Marks: RED BIRD INTERNATIONAL / DESTINATION BUSAN / CARTON NO. & STYLE DETAILS.',
      'Documents Provided: Commercial Invoice (5 copies), Packing List (5 copies), Clean Shipped On Board B/L, Certificate of Origin (DCCI), Inspection Certificate.',
      'Discrepancy & Banking Charges: All banking charges outside Bangladesh are on Buyer\'s account; all local charges on Seller\'s account.',
      'Governing Rules: This Pro-Forma Invoice is subject to the Uniform Customs and Practice for Documentary Credits (UCP 600).'
    ],
    specialInstructions: 'Shipping samples must be couriered to Buyer 7 days prior to container loading at Chittagong Port.',

    // Signatory
    authorizedSignatory: 'MD. ALAM',
    authorizedTitle: 'Managing Director & Authorized Signatory'
  });

  // Pull letterhead config from Firestore settings if available
  useEffect(() => {
    const fetchLetterhead = async () => {
      try {
        if (!db) return;
        const snap = await getDoc(doc(db, 'settings', 'letterhead'));
        if (snap.exists()) {
          const lData = snap.data();
          setPiData(prev => ({
            ...prev,
            sellerName: lData.companyName || prev.sellerName,
            sellerTagline: lData.tagline || prev.sellerTagline,
            sellerAddress: lData.officeAddress || prev.sellerAddress,
            sellerFactory: lData.factoryAddress || prev.sellerFactory,
            sellerBinVat: lData.binVatNumber || prev.sellerBinVat,
            sellerPhone: lData.phone || prev.sellerPhone,
            sellerEmail: lData.email || prev.sellerEmail,
            sellerWebsite: lData.website || prev.sellerWebsite,
            authorizedSignatory: lData.authorityName || prev.authorizedSignatory,
            authorizedTitle: lData.authorityTitle || prev.authorizedTitle
          }));
        }
      } catch (err) {
        console.warn('Could not load customized letterhead settings, using corporate defaults:', err);
      }
    };
    fetchLetterhead();
  }, []);

  // Filtered shipments for selection
  const filteredShipments = useMemo(() => {
    if (!shipmentSearchQuery.trim()) return shipments;
    const q = shipmentSearchQuery.toLowerCase();
    return shipments.filter(s => 
      (s.invoiceNumber && s.invoiceNumber.toLowerCase().includes(q)) ||
      (s.buyerName && s.buyerName.toLowerCase().includes(q)) ||
      (s.portOfDestination && s.portOfDestination.toLowerCase().includes(q))
    );
  }, [shipments, shipmentSearchQuery]);

  // Handle Loading Data Directly from a Selected Shipment
  const handlePopulateFromShipment = (shipmentId: string) => {
    const s = shipments.find(item => item.id === shipmentId);
    if (!s) return;

    setSelectedShipmentId(shipmentId);

    // Map shipment packing list items to Pro-Forma items
    const mappedItems: ProFormaItem[] = (s.items && s.items.length > 0)
      ? s.items.map((it, idx) => {
          const qty = it.totalQty || 0;
          const uPrice = it.unitPrice || s.sellingPrice || s.buyerOfferPrice || 5.50;
          const total = it.totalAmount || (qty * uPrice);
          const ctns = it.totalCartons || Math.ceil(qty / 30);
          
          return {
            id: `item-${idx + 1}-${Date.now()}`,
            itemDescription: `${it.itemDescription || it.itemType || 'Apparel Garments'} - Style #${it.styleNumber || 'RB-STYLE'}`,
            styleNumber: it.styleNumber || 'RB-OEM-01',
            colorName: it.colorName || 'Assorted Solid Colors',
            hsCode: it.itemType?.toLowerCase().includes('t-shirt') ? '6109.10.00' : '6110.20.00',
            quantity: qty,
            unitPrice: Number(uPrice.toFixed(2)),
            totalAmount: Number(total.toFixed(2)),
            cartons: ctns,
            grossWeightKg: Math.round(qty * 0.28),
            netWeightKg: Math.round(qty * 0.25),
            cbm: Number(((ctns * 0.045)).toFixed(2))
          };
        })
      : [
          {
            id: 'item-default-1',
            itemDescription: 'Standard Export Knitted Apparel Allocation',
            styleNumber: 'RB-EXP-STD',
            colorName: 'Standard Assortment',
            hsCode: '6109.10.00',
            quantity: s.totalQuantity || 5000,
            unitPrice: s.sellingPrice || s.buyerOfferPrice || 5.00,
            totalAmount: s.totalAmount || ((s.totalQuantity || 5000) * 5.00),
            cartons: s.totalCartons || 167,
            grossWeightKg: s.totalGrossWeight || 1400,
            netWeightKg: s.totalNetWeight || 1250,
            cbm: s.totalCBM || 8.5
          }
        ];

    // Compute validity date
    const today = new Date();
    const expiry = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    setPiData(prev => ({
      ...prev,
      piNumber: s.invoiceNumber ? `PI-${s.invoiceNumber.replace('RBI-INV-', 'RB-')}` : `RBI/PI-${Date.now().toString().slice(-6)}`,
      date: s.date || today.toISOString().split('T')[0],
      expiryDate: expiry.toISOString().split('T')[0],
      salesContractRef: s.salesContractNumber || `SC-RB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      expRef: s.expNumber || `EXP-BD-${Math.floor(100000 + Math.random() * 900000)}`,

      buyerName: s.buyerName || prev.buyerName,
      buyerAddress: s.buyerAddress || prev.buyerAddress,
      buyerPhone: s.buyerPhone || prev.buyerPhone,
      buyerEmail: s.buyerEmail || prev.buyerEmail,

      portOfLoading: s.portOfLoading || 'Chittagong Sea Port (BDCGP), Bangladesh',
      portOfDischarge: s.portOfDestination || s.portOfDischarge || 'Busan Port (KRPUS), South Korea',
      finalDestination: s.portOfDestination || s.portOfDischarge || 'Busan Hub, South Korea',
      transportMode: s.transportMode === 'Air' ? 'Air Cargo' : 'Sea Freight',
      incoterms: (s.shippingTerms?.toUpperCase().includes('CIF') ? 'CIF' : 
                  s.shippingTerms?.toUpperCase().includes('CFR') ? 'CFR' : 
                  s.shippingTerms?.toUpperCase().includes('EXW') ? 'EXW' : 'FOB') as any,

      currency: (s.currency === 'BDT' ? 'BDT' : 'USD') as any,
      paymentTerms: s.paymentCondition || (s.paymentMethod === 'LC' ? '100% Irrevocable L/C at Sight' : '30% T/T Advance, 70% against Bill of Lading'),

      items: mappedItems
    }));
  };

  // Calculations
  const totalPieces = useMemo(() => piData.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0), [piData.items]);
  const totalAmount = useMemo(() => piData.items.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0), [piData.items]);
  const totalCartons = useMemo(() => piData.items.reduce((sum, item) => sum + (Number(item.cartons) || 0), 0), [piData.items]);
  const totalNetWeight = useMemo(() => piData.items.reduce((sum, item) => sum + (Number(item.netWeightKg) || 0), 0), [piData.items]);
  const totalGrossWeight = useMemo(() => piData.items.reduce((sum, item) => sum + (Number(item.grossWeightKg) || 0), 0), [piData.items]);
  const totalCBM = useMemo(() => piData.items.reduce((sum, item) => sum + (Number(item.cbm) || 0), 0), [piData.items]);

  // Currency symbol
  const currencySymbol = useMemo(() => {
    switch (piData.currency) {
      case 'EUR': return '€';
      case 'BDT': return '৳';
      case 'GBP': return '£';
      default: return '$';
    }
  }, [piData.currency]);

  // Item modifications
  const handleItemChange = (index: number, field: keyof ProFormaItem, value: any) => {
    const updated = [...piData.items];
    updated[index] = { ...updated[index], [field]: value };

    // Auto recalculate row total amount when qty or price changes
    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(value) : Number(updated[index].quantity);
      const p = field === 'unitPrice' ? Number(value) : Number(updated[index].unitPrice);
      updated[index].totalAmount = Number((q * p).toFixed(2));
      
      // Auto estimate cartons and weights if reasonable
      if (field === 'quantity') {
        updated[index].cartons = Math.ceil(q / 30);
        updated[index].netWeightKg = Math.round(q * 0.25);
        updated[index].grossWeightKg = Math.round(q * 0.28);
        updated[index].cbm = Number((updated[index].cartons * 0.045).toFixed(2));
      }
    }

    setPiData(prev => ({ ...prev, items: updated }));
  };

  const handleAddItem = () => {
    const newItem: ProFormaItem = {
      id: `item-${Date.now()}`,
      itemDescription: 'Premium Combed Cotton Apparel Item',
      styleNumber: `RB-${Math.floor(100 + Math.random() * 900)}`,
      colorName: 'Standard Colorway',
      hsCode: '6109.10.00',
      quantity: 1000,
      unitPrice: 5.00,
      totalAmount: 5000.00,
      cartons: 34,
      grossWeightKg: 280,
      netWeightKg: 250,
      cbm: 1.5
    };
    setPiData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleRemoveItem = (index: number) => {
    if (piData.items.length <= 1) return;
    const updated = piData.items.filter((_, i) => i !== index);
    setPiData(prev => ({ ...prev, items: updated }));
  };

  // Term clause update
  const handleTermChange = (index: number, value: string) => {
    const updated = [...piData.termsAndConditions];
    updated[index] = value;
    setPiData(prev => ({ ...prev, termsAndConditions: updated }));
  };

  const handleAddTerm = () => {
    setPiData(prev => ({
      ...prev,
      termsAndConditions: [...prev.termsAndConditions, 'Additional Buyer specific inspection and documentation requirement.']
    }));
  };

  const handleRemoveTerm = (index: number) => {
    setPiData(prev => ({
      ...prev,
      termsAndConditions: prev.termsAndConditions.filter((_, i) => i !== index)
    }));
  };

  // High-Resolution PDF Generator
  const handleDownloadPDF = async () => {
    if (!printDocumentRef.current) return;
    setIsGeneratingPDF(true);

    try {
      // Allow fonts and SVGs to settle
      await new Promise(r => setTimeout(r, 400));

      const element = printDocumentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1200
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`ProForma_Invoice_${piData.piNumber.replace(/[\/\\]/g, '_')}.pdf`);
    } catch (error) {
      console.error('Failed to generate Pro-Forma Invoice PDF:', error);
      alert('Could not render PDF. Please try browser print preview.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Direct Browser Print
  const handlePrint = () => {
    window.print();
  };

  // Save to Firestore
  const handleSaveToFirestore = async () => {
    setIsSaving(true);
    try {
      if (!db) throw new Error('Firestore not initialized');

      const invoicePayload = {
        id: piData.piNumber,
        date: piData.date,
        clientName: piData.buyerName,
        clientAddress: piData.buyerAddress,
        incoterms: `${piData.incoterms} ${piData.portOfLoading}`,
        portOfDischarge: piData.portOfDischarge,
        carrier: piData.transportMode,
        totalCartons: totalCartons,
        totalNetWeight: totalNetWeight,
        totalGrossWeight: totalGrossWeight,
        totalCBM: totalCBM,
        advancePaymentPercent: 30,
        subtotal: totalAmount,
        tax: 0,
        grandTotal: totalAmount,
        status: 'In Transit',
        items: piData.items.map((it, idx) => ({
          productId: idx + 100,
          name: it.itemDescription,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          total: it.totalAmount
        })),
        proFormaDetails: {
          ...piData,
          totalPieces,
          totalAmount,
          totalCartons,
          totalNetWeight,
          totalGrossWeight,
          totalCBM,
          savedAt: new Date().toISOString()
        },
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'invoices'), invoicePayload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'invoices');
      alert(`Error saving Pro-Forma Invoice: ${err?.message || 'Permission or network issue'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-sans animate-fade-in">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & CONTROLS BAR                                             */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-3 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center justify-center">
              <FileText className="w-7 h-7" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Pro-Forma Invoice Generator
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Official Export Documentation
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Generate, edit, and export authenticated commercial Pro-Forma Invoices directly from stored shipments with bank routing and security watermark.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Mobile view toggle */}
          <div className="xl:hidden flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActivePaneTab('editor')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activePaneTab === 'editor' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-600'
              }`}
            >
              Configure Details
            </button>
            <button
              onClick={() => setActivePaneTab('preview')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activePaneTab === 'preview' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-600'
              }`}
            >
              Live Invoice Preview
            </button>
          </div>

          {/* Save to Database */}
          <button
            onClick={handleSaveToFirestore}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm ${
              saveSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4 text-slate-600" />
            )}
            <span>{saveSuccess ? 'Saved to Portal' : 'Save Invoice'}</span>
          </button>

          {/* Browser Print */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Preview</span>
          </button>

          {/* Download Vector PDF */}
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-2xl text-xs font-black tracking-wide transition-all shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50"
          >
            {isGeneratingPDF ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isGeneratingPDF ? 'Generating High-Res PDF...' : 'Download PDF Invoice'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SHIPMENT AUTO-POPULATOR SELECTOR BANNER                                */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-600/20 border border-red-500/30 rounded-2xl text-red-400 shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Auto-Populate from Existing Portal Shipment</h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-600 text-white">
                1-Click Import
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Select any registered shipment from your database. All consignee details, goods descriptions, packaging lists, port parameters, and financial values will instantly populate into this Pro-Forma Invoice.
            </p>
          </div>
        </div>

        {/* Shipment Selector Dropdown / Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative min-w-[260px] sm:min-w-[300px]">
            <select
              value={selectedShipmentId}
              onChange={(e) => {
                if (e.target.value) handlePopulateFromShipment(e.target.value);
              }}
              className="w-full bg-slate-950/80 border border-slate-700 text-white text-xs font-bold rounded-2xl px-4 py-3 appearance-none focus:outline-none focus:border-red-500 transition-colors pr-10 cursor-pointer shadow-inner"
            >
              <option value="" disabled>-- Select Shipment to Populate --</option>
              {shipments.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.invoiceNumber || s.id} • {s.buyerName} ({s.totalQuantity || 0} Pcs)
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {shipments.length === 0 && onOpenShipmentCreator && (
            <button
              onClick={onOpenShipmentCreator}
              className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all shrink-0"
            >
              <Plus className="w-4 h-4 text-red-400" />
              <span>Create New Shipment First</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DUAL-PANE WORKSPACE: LEFT EDITOR & RIGHT WYSIWYG PREVIEW               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* ----------------------------------------------------------------------- */}
        {/* LEFT PANE: INVOICE CONFIGURATION FORM (5 Columns on XL)                */}
        {/* ----------------------------------------------------------------------- */}
        <div className={`xl:col-span-5 space-y-6 ${activePaneTab === 'editor' ? 'block' : 'hidden xl:block'}`}>
          
          {/* Section 1: Identification & Timing */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Hash className="w-4 h-4 text-red-600" />
              Document References & Timing
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">PI Number</label>
                <input
                  type="text"
                  value={piData.piNumber}
                  onChange={(e) => setPiData({ ...piData, piNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date of Issuance</label>
                <input
                  type="date"
                  value={piData.date}
                  onChange={(e) => setPiData({ ...piData, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sales Contract / PO Ref</label>
                <input
                  type="text"
                  value={piData.salesContractRef}
                  onChange={(e) => setPiData({ ...piData, salesContractRef: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">EXP Ref / L/C Number</label>
                <input
                  type="text"
                  value={piData.expRef}
                  onChange={(e) => setPiData({ ...piData, expRef: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Consignee / Buyer Details */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-4 h-4 text-blue-600" />
              Consignee / Buyer Information
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Buyer Company Name</label>
                <input
                  type="text"
                  value={piData.buyerName}
                  onChange={(e) => setPiData({ ...piData, buyerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Attention Person</label>
                <input
                  type="text"
                  value={piData.buyerAttention}
                  onChange={(e) => setPiData({ ...piData, buyerAttention: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Buyer Full Address</label>
                <textarea
                  rows={2}
                  value={piData.buyerAddress}
                  onChange={(e) => setPiData({ ...piData, buyerAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Buyer Phone</label>
                  <input
                    type="text"
                    value={piData.buyerPhone}
                    onChange={(e) => setPiData({ ...piData, buyerPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tax / Business Reg No</label>
                  <input
                    type="text"
                    value={piData.buyerTaxId}
                    onChange={(e) => setPiData({ ...piData, buyerTaxId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Notify Party</label>
                <input
                  type="text"
                  value={piData.notifyParty}
                  onChange={(e) => setPiData({ ...piData, notifyParty: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Logistics & Trade Terms */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Ship className="w-4 h-4 text-emerald-600" />
              Trade Terms & Shipping Corridors
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Incoterms</label>
                <select
                  value={piData.incoterms}
                  onChange={(e) => setPiData({ ...piData, incoterms: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  <option value="FOB">FOB (Free On Board)</option>
                  <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                  <option value="CFR">CFR (Cost and Freight)</option>
                  <option value="EXW">EXW (Ex Works)</option>
                  <option value="DAP">DAP (Delivered at Place)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Transport Mode</label>
                <select
                  value={piData.transportMode}
                  onChange={(e) => setPiData({ ...piData, transportMode: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  <option value="Sea Freight">Ocean Sea Freight</option>
                  <option value="Air Cargo">Air Express Cargo</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Port of Loading</label>
                <input
                  type="text"
                  value={piData.portOfLoading}
                  onChange={(e) => setPiData({ ...piData, portOfLoading: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Port of Discharge / Destination</label>
                <input
                  type="text"
                  value={piData.portOfDischarge}
                  onChange={(e) => setPiData({ ...piData, portOfDischarge: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Partial Shipment</label>
                <select
                  value={piData.partialShipment}
                  onChange={(e) => setPiData({ ...piData, partialShipment: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                >
                  <option value="Allowed">Allowed</option>
                  <option value="Not Allowed">Not Allowed</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Transshipment</label>
                <select
                  value={piData.transshipment}
                  onChange={(e) => setPiData({ ...piData, transshipment: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                >
                  <option value="Allowed">Allowed</option>
                  <option value="Not Allowed">Not Allowed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Banking & L/C Routing */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="w-4 h-4 text-purple-600" />
              Banking & L/C Wire Routing
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Beneficiary Bank Name & Branch</label>
                <input
                  type="text"
                  value={piData.bankName}
                  onChange={(e) => setPiData({ ...piData, bankName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">SWIFT Code</label>
                <input
                  type="text"
                  value={piData.swiftCode}
                  onChange={(e) => setPiData({ ...piData, swiftCode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Routing Number</label>
                <input
                  type="text"
                  value={piData.routingNumber}
                  onChange={(e) => setPiData({ ...piData, routingNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Beneficiary Account / IBAN</label>
                <input
                  type="text"
                  value={piData.accountNumber}
                  onChange={(e) => setPiData({ ...piData, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payment Condition & Terms</label>
                <input
                  type="text"
                  value={piData.paymentTerms}
                  onChange={(e) => setPiData({ ...piData, paymentTerms: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Item Management Table Controls */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-red-600" />
                Itemized Export Goods ({piData.items.length})
              </h3>
              <button
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-4">
              {piData.items.map((item, idx) => (
                <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-900 text-xs">Item #{idx + 1}</span>
                    {piData.items.length > 1 && (
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Description & Specs</label>
                    <input
                      type="text"
                      value={item.itemDescription}
                      onChange={(e) => handleItemChange(idx, 'itemDescription', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Style No</label>
                      <input
                        type="text"
                        value={item.styleNumber}
                        onChange={(e) => handleItemChange(idx, 'styleNumber', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Color / Finish</label>
                      <input
                        type="text"
                        value={item.colorName}
                        onChange={(e) => handleItemChange(idx, 'colorName', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">HS Code</label>
                      <input
                        type="text"
                        value={item.hsCode}
                        onChange={(e) => handleItemChange(idx, 'hsCode', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Quantity (Pcs)</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-black text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Unit Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-black text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Total ($)</label>
                      <div className="px-2 py-1 bg-slate-100 rounded-lg font-black text-red-600 text-right">
                        ${item.totalAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT PANE: WYSIWYG DOCUMENT PREVIEW (7 Columns on XL)                 */}
        {/* ----------------------------------------------------------------------- */}
        <div className={`xl:col-span-7 ${activePaneTab === 'preview' ? 'block' : 'hidden xl:block'}`}>
          
          <div className="sticky top-6">
            
            {/* Document Controls Top Pill */}
            <div className="flex items-center justify-between bg-slate-900 text-white px-5 py-3 rounded-2xl mb-4 shadow-md text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold">A4 Print Formatted View</span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-300 font-medium">Auto-Calculated Totals</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-red-400">
                  {totalPieces.toLocaleString()} Pcs • ${totalAmount.toLocaleString()} USD
                </span>
              </div>
            </div>

            {/* THE ACTUAL PRO-FORMA INVOICE SHEET (Styled exactly as a high-prestige international garment export document) */}
            <div 
              ref={printDocumentRef}
              className="bg-white rounded-2xl shadow-2xl border border-slate-300 p-8 sm:p-12 relative overflow-hidden text-slate-900"
              style={{ minHeight: '1050px' }}
            >
              
              {/* REPEATING LOW-OPACITY 'RED BIRD INTERNATIONAL' SECURITY TEXT WATERMARK */}
              <div 
                className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden flex flex-col justify-around py-4"
                style={{ 
                  opacity: 0.045,
                  transform: 'rotate(-26deg) scale(1.45)',
                  transformOrigin: 'center center',
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact'
                }}
              >
                {Array.from({ length: 28 }).map((_, rIdx) => (
                  <div 
                    key={rIdx}
                    className="whitespace-nowrap uppercase font-black text-slate-900 leading-none select-none tracking-[0.32em]"
                    style={{
                      fontFamily: "'Space Mono', 'Courier Prime', monospace",
                      fontSize: '11px',
                      marginLeft: `${(rIdx % 2 === 0 ? 0 : -95)}px`
                    }}
                  >
                    {"RED BIRD INTERNATIONAL   •   RED BIRD INTERNATIONAL   •   RED BIRD INTERNATIONAL   •   RED BIRD INTERNATIONAL   •   ".repeat(4)}
                  </div>
                ))}
              </div>

              {/* CENTRAL EMBLEM SOVEREIGN WATERMARK */}
              <div 
                className="absolute inset-0 pointer-events-none flex items-center justify-center select-none overflow-hidden z-0"
                style={{ opacity: 0.035 }}
              >
                <div className="text-[64px] sm:text-[80px] font-black uppercase tracking-[0.25em] text-slate-900 -rotate-45 whitespace-nowrap">
                  RED BIRD INTERNATIONAL
                </div>
              </div>

              {/* SECURITY PERIMETER BORDER */}
              <div className="absolute inset-2 border-2 border-slate-900/10 pointer-events-none rounded-xl"></div>

              {/* ------------------- HEADER & LETTERHEAD ------------------- */}
              <div className="relative z-10 border-b-2 border-slate-900 pb-6 mb-6">
                <div className="flex justify-between items-start gap-4">
                  
                  {/* Left: Brand Emblem & Corporate Identification */}
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0">
                      <svg viewBox="0 0 100 100" className="w-12 h-12 fill-current">
                        <path d="M20,50 Q40,20 80,45 Q60,50 80,80 Q50,60 20,50 Z" />
                        <path d="M25,45 Q35,35 45,40" fill="none" stroke="white" strokeWidth="3" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                        {piData.sellerName}
                      </h1>
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-red-600 mt-1">
                        {piData.sellerTagline}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium mt-1.5 max-w-sm">
                        {piData.sellerAddress}
                      </p>
                      <p className="text-[10px] font-bold text-slate-700 mt-0.5">
                        {piData.sellerBinVat}
                      </p>
                    </div>
                  </div>

                  {/* Right: Document Title & QR Code */}
                  <div className="text-right flex flex-col items-end">
                    <span className="inline-block bg-slate-950 text-white px-3.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider mb-2 shadow-sm">
                      PRO-FORMA INVOICE
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-900">{piData.piNumber}</p>
                        <p className="text-[10px] font-bold text-slate-500">Date: {piData.date}</p>
                        <p className="text-[10px] text-slate-400">Valid: {piData.validityDays} Days</p>
                      </div>
                      <div className="p-1 bg-white border border-slate-300 rounded-lg shadow-sm">
                        <QRCodeSVG 
                          value={`https://redbird-international.com/verify?doc=${encodeURIComponent(piData.piNumber)}&val=${totalAmount}`} 
                          size={52}
                          level="M"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* ------------------- BUYER & LOGISTICS GRID ------------------- */}
              <div className="relative z-10 grid grid-cols-2 gap-6 text-xs mb-6 pb-6 border-b border-slate-200">
                
                {/* Consignee / Buyer Column */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <p className="text-[10px] font-black uppercase tracking-wider text-red-600 mb-1">
                    Buyer / Consignee:
                  </p>
                  <p className="font-black text-sm text-slate-900">{piData.buyerName}</p>
                  <p className="font-bold text-slate-700 mt-0.5">Attn: {piData.buyerAttention}</p>
                  <p className="text-slate-600 mt-1 whitespace-pre-line">{piData.buyerAddress}</p>
                  <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 space-y-0.5">
                    <p><span className="font-bold text-slate-700">Phone:</span> {piData.buyerPhone}</p>
                    <p><span className="font-bold text-slate-700">Business/Tax ID:</span> {piData.buyerTaxId}</p>
                    <p><span className="font-bold text-slate-700">Notify Party:</span> {piData.notifyParty}</p>
                  </div>
                </div>

                {/* Logistics & Shipment Parameters Column */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    Shipping & Commercial Parameters:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-bold">Country of Origin:</span>
                      <p className="font-black text-slate-900">{piData.countryOfOrigin}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">Trade Terms:</span>
                      <p className="font-black text-red-600">{piData.incoterms} {piData.portOfLoading.split(',')[0]}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">Port of Loading:</span>
                      <p className="font-bold text-slate-800 truncate">{piData.portOfLoading}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">Port of Discharge:</span>
                      <p className="font-bold text-slate-800 truncate">{piData.portOfDischarge}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">Transport Mode:</span>
                      <p className="font-bold text-slate-800">{piData.transportMode}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold">Delivery Schedule:</span>
                      <p className="font-bold text-slate-800">{piData.deliveryLeadTime}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-600">
                    <span>Partial Shipment: <strong className="text-slate-900">{piData.partialShipment}</strong></span>
                    <span>Transshipment: <strong className="text-slate-900">{piData.transshipment}</strong></span>
                  </div>
                </div>

              </div>

              {/* ------------------- ITEM MATRIX TABLE ------------------- */}
              <div className="relative z-10 mb-6">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                      <th className="py-2.5 px-3 rounded-l-lg w-10 text-center">SL</th>
                      <th className="py-2.5 px-3">Description of Export Goods</th>
                      <th className="py-2.5 px-3">HS Code</th>
                      <th className="py-2.5 px-3 text-center">Cartons</th>
                      <th className="py-2.5 px-3 text-right">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Unit Price ({piData.currency})</th>
                      <th className="py-2.5 px-3 text-right rounded-r-lg">Total ({piData.currency})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {piData.items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <p className="font-black text-slate-900">{item.itemDescription}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Style: {item.styleNumber} | Color: {item.colorName}</p>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{item.hsCode}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700">{item.cartons || '-'}</td>
                        <td className="py-3 px-3 text-right font-black text-slate-900">{item.quantity.toLocaleString()} Pcs</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800">{currencySymbol}{item.unitPrice.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right font-black text-slate-900">{currencySymbol}{item.totalAmount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    {/* Grand Total Row */}
                    <tr className="border-t-2 border-slate-900 bg-slate-50 font-black text-xs">
                      <td colSpan={3} className="py-3 px-3 uppercase tracking-wider text-slate-900">
                        Total Export Volume & FOB Value:
                      </td>
                      <td className="py-3 px-3 text-center text-slate-900">
                        {totalCartons.toLocaleString()} Ctns
                      </td>
                      <td className="py-3 px-3 text-right text-slate-900 text-sm">
                        {totalPieces.toLocaleString()} Pcs
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500">
                        Subtotal:
                      </td>
                      <td className="py-3 px-3 text-right text-red-600 text-base">
                        {currencySymbol}{totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* ------------------- PACKAGING & WEIGHTS BAR ------------------- */}
              <div className="relative z-10 grid grid-cols-4 gap-3 bg-slate-100 p-3 rounded-xl text-center text-xs mb-6 font-bold text-slate-700">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Total Cartons</span>
                  <span className="text-slate-900 font-black text-sm">{totalCartons.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Total Net Weight</span>
                  <span className="text-slate-900 font-black text-sm">{totalNetWeight.toLocaleString()} KGS</span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Total Gross Weight</span>
                  <span className="text-slate-900 font-black text-sm">{totalGrossWeight.toLocaleString()} KGS</span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Volume Displacement</span>
                  <span className="text-slate-900 font-black text-sm">{totalCBM.toFixed(2)} CBM (m³)</span>
                </div>
              </div>

              {/* ------------------- BANKING & PAYMENT DETAILS ------------------- */}
              <div className="relative z-10 bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-xs">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                  Beneficiary Banking & L/C Wire Information:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[11px]">
                  <div><span className="font-bold text-slate-500">Beneficiary:</span> <strong className="text-slate-900">{piData.sellerName}</strong></div>
                  <div><span className="font-bold text-slate-500">Bank Name:</span> <strong className="text-slate-900">{piData.bankName}</strong></div>
                  <div><span className="font-bold text-slate-500">Account No:</span> <strong className="text-slate-900 font-mono">{piData.accountNumber}</strong></div>
                  <div><span className="font-bold text-slate-500">SWIFT Code:</span> <strong className="text-slate-900 font-mono">{piData.swiftCode}</strong></div>
                  <div><span className="font-bold text-slate-500">Routing No:</span> <strong className="text-slate-900 font-mono">{piData.routingNumber}</strong></div>
                  <div><span className="font-bold text-slate-500">Branch & Address:</span> <span className="text-slate-700">{piData.bankBranch}</span></div>
                  <div className="sm:col-span-2 pt-1.5 mt-1.5 border-t border-slate-200 font-medium">
                    <span className="font-bold text-red-600">Payment Condition:</span> {piData.paymentTerms}
                  </div>
                </div>
              </div>

              {/* ------------------- TERMS & CONDITIONS ------------------- */}
              <div className="relative z-10 text-[10px] text-slate-600 mb-8 space-y-1">
                <p className="font-black uppercase tracking-wider text-slate-800 mb-1 text-[11px]">
                  Commercial Terms & Sale Conditions:
                </p>
                {piData.termsAndConditions.map((term, i) => (
                  <p key={i} className="flex items-start gap-1.5 leading-relaxed">
                    <span className="font-bold text-slate-900 shrink-0">{i + 1}.</span>
                    <span>{term}</span>
                  </p>
                ))}
              </div>

              {/* ------------------- SIGNATURES & OFFICIAL STAMP ------------------- */}
              <div className="relative z-10 pt-6 border-t border-slate-200 flex justify-between items-end">
                
                {/* Buyer Acceptance Placeholder */}
                <div className="w-48 text-center">
                  <div className="h-16 border-b border-dashed border-slate-400 mb-2"></div>
                  <p className="font-bold text-xs text-slate-900">Buyer Authorized Signature</p>
                  <p className="text-[10px] text-slate-400">Accepted & Confirmed by Buyer</p>
                </div>

                {/* Exporter Official Stamp & Signature */}
                <div className="w-56 text-center relative">
                  {/* Decorative Stamp Ring */}
                  <div className="absolute -top-10 right-4 w-28 h-28 rounded-full border-2 border-red-600/30 flex items-center justify-center pointer-events-none rotate-12">
                    <div className="w-24 h-24 rounded-full border border-red-600/30 flex flex-col items-center justify-center p-1 text-center">
                      <span className="text-[7px] font-black uppercase text-red-600 tracking-wider">RED BIRD INT.</span>
                      <span className="text-[6px] font-bold text-red-500">EXPORTS DEPT</span>
                      <span className="text-[6px] font-bold text-red-500">DHAKA, BANGLADESH</span>
                    </div>
                  </div>

                  {/* Simulated Signature Line */}
                  <div className="h-16 flex items-end justify-center mb-2">
                    <span className="font-serif italic text-lg font-bold text-slate-800 -rotate-3 select-none">
                      {piData.authorizedSignatory}
                    </span>
                  </div>
                  <div className="border-t border-slate-900 pt-1">
                    <p className="font-black text-xs text-slate-900">{piData.authorizedSignatory}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{piData.authorizedTitle}</p>
                    <p className="text-[9px] font-bold text-red-600 mt-0.5">{piData.sellerName}</p>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default ProFormaInvoiceGenerator;
