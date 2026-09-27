import { authenticatedFetch } from '../src/services/authenticatedFetch';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Volume2, Globe2, Sparkles, Check, AlertCircle, 
  X, Plus, FileText, Send, Save, ArrowRight, ShieldCheck, 
  Package, Anchor, Ship, Plane, Search, Clock, ExternalLink, RefreshCw
} from 'lucide-react';
import { useVoiceToText, playAudioChime } from '../src/hooks/useVoiceToText';
import { db, auth, OperationType, handleFirestoreError } from '../src/firebase';
import { collection, doc, updateDoc, arrayUnion, addDoc, serverTimestamp } from 'firebase/firestore';
import { ShipmentNote, ShipmentProfile, PackingListItem } from '../types';

interface VoiceShipmentLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipments: any[];
  initialShipmentId?: string;
  onShipmentCreated?: (newShipment: any) => void;
  onOpenInFullEditor?: (prefilledData: any) => void;
}

export const VoiceShipmentLogModal: React.FC<VoiceShipmentLogModalProps> = ({
  isOpen,
  onClose,
  shipments,
  initialShipmentId,
  onShipmentCreated,
  onOpenInFullEditor
}) => {
  const [activeTab, setActiveTab] = useState<'note' | 'create-log'>('note');

  // Shipment Note Dictation States
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>(initialShipmentId || '');
  const [shipmentSearchQuery, setShipmentSearchQuery] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<ShipmentNote['category']>('Status Update');
  const [noteStatusTag, setNoteStatusTag] = useState<ShipmentNote['statusTag']>('Milestone');
  const [noteIsInternal, setNoteIsInternal] = useState(true);
  const [noteAuthor, setNoteAuthor] = useState('Sumon (Operations Director)');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteSuccessMessage, setNoteSuccessMessage] = useState<string | null>(null);

  // Quick Shipment Log Creation States
  const [logSpeechText, setLogSpeechText] = useState('');
  const [isParsingLog, setIsParsingLog] = useState(false);
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);
  const [extractedData, setExtractedData] = useState<Partial<ShipmentProfile>>({
    invoiceNumber: `RBI-INV-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    buyerName: 'Hanwha Corporation',
    portOfLoading: 'Chittagong Port (BDCGP), Bangladesh',
    portOfDischarge: 'Busan Port, South Korea',
    transportMode: 'Sea',
    totalQuantity: 2500,
    totalCartons: 50,
    totalGrossWeight: 750,
    priceType: 'Unit Price',
    advancePercentage: 30,
    currency: 'USD',
    shippingTerms: 'FOB Chittagong',
    status: 'In Planning'
  });

  // Sync initialShipmentId
  useEffect(() => {
    if (initialShipmentId) {
      setSelectedShipmentId(initialShipmentId);
    } else if (shipments.length > 0 && !selectedShipmentId) {
      setSelectedShipmentId(shipments[0].id || shipments[0].invoiceNumber);
    }
  }, [initialShipmentId, shipments]);

  // Set author name based on auth
  useEffect(() => {
    if (auth?.currentUser) {
      const user = auth.currentUser;
      const name = user.displayName || 
        (user.email === 'sumon.hanwha@gmail.com' ? 'Sumon (Operations Director)' :
         user.email === 'redbird.inc.co.bd@gmail.com' ? 'Red Bird Master Admin' : 'Operations Officer');
      setNoteAuthor(name);
    }
  }, []);

  // Voice Hook for Tab 1 (Shipment Note)
  const noteVoice = useVoiceToText({
    initialLanguage: 'en-US',
    continuous: true,
    onFinalTranscript: (chunk) => {
      const lower = chunk.toLowerCase().trim();

      // Check voice commands
      if (lower.includes('category customs') || lower.includes('customs clearance')) {
        setNoteCategory('Customs & Clearance');
        return;
      }
      if (lower.includes('category logistics') || lower.includes('freight')) {
        setNoteCategory('Freight & Logistics');
        return;
      }
      if (lower.includes('category inspection') || lower.includes('quality')) {
        setNoteCategory('Quality Inspection');
        return;
      }
      if (lower.includes('category status') || lower.includes('status update')) {
        setNoteCategory('Status Update');
        return;
      }
      if (lower.includes('category finance') || lower.includes('remittance')) {
        setNoteCategory('Financial & Remittance');
        return;
      }
      if (lower.includes('tag alert') || lower.includes('mark alert')) {
        setNoteStatusTag('Alert');
        return;
      }
      if (lower.includes('tag milestone') || lower.includes('mark milestone')) {
        setNoteStatusTag('Milestone');
        return;
      }
      if (lower.includes('tag cleared') || lower.includes('mark cleared')) {
        setNoteStatusTag('Cleared');
        return;
      }
      if (lower.includes('make public') || lower.includes('public visibility')) {
        setNoteIsInternal(false);
        return;
      }
      if (lower.includes('make internal') || lower.includes('internal only')) {
        setNoteIsInternal(true);
        return;
      }
      if (lower === 'clear note' || lower === 'reset note') {
        setNoteContent('');
        return;
      }
      if (lower === 'save note' || lower === 'submit note' || lower === 'save log') {
        triggerSaveNote();
        return;
      }

      setNoteContent(prev => prev ? `${prev} ${chunk}` : chunk);
    }
  });

  // Voice Hook for Tab 2 (Create Shipment Log)
  const logVoice = useVoiceToText({
    initialLanguage: 'en-US',
    continuous: true,
    onFinalTranscript: (chunk) => {
      setLogSpeechText(prev => {
        const next = prev ? `${prev} ${chunk}` : chunk;
        parseSpeechToShipmentFields(next);
        return next;
      });
    }
  });

  // Local fast heuristic parser + optional API call
  const parseSpeechToShipmentFields = (speech: string) => {
    const text = speech.toLowerCase();
    const update: Partial<ShipmentProfile> = {};

    // 1. Detect Buyer Name
    if (text.includes('hanwha')) update.buyerName = 'Hanwha Corporation (South Korea)';
    else if (text.includes('tommy') || text.includes('hilfiger')) update.buyerName = 'Tommy Hilfiger Inc.';
    else if (text.includes('zara') || text.includes('inditex')) update.buyerName = 'Inditex / ZARA Group (Spain)';
    else if (text.includes('ck') || text.includes('calvin klein')) update.buyerName = 'Calvin Klein Apparel';
    else if (text.includes('h&m') || text.includes('h and m') || text.includes('hennes')) update.buyerName = 'H&M Hennes & Mauritz';
    else if (text.includes('walmart')) update.buyerName = 'Walmart Stores Inc.';
    else if (text.includes('target')) update.buyerName = 'Target Brands Corp.';

    // 2. Detect Port of Destination / Discharge
    if (text.includes('busan') || text.includes('korea')) update.portOfDischarge = 'Busan Port, South Korea';
    else if (text.includes('rotterdam') || text.includes('netherlands')) update.portOfDischarge = 'Rotterdam Port, Netherlands';
    else if (text.includes('los angeles') || text.includes('la port') || text.includes('long beach')) update.portOfDischarge = 'Los Angeles Port (USLAX), USA';
    else if (text.includes('hamburg') || text.includes('germany')) update.portOfDischarge = 'Hamburg Port, Germany';
    else if (text.includes('tokyo') || text.includes('japan')) update.portOfDischarge = 'Tokyo Port, Japan';
    else if (text.includes('new york') || text.includes('newark')) update.portOfDischarge = 'New York / Newark Port, USA';

    // 3. Detect Transport Mode
    if (text.includes('air') || text.includes('flight') || text.includes('plane') || text.includes('airway')) {
      update.transportMode = 'Air';
    } else if (text.includes('sea') || text.includes('ocean') || text.includes('vessel') || text.includes('ship')) {
      update.transportMode = 'Sea';
    }

    // 4. Quantity & Cartons
    const qtyMatch = text.match(/(\d+[\d,]*)\s*(pcs|pieces|units|quantity|items|qty)?/i);
    if (qtyMatch) {
      const num = parseInt(qtyMatch[1].replace(/,/g, ''), 10);
      if (num > 0) update.totalQuantity = num;
    }

    const ctnMatch = text.match(/(\d+[\d,]*)\s*(cartons|boxes|ctns|ctn)/i);
    if (ctnMatch) {
      const num = parseInt(ctnMatch[1].replace(/,/g, ''), 10);
      if (num > 0) update.totalCartons = num;
    }

    // 5. Weight (gross/net)
    const weightMatch = text.match(/(\d+[\d,.]*)\s*(kg|kilos|kilograms|gross weight)/i);
    if (weightMatch) {
      const num = parseFloat(weightMatch[1].replace(/,/g, ''));
      if (num > 0) {
        update.totalGrossWeight = num;
        update.totalNetWeight = Math.round(num * 0.9);
      }
    }

    // 6. Payment Advance %
    const advanceMatch = text.match(/(\d+)\s*(%|percent)\s*(advance)?/i);
    if (advanceMatch) {
      const pct = parseInt(advanceMatch[1], 10);
      if (pct >= 0 && pct <= 100) update.advancePercentage = pct;
    }

    // 7. Garment / Item Name
    let itemName = 'RMG Export Product';
    if (text.includes('ladies sweater') || text.includes('sweater')) itemName = 'Ladies Knit Sweater';
    else if (text.includes('polo shirt') || text.includes('polo')) itemName = 'Classic Pique Polo Shirt';
    else if (text.includes('hooded fleece') || text.includes('hoodie')) itemName = 'Hooded Fleece Pullover';
    else if (text.includes('chinos') || text.includes('pant') || text.includes('trouser')) itemName = 'Cotton Twill Chinos';
    else if (text.includes('denim') || text.includes('jeans')) itemName = 'Men Denim Jeans';
    else if (text.includes('underwear') || text.includes('boxer')) itemName = 'Combed Cotton Boxers 3-Pack';
    else if (text.includes('t-shirt') || text.includes('tshirt')) itemName = '220 GSM Cotton Crewneck T-Shirt';

    const packingItem: PackingListItem = {
      id: crypto.randomUUID(),
      itemDescription: itemName,
      itemType: itemName,
      brandName: update.buyerName?.split(' ')[0] || 'Hanwha',
      styleNumber: `RB-STY-${Math.floor(1000 + Math.random() * 9000)}`,
      colorName: 'Standard Assorted',
      sizes: { S: 50, M: 100, L: 100, XL: 50, '2XL': 30 },
      totalQty: update.totalQuantity || 300,
      unitPrice: 6.50,
      totalAmount: (update.totalQuantity || 300) * 6.50,
      totalCartons: update.totalCartons || 15
    };

    update.items = [packingItem];
    update.totalAmount = packingItem.totalAmount;

    setExtractedData(prev => ({
      ...prev,
      ...update
    }));
  };

  // Background Neural Parser (Gemini) when spoken text is recorded
  useEffect(() => {
    if (!logSpeechText || logSpeechText.trim().length < 15) return;
    const timer = setTimeout(async () => {
      try {
        setIsParsingLog(true);
        const res = await authenticatedFetch('/api/voice-parse-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: logSpeechText, language: logVoice.language })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && !data.isFallback) {
            setExtractedData(prev => ({
              ...prev,
              buyerName: data.buyerName || prev.buyerName,
              portOfLoading: data.portOfLoading || prev.portOfLoading,
              portOfDischarge: data.portOfDischarge || prev.portOfDischarge,
              transportMode: data.transportMode || prev.transportMode,
              totalQuantity: data.quantity || prev.totalQuantity,
              totalCartons: data.cartons || prev.totalCartons,
              totalGrossWeight: data.grossWeightKg || prev.totalGrossWeight,
              advancePercentage: data.advancePercentage || prev.advancePercentage
            }));
          }
        }
      } catch (e) {
        // Silent fallback to local heuristics
      } finally {
        setIsParsingLog(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [logSpeechText, logVoice.language]);

  // Submit Shipment Note to Firestore
  const triggerSaveNote = async () => {
    if (!noteContent.trim()) {
      alert("Please dictate or type a note message first.");
      return;
    }
    if (!selectedShipmentId) {
      alert("Please select a target shipment from the list.");
      return;
    }
    if (!db) {
      alert("Firestore database is offline.");
      return;
    }

    setIsSubmittingNote(true);
    setNoteSuccessMessage(null);

    const newNote: ShipmentNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      author: noteAuthor.trim() || 'Sumon (Operations Director)',
      authorEmail: auth?.currentUser?.email || undefined,
      content: noteContent.trim(),
      category: noteCategory,
      statusTag: noteStatusTag,
      isInternal: noteIsInternal,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = doc(db, 'shipments', selectedShipmentId);
      await updateDoc(docRef, {
        notes: arrayUnion(newNote),
        notesUpdatedAt: new Date().toISOString()
      });

      playAudioChime('success');
      setNoteSuccessMessage(`Success! Voice note logged to shipment #${selectedShipmentId}`);
      setNoteContent('');
      setTimeout(() => setNoteSuccessMessage(null), 4000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `shipments/${selectedShipmentId}`);
      alert("Failed to write shipment note to database. Please check admin permissions.");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Save new shipment log directly into Firestore
  const handleSaveShipmentLog = async () => {
    if (!db) return;
    setIsCreatingShipment(true);
    try {
      const newInvoiceNumber = extractedData.invoiceNumber || `RBI-INV-${Date.now().toString().slice(-6)}`;
      const newShipmentDoc = {
        ...extractedData,
        invoiceNumber: newInvoiceNumber,
        createdAt: serverTimestamp(),
        status: extractedData.status || 'In Planning',
        trackingStatus: 'live',
        qrCodeData: `https://redbird-international.com/#verify?id=${newInvoiceNumber}`,
        notes: [
          {
            id: `note-${Date.now()}-init`,
            author: noteAuthor,
            content: `Shipment log created via Voice-to-Text Microphone Dictation: "${logSpeechText || 'Voice consignment initialized'}"`,
            category: 'Status Update',
            statusTag: 'Milestone',
            isInternal: true,
            createdAt: new Date().toISOString()
          }
        ]
      };

      const docRef = await addDoc(collection(db, 'shipments'), newShipmentDoc);
      playAudioChime('success');
      alert(`Consignment #${newInvoiceNumber} recorded successfully in database!`);
      if (onShipmentCreated) {
        onShipmentCreated({ id: docRef.id, ...newShipmentDoc });
      }
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'shipments');
      alert("Failed to create shipment log. Verify database permissions.");
    } finally {
      setIsCreatingShipment(false);
    }
  };

  const handleOpenFullEditor = () => {
    if (onOpenInFullEditor) {
      onOpenInFullEditor(extractedData);
      onClose();
    }
  };

  // Stop recording when closing modal
  useEffect(() => {
    if (!isOpen) {
      noteVoice.stopListening();
      logVoice.stopListening();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentShipment = shipments.find(s => (s.id === selectedShipmentId || s.invoiceNumber === selectedShipmentId));

  const filteredShipments = shipments.filter(s => {
    const q = shipmentSearchQuery.toLowerCase();
    const idMatch = (s.id || '').toLowerCase().includes(q) || (s.invoiceNumber || '').toLowerCase().includes(q);
    const buyerMatch = (s.buyerName || s.clientName || '').toLowerCase().includes(q);
    return idMatch || buyerMatch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-600/30">
              <Mic size={20} className="text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight uppercase">
                  Voice-to-Text Operations Hub
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 text-[10px] font-black uppercase tracking-wider border border-red-500/30">
                  Microphone API
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Dictate operational audit notes or synthesize new consignment logs with voice input
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('note');
              logVoice.stopListening();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'note'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileText size={15} className={activeTab === 'note' ? 'text-red-600' : 'text-slate-400'} />
            <span>1. Dictate Shipment Note / Log</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('create-log');
              noteVoice.stopListening();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'create-log'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles size={15} className={activeTab === 'create-log' ? 'text-red-600' : 'text-slate-400'} />
            <span>2. Create Consignment via Voice</span>
          </button>
        </div>

        {/* Body Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: Dictate Shipment Note */}
          {activeTab === 'note' && (
            <div className="space-y-5">
              
              {/* Target Shipment Selector */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Package size={14} className="text-red-600" />
                    <span>Select Target Shipment</span>
                  </label>
                  <div className="relative w-full sm:w-64">
                    <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search ID, buyer name..."
                      value={shipmentSearchQuery}
                      onChange={(e) => setShipmentSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1">
                  {filteredShipments.map(s => {
                    const sid = s.id || s.invoiceNumber;
                    const isSelected = selectedShipmentId === sid;
                    return (
                      <button
                        key={sid}
                        type="button"
                        onClick={() => setSelectedShipmentId(sid)}
                        className={`text-left p-2.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-red-50/80 border-red-500 ring-2 ring-red-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-xs font-black text-slate-900 truncate">
                            #{sid}
                          </span>
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {s.status || 'Active'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate font-semibold mt-0.5">
                          {s.buyerName || s.clientName || 'Overseas Buyer'}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {currentShipment && (
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-200 text-xs text-slate-600">
                    <span className="text-[10px] font-black uppercase text-slate-400">Target Selected:</span>
                    <span className="font-bold text-slate-900">{currentShipment.buyerName || currentShipment.clientName}</span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="font-mono text-red-600 font-bold">#{selectedShipmentId}</span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="text-[11px] text-slate-500">{currentShipment.portOfDischarge || 'Export Corridor'}</span>
                  </div>
                )}
              </div>

              {/* Note Metadata Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Category */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Audit Category
                  </label>
                  <select
                    value={noteCategory}
                    onChange={(e) => setNoteCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-1 focus:ring-red-600 focus:outline-none"
                  >
                    <option value="Status Update">Status Update</option>
                    <option value="Customs & Clearance">Customs & Clearance</option>
                    <option value="Freight & Logistics">Freight & Logistics</option>
                    <option value="Quality Inspection">Quality Inspection</option>
                    <option value="Financial & Remittance">Financial & Remittance</option>
                    <option value="General">General Comment</option>
                  </select>
                </div>

                {/* Milestone / Severity */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Severity / Status Tag
                  </label>
                  <select
                    value={noteStatusTag}
                    onChange={(e) => setNoteStatusTag(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-1 focus:ring-red-600 focus:outline-none"
                  >
                    <option value="Milestone">Milestone (Green Check)</option>
                    <option value="Cleared">Cleared (Customs Verified)</option>
                    <option value="In Progress">In Progress (Transit)</option>
                    <option value="Info">Info / Communication</option>
                    <option value="Alert">Alert (Priority Issue)</option>
                  </select>
                </div>

                {/* Visibility */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Confidentiality
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setNoteIsInternal(true)}
                      className={`py-1 text-[10px] font-black rounded-lg transition-all ${
                        noteIsInternal ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      INTERNAL
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoteIsInternal(false)}
                      className={`py-1 text-[10px] font-black rounded-lg transition-all ${
                        !noteIsInternal ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      PUBLIC
                    </button>
                  </div>
                </div>
              </div>

              {/* Dictation Live Control Center */}
              <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Big Pulsing Mic Toggle */}
                    <button
                      type="button"
                      onClick={noteVoice.toggleListening}
                      className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer ${
                        noteVoice.isListening
                          ? 'bg-red-600 text-white ring-8 ring-red-600/30 animate-pulse'
                          : 'bg-white hover:bg-slate-100 text-slate-900'
                      }`}
                      title={noteVoice.isListening ? 'Click to stop listening' : 'Click to start voice dictation'}
                    >
                      {noteVoice.isListening ? (
                        <>
                          <span className="absolute -inset-1 rounded-2xl bg-red-400 animate-ping opacity-75"></span>
                          <Mic size={24} className="relative text-white" />
                        </>
                      ) : (
                        <Mic size={24} className="text-red-600" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${noteVoice.isListening ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`}></span>
                        <h3 className="text-sm font-black uppercase tracking-wider">
                          {noteVoice.isListening ? 'Microphone Active • Listening...' : 'Microphone Ready'}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400">
                        {noteVoice.isListening 
                          ? 'Speak your shipment log or note into the mic. It transcribes in real-time.' 
                          : 'Tap the mic to dictate status, inspection findings, or clearance updates.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Language Switcher */}
                    <button
                      type="button"
                      onClick={() => noteVoice.setLanguage(prev => prev === 'en-US' ? 'bn-BD' : 'en-US')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                      title="Toggle speech recognition language"
                    >
                      <Globe2 size={13} className="text-red-400" />
                      <span>{noteVoice.language === 'en-US' ? 'EN (US)' : 'বাংলা (BD)'}</span>
                    </button>

                    {/* Audio Level Wave */}
                    {noteVoice.isListening && (
                      <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl">
                        {[0.3, 0.6, 1.0, 0.7, 0.4].map((m, i) => {
                          const height = Math.max(4, Math.min(22, Math.round((noteVoice.volumeLevel * m * 0.25) + 4)));
                          return (
                            <div
                              key={i}
                              style={{ height: `${height}px` }}
                              className="w-1 bg-red-500 rounded-full transition-all duration-75"
                            />
                          );
                        })}
                        <span className="text-[10px] font-mono text-red-400 ml-1 font-bold">
                          {noteVoice.volumeLevel}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Interim Transcript Bubble */}
                {noteVoice.isListening && (
                  <div className="p-3 bg-slate-800/90 rounded-2xl border border-slate-700 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-red-400 font-bold shrink-0 text-[10px] uppercase tracking-wider">Transcribing:</span>
                      <span className="italic text-slate-100 truncate">
                        {noteVoice.interimTranscript || 'Awaiting voice input...'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={noteVoice.resetTranscript}
                      className="text-[10px] font-bold text-slate-400 hover:text-white uppercase transition-colors shrink-0"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {/* Editable Final Note Textarea */}
                <div>
                  <div className="flex justify-between items-center mb-1.5 text-xs">
                    <span className="text-slate-400 font-bold">Transcribed Note Content:</span>
                    <span className="font-mono text-slate-500 text-[11px]">{noteContent.length}/1000</span>
                  </div>
                  <textarea
                    rows={4}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Transcribed voice note appears here. You can also type or make edits freely before submitting..."
                    className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-medium text-slate-100 focus:outline-none focus:border-red-500 leading-relaxed resize-none"
                    maxLength={1000}
                  />
                </div>

                {/* Voice Commands Assistance Chips */}
                <div className="pt-2 border-t border-slate-800 flex items-center flex-wrap gap-1.5 text-[10px]">
                  <span className="text-slate-400 font-bold uppercase tracking-wider mr-1">Voice Commands:</span>
                  {[
                    { label: '"Category Customs"', action: () => setNoteCategory('Customs & Clearance') },
                    { label: '"Tag Alert"', action: () => setNoteStatusTag('Alert') },
                    { label: '"Tag Cleared"', action: () => setNoteStatusTag('Cleared') },
                    { label: '"Tag Milestone"', action: () => setNoteStatusTag('Milestone') },
                    { label: '"Make Public"', action: () => setNoteIsInternal(false) },
                    { label: '"Clear Note"', action: () => setNoteContent('') }
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={chip.action}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition-colors"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Success Notification Banner */}
              {noteSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-fade-in">
                  <Check size={16} className="text-emerald-600" />
                  <span>{noteSuccessMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNoteContent('')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Clear Form
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={triggerSaveNote}
                    disabled={isSubmittingNote || !noteContent.trim() || !selectedShipmentId}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    {isSubmittingNote ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Saving Note...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Save Note to Shipment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Quick Voice Shipment Log Creator */}
          {activeTab === 'create-log' && (
            <div className="space-y-6">
              
              {/* Dictation Box */}
              <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={logVoice.toggleListening}
                      className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer ${
                        logVoice.isListening
                          ? 'bg-red-600 text-white ring-8 ring-red-600/30 animate-pulse'
                          : 'bg-white hover:bg-slate-100 text-slate-900'
                      }`}
                    >
                      {logVoice.isListening ? (
                        <>
                          <span className="absolute -inset-1 rounded-2xl bg-red-400 animate-ping opacity-75"></span>
                          <Mic size={24} className="relative text-white" />
                        </>
                      ) : (
                        <Mic size={24} className="text-red-600" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${logVoice.isListening ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`}></span>
                        <h3 className="text-sm font-black uppercase tracking-wider">
                          {logVoice.isListening ? 'Continuous Voice Dictation Active' : 'Tap Mic to Dictate Entire Consignment'}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400">
                        Speak naturally: buyer name, garment style, destination port, carton count, and transport mode.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => logVoice.setLanguage(prev => prev === 'en-US' ? 'bn-BD' : 'en-US')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <Globe2 size={13} className="text-red-400" />
                      <span>{logVoice.language === 'en-US' ? 'EN (US)' : 'বাংলা (BD)'}</span>
                    </button>

                    {logVoice.isListening && (
                      <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl">
                        {[0.3, 0.6, 1.0, 0.7, 0.4].map((m, i) => {
                          const height = Math.max(4, Math.min(22, Math.round((logVoice.volumeLevel * m * 0.25) + 4)));
                          return (
                            <div
                              key={i}
                              style={{ height: `${height}px` }}
                              className="w-1 bg-red-500 rounded-full transition-all duration-75"
                            />
                          );
                        })}
                        <span className="text-[10px] font-mono text-red-400 ml-1 font-bold">
                          {logVoice.volumeLevel}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Spoken Speech Transcript Box */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-xs text-slate-400">
                    <span>Live Spoken Consignment Stream:</span>
                    {logSpeechText && (
                      <button
                        type="button"
                        onClick={() => {
                          setLogSpeechText('');
                          logVoice.resetTranscript();
                        }}
                        className="text-[10px] font-bold text-slate-400 hover:text-red-400 uppercase"
                      >
                        Reset Transcript
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={logSpeechText}
                    onChange={(e) => {
                      setLogSpeechText(e.target.value);
                      parseSpeechToShipmentFields(e.target.value);
                    }}
                    placeholder='Example: "Create shipment for Tommy Hilfiger, 1500 Polo Shirts to Rotterdam Port, Sea freight from Chittagong, 30 cartons, 450 kg gross weight, 30% advance payment."'
                    className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-100 focus:outline-none focus:border-red-500 resize-none leading-relaxed"
                  />
                </div>

                {/* Example Quick Dictation Prompts */}
                <div className="flex items-center flex-wrap gap-2 text-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Quick Presets:</span>
                  {[
                    "Hanwha 5000 Ladies Sweaters to Busan Sea freight 50 cartons",
                    "Tommy Hilfiger 1200 Polo Shirts to Rotterdam Port 30% advance",
                    "Zara 3000 Hooded Fleece to Los Angeles Air freight urgent"
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setLogSpeechText(preset);
                        parseSpeechToShipmentFields(preset);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extracted Structured Field Preview Matrix */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-red-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Real-Time Extracted Consignment Parameters
                    </h3>
                    {isParsingLog && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-bold animate-pulse">
                        <RefreshCw size={10} className="animate-spin" />
                        <span>AI Parsing...</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    Draft ID: {extractedData.invoiceNumber}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white p-3 rounded-2xl border border-slate-200">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Buyer / Consignee</span>
                    <input
                      type="text"
                      value={extractedData.buyerName || ''}
                      onChange={(e) => setExtractedData(p => ({ ...p, buyerName: e.target.value }))}
                      className="w-full text-xs font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-red-600 mt-1"
                    />
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-slate-200">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Destination Port</span>
                    <input
                      type="text"
                      value={extractedData.portOfDischarge || ''}
                      onChange={(e) => setExtractedData(p => ({ ...p, portOfDischarge: e.target.value }))}
                      className="w-full text-xs font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-red-600 mt-1"
                    />
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-slate-200">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Total Quantity (Pcs)</span>
                    <input
                      type="number"
                      value={extractedData.totalQuantity || 0}
                      onChange={(e) => setExtractedData(p => ({ ...p, totalQuantity: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full text-xs font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-red-600 mt-1"
                    />
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-slate-200">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Carton Count</span>
                    <input
                      type="number"
                      value={extractedData.totalCartons || 0}
                      onChange={(e) => setExtractedData(p => ({ ...p, totalCartons: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full text-xs font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-red-600 mt-1"
                    />
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-slate-200">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Transport Mode</span>
                    <select
                      value={extractedData.transportMode || 'Sea'}
                      onChange={(e) => setExtractedData(p => ({ ...p, transportMode: e.target.value as any }))}
                      className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none mt-1"
                    >
                      <option value="Sea">Sea (Ocean Freight)</option>
                      <option value="Air">Air (Air Express)</option>
                    </select>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-slate-200">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Gross Weight (KG)</span>
                    <input
                      type="number"
                      value={extractedData.totalGrossWeight || 0}
                      onChange={(e) => setExtractedData(p => ({ ...p, totalGrossWeight: parseFloat(e.target.value) || 0 }))}
                      className="w-full text-xs font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-red-600 mt-1"
                    />
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-slate-200">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Advance Terms</span>
                    <input
                      type="number"
                      value={extractedData.advancePercentage || 0}
                      onChange={(e) => setExtractedData(p => ({ ...p, advancePercentage: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full text-xs font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-red-600 mt-1"
                    />
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-slate-200">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Initial Status</span>
                    <select
                      value={extractedData.status || 'In Planning'}
                      onChange={(e) => setExtractedData(p => ({ ...p, status: e.target.value as any }))}
                      className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none mt-1"
                    >
                      <option value="In Planning">In Planning</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                </div>

                {extractedData.items && extractedData.items.length > 0 && (
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-slate-400">Garment Item:</span>
                      <span className="font-bold text-slate-900">{extractedData.items[0].itemDescription}</span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="font-mono text-slate-600 font-bold">{extractedData.items[0].styleNumber}</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600">
                      Est. Total: ${extractedData.items[0].totalAmount?.toLocaleString()} USD
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleOpenFullEditor}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <ExternalLink size={14} />
                  <span>Open in Full Shipment Editor</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveShipmentLog}
                    disabled={isCreatingShipment || !extractedData.buyerName}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    {isCreatingShipment ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Creating Consignment...</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        <span>Instant Save Shipment Log</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>Red Bird International &bull; ISO 9001 / BGMEA Verified Real-Time Audio Engine</span>
          </div>
          <span>Shortcut: Press Alt + V or Alt + M to activate microphone anywhere in Admin Portal</span>
        </div>

      </div>
    </div>
  );
};

export default VoiceShipmentLogModal;
