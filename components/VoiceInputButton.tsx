import React, { useState } from 'react';
import { Mic, MicOff, Volume2, Globe2, Sparkles, Check, AlertCircle, Trash2 } from 'lucide-react';
import { useVoiceToText } from '../src/hooks/useVoiceToText';

interface VoiceInputButtonProps {
  onAppendText: (chunk: string) => void;
  onReplaceText?: (text: string) => void;
  currentValue?: string;
  label?: string;
  compact?: boolean;
  showLanguageToggle?: boolean;
  className?: string;
  onVoiceCommand?: (command: string) => boolean | void;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onAppendText,
  onReplaceText,
  currentValue = '',
  label = 'Dictate Note via Mic',
  compact = false,
  showLanguageToggle = true,
  className = '',
  onVoiceCommand
}) => {
  const [mode, setMode] = useState<'append' | 'replace'>('append');

  const {
    isListening,
    isSupported,
    isPermissionDenied,
    transcript,
    interimTranscript,
    volumeLevel,
    language,
    setLanguage,
    error,
    toggleListening,
    resetTranscript
  } = useVoiceToText({
    initialLanguage: 'en-US',
    continuous: true,
    onFinalTranscript: (chunk) => {
      // Check for voice command intercepts
      const lower = chunk.toLowerCase().trim();
      if (onVoiceCommand) {
        const handled = onVoiceCommand(lower);
        if (handled) return;
      }

      if (lower === 'clear note' || lower === 'reset text') {
        if (onReplaceText) onReplaceText('');
        return;
      }

      if (mode === 'replace' && onReplaceText) {
        onReplaceText(chunk);
      } else {
        onAppendText(chunk);
      }
    }
  });

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en-US' ? 'bn-BD' : 'en-US'));
  };

  return (
    <div className={`inline-flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center flex-wrap gap-2">
        {/* Main Microphone Button */}
        <button
          type="button"
          onClick={toggleListening}
          className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer ${
            isListening
              ? 'bg-red-600 text-white ring-4 ring-red-500/20 animate-pulse'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
          }`}
          title={isListening ? 'Click to stop voice recording' : 'Click to dictate text using microphone'}
        >
          {isListening ? (
            <>
              <div className="relative">
                <span className="absolute -inset-1 rounded-full bg-white/40 animate-ping"></span>
                <Mic size={14} className="relative text-white" />
              </div>
              <span className="font-black uppercase tracking-wider text-[11px]">
                {compact ? 'Listening...' : 'Listening (Tap to Stop)'}
              </span>
            </>
          ) : (
            <>
              <Mic size={14} className="text-red-600" />
              <span>{compact ? 'Voice Input' : label}</span>
            </>
          )}
        </button>

        {/* Live Audio Volume Waveform (while recording) */}
        {isListening && (
          <div className="flex items-center gap-0.5 px-2 py-1 bg-red-950/10 border border-red-200 rounded-lg">
            {[0.4, 0.7, 1.0, 0.8, 0.5].map((multiplier, i) => {
              const height = Math.max(4, Math.min(18, Math.round((volumeLevel * multiplier * 0.2) + 4)));
              return (
                <div
                  key={i}
                  style={{ height: `${height}px` }}
                  className="w-1 bg-red-600 rounded-full transition-all duration-75"
                />
              );
            })}
            <span className="text-[10px] font-mono text-red-700 ml-1.5 font-bold">
              {volumeLevel}%
            </span>
          </div>
        )}

        {/* Language Switcher */}
        {showLanguageToggle && (
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
            title="Toggle Dictation Language (English US / বাংলা Bangladesh)"
          >
            <Globe2 size={11} className="text-slate-500" />
            <span>{language === 'en-US' ? 'EN' : 'বাংলা'}</span>
          </button>
        )}

        {/* Mode Toggle (Append vs Replace) */}
        {onReplaceText && !compact && (
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setMode('append')}
              className={`px-2 py-0.5 rounded-md transition-all ${
                mode === 'append' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Append spoken words to existing text"
            >
              Append
            </button>
            <button
              type="button"
              onClick={() => setMode('replace')}
              className={`px-2 py-0.5 rounded-md transition-all ${
                mode === 'replace' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Replace entire field with spoken words"
            >
              Replace
            </button>
          </div>
        )}
      </div>

      {/* Interim Live Transcript Preview Bar */}
      {isListening && (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-3 shadow-md animate-fade-in">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0"></span>
            <span className="text-[11px] text-slate-400 font-bold shrink-0">Live Mic:</span>
            <span className="text-xs text-white italic truncate font-medium">
              {interimTranscript || 'Speaking will transcribe here in real-time...'}
            </span>
          </div>
          <button
            type="button"
            onClick={resetTranscript}
            className="text-[10px] text-slate-400 hover:text-red-400 uppercase font-black shrink-0 transition-colors"
          >
            Reset
          </button>
        </div>
      )}

      {/* Error or Permission Warning */}
      {error && (
        <div className="flex items-center gap-1.5 text-[11px] text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg animate-fade-in font-medium">
          <AlertCircle size={13} className="shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default VoiceInputButton;
