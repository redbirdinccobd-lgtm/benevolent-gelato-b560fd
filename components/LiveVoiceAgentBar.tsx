import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Wifi, WifiOff, BrainCircuit, Volume2, Loader2 } from 'lucide-react';
import { auth } from '../src/firebase';
import { authenticatedFetch } from '../src/services/authenticatedFetch';
import { getRelevantMemories } from '../src/lib/memory';

interface LiveVoiceAgentBarProps {
  onExecuteAction: (action: string, payload?: any) => void;
  activeTab: string;
  shipmentsCount: number;
}

type LiveState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

const LiveVoiceAgentBar: React.FC<LiveVoiceAgentBarProps> = ({ onExecuteAction, activeTab, shipmentsCount }) => {
  const [state, setState] = useState<LiveState>('idle');
  const [status, setStatus] = useState('Ready');
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const eventsRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptRef = useRef('');
  const delegationRef = useRef<string | null>(null);
  const [activity, setActivity] = useState('Ready');

  const cleanup = () => {
    try { eventsRef.current?.close(); } catch {}
    eventsRef.current = null;
    try { micRef.current?.getTracks().forEach(t => t.stop()); } catch {}
    micRef.current = null;
    try { peerRef.current?.close(); } catch {}
    peerRef.current = null;
    if (audioRef.current) audioRef.current.srcObject = null;
  };

  useEffect(() => cleanup, []);

  const getIdToken = async () => {
    if (!auth.currentUser) throw new Error('Please sign in to the admin portal first.');
    return auth.currentUser.getIdToken();
  };

  const start = async () => {
    if (state !== 'idle' && state !== 'error') return;
    try {
      if (!window.RTCPeerConnection) throw new Error('This browser does not support WebRTC voice.');
      setState('connecting');
      setStatus('Connecting to GPT-Live + GPT-6 Astra…');
      setTranscript('');
      transcriptRef.current = '';
      setReply('');
      setActivity('Connecting…');

      const token = await getIdToken();
      const mic = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      micRef.current = mic;

      const peer = new RTCPeerConnection();
      peerRef.current = peer;

      const audio = document.createElement('audio');
      audio.autoplay = true;
      audioRef.current = audio;
      peer.ontrack = (event) => {
        audio.srcObject = event.streams[0];
        audio.play().catch(() => {});
      };

      const events = peer.createDataChannel('oai-events');
      eventsRef.current = events;

      events.onopen = () => {
        setStatus('Live • বাংলা / English • Scarlet ready');
      };

      events.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'session.started':
              setState('listening');
              setStatus('শুনছি… বলুন');
              setActivity('আমি শুনছি');
              break;
            case 'session.input_transcript.delta':
            case 'conversation.item.input_audio_transcription.delta':
              if (data.delta) {
                transcriptRef.current += data.delta;
                setTranscript(transcriptRef.current);
              }
              break;
            case 'session.output_transcript.delta':
            case 'response.output_audio_transcript.delta':
              if (data.delta) setReply(prev => prev + data.delta);
              setState('speaking');
              break;
            case 'session.delegation.created': {
              const delegationId = data.delegation?.id || data.delegation_id;
              delegationRef.current = delegationId || null;
              setActivity('Astra is working on it…');
              setStatus('Astra আপনার অনুরোধটি যাচাই করছে…');
              // Client delegation: Astra receives the accumulated transcript and current UI state.
              void (async () => {
                try {
                  const memories = await getRelevantMemories();
                  const result = await authenticatedFetch('/api/ai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      message: transcriptRef.current.trim(),
                      history: [],
                      memories,
                      context: { activeTab, shipmentsCount, timestamp: new Date().toISOString() },
                      includeAudio: false
                    })
                  });
                  const payload = await result.json();
                  if (!result.ok) throw new Error(payload?.error || 'Astra backend failed');
                  const replyText = payload.reply || 'কাজটি যাচাই করে ফলাফল প্রস্তুত করছি।';
                  setReply(replyText);
                  setActivity('ফলাফল যাচাই হয়েছে');
                  for (const action of payload.actions || []) {
                    onExecuteAction(action.type, action.payload);
                  }
                  if (eventsRef.current && delegationId) {
                    eventsRef.current.send(JSON.stringify({
                      type: 'session.commentary.append',
                      event_id: `astra_result_${Date.now()}`,
                      delegation_id: delegationId,
                      content: replyText.slice(0, 1800)
                    }));
                  }
                } catch (err: any) {
                  setActivity('একটি যাচাই দরকার');
                  if (eventsRef.current && delegationId) {
                    eventsRef.current.send(JSON.stringify({
                      type: 'session.commentary.append',
                      event_id: `astra_error_${Date.now()}`,
                      delegation_id: delegationId,
                      content: 'আমি কাজটি সম্পূর্ণ করার আগে একটি নিরাপত্তা বা ডেটা যাচাইয়ে থেমেছি। স্ক্রিনের status দেখুন।'
                    }));
                  }
                  console.error('Astra delegated work error:', err);
                }
              })();
              break;
            }
            case 'input_audio_buffer.speech_started':
              setState('listening');
              setActivity('Listening');
              break;
            case 'response.created':
              setState('speaking');
              break;
            case 'response.done':
              setState('listening');
              setActivity('Ready');
              break;
            case 'error':
              console.error('GPT-Live event error', data);
              setState('error');
              setStatus(data.error?.message || 'Live agent error');
              setActivity('Error');
              break;
          }
        } catch (e) {
          console.warn('Invalid GPT-Live event', e);
        }
      };

      mic.getTracks().forEach(track => peer.addTrack(track, mic));

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      // Wait for ICE gathering so the server receives a complete SDP offer.
      if (peer.iceGatheringState !== 'complete') {
        await new Promise<void>((resolve) => {
          const timeout = window.setTimeout(resolve, 5000);
          peer.addEventListener('icegatheringstatechange', () => {
            if (peer.iceGatheringState === 'complete') {
              window.clearTimeout(timeout);
              resolve();
            }
          });
        });
      }

      const res = await fetch('/api/live-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sdp: peer.localDescription?.sdp || '',
          context: {
            activeTab,
            shipmentsCount,
            timestamp: new Date().toISOString()
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'GPT-Live session creation failed');
      if (!data.sdp) throw new Error('GPT-Live did not return an SDP answer');

      await peer.setRemoteDescription({ type: 'answer', sdp: data.sdp });
      setState('listening');
      setStatus('শুনছি… বলুন, আমি প্রস্তুত');
    } catch (e: any) {
      console.error('GPT-Live startup error:', e);
      cleanup();
      setState('error');
      setStatus(e?.message || 'Unable to start live agent');
    }
  };

  const stop = () => {
    cleanup();
    setState('idle');
    setStatus('Ready');
  };

  const active = state === 'listening' || state === 'speaking';

  return (
    <section className="rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-xl p-4 sm:p-5">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={active || state === 'connecting' ? stop : start}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${active ? 'bg-red-600' : 'bg-white text-slate-950'}`}
            aria-label={active ? 'Stop live agent' : 'Start live agent'}
          >
            {state === 'connecting' ? <Loader2 className="animate-spin" /> : active ? <MicOff /> : <Mic />}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <BrainCircuit size={17} className="text-cyan-300" />
              <h3 className="font-black">Scarlet • GPT-6 Astra</h3>
              {active ? <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300">LIVE</span> : null}
            </div>
            <p className="text-xs text-slate-400 mt-1 truncate">{status}</p>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500 ml-auto"><Wifi size={14} /> WebRTC</div>
        </div>

        <div className="flex-1 max-w-xl text-xs text-slate-300 bg-slate-900/80 rounded-2xl px-4 py-3 min-h-[52px]">
          <div className="text-slate-500 mb-1">আপনি</div>{transcript || 'মাইক্রোফোন চালু করলে আপনার কথার ট্রান্সক্রিপ্ট এখানে দেখা যাবে।'}
        </div>

        <div className="flex-1 max-w-xl text-xs text-slate-200 bg-slate-900/80 rounded-2xl px-4 py-3 min-h-[52px]">
          <div className="text-slate-500 mb-1 flex items-center gap-1"><Volume2 size={12} /> Scarlet</div>{reply || 'GPT-Live রিয়েল-টাইমে উত্তর দেবে।'}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <span>GPT-Live voice • GPT-6 Astra reasoning • secure client delegation • WebRTC</span>
        <span className="text-cyan-300">{activity}</span>
        {state === 'error' ? <span className="text-red-300 flex items-center gap-1"><WifiOff size={12}/> {status}</span> : null}
      </div>
    </section>
  );
};

export default LiveVoiceAgentBar;
