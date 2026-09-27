import { authenticatedFetch } from '../src/services/authenticatedFetch';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, MicOff, Volume2, VolumeX, X, Send, Sparkles, 
  Search, ArrowRight, ShieldCheck, Truck, Package, 
  ExternalLink, FileText, AlertCircle, Compass, RefreshCw,
  CheckCircle2, Download, Check, Layers, Bot, FileSpreadsheet,
  Boxes, FileCheck2, Calendar, MapPin, SlidersHorizontal, Anchor, Ship
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../src/firebase';
import { collection, doc, getDoc, getDocs, query, where, limit, updateDoc, orderBy } from 'firebase/firestore';
import { requestAiDraftExportDocuments, AiDraftResponse } from '../src/services/aiDocumentService';
import { saveMemory, getRelevantMemories, AIMemory } from '../src/lib/memory';

export interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
  onFilterShipments?: (searchTerm: string) => void;
  shipments: any[];
  onUpdateShipmentStatus?: (shipmentId: string, newStatus: string, notes?: string) => Promise<boolean>;
  onSelectShipmentForDocument?: (shipmentId: string) => void;
  onExecuteAction?: (action: string, payload?: any) => void;
}

export interface VoiceQueryResult {
  type: 
    | 'shipment_updates_summary'
    | 'shipment_status'
    | 'shipment_update_action'
    | 'document_draft'
    | 'shipment_filter'
    | 'navigation'
    | 'general';
  title: string;
  message: string;
  badge?: string;
  data?: any;
  actionLabel?: string;
  action?: () => void;
  secondaryActionLabel?: string;
  secondaryAction?: () => void;
}

function playAudioCue(type: 'start' | 'success' | 'error') {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'start') {
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.21);
    }
  } catch {
    // Ignore audio context autoplay restriction
  }
}

export const VoiceAssistantModal: React.FC<VoiceAssistantProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onFilterShipments,
  shipments,
  onUpdateShipmentStatus,
  onSelectShipmentForDocument,
  onExecuteAction
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [language, setLanguage] = useState<'en-US' | 'bn-BD'>('en-US');
  const [voiceFeedback, setVoiceFeedback] = useState(true);
  const [continuousMode, setContinuousMode] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingDraft, setProcessingDraft] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [result, setResult] = useState<VoiceQueryResult | null>(null);
  const [textInput, setTextInput] = useState('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [memories, setMemories] = useState<AIMemory[]>([]);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isComponentMounted = useRef(true);

  // Initialize Speech Recognition
  useEffect(() => {
    isComponentMounted.current = true;
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis || null;

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = true;
        recog.maxAlternatives = 1;

        recog.onstart = () => {
          setIsListening(true);
          setErrorNotice(null);
          playAudioCue('start');
        };

        recog.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = 0; i < event.results.length; i++) {
            const piece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += piece;
            } else {
              interim += piece;
            }
          }
          if (interim) setInterimTranscript(interim);
          if (final) {
            setTranscript(final);
            setInterimTranscript('');
            processVoiceCommand(final);
          }
        };

        recog.onerror = (event: any) => {
          console.warn('Speech recognition warning:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setErrorNotice('Microphone access is blocked. Please allow microphone permissions in browser settings.');
          } else if (event.error === 'no-speech') {
            // benign
          } else {
            setErrorNotice(`Audio capture: ${event.error}. You can also type commands in the box below.`);
          }
        };

        recog.onend = () => {
          setIsListening(false);
          setInterimTranscript('');
        };

        recognitionRef.current = recog;
      }
    }

    return () => {
      isComponentMounted.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, []);

  // Update recognition language dynamically
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  // Start listening automatically when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorNotice(null);
      setTranscript('');
      setInterimTranscript('');
      const timer = setTimeout(() => {
        startListening();
      }, 350);
      return () => clearTimeout(timer);
    } else {
      stopListening();
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    }
  }, [isOpen]);

  // Fetch memories when modal opens
  useEffect(() => {
    if (isOpen) {
      getRelevantMemories().then(setMemories);
    }
  }, [isOpen]);

  // Humanized Neural Voice Synthesis (Server-Side High Quality)
  const playNeuralAudio = async (base64Data: string) => {
    if (!voiceFeedback || typeof window === 'undefined') return;
    
    try {
      if (synthRef.current) synthRef.current.cancel();
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const arrayBuffer = bytes.buffer;
      const dataView = new DataView(arrayBuffer);
      const float32Array = new Float32Array(arrayBuffer.byteLength / 2);
      
      for (let i = 0; i < float32Array.length; i++) {
        float32Array[i] = dataView.getInt16(i * 2, true) / 32768;
      }
      
      const buffer = audioCtx.createBuffer(1, float32Array.length, 24000);
      buffer.getChannelData(0).set(float32Array);
      
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start();
    } catch (e) {
      console.warn('Neural playback error:', e);
    }
  };

  const speakText = (text: string) => {
    if (!voiceFeedback || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = language;
      
      // Select best voice if available
      const voices = window.speechSynthesis.getVoices();
      if (language === 'bn-BD') {
        const bnVoice = voices.find(v => v.lang.includes('bn') || v.lang.includes('BD'));
        if (bnVoice) utterance.voice = bnVoice;
      } else {
        const enVoice = voices.find(v => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')) && v.lang.includes('en'));
        if (enVoice) utterance.voice = enVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      setErrorNotice('Web Speech API is not supported in this browser. You can type commands in the input below.');
      return;
    }
    try {
      recognitionRef.current.lang = language;
      recognitionRef.current.start();
    } catch {
      // already listening or starting
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  const handleVoiceTrigger = () => {
    if (isListening) {
      stopListening();
      if (transcript.trim()) {
        processVoiceCommand(transcript);
      }
    } else {
      setTranscript('');
      setInterimTranscript('');
      startListening();
    }
  };

  // MAIN VOICE COMMAND INTERPRETER
  const processVoiceCommand = async (rawQuery: string) => {
    const q = rawQuery.trim().toLowerCase();
    if (!q) return;

    setProcessing(true);
    setLastQuery(rawQuery);
    setErrorNotice(null);

    try {
      // 1. Fetch relevant memories for context
      const currentMemories = await getRelevantMemories();
      
      // 2. Connect to the specialized Voice Command route
      const res = await authenticatedFetch('/api/voice-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: rawQuery,
          memories: currentMemories,
          shipmentsCount: shipments.length,
          context: {
            language: language
          }
        })
      });

      if (!res.ok) throw new Error(`Voice API failed: ${res.status}`);
      const data = await res.json();
      
      const replyText = data.speechResponse || data.reply;
      const action = data.action;
      const actionPayload = data.actionPayload;
      const suggestedMemories = data.suggestedMemories || [];

      playAudioCue('success');
      
      if (data.audio) {
        playNeuralAudio(data.audio);
      } else {
        speakText(replyText);
      }

      // Handle Self-Learning (Save new memories)
      if (suggestedMemories.length > 0) {
        for (const m of suggestedMemories) {
          await saveMemory(m);
        }
        getRelevantMemories().then(setMemories);
      }

      // Display the AI response in the UI
      setResult({
        type: action && action !== 'GENERAL_ANSWER' ? 'navigation' : 'general',
        title: 'Scarlet AI Assistant',
        badge: suggestedMemories.length > 0 ? 'Memory Updated' : 'Smart Response',
        message: replyText,
        data: { action, actionPayload }
      });

      // Execute actions returned by the AI
      if (action && action !== 'GENERAL_ANSWER') {
        // Add a small delay for natural feel
        setTimeout(() => {
          if (onExecuteAction) {
            onExecuteAction(action, actionPayload);
            onClose();
          } else if (action === 'NAVIGATE_TAB' && actionPayload?.targetTab) {
            onNavigateTab(actionPayload.targetTab);
            onClose();
          }
        }, 1500);
      }

    } catch (err: any) {
      console.error('Error processing voice query:', err);
      // Basic keyword fallback if API fails
      if (q.includes('shipment') || q.includes('update') || q.includes('status')) {
        // ... (Original keyword logic could go here as fallback, but kept simple for now)
        setErrorNotice('I experienced a connection issue, but I am still listening. Please repeat your instruction.');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      stopListening();
      processVoiceCommand(textInput);
      setTextInput('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[75] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="bg-slate-900 border border-slate-800 text-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Ambient Glowing Background Elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-800/90 relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/30">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight uppercase">Admin Voice Activation Command</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                  Browser STT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Verbally request shipment updates or generate AI export document drafts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex bg-slate-800 rounded-xl p-1 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setLanguage('en-US')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  language === 'en-US' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('bn-BD')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  language === 'bn-BD' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                বাংলা
              </button>
            </div>

            {/* Audio Feedback Toggle */}
            <button
              type="button"
              onClick={() => setVoiceFeedback(!voiceFeedback)}
              title={voiceFeedback ? 'Voice replies enabled' : 'Voice replies muted'}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              {voiceFeedback ? <Volume2 size={16} className="text-emerald-400" /> : <VolumeX size={16} className="text-slate-500" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 pr-1 py-4 space-y-5 relative z-10 custom-scrollbar">

          {/* Central Microphone Visualizer */}
          <div className="py-4 flex flex-col items-center justify-center relative">
            <div className="relative">
              {/* Pulsing Ripple Rings when Listening */}
              {isListening && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-full bg-red-600/30 blur-sm pointer-events-none"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.7, 1], opacity: [0.35, 0, 0.35] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-full bg-red-500/20 blur-md pointer-events-none"
                  />
                </>
              )}

              {/* Main Microphone Button */}
              <button
                type="button"
                onClick={handleVoiceTrigger}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 relative z-10 ${
                  isListening
                    ? 'bg-gradient-to-tr from-red-600 to-rose-500 text-white ring-4 ring-red-500/40 shadow-red-600/50 scale-105 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 active:scale-95'
                }`}
              >
                {isListening ? <Mic size={38} className="animate-bounce" /> : <MicOff size={34} />}
              </button>
            </div>

            {/* Audio Wave Bars when listening */}
            {isListening && (
              <div className="flex items-center gap-1.5 mt-3">
                {[0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.7].map((height, i) => (
                  <motion.span
                    key={i}
                    animate={{ height: ['8px', `${height * 24}px`, '8px'] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1, ease: 'easeInOut' }}
                    className="w-1 bg-red-500 rounded-full"
                  />
                ))}
              </div>
            )}

            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
              {isListening ? (
                <span className="text-red-400 flex items-center gap-1.5 justify-center">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block"></span>
                  Listening... Speak your command now
                </span>
              ) : (
                'Tap microphone to speak or type command'
              )}
            </p>

            {/* Live Transcript Bubble */}
            <div className="mt-3 min-h-[48px] w-full bg-slate-950/70 rounded-2xl p-3.5 border border-slate-800/80 flex items-center justify-center text-center">
              {interimTranscript ? (
                <p className="text-xs sm:text-sm font-semibold text-amber-300 italic animate-pulse">
                  "{interimTranscript}..."
                </p>
              ) : transcript ? (
                <p className="text-xs sm:text-sm font-semibold text-white italic">
                  "{transcript}"
                </p>
              ) : isListening ? (
                <p className="text-xs text-slate-500 italic">
                  Try: "Give me shipment updates" or "Generate document draft for shipment #1042"
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Ready. Click the microphone or choose a quick command below.
                </p>
              )}
            </div>
          </div>

          {/* Loading Indicator for AI Drafting */}
          {processingDraft && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/60 to-slate-900 border border-red-500/30 text-white flex items-center gap-3">
              <RefreshCw size={18} className="text-red-400 animate-spin shrink-0" />
              <div>
                <p className="text-xs font-bold">Synthesizing AI Export Document Draft...</p>
                <p className="text-[11px] text-slate-400">Gemini 3.8 Flash is preparing commercial invoice, packing list, HS codes, and weights.</p>
              </div>
            </div>
          )}

          {/* Query Result / Feedback Card */}
          {result && !processingDraft && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-4 shadow-xl"
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
                    {result.type === 'document_draft' ? (
                      <FileText size={18} />
                    ) : result.type === 'shipment_update_action' ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : result.type === 'shipment_updates_summary' ? (
                      <Ship size={18} className="text-blue-400" />
                    ) : (
                      <Package size={18} />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black uppercase text-white tracking-wide">
                      {result.title}
                    </h4>
                    {result.badge && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {result.badge}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  Executed
                </span>
              </div>

              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                {result.message}
              </p>

              {/* SPECIFIC VIEW: DOCUMENT DRAFT CARD */}
              {result.type === 'document_draft' && result.data?.draft && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-200 border-b border-slate-800 pb-2">
                    <span className="text-red-400 font-mono">Invoice: {result.data.draft.commercialInvoice?.docNumber}</span>
                    <span className="text-emerald-400">${result.data.totalValue?.toLocaleString()} USD</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div><span className="text-slate-500">Buyer:</span> {result.data.draft.commercialInvoice?.buyerName}</div>
                    <div><span className="text-slate-500">Incoterms:</span> {result.data.draft.commercialInvoice?.incoterms || 'FOB Chittagong'}</div>
                    <div><span className="text-slate-500">Total Volume:</span> {result.data.totalPcs?.toLocaleString()} Pcs</div>
                    <div><span className="text-slate-500">Export Cartons:</span> {result.data.draft.packingList?.totalCartons || 120} Ctns</div>
                  </div>
                  {result.data.draft.aiComplianceInsights?.hsCodeRationale && (
                    <div className="p-2.5 rounded-lg bg-slate-950 text-[11px] text-slate-400 border border-slate-800">
                      <span className="text-amber-400 font-bold">AI Compliance: </span>
                      {result.data.draft.aiComplianceInsights.hsCodeRationale}
                    </div>
                  )}
                </div>
              )}

              {/* SPECIFIC VIEW: SHIPMENT UPDATES SUMMARY */}
              {result.type === 'shipment_updates_summary' && result.data && (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 font-bold block">Active Runs</span>
                      <span className="text-sm font-black text-white">{result.data.activeCount}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-blue-400 font-bold block">On Ocean</span>
                      <span className="text-sm font-black text-blue-400">{result.data.onWaterCount}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-amber-400 font-bold block">Port Clear</span>
                      <span className="text-sm font-black text-amber-400">{result.data.clearanceCount}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-emerald-400 font-bold block">Delivered</span>
                      <span className="text-sm font-black text-emerald-400">{result.data.deliveredCount}</span>
                    </div>
                  </div>

                  {/* Top Shipment Snapshots */}
                  {result.data.recentShipments && result.data.recentShipments.length > 0 && (
                    <div className="space-y-1.5">
                      {result.data.recentShipments.map((s: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-white">#{s.id}</span>
                            <span className="text-[11px] text-slate-400 ml-2">{s.buyerName || 'International Buyer'}</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            {s.status || 'Active'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SPECIFIC VIEW: SHIPMENT UPDATE ACTION RESULT */}
              {result.type === 'shipment_update_action' && result.data && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-bold text-white">Status Synchronized</p>
                      <p className="text-[11px] text-slate-400">Previous: {result.data.previousStatus} → New: <span className="text-emerald-300 font-bold">{result.data.newStatus}</span></p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{result.data.updatedAt}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                {result.action && result.actionLabel && (
                  <button
                    type="button"
                    onClick={result.action}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-red-600/25 active:scale-95 cursor-pointer"
                  >
                    <span>{result.actionLabel}</span>
                    <ArrowRight size={14} />
                  </button>
                )}

                {result.secondaryAction && result.secondaryActionLabel && (
                  <button
                    type="button"
                    onClick={result.secondaryAction}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                  >
                    {result.secondaryActionLabel}
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Error Notice */}
          {errorNotice && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-amber-400" />
              <span>{errorNotice}</span>
            </div>
          )}

          {/* Quick Voice Command Chips (Categorized for Ease of Use) */}
          <div className="space-y-3 pt-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Truck size={12} className="text-blue-400" />
                <span>Verbally Request Shipment Updates:</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'What are the latest shipment updates?',
                  'Status of shipment #1042',
                  'Update shipment #1042 to in transit',
                  'Mark shipment 1042 as customs cleared',
                  'আজকের শিপমেন্টের সর্বশেষ আপডেট দাও'
                ].map((cmd, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      stopListening();
                      setTranscript(cmd);
                      processVoiceCommand(cmd);
                    }}
                    className="text-[11px] font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700/60 transition-colors text-left"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <FileText size={12} className="text-amber-400" />
                <span>Verbally Generate Document Drafts:</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Generate document draft for shipment #1042',
                  'Draft commercial invoice for Korea shipment',
                  'Draft packing list for shipment #1042',
                  'Generate export document draft',
                  'চালান ১০৪২ এর জন্য ডকুমেন্ট ড্রাফট তৈরি করো'
                ].map((cmd, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      stopListening();
                      setTranscript(cmd);
                      processVoiceCommand(cmd);
                    }}
                    className="text-[11px] font-medium bg-red-950/40 hover:bg-red-900/60 text-red-200 hover:text-white px-2.5 py-1.5 rounded-lg border border-red-500/30 transition-colors text-left"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer: Fallback Text Input Form */}
        <form onSubmit={handleManualSubmit} className="pt-3 border-t border-slate-800/80 shrink-0 flex gap-2 relative z-10">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Or type natural command (e.g. 'Draft invoice for shipment #1042')..."
            className="flex-1 bg-slate-950/90 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || processing}
            className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-red-600/25 active:scale-95 cursor-pointer shrink-0"
          >
            {processing ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
            <span>Execute</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default VoiceAssistantModal;
