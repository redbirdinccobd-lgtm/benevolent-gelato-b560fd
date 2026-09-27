import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Save, 
  Settings2, 
  RotateCcw, 
  FileText, 
  Sliders, 
  Eye, 
  CheckCircle2, 
  Upload, 
  Sparkles,
  Maximize2,
  Ruler,
  Palette,
  Building2,
  Layers,
  ShieldCheck,
  Award,
  PenTool,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../src/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface LetterheadConfig {
  companyName: string;
  tagline: string;
  binVatNumber: string;
  officeAddress: string;
  factoryAddress: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
  sealUrl: string;
  signatureUrl: string;
  authorityName: string;
  authorityTitle: string;

  // Paper & Margins (Size by Size)
  paperSizePreset: 'A4' | 'Letter' | 'Legal' | 'Custom';
  paperWidthMm: number;
  paperHeightMm: number;
  marginTopMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  headerHeightMm: number;
  footerHeightMm: number;

  // Typography & Layout
  layoutStyle: 'classic' | 'centered' | 'modern-bar' | 'navy-corporate' | 'executive-border';
  primaryColor: string;
  secondaryColor: string;
  titleFontSizePt: number;
  taglineFontSizePt: number;
  addressFontSizePt: number;

  // Watermark & Anti-Counterfeit Security
  watermarkText: string;
  watermarkOpacity: number; // 0 to 1
  watermarkAngle: number;
  enableSecurityPattern: boolean;

  // Size by Size Table Specs Visibility
  enabledSizes: {
    XS: boolean;
    S: boolean;
    M: boolean;
    L: boolean;
    XL: boolean;
    '2XL': boolean;
    '3XL': boolean;
    CartonInfo: boolean;
    Weights: boolean;
  };
}

export const defaultLetterheadConfig: LetterheadConfig = {
  companyName: 'RED BIRD INTERNATIONAL',
  tagline: 'PREMIER APPAREL MANUFACTURING & INTERNATIONAL TRADE COMMAND',
  binVatNumber: 'BIN: 002910394-0102 / Trade Reg: TR-DHK-88912',
  officeAddress: 'PLOT-100, MAJAR CHOW ROAD, UTTARKHAN MAJHAR, UTTARKHAN, DHAKA-1230, BANGLADESH',
  factoryAddress: 'Unit-2 Industrial Zone, Gazipur RMG Complex, Dhaka, Bangladesh',
  phone: 'Office: +880 9658 182256 | WhatsApp: +880 1966 635888',
  email: 'info@redbird-international.com',
  website: 'www.redbird-international.com',
  logoUrl: '',
  sealUrl: '',
  signatureUrl: '',
  authorityName: 'Md. Sumon',
  authorityTitle: 'Operations Director & Authorized Signatory',

  paperSizePreset: 'A4',
  paperWidthMm: 210,
  paperHeightMm: 297,
  marginTopMm: 25,
  marginBottomMm: 20,
  marginLeftMm: 20,
  marginRightMm: 20,
  headerHeightMm: 35,
  footerHeightMm: 20,

  layoutStyle: 'centered',
  primaryColor: '#c00000', // Crimson Red
  secondaryColor: '#0f172a', // Slate 900
  titleFontSizePt: 20,
  taglineFontSizePt: 9,
  addressFontSizePt: 8,

  watermarkText: 'RED BIRD INTERNATIONAL',
  watermarkOpacity: 0.055,
  watermarkAngle: -35,
  enableSecurityPattern: true,

  enabledSizes: {
    XS: true,
    S: true,
    M: true,
    L: true,
    XL: true,
    '2XL': true,
    '3XL': true,
    CartonInfo: true,
    Weights: true
  }
};

export const LetterheadSettings: React.FC = () => {
  const [config, setConfig] = useState<LetterheadConfig>(defaultLetterheadConfig);
  const [activeTab, setActiveTab] = useState<'branding' | 'media' | 'dimensions' | 'layout' | 'sizes'>('branding');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load configuration from Firestore / LocalStorage
  useEffect(() => {
    const loadSettings = async () => {
      const local = localStorage.getItem('redbird_letterhead_settings');
      if (local) {
        try {
          setConfig(JSON.parse(local));
        } catch (e) {
          console.error(e);
        }
      }

      if (db) {
        try {
          const docRef = doc(db, 'settings', 'letterhead');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as LetterheadConfig;
            setConfig(data);
            localStorage.setItem('redbird_letterhead_settings', JSON.stringify(data));
          }
        } catch (err) {
          console.error("Firestore settings error:", err);
        }
      }
    };
    loadSettings();
  }, []);

  // Helper for file uploads -> Data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'sealUrl' | 'signatureUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setConfig(prev => ({ ...prev, [field]: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Update paper dimensions preset
  const handlePaperPresetChange = (preset: 'A4' | 'Letter' | 'Legal' | 'Custom') => {
    let width = config.paperWidthMm;
    let height = config.paperHeightMm;
    if (preset === 'A4') {
      width = 210;
      height = 297;
    } else if (preset === 'Letter') {
      width = 215.9;
      height = 279.4;
    } else if (preset === 'Legal') {
      width = 215.9;
      height = 355.6;
    }
    setConfig(prev => ({
      ...prev,
      paperSizePreset: preset,
      paperWidthMm: width,
      paperHeightMm: height
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      localStorage.setItem('redbird_letterhead_settings', JSON.stringify(config));
      if (db) {
        await setDoc(doc(db, 'settings', 'letterhead'), config);
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/letterhead');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-red-500 shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Official Letterhead & Brand Settings</h2>
              <p className="text-slate-500 text-xs font-medium mt-0.5">Customize company branding, upload logos, authority signatures & seals with anti-counterfeiting security watermarks.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setConfig(defaultLetterheadConfig)}
            className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-slate-50 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Reset Defaults
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-red-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Letterhead Settings Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Letterhead Template'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Controls vs Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Controls Column */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Sub Navigation */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('branding')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${activeTab === 'branding' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Building2 className="w-3.5 h-3.5" /> Company Details
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${activeTab === 'media' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-red-600" /> Logo, Seal & Signature
            </button>
            <button
              onClick={() => setActiveTab('dimensions')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${activeTab === 'dimensions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Ruler className="w-3.5 h-3.5" /> Page Dimensions
            </button>
            <button
              onClick={() => setActiveTab('layout')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${activeTab === 'layout' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Palette className="w-3.5 h-3.5" /> Style & Security
            </button>
          </div>

          {/* TAB 1: BRANDING & COMPANY DETAILS */}
          {activeTab === 'branding' && (
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Building2 className="w-5 h-5 text-red-600" /> Company Contact & Legal Metadata
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Company Legal Name</label>
                  <input
                    type="text"
                    value={config.companyName}
                    onChange={e => setConfig({ ...config, companyName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/20"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Tagline / Corporate Motto</label>
                  <input
                    type="text"
                    value={config.tagline}
                    onChange={e => setConfig({ ...config, tagline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-medium text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-red-600/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">BIN / VAT / Export License #</label>
                    <input
                      type="text"
                      value={config.binVatNumber}
                      onChange={e => setConfig({ ...config, binVatNumber: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-red-600/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Hotline / Contact Phone</label>
                    <input
                      type="text"
                      value={config.phone}
                      onChange={e => setConfig({ ...config, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-red-600/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Head Office Address</label>
                  <textarea
                    rows={2}
                    value={config.officeAddress}
                    onChange={e => setConfig({ ...config, officeAddress: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-red-600/20"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Factory / Processing Unit Address</label>
                  <textarea
                    rows={2}
                    value={config.factoryAddress}
                    onChange={e => setConfig({ ...config, factoryAddress: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-red-600/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Official Email Address</label>
                    <input
                      type="text"
                      value={config.email}
                      onChange={e => setConfig({ ...config, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-red-600/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Website Domain</label>
                    <input
                      type="text"
                      value={config.website}
                      onChange={e => setConfig({ ...config, website: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-red-600/20"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEDIA UPLOADS (LOGO, SEAL & SIGNATURE) */}
          {activeTab === 'media' && (
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-red-600" /> Upload Official Branding Media
              </h3>

              {/* 1. LOGO UPLOAD */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                      <Award className="w-4 h-4 text-red-600" /> Company Logo Image
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Recommended: PNG with transparent background.</p>
                  </div>
                  {config.logoUrl && (
                    <button
                      onClick={() => setConfig({ ...config, logoUrl: '' })}
                      className="text-red-600 text-[10px] font-bold hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove Logo
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {config.logoUrl ? (
                    <div className="w-20 h-20 bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-center shadow-sm">
                      <img src={config.logoUrl} alt="Company Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-slate-200/60 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xs">
                      No Logo
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <label className="bg-slate-900 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer transition-all shadow-md">
                      <Upload className="w-4 h-4" /> Choose Logo Image...
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleFileUpload(e, 'logoUrl')}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      placeholder="Or paste image URL (https://...)"
                      value={config.logoUrl}
                      onChange={e => setConfig({ ...config, logoUrl: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* 2. OFFICIAL SEAL / STAMP UPLOAD */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-red-600" /> Official Stamp / Seal
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Circular or rectangular official authorization stamp image.</p>
                  </div>
                  {config.sealUrl && (
                    <button
                      onClick={() => setConfig({ ...config, sealUrl: '' })}
                      className="text-red-600 text-[10px] font-bold hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove Stamp
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {config.sealUrl ? (
                    <div className="w-20 h-20 bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-center shadow-sm">
                      <img src={config.sealUrl} alt="Official Seal" className="max-w-full max-h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-slate-200/60 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xs">
                      No Seal
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <label className="bg-slate-900 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer transition-all shadow-md">
                      <Upload className="w-4 h-4" /> Upload Authority Seal Image...
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleFileUpload(e, 'sealUrl')}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      placeholder="Or paste image URL (https://...)"
                      value={config.sealUrl}
                      onChange={e => setConfig({ ...config, sealUrl: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* 3. AUTHORITY SIGNATURE UPLOAD */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-red-600" /> Authority Signature Image
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Scanned signature overlay of Managing Director / Authorized Signatory.</p>
                  </div>
                  {config.signatureUrl && (
                    <button
                      onClick={() => setConfig({ ...config, signatureUrl: '' })}
                      className="text-red-600 text-[10px] font-bold hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove Signature
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {config.signatureUrl ? (
                    <div className="w-20 h-20 bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-center shadow-sm">
                      <img src={config.signatureUrl} alt="Authority Signature" className="max-w-full max-h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-slate-200/60 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xs">
                      No Signature
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <label className="bg-slate-900 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer transition-all shadow-md">
                      <Upload className="w-4 h-4" /> Upload Authority Signature...
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleFileUpload(e, 'signatureUrl')}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      placeholder="Or paste image URL (https://...)"
                      value={config.signatureUrl}
                      onChange={e => setConfig({ ...config, signatureUrl: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Signatory Name</label>
                    <input
                      type="text"
                      value={config.authorityName}
                      onChange={e => setConfig({ ...config, authorityName: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Signatory Title</label>
                    <input
                      type="text"
                      value={config.authorityTitle}
                      onChange={e => setConfig({ ...config, authorityTitle: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DIMENSIONS & MARGINS */}
          {activeTab === 'dimensions' && (
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Ruler className="w-5 h-5 text-red-600" /> Standardized Paper Dimensions & Margins
              </h3>

              {/* Preset selector */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Paper Format Preset</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['A4', 'Letter', 'Legal', 'Custom'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => handlePaperPresetChange(p)}
                      className={`py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${config.paperSizePreset === p ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Width & Height */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Paper Width (mm)</label>
                  <input
                    type="number"
                    value={config.paperWidthMm}
                    onChange={e => setConfig({ ...config, paperWidthMm: Number(e.target.value), paperSizePreset: 'Custom' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-900 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Paper Height (mm)</label>
                  <input
                    type="number"
                    value={config.paperHeightMm}
                    onChange={e => setConfig({ ...config, paperHeightMm: Number(e.target.value), paperSizePreset: 'Custom' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-900 text-sm"
                  />
                </div>
              </div>

              {/* Margins */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Margin Controls (Exact Size in mm)</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Top Margin ({config.marginTopMm} mm)</label>
                    <input
                      type="range"
                      min={10}
                      max={60}
                      value={config.marginTopMm}
                      onChange={e => setConfig({ ...config, marginTopMm: Number(e.target.value) })}
                      className="w-full accent-red-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Bottom Margin ({config.marginBottomMm} mm)</label>
                    <input
                      type="range"
                      min={10}
                      max={60}
                      value={config.marginBottomMm}
                      onChange={e => setConfig({ ...config, marginBottomMm: Number(e.target.value) })}
                      className="w-full accent-red-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Left Margin ({config.marginLeftMm} mm)</label>
                    <input
                      type="range"
                      min={10}
                      max={50}
                      value={config.marginLeftMm}
                      onChange={e => setConfig({ ...config, marginLeftMm: Number(e.target.value) })}
                      className="w-full accent-red-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Right Margin ({config.marginRightMm} mm)</label>
                    <input
                      type="range"
                      min={10}
                      max={50}
                      value={config.marginRightMm}
                      onChange={e => setConfig({ ...config, marginRightMm: Number(e.target.value) })}
                      className="w-full accent-red-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LAYOUT & SECURITY WATERMARK */}
          {activeTab === 'layout' && (
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Palette className="w-5 h-5 text-red-600" /> Unique Design Style & Anti-Counterfeiting Watermark
              </h3>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Unique Header Design Architecture</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'modern-bar', label: 'Modern Red Bird Bar', desc: 'Bold red accent header with emblem' },
                    { id: 'classic', label: 'Classic Dual-Column', desc: 'Left logo & name, right details' },
                    { id: 'centered', label: 'Centered Crest', desc: 'Centered logo & header stack' },
                    { id: 'navy-corporate', label: 'Navy Corporate Block', desc: 'Dark solid header band' },
                    { id: 'executive-border', label: 'Executive Gold/Red Frame', desc: 'Outer security micro-border' }
                  ].map(style => (
                    <button
                      key={style.id}
                      onClick={() => setConfig({ ...config, layoutStyle: style.id as any })}
                      className={`p-4 rounded-2xl text-left transition-all border ${config.layoutStyle === style.id ? 'bg-red-50/50 border-red-600 ring-2 ring-red-600/20' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <p className="text-xs font-black text-slate-900 uppercase">{style.label}</p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">{style.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Watermark Security Settings */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-red-600" /> Full-Page Security Watermark
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enableSecurityPattern}
                      onChange={e => setConfig({ ...config, enableSecurityPattern: e.target.checked })}
                      className="accent-red-600 w-4 h-4"
                    />
                    <span className="text-[10px] font-black uppercase text-slate-600">Anti-Copy Grid</span>
                  </label>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Security Watermark Text (কোম্পানির নাম)</label>
                    <span className="text-[9px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      Anti-Counterfeit Micro-Text
                    </span>
                  </div>
                  <input
                    type="text"
                    value={config.watermarkText}
                    onChange={e => setConfig({ ...config, watermarkText: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-black text-slate-900 text-xs"
                    placeholder="e.g. RED BIRD INTERNATIONAL"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      'RED BIRD INTERNATIONAL',
                      'রেড বার্ড ইন্টারন্যাশনাল',
                      'RED BIRD INTERNATIONAL • SECURITY VERIFIED',
                      'RED BIRD INTERNATIONAL • DHAKA BANGLADESH'
                    ].map((txt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setConfig({ ...config, watermarkText: txt })}
                        className={`text-[9.5px] px-2.5 py-1 rounded-lg font-bold border transition-colors ${
                          config.watermarkText === txt
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {txt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Opacity ({Math.round(config.watermarkOpacity * 100)}%)</label>
                    <input
                      type="range"
                      min={0.02}
                      max={0.25}
                      step={0.01}
                      value={config.watermarkOpacity}
                      onChange={e => setConfig({ ...config, watermarkOpacity: Number(e.target.value) })}
                      className="w-full accent-red-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Angle ({config.watermarkAngle}°)</label>
                    <input
                      type="range"
                      min={-60}
                      max={60}
                      value={config.watermarkAngle}
                      onChange={e => setConfig({ ...config, watermarkAngle: Number(e.target.value) })}
                      className="w-full accent-red-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4 text-red-600" /> Live Letterhead Preview ({config.paperSizePreset} - {config.paperWidthMm} x {config.paperHeightMm} mm)
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              Real-time Scaled Rendering
            </span>
          </div>

          {/* Letterhead Paper Frame */}
          <div className="bg-slate-200 p-6 rounded-3xl flex justify-center shadow-inner overflow-x-auto">
            <div 
              className={`bg-white shadow-2xl relative transition-all duration-300 font-sans text-slate-900 overflow-hidden flex flex-col justify-between ${config.layoutStyle === 'executive-border' ? 'border-4 border-double border-red-600' : ''}`}
              style={{
                width: '460px',
                minHeight: '640px',
                paddingTop: `${config.marginTopMm * 1.2}px`,
                paddingBottom: `${config.marginBottomMm * 1.2}px`,
                paddingLeft: `${config.marginLeftMm * 1.2}px`,
                paddingRight: `${config.marginRightMm * 1.2}px`,
              }}
            >
              {/* Security Background Micro-Grid Pattern */}
              {config.enableSecurityPattern && (
                <div 
                  className="absolute inset-0 pointer-events-none opacity-5 z-0"
                  style={{
                    backgroundImage: `radial-gradient(${config.primaryColor} 0.75px, transparent 0.75px)`,
                    backgroundSize: '12px 12px'
                  }}
                />
              )}

              {/* Repeating Low-Opacity 'Red Bird International' Security Watermark */}
              <div 
                className="absolute inset-0 flex flex-col justify-around pointer-events-none select-none z-0 py-2 overflow-hidden"
                style={{
                  opacity: config.watermarkOpacity,
                  transform: `rotate(${config.watermarkAngle}deg) scale(1.4)`,
                  transformOrigin: 'center center'
                }}
              >
                {Array.from({ length: 22 }).map((_, rIdx) => (
                  <div 
                    key={rIdx} 
                    className="whitespace-nowrap uppercase tracking-[0.28em] font-mono font-black text-slate-900 select-none"
                    style={{
                      fontSize: '8px',
                      marginLeft: `${(rIdx % 2 === 0 ? 0 : -50)}px`
                    }}
                  >
                    {`${config.watermarkText || 'RED BIRD INTERNATIONAL'}   •   ${config.watermarkText || 'RED BIRD INTERNATIONAL'}   •   `.repeat(3)}
                  </div>
                ))}
              </div>

              {/* Central Sovereign Emblem Seal */}
              <div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
                style={{
                  opacity: config.watermarkOpacity * 1.3,
                  transform: `rotate(${config.watermarkAngle}deg)`
                }}
              >
                <div className="w-36 h-36 rounded-full border border-dashed border-slate-900 flex flex-col items-center justify-center p-2 text-center">
                  <span className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-800">
                    RED BIRD INTERNATIONAL
                  </span>
                  <span className="text-xl font-black text-slate-900 tracking-[0.15em] my-0.5">
                    RBI
                  </span>
                  <span className="text-[6px] font-bold uppercase tracking-widest text-slate-600">
                    DHAKA BANGLADESH
                  </span>
                </div>
              </div>

              {/* Letterhead Header Section */}
              <div className="relative z-10 border-b pb-3" style={{ borderColor: config.primaryColor }}>
                {config.layoutStyle === 'modern-bar' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {config.logoUrl ? (
                          <img src={config.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
                        ) : (
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs"
                            style={{ backgroundColor: config.primaryColor }}
                          >
                            RB
                          </div>
                        )}
                        <div>
                          <h2 
                            className="font-black uppercase tracking-tight text-slate-900 leading-none"
                            style={{ fontSize: `${config.titleFontSizePt * 0.65}px` }}
                          >
                            {config.companyName}
                          </h2>
                          <p 
                            className="font-black uppercase tracking-widest mt-1"
                            style={{ color: config.primaryColor, fontSize: `${config.taglineFontSizePt * 0.65}px` }}
                          >
                            {config.tagline}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[7px] font-mono px-2 py-0.5 rounded bg-red-50 text-red-600 font-bold block border border-red-100">
                          {config.binVatNumber}
                        </span>
                      </div>
                    </div>

                    <div className="text-[7px] text-slate-500 font-medium pt-1 border-t border-slate-100 flex justify-between">
                      <span>HQ: {config.officeAddress}</span>
                      <span>Ph: {config.phone}</span>
                    </div>
                  </div>
                )}

                {config.layoutStyle === 'classic' && (
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      {config.logoUrl && <img src={config.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />}
                      <div>
                        <h2 className="font-black text-slate-900 uppercase text-xs leading-none" style={{ color: config.secondaryColor }}>
                          {config.companyName}
                        </h2>
                        <p className="text-[8px] font-bold uppercase mt-1" style={{ color: config.primaryColor }}>
                          {config.tagline}
                        </p>
                        <p className="text-[7px] text-slate-500 mt-1">{config.officeAddress}</p>
                      </div>
                    </div>
                    <div className="text-right text-[7px] text-slate-500">
                      <p className="font-bold text-slate-900">{config.phone}</p>
                      <p>{config.email}</p>
                      <p>{config.website}</p>
                    </div>
                  </div>
                )}

                {config.layoutStyle === 'centered' && (
                  <div className="text-center space-y-1">
                    {config.logoUrl && <img src={config.logoUrl} alt="Logo" className="w-10 h-10 object-contain mx-auto mb-1" />}
                    <h2 className="font-black text-slate-900 text-xs uppercase tracking-wider">{config.companyName}</h2>
                    <p className="text-[8px] font-black uppercase text-red-600">{config.tagline}</p>
                    <p className="text-[7px] text-slate-500">{config.officeAddress} | {config.phone}</p>
                  </div>
                )}

                {config.layoutStyle === 'navy-corporate' && (
                  <div className="-mx-4 -mt-4 p-3 text-white mb-2" style={{ backgroundColor: config.secondaryColor }}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {config.logoUrl && <img src={config.logoUrl} alt="Logo" className="w-6 h-6 object-contain" />}
                        <h2 className="font-black text-xs uppercase tracking-wider">{config.companyName}</h2>
                      </div>
                      <span className="text-[7px] font-mono text-red-400">{config.binVatNumber}</span>
                    </div>
                    <p className="text-[7px] font-medium text-slate-300 mt-0.5">{config.tagline}</p>
                  </div>
                )}

                {config.layoutStyle === 'executive-border' && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {config.logoUrl ? (
                        <img src={config.logoUrl} alt="Logo" className="w-9 h-9 object-contain" />
                      ) : (
                        <div className="w-8 h-8 bg-red-600 text-white font-black text-xs flex items-center justify-center rounded">RB</div>
                      )}
                      <div>
                        <h2 className="font-black text-xs text-slate-900 uppercase">{config.companyName}</h2>
                        <p className="text-[8px] font-bold text-red-600 uppercase">{config.tagline}</p>
                      </div>
                    </div>
                    <div className="text-right text-[7px] font-mono text-slate-500">
                      <p className="font-bold text-slate-900">{config.binVatNumber}</p>
                      <p>{config.phone}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sample Document Body */}
              <div className="relative z-10 py-4 space-y-3 flex-1">
                <div className="flex justify-between items-center text-[8px] border-b pb-2 border-slate-100">
                  <div>
                    <span className="font-black text-slate-400 uppercase">OFFICIAL EXPORT SPECIFICATION</span>
                    <p className="font-bold text-slate-900">REF: RBI-LETTERHEAD-SPEC-2026</p>
                  </div>
                  <div className="text-right font-mono text-slate-500">
                    Date: {new Date().toLocaleDateString()}
                  </div>
                </div>

                <p className="text-[8.5px] text-slate-600 leading-relaxed font-medium">
                  This document serves as the official standardized letterhead layout for Red Bird International. All commercial invoices, size-by-size packing matrices, and export offer sheets will be dynamically formatted with these exact margins and company details.
                </p>

                {/* Size-by-size Matrix Table Preview */}
                <div className="border border-slate-200 rounded-lg overflow-hidden text-[7px]">
                  <div className="bg-slate-100 p-1.5 font-black uppercase text-slate-800 flex justify-between">
                    <span>Garment Size Breakdown Matrix</span>
                    <span className="text-red-600 font-mono">100% Cotton Polo</span>
                  </div>
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500">
                        <th className="p-1 text-left">Color</th>
                        {config.enabledSizes.XS && <th className="p-1">XS</th>}
                        {config.enabledSizes.S && <th className="p-1">S</th>}
                        {config.enabledSizes.M && <th className="p-1">M</th>}
                        {config.enabledSizes.L && <th className="p-1">L</th>}
                        {config.enabledSizes.XL && <th className="p-1">XL</th>}
                        {config.enabledSizes['2XL'] && <th className="p-1">2XL</th>}
                        {config.enabledSizes['3XL'] && <th className="p-1">3XL</th>}
                        <th className="p-1 text-right">Total Pcs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[7px]">
                      <tr>
                        <td className="p-1 text-left font-sans font-bold text-slate-900">Navy Blue</td>
                        {config.enabledSizes.XS && <td className="p-1">50</td>}
                        {config.enabledSizes.S && <td className="p-1">100</td>}
                        {config.enabledSizes.M && <td className="p-1">200</td>}
                        {config.enabledSizes.L && <td className="p-1">200</td>}
                        {config.enabledSizes.XL && <td className="p-1">100</td>}
                        {config.enabledSizes['2XL'] && <td className="p-1">50</td>}
                        {config.enabledSizes['3XL'] && <td className="p-1">20</td>}
                        <td className="p-1 text-right font-bold text-slate-900">720</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Authority Signature & Stamp Section */}
              <div className="relative z-10 my-2 pt-2 border-t border-dashed border-slate-200 flex justify-between items-end">
                {/* Stamp */}
                <div className="text-center">
                  {config.sealUrl ? (
                    <img src={config.sealUrl} alt="Seal Stamp" className="w-14 h-14 object-contain mx-auto mb-1 opacity-90 rotate-[-8deg]" />
                  ) : (
                    <div className="w-12 h-12 border border-red-600 border-dashed rounded-full flex items-center justify-center text-[7px] text-red-600 font-black uppercase text-center p-1 rotate-[-12deg] mx-auto mb-1">
                      OFFICIAL SEAL
                    </div>
                  )}
                  <p className="text-[6px] font-black uppercase text-slate-400">Security Verification Stamp</p>
                </div>

                {/* Signature */}
                <div className="text-right">
                  {config.signatureUrl ? (
                    <img src={config.signatureUrl} alt="Authority Signature" className="h-8 object-contain ml-auto mb-1" />
                  ) : (
                    <div className="h-6 w-24 border-b border-slate-400 ml-auto mb-1" />
                  )}
                  <p className="text-[7.5px] font-black uppercase text-slate-900">{config.authorityName}</p>
                  <p className="text-[6.5px] font-bold text-slate-500 uppercase">{config.authorityTitle}</p>
                </div>
              </div>

              {/* Letterhead Footer Section */}
              <div className="relative z-10 border-t pt-2 flex justify-between items-end text-[7px] text-slate-400" style={{ borderColor: config.primaryColor }}>
                <div>
                  <p className="font-bold text-slate-700">{config.companyName}</p>
                  <p>Factory: {config.factoryAddress}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono">{config.website}</p>
                  <p className="text-slate-400">Page 1 of 1</p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LetterheadSettings;

