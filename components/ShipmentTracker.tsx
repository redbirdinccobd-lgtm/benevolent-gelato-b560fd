import React, { useState, useEffect, useRef, useMemo } from 'react';
import { doc, getDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../src/firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut, User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  FileText, 
  Download, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  AlertCircle, 
  QrCode, 
  Copy, 
  Check, 
  Printer, 
  ExternalLink, 
  RefreshCw,
  MessageSquare,
  Lock,
  Unlock,
  Globe,
  Send,
  Plus,
  Trash2,
  Filter,
  Search,
  Tag,
  Key,
  User as UserIcon,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  ArrowRight,
  FileDown,
  Eye,
  Award,
  Stamp,
  X,
  ChevronRight,
  Mic
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { COMPANY_NAME, WEBSITE_URL } from '../constants';
import { ShipmentNote } from '../types';
import VoiceInputButton from './VoiceInputButton';

interface ShipmentItem {
  id: string;
  itemName: string;
  styleNumber: string;
  color: string;
  size: string;
  cartonNumber: string;
  quantity: number;
  colorQuantity: number;
}

interface ShipmentData {
  id: string;
  buyerName: string;
  buyerAddress: string;
  shipmentDate: string;
  status: 'active' | 'closed';
  trackingStatus?: 'live' | 'invalid';
  isVerified?: boolean;
  items: ShipmentItem[];
  salesContractNumber?: string;
  salesContractDate?: string;
  expNumber?: string;
  issueDate?: string;
  paymentCondition?: string;
  notes?: ShipmentNote[];
}

const NOTE_TEMPLATES = [
  { label: 'Customs Cleared', category: 'Customs & Clearance' as const, statusTag: 'Cleared' as const, text: 'Customs EXP assessment approved and duty clearance verified by Chittagong Port Customs.' },
  { label: 'AQL 2.5 Passed', category: 'Quality Inspection' as const, statusTag: 'Milestone' as const, text: '4-Point inspection and AQL 2.5 final random carton audit successfully passed with zero critical defects.' },
  { label: 'Container Stuffed', category: 'Freight & Logistics' as const, statusTag: 'In Progress' as const, text: 'Cartons loaded and container sealed (Seal #RB-9982) at factory dock; transit to port underway.' },
  { label: 'Vessel Berthing', category: 'Freight & Logistics' as const, statusTag: 'In Progress' as const, text: 'Feeder vessel berthing confirmed; loaded onto ocean carrier for onward transshipment.' },
  { label: 'Docs Dispatched', category: 'Status Update' as const, statusTag: 'Cleared' as const, text: 'Original Commercial Invoice, Packing List, and Bill of Lading dispatched to buyer via DHL.' },
  { label: 'L/C Remittance', category: 'Financial & Remittance' as const, statusTag: 'Milestone' as const, text: 'Irrevocable Letter of Credit documentation accepted and payment remittance scheduled with bank.' }
];

const ShipmentTracker: React.FC<{ shipmentId: string }> = ({ shipmentId }) => {
  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isQrExpanded, setIsQrExpanded] = useState(false);

  // Admin Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isPasscodeAdmin, setIsPasscodeAdmin] = useState(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [isAdminAuthenticating, setIsAdminAuthenticating] = useState(false);

  // Shipment Notes State
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<ShipmentNote['category']>('Status Update');
  const [noteStatusTag, setNoteStatusTag] = useState<ShipmentNote['statusTag']>('Milestone');
  const [noteIsInternal, setNoteIsInternal] = useState(true);
  const [noteAuthor, setNoteAuthor] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteSubmitSuccess, setNoteSubmitSuccess] = useState(false);
  const [noteFilterCategory, setNoteFilterCategory] = useState<string>('All');
  const [noteSearchTerm, setNoteSearchTerm] = useState('');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  // PDF Dossier Generation State
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfNotification, setPdfNotification] = useState<string | null>(null);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);

  // Listen to Auth State
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        const defaultName = user.displayName || 
          (user.email === 'sumon.hanwha@gmail.com' ? 'Sumon (Operations Director)' : 
           user.email === 'redbird.inc.co.bd@gmail.com' ? 'Red Bird Master Admin' : 'Operations Officer');
        setNoteAuthor(defaultName);
      } else {
        setNoteAuthor('Sumon (Operations Director)');
      }
    });
    return () => unsubscribe();
  }, []);

  const isMasterAdminEmail = currentUser?.email === 'sumon.hanwha@gmail.com' || currentUser?.email === 'redbird.inc.co.bd@gmail.com';
  const isAdmin = Boolean(isMasterAdminEmail || currentUser?.isAnonymous || isPasscodeAdmin);

  useEffect(() => {
    if (!shipmentId || !db) return;

    setLoading(true);
    const docRef = doc(db, 'shipments', shipmentId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as ShipmentData;
        if (data.trackingStatus === 'invalid') {
          setError("This tracking link has been invalidated by the administrator. Please contact your agent.");
          setShipment(null);
        } else {
          setShipment(data);
          setError(null);
        }
      } else {
        setError("Shipment tracking link is invalid or has been removed by administrator.");
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `shipments/${shipmentId}`);
      setError("Unable to retrieve shipment data. Please try again later.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [shipmentId]);

  // Handle Passcode Admin Login
  const handlePasscodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError('');
    if (adminPasscode.trim() === 'redbird2026') {
      setIsAdminAuthenticating(true);
      try {
        if (auth && !currentUser) {
          await signInAnonymously(auth);
        }
        setIsPasscodeAdmin(true);
        setIsAdminAuthModalOpen(false);
        setAdminPasscode('');
        setNoteAuthor('Sumon (Operations Director)');
      } catch (err) {
        console.warn("Anonymous sign in error:", err);
        setIsPasscodeAdmin(true);
        setIsAdminAuthModalOpen(false);
      } finally {
        setIsAdminAuthenticating(false);
      }
    } else {
      setAdminAuthError('Invalid Master Passcode. Authorized operations personnel only.');
    }
  };

  // Handle Google Admin Login
  const handleGoogleLogin = async () => {
    if (!auth) return;
    setIsAdminAuthenticating(true);
    setAdminAuthError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setIsAdminAuthModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setAdminAuthError('Google sign in canceled or failed. Try the Master Passcode option.');
    } finally {
      setIsAdminAuthenticating(false);
    }
  };

  // Handle Admin Logout
  const handleAdminLogout = async () => {
    if (auth && currentUser) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn(err);
      }
    }
    setIsPasscodeAdmin(false);
    setCurrentUser(null);
  };

  // Handle Adding a Note
  const handleAppendNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || !shipment || !db) return;

    setIsSubmittingNote(true);
    const newNote: ShipmentNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      author: noteAuthor.trim() || (currentUser?.displayName || 'Sumon (Operations Director)'),
      authorEmail: currentUser?.email || undefined,
      content: noteContent.trim(),
      category: noteCategory,
      statusTag: noteStatusTag,
      isInternal: noteIsInternal,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = doc(db, 'shipments', shipment.id);
      await updateDoc(docRef, {
        notes: arrayUnion(newNote),
        notesUpdatedAt: new Date().toISOString()
      });

      setNoteContent('');
      setNoteSubmitSuccess(true);
      setTimeout(() => setNoteSubmitSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `shipments/${shipment.id}`);
      alert("Failed to append note to Firestore. Please verify admin permissions.");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Handle Deleting a Note
  const handleDeleteNote = async (noteToDelete: ShipmentNote) => {
    if (!shipment || !db || !isAdmin) return;
    if (!window.confirm("Are you sure you want to remove this operational note from the audit log?")) return;

    setDeletingNoteId(noteToDelete.id);
    try {
      const updatedNotes = (shipment.notes || []).filter(n => n.id !== noteToDelete.id);
      const docRef = doc(db, 'shipments', shipment.id);
      await updateDoc(docRef, {
        notes: updatedNotes,
        notesUpdatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `shipments/${shipment.id}`);
      alert("Failed to remove note. Please check permissions.");
    } finally {
      setDeletingNoteId(null);
    }
  };

  // Copy Note Content
  const handleCopyNote = (note: ShipmentNote) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      const text = `[Red Bird International • Shipment #${shipment?.id}]\n[${note.category} • ${note.statusTag}]\nDate: ${new Date(note.createdAt).toLocaleString()}\nAuthor: ${note.author}\nNote: ${note.content}`;
      navigator.clipboard.writeText(text);
      setCopiedNoteId(note.id);
      setTimeout(() => setCopiedNoteId(null), 2500);
    }
  };

  // Print Notes Audit Trail
  const handlePrintNotesAudit = () => {
    if (!shipment) return;
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    const notesToPrint = isAdmin ? (shipment.notes || []) : (shipment.notes || []).filter(n => !n.isInternal);
    const rowsHtml = notesToPrint.map((n, i) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; font-size: 11px; font-weight: bold; color: #64748b;">#${i + 1}</td>
        <td style="padding: 12px; font-size: 11px; font-weight: bold; color: #0f172a; white-space: nowrap;">${new Date(n.createdAt).toLocaleDateString()} ${new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</td>
        <td style="padding: 12px; font-size: 11px; font-weight: bold; color: #dc2626;">${n.category}</td>
        <td style="padding: 12px; font-size: 11px; font-weight: bold;">${n.statusTag}</td>
        <td style="padding: 12px; font-size: 11px; color: #334155; line-height: 1.5;">${n.content}</td>
        <td style="padding: 12px; font-size: 11px; font-weight: bold; color: #475569;">${n.author}</td>
        <td style="padding: 12px; font-size: 10px; font-weight: bold; color: ${n.isInternal ? '#b91c1c' : '#047857'};">${n.isInternal ? 'INTERNAL' : 'PUBLIC'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shipment Notes & Status Audit Trail - #${shipment.id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 36px; color: #0f172a; }
            h1 { font-size: 20px; font-weight: 900; margin: 0 0 4px 0; text-transform: uppercase; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; text-align: left; margin-top: 16px; }
            th { background: #f8fafc; padding: 10px 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
            .meta-box { background: #f1f5f9; padding: 12px 16px; border-radius: 12px; margin-bottom: 20px; font-size: 12px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div style="font-size: 10px; font-weight: 900; color: #dc2626; letter-spacing: 2px;">RED BIRD INTERNATIONAL CORP.</div>
              <h1>Official Shipment Status & Audit Log</h1>
              <div style="font-size: 12px; color: #64748b;">Master Tracking ID: <strong>#${shipment.id}</strong></div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #64748b;">
              <div>Generated: ${new Date().toLocaleString()}</div>
              <div>Audited by: ${currentUser?.displayName || 'Sumon (Operations Director)'}</div>
            </div>
          </div>

          <div class="meta-box">
            <strong>Consignee:</strong> ${shipment.buyerName || 'International Buyer'} &bull; 
            <strong>Sales Contract:</strong> ${shipment.salesContractNumber || 'N/A'} &bull; 
            <strong>EXP:</strong> ${shipment.expNumber || 'Processing'} &bull; 
            <strong>Status:</strong> ${shipment.status === 'closed' ? 'Delivered' : 'Active In Transit'}
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Timestamp</th>
                <th>Category</th>
                <th>Status Tag</th>
                <th>Log Content & Comments</th>
                <th>Author</th>
                <th>Visibility</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="7" style="padding: 24px; text-align: center; color: #94a3b8;">No notes recorded for this shipment.</td></tr>'}
            </tbody>
          </table>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; font-size: 10px; color: #94a3b8; text-align: center;">
            STRICTLY CONFIDENTIAL &bull; RED BIRD INTERNATIONAL LOGISTICS AUDIT TRAIL
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Generate and Download Branded PDF Summary
  const handleDownloadBrandedPDF = async () => {
    if (!pdfTemplateRef.current || !shipment) {
      alert("Shipment profile is still loading. Please try again in a moment.");
      return;
    }

    setIsExportingPDF(true);
    try {
      const element = pdfTemplateRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 850
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // First Page
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Additional Pages for Multi-Page Logs & Large Cargo Lists
      while (heightLeft > 5) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      const cleanId = shipment.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanBuyer = (shipment.buyerName || 'Buyer').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 15);
      const filename = `RedBird_Shipment_Summary_${cleanId}_${cleanBuyer}.pdf`;
      pdf.save(filename);

      setPdfNotification(`Formal PDF Dossier downloaded: ${filename}`);
      setTimeout(() => setPdfNotification(null), 4500);
    } catch (err) {
      console.error('Failed to export PDF dossier:', err);
      alert('PDF generation encountered an issue. You can also use the Print Dossier option as a fallback.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Print Dossier Directly
  const handlePrintDossier = () => {
    if (!pdfTemplateRef.current || !shipment) return;
    const printContent = pdfTemplateRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Red Bird International - Shipment Summary #${shipment.id}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 20px; color: #0f172a; background: #fff; }
            table { width: 100%; border-collapse: collapse; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold animate-pulse tracking-widest uppercase text-xs">Connecting to Secure Tracker...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-200"
        >
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-slate-500 mb-8">{error}</p>
          <a 
            href="/"
            className="inline-block bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
          >
            Return to Homepage
          </a>
        </motion.div>
      </div>
    );
  }

  if (!shipment) return null;

  const isClosed = shipment.status === 'closed';
  const isVerified = shipment.isVerified !== false;

  const verificationUrl = useMemo(() => {
    return typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#verify?id=${encodeURIComponent(shipment.id)}`
      : `https://redbird-international.com/#verify?id=${encodeURIComponent(shipment.id)}`;
  }, [shipment.id]);

  const handleCopyVerificationLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(verificationUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById(`qr-code-shipment-${shipment.id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 512, 512);
        ctx.drawImage(img, 32, 32, 448, 448);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `Verification_QR_${shipment.id}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrintQR = () => {
    const svg = document.getElementById(`qr-code-shipment-${shipment.id}`);
    const svgHtml = svg ? svg.outerHTML : '';
    const printWindow = window.open('', '_blank', 'width=650,height=750');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Verification QR Certificate - ${shipment.id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; text-align: center; color: #0f172a; background: #fff; }
            .card { border: 2px solid #e2e8f0; border-radius: 24px; padding: 36px; max-width: 460px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
            .badge { text-transform: uppercase; font-size: 11px; letter-spacing: 2px; color: #dc2626; font-weight: 900; margin-bottom: 8px; }
            h1 { font-size: 22px; font-weight: 900; margin: 0 0 6px 0; color: #0f172a; }
            .sub { font-size: 13px; color: #64748b; margin-bottom: 24px; }
            .qr-wrapper { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 20px; padding: 24px; display: inline-block; margin-bottom: 20px; }
            .id-pill { font-family: ui-monospace, monospace; font-size: 14px; font-weight: bold; background: #0f172a; color: #fff; padding: 8px 18px; border-radius: 9999px; display: inline-block; margin-bottom: 16px; }
            .meta { font-size: 12px; color: #475569; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 20px; line-height: 1.7; text-align: left; }
            .meta strong { color: #0f172a; }
            .url { word-break: break-all; font-family: monospace; font-size: 11px; color: #dc2626; background: #fef2f2; padding: 6px 10px; border-radius: 8px; margin-top: 6px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">Red Bird International • Security Registry</div>
            <h1>Shipment Verification Certificate</h1>
            <p class="sub">Direct cryptographic link to authenticity & customs clearance</p>
            <div class="id-pill">Tracking ID: #${shipment.id}</div>
            <div class="qr-wrapper">
              ${svgHtml}
            </div>
            <div class="meta">
              <div><strong>Consignee / Buyer:</strong> ${shipment.buyerName || 'International Buyer'}</div>
              <div><strong>Shipment Date:</strong> ${shipment.shipmentDate || 'Active in Transit'}</div>
              <div><strong>Status:</strong> ${shipment.status === 'closed' ? 'Delivered & Closed' : 'Active Live in Transit'}</div>
              <div style="margin-top: 10px;"><strong>Direct Verification URL:</strong></div>
              <div class="url">${verificationUrl}</div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filter notes based on user role and filters
  const rawNotes: ShipmentNote[] = useMemo(() => shipment.notes || [], [shipment.notes]);
  // Non-admins can only see public notes
  const visibleNotes = useMemo(() => isAdmin ? rawNotes : rawNotes.filter(n => !n.isInternal), [isAdmin, rawNotes]);

  const filteredNotes = useMemo(() => visibleNotes.filter(note => {
    const matchesCategory = 
      noteFilterCategory === 'All' ? true :
      noteFilterCategory === 'Internal' ? note.isInternal :
      noteFilterCategory === 'Public' ? !note.isInternal :
      note.category === noteFilterCategory;

    const matchesSearch = 
      noteSearchTerm.trim() === '' ? true :
      note.content.toLowerCase().includes(noteSearchTerm.toLowerCase()) ||
      note.author.toLowerCase().includes(noteSearchTerm.toLowerCase()) ||
      note.category.toLowerCase().includes(noteSearchTerm.toLowerCase()) ||
      note.statusTag.toLowerCase().includes(noteSearchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [visibleNotes, noteFilterCategory, noteSearchTerm]);

  const internalCount = useMemo(() => rawNotes.filter(n => n.isInternal).length, [rawNotes]);
  const publicCount = useMemo(() => rawNotes.filter(n => !n.isInternal).length, [rawNotes]);

  const { totalCartons, totalUnits } = useMemo(() => {
    const cartons = (shipment.items || []).reduce((acc, it) => acc + (parseInt(it.cartonNumber) || 1), 0);
    const units = (shipment.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
    return { totalCartons: cartons, totalUnits: units };
  }, [shipment.items]);

  // Render Official Branded Dossier Document Template
  const renderDossierDocument = () => {
    if (!shipment) return null;
    const notesToInclude = isAdmin 
      ? (shipment.notes || []).slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      : (shipment.notes || []).filter(n => !n.isInternal).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const totalCartons = (shipment.items || []).reduce((acc, it) => acc + (parseInt(it.cartonNumber) || 1), 0);
    const totalUnits = (shipment.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);

    return (
      <div className="bg-white text-slate-900 p-8 sm:p-10 font-sans" style={{ width: '850px', minHeight: '1120px', margin: '0 auto', boxSizing: 'border-box' }}>
        {/* Top Corporate Header Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-red-600 via-red-700 to-slate-900 rounded-full mb-6"></div>

        {/* Corporate Letterhead */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-6">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
                RB
              </div>
              <div>
                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest block">
                  Official Trade & Customs Dossier
                </span>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  {COMPANY_NAME}
                </h2>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">
              Global Apparel Exporter & Logistics Supply Chain Management
            </p>
            <p className="text-[10px] text-slate-500 leading-tight">
              Corporate HQ: House #42, Road #11, Sector #4, Uttara, Dhaka-1230, Bangladesh<br />
              Tel: +880 2 895 1234 &bull; Email: operations@redbird-international.com &bull; Web: {WEBSITE_URL}
            </p>
            <div className="flex items-center gap-3 pt-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              <span>ISO 9001:2015</span>
              <span>&bull;</span>
              <span>BSCI Social Audit</span>
              <span>&bull;</span>
              <span>OEKO-TEX Standard 100</span>
              <span>&bull;</span>
              <span>BGMEA Reg. #RB-8921</span>
            </div>
          </div>

          {/* Live Authenticity Verification QR Code */}
          <div className="text-right flex flex-col items-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <QRCodeSVG 
              value={verificationUrl}
              size={88}
              level="M"
              className="p-1 bg-white rounded-lg border border-slate-200"
            />
            <span className="text-[9px] font-black text-slate-900 uppercase tracking-wider mt-1.5 font-mono">
              #{shipment.id}
            </span>
            <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-0.5">
              Cryptographic Seal
            </span>
          </div>
        </div>

        {/* Dossier Title & Metadata Bar */}
        <div className="bg-slate-950 text-white rounded-2xl p-4 mb-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 mb-2.5">
            <div>
              <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">
                Executive Audit Document
              </span>
              <h1 className="text-base font-black uppercase tracking-wide">
                Official Shipment Summary & Notes Audit Dossier
              </h1>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-600/30 text-red-300 border border-red-500/30">
                {isAdmin ? 'ADMINISTRATIVE AUDIT VIEW' : 'PUBLIC TRACKING REPORT'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-[10px]">
            <div>
              <span className="text-slate-400 uppercase tracking-wider block text-[9px]">Dossier Reference</span>
              <span className="font-mono font-bold text-white">REF: RBI-EXP-{shipment.id}-{new Date().getFullYear()}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase tracking-wider block text-[9px]">Audit Generation Date</span>
              <span className="font-bold text-white">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div>
              <span className="text-slate-400 uppercase tracking-wider block text-[9px]">Certified Auditor</span>
              <span className="font-bold text-emerald-400">{currentUser?.displayName || (isPasscodeAdmin ? 'Sumon (Operations Director)' : 'Master Admin')}</span>
            </div>
          </div>
        </div>

        {/* Shipment & Consignee Particulars */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
          {/* Buyer / Consignee */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-black uppercase tracking-wider mb-2 border-b border-slate-200 pb-1.5">
              <UserIcon size={12} className="text-red-600" />
              <span>Consignee & Destination Particulars</span>
            </div>
            <div className="font-black text-sm text-slate-900 mb-1">{shipment.buyerName || 'International Consignee'}</div>
            <p className="text-slate-600 text-[11px] leading-relaxed whitespace-pre-line mb-3">
              {shipment.buyerAddress || 'Address on file with Customs Documentation'}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[10px]">
              <div>
                <span className="text-slate-400 block font-bold uppercase">Port of Loading</span>
                <span className="font-bold text-slate-800">Chittagong Port (BDCGP)</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold uppercase">Port of Discharge</span>
                <span className="font-bold text-slate-800">Final Consignee Port</span>
              </div>
            </div>
          </div>

          {/* Contract & Regulatory Identifiers */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-black uppercase tracking-wider mb-2 border-b border-slate-200 pb-1.5">
              <ShieldCheck size={12} className="text-red-600" />
              <span>Contract & Regulatory Identifiers</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[9px] font-bold uppercase">Master Tracking ID</span>
                <span className="font-mono font-black text-red-600">#{shipment.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] font-bold uppercase">Current State</span>
                <span className="font-black text-slate-900 uppercase">{shipment.status === 'closed' ? 'Delivered & Closed' : 'Active In Transit'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] font-bold uppercase">Sales Contract #</span>
                <span className="font-bold text-slate-800">{shipment.salesContractNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] font-bold uppercase">Contract Date</span>
                <span className="font-bold text-slate-800">{shipment.salesContractDate || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] font-bold uppercase">EXP Clearance #</span>
                <span className="font-bold text-slate-800">{shipment.expNumber || 'Cleared / Expedited'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] font-bold uppercase">Payment Terms</span>
                <span className="font-bold text-slate-800 truncate block">{shipment.paymentCondition || 'Irrevocable Confirmed L/C'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Tracking Milestones Progression */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Truck size={14} className="text-red-600" />
              <span>Tracking History & Progression Milestones</span>
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {shipment.status === 'closed' ? '5 of 5 Stages Completed' : 'In Ocean Transit (Stage 4)'}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 text-center">
            {[
              { stage: '1. Order Booking', desc: 'Factory QA Pass', status: 'Completed', date: shipment.shipmentDate || 'Cleared' },
              { stage: '2. Customs EXP', desc: 'Chittagong Port', status: 'Cleared', date: shipment.issueDate || 'Cleared' },
              { stage: '3. Container Dock', desc: 'Sealed & Inspected', status: 'Completed', date: 'Seal Verified' },
              { stage: '4. Ocean Transit', desc: 'Feeder Departure', status: shipment.status === 'closed' ? 'Completed' : 'Active In Transit', date: 'Vessel Live' },
              { stage: '5. Consignee Delivery', desc: 'Port of Discharge', status: shipment.status === 'closed' ? 'Delivered' : 'Scheduled', date: shipment.status === 'closed' ? 'Finalized' : 'En Route' },
            ].map((m, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase block">{m.stage}</span>
                  <span className="text-[10px] font-bold text-slate-900 block mt-0.5">{m.desc}</span>
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-200">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                    m.status === 'Completed' || m.status === 'Cleared' || m.status === 'Delivered'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cargo & Packing List Breakdown */}
        {shipment.items && shipment.items.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Package size={14} className="text-red-600" />
                <span>Cargo Specifications & Packing Manifest</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-500">
                {shipment.items.length} Line Items &bull; {totalCartons} Cartons Total
              </span>
            </div>

            <table className="w-full border-collapse border border-slate-200 text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                  <th className="p-2 border-r border-slate-200 w-12 text-center">#</th>
                  <th className="p-2 border-r border-slate-200">Article / Style</th>
                  <th className="p-2 border-r border-slate-200">Item Description</th>
                  <th className="p-2 border-r border-slate-200">Color / Size</th>
                  <th className="p-2 border-r border-slate-200 text-center">Cartons</th>
                  <th className="p-2 text-right">Quantity (Pcs)</th>
                </tr>
              </thead>
              <tbody>
                {shipment.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-200 text-[11px] hover:bg-slate-50/50">
                    <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-bold font-mono text-slate-900">{item.styleNumber || 'N/A'}</td>
                    <td className="p-2 border-r border-slate-200 font-medium text-slate-800">{item.itemName || 'Garment Item'}</td>
                    <td className="p-2 border-r border-slate-200 text-slate-600">{item.color || 'Standard'} / {item.size || 'Assorted'}</td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-700">{item.cartonNumber || '1'}</td>
                    <td className="p-2 text-right font-black font-mono text-slate-900">{(item.quantity || 0).toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-black text-[11px] text-slate-900 border-t-2 border-slate-900">
                  <td colSpan={4} className="p-2.5 text-right uppercase tracking-wider">Grand Total Cargo Volume:</td>
                  <td className="p-2.5 border-r border-slate-200 text-center font-mono">{totalCartons} Ctn</td>
                  <td className="p-2.5 text-right font-mono text-red-600 text-xs">{totalUnits.toLocaleString()} Pcs</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Appended Operational Notes & Internal Audit Trail (Core User Request) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <MessageSquare size={14} className="text-red-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Appended Shipment Notes & Internal Operations Audit Log
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-full">
                {notesToInclude.length} Logged Entries
              </span>
              {isAdmin && (
                <span className="text-[9px] font-black bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Confidential Admin Audit
                </span>
              )}
            </div>
          </div>

          {notesToInclude.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400 text-xs font-bold">
              No operational notes or internal comments logged for this shipment.
            </div>
          ) : (
            <table className="w-full border-collapse border border-slate-200 text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                  <th className="p-2 w-8 text-center">#</th>
                  <th className="p-2 w-28">Timestamp</th>
                  <th className="p-2 w-24">Category</th>
                  <th className="p-2 w-20">Status</th>
                  <th className="p-2 w-20 text-center">Scope</th>
                  <th className="p-2">Log Content & Operations Comments</th>
                  <th className="p-2 w-28 text-right">Officer / Signer</th>
                </tr>
              </thead>
              <tbody>
                {notesToInclude.map((note, idx) => (
                  <tr 
                    key={note.id || idx} 
                    className={`border-b border-slate-200 text-[11px] ${
                      note.isInternal ? 'bg-red-50/40' : 'bg-white'
                    }`}
                  >
                    <td className="p-2.5 text-center font-bold text-slate-400 border-r border-slate-200">{idx + 1}</td>
                    <td className="p-2.5 text-[10px] font-bold text-slate-700 whitespace-nowrap border-r border-slate-200">
                      <div>{new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      <div className="text-[9px] text-slate-400 font-mono">{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="p-2.5 border-r border-slate-200">
                      <span className="text-[10px] font-bold text-slate-800 block">
                        {note.category}
                      </span>
                    </td>
                    <td className="p-2.5 border-r border-slate-200">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-800">
                        {note.statusTag}
                      </span>
                    </td>
                    <td className="p-2.5 text-center border-r border-slate-200">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        note.isInternal 
                          ? 'bg-red-600 text-white font-black' 
                          : 'bg-emerald-600 text-white font-black'
                      }`}>
                        {note.isInternal ? 'INTERNAL' : 'PUBLIC'}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-900 border-r border-slate-200 leading-relaxed font-medium">
                      {note.content}
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-700 text-[10px]">
                      {note.author}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Corporate Certification Declaration & Signatures */}
        <div className="mt-8 pt-6 border-t-2 border-slate-900">
          <p className="text-[10px] text-slate-600 leading-relaxed italic mb-6 text-justify">
            "I hereby certify and declare that this document represents an authenticated, legally binding export dossier generated from Red Bird International Corp.'s enterprise trade ERP database. All tracking milestones, cargo specifications, customs EXP clearances, and appended internal operational logs recorded herein have been verified in strict compliance with international trade protocols and BGMEA export guidelines for Master Tracking ID #{shipment.id}."
          </p>

          <div className="flex justify-between items-end">
            {/* Official Seal Graphic */}
            <div className="flex items-center gap-3">
              <div className="w-24 h-24 rounded-full border-4 border-dashed border-red-600 flex flex-col items-center justify-center p-2 text-center text-red-600 relative rotate-[-6deg] select-none">
                <span className="text-[7px] font-black uppercase tracking-widest leading-none">RED BIRD INT'L</span>
                <div className="my-1 border-t border-b border-red-600 w-full py-0.5">
                  <span className="text-[8px] font-black uppercase tracking-wider block">OFFICIAL SEAL</span>
                </div>
                <span className="text-[6px] font-bold uppercase tracking-widest leading-none">DHAKA BANGLADESH</span>
                <span className="text-[6px] font-mono text-red-500 mt-0.5">VERIFIED #{shipment.id.slice(0, 8)}</span>
              </div>
              <div className="text-[10px] text-slate-500 space-y-0.5">
                <div className="font-black text-slate-800 uppercase">Cryptographic Audit Seal</div>
                <div>Digest: SHA-256 Verified</div>
                <div className="text-[9px] text-emerald-600 font-bold">Status: Validated & In Good Standing</div>
              </div>
            </div>

            {/* Authorized Signatory Block */}
            <div className="text-right space-y-1">
              <div className="font-serif italic text-lg text-slate-900 font-bold pr-2">
                Sumon
              </div>
              <div className="w-48 h-0.5 bg-slate-900 ml-auto mb-1"></div>
              <div className="text-xs font-black uppercase tracking-tight text-slate-900">
                Sumon (Operations Director)
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Executive Trade & Logistics Compliance Division
              </div>
              <div className="text-[9px] text-slate-400">
                {COMPANY_NAME} &bull; Dhaka, Bangladesh
              </div>
            </div>
          </div>
        </div>

        {/* Document Microprint Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider">
          <span>RED BIRD CORP. &bull; DOCUMENT ID: RBI-EXP-{shipment.id}</span>
          <span>STRICTLY CONFIDENTIAL &bull; FOR REGULATORY, CARRIER & CONSIGNEE AUDIT ONLY</span>
          <span>PAGE 1 OF 1</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col font-sans">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-900/5 rounded-full blur-3xl -ml-48 -mb-48"></div>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-5 px-4 md:px-8 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
             <div className="bg-red-600 p-2.5 rounded-2xl text-white shadow-md shadow-red-600/20">
                <Package size={22} />
             </div>
             <div>
                <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase">Buyer Tracking Portal</h1>
                <p className="text-[10px] text-slate-400 font-bold tracking-widest">{COMPANY_NAME}</p>
             </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Admin Status Pill / Login Trigger */}
            {isAdmin ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-full text-xs font-bold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[11px] font-mono">
                    {currentUser?.displayName || (isPasscodeAdmin ? 'Sumon (Operations Director)' : 'Admin Mode')}
                  </span>
                  <button
                    onClick={handleAdminLogout}
                    className="text-[10px] text-slate-400 hover:text-red-400 ml-1 underline uppercase font-black"
                    title="Sign out of Admin Mode"
                  >
                    Exit
                  </button>
                </div>

                {/* Header PDF Summary Action Button */}
                <button
                  onClick={() => setIsPdfModalOpen(true)}
                  disabled={isExportingPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95"
                  title="Generate and download formal branded PDF shipment summary"
                >
                  {isExportingPDF ? <RefreshCw size={13} className="animate-spin" /> : <FileDown size={13} />}
                  <span>PDF Summary</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsAdminAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold transition-colors"
                title="Authenticate as Red Bird Operations Staff"
              >
                <Key size={13} className="text-slate-500" />
                <span className="text-[11px]">Staff Access</span>
              </button>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
              <ShieldCheck size={14} />
              <span>Secure End-to-End Tracking</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8 relative">
        {/* Closed Watermark */}
        {isClosed && (
          <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center opacity-[0.08] rotate-[-25deg]">
             <div className="border-[15px] border-red-600 px-12 py-6 rounded-3xl">
                <h2 className="text-9xl font-black text-red-600 uppercase">Delivered</h2>
                <p className="text-4xl text-center font-bold text-red-600 tracking-[0.5em] mt-4">FINALIZED</p>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Status Overview Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                 {!isVerified && (
                   <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800">
                      <ShieldCheck size={20} className="text-amber-600" />
                      <div className="text-xs">
                         <p className="font-bold">Pending Official Verification</p>
                         <p className="opacity-80">This shipment is awaiting final sign-off from Red Bird International Master Admin.</p>
                      </div>
                   </div>
                 )}
                 <div className="flex justify-between items-start mb-6">
                    <div>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Live Shipment Status</span>
                       <h2 className="text-3xl font-black text-slate-900 leading-none">{shipment.id}</h2>
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter ${isClosed ? 'bg-red-600 text-white' : 'bg-slate-900 text-white animate-pulse'}`}>
                       {isClosed ? 'Shipment Delivered & Closed' : 'Shipment In Progress'}
                    </div>
                 </div>

                 {/* Tracking Progress Bar */}
                 <div className="relative pt-8 pb-4">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2"></div>
                    <div className={`absolute top-1/2 left-0 h-1 bg-red-600 -translate-y-1/2 transition-all duration-1000 ${isClosed ? 'w-full' : 'w-2/3'}`}></div>
                    
                    <div className="relative flex justify-between">
                       {[
                         { label: 'Created', icon: Clock, completed: true },
                         { label: 'In Transit', icon: Truck, completed: true },
                         { label: 'Delivered', icon: CheckCircle, completed: isClosed }
                       ].map((step, idx) => (
                         <div key={idx} className="flex flex-col items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 ${step.completed ? 'bg-red-600 border-white text-white shadow-lg' : 'bg-white border-slate-200 text-slate-300'}`}>
                               <step.icon size={18} />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${step.completed ? 'text-slate-900' : 'text-slate-300'}`}>
                               {step.label}
                            </span>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="p-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                       <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <MapPin size={14} className="text-red-600" />
                          Destination Details
                       </h3>
                       <div className="space-y-2">
                          <p className="text-xl font-bold text-slate-900">{shipment.buyerName}</p>
                          <p className="text-slate-500 whitespace-pre-wrap text-sm leading-relaxed">{shipment.buyerAddress}</p>
                       </div>
                    </div>
                    <div>
                       <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <FileText size={14} className="text-red-600" />
                          Contract Metadata
                       </h3>
                       <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                             <p className="text-slate-400 font-bold text-[10px] uppercase">Sales Contract</p>
                             <p className="text-slate-900 font-bold">{shipment.salesContractNumber || 'N/A'}</p>
                          </div>
                          <div>
                             <p className="text-slate-400 font-bold text-[10px] uppercase">Date</p>
                             <p className="text-slate-900 font-bold">{shipment.salesContractDate || 'N/A'}</p>
                          </div>
                          <div>
                             <p className="text-slate-400 font-bold text-[10px] uppercase">EXP Number</p>
                             <p className="text-slate-900 font-bold">{shipment.expNumber || 'Processing'}</p>
                          </div>
                          <div>
                             <p className="text-slate-400 font-bold text-[10px] uppercase">Issue Date</p>
                             <p className="text-slate-900 font-bold">{shipment.issueDate || 'Processing'}</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>

            {/* Items Table */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Packing List Summary</h3>
                 <span className="text-[10px] font-bold text-slate-400 bg-white border px-2 py-1 rounded-lg">
                    {shipment.items.length} Distinct Styles
                 </span>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                       <tr>
                          <th className="px-6 py-4">Article / Style</th>
                          <th className="px-6 py-4">Color/Size</th>
                          <th className="px-6 py-4">Carton</th>
                          <th className="px-6 py-4 text-right">Total Qty</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {shipment.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                             <td className="px-6 py-4">
                                <div className="font-bold text-slate-900">{item.itemName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{item.styleNumber}</div>
                             </td>
                             <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                   <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold">{item.color}</span>
                                   <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold">{item.size}</span>
                                </div>
                             </td>
                             <td className="px-6 py-4 font-mono text-slate-500">{item.cartonNumber}</td>
                             <td className="px-6 py-4 text-right font-black text-slate-900">{item.quantity * item.colorQuantity}</td>
                          </tr>
                       ))}
                    </tbody>
                    <tfoot className="bg-slate-900 text-white font-black text-sm">
                       <tr>
                          <td colSpan={3} className="px-6 py-4 text-right uppercase tracking-widest text-[10px]">Grand Total Shipment Quantity</td>
                          <td className="px-6 py-4 text-right text-lg">
                             {shipment.items.reduce((sum, item) => sum + (item.quantity * item.colorQuantity), 0)}
                          </td>
                       </tr>
                    </tfoot>
                 </table>
              </div>
            </motion.div>

            {/* ========================================================================= */}
            {/* FEATURE: Shipment Notes & Operational Audit Logs Module */}
            {/* ========================================================================= */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden"
              id="shipment-notes-section"
            >
              {/* Header */}
              <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                    <MessageSquare size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black uppercase tracking-tight text-white">
                        Shipment Notes & Status Audit Logs
                      </h3>
                      {isAdmin && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                          <Lock size={10} />
                          Admin Mode
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">
                      {isAdmin 
                        ? 'Internal operational comments, customs logs, and milestone updates stored in Firestore' 
                        : 'Official milestone checkpoints and logistics clearance updates'}
                    </p>
                  </div>
                </div>

                {/* Print, Export & Count Badges */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {isAdmin ? (
                    <>
                      <button
                        onClick={handleDownloadBrandedPDF}
                        disabled={isExportingPDF}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-red-600/30 active:scale-95 border border-red-500"
                        title="Generate and Download Formal Branded PDF Summary with Internal Notes"
                      >
                        {isExportingPDF ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
                        <span>Download PDF Dossier</span>
                      </button>

                      <button
                        onClick={() => setIsPdfModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
                        title="Preview Formal Branded Dossier Document"
                      >
                        <Eye size={13} />
                        <span className="hidden md:inline">Preview</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsAdminAuthModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700"
                      title="Authenticate as Admin to export full notes dossier"
                    >
                      <Lock size={13} className="text-red-400" />
                      <span>Admin PDF Dossier</span>
                    </button>
                  )}

                  <button
                    onClick={handlePrintNotesAudit}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
                    title="Print Chronological Notes Audit Trail"
                  >
                    <Printer size={13} />
                    <span>Print Log</span>
                  </button>
                  <span className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-bold text-slate-300">
                    {visibleNotes.length} {visibleNotes.length === 1 ? 'Note' : 'Notes'}
                  </span>
                </div>
              </div>

              {/* Sub-Header / Filter Toolbar */}
              <div className="p-4 md:px-8 border-b border-slate-100 bg-slate-50/70 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
                  {[
                    { id: 'All', label: `All (${visibleNotes.length})` },
                    ...(isAdmin ? [
                      { id: 'Internal', label: `Internal (${internalCount})` },
                      { id: 'Public', label: `Public (${publicCount})` }
                    ] : []),
                    { id: 'Customs & Clearance', label: 'Customs' },
                    { id: 'Freight & Logistics', label: 'Logistics' },
                    { id: 'Quality Inspection', label: 'Inspection' },
                    { id: 'Financial & Remittance', label: 'Finance' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setNoteFilterCategory(tab.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap text-[11px] transition-all ${
                        noteFilterCategory === tab.id
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative min-w-[200px]">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter comments or author..."
                    value={noteSearchTerm}
                    onChange={(e) => setNoteSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-600 font-medium"
                  />
                  {noteSearchTerm && (
                    <button 
                      onClick={() => setNoteSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Notes Timeline List */}
              <div className="p-6 md:p-8 space-y-4 max-h-[600px] overflow-y-auto">
                {filteredNotes.length === 0 ? (
                  <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                      <MessageSquare size={22} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-700">No Shipment Notes Found</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      {isAdmin 
                        ? 'Use the form below to append internal status comments, customs milestones, or inspection updates for this shipment record.'
                        : 'Official milestone updates will appear here as the cargo advances through port customs and transit.'}
                    </p>
                    {!isAdmin && (
                      <button
                        onClick={() => setIsAdminAuthModalOpen(true)}
                        className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5"
                      >
                        <Key size={13} />
                        <span>Staff Login to View Internal Notes</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredNotes.map((note) => {
                      const isInternal = note.isInternal;
                      const dateObj = new Date(note.createdAt);
                      const formattedDate = dateObj.toLocaleDateString(undefined, { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      });
                      const formattedTime = dateObj.toLocaleTimeString(undefined, { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      });

                      // Category style helper
                      const categoryColors: Record<string, string> = {
                        'Customs & Clearance': 'bg-red-50 text-red-700 border-red-200',
                        'Freight & Logistics': 'bg-blue-50 text-blue-700 border-blue-200',
                        'Quality Inspection': 'bg-purple-50 text-purple-700 border-purple-200',
                        'Financial & Remittance': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        'Status Update': 'bg-amber-50 text-amber-700 border-amber-200',
                        'General': 'bg-slate-100 text-slate-700 border-slate-200'
                      };

                      const tagColors: Record<string, string> = {
                        'Cleared': 'bg-emerald-100 text-emerald-800',
                        'Milestone': 'bg-green-100 text-green-800',
                        'In Progress': 'bg-blue-100 text-blue-800',
                        'Alert': 'bg-red-100 text-red-800',
                        'Info': 'bg-slate-200 text-slate-800'
                      };

                      return (
                        <motion.div
                          key={note.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-5 rounded-2xl border transition-all relative ${
                            isInternal
                              ? 'bg-slate-50/90 border-slate-200 hover:border-slate-300'
                              : 'bg-white border-emerald-100 shadow-sm hover:border-emerald-200'
                          }`}
                        >
                          {/* Note Top Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-200/60">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Visibility Badge */}
                              {isInternal ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white">
                                  <Lock size={10} />
                                  <span>Internal Admin Log</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                                  <Globe size={10} />
                                  <span>Public Milestone</span>
                                </span>
                              )}

                              {/* Category Badge */}
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${categoryColors[note.category] || categoryColors.General}`}>
                                <Tag size={10} />
                                <span>{note.category}</span>
                              </span>

                              {/* Status Tag Badge */}
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${tagColors[note.statusTag] || tagColors.Info}`}>
                                {note.statusTag}
                              </span>
                            </div>

                            {/* Timestamp & Actions */}
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                <Clock size={12} />
                                <span>{formattedDate} at {formattedTime}</span>
                              </span>

                              <button
                                onClick={() => handleCopyNote(note)}
                                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                                title="Copy note text"
                              >
                                {copiedNoteId === note.id ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                              </button>

                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteNote(note)}
                                  disabled={deletingNoteId === note.id}
                                  className="p-1 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                  title="Delete Note"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Note Content */}
                          <p className="text-slate-800 text-xs leading-relaxed font-medium whitespace-pre-wrap">
                            {note.content}
                          </p>

                          {/* Author Signature */}
                          <div className="mt-3.5 pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 font-bold">
                              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-black">
                                {note.author.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-slate-700">{note.author}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {note.id.substring(0, 14)}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Form Section */}
              <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-200">
                {isAdmin ? (
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
                          <Plus size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                            Append Operational Note or Status Comment
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Logged to central Firestore record under shipment #{shipment.id}
                          </p>
                        </div>
                      </div>

                      {/* Quick Template Selector */}
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 hidden md:inline">
                        Click preset to quick-fill
                      </span>
                    </div>

                    {/* Preset Chips */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {NOTE_TEMPLATES.map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setNoteCategory(tmpl.category);
                            setNoteStatusTag(tmpl.statusTag);
                            setNoteContent(tmpl.text);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold border border-slate-200/80 transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <Sparkles size={10} className="text-red-500" />
                          <span>{tmpl.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Form Controls */}
                    <form onSubmit={handleAppendNote} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Category */}
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                            Operation Category
                          </label>
                          <select
                            value={noteCategory}
                            onChange={(e) => setNoteCategory(e.target.value as any)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-1 focus:ring-red-600 focus:outline-none"
                          >
                            <option value="Status Update">Status Update</option>
                            <option value="Customs & Clearance">Customs & Clearance</option>
                            <option value="Freight & Logistics">Freight & Logistics</option>
                            <option value="Quality Inspection">Quality Inspection</option>
                            <option value="Financial & Remittance">Financial & Remittance</option>
                            <option value="General">General Comment</option>
                          </select>
                        </div>

                        {/* Status Tag */}
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                            Severity / Milestone Tag
                          </label>
                          <select
                            value={noteStatusTag}
                            onChange={(e) => setNoteStatusTag(e.target.value as any)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-1 focus:ring-red-600 focus:outline-none"
                          >
                            <option value="Milestone">Milestone (Green Check)</option>
                            <option value="Cleared">Cleared (Customs / Inspection)</option>
                            <option value="In Progress">In Progress (Transit)</option>
                            <option value="Info">Notice / Information</option>
                            <option value="Alert">Alert (Priority Attention)</option>
                          </select>
                        </div>

                        {/* Visibility Toggle */}
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                            Confidentiality / Visibility
                          </label>
                          <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-xl border border-slate-300">
                            <button
                              type="button"
                              onClick={() => setNoteIsInternal(true)}
                              className={`py-1 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1 ${
                                noteIsInternal ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <Lock size={10} />
                              <span>Internal</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setNoteIsInternal(false)}
                              className={`py-1 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1 ${
                                !noteIsInternal ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <Globe size={10} />
                              <span>Public</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Content Textarea with Voice Dictation */}
                      <div>
                        <div className="flex flex-wrap justify-between items-center gap-2 mb-1.5">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                            Log Message / Detailed Note
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {noteContent.length}/1000 chars
                            </span>
                            <VoiceInputButton
                              currentValue={noteContent}
                              onAppendText={(chunk) => setNoteContent(prev => prev ? `${prev} ${chunk}` : chunk)}
                              onReplaceText={(text) => setNoteContent(text)}
                              label="Voice Dictate"
                              compact={true}
                              onVoiceCommand={(cmd) => {
                                if (cmd.includes('customs')) { setNoteCategory('Customs & Clearance'); return true; }
                                if (cmd.includes('freight') || cmd.includes('logistics')) { setNoteCategory('Freight & Logistics'); return true; }
                                if (cmd.includes('inspection')) { setNoteCategory('Quality Inspection'); return true; }
                                if (cmd.includes('alert')) { setNoteStatusTag('Alert'); return true; }
                                if (cmd.includes('milestone')) { setNoteStatusTag('Milestone'); return true; }
                                if (cmd.includes('cleared')) { setNoteStatusTag('Cleared'); return true; }
                                if (cmd.includes('internal')) { setNoteIsInternal(true); return true; }
                                if (cmd.includes('public')) { setNoteIsInternal(false); return true; }
                                return false;
                              }}
                            />
                          </div>
                        </div>
                        <textarea
                          rows={3}
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder="Type or click 'Voice Dictate' to speak notes (Customs EXP clearance, container seal checks, buyer updates)..."
                          className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-1 focus:ring-red-600 focus:outline-none resize-none leading-relaxed"
                          maxLength={1000}
                          required
                        />
                      </div>

                      {/* Author & Submit Button */}
                      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Author:
                          </span>
                          <input
                            type="text"
                            value={noteAuthor}
                            onChange={(e) => setNoteAuthor(e.target.value)}
                            placeholder="Signer name..."
                            className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-1 focus:ring-red-600 focus:outline-none max-w-[220px]"
                          />
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                          {noteSubmitSuccess && (
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fade-in">
                              <CheckCircle size={14} />
                              <span>Saved to Firestore!</span>
                            </span>
                          )}

                          <button
                            type="submit"
                            disabled={isSubmittingNote || !noteContent.trim()}
                            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-red-600/20 active:scale-95 flex items-center justify-center gap-2"
                          >
                            {isSubmittingNote ? (
                              <>
                                <RefreshCw size={13} className="animate-spin" />
                                <span>Saving Note...</span>
                              </>
                            ) : (
                              <>
                                <Send size={13} />
                                <span>Append Note</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                        <Lock size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                          Red Bird Operations Team?
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Sign in or enter Master Passcode to append internal audit comments and view confidential customs records.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAdminAuthModalOpen(true)}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm"
                    >
                      <Key size={13} />
                      <span>Unlock Admin Controls</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.section>
          </div>

          {/* Documents & Action Sidebar */}
          <div className="space-y-6">
            {/* Direct Verification QR Code Generator Card */}
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-6 text-slate-900 relative overflow-hidden"
            >
              <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-red-50 text-red-600 rounded-2xl">
                    <QrCode size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">Verification QR Code</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Direct Cryptographic Link</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-green-100 flex items-center gap-1">
                  <ShieldCheck size={12} />
                  Live Sync
                </span>
              </div>

              {/* QR Code Container */}
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center relative group">
                <div 
                  onClick={() => setIsQrExpanded(true)}
                  className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-100 cursor-pointer transition-transform hover:scale-105"
                  title="Click to enlarge QR Code"
                >
                  <QRCodeSVG 
                    id={`qr-code-shipment-${shipment.id}`}
                    value={verificationUrl}
                    size={160}
                    level="H"
                    includeMargin={false}
                    fgColor="#0f172a"
                  />
                </div>
                
                <div className="mt-3 text-center">
                  <span className="font-mono text-[11px] font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase tracking-wider">
                    #{shipment.id}
                  </span>
                  <p className="text-[10px] text-slate-400 font-medium mt-1.5">
                    Scan with any smartphone or handheld customs scanner
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 space-y-2">
                <a
                  href={`#verify?id=${encodeURIComponent(shipment.id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-red-600/20 active:scale-95"
                >
                  <ShieldCheck size={15} />
                  <span>Open Verification Page</span>
                  <ExternalLink size={13} />
                </a>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCopyVerificationLink}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-[11px] font-bold transition-all border ${
                      copiedLink
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {copiedLink ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                  </button>

                  <button
                    onClick={handleDownloadQR}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all active:scale-95"
                  >
                    <Download size={14} />
                    <span>Download PNG</span>
                  </button>
                </div>

                <button
                  onClick={handlePrintQR}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-all"
                >
                  <Printer size={14} />
                  <span>Print Official Certificate</span>
                </button>
              </div>
            </motion.div>

            {/* Quick Shipment Notes Summary Card in Sidebar */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900">
                  <MessageSquare size={17} className="text-red-600" />
                  <h4 className="text-xs font-black uppercase tracking-wider">Status Notes Summary</h4>
                </div>
                <span className="text-[10px] font-black bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                  {rawNotes.length} Total
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                {isAdmin ? (
                  <>This shipment has <strong className="text-slate-800">{internalCount} internal operational logs</strong> and <strong className="text-slate-800">{publicCount} public checkpoints</strong> recorded.</>
                ) : (
                  <>Viewing <strong className="text-slate-800">{publicCount} verified milestone checkpoints</strong> released by Red Bird logistics operations.</>
                )}
              </p>

              <button
                type="button"
                onClick={() => {
                  const elem = document.getElementById('shipment-notes-section');
                  elem?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-200"
              >
                <span>Jump to Notes Timeline</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Formal Branded PDF Dossier Card in Sidebar */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl space-y-4 border border-slate-700 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-red-600 text-white rounded-2xl shadow-md shadow-red-600/30">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">Formal PDF Dossier</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Branded Shipment Summary</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                  <Award size={10} />
                  A4 Official
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Formal cryptographic trade dossier incorporating all shipment details, contract EXP numbers, packing list styles, tracking milestones, and authenticated internal notes.
              </p>

              <div className="space-y-2 pt-1">
                {isAdmin ? (
                  <>
                    <button
                      onClick={handleDownloadBrandedPDF}
                      disabled={isExportingPDF}
                      className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-red-600/30 active:scale-95 flex items-center justify-center gap-2"
                    >
                      {isExportingPDF ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                      <span>{isExportingPDF ? 'Generating High-Res PDF...' : 'Download PDF Summary'}</span>
                    </button>

                    <button
                      onClick={() => setIsPdfModalOpen(true)}
                      className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-2"
                    >
                      <Eye size={13} />
                      <span>Preview Formal Document</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsAdminAuthModalOpen(true)}
                    className="w-full py-3 px-4 bg-slate-800 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <Lock size={13} className="text-red-400" />
                    <span>Unlock Admin PDF Summary</span>
                  </button>
                )}
              </div>
            </motion.div>

            {/* Modal for Expanded QR Code */}
            <AnimatePresence>
              {isQrExpanded && (
                <div 
                  className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
                  onClick={() => setIsQrExpanded(false)}
                >
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white max-w-sm w-full rounded-3xl p-8 text-center shadow-2xl border border-slate-200 space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-left">
                        <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Verification QR</span>
                        <h3 className="text-base font-black text-slate-900 uppercase">Tracking #{shipment.id}</h3>
                      </div>
                      <button 
                        onClick={() => setIsQrExpanded(false)}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-black"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200 flex justify-center">
                      <QRCodeSVG 
                        value={verificationUrl}
                        size={220}
                        level="H"
                        includeMargin={false}
                        fgColor="#0f172a"
                      />
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs text-slate-500 font-medium">
                        Instant scan for buyers, customs brokers, and freight forwarders to authenticate order integrity.
                      </p>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={handleDownloadQR}
                          className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Download size={14} />
                          Download
                        </button>
                        <button
                          onClick={handlePrintQR}
                          className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Printer size={14} />
                          Print
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="bg-slate-900 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                 <FileText size={80} />
              </div>
              
              <h3 className="text-xl font-black mb-1">Available Documents</h3>
              <p className="text-slate-400 text-xs mb-8">Securely download your shipment files.</p>

               <div className="space-y-4">
                 {[
                   { label: 'Shipment & Notes Audit Dossier (PDF)', type: 'PDF', ready: true, isDossier: true },
                   { label: 'Commercial Invoice', type: 'INV', ready: isVerified, isDossier: false },
                   { label: 'Final Packing List', type: 'PL', ready: isVerified, isDossier: false },
                   { label: 'Sales Contract', type: 'SC', ready: isVerified && !!shipment.salesContractNumber, isDossier: false },
                   { label: 'Certificate of Origin', type: 'CO', ready: isVerified && isClosed, isDossier: false },
                 ].map((doc, idx) => (
                   <div 
                     key={idx} 
                     onClick={() => {
                       if (doc.isDossier) {
                         if (isAdmin) {
                           handleDownloadBrandedPDF();
                         } else {
                           setIsAdminAuthModalOpen(true);
                         }
                       }
                     }}
                     className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                       doc.ready 
                         ? 'bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer pointer-events-auto active:scale-[0.98]' 
                         : 'opacity-40 border-white/5 cursor-not-allowed pointer-events-none'
                     } ${doc.isDossier ? 'ring-1 ring-red-500/40 bg-red-950/20' : ''}`}
                   >
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${doc.isDossier ? 'bg-red-600 text-white shadow-md shadow-red-600/30' : doc.ready ? 'bg-slate-700' : 'bg-slate-800'}`}>
                            {doc.isDossier && isExportingPDF ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                         </div>
                         <div>
                            <p className="text-sm font-bold flex items-center gap-1.5">
                              <span>{doc.label}</span>
                              {doc.isDossier && (
                                <span className="text-[9px] bg-red-600 text-white font-black px-1.5 py-0.2 rounded uppercase tracking-wider">
                                  Official
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                              {doc.isDossier 
                                ? (isAdmin ? 'Instant Branded PDF' : 'Staff Login Required') 
                                : doc.ready ? 'Download Available' : 'Processing...'}
                            </p>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>

              <div className="mt-12 pt-8 border-t border-white/10 text-center">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Need Assistance?</p>
                 <a href={`mailto:export@redbird-international.com`} className="text-red-500 text-sm font-bold hover:underline">Contact Expert Agent</a>
              </div>
            </motion.div>

            {/* Security Notice */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
               <div className="flex items-center gap-2 text-slate-900">
                  <ShieldCheck size={20} className="text-green-600" />
                  <h4 className="text-sm font-black uppercase tracking-tight">Security Protocol</h4>
               </div>
               <p className="text-xs text-slate-500 leading-relaxed">
                  This tracking link is strictly confidential and encrypted. 
                  Shipment verification is logged for security auditing. 
                  Validating against Master Tracking ID: <span className="font-bold text-slate-800">{shipment.id}</span>
               </p>
            </div>
          </div>
        </div>
      </main>

      {/* Admin Authentication Modal */}
      <AnimatePresence>
        {isAdminAuthModalOpen && (
          <div 
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsAdminAuthModalOpen(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white max-w-md w-full rounded-3xl p-8 shadow-2xl border border-slate-200 space-y-6"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center">
                    <Key size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase">Staff Authentication</h3>
                    <p className="text-[11px] text-slate-400">Unlock internal notes & operations logs</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAdminAuthModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-black"
                >
                  ✕
                </button>
              </div>

              {adminAuthError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{adminAuthError}</span>
                </div>
              )}

              {/* Passcode Login Form */}
              <form onSubmit={handlePasscodeLogin} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Operations Master Passcode
                  </label>
                  <input
                    type="password"
                    placeholder="Enter admin passcode (e.g. redbird2026)"
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-1 focus:ring-red-600 focus:outline-none"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAdminAuthenticating || !adminPasscode.trim()}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-red-600/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  {isAdminAuthenticating ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
                  <span>Unlock Operational Mode</span>
                </button>
              </form>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 absolute">
                  OR GOOGLE SSO
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isAdminAuthenticating}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign In with Corporate Account</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Formal Branded Dossier Preview & Export Modal */}
      <AnimatePresence>
        {isPdfModalOpen && (
          <div 
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-start p-2 sm:p-6 overflow-y-auto"
            onClick={() => setIsPdfModalOpen(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 max-w-5xl w-full rounded-3xl shadow-2xl flex flex-col my-auto overflow-hidden text-white"
            >
              {/* Modal Top Control Bar */}
              <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-600 text-white rounded-2xl shadow-md shadow-red-600/30">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black uppercase tracking-wider text-white">
                        Official Shipment Dossier & Status Audit
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-600/30 text-red-300 border border-red-500/30">
                        A4 Format
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Tracking #{shipment.id} &bull; Complete corporate summary with appended internal notes
                    </p>
                  </div>
                </div>

                {/* Modal Action Buttons */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleDownloadBrandedPDF}
                    disabled={isExportingPDF}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-red-600/30 active:scale-95 border border-red-500"
                    title="Download A4 PDF to your device"
                  >
                    {isExportingPDF ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                    <span>{isExportingPDF ? 'Generating...' : 'Download PDF (A4)'}</span>
                  </button>

                  <button
                    onClick={handlePrintDossier}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700"
                    title="Open Print Dialog"
                  >
                    <Printer size={14} />
                    <span className="hidden sm:inline">Print</span>
                  </button>

                  <button
                    onClick={() => setIsPdfModalOpen(false)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                    title="Close Preview"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Scrollable Document Preview Canvas */}
              <div className="p-4 sm:p-8 overflow-y-auto max-h-[75vh] bg-slate-950/70 flex justify-center">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-300 scale-[0.85] sm:scale-100 origin-top">
                  {renderDossierDocument()}
                </div>
              </div>

              {/* Modal Footer Bar */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 px-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Authenticated Cryptographic Document &bull; Generated from Red Bird Firestore ERP</span>
                </div>
                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  className="text-xs font-bold text-slate-400 hover:text-white underline"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Offscreen High-Res Render Container for html2canvas & jsPDF */}
      <div 
        style={{ 
          position: 'absolute', 
          left: '-9999px', 
          top: '0', 
          width: '850px', 
          backgroundColor: '#ffffff',
          overflow: 'visible' 
        }} 
        aria-hidden="true"
      >
        <div ref={pdfTemplateRef} style={{ width: '850px', backgroundColor: '#ffffff' }}>
          {renderDossierDocument()}
        </div>
      </div>

      {/* Floating PDF Download Success Notification */}
      <AnimatePresence>
        {pdfNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-white">Dossier Generated</div>
              <div className="text-[11px] text-slate-300 font-medium">{pdfNotification}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 text-center mt-auto">
         <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
            © {new Date().getFullYear()} {COMPANY_NAME} • Secure Global Hub
         </p>
      </footer>
    </div>
  );
};

export default React.memo(ShipmentTracker);
