import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseVoiceToTextOptions {
  initialLanguage?: 'en-US' | 'bn-BD';
  continuous?: boolean;
  onTranscriptChange?: (text: string, isFinal: boolean) => void;
  onFinalTranscript?: (text: string) => void;
}

export function playAudioChime(type: 'start' | 'stop' | 'success' | 'error') {
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
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } else if (type === 'stop') {
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.32);
    } else if (type === 'error') {
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    }
  } catch {
    // Autoplay restriction fallback
  }
}

export const useVoiceToText = (options: UseVoiceToTextOptions = {}) => {
  const {
    initialLanguage = 'en-US',
    continuous = true,
    onTranscriptChange,
    onFinalTranscript
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [volumeLevel, setVolumeLevel] = useState(0); // 0 to 100 for live waveform
  const [language, setLanguage] = useState<'en-US' | 'bn-BD'>(initialLanguage);
  const [error, setError] = useState<string | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isStoppingIntentionallyRef = useRef<boolean>(false);

  // Check if Web Speech API is supported
  const isSupported = typeof window !== 'undefined' && Boolean(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );

  // Setup AudioContext to capture microphone sound volume
  const startAudioAnalyser = async (stream: MediaStream) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        // Map average volume into a 0 - 100 scale with gentle boost
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setVolumeLevel(normalized);

        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (e) {
      console.warn("AudioContext analyser init:", e);
    }
  };

  const stopAudioAnalyser = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setVolumeLevel(0);
  };

  const stopTracks = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
      mediaStreamRef.current = null;
    }
    stopAudioAnalyser();
  };

  const stopListening = useCallback(() => {
    isStoppingIntentionallyRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    stopTracks();
    setIsListening(false);
    playAudioChime('stop');
  }, []);

  const startListening = useCallback(async () => {
    setError(null);
    setIsPermissionDenied(false);
    isStoppingIntentionallyRef.current = false;

    // 1. Verify Microphone Access via getUserMedia
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        await startAudioAnalyser(stream);
      }
    } catch (micErr: any) {
      console.warn('Microphone permission check:', micErr);
      setIsPermissionDenied(true);
      setError('Microphone permission was denied. Please allow microphone access in your browser address bar.');
      playAudioChime('error');
      return;
    }

    // 2. Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech Recognition is not natively supported in this browser. Please use Google Chrome, Edge, or Safari.');
      playAudioChime('error');
      return;
    }

    try {
      // Abort any lingering instance
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        playAudioChime('start');
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const textChunk = item[0]?.transcript || '';
          if (item.isFinal) {
            currentFinal += textChunk;
          } else {
            currentInterim += textChunk;
          }
        }

        if (currentInterim) {
          setInterimTranscript(currentInterim);
          if (onTranscriptChange) {
            onTranscriptChange(currentInterim, false);
          }
        }

        if (currentFinal) {
          const cleanChunk = currentFinal.trim();
          setTranscript(prev => {
            const next = prev ? `${prev} ${cleanChunk}` : cleanChunk;
            if (onFinalTranscript) onFinalTranscript(cleanChunk);
            if (onTranscriptChange) onTranscriptChange(next, true);
            return next;
          });
          setInterimTranscript('');
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          setIsPermissionDenied(true);
          setError('Microphone permission is blocked. Click the lock/tune icon in the browser URL bar to allow microphone.');
        } else if (event.error === 'network') {
          setError('Speech network error. Please check your internet connection.');
        } else if (event.error !== 'no-speech') {
          setError(`Audio recognition error: ${event.error}`);
        }
        
        if (event.error !== 'no-speech') {
          stopListening();
        }
      };

      recognition.onend = () => {
        // If continuous mode and not intentionally stopped, keep alive
        if (continuous && !isStoppingIntentionallyRef.current) {
          try {
            recognition.start();
            return;
          } catch {
            // failed to restart
          }
        }
        setIsListening(false);
        stopTracks();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (initErr: any) {
      console.error('Failed to start speech recognition:', initErr);
      setError('Unable to activate speech recognition service.');
      stopTracks();
      setIsListening(false);
      playAudioChime('error');
    }
  }, [language, continuous, onTranscriptChange, onFinalTranscript, stopListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Sync language changes with active instance
  useEffect(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.lang = language;
    }
  }, [language, isListening]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      isStoppingIntentionallyRef.current = true;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      stopTracks();
    };
  }, []);

  return {
    isListening,
    isSupported,
    isPermissionDenied,
    transcript,
    interimTranscript,
    volumeLevel,
    language,
    setLanguage,
    error,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
    setTranscript
  };
};
