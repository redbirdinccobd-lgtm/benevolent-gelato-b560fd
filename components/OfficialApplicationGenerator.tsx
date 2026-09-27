import { authenticatedFetch } from '../src/services/authenticatedFetch';
import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, Sparkles, Send, Upload, Download, Printer, RefreshCw, 
  CheckCircle2, Copy, Check, ShieldCheck, Building2, Landmark, 
  FileCheck, Edit3, Eye, ArrowRight, X, History, ChevronRight
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import { db } from '../src/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';

export interface ApplicationDocument {
  id?: string;
  referenceNumber: string;
  date: string;
  applicationType: 'embassy' | 'bank' | 'customs' | 'bgmea' | 'buyer' | 'general';
  recipientTitle: string;
  recipientOrganization: string;
  recipientAddress: string;
  subject: string;
  salutation: string;
  paragraphs: string[];
  closing: string;
  signatoryName: string;
  signatoryDesignation: string;
  enclosures: string[];
  verificationCode: string;
  promptUsed?: string;
  createdAt?: any;
}

export interface OfficialApplicationGeneratorProps {
  prefilledPrompt?: string;
}

export const OfficialApplicationGenerator: React.FC<OfficialApplicationGeneratorProps> = ({ prefilledPrompt }) => {
  const [prompt, setPrompt] = useState(prefilledPrompt || '');
  const [applicationType, setApplicationType] = useState<'embassy' | 'bank' | 'customs' | 'bgmea' | 'buyer' | 'general'>('embassy');

  useEffect(() => {
    if (prefilledPrompt) {
      setPrompt(prefilledPrompt);
    }
  }, [prefilledPrompt]);
  const [applicantName, setApplicantName] = useState('Md. Sumon');
  const [designation, setDesignation] = useState('Director of Operations & International Merchandising');
  const [passportNo, setPassportNo] = useState('A09876543');
  const [recipientOrganization, setRecipientOrganization] = useState('Embassy of the Republic of Korea, Dhaka, Bangladesh');
  const [recipientAddress, setRecipientAddress] = useState('4 Madani Avenue, Diplomatic Zone, Baridhara, Dhaka-1212');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompt' | 'upload' | 'history'>('prompt');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [historyList, setHistoryList] = useState<ApplicationDocument[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const documentPrintRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Draft Document
  const [docData, setDocData] = useState<ApplicationDocument>({
    referenceNumber: `RBI/EMB-2026-${Math.floor(100 + Math.random() * 900)}`,
    date: new Date().toISOString().split('T')[0],
    applicationType: 'embassy',
    recipientTitle: 'The Visa Consular Section',
    recipientOrganization: 'Embassy of the Republic of Korea in Bangladesh',
    recipientAddress: '4 Madani Avenue, Diplomatic Zone, Baridhara, Dhaka-1212, Bangladesh',
    subject: 'Official Recommendation & Corporate Financial Guarantee for Business Visa Application on Behalf of Mr. Md. Sumon',
    salutation: 'Honorable Consular Officer,',
    paragraphs: [
      'We, RED BIRD INTERNATIONAL, an established 100% export-oriented apparel manufacturer and international merchandising corporation based in Dhaka, Bangladesh, present our highest compliments to the Embassy of the Republic of Korea.',
      'This letter serves to officially recommend and sponsor Mr. Md. Sumon, holding Bangladeshi Passport No: A09876543, who currently serves as our Director of Operations & International Merchandising. Mr. Sumon has been officially deputed to undertake an imperative corporate trade and sourcing mission to South Korea (Seoul and Busan) to conduct high-level technical merchandise discussions, factory audits, and production delivery alignments with our Korean trade counterparts, including Hanwha Global Trading Corp and partner distribution networks.',
      'We hereby certify and guarantee that RED BIRD INTERNATIONAL shall bear full financial responsibility for all expenses incurred by Mr. Md. Sumon throughout his stay in the Republic of Korea, including round-trip airfare, comprehensive medical insurance, luxury hotel accommodations, and all local incidentals. Furthermore, our corporation provides an irrevocable guarantee that he will strictly observe all immigration rules and regulations of the Republic of Korea and will return to Bangladesh immediately upon conclusion of the official business itinerary.',
      'In light of the pressing export shipment schedules and our longstanding bilateral commercial ties, we respectfully solicit your kind assistance in granting Mr. Md. Sumon the requisite single/multiple-entry Business Visa at your earliest convenience.'
    ],
    closing: 'Yours faithfully,',
    signatoryName: 'Managing Director & Authorized Signatory',
    signatoryDesignation: 'RED BIRD INTERNATIONAL • Corporate Headquarters, Dhaka',
    enclosures: [
      'Copy of Valid Passport & Bio-Data Page of the Applicant',
      'Official Korean Corporate Invitation Letter & Schedule of Meetings',
      'Red Bird International Certificate of Incorporation & Valid Trade License',
      'Company Bank Solvency Certificate & Audited Financial Statements',
      'Valid Export Registration Certificate (ERC) & BGMEA Membership Credential'
    ],
    verificationCode: `VER-RBI-EMB-${Math.floor(100000 + Math.random() * 900000)}`
  });

  // Load history from Firestore on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    if (!db) return;
    try {
      const q = query(collection(db, 'official_applications'), orderBy('createdAt', 'desc'), limit(15));
      const snap = await getDocs(q);
      const list: ApplicationDocument[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as ApplicationDocument);
      });
      setHistoryList(list);
    } catch (e) {
      console.warn("Could not load application history:", e);
    }
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      let fileBase64: string | undefined = undefined;
      let mimeType: string | undefined = undefined;

      if (uploadedFile) {
        fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(uploadedFile);
        });
        mimeType = uploadedFile.type;
      }

      const res = await authenticatedFetch('/api/ai/draft-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          applicationType,
          applicantName,
          designation,
          passportNo,
          recipientOrganization,
          recipientAddress,
          rawText,
          fileBase64,
          mimeType
        })
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

      setDocData({
        referenceNumber: data.referenceNumber || `RBI/${applicationType.toUpperCase().slice(0, 3)}-2026-${Math.floor(100 + Math.random() * 900)}`,
        date: data.date || new Date().toISOString().split('T')[0],
        applicationType,
        recipientTitle: data.recipientTitle || 'To Whom It May Concern',
        recipientOrganization: data.recipientOrganization || recipientOrganization,
        recipientAddress: data.recipientAddress || recipientAddress,
        subject: data.subject || 'Official Corporate Application',
        salutation: data.salutation || 'Dear Sir / Madam,',
        paragraphs: Array.isArray(data.paragraphs) && data.paragraphs.length > 0 ? data.paragraphs : [data.letterBody || ''],
        closing: data.closing || 'Yours faithfully,',
        signatoryName: data.signatoryName || 'Managing Director',
        signatoryDesignation: data.signatoryDesignation || 'RED BIRD INTERNATIONAL',
        enclosures: data.enclosures || [],
        verificationCode: data.verificationCode || `VER-RBI-${Date.now().toString().slice(-6)}`,
        promptUsed: prompt
      });

      // Clear input fields and notify
      setIsEditing(false);
    } catch (err: any) {
      console.error("Application drafting failed:", err);
      alert(`Notice: Application drafting encountered an issue: ${err.message}. Defaulting to template.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToFirestore = async () => {
    if (!db) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const docRef = await addDoc(collection(db, 'official_applications'), {
        ...docData,
        createdAt: serverTimestamp(),
        lastUpdated: new Date().toISOString()
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadHistory();
    } catch (e: any) {
      console.error("Save application error:", e);
      alert("Failed to save to database. Please check permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!documentPrintRef.current) return;
    try {
      const element = documentPrintRef.current;
      const canvas = await html2canvas(element, {
        scale: 2.2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      const sanitizedSubject = (docData.subject || 'Application').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      pdf.save(`RBI_Application_${sanitizedSubject}_${docData.date}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
      window.print();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const applyPreset = (presetKey: 'korea-visa' | 'bank-lc' | 'customs-ctg' | 'bgmea-exp') => {
    if (presetKey === 'korea-visa') {
      setApplicationType('embassy');
      setRecipientOrganization('Embassy of the Republic of Korea in Bangladesh');
      setRecipientAddress('4 Madani Avenue, Diplomatic Zone, Baridhara, Dhaka-1212, Bangladesh');
      setApplicantName('Md. Sumon');
      setDesignation('Director of Operations & International Merchandising');
      setPassportNo('A09876543');
      setPrompt('দক্ষিণ কোরিয়া এম্বাসিতে সুমন ভাইয়ের ৭ দিনের বিজনেস ট্রিপের ভিজিট ভিসা রিকমেন্ডেশন লেটার লাগবে, হানহোয়া কোম্পানির সাথে মিটিং ও নতুন অর্ডার চূড়ান্তকরণের জন্য');
    } else if (presetKey === 'bank-lc') {
      setApplicationType('bank');
      setRecipientOrganization('Standard Chartered Bank / City Bank PLC');
      setRecipientAddress('Head of Trade Operations, Gulshan-2 Branch, Dhaka');
      setPrompt('ব্যাংক এল/সি অ্যামেন্ডমেন্ট ও চট্টগ্রাম পোর্টে শিপমেন্টের জন্য বাংলাদেশ ব্যাংক EXP ফরম এন্ডোর্সমেন্ট অ্যাপ্লিকেশন');
    } else if (presetKey === 'customs-ctg') {
      setApplicationType('customs');
      setRecipientOrganization('The Commissioner of Customs, Custom House');
      setRecipientAddress('Chittagong Port, Chittagong-4100, Bangladesh');
      setPrompt('চট্টগ্রাম কাস্টমস হাউজে গার্মেন্টস কনটেইনার দ্রুত এসেসমেন্ট ও অন-বোর্ড এক্সপোর্ট ক্লিয়ারেন্স পারমিশন লেটার');
    } else if (presetKey === 'bgmea-exp') {
      setApplicationType('bgmea');
      setRecipientOrganization('Bangladesh Garment Manufacturers and Exporters Association (BGMEA)');
      setRecipientAddress('BGMEA Complex, Sector-17, Uttara, Dhaka-1230, Bangladesh');
      setPrompt('বিজিএমইএ থেকে ইউটিলাইজেশন ডিক্লারেশন (UD) ও ডিউটি ড্রব্যাক এক্সপোর্ট পারমিশন অ্যাপ্লিকেশন');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 rounded-[2.5rem] text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
              AI Diplomatic Drafter • Gemini 3.8 Flash
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              Official Letterhead Generator
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Official Application & Embassy/Bank Letter Generator
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium">
            বাংলা বা ইংরেজিতে আপনার প্রয়োজনীয় বিষয়টি লিখুন অথবা আগের ড্রাফট আপলোড করুন—রেড বার্ড ইন্টারন্যাশনাল-এর অফিশিয়াল সিকিউরিটি লেটারহেডে স্বয়ংক্রিয়ভাবে আবেদনপত্র তৈরি হয়ে যাবে।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-600/30 cursor-pointer active:scale-95"
          >
            <Download size={15} />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-all border border-slate-700 cursor-pointer active:scale-95"
          >
            <Printer size={15} />
            <span>Print A4</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToFirestore}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <CheckCircle2 size={15} />
            <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Letter'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls & Right Document Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Left Control Panel (5 Cols) */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* Quick Presets Carousel */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Quick Application Presets (দ্রুত শুরু করুন):
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('korea-visa')}
                className="p-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-900 border border-red-200 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">🏛️</span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-red-200 text-red-800 px-1.5 py-0.5 rounded">Embassy</span>
                </div>
                <div className="text-xs font-black text-slate-900 group-hover:text-red-600">Korea Embassy Visa</div>
                <div className="text-[10px] text-slate-500">Business Visa & Sponsor Guarantee</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('bank-lc')}
                className="p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">🏦</span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded">Banking</span>
                </div>
                <div className="text-xs font-black text-slate-900 group-hover:text-blue-600">Bank L/C & EXP</div>
                <div className="text-[10px] text-slate-500">Amendment & Document Remittance</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('customs-ctg')}
                className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">🚢</span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">Port</span>
                </div>
                <div className="text-xs font-black text-slate-900 group-hover:text-amber-600">Chittagong Customs</div>
                <div className="text-[10px] text-slate-500">EXP Assessment & Duty Clearance</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('bgmea-exp')}
                className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">📜</span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">RMG</span>
                </div>
                <div className="text-xs font-black text-slate-900 group-hover:text-emerald-600">BGMEA UD Exemption</div>
                <div className="text-[10px] text-slate-500">Export Exemption & Sub-contract</div>
              </button>
            </div>
          </div>

          {/* Input Method Tabs */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTab('prompt')}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === 'prompt' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                💬 Write / Chat Brief
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📎 Upload Draft/Format
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📂 History ({historyList.length})
              </button>
            </div>

            {/* TAB 1: Chat / Prompt Input */}
            {activeTab === 'prompt' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Application Type:
                  </label>
                  <select
                    value={applicationType}
                    onChange={(e) => setApplicationType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="embassy">Foreign Embassy / Business Visa Support</option>
                    <option value="bank">Commercial Bank / Foreign Exchange & L/C</option>
                    <option value="customs">Customs & Chittagong Port Authority</option>
                    <option value="bgmea">BGMEA / Ministry of Commerce / Export Permit</option>
                    <option value="buyer">Overseas Buyer / Consignee Formal Representation</option>
                    <option value="general">General Corporate Official Application</option>
                  </select>
                </div>

                {applicationType === 'embassy' && (
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block">Applicant Name</label>
                      <input
                        type="text"
                        value={applicantName}
                        onChange={e => setApplicantName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                        placeholder="e.g. Md. Sumon"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block">Passport Number</label>
                      <input
                        type="text"
                        value={passportNo}
                        onChange={e => setPassportNo(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 uppercase font-mono"
                        placeholder="e.g. A09876543"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    What should this application say? (আপনার বিষয়বস্তু লিখুন):
                  </label>
                  <textarea
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="যেমন: দক্ষিণ কোরিয়া এম্বাসিতে সুমন ভাইয়ের ৭ দিনের বিজনেস ট্রিপের ভিসা রেকমেন্ডেশন লেটার, হানহোয়া ট্রেডিং এর সাথে মিটিং ও বায়ার অর্ডার সংক্রান্ত..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-900 focus:bg-white focus:border-red-500 outline-none transition-all"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isGenerating || (!prompt.trim() && !applicantName)}
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Drafting with Gemini 3.8 Flash...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span>Generate Official Application Letter</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 2: Upload Format / Document */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-red-500 bg-slate-50/70 hover:bg-red-50/30 transition-all rounded-3xl p-6 text-center cursor-pointer flex flex-col items-center justify-center space-y-2 group"
                >
                  <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-all border border-slate-200">
                    <Upload className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">
                      {uploadedFile ? uploadedFile.name : 'Upload sample application or embassy format'}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      PDF, JPG, PNG (AI will adapt content to Red Bird Letterhead)
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Or paste draft text from email or file:
                  </label>
                  <textarea
                    rows={4}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste application text or reference notes here..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-mono text-slate-800 focus:bg-white focus:border-red-500 outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isGenerating || (!uploadedFile && !rawText.trim())}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing Format & Adapting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span>Format on Official Red Bird Letterhead</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 3: History List */}
            {activeTab === 'history' && (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {historyList.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No past applications stored in database yet.</p>
                ) : (
                  historyList.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => setDocData(item)}
                      className="p-3 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-2xl cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-black font-mono text-red-600 block">{item.referenceNumber}</span>
                        <h5 className="text-xs font-black text-slate-900 truncate max-w-xs">{item.subject}</h5>
                        <span className="text-[10px] text-slate-400">{item.date} • {item.recipientOrganization}</span>
                      </div>
                      <ChevronRight size={16} className="text-slate-400" />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Quick Edit Toggle */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-slate-900 block">Edit Live Letter Content</span>
              <span className="text-[10px] text-slate-500">Fine-tune recipient address, passport number, or clauses</span>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isEditing ? 'bg-red-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {isEditing ? 'Done Editing' : 'Edit Text'}
            </button>
          </div>

          {/* Inline Editor if enabled */}
          {isEditing && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 animate-fade-in">
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block">Reference Number</label>
                <input
                  type="text"
                  value={docData.referenceNumber}
                  onChange={e => setDocData({ ...docData, referenceNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block">Subject Line</label>
                <input
                  type="text"
                  value={docData.subject}
                  onChange={e => setDocData({ ...docData, subject: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block">Recipient Organization</label>
                <input
                  type="text"
                  value={docData.recipientOrganization}
                  onChange={e => setDocData({ ...docData, recipientOrganization: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block">Recipient Address</label>
                <input
                  type="text"
                  value={docData.recipientAddress}
                  onChange={e => setDocData({ ...docData, recipientAddress: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                />
              </div>
            </div>
          )}

        </div>

        {/* Right Printable Official Letterhead Preview (7 Cols) */}
        <div className="xl:col-span-7 flex flex-col items-center">
          
          <div className="w-full flex items-center justify-between mb-3 px-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Eye size={14} className="text-red-600" />
              <span>A4 Official Letterhead Live Preview</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Sovereign Watermark Protected
            </span>
          </div>

          {/* Printable A4 Container */}
          <div 
            ref={documentPrintRef}
            className="w-full max-w-[794px] min-h-[1123px] bg-white rounded-2xl shadow-2xl p-8 sm:p-12 text-slate-900 border border-slate-200 flex flex-col justify-between font-sans relative overflow-hidden print:shadow-none print:m-0 print:border-none print:w-full"
            style={{
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact'
            }}
          >
            {/* =========================================================================
                1. REPEATING LOW-OPACITY 'RED BIRD INTERNATIONAL' BACKGROUND WATERMARK
               ========================================================================= */}
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

            {/* =========================================================================
                2. OFFICIAL CORPORATE LETTERHEAD HEADER
               ========================================================================= */}
            <div className="relative z-10 border-b-2 border-slate-900 pb-5 space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-md">
                    R
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                      RED BIRD INTERNATIONAL
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-600">
                      100% Export-Oriented Apparel Manufacturing & International Merchandising
                    </p>
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-600 font-medium leading-relaxed">
                  <p className="font-bold text-slate-900">Corporate HQ & Factory:</p>
                  <p>Plot-100, Majar Chow Road, Uttarkhan</p>
                  <p>Dhaka-1230, Bangladesh</p>
                  <p>Email: export@redbird-international.com</p>
                </div>
              </div>

              {/* Security Header Band */}
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-500 pt-2 border-t border-slate-100">
                <span>Govt. Reg. Trade License: 04-89102</span>
                <span>ERC No: 260324110091</span>
                <span>BGMEA Memb. #2026-R</span>
                <span>Bangladesh Bank EXP Auth</span>
              </div>
            </div>

            {/* =========================================================================
                3. LETTER METADATA & RECIPIENT
               ========================================================================= */}
            <div className="relative z-10 my-6 space-y-4 text-xs sm:text-sm text-slate-900">
              <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Reference No:</span>
                  <span className="font-mono font-bold text-slate-900">{docData.referenceNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Date of Issue:</span>
                  <span className="font-bold text-slate-900">
                    {new Date(docData.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-slate-900">{docData.recipientTitle}</p>
                <p className="font-black text-slate-900">{docData.recipientOrganization}</p>
                <p className="text-slate-600 text-xs">{docData.recipientAddress}</p>
              </div>

              {/* Subject */}
              <div className="py-2.5 px-4 bg-slate-50 border-l-4 border-red-600 text-slate-900 rounded-r-xl">
                <span className="font-black text-xs sm:text-sm uppercase tracking-tight">
                  SUBJECT: {docData.subject}
                </span>
              </div>

              <p className="font-bold text-slate-900 pt-1">{docData.salutation}</p>

              {/* =========================================================================
                  4. LETTER BODY PARAGRAPHS
                 ========================================================================= */}
              <div className="space-y-3.5 text-xs sm:text-sm leading-relaxed text-slate-800 text-justify">
                {docData.paragraphs.map((p, idx) => (
                  <p key={idx} className="indent-6">
                    {p}
                  </p>
                ))}
              </div>

              {/* Enclosures List */}
              {docData.enclosures && docData.enclosures.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Attached Enclosures / Supporting Documents:
                  </span>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-700">
                    {docData.enclosures.map((enc, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></span>
                        <span className="truncate">{enc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* =========================================================================
                5. SIGNATURE & VERIFICATION SEAL FOOTER
               ========================================================================= */}
            <div className="relative z-10 pt-6 border-t-2 border-slate-900 flex justify-between items-end">
              
              {/* QR Verification Seal */}
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <QRCodeSVG 
                    value={`https://redbird-international.com/#verify?id=${encodeURIComponent(docData.referenceNumber)}`}
                    size={64}
                    level="M"
                  />
                </div>
                <div className="text-[9px] text-slate-500 font-mono">
                  <p className="font-black text-slate-900 uppercase">OFFICIAL REGISTRATION</p>
                  <p>Ref: {docData.referenceNumber}</p>
                  <p>Code: {docData.verificationCode}</p>
                  <p className="text-emerald-700 font-bold">Authenticated & Sealed</p>
                </div>
              </div>

              {/* Corporate Authority Signature Block */}
              <div className="text-right space-y-1">
                <p className="text-xs font-bold text-slate-600">{docData.closing}</p>
                <div className="pt-6 relative inline-block">
                  {/* Digital Signature representation */}
                  <div className="text-red-700 font-serif italic text-lg tracking-wider font-bold mb-1 select-none">
                    Red Bird International
                  </div>
                  <div className="w-48 h-px bg-slate-900 ml-auto"></div>
                </div>
                <p className="font-black text-xs uppercase text-slate-900">{docData.signatoryName}</p>
                <p className="text-[10px] font-bold text-slate-600">{docData.signatoryDesignation}</p>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
