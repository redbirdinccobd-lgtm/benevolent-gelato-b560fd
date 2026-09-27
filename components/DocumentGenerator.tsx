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
  Search,
  Anchor,
  Compass,
  FileSpreadsheet,
  Truck,
  BookmarkCheck,
  Stamp,
  Receipt,
  FileCheck2,
  DollarSign,
  Briefcase,
  Wand2,
  Bot,
  Lightbulb,
  Boxes,
  SlidersHorizontal,
  ChevronUp
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ShipmentProfile, PackingListItem, DetailedOrder } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../src/firebase';
import { collection, addDoc, serverTimestamp, getDocs, onSnapshot, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { requestAiDraftExportDocuments, AiDraftResponse } from '../src/services/aiDocumentService';
import { UnifiedExportLetterheadDocument, UnifiedLetterheadData, UnifiedDocItem } from './UnifiedExportLetterheadDocument';

export type DocumentTemplateType = 'commercial-invoice' | 'invoice' | 'packing-list' | 'bill-of-lading';

interface DocumentGeneratorProps {
  shipments?: any[];
  initialShipmentId?: string;
  onOpenShipmentCreator?: () => void;
  initialOrderForDrafting?: any;
}

export interface DocItem {
  id: string;
  styleNumber: string;
  itemDescription: string;
  colorName: string;
  hsCode: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  cartons: number;
  grossWeightKg: number;
  netWeightKg: number;
  cbm: number;
  sizeRatio?: string;
}

export interface DocumentFormData {
  // Document identifiers
  templateType: DocumentTemplateType;
  docNumber: string;
  issueDate: string;
  dueDate: string;
  expiryOrShippedDate: string;
  blNumber: string;
  bookingRef: string;
  expNumber: string;
  contractNumber: string;
  lcNumber: string;
  lcBank: string;
  paymentTerms: string;
  incoterms: string;
  currency: string;
  exchangeRate: number;

  // Shipper / Exporter
  shipperName: string;
  shipperTagline: string;
  shipperAddress: string;
  shipperFactory: string;
  shipperBinVat: string;
  shipperContact: string;
  shipperEmail: string;
  shipperWebsite: string;

  // Consignee / Buyer
  buyerName: string;
  buyerAttention: string;
  buyerAddress: string;
  buyerCountry: string;
  buyerContact: string;
  buyerEmail: string;
  buyerTaxId: string;
  notifyParty: string;

  // Transport & Logistics
  transportMode: 'Sea Freight' | 'Air Cargo';
  vesselName: string;
  voyageOrFlightNo: string;
  containerNumber: string;
  sealNumber: string;
  portOfLoading: string;
  portOfDischarge: string;
  finalDestination: string;
  placeOfDelivery: string;
  freightTerms: 'FREIGHT PREPAID' | 'FREIGHT COLLECT';
  numberOfOriginals: string;

  // Cargo Specifications
  marksAndNumbers: string;
  packageKind: string;
  generalDescription: string;
  totalCartons: number;
  totalGrossWeightKg: number;
  totalNetWeightKg: number;
  totalCbm: number;

  // Financial & Banking
  bankName: string;
  bankBranch: string;
  bankAddress: string;
  accountName: string;
  accountNumber: string;
  swiftCode: string;
  beneficiaryName: string;
  freightCharges: number;
  insuranceCharges: number;
  taxCharges: number;
  discountAmount: number;

  // Special conditions
  declarationText: string;
  specialNotes: string;
  watermarkText: string;
  showWatermark: boolean;
  watermarkOpacity?: number;
  showGuilloche?: boolean;
  showSeal: boolean;
  showSignature: boolean;
  showQrCode: boolean;
  authorizedSignatoryName: string;
  authorizedSignatoryTitle: string;
}

// Convert numeric amounts to English words (US Dollars)
function numberToWords(amount: number, currency: string = 'USD'): string {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (!amount || amount === 0) return `Zero ${currency}`;
  
  const whole = Math.floor(amount);
  const cents = Math.round((amount - whole) * 100);

  function convertGroup(n: number): string {
    let group = '';
    if (n >= 100) {
      group += units[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      group += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      group += units[n] + ' ';
    }
    return group.trim();
  }

  let words = '';
  const millions = Math.floor(whole / 1000000);
  const thousands = Math.floor((whole % 1000000) / 1000);
  const remainder = whole % 1000;

  if (millions > 0) words += convertGroup(millions) + ' Million ';
  if (thousands > 0) words += convertGroup(thousands) + ' Thousand ';
  if (remainder > 0) words += convertGroup(remainder) + ' ';

  words = words.trim();
  const currLabel = currency === 'BDT' ? 'Bangladeshi Taka' : currency === 'EUR' ? 'Euros' : 'US Dollars';
  
  if (cents > 0) {
    return `${words} ${currLabel} and ${cents}/100 Cents Only`;
  }
  return `${words} ${currLabel} Only`;
}

const DEFAULT_ITEMS: DocItem[] = [
  {
    id: 'item-1',
    styleNumber: 'RB-SK-2601',
    itemDescription: '100% Combed Cotton Heavyweight Crew-Neck T-Shirt (220 GSM)',
    colorName: 'Washed Charcoal Black',
    hsCode: '6109.10.00',
    quantity: 6000,
    unitPrice: 3.85,
    totalAmount: 23100,
    cartons: 120,
    grossWeightKg: 1680,
    netWeightKg: 1560,
    cbm: 9.6,
    sizeRatio: 'S/1, M/2, L/2, XL/1'
  },
  {
    id: 'item-2',
    styleNumber: 'RB-SK-2602',
    itemDescription: 'Oversized Streetwear French Terry Knit Hooded Pullover (360 GSM)',
    colorName: 'Vintage Pine Green',
    hsCode: '6110.20.00',
    quantity: 3500,
    unitPrice: 7.20,
    totalAmount: 25200,
    cartons: 140,
    grossWeightKg: 2450,
    netWeightKg: 2310,
    cbm: 14.8,
    sizeRatio: 'M/2, L/2, XL/1'
  }
];

export const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({
  shipments: propShipments = [],
  initialShipmentId,
  onOpenShipmentCreator,
  initialOrderForDrafting
}) => {
  const documentPrintRef = useRef<HTMLDivElement>(null);

  // Live Firestore shipments list
  const [liveShipments, setLiveShipments] = useState<any[]>(propShipments || []);
  const [liveDetailedOrders, setLiveDetailedOrders] = useState<DetailedOrder[]>([]);
  const [shipmentSearchQuery, setShipmentSearchQuery] = useState<string>('');
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(Boolean(db));

  // AI Document Drafting States
  const [isAiDrafterOpen, setIsAiDrafterOpen] = useState<boolean>(true);
  const [selectedAiOrderType, setSelectedAiOrderType] = useState<'detailed_order' | 'shipment'>('detailed_order');
  const [selectedAiOrderId, setSelectedAiOrderId] = useState<string>('');
  const [aiDraftTarget, setAiDraftTarget] = useState<'both' | 'commercial-invoice' | 'packing-list'>('both');
  const [aiCustomPrompt, setAiCustomPrompt] = useState<string>('');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiComplianceInsights, setAiComplianceInsights] = useState<AiDraftResponse['aiComplianceInsights'] | null>(null);
  const [aiPackingSummary, setAiPackingSummary] = useState<AiDraftResponse['packingList'] | null>(null);
  const [aiModelLabel, setAiModelLabel] = useState<string>('');

  // Template and View states
  const [activeTemplate, setActiveTemplate] = useState<DocumentTemplateType>('commercial-invoice');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>(initialShipmentId || '');
  const [items, setItems] = useState<DocItem[]>(DEFAULT_ITEMS);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('preview');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Corporate branding from database
  const [corpSeal, setCorpSeal] = useState<string | null>(null);
  const [corpSignature, setCorpSignature] = useState<string | null>(null);
  const [corpLogo, setCorpLogo] = useState<string | null>(null);

  // Core Form State
  const [formData, setFormData] = useState<DocumentFormData>({
    templateType: 'commercial-invoice',
    docNumber: 'RBI-EXP-2026-0428',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expiryOrShippedDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    blNumber: 'RBL-2026-CTG-0089',
    bookingRef: 'BKG-COSCO-99824',
    expNumber: 'EXP-109283-2026',
    contractNumber: 'SC-RBI-KR-2026-09',
    lcNumber: 'LC-HANWHA-992182-REV',
    lcBank: 'Hana Bank Global Trade Center, Seoul',
    paymentTerms: '100% Irrevocable Letter of Credit (L/C) at sight',
    incoterms: 'FOB Chittagong Port',
    currency: 'USD',
    exchangeRate: 1.0,

    // Shipper
    shipperName: 'RED BIRD INTERNATIONAL',
    shipperTagline: 'Apparel Manufacturing & Legal Stock Sourcing Hub',
    shipperAddress: 'Plot-100, Majar Chow Road, Uttarkhan Majhar, Uttarkhan, Dhaka-1230, Bangladesh',
    shipperFactory: 'Unit-2 Industrial Zone, Gazipur RMG Complex, Dhaka, Bangladesh',
    shipperBinVat: 'BIN: 002910394-0102 / Trade Reg: TR-DHK-88912',
    shipperContact: '+880-1966-635-888',
    shipperEmail: 'info@redbird-international.com',
    shipperWebsite: 'https://redbird-international.com',

    // Buyer
    buyerName: 'HANWHA GLOBAL TRADING CORP / SEOUL RETAIL CO.',
    buyerAttention: 'Mr. Min-Seok Park (Procurement & Sourcing Director)',
    buyerAddress: '86 Cheonggyecheon-ro, Jung-gu, Seoul 04541, Republic of Korea',
    buyerCountry: 'South Korea',
    buyerContact: '+82-2-729-1114 / sourcing@hanwha.co.kr',
    buyerEmail: 'sumon.hanwha@gmail.com',
    buyerTaxId: 'KR-TAX-104-81-01294',
    notifyParty: 'SAME AS CONSIGNEE (OR KOREA LOGISTICS CORP CFS, BUSAN)',

    // Transport
    transportMode: 'Sea Freight',
    vesselName: 'M/V HYUNDAI FORWARD',
    voyageOrFlightNo: 'V.2604-EAST',
    containerNumber: 'TCLU-9842104 (40ft High Cube)',
    sealNumber: 'SL-BD-77291',
    portOfLoading: 'Chittagong Port (BDCGP), Bangladesh',
    portOfDischarge: 'Busan Port (KRPUS), Republic of Korea',
    finalDestination: 'Seoul Central Logistics Hub, Republic of Korea',
    placeOfDelivery: 'Busan Container Freight Station (CFS)',
    freightTerms: 'FREIGHT PREPAID',
    numberOfOriginals: 'THREE (3/3) ORIGINALS',

    // Cargo description
    marksAndNumbers: 'RED BIRD / SEOUL / C/NO. 1-260 / MADE IN BANGLADESH',
    packageKind: 'Export Standard 7-Ply Heavy Corrugated Cartons',
    generalDescription: '100% READY MADE GARMENTS - KNITTED COTTON APPAREL (T-SHIRTS & HOODIES)',
    totalCartons: 260,
    totalGrossWeightKg: 4130,
    totalNetWeightKg: 3870,
    totalCbm: 24.4,

    // Bank details
    bankName: 'STANDARD ISLAMI BANK PLC',
    bankBranch: 'UTTARA MODEL TOWN BRANCH',
    bankAddress: 'Plot-9, Sector-3, Uttara Model Town, Dhaka-1230, Bangladesh',
    accountName: 'RED BIRD INTERNATIONAL',
    accountNumber: '01533005430',
    swiftCode: 'SDBLBDDH115',
    beneficiaryName: 'RED BIRD INTERNATIONAL',
    freightCharges: 0,
    insuranceCharges: 0,
    taxCharges: 0,
    discountAmount: 0,

    // Conditions & formatting
    declarationText: 'We hereby declare and certify that this invoice shows the actual price of the goods described, that no other invoice has been or will be issued for this consignment, and that the goods are wholly produced and manufactured in Bangladesh.',
    specialNotes: 'All garments manufactured strictly under verified QC inspection protocols. Packaging moisture barrier and silica gel bags enclosed. Free of defect.',
    watermarkText: 'RED BIRD INTERNATIONAL',
    showWatermark: true,
    watermarkOpacity: 0.055,
    watermarkPattern: 'both' as 'both' | 'micro-security' | 'diagonal-stripe',
    showGuilloche: true,
    showSeal: true,
    showSignature: true,
    showQrCode: true,
    authorizedSignatoryName: 'Md. Sumon (Operations Director)',
    authorizedSignatoryTitle: 'Authorized Head of Trade & Logistics'
  });

  // 1. Subscribe to Firestore `shipments` collection for live records
  useEffect(() => {
    if (!db) {
      if (propShipments && propShipments.length > 0) {
        setLiveShipments(propShipments);
      }
      return;
    }

    try {
      const q = collection(db, 'shipments');
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            setLiveShipments(docs);
            setIsFirebaseConnected(true);
          } else if (propShipments && propShipments.length > 0) {
            setLiveShipments(propShipments);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'shipments');
          if (propShipments && propShipments.length > 0) {
            setLiveShipments(propShipments);
          }
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Firestore live shipments listener error:', err);
    }
  }, [propShipments]);

  // 1b. Subscribe to Firestore `detailed_orders` collection for live order records
  useEffect(() => {
    if (!db) return;
    try {
      const q = query(collection(db, 'detailed_orders'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const ords = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as DetailedOrder));
            setLiveDetailedOrders(ords);
            if (!selectedAiOrderId && ords.length > 0) {
              setSelectedAiOrderId(ords[0].id || ords[0].controlNumber);
            }
          }
        },
        (error) => {
          console.warn('detailed_orders listener error:', error);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Firestore live detailed_orders error:', err);
    }
  }, []);

  // 1c. If initialOrderForDrafting is passed from OrderManagementModule, load it
  useEffect(() => {
    if (initialOrderForDrafting) {
      setSelectedAiOrderType('detailed_order');
      setSelectedAiOrderId(initialOrderForDrafting.id || initialOrderForDrafting.controlNumber || '');
      setIsAiDrafterOpen(true);
      setNotificationMsg(`Order #${initialOrderForDrafting.controlNumber || initialOrderForDrafting.id} prepared for AI Document Drafting.`);
      setTimeout(() => setNotificationMsg(null), 4000);
    }
  }, [initialOrderForDrafting]);

  // 2. Fetch saved corporate seal, signature, and letterhead from Firestore
  useEffect(() => {
    const fetchSettings = async () => {
      if (!db) return;
      try {
        // Check letterhead settings
        const letterheadRef = doc(db, 'settings', 'letterhead');
        const letterheadSnap = await getDoc(letterheadRef);
        if (letterheadSnap.exists()) {
          const cfg = letterheadSnap.data();
          if (cfg.sealUrl) setCorpSeal(cfg.sealUrl);
          if (cfg.signatureUrl) setCorpSignature(cfg.signatureUrl);
          if (cfg.logoUrl) setCorpLogo(cfg.logoUrl);
          if (cfg.companyName) {
            setFormData(prev => ({
              ...prev,
              shipperName: cfg.companyName || prev.shipperName,
              shipperTagline: cfg.tagline || prev.shipperTagline,
              shipperAddress: cfg.officeAddress || prev.shipperAddress,
              shipperFactory: cfg.factoryAddress || prev.shipperFactory,
              shipperContact: cfg.phone || prev.shipperContact,
              shipperEmail: cfg.email || prev.shipperEmail,
              shipperWebsite: cfg.website || prev.shipperWebsite,
              shipperBinVat: cfg.binVatNumber || prev.shipperBinVat,
              authorizedSignatoryName: cfg.authorityName || prev.authorizedSignatoryName,
              authorizedSignatoryTitle: cfg.authorityTitle || prev.authorizedSignatoryTitle
            }));
          }
        } else {
          // Check general settings collection fallback
          const snap = await getDocs(collection(db, 'settings'));
          if (!snap.empty) {
            const docData = snap.docs[0].data();
            if (docData.seal) setCorpSeal(docData.seal);
            if (docData.signature) setCorpSignature(docData.signature);
            if (docData.logo) setCorpLogo(docData.logo);
            if (docData.companyName) {
              setFormData(prev => ({
                ...prev,
                shipperName: docData.companyName || prev.shipperName,
                shipperAddress: docData.address || prev.shipperAddress,
                shipperContact: docData.contact || prev.shipperContact,
                shipperEmail: docData.email || prev.shipperEmail,
                shipperWebsite: docData.website || prev.shipperWebsite,
                bankName: docData.bankDetails?.bankName || prev.bankName,
                bankBranch: docData.bankDetails?.branch || prev.bankBranch,
                accountNumber: docData.bankDetails?.accountNumber || prev.accountNumber,
                swiftCode: docData.bankDetails?.swiftCode || prev.swiftCode,
                accountName: docData.bankDetails?.accountName || prev.accountName
              }));
            }
          }
        }
      } catch (err) {
        console.warn('Could not load corporate settings:', err);
      }
    };
    fetchSettings();
  }, []);

  // Filtered shipments for dropdown search
  const filteredShipments = useMemo(() => {
    if (!shipmentSearchQuery.trim()) return liveShipments;
    const q = shipmentSearchQuery.toLowerCase();
    return liveShipments.filter((s) => {
      const id = (s.id || '').toLowerCase();
      const buyer = (s.buyerName || '').toLowerCase();
      const port = (s.portOfDischarge || s.portOfDestination || '').toLowerCase();
      const contract = (s.salesContractNumber || '').toLowerCase();
      const exp = (s.expNumber || '').toLowerCase();
      return id.includes(q) || buyer.includes(q) || port.includes(q) || contract.includes(q) || exp.includes(q);
    });
  }, [liveShipments, shipmentSearchQuery]);

  // 3. Map Firestore shipment record into Document Form & Items
  const handleSelectShipment = (shipmentId: string) => {
    setSelectedShipmentId(shipmentId);
    if (!shipmentId) return;

    const ship = liveShipments.find((s) => s.id === shipmentId);
    if (!ship) return;

    // Normalizing Items from different Firestore schemas
    let mappedItems: DocItem[] = [];
    if (ship.items && Array.isArray(ship.items) && ship.items.length > 0) {
      mappedItems = ship.items.map((it: any, idx: number) => {
        // Handle quantity
        const qty = Number(it.quantity || it.totalQty || it.colorQuantity || 1000);
        const price = Number(it.unitPrice || 4.5);
        const ctns = Number(it.cartons || it.totalCartons || it.cartonNumber || Math.ceil(qty / 48) || 20);
        const styleNo = it.styleNumber || it.style || `RB-STY-${idx + 101}`;
        const desc = it.itemDescription || it.itemName || it.itemType || '100% Cotton Knitted Apparel';
        const color = it.colorName || it.color || 'Standard Assortment';
        const hsCode = it.hsCode || ship.hsCode || '6109.10.00';
        const sizeRatio = it.sizeRatio || it.size || 'S/1, M/2, L/2, XL/1';

        const grossWt = it.grossWeightKg ? Number(it.grossWeightKg) : Math.round(qty * 0.28);
        const netWt = it.netWeightKg ? Number(it.netWeightKg) : Math.round(qty * 0.25);
        const cbmVal = it.cbm ? Number(it.cbm) : +(ctns * 0.08).toFixed(2);

        return {
          id: `item-${idx + 1}`,
          styleNumber: styleNo,
          itemDescription: desc,
          colorName: color,
          hsCode: hsCode,
          quantity: qty,
          unitPrice: price,
          totalAmount: Math.round(qty * price * 100) / 100,
          cartons: ctns,
          grossWeightKg: grossWt,
          netWeightKg: netWt,
          cbm: cbmVal,
          sizeRatio: sizeRatio
        };
      });
    }

    if (mappedItems.length > 0) {
      setItems(mappedItems);
    }

    // Determine clean doc numbers
    const cleanId = ship.id || '';
    const invoiceNum = ship.invoiceNumber 
      ? `INV-${ship.invoiceNumber}`
      : cleanId.startsWith('RB-INV') 
        ? cleanId 
        : `RB-INV-${cleanId}`;

    const dateVal = ship.shipmentDate || ship.date || new Date().toISOString().split('T')[0];
    const destination = ship.portOfDischarge || ship.portOfDestination || 'Busan Port (KRPUS), South Korea';

    // Auto-detect Country from address/discharge
    let detectedCountry = 'International';
    const addressLower = `${ship.buyerAddress || ''} ${destination}`.toLowerCase();
    if (addressLower.includes('korea')) detectedCountry = 'South Korea';
    else if (addressLower.includes('usa') || addressLower.includes('angeles') || addressLower.includes('states')) detectedCountry = 'United States';
    else if (addressLower.includes('germany') || addressLower.includes('hamburg')) detectedCountry = 'Germany';
    else if (addressLower.includes('japan') || addressLower.includes('tokyo') || addressLower.includes('yokohama')) detectedCountry = 'Japan';
    else if (addressLower.includes('canada')) detectedCountry = 'Canada';
    else if (addressLower.includes('uk') || addressLower.includes('kingdom')) detectedCountry = 'United Kingdom';

    // Calculate aggregated cartons & weights
    const totalCtns = mappedItems.reduce((acc, it) => acc + it.cartons, 0) || Number(ship.totalCartons || 150);
    const totalGross = mappedItems.reduce((acc, it) => acc + it.grossWeightKg, 0) || Number(ship.totalGrossWeight || 3200);
    const totalNet = mappedItems.reduce((acc, it) => acc + it.netWeightKg, 0) || Number(ship.totalNetWeight || 2900);
    const totalCbm = +(mappedItems.reduce((acc, it) => acc + it.cbm, 0) || Number(ship.totalCBM || 18.5)).toFixed(2);

    setFormData(prev => ({
      ...prev,
      docNumber: invoiceNum,
      blNumber: ship.blNumber || `RBL-${cleanId.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}`,
      issueDate: dateVal,
      expiryOrShippedDate: ship.estimatedArrivalDate || dateVal,
      expNumber: ship.expNumber || `EXP-${Math.floor(100000 + Math.random() * 900000)}-2026`,
      contractNumber: ship.salesContractNumber || `SC-RBI-${cleanId.slice(-6)}`,
      lcNumber: ship.lcNumber || 'LC-REV-2026-99021',
      paymentTerms: ship.paymentCondition || ship.paymentTerms || '100% Irrevocable L/C at sight',
      incoterms: ship.shippingTerms || ship.incoterms || 'FOB Chittagong Port',
      currency: ship.currency === 'BDT' ? 'BDT' : 'USD',

      // Buyer
      buyerName: ship.buyerName || prev.buyerName,
      buyerAddress: ship.buyerAddress || prev.buyerAddress,
      buyerCountry: detectedCountry,
      buyerContact: ship.buyerPhone || ship.buyerContact || prev.buyerContact,
      buyerEmail: ship.buyerEmail || prev.buyerEmail,
      notifyParty: `SAME AS CONSIGNEE (OR ${ship.buyerName || 'DESTINATION AGENT'})`,

      // Logistics
      transportMode: ship.transportMode === 'Air' ? 'Air Cargo' : 'Sea Freight',
      portOfLoading: ship.portOfLoading || 'Chittagong Port (BDCGP), Bangladesh',
      portOfDischarge: destination,
      finalDestination: ship.portOfDestination || destination,
      totalCartons: totalCtns,
      totalGrossWeightKg: totalGross,
      totalNetWeightKg: totalNet,
      totalCbm: totalCbm,
      marksAndNumbers: `RED BIRD / ${detectedCountry.toUpperCase()} / C/NO. 1-${totalCtns} / MADE IN BANGLADESH`
    }));

    setNotificationMsg(`Shipment #${cleanId} loaded with ${mappedItems.length} items.`);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Auto-select shipment if passed via initialShipmentId
  useEffect(() => {
    if (initialShipmentId) {
      handleSelectShipment(initialShipmentId);
    }
  }, [initialShipmentId, liveShipments.length]);

  // 3b. AI Export Document Drafting Handler (Gemini 3.8 Flash)
  const handleExecuteAiDraft = async () => {
    let orderToDraft: any = null;

    if (selectedAiOrderType === 'detailed_order') {
      orderToDraft = liveDetailedOrders.find(
        (o) => o.id === selectedAiOrderId || o.controlNumber === selectedAiOrderId
      );
      if (!orderToDraft && liveDetailedOrders.length > 0) {
        orderToDraft = liveDetailedOrders[0];
      }
    } else {
      orderToDraft = liveShipments.find((s) => s.id === selectedAiOrderId);
      if (!orderToDraft && liveShipments.length > 0) {
        orderToDraft = liveShipments[0];
      }
    }

    if (!orderToDraft && initialOrderForDrafting) {
      orderToDraft = initialOrderForDrafting;
    }

    if (!orderToDraft) {
      orderToDraft = {
        controlNumber: formData.docNumber,
        buyerName: formData.buyerName,
        buyerAddress: formData.buyerAddress,
        buyerCountry: formData.buyerCountry,
        quantity: calculatedTotals.totalQty || 5000,
        sellingPricePerUnit: items[0]?.unitPrice || 4.25,
        currency: formData.currency,
        shipmentDate: formData.expiryOrShippedDate,
        items: items
      };
    }

    setIsAiGenerating(true);
    try {
      const response = await requestAiDraftExportDocuments(
        orderToDraft,
        aiDraftTarget,
        aiCustomPrompt
      );

      if (response && response.success) {
        const ci = response.commercialInvoice;
        const pl = response.packingList;

        setFormData((prev) => ({
          ...prev,
          templateType: aiDraftTarget === 'packing-list' ? 'packing-list' : 'commercial-invoice',
          docNumber: ci.docNumber || prev.docNumber,
          issueDate: ci.issueDate || prev.issueDate,
          dueDate: ci.dueDate || prev.dueDate,
          expiryOrShippedDate: ci.expiryOrShippedDate || prev.expiryOrShippedDate,
          blNumber: ci.blNumber || prev.blNumber,
          bookingRef: ci.bookingRef || prev.bookingRef,
          expNumber: ci.expNumber || prev.expNumber,
          contractNumber: ci.contractNumber || prev.contractNumber,
          lcNumber: ci.lcNumber || prev.lcNumber,
          lcBank: ci.lcBank || prev.lcBank,
          paymentTerms: ci.paymentTerms || prev.paymentTerms,
          incoterms: ci.incoterms || prev.incoterms,
          currency: (ci.currency === 'BDT' ? 'BDT' : 'USD') as any,
          exchangeRate: Number(ci.exchangeRate) || prev.exchangeRate,
          buyerName: ci.buyerName || prev.buyerName,
          buyerAttention: ci.buyerAttention || prev.buyerAttention,
          buyerAddress: ci.buyerAddress || prev.buyerAddress,
          buyerCountry: ci.buyerCountry || prev.buyerCountry,
          buyerContact: ci.buyerContact || prev.buyerContact,
          buyerEmail: ci.buyerEmail || prev.buyerEmail,
          buyerTaxId: ci.buyerTaxId || prev.buyerTaxId,
          notifyParty: ci.notifyParty || prev.notifyParty,
          transportMode: ci.transportMode || prev.transportMode,
          vesselName: ci.vesselName || prev.vesselName,
          voyageOrFlightNo: ci.voyageOrFlightNo || prev.voyageOrFlightNo,
          containerNumber: ci.containerNumber || prev.containerNumber,
          sealNumber: ci.sealNumber || prev.sealNumber,
          portOfLoading: ci.portOfLoading || prev.portOfLoading,
          portOfDischarge: ci.portOfDischarge || prev.portOfDischarge,
          finalDestination: ci.finalDestination || prev.finalDestination,
          marksAndNumbers: ci.marksAndNumbers || prev.marksAndNumbers,
          packageKind: ci.packageKind || prev.packageKind,
          generalDescription: ci.generalDescription || prev.generalDescription,
          declarationText: ci.declarationText || prev.declarationText,
          specialNotes: ci.specialNotes || prev.specialNotes,
          totalCartons: pl?.totalCartons || prev.totalCartons,
          totalGrossWeightKg: pl?.totalGrossWeightKg || prev.totalGrossWeightKg,
          totalNetWeightKg: pl?.totalNetWeightKg || prev.totalNetWeightKg,
          totalCbm: pl?.totalCbm || prev.totalCbm
        }));

        if (response.items && response.items.length > 0) {
          const mappedItems: DocItem[] = response.items.map((it, idx) => ({
            id: `ai-item-${Date.now()}-${idx}`,
            styleNumber: it.styleNumber,
            itemDescription: it.itemDescription,
            colorName: it.colorName,
            hsCode: it.hsCode,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            totalAmount: it.totalAmount,
            cartons: it.cartons,
            grossWeightKg: it.grossWeightKg,
            netWeightKg: it.netWeightKg,
            cbm: it.cbm,
            sizeRatio: it.sizeRatio || 'S/1, M/2, L/2, XL/1'
          }));
          setItems(mappedItems);
        }

        setAiComplianceInsights(response.aiComplianceInsights || null);
        setAiPackingSummary(response.packingList || null);
        setAiModelLabel(
          response.model || (response.isAiGenerated ? 'Gemini 3.8 Flash' : 'RMG Export Expert Synthesis Engine')
        );

        if (aiDraftTarget === 'packing-list') {
          setActiveTemplate('packing-list');
        } else {
          setActiveTemplate('commercial-invoice');
        }

        const buyerLabel = orderToDraft.buyerName || orderToDraft.controlNumber || 'Selected Order';
        setNotificationMsg(
          `AI successfully drafted ${
            aiDraftTarget === 'both' ? 'Commercial Invoice & Packing List' : aiDraftTarget
          } for ${buyerLabel}!`
        );
        setTimeout(() => setNotificationMsg(null), 5000);
      }
    } catch (err: any) {
      console.error('AI Document Drafting Error:', err);
      alert(`AI Drafting Notice: ${err.message || 'Error drafting documents with AI.'}`);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Calculations
  const calculatedTotals = useMemo(() => {
    const totalQty = items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
    const subtotalValue = items.reduce((sum, it) => sum + (Number(it.quantity || 0) * Number(it.unitPrice || 0)), 0);
    const totalCtns = items.reduce((sum, it) => sum + Number(it.cartons || 0), 0);
    const totalGrossWt = items.reduce((sum, it) => sum + Number(it.grossWeightKg || 0), 0);
    const totalNetWt = items.reduce((sum, it) => sum + Number(it.netWeightKg || 0), 0);
    const totalCbmVal = +(items.reduce((sum, it) => sum + Number(it.cbm || 0), 0)).toFixed(2);

    const netTotal = subtotalValue + Number(formData.freightCharges || 0) + Number(formData.insuranceCharges || 0) + Number(formData.taxCharges || 0) - Number(formData.discountAmount || 0);

    return {
      totalQty,
      subtotalValue,
      totalValue: Math.round(netTotal * 100) / 100,
      totalCtns,
      totalGrossWt,
      totalNetWt,
      totalCbm: totalCbmVal,
      words: numberToWords(Math.round(netTotal * 100) / 100, formData.currency)
    };
  }, [items, formData.freightCharges, formData.insuranceCharges, formData.taxCharges, formData.discountAmount, formData.currency]);

  // Line item helpers
  const addItemRow = () => {
    const newIdx = items.length + 1;
    const newItem: DocItem = {
      id: `item-${Date.now()}`,
      styleNumber: `RB-STY-${100 + newIdx}`,
      itemDescription: 'Combed Cotton Knitted Garment',
      colorName: 'Assorted',
      hsCode: '6109.10.00',
      quantity: 1000,
      unitPrice: 4.50,
      totalAmount: 4500,
      cartons: 25,
      grossWeightKg: 280,
      netWeightKg: 260,
      cbm: 1.8,
      sizeRatio: 'Standard Run'
    };
    setItems([...items, newItem]);
  };

  const removeItemRow = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof DocItem, val: any) => {
    setItems(items.map(it => {
      if (it.id === id) {
        const updated = { ...it, [field]: val };
        if (field === 'quantity' || field === 'unitPrice') {
          const q = field === 'quantity' ? Number(val) : it.quantity;
          const p = field === 'unitPrice' ? Number(val) : it.unitPrice;
          updated.totalAmount = Math.round(q * p * 100) / 100;
          if (field === 'quantity') {
            updated.cartons = Math.ceil(q / 40);
            updated.grossWeightKg = Math.round(q * 0.28);
            updated.netWeightKg = Math.round(q * 0.25);
            updated.cbm = +(updated.cartons * 0.08).toFixed(2);
          }
        }
        return updated;
      }
      return it;
    }));
  };

  // PDF Export Engine using html2canvas & jsPDF with exact ISO A4 standard scaling
  const handleDownloadPDF = async () => {
    if (!documentPrintRef.current) return;
    setIsExporting(true);

    try {
      const element = documentPrintRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, imgHeight), undefined, 'FAST');

      const docPrefix = activeTemplate.toUpperCase().replace('-', '_');
      const cleanNum = formData.docNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanBuyer = (formData.buyerName || 'Buyer').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 15);
      const filename = `${docPrefix}_${cleanNum}_${cleanBuyer}.pdf`;
      pdf.save(filename);
      setNotificationMsg(`PDF successfully generated: ${filename}`);
      setTimeout(() => setNotificationMsg(null), 4000);
    } catch (error) {
      console.error('PDF Generation Failed:', error);
      alert('Error generating PDF document. Opening print dialog as fallback.');
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Save to Firestore `generated_documents`
  const handleSaveToDatabase = async () => {
    if (!db) {
      alert('Firestore database connection is unavailable.');
      return;
    }
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'generated_documents'), {
        templateType: activeTemplate,
        docNumber: formData.docNumber,
        blNumber: formData.blNumber,
        issueDate: formData.issueDate,
        buyerName: formData.buyerName,
        currency: formData.currency,
        totalValue: calculatedTotals.totalValue,
        totalQuantity: calculatedTotals.totalQty,
        totalCartons: calculatedTotals.totalCtns,
        transportMode: formData.transportMode,
        portOfLoading: formData.portOfLoading,
        portOfDischarge: formData.portOfDischarge,
        shipmentId: selectedShipmentId || null,
        items: items,
        formData: formData,
        createdAt: serverTimestamp(),
        createdByUser: auth?.currentUser?.email || 'admin'
      });
      setSaveSuccess(true);
      setNotificationMsg(`Document saved to Firestore registry.`);
      setTimeout(() => {
        setSaveSuccess(false);
        setNotificationMsg(null);
      }, 4000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'generated_documents');
    } finally {
      setIsSaving(false);
    }
  };

  // Industry Presets
  const applyPreset = (presetType: 'korea' | 'japan' | 'usa') => {
    if (presetType === 'korea') {
      setFormData(prev => ({
        ...prev,
        buyerName: 'HANWHA GLOBAL TRADING CORP / SEOUL RETAIL CO.',
        buyerAttention: 'Mr. Min-Seok Park (Procurement Director)',
        buyerCountry: 'South Korea',
        buyerAddress: '86 Cheonggyecheon-ro, Jung-gu, Seoul 04541, Republic of Korea',
        portOfDischarge: 'Busan Port (KRPUS), Republic of Korea',
        finalDestination: 'Seoul Central Logistics CFS',
        incoterms: 'FOB Chittagong Port',
        vesselName: 'M/V HYUNDAI FORWARD',
        voyageOrFlightNo: 'V.2604-EAST',
        currency: 'USD'
      }));
    } else if (presetType === 'japan') {
      setFormData(prev => ({
        ...prev,
        buyerName: 'TOKYO MERCHANDISING APPAREL GROUP',
        buyerAttention: 'Kenji Takahashi (Trade Sourcing Manager)',
        buyerCountry: 'Japan',
        buyerAddress: 'Shibuya Scramble Square 22F, Shibuya-ku, Tokyo 150-6122, Japan',
        portOfDischarge: 'Yokohama Port (JPYOK), Japan',
        finalDestination: 'Tokyo CFS Terminal',
        incoterms: 'CIF Yokohama Port',
        vesselName: 'M/V ONE HARMONY',
        voyageOrFlightNo: 'V.089W',
        currency: 'USD'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        buyerName: 'PACIFIC APPAREL WHOLESALE LLC',
        buyerAttention: 'Sarah Jenkins (Logistics Coordinator)',
        buyerCountry: 'United States',
        buyerAddress: '1200 S San Pedro St, Los Angeles, CA 90015, USA',
        portOfDischarge: 'Port of Long Beach (USLGB), California',
        finalDestination: 'Vernon Logistics Park, CA',
        incoterms: 'FOB Chittagong Port',
        vesselName: 'M/V EVER GIVEN',
        voyageOrFlightNo: 'V.1102-PAC',
        currency: 'USD'
      }));
    }
    setNotificationMsg(`Applied ${presetType.toUpperCase()} export profile.`);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in text-xs font-bold">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-8 rounded-[2.5rem] shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-red-600/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2.5 bg-red-600 rounded-2xl text-white shadow-lg shadow-red-600/30">
              <FileText className="w-6 h-6" />
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">
              Export Document Generator
            </h2>
            <span className="px-3 py-1 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black uppercase tracking-wider">
              {isFirebaseConnected ? 'Firestore Connected' : 'Local Cache'}
            </span>
          </div>
          <p className="text-slate-400 text-xs font-medium max-w-2xl leading-relaxed">
            Generate internationally accredited PDF Invoices, Packing Lists, Commercial Invoices, and Ocean Bills of Lading populated automatically with live shipment records from Firestore.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 relative z-10">
          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exporting PDF...' : 'Download PDF'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all active:scale-95 border border-slate-700"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Print</span>
          </button>

          <button
            onClick={handleSaveToDatabase}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-600/20"
          >
            {saveSuccess ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'Saved' : isSaving ? 'Saving...' : 'Save Document'}</span>
          </button>
        </div>
      </header>

      {/* AI Document Generation Assistant (Gemini 3.8 Flash) */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-950 to-red-950 text-white p-6 sm:p-8 rounded-[2.5rem] border border-red-500/20 shadow-2xl relative overflow-hidden no-print">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-tr from-red-600 to-amber-500 rounded-2xl text-white shadow-lg shadow-red-600/30">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                    AI Export Document Drafter
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-black uppercase tracking-wider">
                    Gemini 3.8 Flash
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-0.5">
                  Automatically synthesize accredited Commercial Invoices & Packing Lists from active production orders and shipment data.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {aiComplianceInsights && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 size={14} />
                  <span>Draft Active ({aiModelLabel || 'Gemini'})</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsAiDrafterOpen(!isAiDrafterOpen)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all flex items-center gap-2 border border-white/10 cursor-pointer"
              >
                <SlidersHorizontal size={14} />
                <span>{isAiDrafterOpen ? 'Collapse Drafter' : 'Open Drafter'}</span>
                {isAiDrafterOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>

          {isAiDrafterOpen && (
            <div className="space-y-6 pt-2">
              {/* Order Data Source Selection */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Layers size={14} className="text-red-400" />
                      <span>1. Select Source Order Data</span>
                    </label>
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAiOrderType('detailed_order');
                          if (liveDetailedOrders.length > 0) {
                            setSelectedAiOrderId(liveDetailedOrders[0].id || liveDetailedOrders[0].controlNumber);
                          }
                        }}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          selectedAiOrderType === 'detailed_order'
                            ? 'bg-red-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Production Orders ({liveDetailedOrders.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAiOrderType('shipment');
                          if (liveShipments.length > 0) {
                            setSelectedAiOrderId(liveShipments[0].id);
                          }
                        }}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          selectedAiOrderType === 'shipment'
                            ? 'bg-red-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Shipment Profiles ({liveShipments.length})
                      </button>
                    </div>
                  </div>

                  {selectedAiOrderType === 'detailed_order' ? (
                    <div className="relative">
                      <select
                        value={selectedAiOrderId}
                        onChange={(e) => setSelectedAiOrderId(e.target.value)}
                        className="w-full bg-slate-900/90 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                      >
                        <option value="">-- Choose Active Production Order --</option>
                        {liveDetailedOrders.map((ord) => (
                          <option key={ord.id} value={ord.id || ord.controlNumber}>
                            {ord.controlNumber} • {ord.buyerName} ({ord.quantity?.toLocaleString()} pcs) • {ord.status}
                          </option>
                        ))}
                      </select>
                      {liveDetailedOrders.length === 0 && (
                        <p className="text-[11px] text-slate-400 mt-1 italic">
                          No production orders currently in database. You can still draft from standard export profile or shipment records.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedAiOrderId}
                        onChange={(e) => setSelectedAiOrderId(e.target.value)}
                        className="w-full bg-slate-900/90 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                      >
                        <option value="">-- Choose Shipment Record --</option>
                        {liveShipments.map((s) => (
                          <option key={s.id} value={s.id}>
                            #{s.id} • {s.buyerName} ({s.portOfDischarge || s.portOfDestination || 'Export'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Active Order Summary Chip */}
                  {(() => {
                    const currentOrder =
                      selectedAiOrderType === 'detailed_order'
                        ? liveDetailedOrders.find(
                            (o) => o.id === selectedAiOrderId || o.controlNumber === selectedAiOrderId
                          ) || liveDetailedOrders[0]
                        : liveShipments.find((s) => s.id === selectedAiOrderId) || liveShipments[0];

                    if (!currentOrder) return null;

                    const buyer = currentOrder.buyerName || 'Client Consignee';
                    const qty = Number(currentOrder.quantity || currentOrder.totalQuantity || 5000);
                    const price = currentOrder.sellingPricePerUnit || currentOrder.sellingPrice || 4.5;
                    const date = currentOrder.shipmentDate || currentOrder.date || 'Scheduled';
                    const status = currentOrder.status || 'Active';

                    return (
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400">Target Consignee</p>
                          <p className="font-bold text-white text-sm">{buyer}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400">Order Quantity</p>
                          <p className="font-mono font-bold text-amber-300">{qty.toLocaleString()} Pcs</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400">Est. Unit / Value</p>
                          <p className="font-mono font-bold text-emerald-400">
                            ${price} / ${(qty * price).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400">Target Date</p>
                          <p className="font-bold text-slate-200">{date}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-wider text-slate-300">
                          {status}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Document Target Selector */}
                <div className="lg:col-span-5 space-y-3">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <FileText size={14} className="text-amber-400" />
                    <span>2. Select Document Target</span>
                  </label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {[
                      {
                        id: 'both',
                        title: 'Commercial Invoice & Packing List (Dual)',
                        desc: 'Drafts customs invoice and carton packing breakdown together.'
                      },
                      {
                        id: 'commercial-invoice',
                        title: 'Commercial Invoice Only',
                        desc: 'Full customs declaration, HS codes, L/C bank details & FOB terms.'
                      },
                      {
                        id: 'packing-list',
                        title: 'Packing List Only',
                        desc: 'Carton numbers, gross/net weights, CBM and tare specifications.'
                      }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setAiDraftTarget(mode.id as any)}
                        className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          aiDraftTarget === mode.id
                            ? 'bg-red-600/20 border-red-500 text-white shadow-md'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{mode.title}</span>
                          {aiDraftTarget === mode.id && (
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{mode.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 3: Custom Trade Instructions & Quick Tags */}
              <div className="space-y-2 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Wand2 size={14} className="text-red-400" />
                    <span>3. Custom Trade Conditions & Regulatory Instructions (Optional)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Click pills to append conditions:</span>
                </div>

                <div className="flex flex-wrap gap-2 pb-1">
                  {[
                    '+ South Korea (Hana Bank L/C at sight, Busan CFS)',
                    '+ USA West Coast (Los Angeles USLAX, FOB Chittagong)',
                    '+ Europe (Hamburg Port DEHAM, GSP Form-A origin)',
                    '+ Japan (Yokohama Port, Tokyo Merchandising spec)',
                    '+ 40ft High Cube FCL Container with barrier seals',
                    '+ 100% Combed Ringspun Cotton 220 GSM Bio-Washed',
                    '+ Pre-shrunk French Terry Hoodie 360 GSM',
                    '+ AQL 2.5 Major / 4.0 Minor Strict Inspection'
                  ].map((pill, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const cleanPill = pill.replace(/^\+\s*/, '');
                        setAiCustomPrompt((prev) => (prev ? `${prev}, ${cleanPill}` : cleanPill));
                      }}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white/5 hover:bg-red-600/30 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                    >
                      {pill}
                    </button>
                  ))}
                </div>

                <textarea
                  value={aiCustomPrompt}
                  onChange={(e) => setAiCustomPrompt(e.target.value)}
                  placeholder="e.g. Specify Letter of Credit at sight through Hana Bank Seoul. Require 7-ply heavy corrugated export cartons with silica gel desiccant packs in every carton..."
                  rows={2}
                  className="w-full bg-slate-900/90 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 leading-relaxed"
                />
              </div>

              {/* Action Button Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Bot size={16} className="text-red-400" />
                  <span>
                    Gemini will synthesize HS codes, weights, carton ratios, Incoterms, and legal declarations.
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {aiCustomPrompt && (
                    <button
                      type="button"
                      onClick={() => setAiCustomPrompt('')}
                      className="text-xs text-slate-400 hover:text-white underline underline-offset-4 font-bold cursor-pointer"
                    >
                      Clear Notes
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleExecuteAiDraft}
                    disabled={isAiGenerating}
                    className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white text-xs font-black uppercase tracking-wider shadow-xl shadow-red-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isAiGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Drafting with Gemini AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-white" />
                        <span>Draft Export Documents with AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Compliance & Classification Insights Panel */}
          {aiComplianceInsights && (
            <div className="pt-4 border-t border-white/10 space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck size={16} />
                    <span>AI Compliance & Classification Advisory ({aiModelLabel || 'Gemini 3.8 Flash'})</span>
                  </h4>
                </div>

                {/* Quick Toggle Viewers for both drafted documents */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTemplate('commercial-invoice');
                      setFormData((f) => ({ ...f, templateType: 'commercial-invoice' }));
                      setActiveTab('preview');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTemplate === 'commercial-invoice'
                        ? 'bg-red-600 text-white shadow'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    <FileText size={12} />
                    <span>View Commercial Invoice</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTemplate('packing-list');
                      setFormData((f) => ({ ...f, templateType: 'packing-list' }));
                      setActiveTab('preview');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTemplate === 'packing-list'
                        ? 'bg-red-600 text-white shadow'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    <Package size={12} />
                    <span>View Packing List</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
                    <Hash size={12} /> HS Code Classification
                  </p>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {aiComplianceInsights.hsCodeRationale}
                  </p>
                </div>

                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1">
                    <Compass size={12} /> Incoterms & Risk Allocation
                  </p>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {aiComplianceInsights.incotermsRiskTransfer}
                  </p>
                </div>

                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                    <Boxes size={12} /> Packaging & Tare Safety
                  </p>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {aiComplianceInsights.packagingSafetyAdvice}
                  </p>
                  {aiPackingSummary && (
                    <p className="text-[10px] text-amber-300 font-mono pt-1">
                      {aiPackingSummary.totalCartons} ctns • {aiPackingSummary.totalGrossWeightKg} kg gross • {aiPackingSummary.totalCbm} CBM
                    </p>
                  )}
                </div>

                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1">
                    <Stamp size={12} /> Customs & EXP Regulatory
                  </p>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {aiComplianceInsights.regulatoryCheck ||
                      'Verified compliant with Bangladesh Bank FX circular and international trade documentation standards.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Control Strip: Template Selector & Live Shipment Pre-fill */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 no-print">
        {/* Template Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-full xl:w-auto">
          {[
            { id: 'commercial-invoice', label: 'Commercial Invoice (Customs/Bank)', icon: FileText },
            { id: 'invoice', label: 'Export Sales Invoice (Billing)', icon: Receipt },
            { id: 'packing-list', label: 'Packing & Weight List', icon: Package },
            { id: 'bill-of-lading', label: 'Ocean Bill of Lading (B/L)', icon: Ship }
          ].map(tmpl => {
            const Icon = tmpl.icon;
            const isActive = activeTemplate === tmpl.id;
            return (
              <button
                key={tmpl.id}
                onClick={() => {
                  setActiveTemplate(tmpl.id as DocumentTemplateType);
                  setFormData(f => ({ ...f, templateType: tmpl.id as DocumentTemplateType }));
                }}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-red-400' : 'text-slate-400'}`} />
                <span>{tmpl.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live Firestore Shipment Pre-Fill */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="flex-1 min-w-[280px]">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Ship size={12} className="text-red-600" />
                <span>Pre-Fill from Firestore Shipments ({liveShipments.length})</span>
              </label>
            </div>
            <div className="relative">
              <select
                value={selectedShipmentId}
                onChange={e => handleSelectShipment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600 appearance-none pr-8 cursor-pointer"
              >
                <option value="">-- Select Shipment Record from Database --</option>
                {filteredShipments.map(s => (
                  <option key={s.id} value={s.id}>
                    #{s.id} • {s.buyerName || 'Client'} ({s.portOfDischarge || s.portOfDestination || 'Export'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-end gap-1.5 pt-4 xl:pt-0">
            <button
              onClick={() => applyPreset('korea')}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              title="Apply South Korea Export Trade Profile"
            >
              🇰🇷 S. Korea
            </button>
            <button
              onClick={() => applyPreset('japan')}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              title="Apply Japan Export Trade Profile"
            >
              🇯🇵 Japan
            </button>
            <button
              onClick={() => applyPreset('usa')}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              title="Apply USA Export Trade Profile"
            >
              🇺🇸 USA
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace: Side-by-side Editor & Live A4 Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Editor (5 Cols on large screens) */}
        <div className="lg:col-span-5 space-y-6 no-print">
          {/* Section 1: Document Metadata */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Hash className="w-4 h-4 text-red-600" />
              <span>Document Identifiers</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Doc / Invoice #</label>
                <input
                  type="text"
                  value={formData.docNumber}
                  onChange={e => setFormData({ ...formData, docNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Issue Date</label>
                <input
                  type="date"
                  value={formData.issueDate}
                  onChange={e => setFormData({ ...formData, issueDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">EXP Number</label>
                <input
                  type="text"
                  value={formData.expNumber}
                  onChange={e => setFormData({ ...formData, expNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Sales Contract #</label>
                <input
                  type="text"
                  value={formData.contractNumber}
                  onChange={e => setFormData({ ...formData, contractNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">L/C Number</label>
                <input
                  type="text"
                  value={formData.lcNumber}
                  onChange={e => setFormData({ ...formData, lcNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Incoterms</label>
                <select
                  value={formData.incoterms}
                  onChange={e => setFormData({ ...formData, incoterms: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                >
                  <option value="FOB Chittagong Port">FOB Chittagong</option>
                  <option value="CIF Busan Port">CIF Busan</option>
                  <option value="CIF Yokohama Port">CIF Yokohama</option>
                  <option value="CIF Long Beach">CIF Long Beach</option>
                  <option value="CFR Hamburg">CFR Hamburg</option>
                  <option value="EXW Factory Dhaka">EXW Factory</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Buyer & Consignee */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-red-600" />
              <span>Buyer / Consignee Profile</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Buyer / Company Name</label>
                <input
                  type="text"
                  value={formData.buyerName}
                  onChange={e => setFormData({ ...formData, buyerName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Attention / Contact Person</label>
                <input
                  type="text"
                  value={formData.buyerAttention}
                  onChange={e => setFormData({ ...formData, buyerAttention: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Full Delivery Address</label>
                <textarea
                  rows={2}
                  value={formData.buyerAddress}
                  onChange={e => setFormData({ ...formData, buyerAddress: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 leading-snug"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Destination Country</label>
                  <input
                    type="text"
                    value={formData.buyerCountry}
                    onChange={e => setFormData({ ...formData, buyerCountry: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tax ID / BIN</label>
                  <input
                    type="text"
                    value={formData.buyerTaxId}
                    onChange={e => setFormData({ ...formData, buyerTaxId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Cargo & Line Items */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-600" />
                <span>Cargo & Line Items ({items.length})</span>
              </h3>
              <button
                onClick={addItemRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-[11px] font-black uppercase tracking-wider transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {items.map((it, idx) => (
                <div key={it.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Item #{idx + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItemRow(it.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
                        title="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Style Number</label>
                      <input
                        type="text"
                        value={it.styleNumber}
                        onChange={e => updateItem(it.id, 'styleNumber', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Color / Spec</label>
                      <input
                        type="text"
                        value={it.colorName}
                        onChange={e => updateItem(it.id, 'colorName', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block">Item Description</label>
                    <input
                      type="text"
                      value={it.itemDescription}
                      onChange={e => updateItem(it.id, 'itemDescription', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Quantity</label>
                      <input
                        type="number"
                        value={it.quantity}
                        onChange={e => updateItem(it.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Unit Price ($)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={it.unitPrice}
                        onChange={e => updateItem(it.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Cartons</label>
                      <input
                        type="number"
                        value={it.cartons}
                        onChange={e => updateItem(it.id, 'cartons', parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">CBM</label>
                      <input
                        type="number"
                        step="0.1"
                        value={it.cbm}
                        onChange={e => updateItem(it.id, 'cbm', parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Security & Watermark Controls */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Authentication & Security Watermarks</span>
            </h3>

            {/* Watermark Text & Quick Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Security Watermark Text (কোম্পানির নাম / সিকিউরিটি টেক্সট)</label>
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Micro-Pattern Protected
                </span>
              </div>
              <input
                type="text"
                value={formData.watermarkText}
                onChange={e => setFormData({ ...formData, watermarkText: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                placeholder="e.g. RED BIRD INTERNATIONAL"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  'RED BIRD INTERNATIONAL',
                  'রেড বার্ড ইন্টারন্যাশনাল',
                  'RED BIRD INTERNATIONAL • SECURITY VERIFIED',
                  'RED BIRD INTERNATIONAL • ORIGINAL DOCUMENT',
                  'RED BIRD INTERNATIONAL • DHAKA BANGLADESH'
                ].map((txt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFormData({ ...formData, watermarkText: txt, showWatermark: true })}
                    className={`text-[9.5px] px-2.5 py-1 rounded-lg font-bold border transition-colors ${
                      formData.watermarkText === txt && formData.showWatermark
                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {txt}
                  </button>
                ))}
              </div>
            </div>

            {/* Pattern Mode Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase block">Security Watermark Layout</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, watermarkPattern: 'both' })}
                  className={`p-2 rounded-xl text-left border text-xs font-bold transition-all ${
                    formData.watermarkPattern === 'both' ? 'border-red-600 bg-red-50 text-red-900' : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="block text-[11px] font-black">Repeating Text + Sovereign Seal</span>
                  <span className="block text-[9px] text-slate-500 font-normal">Repeating 'Red Bird International' Grid with Central Emblem</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, watermarkPattern: 'micro-security' })}
                  className={`p-2 rounded-xl text-left border text-xs font-bold transition-all ${
                    formData.watermarkPattern === 'micro-security' ? 'border-red-600 bg-red-50 text-red-900' : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="block text-[11px] font-black">Repeating Watermark Grid Only</span>
                  <span className="block text-[9px] text-slate-500 font-normal">Continuous low-opacity diagonal repeating text background</span>
                </button>
              </div>
            </div>

            {/* Opacity Slider */}
            <div>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase mb-1">
                <span>Watermark Visibility</span>
                <span>{Math.round((formData.watermarkOpacity || 0.055) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="0.20"
                step="0.01"
                value={formData.watermarkOpacity || 0.055}
                onChange={e => setFormData({ ...formData, watermarkOpacity: parseFloat(e.target.value) })}
                className="w-full accent-red-600"
              />
            </div>

            {/* Feature Checkboxes */}
            <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showWatermark}
                  onChange={e => setFormData({ ...formData, showWatermark: e.target.checked })}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span className="font-bold text-slate-700">Diagonal Watermark</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showGuilloche !== false}
                  onChange={e => setFormData({ ...formData, showGuilloche: e.target.checked })}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span className="font-bold text-slate-700">Anti-Tamper Guilloche</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showSeal}
                  onChange={e => setFormData({ ...formData, showSeal: e.target.checked })}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span className="font-bold text-slate-700">Company Seal / Stamp</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showSignature}
                  onChange={e => setFormData({ ...formData, showSignature: e.target.checked })}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span className="font-bold text-slate-700">Digital Signature</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer col-span-2">
                <input
                  type="checkbox"
                  checked={formData.showQrCode}
                  onChange={e => setFormData({ ...formData, showQrCode: e.target.checked })}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span className="font-bold text-slate-700">Digital Verification QR Gateway</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Live Printable Document Preview (7 Cols on large screens) */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-t-[2rem] flex items-center justify-between no-print text-xs font-black uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>
                Standard Letterhead Output • {activeTemplate === 'commercial-invoice' ? 'Commercial Invoice' : activeTemplate === 'invoice' ? 'Commercial Export Invoice' : activeTemplate === 'packing-list' ? 'Export Packing List' : 'Ocean Bill of Lading'}
              </span>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">ISO A4 (210 × 297 mm)</span>
          </div>

          {/* Unified Realistic A4 Export Letterhead Document Sheet */}
          <div className="bg-slate-200/80 p-2 sm:p-4 rounded-b-[2.5rem] shadow-inner overflow-x-auto flex justify-center">
            <UnifiedExportLetterheadDocument
              containerRef={documentPrintRef}
              data={{
                docType: activeTemplate as any,
                docNumber: formData.docNumber,
                issueDate: formData.issueDate,
                dueDate: formData.dueDate,
                piPoRef: formData.bookingRef || formData.contractNumber || 'SC-RBI-KR-2026-09',
                shipmentDate: formData.expiryOrShippedDate,
                incoterms: formData.incoterms,
                paymentTerms: formData.paymentTerms,
                currency: formData.currency,
                exchangeRate: formData.exchangeRate,

                portOfLoading: formData.portOfLoading,
                portOfDischarge: formData.portOfDischarge,
                finalDestination: formData.finalDestination,
                transportMode: formData.transportMode,
                vesselName: formData.vesselName,
                voyageNo: formData.voyageOrFlightNo,
                containerNumber: formData.containerNumber,
                sealNumber: formData.sealNumber,
                blNumber: formData.blNumber,
                expNumber: formData.expNumber,
                lcNumber: formData.lcNumber,

                shipperName: formData.shipperName,
                shipperAddress: formData.shipperAddress,
                shipperTel: formData.shipperContact,
                shipperEmail: formData.shipperEmail,
                shipperWeb: formData.shipperWebsite,
                shipperBinTin: formData.shipperBinVat,

                buyerName: formData.buyerName,
                buyerAddress: formData.buyerAddress,
                buyerCityCountry: `${formData.buyerCountry || 'South Korea'}`,
                buyerTel: formData.buyerContact,
                buyerEmail: formData.buyerEmail,
                buyerTaxId: formData.buyerTaxId,
                notifyParty: formData.notifyParty,

                noOfPackages: `${formData.totalCartons || calculatedTotals.totalCtns || 260} Master Cartons`,
                grossWeight: `${formData.totalGrossWeightKg || calculatedTotals.totalGrossWt || 4130} KGS`,
                netWeight: `${formData.totalNetWeightKg || calculatedTotals.totalNetWt || 3870} KGS`,
                marksAndNumbers: formData.marksAndNumbers,
                totalCbm: formData.totalCbm || calculatedTotals.totalCbm || 24.4,

                bankName: formData.bankName,
                accountName: formData.accountName,
                accountNumber: formData.accountNumber,
                swiftCode: formData.swiftCode,
                branchName: `${formData.bankBranch} • ${formData.bankAddress || ''}`,

                declarationText: formData.declarationText,
                amountInWords: calculatedTotals.words,
                authorizedSignatoryName: formData.authorizedSignatoryName,
                authorizedSignatoryTitle: formData.authorizedSignatoryTitle,

                showWatermark: formData.showWatermark,
                watermarkText: formData.watermarkText,
                watermarkOpacity: formData.watermarkOpacity,
                watermarkPattern: formData.watermarkPattern,
                showGuilloche: formData.showGuilloche,
                showQrCode: formData.showQrCode,
                showSeal: formData.showSeal,
                showSignature: formData.showSignature,
                sealUrl: corpSeal,
                signatureUrl: corpSignature
              }}
              items={items.map(it => ({
                id: it.id,
                itemDescription: it.itemDescription,
                styleNumber: it.styleNumber,
                colorName: it.colorName,
                hsCode: it.hsCode,
                quantity: it.quantity,
                unit: 'PCS',
                unitPrice: it.unitPrice,
                totalAmount: it.totalAmount,
                cartons: it.cartons,
                grossWeightKg: it.grossWeightKg,
                netWeightKg: it.netWeightKg,
                cbm: it.cbm,
                origin: 'Bangladesh',
                remarks: 'AQL 2.5'
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// TEMPLATE 1: COMMERCIAL INVOICE (International Customs & Bank L/C Standard)
// =========================================================================
interface TemplateViewProps {
  formData: DocumentFormData;
  items: DocItem[];
  totals: {
    totalQty: number;
    subtotalValue: number;
    totalValue: number;
    totalCtns: number;
    totalGrossWt: number;
    totalNetWt: number;
    totalCbm: number;
    words: string;
  };
  corpSeal: string | null;
  corpSignature: string | null;
}

const CommercialInvoiceView: React.FC<TemplateViewProps> = ({
  formData,
  items,
  totals,
  corpSeal,
  corpSignature
}) => {
  const qrVerificationUrl = `https://redbird-international.com/verify?doc=${formData.docNumber}&buyer=${encodeURIComponent(formData.buyerName)}&val=${totals.totalValue}`;

  return (
    <div className="relative z-10 space-y-6 text-[11px] leading-snug font-sans">
      {/* Official Red Bird Header */}
      <div className="border-b-2 border-red-600 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="w-5 h-5 rounded-full bg-red-600 inline-block shrink-0"></span>
              <h1 className="text-2xl sm:text-3xl font-black text-red-600 tracking-tight uppercase">
                {formData.shipperName}
              </h1>
            </div>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
              {formData.shipperTagline}
            </p>
            <p className="text-[10px] text-slate-600 max-w-md">
              {formData.shipperAddress}
            </p>
            <p className="text-[9px] text-slate-500 mt-1 font-mono">
              Factory: {formData.shipperFactory} • Tel: {formData.shipperContact} • {formData.shipperBinVat}
            </p>
          </div>

          <div className="text-right flex flex-col items-end">
            <span className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-black uppercase tracking-widest inline-block mb-2 shadow-sm">
              COMMERCIAL INVOICE
            </span>
            <p className="text-sm font-black text-slate-900 font-mono">{formData.docNumber}</p>
            <p className="text-[10px] text-slate-500 font-medium">Issue Date: {formData.issueDate}</p>
            <p className="text-[10px] text-slate-500 font-mono">EXP No: {formData.expNumber}</p>
          </div>
        </div>
      </div>

      {/* Information Cards: Shipper vs Consignee */}
      <div className="grid grid-cols-2 gap-4">
        {/* Consignee */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <p className="text-[9px] font-black uppercase tracking-wider text-red-600 mb-1.5">
            CONSIGNEE / APPLICANT / BUYER:
          </p>
          <p className="font-black text-slate-900 text-xs">{formData.buyerName}</p>
          <p className="text-slate-600 font-medium">{formData.buyerAttention}</p>
          <p className="text-slate-600 whitespace-pre-line mt-1">{formData.buyerAddress}</p>
          <p className="text-slate-600 font-bold mt-1">Country: {formData.buyerCountry}</p>
          <p className="text-slate-500 font-mono text-[10px]">Tax ID: {formData.buyerTaxId}</p>
        </div>

        {/* Shipping & Payment Terms */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5 text-[10px]">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
            TRADE & L/C SPECIFICATIONS:
          </p>
          <div className="flex justify-between border-b border-slate-200/60 pb-1">
            <span className="text-slate-500">Incoterms:</span>
            <span className="font-bold text-slate-900">{formData.incoterms}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-1">
            <span className="text-slate-500">Payment Condition:</span>
            <span className="font-bold text-slate-900">{formData.paymentTerms}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-1">
            <span className="text-slate-500">Port of Loading:</span>
            <span className="font-bold text-slate-900">{formData.portOfLoading}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-1">
            <span className="text-slate-500">Port of Discharge:</span>
            <span className="font-bold text-slate-900">{formData.portOfDischarge}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Contract / L/C:</span>
            <span className="font-mono font-bold text-slate-900">{formData.contractNumber} / {formData.lcNumber}</span>
          </div>
        </div>
      </div>

      {/* Itemized Commercial Table */}
      <div>
        <table className="w-full border-collapse text-left text-[10px]">
          <thead>
            <tr className="bg-slate-900 text-white font-bold uppercase text-[9px]">
              <th className="p-2.5 border border-slate-800 text-center w-8">#</th>
              <th className="p-2.5 border border-slate-800">Description of Goods</th>
              <th className="p-2.5 border border-slate-800">Style / Color</th>
              <th className="p-2.5 border border-slate-800 text-center">HS Code</th>
              <th className="p-2.5 border border-slate-800 text-right">Quantity</th>
              <th className="p-2.5 border border-slate-800 text-right">Unit Price ({formData.currency})</th>
              <th className="p-2.5 border border-slate-800 text-right">FOB Value ({formData.currency})</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={it.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                <td className="p-2 border border-slate-200 text-center font-bold text-slate-500">{idx + 1}</td>
                <td className="p-2 border border-slate-200 font-bold text-slate-900">
                  {it.itemDescription}
                  <span className="block text-[8px] font-normal text-slate-500">Master Cartons: {it.cartons} Cartons</span>
                </td>
                <td className="p-2 border border-slate-200 text-slate-700 font-mono">
                  {it.styleNumber}
                  <span className="block text-[9px] text-slate-500">{it.colorName}</span>
                </td>
                <td className="p-2 border border-slate-200 text-center font-mono text-slate-600">{it.hsCode}</td>
                <td className="p-2 border border-slate-200 text-right font-black font-mono text-slate-900">
                  {it.quantity.toLocaleString()} Pcs
                </td>
                <td className="p-2 border border-slate-200 text-right font-mono font-bold text-slate-700">
                  ${it.unitPrice.toFixed(2)}
                </td>
                <td className="p-2 border border-slate-200 text-right font-mono font-black text-slate-900">
                  ${it.totalAmount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-400">
              <td colSpan={4} className="p-2.5 border border-slate-300 uppercase text-right">
                GRAND TOTAL ({formData.incoterms}):
              </td>
              <td className="p-2.5 border border-slate-300 text-right font-mono font-black">
                {totals.totalQty.toLocaleString()} PCS
              </td>
              <td className="p-2.5 border border-slate-300 text-right font-mono">-</td>
              <td className="p-2.5 border border-slate-300 text-right font-mono font-black text-xs text-red-600">
                ${totals.totalValue.toLocaleString()} {formData.currency}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Amount in Words */}
      <div className="p-3 bg-red-50/80 rounded-xl border border-red-200 flex items-center justify-between">
        <span className="font-black text-slate-900 uppercase text-[9px] tracking-wider">Amount in Words:</span>
        <span className="font-serif italic font-bold text-slate-900 text-xs">{totals.words}</span>
      </div>

      {/* Exporter Legal Declaration & Bank Instructions */}
      <div className="grid grid-cols-2 gap-4">
        {/* Bank Wire Details */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[9px] space-y-1">
          <p className="font-black uppercase text-slate-900 mb-1 flex items-center gap-1.5">
            <CreditCard size={12} className="text-red-600" />
            <span>Remittance & Banking Instructions:</span>
          </p>
          <p><span className="text-slate-500">Bank:</span> <strong className="text-slate-900">{formData.bankName}</strong></p>
          <p><span className="text-slate-500">Branch:</span> <strong className="text-slate-900">{formData.bankBranch}</strong></p>
          <p><span className="text-slate-500">Account Name:</span> <strong className="text-slate-900">{formData.accountName}</strong></p>
          <p><span className="text-slate-500">Account Number:</span> <strong className="font-mono text-slate-900">{formData.accountNumber}</strong></p>
          <p><span className="text-slate-500">SWIFT Code:</span> <strong className="font-mono text-red-600">{formData.swiftCode}</strong></p>
        </div>

        {/* Declaration */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[9px] flex flex-col justify-between">
          <div>
            <p className="font-black uppercase text-slate-900 mb-1 flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-emerald-600" />
              <span>Exporter Legal Declaration:</span>
            </p>
            <p className="text-slate-600 leading-relaxed italic text-[8.5px]">
              "{formData.declarationText}"
            </p>
          </div>
          <p className="text-slate-400 font-mono text-[8px] mt-2">
            Origin: People's Republic of Bangladesh • ISO 9001:2015 Compliant
          </p>
        </div>
      </div>

      {/* Official Signatures, Seal & QR Verification */}
      <div className="pt-4 border-t-2 border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {formData.showQrCode && (
            <div className="p-1.5 bg-white border border-slate-300 rounded-lg shadow-sm">
              <QRCodeSVG value={qrVerificationUrl} size={50} />
            </div>
          )}
          <div className="text-[8px] text-slate-500">
            <p className="font-bold text-slate-800 uppercase">Document Verification Gateway</p>
            <p>Scan to verify authenticity via Red Bird International Registry</p>
            <p className="font-mono text-[7px] text-slate-400 mt-0.5">SHA-256 Verified</p>
          </div>
        </div>

        <div className="relative text-right min-w-[200px]">
          {formData.showSeal && (
            <div className="absolute -top-10 right-28 opacity-85 pointer-events-none">
              {corpSeal ? (
                <img src={corpSeal} alt="Seal" className="w-20 h-20 object-contain rotate-6" />
              ) : (
                <div className="w-20 h-20 rounded-full border-2 border-red-600 flex flex-col items-center justify-center text-[7px] font-black text-red-600 uppercase text-center rotate-6">
                  <span>RED BIRD</span>
                  <span>SEAL OF AUTH</span>
                  <span>DHAKA</span>
                </div>
              )}
            </div>
          )}

          <div className="relative z-10 space-y-1">
            {formData.showSignature && (
              <div className="h-10 flex items-end justify-end">
                {corpSignature ? (
                  <img src={corpSignature} alt="Signature" className="h-9 object-contain" />
                ) : (
                  <span className="font-serif italic text-base text-red-700 font-black">
                    Md. Sumon
                  </span>
                )}
              </div>
            )}
            <div className="border-t-2 border-slate-900 pt-1">
              <p className="font-black text-slate-900 text-[10px] uppercase">
                {formData.authorizedSignatoryName}
              </p>
              <p className="text-[8px] text-slate-500 uppercase">{formData.authorizedSignatoryTitle}</p>
              <p className="text-[8px] font-bold text-red-600 uppercase">{formData.shipperName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// TEMPLATE 2: EXPORT SALES INVOICE (Billing & Account Remittance Standard)
// =========================================================================
const ExportInvoiceView: React.FC<TemplateViewProps> = ({
  formData,
  items,
  totals,
  corpSeal,
  corpSignature
}) => {
  const qrVerificationUrl = `https://redbird-international.com/verify?doc=${formData.docNumber}&buyer=${encodeURIComponent(formData.buyerName)}&val=${totals.totalValue}`;

  return (
    <div className="relative z-10 space-y-6 text-[11px] leading-snug font-sans">
      {/* Modern Clean Header */}
      <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-5 h-5 rounded-md bg-slate-950 text-white flex items-center justify-center font-black text-xs">
              RB
            </span>
            <h1 className="text-2xl font-black text-slate-950 uppercase tracking-tight">
              {formData.shipperName}
            </h1>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            GARMENT MANUFACTURING & INTERNATIONAL TRADE
          </p>
          <p className="text-[9px] text-slate-600 mt-1 max-w-sm">{formData.shipperAddress}</p>
          <p className="text-[9px] text-slate-500 font-mono">
            Contact: {formData.shipperContact} • Email: {formData.shipperEmail}
          </p>
        </div>

        <div className="text-right">
          <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tight">
            INVOICE
          </h2>
          <p className="text-base font-black text-red-600 font-mono mt-1">{formData.docNumber}</p>
          <div className="mt-2 space-y-0.5 text-[10px] text-slate-600">
            <p><span className="text-slate-400 uppercase">Invoice Date:</span> <strong className="text-slate-900">{formData.issueDate}</strong></p>
            <p><span className="text-slate-400 uppercase">Due Date:</span> <strong className="text-slate-900">{formData.dueDate}</strong></p>
            <p><span className="text-slate-400 uppercase">Payment Terms:</span> <strong className="text-slate-900">{formData.paymentTerms}</strong></p>
          </div>
        </div>
      </div>

      {/* Bill To & Ship To Grid */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
            BILLED TO:
          </p>
          <p className="font-black text-slate-950 text-sm">{formData.buyerName}</p>
          <p className="text-slate-700 font-medium">{formData.buyerAttention}</p>
          <p className="text-slate-600 whitespace-pre-line mt-1 text-[10px]">{formData.buyerAddress}</p>
          <p className="text-slate-700 font-bold mt-1 text-[10px]">Country: {formData.buyerCountry}</p>
          <p className="text-slate-500 font-mono text-[9px]">Tax / Reg: {formData.buyerTaxId}</p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-[10px] space-y-1.5">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
            LOGISTICS & DISPATCH SUMMARY:
          </p>
          <div className="flex justify-between">
            <span className="text-slate-500">Delivery Terms:</span>
            <span className="font-bold text-slate-900">{formData.incoterms}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Port of Loading:</span>
            <span className="font-bold text-slate-900">{formData.portOfLoading}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Port of Destination:</span>
            <span className="font-bold text-slate-900">{formData.portOfDischarge}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Vessel / Transport:</span>
            <span className="font-mono font-bold text-slate-900">{formData.vesselName}</span>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div>
        <table className="w-full border-collapse text-left text-[10px]">
          <thead>
            <tr className="border-b-2 border-slate-900 text-slate-900 font-black uppercase text-[9px]">
              <th className="py-2.5 w-8">#</th>
              <th className="py-2.5">Item & Specification</th>
              <th className="py-2.5">Style / Color</th>
              <th className="py-2.5 text-right">Quantity</th>
              <th className="py-2.5 text-right">Rate ({formData.currency})</th>
              <th className="py-2.5 text-right">Amount ({formData.currency})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-medium">
            {items.map((it, idx) => (
              <tr key={it.id}>
                <td className="py-3 text-slate-400 font-mono">{idx + 1}</td>
                <td className="py-3 font-bold text-slate-900">
                  {it.itemDescription}
                  <span className="block text-[9px] font-normal text-slate-500">Cartons: {it.cartons} | CBM: {it.cbm}</span>
                </td>
                <td className="py-3 font-mono text-slate-700">
                  {it.styleNumber}
                  <span className="block text-[9px] text-slate-500">{it.colorName}</span>
                </td>
                <td className="py-3 text-right font-black font-mono text-slate-900">
                  {it.quantity.toLocaleString()} Pcs
                </td>
                <td className="py-3 text-right font-mono text-slate-700">
                  ${it.unitPrice.toFixed(2)}
                </td>
                <td className="py-3 text-right font-mono font-black text-slate-900">
                  ${it.totalAmount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Subtotal & Total Payable Grid */}
      <div className="flex justify-end pt-4 border-t-2 border-slate-900">
        <div className="w-72 space-y-2 text-[10px]">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-mono font-bold text-slate-900">${totals.subtotalValue.toLocaleString()}</span>
          </div>
          {formData.freightCharges > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Ocean Freight Charges:</span>
              <span className="font-mono font-bold text-slate-900">${formData.freightCharges.toLocaleString()}</span>
            </div>
          )}
          {formData.insuranceCharges > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Marine Cargo Insurance:</span>
              <span className="font-mono font-bold text-slate-900">${formData.insuranceCharges.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-black text-slate-950 pt-2 border-t border-slate-300">
            <span>Total Payable:</span>
            <span className="font-mono text-red-600">${totals.totalValue.toLocaleString()} {formData.currency}</span>
          </div>
        </div>
      </div>

      {/* Payment Routing & Bank Details Box */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 gap-4 text-[9px]">
        <div>
          <p className="font-black uppercase text-slate-900 mb-1">WIRE TRANSFER DETAILS (SWIFT):</p>
          <p><span className="text-slate-500">Beneficiary:</span> <strong className="text-slate-900">{formData.beneficiaryName}</strong></p>
          <p><span className="text-slate-500">Bank Name:</span> <strong className="text-slate-900">{formData.bankName}</strong></p>
          <p><span className="text-slate-500">Branch:</span> <strong>{formData.bankBranch}</strong></p>
          <p><span className="text-slate-500">Account No:</span> <strong className="font-mono text-slate-900 text-[10px]">{formData.accountNumber}</strong></p>
          <p><span className="text-slate-500">SWIFT Code:</span> <strong className="font-mono text-red-600 text-[10px]">{formData.swiftCode}</strong></p>
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <p className="font-black uppercase text-slate-900 mb-1">TERMS & CONDITIONS:</p>
            <p className="text-slate-600 text-[8.5px] leading-relaxed">
              Payment is due according to the agreed L/C / T.T terms. Please quote invoice number {formData.docNumber} on your payment remittance advice.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            {formData.showQrCode && <QRCodeSVG value={qrVerificationUrl} size={38} />}
            <span className="text-[7.5px] text-slate-400">Scan for instant invoice authentication</span>
          </div>
        </div>
      </div>

      {/* Signature & Seal Footer */}
      <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
        <p className="text-[8px] text-slate-400 font-mono">
          Generated via Red Bird International Cloud ERP System
        </p>
        <div className="text-right space-y-1">
          {formData.showSignature && (
            <div className="h-8 flex items-end justify-end">
              {corpSignature ? (
                <img src={corpSignature} alt="" className="h-8 object-contain" />
              ) : (
                <span className="font-serif italic font-bold text-red-600">Md. Sumon</span>
              )}
            </div>
          )}
          <div className="border-t border-slate-900 pt-1">
            <p className="font-black text-slate-900 text-[9px] uppercase">{formData.authorizedSignatoryName}</p>
            <p className="text-[8px] text-slate-500 uppercase">{formData.authorizedSignatoryTitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// TEMPLATE 3: EXPORT PACKING LIST & WEIGHT SPECIFICATION
// =========================================================================
const PackingListView: React.FC<TemplateViewProps> = ({
  formData,
  items,
  totals,
  corpSeal,
  corpSignature
}) => {
  return (
    <div className="relative z-10 space-y-6 text-[10px] leading-snug font-sans">
      {/* Packing List Header */}
      <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            {formData.shipperName}
          </h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
            DETAILED EXPORT PACKING & WEIGHT SPECIFICATION LIST
          </p>
          <p className="text-[9px] text-slate-600">{formData.shipperAddress}</p>
        </div>

        <div className="text-right">
          <span className="px-3 py-1 bg-slate-950 text-white rounded text-[10px] font-black uppercase tracking-widest inline-block mb-1">
            PACKING LIST
          </span>
          <p className="font-mono font-black text-slate-900">PL-{formData.docNumber}</p>
          <p className="text-slate-500 text-[9px]">Invoice Ref: {formData.docNumber}</p>
          <p className="text-slate-500 text-[9px]">Date: {formData.issueDate}</p>
        </div>
      </div>

      {/* Consignee & Shipping Profile */}
      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
        <div>
          <p className="text-[8px] font-black uppercase text-slate-400 mb-1">BUYER / CONSIGNEE:</p>
          <p className="font-black text-slate-900 text-xs">{formData.buyerName}</p>
          <p className="text-slate-600 text-[9px]">{formData.buyerAddress}</p>
          <p className="text-slate-600 font-bold text-[9px] mt-0.5">Destination: {formData.buyerCountry}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[9px]">
          <div>
            <span className="text-slate-400 block text-[8px] uppercase">Port of Loading</span>
            <span className="font-bold text-slate-900">{formData.portOfLoading}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[8px] uppercase">Port of Discharge</span>
            <span className="font-bold text-slate-900">{formData.portOfDischarge}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[8px] uppercase">Vessel / Voyage</span>
            <span className="font-mono font-bold text-slate-900">{formData.vesselName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[8px] uppercase">Container #</span>
            <span className="font-mono font-bold text-slate-900">{formData.containerNumber}</span>
          </div>
        </div>
      </div>

      {/* Detailed Packing Breakdown */}
      <table className="w-full border border-slate-300 text-left text-[9px]">
        <thead>
          <tr className="bg-slate-900 text-white font-bold uppercase text-[8px]">
            <th className="p-2 border border-slate-800 text-center w-16">Ctn Range</th>
            <th className="p-2 border border-slate-800">Style No. & Item</th>
            <th className="p-2 border border-slate-800">Color</th>
            <th className="p-2 border border-slate-800 text-center">Ratio / Size</th>
            <th className="p-2 border border-slate-800 text-right">Pcs/Ctn</th>
            <th className="p-2 border border-slate-800 text-right">Total Pcs</th>
            <th className="p-2 border border-slate-800 text-right">Net Wt (Kg)</th>
            <th className="p-2 border border-slate-800 text-right">Gross Wt (Kg)</th>
            <th className="p-2 border border-slate-800 text-right">CBM</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => {
            const startCtn = idx === 0 ? 1 : items.slice(0, idx).reduce((s, i) => s + i.cartons, 1);
            const endCtn = startCtn + it.cartons - 1;
            const pcsPerCtn = Math.round(it.quantity / (it.cartons || 1));

            return (
              <tr key={it.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="p-2 border border-slate-200 text-center font-mono font-bold text-red-600">
                  {startCtn} - {endCtn}
                </td>
                <td className="p-2 border border-slate-200 font-bold text-slate-900">
                  {it.styleNumber}
                  <span className="block text-[8px] font-normal text-slate-500">{it.itemDescription}</span>
                </td>
                <td className="p-2 border border-slate-200 text-slate-700">{it.colorName}</td>
                <td className="p-2 border border-slate-200 text-center text-slate-600 font-mono text-[8px]">{it.sizeRatio || 'Assorted'}</td>
                <td className="p-2 border border-slate-200 text-right font-mono">{pcsPerCtn}</td>
                <td className="p-2 border border-slate-200 text-right font-black text-slate-900">{it.quantity.toLocaleString()}</td>
                <td className="p-2 border border-slate-200 text-right font-mono">{it.netWeightKg.toLocaleString()}</td>
                <td className="p-2 border border-slate-200 text-right font-mono font-bold">{it.grossWeightKg.toLocaleString()}</td>
                <td className="p-2 border border-slate-200 text-right font-mono">{it.cbm}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-400">
            <td className="p-2 border border-slate-300 text-center">{totals.totalCtns} CTNS</td>
            <td colSpan={4} className="p-2 border border-slate-300 uppercase text-right">TOTALS:</td>
            <td className="p-2 border border-slate-300 text-right font-black">{totals.totalQty.toLocaleString()} PCS</td>
            <td className="p-2 border border-slate-300 text-right font-mono">{totals.totalNetWt.toLocaleString()} KG</td>
            <td className="p-2 border border-slate-300 text-right font-mono font-black">{totals.totalGrossWt.toLocaleString()} KG</td>
            <td className="p-2 border border-slate-300 text-right font-mono font-black">{totals.totalCbm} CBM</td>
          </tr>
        </tfoot>
      </table>

      {/* Packaging Summary Box */}
      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 grid grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-[8px] font-black text-slate-400 uppercase">Total Cartons</p>
          <p className="text-base font-black text-slate-900 font-mono">{totals.totalCtns}</p>
        </div>
        <div>
          <p className="text-[8px] font-black text-slate-400 uppercase">Total Pieces</p>
          <p className="text-base font-black text-slate-900 font-mono">{totals.totalQty.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[8px] font-black text-slate-400 uppercase">Gross Weight</p>
          <p className="text-base font-black text-red-600 font-mono">{totals.totalGrossWt.toLocaleString()} KG</p>
        </div>
        <div>
          <p className="text-[8px] font-black text-slate-400 uppercase">Total Volume</p>
          <p className="text-base font-black text-blue-600 font-mono">{totals.totalCbm} CBM</p>
        </div>
      </div>

      {/* Signature & Seal */}
      <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
        <p className="text-[8px] text-slate-400 font-mono">
          Shipping Marks: {formData.marksAndNumbers}
        </p>
        <div className="w-56 text-right space-y-1">
          {formData.showSignature && (
            <div className="h-8 flex items-end justify-end">
              {corpSignature ? (
                <img src={corpSignature} alt="" className="h-8 object-contain" />
              ) : (
                <span className="font-serif italic font-bold text-red-600">Md. Sumon</span>
              )}
            </div>
          )}
          <div className="border-t border-slate-900 pt-1">
            <p className="font-black text-slate-900 text-[10px] uppercase">{formData.authorizedSignatoryName}</p>
            <p className="text-[8px] text-slate-500 uppercase">Commercial & Logistics Department</p>
            <p className="text-[8px] text-red-600 font-bold uppercase">{formData.shipperName}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// TEMPLATE 4: OCEAN BILL OF LADING (FIATA & Hague-Visby Standard)
// =========================================================================
const BillOfLadingView: React.FC<TemplateViewProps> = ({
  formData,
  items,
  totals,
  corpSeal,
  corpSignature
}) => {
  const qrVerificationUrl = `https://redbird-international.com/verify?doc=${formData.blNumber}&buyer=${encodeURIComponent(formData.buyerName)}&val=${totals.totalValue}`;

  return (
    <div className="relative z-10 space-y-4 text-[10px] leading-snug font-sans">
      {/* Maritime Header */}
      <div className="border-b-2 border-slate-900 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">
              MULTIMODAL TRANSPORT DOCUMENT / OCEAN FREIGHT
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 uppercase">
              BILL OF LADING
            </h1>
            <p className="text-[9px] text-slate-600 font-mono mt-0.5">
              ISSUED SUBJECT TO THE HAGUE-VISBY RULES
            </p>
          </div>

          <div className="text-right border-2 border-slate-900 p-2.5 rounded-lg bg-slate-50 min-w-[200px]">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">B/L NUMBER</p>
            <p className="text-base font-black text-red-600 font-mono tracking-wider">{formData.blNumber}</p>
            <p className="text-[8px] text-slate-500 font-mono mt-0.5">Booking Ref: {formData.bookingRef}</p>
          </div>
        </div>
      </div>

      {/* Shipper & Consignee Box Grid */}
      <div className="border border-slate-900 grid grid-cols-2 divide-x divide-slate-900">
        <div className="divide-y divide-slate-900">
          <div className="p-2.5">
            <p className="text-[8px] font-black uppercase text-slate-500 mb-0.5">1. SHIPPER / EXPORTER</p>
            <p className="font-black text-slate-900 text-xs">{formData.shipperName}</p>
            <p className="text-[9px] text-slate-600">{formData.shipperAddress}</p>
          </div>

          <div className="p-2.5">
            <p className="text-[8px] font-black uppercase text-slate-500 mb-0.5">2. CONSIGNEE</p>
            <p className="font-black text-slate-900 text-xs">{formData.buyerName}</p>
            <p className="text-[9px] text-slate-600">{formData.buyerAddress}</p>
          </div>

          <div className="p-2.5">
            <p className="text-[8px] font-black uppercase text-slate-500 mb-0.5">3. NOTIFY PARTY</p>
            <p className="font-bold text-slate-800 text-[9px]">{formData.notifyParty}</p>
          </div>
        </div>

        <div className="divide-y divide-slate-900">
          <div className="grid grid-cols-2 divide-x divide-slate-900">
            <div className="p-2">
              <p className="text-[8px] font-black uppercase text-slate-500">OCEAN VESSEL</p>
              <p className="font-black text-slate-900 text-[9px] font-mono">{formData.vesselName}</p>
            </div>
            <div className="p-2">
              <p className="text-[8px] font-black uppercase text-slate-500">PORT OF LOADING</p>
              <p className="font-black text-slate-900 text-[9px]">{formData.portOfLoading}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-slate-900">
            <div className="p-2">
              <p className="text-[8px] font-black uppercase text-slate-500">PORT OF DISCHARGE</p>
              <p className="font-black text-slate-900 text-[9px]">{formData.portOfDischarge}</p>
            </div>
            <div className="p-2">
              <p className="text-[8px] font-black uppercase text-slate-500">PLACE OF DELIVERY</p>
              <p className="font-black text-slate-900 text-[9px]">{formData.placeOfDelivery}</p>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50">
            <p className="text-[8px] font-black uppercase text-slate-500">CONTAINER / SEAL NO.</p>
            <p className="font-mono font-black text-xs text-red-600">
              {formData.containerNumber} / SEAL: {formData.sealNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Cargo Particulars Section */}
      <table className="w-full border border-slate-900 text-left text-[9px]">
        <thead>
          <tr className="bg-slate-900 text-white font-black uppercase">
            <th className="p-2 border border-slate-800 w-1/4">Marks & Numbers</th>
            <th className="p-2 border border-slate-800 w-1/6 text-center">No. of Cartons</th>
            <th className="p-2 border border-slate-800">Description of Goods</th>
            <th className="p-2 border border-slate-800 text-right w-24">Gross Weight</th>
            <th className="p-2 border border-slate-800 text-right w-20">Volume</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-3 border border-slate-900 align-top font-mono leading-relaxed">
              <p className="font-bold text-slate-900">{formData.marksAndNumbers}</p>
              <p className="text-[8px] text-slate-500 mt-2">EXP: {formData.expNumber}</p>
              <p className="text-[8px] text-slate-500">CONTRACT: {formData.contractNumber}</p>
            </td>
            <td className="p-3 border border-slate-900 align-top text-center font-bold">
              <p className="text-xs font-black text-slate-900">{totals.totalCtns} CTNS</p>
              <p className="text-[8px] text-slate-500 mt-1">{formData.packageKind}</p>
            </td>
            <td className="p-3 border border-slate-900 align-top space-y-1">
              <p className="font-black text-slate-900 text-[10px] uppercase">
                {formData.generalDescription}
              </p>
              <div className="space-y-0.5 pt-1 text-[8px] text-slate-700">
                {items.map((it) => (
                  <p key={it.id}>
                    • {it.styleNumber} - {it.itemDescription} ({it.quantity.toLocaleString()} Pcs / {it.cartons} Cartons)
                  </p>
                ))}
              </div>
            </td>
            <td className="p-3 border border-slate-900 align-top text-right font-black font-mono">
              <p className="text-xs">{totals.totalGrossWt.toLocaleString()} KGS</p>
              <p className="text-[8px] font-normal text-slate-500">(Net: {totals.totalNetWt.toLocaleString()} KGS)</p>
            </td>
            <td className="p-3 border border-slate-900 align-top text-right font-black font-mono text-xs">
              {totals.totalCbm} CBM
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="bg-slate-100 font-black text-slate-900 border-t border-slate-900">
            <td className="p-2 border border-slate-900 uppercase">TOTALS:</td>
            <td className="p-2 border border-slate-900 text-center">{totals.totalCtns} CARTONS</td>
            <td className="p-2 border border-slate-900 uppercase">PIECES: {totals.totalQty.toLocaleString()} PCS</td>
            <td className="p-2 border border-slate-900 text-right font-mono">{totals.totalGrossWt.toLocaleString()} KGS</td>
            <td className="p-2 border border-slate-900 text-right font-mono">{totals.totalCbm} CBM</td>
          </tr>
        </tfoot>
      </table>

      {/* Maritime Freight Terms & Signature Grid */}
      <div className="border border-slate-900 grid grid-cols-3 divide-x divide-slate-900 text-[8px]">
        <div className="p-2.5 space-y-1">
          <p className="font-black uppercase text-slate-500">FREIGHT & CHARGES</p>
          <p className="text-xs font-black text-red-600 font-mono uppercase">{formData.freightTerms}</p>
          <p className="text-slate-500">Payable at: {formData.portOfLoading}</p>
        </div>

        <div className="p-2.5 space-y-1">
          <p className="font-black uppercase text-slate-500">ORIGINAL B/Ls ISSUED</p>
          <p className="text-xs font-black text-slate-900 font-mono uppercase">{formData.numberOfOriginals}</p>
          <p className="text-slate-500">Place of Issue: Dhaka, Bangladesh</p>
        </div>

        <div className="p-2.5 relative flex flex-col justify-between">
          <p className="font-black uppercase text-slate-500">SIGNED FOR THE CARRIER / MASTER</p>
          <div className="pt-6 border-t border-slate-400 mt-2">
            <p className="font-black text-slate-900 text-[9px] uppercase">RED BIRD INTERNATIONAL / LOGISTICS</p>
            <p className="text-slate-500">As Agents for the Carrier</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[7px] text-slate-500 pt-1">
        <div className="flex items-center gap-2">
          {formData.showQrCode && <QRCodeSVG value={qrVerificationUrl} size={32} />}
          <span>Verify Bill of Lading Authenticity via Global Carrier Registry</span>
        </div>
        <p className="font-mono">PAGE 1 OF 1 • ORIGINAL DOCUMENT</p>
      </div>
    </div>
  );
};

export default DocumentGenerator;
