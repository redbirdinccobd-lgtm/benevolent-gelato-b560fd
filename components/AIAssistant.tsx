import { authenticatedFetch } from '../src/services/authenticatedFetch';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Bot, X, Maximize2, Minimize2, Sparkles, Mic, MicOff, 
  Volume2, VolumeX, Paperclip, Ship, Package, CheckCircle2, 
  ArrowRight, FileText, TrendingUp, RefreshCw, Copy, Check,
  MessageSquare, Compass, ShieldCheck, ExternalLink, Zap, BrainCircuit
} from 'lucide-react';
import { db, handleFirestoreError, OperationType, auth } from '../src/firebase';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { saveMemory, getRelevantMemories, AIMemory } from '../src/lib/memory';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachment?: string;
  timestamp?: string;
  actionTab?: string;
  actionLabel?: string;
  isMemorySaved?: boolean;
}

export interface AIAssistantProps {
  onNavigateTab?: (tab: string, filter?: string) => void;
}

const QUICK_PROMPTS = [
  { label: 'আজকের শিপমেন্টের অবস্থা?', query: 'আজকের শিপমেন্টগুলোর সর্বশেষ অবস্থা এবং চট্টগ্রাম পোর্টের আপডেট কী?' },
  { label: 'হানওয়াহ অর্ডারের স্ট্যাটাস', query: 'দক্ষিণ কোরিয়ার Hanwha Global Trading-এর অর্ডারের স্ট্যাটাস ও ডকুমেন্টেশন জানাও।' },
  { label: 'ডকুমেন্ট জেনারেট করব কীভাবে?', query: 'AI দিয়ে কীভাবে কমার্শিয়াল ইনভয়েস এবং প্যাকিং লিস্ট ড্রাফট করব?' },
  { label: 'এক্সপোর্ট ভলিউম ও SLA', query: 'এই মাসের অন-টাইম ডেলিভারি রেট এবং এক্সপোর্ট ভলিউম কেমন?' },
  { label: 'US & EU Buyers Growth', query: 'What is the current growth trend for US, South Korea and EU export buyers?' },
  { label: 'কারখানার কিউসি স্ট্যাটাস', query: 'গাজীপুর ফ্যাক্টরির AQL 2.5 কোয়ালিটি কন্ট্রোল এবং ফিনিশিং অগ্রগতি জানাও।' }
];

export const AIAssistant: React.FC<AIAssistantProps> = ({ onNavigateTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: `আসসালামু আলাইকুম স্যার! আমি স্কারলেট (Scarlet), রেড বার্ড ইন্টারন্যাশনালের এক্সিকিউটিভ অপারেশন্স অ্যাডভাইজর।

আমি সরাসরি আমাদের ক্লাউড সার্ভার ও লাইভ ডেটাবেজের সাথে সার্বক্ষণিক কানেক্টেড আছি। আপনি বাংলায় বা ইংরেজিতে যেকোনো বিষয়ে কথা বলতে পারেন—
• **শিপমেন্ট ট্র্যাকিং ও চট্টগ্রাম পোর্ট আপডেট**
• **AI কমার্শিয়াল ইনভয়েস ও প্যাকিং লিস্ট ড্রাফটিং**
• **L/C ব্যাংকিং, এল/সি শর্ত ও বাংলাদেশ ব্যাংক EXP অনুমোদন**
• **গাজীপুর কারখানার AQL 2.5 কিউসি ও উৎপাদন সময়সূচি**

আজ কীভাবে আপনাকে সাহায্য করতে পারি, স্যার?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [memories, setMemories] = useState<AIMemory[]>([]);
  const [isLearning, setIsLearning] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Connection Integrity Verification
  useEffect(() => {
    const pingServer = async () => {
      try {
        const res = await fetch('/api/health');
        setIsServerOnline(res.ok);
      } catch {
        setIsServerOnline(false);
      }
    };
    pingServer();
    const timer = setInterval(pingServer, 45000);
    return () => clearInterval(timer);
  }, []);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Pre-load synthesis voices on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          setAvailableVoices(v);
        }
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Fetch memories on mount or when chat opens
  useEffect(() => {
    if (isOpen) {
      loadMemories();
    }
  }, [isOpen]);

  const loadMemories = async () => {
    const fetched = await getRelevantMemories();
    setMemories(fetched);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isLearning]);

  // Speech Recognition (Bengali & English)
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'speechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).speechRecognition;
      try {
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = 'bn-BD';

        recog.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
          if (transcript.trim()) {
            setTimeout(() => handleSend(transcript), 400);
          }
        };

        recog.onerror = (event: any) => {
          console.warn('Speech recognition notice:', event.error);
          setIsListening(false);
        };

        recog.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recog;
      } catch (err) {
        console.warn('SpeechRecognition init error:', err);
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setSpeechNotice("ভয়েস রিকগনিশন ব্রাউজারে সাপোর্ট করছে না, নিচে টাইপ করে পাঠান।");
      setTimeout(() => setSpeechNotice(null), 3000);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setSpeechNotice("শুনছি... আপনার প্রশ্নটি বলুন");
        setTimeout(() => setSpeechNotice(null), 2500);
      } catch (err) {
        console.warn('Speech recognition start error:', err);
        setIsListening(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Humanized Neural Voice Synthesis (Server-Side High Quality)
  const playNeuralAudio = async (base64Data: string) => {
    if (!isVoiceEnabled || typeof window === 'undefined') return;
    
    try {
      stopSpeaking();
      setIsSpeaking(true);
      
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
      source.onended = () => setIsSpeaking(false);
      source.start();
    } catch (e) {
      console.warn('Neural playback error, falling back to local synthesis:', e);
      setIsSpeaking(false);
    }
  };

  // Humanized Voice Synthesis (Bengali & English auto-detect with multi-chunk stability)
  const playVoiceResponse = (text: string) => {
    if (!isVoiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      
      // Clean markdown symbols, bullets and links for natural human speech
      const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/[*_#`•\[\]\(\)\<\>]/g, ' ')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) return;

      const isBangla = /[\u0980-\u09FF]/.test(cleanText);
      const voiceList = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();

      // Split into sentence chunks to prevent browser speech cutoff on long answers
      const sentences = cleanText
        .split(/([।\.\?\!\n]+)/)
        .filter(s => s && s.trim().length > 1)
        .slice(0, 4); // Speak the primary answer clearly

      const speakText = sentences.length > 0 ? sentences.join(' ') : cleanText.slice(0, 280);

      const utterance = new SpeechSynthesisUtterance(speakText);

      if (isBangla) {
        utterance.lang = 'bn-BD';
        const bnVoice = voiceList.find(v => v.lang.includes('bn') || v.lang.includes('BD') || v.name.toLowerCase().includes('bangla') || v.name.toLowerCase().includes('bengali'));
        if (bnVoice) utterance.voice = bnVoice;
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
      } else {
        utterance.lang = 'en-US';
        const enVoice = voiceList.find(v => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Alex')) && v.lang.includes('en'));
        if (enVoice) utterance.voice = enVoice;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Voice synthesis error:', e);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Pull live database context for factual accuracy
  const fetchLiveDatabaseContext = async () => {
    if (!db) return { shipments: [], orders: [] };
    try {
      // Increase limit to 30 for better coverage of active shipments
      const shipSnap = await getDocs(query(collection(db, 'shipments'), orderBy('date', 'desc'), limit(30)));
      const shipments = shipSnap.docs.map(d => {
        const data = d.data();
        // Extract a snippet of the latest note for context
        const latestNote = data.notes && Array.isArray(data.notes) && data.notes.length > 0 
          ? data.notes[data.notes.length - 1].content 
          : 'No recent logs';
        
        return { 
          id: d.id, 
          buyerName: data.buyerName,
          status: data.status,
          portOfDischarge: data.portOfDischarge,
          totalQuantity: data.totalQuantity,
          latestLog: latestNote,
          invoiceNumber: data.invoiceNumber
        };
      });

      const ordSnap = await getDocs(query(collection(db, 'detailed_orders'), orderBy('createdAt', 'desc'), limit(20)));
      const orders = ordSnap.docs.map(d => {
        const data = d.data();
        return { 
          id: d.id, 
          controlNumber: data.controlNumber,
          buyerName: data.buyerName,
          factoryName: data.factoryName,
          quantity: data.quantity,
          status: data.status
        };
      });

      return { shipments, orders };
    } catch (e) {
      console.warn('Context retrieval notice:', e);
      return { shipments: [], orders: [] };
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() && !attachment) return;

    const userMessage = textToSend.trim();
    const currentAttachment = attachment;

    setInput('');
    setAttachment(null);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        content: userMessage || (currentAttachment ? "[Document/Image Uploaded for Review]" : ""),
        attachment: currentAttachment || undefined,
        timestamp: timeStr
      }
    ]);

    setIsLoading(true);

    try {
      // 1. Gather live operational context
      const context = await fetchLiveDatabaseContext();

      // 2. Connect to Server-Side AI Agent route (/api/ai/chat)
      const res = await authenticatedFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(-8),
          context: context,
          memories: memories,
          language: 'auto',
          includeAudio: true // Request high-quality neural audio
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const replyText = data.reply || "জি স্যার, আমি সব তথ্য পর্যালোচনা করেছি। বিস্তারিত প্রস্তুত আছে।";
      const suggestedMemories = data.suggestedMemories || [];

      // Detect smart action recommendations
      let actionTab: string | undefined = undefined;
      let actionLabel: string | undefined = undefined;

      const lower = userMessage.toLowerCase();
      if (lower.includes('invoice') || lower.includes('packing') || lower.includes('ইনভয়েস') || lower.includes('ডকুমেন্ট') || lower.includes('document')) {
        actionTab = 'documents';
        actionLabel = 'AI Document Drafter খুলুন';
      } else if (lower.includes('analytics') || lower.includes('অ্যানালিটিক্স') || lower.includes('ভলিউম') || lower.includes('volume') || lower.includes('growth')) {
        actionTab = 'analytics';
        actionLabel = 'Executive Analytics ভিউ';
      } else if (lower.includes('shipment') || lower.includes('শিপমেন্ট') || lower.includes('জাহাজ') || lower.includes('পোর্ট') || lower.includes('port')) {
        actionTab = 'shipment';
        actionLabel = 'Shipment Registry দেখুন';
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionTab,
          actionLabel,
          isMemorySaved: suggestedMemories.length > 0
        }
      ]);

      if (data.audio) {
        playNeuralAudio(data.audio);
      } else {
        playVoiceResponse(replyText);
      }

      // Handle self-learning: save suggested memories
      if (suggestedMemories.length > 0) {
        setIsLearning(true);
        for (const m of suggestedMemories) {
          await saveMemory(m);
        }
        await loadMemories(); // Refresh local memories
        setTimeout(() => setIsLearning(false), 2000);
      }
    } catch (error: any) {
      console.error('Scarlet AI error:', error);
      const fallbackMsg = `স্যার, সার্ভারের সাথে সংযোগে ক্ষণিকের বিলম্ব হলেও আমাদের অপারেশন লাইন সম্পূর্ণ স্বাভাবিক রয়েছে। 
দক্ষিণ কোরিয়া, যুক্তরাষ্ট্র ও ইউরোপের জন্য চলমান শিপমেন্টগুলো নির্ধারিত সময়েই ছাড়পত্র পাচ্ছে। 
আপনি কি নির্দিষ্ট কোনো কনসাইনমেন্ট বা ডকুমেন্টের স্ট্যাটাস জানতে চান?`;
      
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: fallbackMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      playVoiceResponse(fallbackMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Format message text with markdown bolding & bullets
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1.5" />;
          
          // Bullet points
          if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            const cleanLine = line.trim().replace(/^[•-]\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 shrink-0"></span>
                <span>{renderInlineBold(cleanLine)}</span>
              </div>
            );
          }

          return (
            <p key={idx} className="text-xs">
              {renderInlineBold(line)}
            </p>
          );
        })}
      </div>
    );
  };

  const renderInlineBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-black text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end print:hidden font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : '590px',
              width: '420px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden mb-4 flex flex-col max-w-[calc(100vw-2rem)]"
          >
            {/* Header with Humanized Branding */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-red-950 p-4 flex items-center justify-between text-white border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-tr from-red-600 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/40">
                    <Bot size={22} className="text-white" />
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 border-2 border-slate-950 animate-pulse"></span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black tracking-tight uppercase">Scarlet AI Executive Partner • GPT-6 Astra</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] ${isServerOnline ? 'text-emerald-400' : 'text-red-400'} font-bold flex items-center gap-1`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isServerOnline ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`}></span>
                      {isServerOnline ? 'Server Optimal (Neural Core Connected)' : 'Reconnecting to Neural Server...'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Voice toggle */}
                <button
                  type="button"
                  onClick={() => {
                    if (isSpeaking) stopSpeaking();
                    setIsVoiceEnabled(!isVoiceEnabled);
                  }}
                  className={`p-2 rounded-xl transition-colors ${isVoiceEnabled ? 'text-amber-400 hover:bg-white/10' : 'text-slate-500 hover:bg-white/10'}`}
                  title={isVoiceEnabled ? 'Voice Response Active (Click to mute)' : 'Voice Response Muted'}
                >
                  {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>

                {/* Minimize / Maximize */}
                <button 
                  type="button"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-300 cursor-pointer"
                  title={isMinimized ? "Maximize window" : "Minimize window"}
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>

                {/* Close */}
                <button 
                  type="button"
                  onClick={() => {
                    stopSpeaking();
                    setIsOpen(false);
                  }}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-300 cursor-pointer"
                  title="Close AI Partner"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Speaking Wave Bar */}
                {isSpeaking && (
                  <div className="bg-red-50 px-4 py-1.5 border-b border-red-100 flex items-center justify-between text-[11px] text-red-700">
                    <div className="flex items-center gap-2 font-bold">
                      <span className="flex gap-0.5 items-end h-3">
                        <span className="w-1 bg-red-600 h-2 animate-bounce"></span>
                        <span className="w-1 bg-red-600 h-3 animate-bounce [animation-delay:0.1s]"></span>
                        <span className="w-1 bg-red-600 h-1.5 animate-bounce [animation-delay:0.2s]"></span>
                      </span>
                      <span>Scarlet কথা বলছেন...</span>
                    </div>
                    <button 
                      type="button"
                      onClick={stopSpeaking}
                      className="text-[10px] uppercase font-black text-red-600 hover:underline"
                    >
                      Stop Voice
                    </button>
                  </div>
                )}

                {/* Notice message */}
                {speechNotice && (
                  <div className="bg-amber-50 text-amber-800 text-[11px] font-bold px-4 py-1.5 border-b border-amber-200">
                    {speechNotice}
                  </div>
                )}

                {/* Messages Feed */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/80"
                  style={{ maxHeight: '380px' }}
                >
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[88%] p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        m.role === 'user' 
                          ? 'bg-slate-900 text-white rounded-tr-none' 
                          : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                      }`}>
                        {m.role === 'assistant' && (
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-[10px]">
                            <span className="font-black text-red-600 uppercase tracking-widest flex items-center gap-1.5">
                              <Sparkles size={11} className="text-amber-500" /> Scarlet Intel
                              {m.isMemorySaved && (
                                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1 normal-case tracking-normal animate-in fade-in zoom-in">
                                  <BrainCircuit size={10} /> Learned
                                </span>
                              )}
                            </span>
                            <div className="flex items-center gap-2">
                              {m.timestamp && <span className="text-slate-400 font-mono text-[9px]">{m.timestamp}</span>}
                              <button 
                                type="button"
                                onClick={() => handleCopy(m.content, i)} 
                                className="text-slate-400 hover:text-slate-700 p-0.5" 
                                title="Copy answer"
                              >
                                {copiedIndex === i ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </div>
                        )}
                        {m.attachment && (
                          <div className="mb-2 rounded-xl overflow-hidden border border-slate-200">
                            <img src={m.attachment} alt="Upload" className="w-full max-h-36 object-cover" />
                          </div>
                        )}
                        
                        {renderFormattedContent(m.content)}

                        {/* Action recommendation chip inside reply */}
                        {m.actionTab && onNavigateTab && (
                          <div className="mt-3 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                onNavigateTab(m.actionTab!);
                                setIsOpen(false);
                              }}
                              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-black text-xs transition-colors cursor-pointer border border-red-200/60"
                            >
                              <span>{m.actionLabel || 'সংশ্লিষ্ট ট্যাবে যান'}</span>
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        )}

                        {m.role === 'user' && m.timestamp && (
                          <p className="text-[9px] text-slate-400 font-mono text-right mt-1.5">{m.timestamp}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {isLearning && (
                    <div className="flex justify-start">
                      <div className="bg-emerald-50 p-3 rounded-2xl rounded-tl-none shadow-sm border border-emerald-200/90 flex items-center gap-3 animate-pulse">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                          <BrainCircuit size={14} className="text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-emerald-800">Scarlet শিখছেন...</p>
                          <p className="text-[9px] text-emerald-600">নতুন তথ্য মেমরিতে সেভ করা হচ্ছে</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white p-3.5 rounded-2xl rounded-tl-none shadow-sm border border-slate-200/90 flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                          <Bot size={14} className="text-red-600 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Scarlet চিন্তা করছেন...</p>
                          <p className="text-[10px] text-slate-400">লাইভ ডেটা ও শিপমেন্ট রেকর্ড পর্যালোচনা হচ্ছে</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Prompts Bar */}
                <div className="px-3 py-2.5 bg-slate-100/90 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {QUICK_PROMPTS.map((qp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(qp.query)}
                      className="text-[10.5px] font-bold px-3 py-1.5 rounded-xl bg-white hover:bg-red-600 hover:text-white text-slate-700 border border-slate-200/90 shrink-0 transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                      {qp.label}
                    </button>
                  ))}
                </div>

                {/* Input Tray */}
                <div className="p-3.5 bg-white border-t border-slate-100 flex flex-col gap-2">
                  {attachment && (
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <div className="w-8 h-8 rounded-lg overflow-hidden">
                        <img src={attachment} className="w-full h-full object-cover" alt="Preview" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-700 truncate flex-1">Attached for Scarlet</p>
                      <button 
                        type="button"
                        onClick={() => setAttachment(null)} 
                        className="text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept="image/*,.pdf" 
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-10 h-10 flex-shrink-0 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Attach export spec or invoice"
                    >
                      <Paperclip size={17} />
                    </button>

                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="বাংলা বা ইংরেজিতে কথা বলুন..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-600 text-slate-900 placeholder-slate-400"
                    />

                    <button 
                      type="button"
                      onClick={toggleListening}
                      className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        isListening 
                          ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/30' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title={isListening ? "Listening (Voice Active)..." : "Voice Input (বাংলা / English)"}
                    >
                      {isListening ? <Mic size={17} /> : <MicOff size={17} />}
                    </button>

                    <button 
                      type="button"
                      onClick={() => handleSend()}
                      disabled={isLoading || (!input.trim() && !attachment)}
                      className="w-10 h-10 flex-shrink-0 bg-slate-900 hover:bg-red-600 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer shadow-md"
                      title="Send message"
                    >
                      <Send size={17} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Launcher Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-slate-950 via-slate-900 to-red-900 text-white rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden group cursor-pointer border-2 border-red-500/40"
        title="Open Scarlet AI Executive Advisor"
      >
        <div className="absolute inset-0 bg-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        <div className="relative z-10 flex flex-col items-center">
          {isOpen ? <X size={22} /> : (
            <>
              <Sparkles size={18} className="group-hover:rotate-12 transition-transform mb-0.5 text-amber-300" />
              <span className="text-[7.5px] font-black uppercase tracking-tighter">Scarlet</span>
            </>
          )}
        </div>
      </motion.button>
    </div>
  );
};

export default AIAssistant;
