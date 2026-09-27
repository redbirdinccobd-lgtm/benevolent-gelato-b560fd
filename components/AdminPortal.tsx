import { authenticatedFetch } from '../src/services/authenticatedFetch';

import React, { useState, useMemo, useRef } from 'react';
import { PRODUCTS } from '../constants';
import { Invoice, InvoiceItem, Agreement, SystemSettings, Expense, Budget, SalesContract, PortalUser } from '../types';
import { calculateDynamicPrice } from '../lib/pricing';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Mic, Globe, Sparkles, Bot, ArrowRight, FileText, TrendingUp, 
  Receipt, Package, Layers, ShieldCheck, CheckCircle2, RefreshCw, 
  BarChart3, Ship, Compass, Anchor, ArrowUpRight, Clock, Plus,
  SlidersHorizontal, Check, ExternalLink, Calendar, MapPin, Search,
  DollarSign, Activity, Truck, ChevronRight, Zap, Building2, X, Download,
  QrCode, Menu, Camera
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

import ShipmentProfile from './ShipmentProfile';
import AIAssistant from './AIAssistant';
import VoiceAssistantModal from './VoiceAssistantModal';
import CloudflareDomainManager from './CloudflareDomainManager';
import PackingListMatrix from './PackingListMatrix';
import ShipmentProfileForm from './ShipmentProfileForm';
import VisaInvitationModule from './VisaInvitationModule';
import OrderPlanningModule from './OrderPlanningModule';
import HRModule from './HRModule';
import OrderManagementModule from './OrderManagementModule';
import AdminRoutesModule from './AdminRoutesModule';
import { KPIDashboard } from './KPIDashboard';
import { TradePerformanceAnalytics } from './TradePerformanceAnalytics';
import { AdminTradeDashboardWidget } from './AdminTradeDashboardWidget';
import { ExportVolumeLeadTimeAnalytics } from './ExportVolumeLeadTimeAnalytics';
import { ExecutiveAnalyticsModule } from './ExecutiveAnalyticsModule';
import { ProFormaInvoiceGenerator } from './ProFormaInvoiceGenerator';
import { DocumentGenerator } from './DocumentGenerator';
import LetterheadSettings from './LetterheadSettings';
import ExpenseAccountsModule from './ExpenseAccountsModule';
import ShippingLabelModal from './ShippingLabelModal';
import SchedulePickupModal from './SchedulePickupModal';
import DomainConnectionModal from './DomainConnectionModal';
import LiveVoiceAgentBar from './LiveVoiceAgentBar';
import BuyerSourcingIntelligence from './BuyerSourcingIntelligence';
import DashboardPdfExportUtility, { DashboardDocType } from './DashboardPdfExportUtility';
import { AIDocumentParserModal, ParsedDocumentData } from './AIDocumentParserModal';
import { OfficialApplicationGenerator } from './OfficialApplicationGenerator';
import { QRScannerModal } from './QRScannerModal';
import RealTimeNotificationCenter from './RealTimeNotificationCenter';
import VoiceShipmentLogModal from './VoiceShipmentLogModal';
import VoiceInputButton from './VoiceInputButton';
import ShipmentHistoryLog from './ShipmentHistoryLog';
import ShipmentSummaryReport from './ShipmentSummaryReport';

import { db, auth, handleFirestoreError, OperationType } from '../src/firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp, updateDoc, deleteDoc, doc, orderBy, limit, setDoc, onSnapshot } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth';

const AdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'leadtime' | 'documents' | 'proforma' | 'applications' | 'shipment' | 'new-shipment' | 'catalog' | 'expenses' | 'settings' | 'history' | 'hr' | 'orders' | 'visa' | 'users' | 'routes'>('dashboard');
  const [analyticsSubView, setAnalyticsSubView] = useState<'kpi' | 'leadtime' | 'trade'>('kpi');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [financialCurrency, setFinancialCurrency] = useState<'USD' | 'BDT'>('USD');
  const [shipments, setShipments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  // Voice Assistant, Voice Shipment Logger & Cloudflare States
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [isVoiceShipmentLogModalOpen, setIsVoiceShipmentLogModalOpen] = useState(false);
  const [selectedVoiceShipmentId, setSelectedVoiceShipmentId] = useState<string>('');
  const [voicePrefilledShipment, setVoicePrefilledShipment] = useState<any>(null);
  const [isCloudflareModalOpen, setIsCloudflareModalOpen] = useState(false);
  const [shipmentSearchFilter, setShipmentSearchFilter] = useState('');
  const [selectedDocumentShipmentId, setSelectedDocumentShipmentId] = useState('');
  const [selectedOrderForDrafting, setSelectedOrderForDrafting] = useState<any>(null);
  const [prefilledEmbassyPrompt, setPrefilledEmbassyPrompt] = useState<string>('');

  // Quick Action Modals States
  const [isAiParserOpen, setIsAiParserOpen] = useState(false);
  const [isShippingLabelModalOpen, setIsShippingLabelModalOpen] = useState(false);
  const [selectedShipmentForLabel, setSelectedShipmentForLabel] = useState<any>(null);
  const [isSchedulePickupModalOpen, setIsSchedulePickupModalOpen] = useState(false);
  const [selectedShipmentForPickup, setSelectedShipmentForPickup] = useState<any>(null);
  const [isDomainConnectionModalOpen, setIsDomainConnectionModalOpen] = useState(false);
  const [selectedSummaryShipment, setSelectedSummaryShipment] = useState<any>(null);

  // Document Generation & Formatted PDF Export States
  const [isPdfExportUtilityOpen, setIsPdfExportUtilityOpen] = useState(false);
  const [pdfExportDocType, setPdfExportDocType] = useState<DashboardDocType>('shipping-manifest');
  const [pdfExportShipmentId, setPdfExportShipmentId] = useState<string>('');

  const handleOpenPdfUtility = (docType: DashboardDocType = 'shipping-manifest', shipmentId?: string) => {
    setPdfExportDocType(docType);
    if (shipmentId) setPdfExportShipmentId(shipmentId);
    else if (shipments.length > 0) setPdfExportShipmentId(shipments[0].id);
    setIsPdfExportUtilityOpen(true);
  };

  // Smart Dashboard Workspace Mode & Filter States
  const [dashboardViewMode, setDashboardViewMode] = useState<'operations' | 'buyers' | 'analytics' | 'corridors' | 'assistant'>('operations');
  const [dashboardShipmentSearch, setDashboardShipmentSearch] = useState('');
  const [dashboardStatusFilter, setDashboardStatusFilter] = useState<'all' | 'transit' | 'planning' | 'delivered'>('all');
  const [dashboardAnalyticsSub, setDashboardAnalyticsSub] = useState<'timeline' | 'corridor'>('timeline');

  // Workspace Minimizer & Full Screen States
  const [isFormFullScreen, setIsFormFullScreen] = useState(false);
  const [isFormMinimized, setIsFormMinimized] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);

  // Custom Passcode Login States
  const [loginMethod, setLoginMethod] = useState<'google' | 'passcode'>('google');
  const [emailInput, setEmailInput] = useState('');
  const [passcodeInput, setPasscodeInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Expenses Tab State
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('All');
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'Re-Processing',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Buyer Catalog State
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogTypeFilter, setCatalogTypeFilter] = useState('All');
  const [markupPercent, setMarkupPercent] = useState(20);
  const [selectedGarments, setSelectedGarments] = useState<Record<number, boolean>>(() => {
    // Select all by default
    const initial: Record<number, boolean> = {};
    PRODUCTS.forEach(p => { initial[p.id] = true; });
    return initial;
  });
  
  const isMasterAdmin = useMemo(() => {
    return currentUser?.email === 'redbird.inc.co.bd@gmail.com' || currentUser?.email === 'sumon.hanwha@gmail.com';
  }, [currentUser]);
  
  // Settings
  const [settingsCompany, setSettingsCompany] = useState('RED BIRD INTERNATIONAL');
  const [settingsAddress, setSettingsAddress] = useState('PLOT-100, MAJAR CHOW ROAD. UTTARKHAN DHAKA-1230');
  const [settingsContact, setSettingsContact] = useState('+880-1966-635-888');
  const [settingsEmail, setSettingsEmail] = useState('info@redbird-international.com');
  const [settingsWebsite, setSettingsWebsite] = useState('https://redbird-international.com');

  // Presentation / Catalog Generator State
  const catalogRef = useRef<HTMLDivElement>(null);

  const dynamicStats = useMemo(() => {
    const hasShipments = shipments.length > 0;
    const activeCount = hasShipments ? shipments.filter(s => s.status !== 'Delivered').length : 8;
    const pendingPcs = hasShipments 
      ? shipments.filter(s => s.status === 'In Planning').reduce((sum, s) => sum + (Number(s.totalQuantity) || 0), 0)
      : 4500;
    const totalPieces = hasShipments
      ? shipments.reduce((sum, s) => sum + (Number(s.totalQuantity) || 0), 0)
      : 12850;
    const totalEstProfit = shipments.reduce((sum, s) => sum + (Number(s.estimatedProfit) || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const calculatedProfit = hasShipments || expenses.length > 0
      ? (totalEstProfit > 0 ? totalEstProfit - totalExpenses : 24650)
      : 24650;
    const onWaterCount = hasShipments 
      ? shipments.filter(s => s.status === 'Shipped').length 
      : 5;
    const totalFobValue = hasShipments 
      ? shipments.reduce((sum, s) => sum + (Number(s.totalFobValue) || (Number(s.totalQuantity) || 1500) * 12), 0) 
      : 184200;
    const totalCartons = hasShipments
      ? shipments.reduce((sum, s) => sum + (Number(s.totalCartons) || Math.round((Number(s.totalQuantity) || 1500) / 40)), 0)
      : 420;

    const activeClients = Array.from(new Set(shipments.map(s => s.buyerName))).length || 42;
    const completedShipments = shipments.filter(s => s.status === 'Delivered').length;
    const successRate = shipments.length > 0 ? (completedShipments / shipments.length) * 100 : 98.6;

    // High-impact dynamic calculations for Pending Invoices:
    const pendingInvoicesList = hasShipments
      ? shipments.filter(s => s.status === 'In Planning' || !s.isVerified || s.status !== 'Delivered')
      : [{ id: 'RB-2026-SK01' }, { id: 'RB-2026-US02' }, { id: 'RB-2026-DE03' }];
    const pendingInvoicesCount = pendingInvoicesList.length > 0 ? Math.min(pendingInvoicesList.length, 6) : 3;
    const pendingInvoicesValue = hasShipments
      ? pendingInvoicesList.reduce((sum, s) => sum + (Number(s.totalFobValue) || (Number(s.totalQuantity) || 1200) * 11.5), 0)
      : 58400;
    const awaitingBlCount = hasShipments
      ? shipments.filter(s => !s.blNumber || s.status === 'In Planning').length || 2
      : 3;
    const clearedInvoicesCount = completedShipments || 8;

    // High-impact dynamic metrics for Supplier Sourcing Status:
    const delayedCount = shipments.filter(s => s.status === 'Delayed').length;
    const supplierFulfillmentRate = hasShipments && shipments.length > 0
      ? ((1 - delayedCount / shipments.length) * 100).toFixed(1)
      : '98.4';
    const activeSuppliersCount = 5; // Tier-1 RMG Mills in Gazipur, Narayanganj, Uttara
    const recentShipmentCount = shipments.filter(s => {
      if (!s.createdAt && !s.shipmentDate) return false;
      const d = new Date(s.createdAt || s.shipmentDate);
      return (Date.now() - d.getTime()) < 30 * 24 * 60 * 60 * 1000;
    }).length || 3;

    return {
      activeCount,
      pendingPcs,
      totalPieces,
      totalCartons,
      calculatedProfit,
      totalExpenses,
      onWaterCount,
      totalFobValue,
      pendingInvoicesCount,
      pendingInvoicesValue,
      awaitingBlCount,
      clearedInvoicesCount,
      supplierFulfillmentRate,
      activeSuppliersCount,
      recentShipmentCount,
      onTimeSla: `${successRate.toFixed(1)}%`,
      activeClients
    };
  }, [shipments, expenses]);

  const dashboardMonthlyData = useMemo(() => [
    { month: 'Oct 25', volume: 6800, target: 6500, value: 34.2, sla: 97.4, cartons: 170 },
    { month: 'Nov 25', volume: 8200, target: 7800, value: 42.5, sla: 98.1, cartons: 205 },
    { month: 'Dec 25', volume: 9500, target: 9000, value: 48.0, sla: 98.5, cartons: 238 },
    { month: 'Jan 26', volume: 10400, target: 9800, value: 52.4, sla: 98.2, cartons: 260 },
    { month: 'Feb 26', volume: 11800, target: 11000, value: 59.1, sla: 99.0, cartons: 295 },
    { month: 'Mar 26', volume: 12850, target: 12000, value: 64.8, sla: 98.6, cartons: 320 },
  ], []);

  const corridorBreakdown = useMemo(() => [
    { name: 'South Korea (Busan)', volume: 28400, share: '36%', color: '#dc2626' },
    { name: 'USA (Long Beach)', volume: 18200, share: '24%', color: '#2563eb' },
    { name: 'Germany (Hamburg)', volume: 14500, share: '18%', color: '#059669' },
    { name: 'Japan (Yokohama)', volume: 12000, share: '14%', color: '#d97706' },
    { name: 'UK & EU Ports', volume: 6450, share: '8%', color: '#7c3aed' },
  ], []);

  const docClearanceData = useMemo(() => [
    { name: 'Fully Cleared Docs', value: 34, color: '#059669' },
    { name: 'Awaiting B/L Release', value: 6, color: '#d97706' },
    { name: 'Awaiting Commercial Inv', value: 4, color: '#dc2626' },
    { name: 'Customs Staging (CTG)', value: 8, color: '#2563eb' }
  ], []);

  const fallbackShipmentsList = useMemo(() => [
    {
      id: 'RB-2026-SK01',
      buyerName: 'Hanwha Apparel Group',
      buyerCountry: 'South Korea',
      destinationPort: 'Busan Port (KRPUS)',
      blNumber: 'RBL-2026-CTG-9921',
      totalQuantity: 18000,
      totalCartons: 450,
      status: 'In Transit',
      transportMode: 'Ocean FCL (40ft HC)',
      carrier: 'KMTC Ocean Line',
      departureDate: '2026-03-12',
      estimatedArrival: '2026-03-26',
      itemsSummary: "Men's Combed Cotton Polo & Woven Shirts",
      docsReady: true
    },
    {
      id: 'RB-2026-US02',
      buyerName: 'Nordic Pacific Imports',
      buyerCountry: 'USA',
      destinationPort: 'Long Beach Port (USLGB)',
      blNumber: 'RBL-2026-CTG-4011',
      totalQuantity: 12400,
      totalCartons: 310,
      status: 'In Transit',
      transportMode: 'Ocean FCL (40ft HC)',
      carrier: 'Maersk Line FCL',
      departureDate: '2026-03-08',
      estimatedArrival: '2026-04-02',
      itemsSummary: 'Crewneck Heavyweight Fleece Sweaters',
      docsReady: true
    },
    {
      id: 'RB-2026-DE03',
      buyerName: 'Hamburg Mode Kontor GmbH',
      buyerCountry: 'Germany',
      destinationPort: 'Hamburg Port (DEHAM)',
      blNumber: 'RBL-2026-CTG-7729',
      totalQuantity: 9500,
      totalCartons: 240,
      status: 'In Planning',
      transportMode: 'Ocean FCL (20ft GP)',
      carrier: 'Hapag-Lloyd Express',
      departureDate: '2026-03-28',
      estimatedArrival: '2026-04-19',
      itemsSummary: 'Organic Jersey Knit T-Shirts',
      docsReady: false
    },
    {
      id: 'RB-2026-JP04',
      buyerName: 'Tokyo Trading & Apparel Co.',
      buyerCountry: 'Japan',
      destinationPort: 'Yokohama Port (JPYOK)',
      blNumber: 'RBL-2026-CTG-1184',
      totalQuantity: 14200,
      totalCartons: 360,
      status: 'In Transit',
      transportMode: 'Ocean FCL (40ft HC)',
      carrier: 'ONE Ocean Network',
      departureDate: '2026-03-16',
      estimatedArrival: '2026-03-31',
      itemsSummary: 'Casual Chino Trousers & Twill Shorts',
      docsReady: true
    },
    {
      id: 'RB-2026-UK05',
      buyerName: 'London Premier Fashion Ltd',
      buyerCountry: 'United Kingdom',
      destinationPort: 'Felixstowe Port (GBFXT)',
      blNumber: 'RBL-2026-CTG-8840',
      totalQuantity: 7800,
      totalCartons: 195,
      status: 'Delivered',
      transportMode: 'Ocean FCL (20ft GP)',
      carrier: 'MSC Mediterranean',
      departureDate: '2026-02-14',
      estimatedArrival: '2026-03-10',
      itemsSummary: 'Brushed Cotton Flannel Shirts',
      docsReady: true
    }
  ], []);

  const displayShipments = useMemo(() => {
    if (shipments && shipments.length > 0) {
      return shipments.map((s, idx) => ({
        id: s.id || `RB-2026-${idx + 10}`,
        buyerName: s.buyerName || s.clientName || 'International Consignee',
        buyerCountry: s.buyerCountry || s.buyerAddress?.split(',').pop()?.trim() || 'Global',
        destinationPort: s.portOfDischarge || s.destinationPort || 'Chittagong → Destination',
        blNumber: s.blNumber || s.trackingNumber || `RBL-2026-CTG-${s.id?.slice(-4) || '8821'}`,
        totalQuantity: Number(s.totalQuantity || (s.items ? s.items.reduce((acc: number, it: any) => acc + Number(it.quantity || 0), 0) : 8500)),
        totalCartons: Number(s.totalCartons || Math.round(Number(s.totalQuantity || 8500) / 40) || 210),
        status: s.status === 'Delivered' ? 'Delivered' : s.status === 'In Planning' ? 'In Planning' : 'In Transit',
        transportMode: s.transportMode || 'Ocean FCL',
        carrier: s.carrier || s.vesselName || 'Ocean Carrier Line',
        departureDate: s.shipmentDate || s.issueDate || '2026-03-15',
        estimatedArrival: s.deliveryDate || '2026-03-30',
        itemsSummary: s.items && s.items[0]?.itemDescription ? s.items[0].itemDescription : 'Export Ready Garment Assortment',
        docsReady: s.isVerified !== false
      }));
    }
    return fallbackShipmentsList;
  }, [shipments, fallbackShipmentsList]);

  const filteredDashboardShipments = useMemo(() => {
    return displayShipments.filter(item => {
      // Filter by status
      if (dashboardStatusFilter === 'transit' && item.status !== 'In Transit') return false;
      if (dashboardStatusFilter === 'planning' && item.status !== 'In Planning') return false;
      if (dashboardStatusFilter === 'delivered' && item.status !== 'Delivered') return false;

      // Filter by search
      if (dashboardShipmentSearch.trim()) {
        const query = dashboardShipmentSearch.toLowerCase();
        return (
          item.id.toLowerCase().includes(query) ||
          item.buyerName.toLowerCase().includes(query) ||
          item.destinationPort.toLowerCase().includes(query) ||
          item.blNumber.toLowerCase().includes(query) ||
          item.buyerCountry.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [displayShipments, dashboardStatusFilter, dashboardShipmentSearch]);
 
  const statusCounts = useMemo(() => ({
    inTransit: displayShipments.filter(s => s.status === 'In Transit').length,
    inPlanning: displayShipments.filter(s => s.status === 'In Planning').length,
    delivered: displayShipments.filter(s => s.status === 'Delivered').length,
  }), [displayShipments]);

  const filteredCatalogProducts = useMemo(() => {
    return PRODUCTS.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(catalogSearch.toLowerCase()) || p.brand.toLowerCase().includes(catalogSearch.toLowerCase());
      const matchesType = catalogTypeFilter === 'All' || p.garmentType.toLowerCase().includes(catalogTypeFilter.toLowerCase()) || p.name.toLowerCase().includes(catalogTypeFilter.toLowerCase());
      const isSelected = selectedGarments[p.id];
      return isSelected && matchesSearch && matchesType;
    });
  }, [catalogSearch, catalogTypeFilter, selectedGarments]);

  // Voice Command Action Handler
  const handleVoiceActionExecution = (action: string, payload?: any) => {
    if (action === 'CREATE_NEW_INVOICE') {
      if (payload?.shipmentId) setSelectedDocumentShipmentId(payload.shipmentId);
      setActiveTab('documents');
    } else if (action === 'GENERATE_SHIPPING_LABEL') {
      if (payload?.shipmentId) {
        const found = displayShipments.find(s => s.id === payload.shipmentId);
        if (found) setSelectedShipmentForLabel(found);
      }
      setIsShippingLabelModalOpen(true);
    } else if (action === 'SCHEDULE_PICKUP') {
      if (payload?.shipmentId) {
        const found = displayShipments.find(s => s.id === payload.shipmentId);
        if (found) setSelectedShipmentForPickup(found);
      }
      setIsSchedulePickupModalOpen(true);
    } else if (action === 'BUYER_SOURCING') {
      setDashboardViewMode('buyers');
      setActiveTab('dashboard');
    } else if (action === 'CUSTOM_DOMAIN') {
      setIsDomainConnectionModalOpen(true);
    } else if (action === 'NAVIGATE_TAB') {
      if (payload?.targetTab) {
        setActiveTab(payload.targetTab as any);
      }
    } else if (action === 'FILTER_SHIPMENTS') {
      if (payload?.filterType) {
        setDashboardStatusFilter(payload.filterType as any);
        setDashboardViewMode('operations');
      }
    } else if (action === 'DRAFT_EMBASSY_LETTER' || action === 'draft_embassy_letter') {
      if (payload) {
        setPrefilledEmbassyPrompt(typeof payload === 'string' ? payload : (payload.prompt || ''));
      }
      setActiveTab('applications');
    } else if (action === 'navigate' || action === 'NAVIGATE_TAB') {
      const target = typeof payload === 'string' ? payload : payload.targetTab;
      if (target) setActiveTab(target as any);
    }
  };

  // Web Speech API Live Voice Command Controller
  const [isWebSpeechListening, setIsWebSpeechListening] = useState(false);
  const [isAiThinkingVoice, setIsAiThinkingVoice] = useState(false);
  const [webSpeechTranscript, setWebSpeechTranscript] = useState('');
  const [webSpeechFeedback, setWebSpeechFeedback] = useState<string | null>(null);
  const [webSpeechError, setWebSpeechError] = useState<string | null>(null);
  const webSpeechRecognitionRef = useRef<any>(null);

  // Web Speech Text-to-Speech function
  const speakTextFeedback = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Remove markdown asterisks and hash marks for natural speech audio
      const cleanText = text.replace(/[*_#`•\[\]\(\)]/g, '').slice(0, 350);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      const bnVoice = voices.find(v => v.lang.includes('bn') || v.lang.includes('BD'));
      const enVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.lang.includes('en'));

      if (bnVoice && /[ঀ-৿]/.test(cleanText)) {
        utterance.voice = bnVoice;
        utterance.lang = 'bn-BD';
        utterance.rate = 0.95;
      } else if (enVoice) {
        utterance.voice = enVoice;
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
      }
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  };

  // Process live voice transcript through Web Speech API matcher + Gemini AI Intelligence
  const processLiveVoiceCommand = async (rawText: string) => {
    const text = rawText.toLowerCase().trim();
    if (!text) return;

    setWebSpeechTranscript(rawText);

    // 1. Generate Shipping Label
    if (
      text.includes('shipping label') || 
      text.includes('shipping labels') || 
      text.includes('generate label') || 
      text.includes('generate shipping label') || 
      text.includes('print label') || 
      text.includes('লেবেল') || 
      text.includes('শিপিং লেবেল')
    ) {
      setWebSpeechFeedback('Generating International Shipping Label...');
      speakTextFeedback('Opening Shipping Label Generator');
      setIsShippingLabelModalOpen(true);
      setTimeout(() => setWebSpeechFeedback(null), 4000);
      return;
    }

    // 1b. Export Shipping Manifest PDF
    if (
      text.includes('shipping manifest') ||
      text.includes('manifest') ||
      text.includes('মেনিফেস্ট') ||
      text.includes('export manifest')
    ) {
      setWebSpeechFeedback('Opening Cargo Shipping Manifest PDF Utility...');
      speakTextFeedback('Opening Shipping Manifest PDF Utility');
      handleOpenPdfUtility('shipping-manifest');
      setTimeout(() => setWebSpeechFeedback(null), 4000);
      return;
    }

    // 2. Create Invoice / Commercial Invoice / Pro-forma
    if (
      text.includes('create invoice') || 
      text.includes('new invoice') || 
      text.includes('generate invoice') || 
      text.includes('make invoice') || 
      text.includes('commercial invoice') || 
      text.includes('proforma') || 
      text.includes('ইনভয়েস') || 
      text.includes('ইনভয়েস তৈরি') || 
      text.includes('বিল তৈরি')
    ) {
      setWebSpeechFeedback('Opening Official Letterhead Invoice Generator...');
      speakTextFeedback('Opening Invoice Generator');
      setActiveTab('documents');
      setTimeout(() => setWebSpeechFeedback(null), 4000);
      return;
    }

    // 3. Schedule Pickup
    if (
      text.includes('schedule pickup') || 
      text.includes('pickup') || 
      text.includes('book truck') || 
      text.includes('dispatch') || 
      text.includes('পিকআপ') || 
      text.includes('পিকআপ শিডিউল')
    ) {
      setWebSpeechFeedback('Opening Cargo Haulage & Pickup Scheduler...');
      speakTextFeedback('Opening Cargo Pickup Scheduler');
      setIsSchedulePickupModalOpen(true);
      setTimeout(() => setWebSpeechFeedback(null), 4000);
      return;
    }

    // 4. Buyer Sourcing
    if (
      text.includes('buyer sourcing') || 
      text.includes('বায়ার সোর্সিং')
    ) {
      setWebSpeechFeedback('Switching to Buyer Sourcing & Intelligence...');
      speakTextFeedback('Opening Buyer Sourcing Network');
      setDashboardViewMode('buyers');
      setActiveTab('dashboard');
      setTimeout(() => setWebSpeechFeedback(null), 4000);
      return;
    }

    // 5. Connect Domain / Domain Settings
    if (
      text.includes('domain') || 
      text.includes('dns') || 
      text.includes('ssl') || 
      text.includes('ডোমেইন')
    ) {
      setWebSpeechFeedback('Opening Custom Domain & DNS Gateway...');
      speakTextFeedback('Opening Domain and SSL Gateway');
      setIsDomainConnectionModalOpen(true);
      setTimeout(() => setWebSpeechFeedback(null), 4000);
      return;
    }

    // 6. Analytics
    if (
      text.includes('open analytics') || 
      text.includes('show charts') || 
      text.includes('অ্যানালিটিক্স দেখাও')
    ) {
      setWebSpeechFeedback('Opening Trade Performance Analytics...');
      speakTextFeedback('Opening Analytics Dashboard');
      setActiveTab('analytics');
      setTimeout(() => setWebSpeechFeedback(null), 4000);
      return;
    }

    // 7. Shipments / Registry
    if (
      text.includes('open shipment') || 
      text.includes('shipment registry') || 
      text.includes('রেজিস্ট্রি দেখাও')
    ) {
      setWebSpeechFeedback('Opening Shipment Registry...');
      speakTextFeedback('Opening Shipment Registry');
      setActiveTab('shipment');
      setTimeout(() => setWebSpeechFeedback(null), 4000);
      return;
    }

    // 8. New Consignment / Form
    if (
      text.includes('new shipment') || 
      text.includes('new consignment') || 
      text.includes('নতুন শিপমেন্ট')
    ) {
      setWebSpeechFeedback('Opening New Shipment Profile Form...');
      speakTextFeedback('Opening New Consignment Form');
      setActiveTab('new-shipment');
      setTimeout(() => setWebSpeechFeedback(null), 4000);
      return;
    }

    // 9. Letterhead Settings
    if (text.includes('letterhead settings') || text.includes('লেটারহেড সেটিংস')) {
      setWebSpeechFeedback('Opening Letterhead & Security Settings...');
      speakTextFeedback('Opening Letterhead Settings');
      setActiveTab('settings');
      setTimeout(() => setWebSpeechFeedback(null), 4000);
      return;
    }

    // Natural Intelligence Voice Query to GPT-6 Astra API
    setWebSpeechFeedback('Scarlet পর্যালোচনা করছেন...');
    setIsAiThinkingVoice(true);
    try {
      const response = await authenticatedFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: rawText,
          history: [],
          context: {
            activeShipments: displayShipments.slice(0, 5),
            totalVolumePcs: dynamicStats.totalPieces,
            onTimeSla: dynamicStats.onTimeSla,
            activeSuppliers: dynamicStats.activeSuppliersCount,
            pendingInvoices: dynamicStats.pendingInvoicesCount
          },
          language: /[ঀ-৿]/.test(rawText) ? 'bn' : 'en'
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const reply = data.reply || "জি স্যার, আমি সব তথ্য পর্যালোচনা করেছি। অপারেশন স্বাভাবিক রয়েছে।";
      setWebSpeechFeedback(reply);
      speakTextFeedback(reply);
    } catch (err) {
      console.warn("Astra voice response error:", err);
      const fallback = /[ঀ-৿]/.test(rawText)
        ? "স্যার, আপনার ভয়েস কমান্ড পেয়েছি। আমাদের চট্টগ্রাম পোর্ট এবং গাজীপুর ফ্যাক্টরি অপারেশন স্বাভাবিক রয়েছে।"
        : "Sir, I have received your request. All active export shipments through Chittagong Port are progressing smoothly.";
      setWebSpeechFeedback(fallback);
      speakTextFeedback(fallback);
    } finally {
      setIsAiThinkingVoice(false);
      setTimeout(() => setWebSpeechFeedback(null), 12000);
    }
  };

  // Toggle Web Speech Recognition with Microphone Access Logic
  const toggleWebSpeechListening = async () => {
    if (isWebSpeechListening) {
      if (webSpeechRecognitionRef.current) {
        try {
          webSpeechRecognitionRef.current.stop();
        } catch (e) {}
      }
      setIsWebSpeechListening(false);
      return;
    }

    // 1. Explicitly verify/request microphone access via getUserMedia
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (micErr: any) {
      console.warn('Microphone permission request:', micErr);
      setWebSpeechError('Microphone permission was not granted. Please allow microphone access in your browser settings.');
      setTimeout(() => setWebSpeechError(null), 6000);
      return;
    }

    // 2. Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setWebSpeechError('Web Speech Recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      setTimeout(() => setWebSpeechError(null), 6000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      // Multi-lingual support: default to Bengali if Bengali context, or English
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsWebSpeechListening(true);
        setWebSpeechError(null);
        setWebSpeechTranscript('');
        setWebSpeechFeedback('শুনছি... আপনার কমান্ড বা প্রশ্নটি বলুন (বাংলা বা ইংরেজিতে)');
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setWebSpeechTranscript(transcript);

        if (event.results[current].isFinal) {
          processLiveVoiceCommand(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          setWebSpeechError('Microphone access blocked. Please allow microphone permissions in the browser address bar.');
        } else if (event.error !== 'no-speech') {
          setWebSpeechError(`Voice input error: ${event.error}`);
        }
        setIsWebSpeechListening(false);
        setTimeout(() => setWebSpeechError(null), 5000);
      };

      recognition.onend = () => {
        setIsWebSpeechListening(false);
      };

      webSpeechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setWebSpeechError('Could not start microphone voice recognition.');
      setIsWebSpeechListening(false);
      setTimeout(() => setWebSpeechError(null), 5000);
    }
  };

  const DocumentHeader = ({ docId }: { docId?: string }) => (
    <div className="flex justify-between items-center pb-8 border-b-2 border-slate-900 mb-8 relative">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 100 100" className="w-full h-full text-red-600 fill-current">
              <path d="M20,50 Q40,20 80,45 Q60,50 80,80 Q50,60 20,50 Z" />
              <path d="M25,45 Q35,35 45,40" fill="none" stroke="white" strokeWidth="2" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 leading-none tracking-tight uppercase">REDBIRD</h2>
            <p className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">International</p>
          </div>
        </div>
      </div>
      <div className="text-right">
        <h1 className="text-2xl font-black text-red-600 uppercase mb-1">{settingsCompany}</h1>
        <p className="text-[10px] font-bold text-slate-500">{settingsAddress}</p>
      </div>
    </div>
  );

  // Subscriptions for Live Database Metrics
  React.useEffect(() => {
    if (!db || !isAuthenticated) return;
    const qShipments = query(collection(db, 'shipments'), orderBy('createdAt', 'desc'));
    const unsubShipments = onSnapshot(qShipments, (snapshot) => {
      setShipments(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'shipments');
    });

    const qExpenses = query(collection(db, 'expenses'), orderBy('date', 'desc'));
    const unsubExpenses = onSnapshot(qExpenses, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Expense)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'expenses');
    });

    return () => {
      unsubShipments();
      unsubExpenses();
    };
  }, [isAuthenticated]);

  React.useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        if (user.email === 'redbird.inc.co.bd@gmail.com' || user.email === 'sumon.hanwha@gmail.com' || user.email?.endsWith('@redbird-international.com')) {
          setIsAuthenticated(true);
        }
      } else {
        // Only reset if we did not log in via passcode bypass
        if (currentUser && !currentUser.isPasscodeBypass) {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleGoogleLogin = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try { 
      await signInWithPopup(auth, provider); 
    } catch (e) { 
      console.error(e); 
      setLoginError("Popup authorization failed. Please try Passcode access.");
    }
  };

  const handlePasscodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput === 'redbird2026') {
      const email = emailInput.trim() || 'sumon.hanwha@gmail.com';
      if (auth) {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.warn("Failed to sign in anonymously:", err);
        }
      }
      setCurrentUser({
        displayName: 'Sumon (Operations Director)',
        email: email,
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        isPasscodeBypass: true
      });
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid Passcode. Please contact the Operations Team.');
    }
  };

  // Global voice assistant keyboard shortcuts: Alt + V for Assistant, Alt + M or Alt + L for Voice Shipment Logger
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'v') || (e.ctrlKey && e.code === 'Space')) {
        e.preventDefault();
        setIsVoiceAssistantOpen(prev => !prev);
      }
      if (e.altKey && (e.key.toLowerCase() === 'm' || e.key.toLowerCase() === 'l')) {
        e.preventDefault();
        setIsVoiceShipmentLogModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Voice-activated shipment status update handler
  const handleUpdateShipmentStatus = async (shipmentId: string, newStatus: string, notes?: string): Promise<boolean> => {
    if (db) {
      try {
        const shipRef = doc(db, 'shipments', shipmentId);
        const logNote = {
          id: `history-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          author: currentUser?.displayName || 'Scarlet AI (Voice)',
          authorEmail: currentUser?.email || undefined,
          content: notes || `Shipment status transition: Status moved to "${newStatus}" via secure voice command authorization.`,
          category: 'Status Update',
          statusTag: 'Milestone',
          isInternal: true,
          createdAt: new Date().toISOString()
        };

        await updateDoc(shipRef, {
          status: newStatus,
          lastUpdated: new Date().toISOString(),
          notes: arrayUnion(logNote)
        });
      } catch (err) {
        console.warn('Firestore voice status update error:', err);
      }
    }
    setShipments(prev => prev.map(s => (s.id === shipmentId ? { ...s, status: newStatus, lastUpdated: new Date().toISOString() } : s)));
    return true;
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    try {
      await addDoc(collection(db, 'expenses'), {
        title: expenseForm.title || 'Operational Expense',
        category: expenseForm.category || 'Re-Processing',
        amount: parseFloat(expenseForm.amount?.toString() || '0'),
        date: expenseForm.date || new Date().toISOString().split('T')[0],
        description: expenseForm.description || '',
        paidBy: currentUser?.displayName || 'Admin',
        createdAt: serverTimestamp()
      });
      alert('Boss, the operational expense has been securely synchronized with the central database.');
      setExpenseForm({
        title: '',
        category: 'Re-Processing',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
    } catch (err) {
      alert('Error saving expense: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleExportPresentation = async () => {
    if (!catalogRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(catalogRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Buyer_Presentation_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900 rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl">
            <div className="w-16 h-16 bg-red-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-red-600/30">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            
            <h2 className="text-2xl font-black text-white text-center mb-1">Red Bird Portal</h2>
            <p className="text-slate-500 text-center text-xs mb-8 font-medium">Restricted access for Red Bird International management only.</p>

            {/* Toggle Login Option */}
            <div className="flex bg-slate-950 p-1 rounded-xl mb-6">
               <button 
                 type="button"
                 onClick={() => setLoginMethod('google')}
                 className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${loginMethod === 'google' ? 'bg-red-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}
               >
                  Google Login
               </button>
               <button 
                 type="button"
                 onClick={() => setLoginMethod('passcode')}
                 className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${loginMethod === 'passcode' ? 'bg-red-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}
               >
                  Security Passcode
               </button>
            </div>

            {loginError && (
               <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-medium mb-6 text-center">
                  {loginError}
               </div>
            )}

            {loginMethod === 'google' ? (
               <button 
                 onClick={handleGoogleLogin}
                 className="w-full bg-white text-slate-950 font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-red-600 hover:text-white transition-all active:scale-95 text-xs tracking-wider"
               >
                 <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" /></svg>
                 AUTHENTICATE WITH GOOGLE
               </button>
            ) : (
               <form onSubmit={handlePasscodeLogin} className="space-y-4">
                  <div>
                     <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider mb-1 block">Admin Email / ID</label>
                     <input 
                       type="text"
                       required
                       placeholder="e.g. sumon.hanwha@gmail.com"
                       value={emailInput}
                       onChange={e => setEmailInput(e.target.value)}
                       className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-red-600"
                     />
                  </div>
                  <div>
                     <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider mb-1 block">Security Passcode</label>
                     <input 
                       type="password"
                       required
                       placeholder="Enter PIN key"
                       value={passcodeInput}
                       onChange={e => setPasscodeInput(e.target.value)}
                       className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-red-600"
                     />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl transition-all active:scale-95 text-xs tracking-widest uppercase"
                  >
                     Log In Securely
                  </button>
               </form>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans relative">

      {/* Web Speech API Live Voice Command Floating HUD */}
      {(isWebSpeechListening || webSpeechTranscript || webSpeechFeedback || webSpeechError) && (
        <div className="fixed top-6 right-6 z-50 animate-fade-in max-w-md w-full no-print">
          <div className="bg-slate-900/95 text-white rounded-2xl p-4 shadow-2xl border border-red-500/30 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isWebSpeechListening ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`}></span>
                <span className="text-xs font-black uppercase tracking-wider text-red-400">
                  {isWebSpeechListening ? 'Live Voice Listening (Web Speech API)' : 'Voice Action Executed'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (webSpeechRecognitionRef.current) {
                    try { webSpeechRecognitionRef.current.stop(); } catch (e) {}
                  }
                  setIsWebSpeechListening(false);
                  setWebSpeechTranscript('');
                  setWebSpeechFeedback(null);
                  setWebSpeechError(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={14} />
              </button>
            </div>

            {webSpeechTranscript && (
              <p className="text-xs font-bold text-slate-200 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-[10px] uppercase font-bold mr-1.5">You said:</span>
                "{webSpeechTranscript}"
              </p>
            )}

            {isAiThinkingVoice && (
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-3 py-2 rounded-xl animate-pulse">
                <Bot size={15} className="animate-spin text-amber-400 shrink-0" />
                <span>Scarlet (GPT-6 Astra) চিন্তা করছেন... লাইভ ডেটাবেজ ও ফ্যাক্টরি রেকর্ড পর্যালোচনা হচ্ছে</span>
              </div>
            )}

            {webSpeechFeedback && (
              <div className="flex items-start gap-2 text-xs font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-3 py-2 rounded-xl leading-relaxed">
                <Sparkles size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider block mb-0.5">Scarlet AI Partner:</span>
                  <span>{webSpeechFeedback}</span>
                </div>
              </div>
            )}

            {webSpeechError && (
              <div className="text-xs font-bold text-red-400 bg-red-950/40 border border-red-500/30 px-3 py-1.5 rounded-xl">
                {webSpeechError}
              </div>
            )}

            {isWebSpeechListening && (
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span>Say: "Generate shipping label", "Create invoice", or "Schedule pickup"</span>
                <button
                  type="button"
                  onClick={toggleWebSpeechListening}
                  className="text-red-400 hover:text-red-300 font-bold underline"
                >
                  Stop Mic
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Minimized Draft Floating Indicator */}
      {isFormMinimized && (
         <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-2xl max-w-sm animate-bounce flex items-center gap-4">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
               <svg className="w-5 h-5 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" /></svg>
            </div>
            <div className="flex-1">
               <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Shipment Draft</p>
               <p className="text-xs font-bold text-white">Your shipment profile work is saved offline.</p>
            </div>
            <button 
              onClick={() => {
                 setIsFormMinimized(false);
                 setActiveTab('new-shipment');
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
            >
               RESUME
            </button>
         </div>
      )}

      {/* Mobile Top App Bar (Visible on Phones & Tablets < lg) */}
      <div className="lg:hidden flex items-center justify-between bg-slate-900 text-white p-4 sticky top-0 z-40 shadow-md border-b border-slate-800 no-print">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl cursor-pointer active:scale-95"
            title="Open Navigation Menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-black text-white text-sm shadow-md shadow-red-600/30">
              R
            </div>
            <div>
              <span className="font-black text-xs uppercase tracking-tight block">RED BIRD</span>
              <span className="text-[8px] font-bold text-red-400 uppercase tracking-widest block">ADMIN PORTAL</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsQrScannerOpen(true)}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Scan Document QR Code"
          >
            <QrCode size={14} />
            <span>Scan QR</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDomainConnectionModalOpen(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl border border-slate-700 cursor-pointer"
            title="Domain & DNS Gateway"
          >
            <Globe size={16} />
          </button>
        </div>
      </div>

      {/* Mobile Slide-Over Sidebar Drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print animate-fade-in">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <aside className="relative w-80 max-w-[85vw] bg-slate-900 text-white p-6 flex flex-col gap-6 z-10 overflow-y-auto h-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black text-white">
                  R
                </div>
                <div>
                  <h2 className="text-base font-black text-white uppercase tracking-tight">RED BIRD</h2>
                  <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Global Trade OS</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile Nav Items */}
            <nav className="flex flex-col gap-6 text-xs">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 px-3">
                  Executive & Analytics
                </p>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'dashboard', label: 'Executive Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                    { id: 'leadtime', label: 'Volumes & Lead Times', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', badge: 'Recharts' },
                    { id: 'analytics', label: 'Trade Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setIsMobileDrawerOpen(false);
                      }}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all text-left ${
                        activeTab === tab.id ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {(tab as any).badge && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950">
                          {(tab as any).badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 px-3">
                  Commercial & Export
                </p>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'documents', label: 'Document Generator', badge: 'AI & PDF' },
                    { id: 'proforma', label: 'Pro-Forma Invoices' },
                    { id: 'applications', label: 'Official Applications (Embassy/Bank)', badge: 'AI Letter' },
                    { id: 'new-shipment', label: 'Create Shipment' },
                    { id: 'shipment', label: 'Shipment Registry' },
                    { id: 'history', label: 'Shipment History Log', badge: 'Audit' },
                    { id: 'catalog', label: 'Buyer Sourcing Catalog' },
                    { id: 'routes', label: 'Network & Corridors' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setIsMobileDrawerOpen(false);
                      }}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all text-left ${
                        activeTab === tab.id ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{tab.label}</span>
                      {(tab as any).badge && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                          {(tab as any).badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 px-3">
                  Operations & Settings
                </p>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'orders', label: 'Order Planning' },
                    { id: 'expenses', label: 'Expense Accounts' },
                    { id: 'hr', label: 'HR & Payroll' },
                    { id: 'visa', label: 'Foreign Buyer Invitations' },
                    { id: 'users', label: 'Access Control & RBAC' },
                    { id: 'settings', label: 'Letterhead & Security' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setIsMobileDrawerOpen(false);
                      }}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all text-left ${
                        activeTab === tab.id ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </nav>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar (hidden on mobile, visible on lg+) */}
      <aside className={`w-80 bg-slate-900 p-8 hidden lg:flex flex-col gap-8 no-print min-h-screen sticky top-0 transition-all duration-300 ${isFormFullScreen && activeTab === 'new-shipment' ? 'hidden w-0 overflow-hidden p-0' : 'flex'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-md shadow-red-600/30">
            R
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">RED BIRD</h2>
            <span className="text-[8px] font-bold text-red-400 uppercase tracking-widest block">GLOBAL TRADE PLATFORM</span>
          </div>
        </div>

        {/* Navigation Categories */}
        <nav className="flex flex-col gap-6 text-xs">
          
          {/* Group 1: Executive & Analytics */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 px-3">
              Executive & Analytics
            </p>
            <div className="flex flex-col gap-1">
              {[
                { id: 'dashboard', label: 'Executive Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                { id: 'leadtime', label: 'Volumes & Lead Times', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', badge: 'Recharts' },
                { id: 'analytics', label: 'Trade Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (tab.id !== 'new-shipment') setIsFormFullScreen(false);
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all ${
                    activeTab === tab.id ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <svg className="w-4 h-4 font-bold shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={tab.icon} /></svg>
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {(tab as any).badge && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950 shrink-0">
                      {(tab as any).badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Group 2: Commercial & Shipments */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 px-3">
              Commercial & Export
            </p>
            <div className="flex flex-col gap-1">
              {[
                { id: 'documents', label: 'Document Generator', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', badge: 'AI & PDF' },
                { id: 'proforma', label: 'Pro-Forma Invoices', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { id: 'applications', label: 'Official Applications (Embassy/Bank)', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', badge: 'AI Letter' },
                { id: 'new-shipment', label: 'Create Shipment', icon: 'M12 4v16m8-8H4' },
                { id: 'shipment', label: 'Shipment Registry', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                { id: 'history', label: 'Shipment History Log', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', badge: 'Audit' },
                { id: 'catalog', label: 'Buyer Sourcing Catalog', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
                { id: 'routes', label: 'Network & Corridors', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (tab.id !== 'new-shipment') setIsFormFullScreen(false);
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all ${
                    activeTab === tab.id ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <svg className="w-4 h-4 font-bold shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={tab.icon} /></svg>
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 shrink-0">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Group 3: Operations & Finance */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 px-3">
              Operations & Finance
            </p>
            <div className="flex flex-col gap-1">
              {[
                { id: 'orders', label: 'Order Planning', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
                { id: 'expenses', label: 'Expense Accounts', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                { id: 'hr', label: 'HR & Payroll', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
                { id: 'visa', label: 'Foreign Buyer Invitations', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (tab.id !== 'new-shipment') setIsFormFullScreen(false);
                  }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all ${
                    activeTab === tab.id ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <svg className="w-4 h-4 font-bold shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={tab.icon} /></svg>
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Group 4: Administration & Security */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 px-3">
              System & Security
            </p>
            <div className="flex flex-col gap-1">
              {/* Voice Assistant Navigation Trigger */}
              <button
                onClick={() => setIsVoiceAssistantOpen(true)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-red-400 hover:bg-slate-800 hover:text-white transition-all text-left group"
              >
                <Mic className="w-4 h-4 font-bold shrink-0 text-red-500 group-hover:scale-110 transition-transform" />
                <span className="truncate flex-1">Voice Assistant</span>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              </button>

              {/* Cloudflare DNS Navigation Trigger */}
              <button
                onClick={() => setIsCloudflareModalOpen(true)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-amber-400 hover:bg-slate-800 hover:text-white transition-all text-left group"
              >
                <Globe className="w-4 h-4 font-bold shrink-0 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="truncate flex-1">Cloudflare DNS</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">CDN</span>
              </button>

              {[
                { id: 'settings', label: 'Letterhead & Security', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
                ...(isMasterAdmin ? [{ id: 'users', label: 'User Control', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' }] : [])
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (tab.id !== 'new-shipment') setIsFormFullScreen(false);
                  }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all ${
                    activeTab === tab.id ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <svg className="w-4 h-4 font-bold shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={tab.icon} /></svg>
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

        </nav>
        
        <div className="mt-auto space-y-4">
           <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Authenticated User</p>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
                    <img src={currentUser?.photoURL} alt="" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{currentUser?.displayName}</p>
                    <p className="text-[9px] text-slate-500 truncate">{currentUser?.email}</p>
                  </div>
              </div>
           </div>
           <button onClick={() => signOut(auth!)} className="w-full py-3 rounded-xl font-bold text-slate-400 hover:text-white transition-colors">Sign Out</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 p-12 overflow-y-auto max-h-screen transition-all duration-300 ${isFormFullScreen && activeTab === 'new-shipment' ? 'p-0 max-w-full' : ''}`}>
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in font-sans">
            {/* 1. Executive Command Header - परिपाटी (Neat, Polished & High-Craft) */}
            <header className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/90 shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium mb-1.5">
                  <span className="font-bold text-slate-800">Red Bird Command Center</span>
                  <span className="text-slate-300">•</span>
                  <span>Plot-100 Uttarkhan RMG Hub</span>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Chittagong BDCGP & Gazipur Live
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
                  <span>Executive Export Command</span>
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-100 font-bold normal-case tracking-normal">
                    শুভ দিন • Red Bird Hub
                  </span>
                </h1>
                <p className="text-slate-500 text-xs mt-1.5 max-w-2xl leading-relaxed">
                  Consolidated operations: Ocean cargo tracking through Chittagong Port, Gazipur AQL 2.5 factory finishing, AI trade document synthesis, and L/C remittances.
                </p>
              </div>

              {/* Action Controls & Currency Toggle */}
              <div className="flex flex-wrap items-center gap-2.5 relative z-10">
                {/* Financial Currency Switcher */}
                <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setFinancialCurrency('USD')}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      financialCurrency === 'USD' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    USD ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinancialCurrency('BDT')}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      financialCurrency === 'BDT' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    BDT (৳)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedVoiceShipmentId('');
                    setIsVoiceShipmentLogModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-red-600/30 cursor-pointer active:scale-95 group"
                  title="Voice-to-Text Input: Speak to quickly create shipment logs or add operational notes via microphone (Alt + M)"
                >
                  <div className="relative">
                    <span className="w-2 h-2 rounded-full bg-white absolute -top-0.5 -right-0.5 animate-ping"></span>
                    <Mic size={15} className="text-white" />
                  </div>
                  <span>Voice Log & Notes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('new-shipment')}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-red-600/30 cursor-pointer active:scale-95"
                >
                  <Plus size={16} />
                  <span>New Consignment</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAiParserOpen(true)}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-red-600/30 cursor-pointer active:scale-95 group"
                  title="AI-powered document upload & automated parsing: Extract metadata from invoices & bills of lading (GPT-6 Astra)"
                >
                  <Sparkles size={15} className="text-yellow-300 animate-pulse group-hover:rotate-12 transition-transform" />
                  <span>AI Document Parser</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('documents')}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm border border-slate-800 cursor-pointer active:scale-95 group"
                  title="Draft Commercial Invoices & Packing Lists with GPT-6 Astra"
                >
                  <FileText size={15} className="text-amber-400 group-hover:rotate-12 transition-transform" />
                  <span>AI Document Drafter</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('analytics')}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
                  title="Open Recharts Trade Performance Analytics"
                >
                  <TrendingUp size={15} className="text-blue-600" />
                  <span className="hidden sm:inline">Analytics</span>
                </button>

                <button
                  type="button"
                  onClick={toggleWebSpeechListening}
                  className={`flex items-center gap-2 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm border ${
                    isWebSpeechListening
                      ? 'bg-red-600 text-white border-red-600 ring-4 ring-red-500/40 animate-pulse'
                      : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200/80'
                  }`}
                  title="Web Speech API: Live voice commands like 'Generate shipping label' or 'Create invoice'"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <Mic size={15} className={isWebSpeechListening ? 'text-white' : 'text-red-600'} />
                  <span className="hidden sm:inline font-black uppercase text-[10px] tracking-wider">
                    {isWebSpeechListening ? 'Listening...' : 'Live Voice Command'}
                  </span>
                </button>

                {/* Real-time Operational & Approval Notification Center */}
                <RealTimeNotificationCenter
                  onNavigateTab={(tab) => setActiveTab(tab as any)}
                  onOpenShipmentModal={(shipmentId) => {
                    const found = displayShipments.find(s => s.id === shipmentId);
                    if (found) {
                      setSelectedShipmentForLabel(found);
                      setIsShippingLabelModalOpen(true);
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => setIsCloudflareModalOpen(true)}
                  className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                  title="Configure Cloudflare DNS & Custom Domain"
                >
                  <Globe size={16} className="text-amber-600" />
                </button>
              </div>
            </header>

            {/* 2. Grid of High-Impact KPI Widgets (Dynamically Updated based on Live Data) */}
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Live Operational Performance & Trade Indicators
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                  <span>Auto-Syncing Real-Time Entries</span>
                  <span>•</span>
                  <span className="font-mono text-slate-700">{shipments.length} Total Registered Shipments</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Widget 1: Active Shipments & Ocean Corridors */}
                <div 
                  onClick={() => {
                    setDashboardStatusFilter('transit');
                    setDashboardViewMode('operations');
                  }}
                  className="bg-white p-6 rounded-[2rem] border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Ship size={16} />
                        </div>
                        <span className="font-bold text-slate-700 uppercase text-[11px] tracking-wider">Active Shipments</span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
                        {dynamicStats.onWaterCount} On Water
                      </span>
                    </div>

                    <div className="mt-3">
                      <h3 className="text-3xl font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">
                        {dynamicStats.activeCount} Consignments
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        Active ocean and multi-modal container cargo in transit
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 mt-4">
                    <span className="font-bold text-slate-700 truncate">
                      {dynamicStats.totalCartons.toLocaleString()} Ctns • {dynamicStats.totalPieces.toLocaleString()} Pcs
                    </span>
                    <span className="text-[10px] font-black text-blue-600 group-hover:underline flex items-center gap-0.5">
                      View Cargo <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>

                {/* Widget 2: Pending Invoices & Customs Documentation */}
                <div 
                  onClick={() => setActiveTab('documents')}
                  className="bg-white p-6 rounded-[2rem] border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                          <FileText size={16} />
                        </div>
                        <span className="font-bold text-slate-700 uppercase text-[11px] tracking-wider">Pending Invoices</span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock size={11} />
                        {dynamicStats.awaitingBlCount} Awaiting B/L
                      </span>
                    </div>

                    <div className="mt-3">
                      <h3 className="text-3xl font-black text-slate-900 group-hover:text-amber-600 transition-colors tracking-tight">
                        {dynamicStats.pendingInvoicesCount} Pending Drafts
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        FOB Value: <strong className="text-slate-900">${(dynamicStats.pendingInvoicesValue).toLocaleString()} USD</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 mt-4">
                    <span className="text-emerald-700 font-bold truncate">
                      {dynamicStats.clearedInvoicesCount} Cleared & Released
                    </span>
                    <span className="text-[10px] font-black text-amber-600 group-hover:underline flex items-center gap-0.5">
                      Draft Invoice <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>

                {/* Widget 3: Supplier Sourcing Status & Factory Fulfillment */}
                <div 
                  onClick={() => setDashboardViewMode('buyers')}
                  className="bg-white p-6 rounded-[2rem] border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <Building2 size={16} />
                        </div>
                        <span className="font-bold text-slate-700 uppercase text-[11px] tracking-wider">Supplier Sourcing Status</span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={11} />
                        {dynamicStats.activeSuppliersCount} Partner Mills
                      </span>
                    </div>

                    <div className="mt-3">
                      <h3 className="text-3xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors tracking-tight">
                        {dynamicStats.supplierFulfillmentRate}% Sourcing
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        RMG mills in Gazipur, Narayanganj & Uttara Complex
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 mt-4">
                    <span className="font-bold text-slate-700 truncate">
                      AQL 2.5 Passed • Zero Shortages
                    </span>
                    <span className="text-[10px] font-black text-emerald-600 group-hover:underline flex items-center gap-0.5">
                      Sourcing Network <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>

                {/* Widget 4: Realized Net Profit & Export Turnover */}
                <div 
                  onClick={() => setActiveTab('expenses')}
                  className="bg-white p-6 rounded-[2rem] border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <DollarSign size={16} />
                        </div>
                        <span className="font-bold text-slate-700 uppercase text-[11px] tracking-wider">Est. Net Profit</span>
                      </div>
                      <span className="font-black text-emerald-600 flex items-center gap-1 text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <ArrowUpRight size={12} /> +14.8% YoY
                      </span>
                    </div>

                    <div className="mt-3">
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                        {financialCurrency === 'BDT' ? '৳' : '$'}
                        {(financialCurrency === 'BDT' 
                          ? dynamicStats.calculatedProfit * 120.5 
                          : dynamicStats.calculatedProfit
                        ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium truncate">
                        FOB Turnover: ${(dynamicStats.totalFobValue).toLocaleString()} USD
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100 mt-4">
                    <span className="font-mono text-slate-700 font-bold shrink-0">1 USD = 120.5 ৳</span>
                    <span className="text-[10px] font-black text-emerald-600 group-hover:underline flex items-center gap-0.5">
                      Accounts Ledger <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>

                {/* Widget 5: Garment Output & Factory Load */}
                <div 
                  onClick={() => setActiveTab('leadtime')}
                  className="bg-white p-6 rounded-[2rem] border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                          <Package size={16} />
                        </div>
                        <span className="font-bold text-slate-700 uppercase text-[11px] tracking-wider">Garments Output</span>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        94.2% Capacity
                      </span>
                    </div>

                    <div className="mt-3">
                      <h3 className="text-3xl font-black text-slate-900 group-hover:text-purple-600 transition-colors tracking-tight">
                        {dynamicStats.totalPieces.toLocaleString()} Pcs
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        {dynamicStats.pendingPcs.toLocaleString()} Pcs currently in sewing/finishing
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 mt-4">
                    <span className="font-bold text-slate-700">~{dynamicStats.totalCartons} Master Cartons</span>
                    <span className="text-[10px] font-black text-purple-600 group-hover:underline flex items-center gap-0.5">
                      Lead Time <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>

                {/* Widget 6: On-Time SLA Delivery Health & Port Clearance */}
                <div 
                  onClick={() => setDashboardViewMode('corridors')}
                  className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800 shadow-xl text-white flex flex-col justify-between hover:shadow-2xl hover:border-red-500/40 transition-all cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-800 text-red-400 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                          <ShieldCheck size={16} />
                        </div>
                        <span className="font-bold text-slate-300 uppercase text-[11px] tracking-wider">On-Time SLA Health</span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        Zero Demurrage
                      </span>
                    </div>

                    <div className="mt-3">
                      <h3 className="text-3xl font-black text-emerald-400 tracking-tight">
                        {dynamicStats.onTimeSla}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">
                        Chittagong Port (BDCGP) direct routing to global hubs
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/10 mt-4">
                    <span className="font-bold text-emerald-300">Avg Lead: 18d Transit</span>
                    <span className="text-[10px] font-black text-red-400 group-hover:underline flex items-center gap-0.5">
                      Sea Corridors <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Dynamic Real-Time Logistics KPI & Trade Intelligence Dashboard Widget Section (Recharts) */}
            <section className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/90 shadow-sm space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-600 text-white rounded-2xl shadow-md shadow-red-600/30">
                    <BarChart3 size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Live Recharts Telemetry
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Real-Time Export Volume & Document Compliance
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-0.5 flex items-center gap-2">
                      <span>Executive KPI & Trade Intelligence Dashboard</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Real-time interactive telemetry: Total active shipments, pending documentation compliance audits, transit mode breakdown, and monthly export volume trajectories.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAnalyticsSubView('kpi');
                      setActiveTab('analytics');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <TrendingUp size={14} className="text-red-400" />
                    <span>Expand Full Analytics</span>
                  </button>
                </div>
              </div>

              {/* Render Memoized KPIDashboard with Recharts */}
              <KPIDashboard 
                shipments={shipments.length > 0 ? shipments : (displayShipments as any)} 
                expenses={expenses} 
              />
            </section>

            {/* 3. Executive Fast-Track Navigation Deck (পরিচ্ছন্ন ৫টি মডিউল অ্যাকশন কার্ড) */}
            <section className="bg-white p-6 rounded-[2.5rem] border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                    <Zap size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Executive Operations Deck</h3>
                    <p className="text-[11px] text-slate-500">Quick-launch trade execution modules, AI document drafting, and analytics.</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">5 Core Modules</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* 1. AI Document Drafter */}
                <button
                  type="button"
                  onClick={() => setActiveTab('documents')}
                  className="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50/60 hover:from-red-100 hover:to-rose-100/80 border border-red-200/70 text-left transition-all group cursor-pointer shadow-xs"
                >
                  <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center mb-3 shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform">
                    <Sparkles size={18} />
                  </div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">AI Document Drafter</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">Commercial Invoices & Packing Lists via GPT-6 Astra.</p>
                  <span className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-black text-red-700 uppercase">
                    Draft Documents <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                {/* 2. Trade Analytics (Recharts) */}
                <button
                  type="button"
                  onClick={() => setActiveTab('analytics')}
                  className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/60 hover:from-blue-100 hover:to-indigo-100/80 border border-blue-200/70 text-left transition-all group cursor-pointer shadow-xs"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3 shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
                    <TrendingUp size={18} />
                  </div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Trade Analytics</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">Visualizing monthly export volume, SLA rates & buyer growth.</p>
                  <span className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-black text-blue-700 uppercase">
                    View Charts <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                {/* 3. Ocean Cargo & Container Registry */}
                <button
                  type="button"
                  onClick={() => setActiveTab('shipment')}
                  className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 hover:bg-slate-100 border border-slate-200 text-left transition-all group cursor-pointer shadow-xs"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-3 shadow-md shadow-slate-900/30 group-hover:scale-105 transition-transform">
                    <Ship size={18} />
                  </div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Cargo & Containers</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">Chittagong BDCGP staging, B/L tracking & container dispatch.</p>
                  <span className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-black text-slate-800 uppercase">
                    Shipment Registry <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                {/* 4. Pro-Forma & Banking L/C */}
                <button
                  type="button"
                  onClick={() => setActiveTab('proforma')}
                  className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/60 hover:from-emerald-100 hover:to-teal-100/80 border border-emerald-200/70 text-left transition-all group cursor-pointer shadow-xs"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
                    <Receipt size={18} />
                  </div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Pro-Forma & Banking</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">Irrevocable Letters of Credit, bank seals, and sales contracts.</p>
                  <span className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 uppercase">
                    L/C Portal <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                {/* 5. Buyer Wholesale Catalog */}
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-fuchsia-50/60 hover:from-purple-100 hover:to-fuchsia-100/80 border border-purple-200/70 text-left transition-all group cursor-pointer shadow-xs"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-3 shadow-md shadow-purple-600/30 group-hover:scale-105 transition-transform">
                    <Package size={18} />
                  </div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Buyer Catalog</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">Export apparel collections with live wholesale pricing & PDF.</p>
                  <span className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-black text-purple-700 uppercase">
                    Open Catalog <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>
            </section>

            {/* Quick Actions & Fast Workflow Navigation Card */}
            <section className="bg-gradient-to-br from-white via-slate-50 to-red-50/40 p-6 sm:p-7 rounded-[2.5rem] border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-600 text-white rounded-2xl shadow-md shadow-red-600/30">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <span>Operational Quick Actions & Launchpad</span>
                      <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                        Fast Workflow
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      One-click command shortcuts for shipping labels, authentic invoice drafts, container haulage, and buyer intelligence.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenPdfUtility('shipping-manifest')}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
                  >
                    <Download size={14} className="text-red-400" />
                    <span>PDF Export Utility</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDomainConnectionModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Globe size={14} className="text-blue-600" />
                    <span>Domain & SSL Gateway</span>
                  </button>
                </div>
              </div>

              {/* The 4 Hero Operational Quick Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. AI Document Parser */}
                <button
                  type="button"
                  onClick={() => setIsAiParserOpen(true)}
                  className="p-5 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white hover:from-red-700 hover:to-rose-800 transition-all duration-200 group text-left shadow-md hover:shadow-xl cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center mb-3 transition-colors shadow-xs">
                      <Sparkles size={20} className="text-yellow-300 animate-pulse" />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-tight">
                      AI Document & B/L Parser
                    </h4>
                    <p className="text-xs text-rose-100 mt-1 leading-snug">
                      Extract shipment metadata, packing matrices & HS codes from invoices & bills of lading via GPT-6 Astra.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-black text-white uppercase tracking-wider">
                    <span>Upload & Parse</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* 2. Create New Invoice */}
                <button
                  type="button"
                  onClick={() => setActiveTab('documents')}
                  className="p-5 rounded-2xl bg-white hover:bg-slate-900 hover:text-white border-2 border-slate-900 text-slate-900 transition-all duration-200 group text-left shadow-sm hover:shadow-xl cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-red-50 group-hover:bg-white text-red-600 group-hover:text-red-600 flex items-center justify-center mb-3 transition-colors shadow-xs">
                      <FileText size={20} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-tight">
                      Create New Invoice
                    </h4>
                    <p className="text-xs text-slate-500 group-hover:text-slate-300 mt-1 leading-snug">
                      Synthesize export Commercial Invoices & Packing Lists on the official Red Bird International letterhead.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 group-hover:border-slate-800 flex items-center justify-between text-xs font-black text-red-600 group-hover:text-red-400 uppercase tracking-wider">
                    <span>Open Invoice Generator</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* 3. Generate Shipping Label */}
                <button
                  type="button"
                  onClick={() => setIsShippingLabelModalOpen(true)}
                  className="p-5 rounded-2xl bg-white hover:bg-slate-900 hover:text-white border-2 border-slate-900 text-slate-900 transition-all duration-200 group text-left shadow-sm hover:shadow-xl cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-red-50 group-hover:bg-red-600 text-red-600 group-hover:text-white flex items-center justify-center mb-3 transition-colors shadow-xs">
                      <Package size={20} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-tight">
                      Generate Shipping Label
                    </h4>
                    <p className="text-xs text-slate-500 group-hover:text-slate-300 mt-1 leading-snug">
                      Create scannable ISO/GS1 carton stickers with B/L barcodes, QR verification, and customs tags.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 group-hover:border-slate-800 flex items-center justify-between text-xs font-black text-red-600 group-hover:text-red-400 uppercase tracking-wider">
                    <span>Print Thermal Label</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* 4. Schedule Pickup */}
                <button
                  type="button"
                  onClick={() => setIsSchedulePickupModalOpen(true)}
                  className="p-5 rounded-2xl bg-white hover:bg-slate-900 hover:text-white border-2 border-slate-900 text-slate-900 transition-all duration-200 group text-left shadow-sm hover:shadow-xl cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center mb-3 transition-colors shadow-xs">
                      <Truck size={20} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-tight">
                      Schedule Pickup
                    </h4>
                    <p className="text-xs text-slate-500 group-hover:text-slate-300 mt-1 leading-snug">
                      Book factory prime movers, container haulage, and generate verified Gate Passes for Chittagong Port.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 group-hover:border-slate-800 flex items-center justify-between text-xs font-black text-blue-600 group-hover:text-blue-400 uppercase tracking-wider">
                    <span>Dispatch Cargo Truck</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>

              {/* Formatted PDF Document Quick Export Ribbon */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-red-100 text-red-700 rounded-xl">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase text-[11px] flex items-center gap-1.5">
                      <span>Direct Document PDF Export Utility</span>
                      <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                        300 DPI A4
                      </span>
                    </h4>
                    <p className="text-slate-500 text-[10px]">
                      Export formatted shipping manifests and commercial invoices on official Red Bird International letterhead.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenPdfUtility('shipping-manifest')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer text-xs"
                  >
                    <Ship size={13} className="text-blue-400" />
                    <span>Export Shipping Manifest (PDF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenPdfUtility('commercial-invoice')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer text-xs"
                  >
                    <FileText size={13} />
                    <span>Export Invoice (PDF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenPdfUtility('packing-list')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-xl font-bold transition-all border border-blue-200 cursor-pointer text-xs"
                  >
                    <Package size={13} className="text-blue-600" />
                    <span>Export Packing Manifest (PDF)</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Live Real-time AI Voice Command Center */}
            <LiveVoiceAgentBar
              onExecuteAction={handleVoiceActionExecution}
              activeTab={activeTab}
              shipmentsCount={displayShipments.length}
            />

            {/* 4. Smart Dashboard Mode Navigation & Unified Workspace */}
            <div className="space-y-6">
              {/* Segmented Workspace Switcher Bar */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setDashboardViewMode('operations')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                      dashboardViewMode === 'operations'
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    <Package size={15} />
                    <span>Active Consignments ({filteredDashboardShipments.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDashboardViewMode('buyers')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                      dashboardViewMode === 'buyers'
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    <Building2 size={15} />
                    <span>Buyer Sourcing & Intelligence</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDashboardViewMode('analytics')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                      dashboardViewMode === 'analytics'
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    <BarChart3 size={15} />
                    <span>Trade Analytics & Charts</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDashboardViewMode('corridors')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                      dashboardViewMode === 'corridors'
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    <Compass size={15} />
                    <span>Sea Corridors & Supply Chain</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDashboardViewMode('assistant')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                      dashboardViewMode === 'assistant'
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    <Bot size={15} />
                    <span>Scarlet AI Assistant</span>
                  </button>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center justify-between sm:justify-end gap-3 px-2 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-500 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>
                      {dashboardViewMode === 'operations' ? 'Live Cargo Management' :
                       dashboardViewMode === 'analytics' ? 'Full Width Insights' :
                       dashboardViewMode === 'corridors' ? 'Chittagong BDCGP Gateway' : 'Bilingual AI Voice'}
                    </span>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {displayShipments.length} Active Records
                  </span>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* MODE 1: ACTIVE CONSIGNMENTS & OPERATIONS WORKSPACE (FULL WIDTH & CLEAN)   */}
              {/* ========================================================================= */}
              {dashboardViewMode === 'operations' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
                    {/* Header, Search & Filter Bar */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                            <Ship size={18} />
                          </div>
                          <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                            Live Export Consignments & Trade Operations
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          Spacious operational workspace: Review ocean cargo, B/L identifiers, and click to draft authenticated Commercial Invoices or Packing Lists.
                        </p>
                      </div>

                      {/* Search & Status Filters */}
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Search Input */}
                        <div className="relative min-w-[240px] sm:min-w-[280px]">
                          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={dashboardShipmentSearch}
                            onChange={(e) => setDashboardShipmentSearch(e.target.value)}
                            placeholder="Search Buyer, ID, B/L, or Port..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
                          />
                        </div>

                        {/* Status Pills */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => setDashboardStatusFilter('all')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                              dashboardStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            All ({displayShipments.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setDashboardStatusFilter('transit')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                              dashboardStatusFilter === 'transit' ? 'bg-white text-blue-700 shadow-xs font-black' : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            In Transit ({statusCounts.inTransit})
                          </button>
                          <button
                            type="button"
                            onClick={() => setDashboardStatusFilter('planning')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                              dashboardStatusFilter === 'planning' ? 'bg-white text-amber-700 shadow-xs font-black' : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            In Planning ({statusCounts.inPlanning})
                          </button>
                          <button
                            type="button"
                            onClick={() => setDashboardStatusFilter('delivered')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                              dashboardStatusFilter === 'delivered' ? 'bg-white text-emerald-700 shadow-xs font-black' : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            Delivered ({statusCounts.delivered})
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveTab('new-shipment')}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>Add Cargo</span>
                        </button>
                      </div>
                    </div>

                    {/* Full-Width Consignments Table */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-white uppercase tracking-wider text-[10px] font-black">
                            <th className="py-3 px-4">Tracking ID & B/L</th>
                            <th className="py-3 px-4">Buyer / Consignee</th>
                            <th className="py-3 px-4">Discharge Port & Carrier</th>
                            <th className="py-3 px-4 text-right">Volume (Pcs)</th>
                            <th className="py-3 px-4 text-center">Master Cartons</th>
                            <th className="py-3 px-4 text-center">Docs Readiness</th>
                            <th className="py-3 px-4 text-center">Transit Status</th>
                            <th className="py-3 px-4 text-right">Quick Document Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
                          {filteredDashboardShipments.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-12 text-center text-slate-400">
                                <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                                <p className="font-bold text-slate-700">No shipments found matching filter</p>
                                <p className="text-[11px] mt-0.5">Try adjusting your search terms or status toggle.</p>
                              </td>
                            </tr>
                          ) : (
                            filteredDashboardShipments.map((ship, idx) => (
                              <tr key={ship.id || idx} className="hover:bg-slate-50/80 transition-colors">
                                {/* Column 1: ID & BL */}
                                <td className="py-3.5 px-4">
                                  <div className="font-mono font-black text-slate-900 text-xs">
                                    #{ship.id}
                                  </div>
                                  <div className="text-[10px] font-mono text-red-600 mt-0.5">
                                    {ship.blNumber}
                                  </div>
                                </td>

                                {/* Column 2: Buyer & Country */}
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-slate-900 truncate max-w-[200px]">
                                    {ship.buyerName}
                                  </div>
                                  <div className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                                    <span>{ship.buyerCountry}</span>
                                    <span>•</span>
                                    <span className="text-slate-400">{ship.departureDate}</span>
                                  </div>
                                </td>

                                {/* Column 3: Port & Carrier */}
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-slate-800 truncate max-w-[200px]">
                                    {ship.destinationPort}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {ship.carrier} ({ship.transportMode})
                                  </div>
                                </td>

                                {/* Column 4: Volume */}
                                <td className="py-3.5 px-4 text-right font-black font-mono text-slate-900 text-xs">
                                  {ship.totalQuantity.toLocaleString()}
                                  <span className="text-[10px] text-slate-400 font-normal ml-1">Pcs</span>
                                </td>

                                {/* Column 5: Cartons */}
                                <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                                  {ship.totalCartons.toLocaleString()} Ctns
                                </td>

                                {/* Column 6: Docs Readiness */}
                                <td className="py-3.5 px-4 text-center">
                                  {ship.docsReady ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <CheckCircle2 size={11} /> All Cleared
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                                      <Clock size={11} /> Pending Draft
                                    </span>
                                  )}
                                </td>

                                {/* Column 7: Transit Status */}
                                <td className="py-3.5 px-4 text-center">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                    ship.status === 'In Transit'
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : ship.status === 'Delivered'
                                      ? 'bg-slate-100 text-slate-700 border border-slate-300'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}>
                                    {ship.status === 'In Transit' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>}
                                    {ship.status}
                                  </span>
                                </td>

                                {/* Column 8: Actions */}
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedShipmentForLabel(ship);
                                        setIsShippingLabelModalOpen(true);
                                      }}
                                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[10px] font-bold transition-all border border-amber-200 cursor-pointer shadow-xs flex items-center gap-1"
                                      title="Generate & Download PDF Cargo Shipping Label for this consignment"
                                    >
                                      <Package size={10} className="text-amber-600" />
                                      <span>Label PDF</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenPdfUtility('shipping-manifest', ship.id)}
                                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1"
                                      title="Export Formatted Cargo Shipping Manifest PDF directly"
                                    >
                                      <Ship size={10} className="text-blue-400" />
                                      <span>Manifest PDF</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenPdfUtility('commercial-invoice', ship.id)}
                                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1"
                                      title="Export Formatted Commercial Invoice PDF directly"
                                    >
                                      <Download size={10} />
                                      <span>Invoice PDF</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedDocumentShipmentId(ship.id);
                                        setActiveTab('documents');
                                      }}
                                      className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[10px] font-bold transition-all border border-red-200 cursor-pointer shadow-xs"
                                      title="Draft Commercial Invoice & Packing List on Unified Letterhead"
                                    >
                                      Editor
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setActiveTab('shipment')}
                                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all border border-slate-200 cursor-pointer"
                                      title="View in Full Shipment Registry"
                                    >
                                      Registry
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Operational Summary Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-slate-500 text-[11px]">Filtered Cargo: </span>
                          <strong className="text-slate-900">
                            {filteredDashboardShipments.reduce((sum, s) => sum + s.totalQuantity, 0).toLocaleString()} Pcs
                          </strong>
                        </div>
                        <span className="text-slate-300">•</span>
                        <div>
                          <span className="text-slate-500 text-[11px]">Total Cartons: </span>
                          <strong className="text-slate-900">
                            {filteredDashboardShipments.reduce((sum, s) => sum + s.totalCartons, 0).toLocaleString()} Ctns
                          </strong>
                        </div>
                        <span className="text-slate-300">•</span>
                        <div>
                          <span className="text-slate-500 text-[11px]">Port of Origin: </span>
                          <strong className="text-red-700">Chittagong Port (BDCGP)</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setDashboardViewMode('analytics')}
                          className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 text-xs"
                        >
                          <span>Switch to Analytics & Charts View</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* MODE: BUYER SOURCING & MARKET INTELLIGENCE NETWORK                        */}
              {/* ========================================================================= */}
              {dashboardViewMode === 'buyers' && (
                <div className="space-y-6 animate-fade-in">
                  <BuyerSourcingIntelligence
                    onDraftInvoiceForBuyer={(buyer) => {
                      setSelectedDocumentShipmentId(buyer.id);
                      setActiveTab('documents');
                    }}
                    onGenerateLabelForBuyer={(buyer) => {
                      setSelectedShipmentForLabel({
                        buyerName: buyer.name,
                        buyerAddress: `${buyer.city}, ${buyer.country}`,
                        destinationPort: buyer.port,
                        blNumber: `RBL-2026-CTG-${buyer.id}`,
                        totalCartons: Math.round(buyer.totalVolumePcs / 40)
                      });
                      setIsShippingLabelModalOpen(true);
                    }}
                    onSchedulePickupForBuyer={(buyer) => {
                      setSelectedShipmentForPickup({
                        buyerName: buyer.name,
                        id: buyer.id
                      });
                      setIsSchedulePickupModalOpen(true);
                    }}
                    onCreateShipmentForBuyer={(buyer) => {
                      setActiveTab('new-shipment');
                    }}
                  />
                </div>
              )}

              {/* ========================================================================= */}
              {/* MODE 2: TRADE PERFORMANCE & FULL-WIDTH ANALYTICS                          */}
              {/* ========================================================================= */}
              {dashboardViewMode === 'analytics' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Top Chart: 6-Month Export Velocity & Targets */}
                  <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/90 shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                          <BarChart3 size={18} />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                            6-Month Garment Export Volume Trajectory vs Fulfillment Target
                          </h3>
                          <p className="text-xs text-slate-500">
                            Fulfillment tracking across Gazipur finishing lines and Chittagong container dispatch.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                          <span className="w-2 h-2 rounded-full bg-blue-600"></span> Actual Pcs
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                          <span className="w-2 h-2 rounded-full bg-slate-400"></span> Target Pcs
                        </span>
                      </div>
                    </div>

                    {/* Area Chart */}
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dashboardMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="dbVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35}/>
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                            </linearGradient>
                            <linearGradient id="dbTargetGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${((Number(val) || 0) / 1000).toFixed(0)}k`} />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs">
                                    <p className="font-black uppercase tracking-wider text-slate-300">{label}</p>
                                    <div className="mt-2 space-y-1">
                                      <p className="text-blue-400 font-bold flex justify-between gap-4">
                                        <span>Export Volume:</span>
                                        <span>{data.volume.toLocaleString()} pcs</span>
                                      </p>
                                      <p className="text-slate-400 flex justify-between gap-4">
                                        <span>Target:</span>
                                        <span>{data.target.toLocaleString()} pcs</span>
                                      </p>
                                      <p className="text-emerald-400 font-bold flex justify-between gap-4">
                                        <span>FOB Value:</span>
                                        <span>${data.value}k USD</span>
                                      </p>
                                      <p className="text-amber-400 font-bold flex justify-between gap-4">
                                        <span>On-Time SLA:</span>
                                        <span>{data.sla}%</span>
                                      </p>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" fill="url(#dbTargetGrad)" />
                          <Area type="monotone" dataKey="volume" stroke="#2563eb" strokeWidth={3} fill="url(#dbVolumeGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Snapshot Micro Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                      <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100/50">
                        <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider block mb-1">Active Global Clients</span>
                        <div className="flex items-end gap-2">
                          <p className="text-2xl font-black text-slate-900">{dynamicStats.activeClients}</p>
                          <span className="text-[10px] font-bold text-blue-600 mb-1">Strategic Partners</span>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200/50">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">6-Month Total Export</span>
                        <p className="text-2xl font-black text-blue-600">59,550 Pcs</p>
                      </div>
                      <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100/50">
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block mb-1">Shipment Success Rate</span>
                        <p className="text-2xl font-black text-emerald-600">{dynamicStats.onTimeSla}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200/50">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Operational Health</span>
                        <p className="text-base font-black text-slate-900">Optimal Performance</p>
                      </div>
                    </div>
                  </div>

                  {/* Balanced 2-Column Analytics: Export Corridors vs Document Clearance Health */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Export Corridors Bar Chart */}
                    <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/90 shadow-sm space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                            <TrendingUp size={18} />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 uppercase">Export Volume by Destination Port</h4>
                            <p className="text-[11px] text-slate-500 font-medium">Garment piece volume across global trade corridors</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-red-600 uppercase">Busan #1 Port</span>
                      </div>

                      <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={corridorBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${((Number(val) || 0) / 1000).toFixed(0)}k`} />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const d = payload[0].payload;
                                  return (
                                    <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs font-bold shadow-lg">
                                      <p>{d.name}</p>
                                      <p className="text-red-400">{d.volume.toLocaleString()} Pcs ({d.share})</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="volume" radius={[6, 6, 0, 0]}>
                              {corridorBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                        {corridorBreakdown.slice(0, 3).map((c, i) => (
                          <div key={i} className="p-2.5 bg-slate-50 rounded-xl">
                            <span className="text-[10px] text-slate-500 font-bold block truncate">{c.name}</span>
                            <span className="text-xs font-black text-slate-900">{c.volume.toLocaleString()} Pcs</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Document Clearance Donut Chart */}
                    <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/90 shadow-sm space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                            <FileText size={18} />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 uppercase">Customs & Trade Document Health</h4>
                            <p className="text-[11px] text-slate-500 font-medium">Commercial Invoices, Packing Lists & B/L Releases</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">34 Cleared</span>
                      </div>

                      <div className="h-60 w-full flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={docClearanceData}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={80}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {docClearanceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const d = payload[0].payload;
                                  return (
                                    <div className="bg-slate-900 text-white p-2 rounded-xl text-xs font-bold shadow-md">
                                      <span>{d.name}: {d.value} documents</span>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-2xl font-black text-slate-900">82%</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cleared</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                        {docClearanceData.map((d, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }}></span>
                            <div className="truncate">
                              <p className="text-[10px] font-bold text-slate-800 truncate">{d.name}</p>
                              <p className="text-[10px] font-black text-slate-500">{d.value} docs</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* MODE 3: MARITIME CORRIDORS & SUPPLY CHAIN ARCHITECTURE                    */}
              {/* ========================================================================= */}
              {dashboardViewMode === 'corridors' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Maritime Sea Corridors (3-Column Clean Balanced Grid) */}
                  <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/90 shadow-sm space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-slate-100 text-slate-800 rounded-xl">
                          <Compass size={18} />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-900 uppercase">Chittagong BDCGP Maritime Export Corridors</h4>
                          <p className="text-xs text-slate-500 font-medium">Direct ocean liner departures & scheduled transit times</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        All Corridors Clear • Zero Port Demurrage
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { 
                          route: 'Chittagong → Busan, South Korea', 
                          days: '14 Days Transit', 
                          carrier: 'KMTC / Sinokor Ocean', 
                          status: 'On Schedule',
                          desc: 'Dedicated weekly FCL sailings to Busan New Port with direct customs pre-clearance.'
                        },
                        { 
                          route: 'Chittagong → Los Angeles, USA', 
                          days: '24 Days Transit', 
                          carrier: 'Maersk Line FCL', 
                          status: 'On Schedule',
                          desc: 'Direct transpacific vessel routing to Long Beach Port / Los Angeles logistics hubs.'
                        },
                        { 
                          route: 'Chittagong → Hamburg, Germany', 
                          days: '22 Days Transit', 
                          carrier: 'Hapag-Lloyd Express', 
                          status: 'On Schedule',
                          desc: 'European gateway service via Suez Canal to Hamburg & Rotterdam distribution center.'
                        }
                      ].map((c, idx) => (
                        <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex items-center justify-between font-bold text-slate-900">
                              <span className="text-sm font-black">{c.route}</span>
                              <span className="text-emerald-600 font-black text-[11px] bg-emerald-100/60 px-2 py-0.5 rounded-full">{c.status}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed">{c.desc}</p>
                          </div>
                          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                            <span className="font-bold">{c.carrier}</span>
                            <span className="font-mono text-red-600 font-black">{c.days}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RMG Supply Chain Lifecycle (4-Phase Architecture) */}
                  <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                      <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                        <Layers size={18} />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">RMG Supply Chain & Operating Lifecycle</h3>
                        <p className="text-xs text-slate-500 font-medium">Standardized operating lifecycle from manufacturing floor to international customs clearance.</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { step: '01', title: 'Factory Sourcing', desc: 'Secure direct surplus and premium OEM apparel runs from compliant factories in Dhaka & Gazipur.', tag: 'Gazipur Hub' },
                        { step: '02', title: 'Re-Processing & QC', desc: 'AQL 2.5 quality inspection, barcode tagging, moisture barrier polybags, master packing.', tag: 'ISO 9001:2015' },
                        { step: '03', title: 'L/C & Banking', desc: 'Irrevocable Letters of Credit, sales contracts, Bangladesh Bank EXP clearance & seals.', tag: 'Hana Bank / SIBL' },
                        { step: '04', title: 'Ocean Logistics', desc: '40ft High Cube container stuffing and scheduled ocean routing to destination ports.', tag: 'Chittagong BDCGP' }
                      ].map((item, idx) => (
                        <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-black text-red-600 font-mono">PHASE {item.step}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase">{item.tag}</span>
                            </div>
                            <h4 className="text-sm font-black text-slate-900 mb-1">{item.title}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* MODE 4: SCARLET AI ASSISTANT & COMMAND ACTIONS                            */}
              {/* ========================================================================= */}
              {dashboardViewMode === 'assistant' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-red-950 text-white p-8 rounded-[2.5rem] border border-red-500/20 shadow-xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center shadow-lg shadow-red-600/40">
                          <Bot size={28} className="text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-lg tracking-tight uppercase">Scarlet AI Executive Partner</h4>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          </div>
                          <p className="text-xs text-slate-300 font-medium mt-0.5">Bilingual (বাংলা & English) • Powered by GPT-6 Astra</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsVoiceAssistantOpen(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-red-600/30 cursor-pointer self-start sm:self-auto"
                      >
                        <Mic size={16} />
                        <span>Launch Voice Command Mode</span>
                      </button>
                    </div>

                    <p className="text-sm text-slate-200 leading-relaxed max-w-3xl">
                      স্কারলেট সম্পূর্ণ মানুষের মতো সহানুভূতিশীল ও সাবলীল ভাষায় কথা বলতে পারে। শিপমেন্ট ট্র্যাকিং, এক্সপোর্ট ভলিউম বিশ্লেষণ কিংবা স্বয়ংক্রিয়ভাবে ইনভয়েস ও প্যাকিং লিস্ট ড্রাফট করার জন্য যেকোনো নির্দেশনা দিন।
                    </p>

                    <div className="space-y-3">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400">One-Click Verbal & Text Commands:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          { title: 'আজকের শিপমেন্টের অবস্থা কী?', desc: 'Live Chittagong BDCGP status' },
                          { title: 'হানওয়াহ অর্ডারের স্ট্যাটাস জানাও', desc: 'South Korea consignment tracking' },
                          { title: 'AI দিয়ে ইনভয়েস ও প্যাকিং লিস্ট ড্রাফট করো', desc: 'Direct Gemini document generator' },
                          { title: 'Show On-Time SLA & Lead Times', desc: 'Factory finishing lead times' }
                        ].map((promptItem, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              if (promptItem.title.includes('ইনভয়েস')) {
                                setActiveTab('documents');
                              } else if (promptItem.title.includes('SLA')) {
                                setDashboardViewMode('analytics');
                              } else {
                                setIsVoiceAssistantOpen(true);
                              }
                            }}
                            className="text-left p-4 rounded-2xl bg-white/5 hover:bg-red-600/30 text-slate-200 hover:text-white border border-white/10 transition-colors flex flex-col justify-between cursor-pointer"
                          >
                            <span className="font-bold text-xs">{promptItem.title}</span>
                            <span className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
                              <span>{promptItem.desc}</span>
                              <ArrowRight size={13} className="text-red-400" />
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Persistent, display-hidden state-preserving container wrapper */}
        <div className={`${activeTab === 'new-shipment' ? 'block animate-fade-in' : 'hidden'}`}>
           <ShipmentProfileForm 
              key={formResetKey}
              initialData={voicePrefilledShipment}
              onMinimize={() => {
                 setIsFormMinimized(true);
                 setActiveTab('dashboard');
              }}
              onBack={() => {
                 setActiveTab('dashboard');
              }}
              isFullScreen={isFormFullScreen}
              onToggleFullScreen={() => setIsFormFullScreen(!isFormFullScreen)}
           />
        </div>

        {activeTab === 'catalog' && (
          <div className="space-y-10 animate-fade-in">
             <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-1">Buyer Presentation</h2>
                  <p className="text-slate-500 font-medium leading-tight">Generate a customized wholesale quotation catalog for international buyers.</p>
                </div>
                <button 
                  onClick={handleExportPresentation}
                  disabled={isGenerating}
                  className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-red-600 transition-all flex items-center gap-3 shadow-xl active:scale-95 disabled:opacity-50 text-xs tracking-widest uppercase"
                >
                  {isGenerating ? 'GENERATING...' : 'EXPORT PRESENTATION (PDF)'}
                </button>
             </header>

             {/* Dynamic Multiplier & Filtering Panel - Admin Dashboard Tool */}
             <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Search Collection</label>
                   <input 
                     type="text" 
                     placeholder="Search style or brand..."
                     value={catalogSearch}
                     onChange={e => setCatalogSearch(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-red-600"
                   />
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Garment Type Filter</label>
                   <select 
                     value={catalogTypeFilter}
                     onChange={e => setCatalogTypeFilter(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none"
                   >
                      <option value="All">All Categories</option>
                      <option value="Jacket">Jackets</option>
                      <option value="Pants">Pants</option>
                      <option value="Polo">Polo Shirts</option>
                      <option value="Boxer">Boxer Pack</option>
                   </select>
                </div>
                <div className="md:col-span-2">
                   <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Buyer Markup Multiplier</label>
                      <span className="text-xs font-black text-red-600">+{markupPercent}% Margin</span>
                   </div>
                   <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        step="5"
                        value={markupPercent}
                        onChange={e => setMarkupPercent(parseInt(e.target.value) || 0)}
                        className="flex-1 accent-red-600"
                      />
                      <input 
                        type="number"
                        min="0"
                        max="200"
                        value={markupPercent}
                        onChange={e => setMarkupPercent(parseInt(e.target.value) || 0)}
                        className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-center"
                      />
                   </div>
                </div>
             </div>

             {/* Style Selector List for Quick Admin Inclusion */}
             <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm no-print space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                   <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Select Garments to Export in PDF</h3>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => {
                           const updated = { ...selectedGarments };
                           PRODUCTS.forEach(p => { updated[p.id] = true; });
                           setSelectedGarments(updated);
                        }}
                        className="text-[9px] font-black text-blue-600 uppercase tracking-wider hover:underline"
                      >
                         Select All
                      </button>
                      <span className="text-slate-300">•</span>
                      <button 
                        onClick={() => {
                           const updated = { ...selectedGarments };
                           PRODUCTS.forEach(p => { updated[p.id] = false; });
                           setSelectedGarments(updated);
                        }}
                        className="text-[9px] font-black text-slate-400 uppercase tracking-wider hover:underline"
                      >
                         Deselect All
                      </button>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                   {PRODUCTS.map(p => (
                      <label key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-all border border-slate-200/50">
                         <input 
                           type="checkbox" 
                           checked={!!selectedGarments[p.id]} 
                           onChange={e => setSelectedGarments({ ...selectedGarments, [p.id]: e.target.checked })}
                           className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                         />
                         <div className="w-8 h-8 rounded bg-white overflow-hidden flex items-center justify-center">
                            <img src={p.images[0]} className="max-h-full" alt="" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-900 truncate leading-none mb-1">{p.name}</p>
                            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{p.brand} • Base: ${p.price || 12.00}</p>
                         </div>
                      </label>
                   ))}
                </div>
             </div>

             {/* The exportable Presentation layout */}
             <div className="bg-white rounded-[2.5rem] p-12 shadow-2xl border border-slate-200" ref={catalogRef}>
                <DocumentHeader />
                
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-10 flex flex-col md:flex-row justify-between gap-6">
                   <div>
                      <h4 className="text-xs font-black text-red-600 uppercase tracking-[0.2em] mb-2">Exclusive Wholesale Offer Sheet</h4>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">Prepared specially for verified Red Bird buyers. The wholesale quote list is tailored with the agreed operational markup and freight considerations.</p>
                   </div>
                   <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-200/50 min-w-[220px]">
                      <div>
                         <p className="text-[8px] font-black text-slate-400 uppercase">Margin Factor</p>
                         <p className="text-sm font-black text-slate-900">+{markupPercent}% Margin</p>
                      </div>
                      <div>
                         <p className="text-[8px] font-black text-slate-400 uppercase">Currency Standard</p>
                         <p className="text-sm font-black text-slate-900">USD ($)</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] pb-2 border-b-2 border-slate-900">Premium Styles & Quotations</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredCatalogProducts.map(p => {
                         const basePrice = p.price || 12.00;
                         const quotedPrice = basePrice * (1 + markupPercent / 100);
                         return (
                            <div key={p.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-6 shadow-sm">
                               <div className="w-24 h-24 rounded-2xl bg-white overflow-hidden flex items-center justify-center p-2 border border-slate-200/50 flex-shrink-0">
                                  <img src={p.images[0]} className="max-h-full max-w-full" alt="" />
                               </div>
                               <div className="flex-1 min-w-0">
                                  <h4 className="font-black text-slate-900 text-sm leading-tight truncate mb-1">{p.name}</h4>
                                  <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest leading-none mb-3">{p.brand} • {p.garmentType}</p>
                                  <div className="space-y-1">
                                     <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-400 font-bold uppercase">Wholesale Quote</span>
                                        <span className="text-slate-900 font-black">${quotedPrice.toFixed(2)} / Unit</span>
                                     </div>
                                     <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-400 font-bold uppercase">Sizes Offered</span>
                                        <span className="text-slate-900 font-black truncate max-w-[120px]">{p.sizes.join(', ')}</span>
                                     </div>
                                  </div>
                               </div>
                            </div>
                         );
                      })}
                   </div>
                </div>

                <div className="aspect-[16/6] bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl relative mt-12">
                   <img src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover opacity-60" alt="" />
                   <div className="absolute inset-0 p-8 bg-gradient-to-t from-slate-950/80 to-transparent flex flex-col justify-end">
                      <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Verified Re-Processed Apparel</h3>
                      <p className="text-slate-300 text-[10px] font-medium max-w-md uppercase tracking-wider mt-1">100% inspected. Original brand labels securely matched with accurate garment sizing charts.</p>
                   </div>
                </div>
                
                <footer className="mt-12 pt-6 border-t border-slate-100 flex justify-between items-center opacity-30 grayscale">
                   <p className="text-[8px] font-bold uppercase tracking-widest">PRIVATE CONFIDENTIAL • RED BIRD INTERNATIONAL EXCLUSIVE PROPOSAL</p>
                   <div className="flex gap-4">
                      <span className="text-[8px] font-black">RED BIRD INTERNATIONAL CORP.</span>
                   </div>
                </footer>
             </div>
          </div>
        )}
        {activeTab === 'expenses' && (
          <div className="animate-fade-in">
            <ExpenseAccountsModule />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-fade-in">
            <LetterheadSettings />
          </div>
        )}

        {activeTab === 'hr' && (
          <div className="animate-fade-in">
            <HRModule />
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="animate-fade-in">
            <OrderManagementModule 
              isMasterAdmin={isMasterAdmin} 
              onDraftDocuments={(order) => {
                setSelectedOrderForDrafting(order);
                setActiveTab('documents');
              }}
            />
          </div>
        )}

        {activeTab === 'users' && !isMasterAdmin && (
          <div className="bg-red-50 p-12 rounded-[3rem] border border-red-100 text-center">
             <h3 className="text-2xl font-black text-red-600 uppercase mb-4">Access Restricted</h3>
             <p className="text-slate-500 font-medium max-w-md mx-auto">Only the Master Administrator has the authority to manage partner accounts and secure credentials.</p>
          </div>
        )}

        {activeTab === 'users' && isMasterAdmin && <UserControlModule />}

        {activeTab === 'routes' && <AdminRoutesModule />}

        {activeTab === 'leadtime' && (
          <div className="animate-fade-in">
            <ExportVolumeLeadTimeAnalytics 
              shipments={shipments} 
              onNavigateTab={(tab, filter) => {
                if (filter) setShipmentSearchFilter(filter);
                setActiveTab(tab as any);
              }}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Analytics Intelligence View:
                </span>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setAnalyticsSubView('kpi')}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                    analyticsSubView === 'kpi' ? 'bg-red-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Logistics KPI Dashboard (Recharts)
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsSubView('leadtime')}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                    analyticsSubView === 'leadtime' ? 'bg-red-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Export Volumes & Lead Times
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsSubView('trade')}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                    analyticsSubView === 'trade' ? 'bg-red-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Regional & Buyer Sourcing
                </button>
              </div>
            </div>

            {analyticsSubView === 'kpi' ? (
              <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/90 shadow-sm">
                <KPIDashboard 
                  shipments={shipments.length > 0 ? shipments : (displayShipments as any)} 
                  expenses={expenses} 
                />
              </div>
            ) : analyticsSubView === 'leadtime' ? (
              <ExportVolumeLeadTimeAnalytics 
                shipments={shipments} 
                onNavigateTab={(tab, filter) => {
                  if (filter) setShipmentSearchFilter(filter);
                  setActiveTab(tab as any);
                }}
              />
            ) : (
              <TradePerformanceAnalytics shipments={shipments} />
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="animate-fade-in">
            <DocumentGenerator 
              shipments={shipments} 
              initialShipmentId={selectedDocumentShipmentId}
              initialOrderForDrafting={selectedOrderForDrafting}
              onOpenShipmentCreator={() => setActiveTab('new-shipment')} 
            />
          </div>
        )}

        {activeTab === 'proforma' && (
          <div className="animate-fade-in">
            <ProFormaInvoiceGenerator 
              shipments={shipments} 
              onOpenShipmentCreator={() => setActiveTab('new-shipment')} 
            />
          </div>
        )}

        {activeTab === 'shipment' && (
          <div className="animate-fade-in space-y-5">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white p-5 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-600/30 shrink-0">
                  <Mic size={22} className="text-white animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      Voice Shipment Logging & Audit Notes
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                      Live Mic API
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Speak into your microphone to quickly log milestones, append customs clearance notes, or synthesize new consignments.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedVoiceShipmentId('');
                    setIsVoiceShipmentLogModalOpen(true);
                  }}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-red-600/30 cursor-pointer active:scale-95"
                >
                  <Mic size={15} />
                  <span>Open Voice Logger (Alt + M)</span>
                </button>
              </div>
            </div>

            <ShipmentProfile 
              initialSearch={shipmentSearchFilter} 
              onViewSummary={(s) => setSelectedSummaryShipment(s)}
            />
          </div>
        )}

        {activeTab === 'visa' && (
          <div className="animate-fade-in">
            <VisaInvitationModule />
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="animate-fade-in">
            <OfficialApplicationGenerator prefilledPrompt={prefilledEmbassyPrompt} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-fade-in">
            <ShipmentHistoryLog />
          </div>
        )}

        {selectedSummaryShipment && (
          <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto no-print">
            <div className="w-full max-w-5xl my-8 relative">
              <button 
                onClick={() => setSelectedSummaryShipment(null)}
                className="absolute -top-12 right-0 text-white hover:text-red-400 font-black flex items-center gap-2 uppercase text-xs tracking-widest transition-colors"
              >
                <X size={20} />
                Close Report
              </button>
              <ShipmentSummaryReport shipment={selectedSummaryShipment} />
            </div>
          </div>
        )}

      </main>

      {/* Floating Voice Assistant Trigger (Accessible across all tabs) */}
      <button
        onClick={() => setIsVoiceAssistantOpen(true)}
        className="fixed bottom-6 right-24 z-40 bg-gradient-to-tr from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white p-3.5 rounded-full shadow-2xl shadow-red-600/40 border border-white/20 transition-all hover:scale-110 active:scale-95 group flex items-center gap-2"
        title="Admin Voice Command System (Alt + V: Verbal shipment updates & document drafting)"
      >
        <div className="relative">
          <span className="w-2.5 h-2.5 rounded-full bg-white absolute -top-0.5 -right-0.5 animate-ping"></span>
          <Mic className="w-5 h-5 text-white" />
        </div>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 text-xs font-black uppercase tracking-wider whitespace-nowrap">
          Voice Assistant
        </span>
      </button>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal 
        isOpen={isVoiceAssistantOpen}
        onClose={() => setIsVoiceAssistantOpen(false)}
        onNavigateTab={(tabId) => {
          setActiveTab(tabId as any);
        }}
        onFilterShipments={(searchTerm) => {
          setShipmentSearchFilter(searchTerm);
          setActiveTab('shipment');
        }}
        shipments={shipments}
        onUpdateShipmentStatus={handleUpdateShipmentStatus}
        onSelectShipmentForDocument={(shipmentId) => {
          setSelectedDocumentShipmentId(shipmentId);
          setActiveTab('documents');
        }}
        onExecuteAction={handleVoiceActionExecution}
      />

      {/* Voice-to-Text Shipment Logger & Notes Modal */}
      <VoiceShipmentLogModal
        isOpen={isVoiceShipmentLogModalOpen}
        onClose={() => setIsVoiceShipmentLogModalOpen(false)}
        shipments={shipments}
        initialShipmentId={selectedVoiceShipmentId}
        onShipmentCreated={(newShipment) => {
          setShipments(prev => [newShipment, ...prev]);
        }}
        onOpenInFullEditor={(prefilledData) => {
          setVoicePrefilledShipment(prefilledData);
          setActiveTab('new-shipment');
        }}
      />

      {/* Cloudflare Domain & DNS Gateway Modal */}
      <CloudflareDomainManager
        isOpen={isCloudflareModalOpen}
        onClose={() => setIsCloudflareModalOpen(false)}
      />

      {/* AI Automated Trade Document & B/L Parser Modal */}
      <AIDocumentParserModal
        isOpen={isAiParserOpen}
        onClose={() => setIsAiParserOpen(false)}
        onSaveAsShipment={(savedShipment) => {
          setShipments(prev => [savedShipment, ...prev]);
        }}
        onOpenInForm={(parsed) => {
          setIsAiParserOpen(false);
          setActiveTab('new-shipment');
        }}
        onOpenInDocumentGenerator={(parsed) => {
          setIsAiParserOpen(false);
          setSelectedDocumentShipmentId(parsed.invoiceNumber || parsed.blNumber);
          setActiveTab('documents');
        }}
      />

      {/* Quick Action & Management Modals */}
      <ShippingLabelModal
        isOpen={isShippingLabelModalOpen}
        onClose={() => setIsShippingLabelModalOpen(false)}
        shipmentData={selectedShipmentForLabel}
      />

      <SchedulePickupModal
        isOpen={isSchedulePickupModalOpen}
        onClose={() => setIsSchedulePickupModalOpen(false)}
        defaultBuyer={selectedShipmentForPickup?.buyerName}
        defaultShipmentId={selectedShipmentForPickup?.id}
      />

      <DomainConnectionModal
        isOpen={isDomainConnectionModalOpen}
        onClose={() => setIsDomainConnectionModalOpen(false)}
      />

      {/* Formatted PDF Document Generation & Export Utility */}
      <DashboardPdfExportUtility
        isOpen={isPdfExportUtilityOpen}
        onClose={() => setIsPdfExportUtilityOpen(false)}
        shipments={displayShipments}
        defaultShipmentId={pdfExportShipmentId}
        defaultDocType={pdfExportDocType}
      />

      <AIAssistant 
        onNavigateTab={(tab, filter) => {
          if (filter) setShipmentSearchFilter(filter);
          setActiveTab(tab as any);
        }}
      />
    </div>
  );
};

const UserControlModule: React.FC = React.memo(() => {
   const [users, setUsers] = useState<PortalUser[]>([]);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [loading, setLoading] = useState(false);
   const [form, setForm] = useState<Partial<PortalUser>>({
      userId: '',
      password: '',
      name: '',
      company: '',
      email: '',
      status: 'Active'
   });

   React.useEffect(() => {
      if (!db) return;
      const q = query(collection(db, 'portalUsers'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
         setUsers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PortalUser)));
      }, (error) => {
         handleFirestoreError(error, OperationType.GET, 'portalUsers');
      });
      return () => unsubscribe();
   }, []);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!db) return;
      setLoading(true);
      try {
         await addDoc(collection(db, 'portalUsers'), {
            ...form,
            createdAt: new Date().toISOString()
         });
         setIsModalOpen(false);
         setForm({ userId: '', password: '', name: '', company: '', email: '', status: 'Active' });
      } catch (error) {
         handleFirestoreError(error, OperationType.CREATE, 'portalUsers');
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="space-y-10">
         <header className="flex justify-between items-end">
            <div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tight">User Control</h2>
               <p className="text-slate-500 font-medium">Manage secure access for buyers and partners.</p>
            </div>
            <button 
               onClick={() => setIsModalOpen(true)}
               className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-red-600 transition-all shadow-xl"
            >
               + ADD NEW USER
            </button>
         </header>

         <div className="grid grid-cols-1 gap-4">
            {users.map(u => (
               <div key={u.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                     <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400">
                        {u.name.charAt(0)}
                     </div>
                     <div>
                        <div className="flex items-center gap-3">
                           <h4 className="font-black text-slate-900 uppercase leading-none">{u.name}</h4>
                           <span className={`px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${u.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                              {u.status}
                           </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{u.company} • ID: {u.userId}</p>
                     </div>
                  </div>
                  <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                        onClick={async () => {
                           if (!db) return;
                           const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
                           await updateDoc(doc(db, 'portalUsers', u.id), { status: nextStatus });
                        }}
                        className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-tighter"
                     >
                        Toggle Status
                     </button>
                     <button 
                        onClick={async () => {
                           if (!db || !window.confirm('Erase this user permanently?')) return;
                           await deleteDoc(doc(db, 'portalUsers', u.id));
                        }}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-tighter"
                     >
                        Delete
                     </button>
                  </div>
               </div>
            ))}
         </div>

         {isModalOpen && (
            <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
               <div className="bg-white max-w-xl w-full rounded-[3rem] p-12 shadow-2xl relative">
                  <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900">×</button>
                  <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase italic tracking-tighter">Register New Partner</h3>
                  <form onSubmit={handleSubmit} className="space-y-6">
                     <div className="grid grid-cols-2 gap-6">
                        <div>
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block">Access ID</label>
                           <input required type="text" value={form.userId} onChange={e => setForm({...form, userId: e.target.value})} className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-0" placeholder="e.g. BUYER_KOREA_01" />
                        </div>
                        <div>
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block">Secure Pass</label>
                           <input required type="text" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-0" placeholder="••••••••" />
                        </div>
                     </div>
                     <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block">Full Name</label>
                        <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-0" />
                     </div>
                     <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block">Company</label>
                        <input required type="text" value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full bg-slate-50 rounded-2xl px-6 py-4 font-bold border-0" />
                     </div>
                     <button disabled={loading} className="w-full bg-slate-900 text-white rounded-2xl py-4 font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-slate-900/10">
                        {loading ? 'Creating...' : 'Grant Portal Access'}
                     </button>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
});

export default React.memo(AdminPortal);
