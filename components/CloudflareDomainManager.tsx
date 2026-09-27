import React, { useState, useEffect } from 'react';
import { 
  Globe, ShieldCheck, Zap, RefreshCw, CheckCircle2, 
  AlertCircle, ExternalLink, Key, Server, Terminal, Lock, ChevronRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CloudflareStatus {
  configured: boolean;
  hasToken: boolean;
  domain: string;
  targetHost: string;
  zoneId?: string;
  rootRecord?: any;
  wwwRecord?: any;
  recordsCount?: number;
  sslMode?: string;
  message?: string;
}

export const CloudflareDomainManager: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<CloudflareStatus | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load saved token from localStorage or check status
  useEffect(() => {
    if (isOpen) {
      const savedToken = localStorage.getItem('rb_cf_token') || '';
      if (savedToken) setToken(savedToken);
      checkStatus(savedToken);
    }
  }, [isOpen]);

  const checkStatus = async (apiToken?: string) => {
    setLoading(true);
    setError(null);
    try {
      const t = apiToken !== undefined ? apiToken : token;
      const res = await fetch(`/api/cloudflare/status?token=${encodeURIComponent(t)}`);
      const data = await res.json();
      setStatus(data);
    } catch (err: any) {
      console.error('Error checking Cloudflare status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please provide a valid Cloudflare API Token.');
      return;
    }

    setLoading(true);
    setError(null);
    setLogs([]);
    setSuccess(false);

    try {
      localStorage.setItem('rb_cf_token', token.trim());

      const res = await fetch('/api/cloudflare/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to configure Cloudflare DNS.');
        if (data.logs) setLogs(data.logs);
      } else {
        setSuccess(true);
        setLogs(data.logs || []);
        checkStatus(token.trim());
      }
    } catch (err: any) {
      setError(err.message || 'Network error configuring domain.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-800 text-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full p-8 relative overflow-hidden"
      >
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none -mr-28 -mt-28"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight uppercase">Cloudflare Domain & DNS Gateway</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Speed & Edge CDN
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Connect <span className="text-white font-mono font-bold">redbird-international.com</span> with Instant Edge Caching
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Target Details Card */}
        <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">Live Custom Domain</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-amber-400">redbird-international.com</span>
              <a
                href="https://redbird-international.com"
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-white"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">Target Cloud Run Host</span>
            <div className="font-mono text-xs text-slate-300 truncate" title="ais-pre-ziwwkovm2dex5yeaykpkjq-162933049095.asia-southeast1.run.app">
              ais-pre-ziwwkovm2dex5yeaykpkjq-162933049095.asia-southeast1.run.app
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        {status && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-center justify-between ${
            status.configured 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
              : 'bg-slate-950/60 border-slate-800 text-slate-300'
          }`}>
            <div className="flex items-center gap-3">
              {status.configured ? (
                <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle size={22} className="text-amber-400 shrink-0" />
              )}
              <div>
                <div className="font-bold text-xs">
                  {status.configured 
                    ? 'Cloudflare DNS Proxy Active (Connected to Cloud Run)' 
                    : 'Awaiting DNS Connection & Proxy Synchronization'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {status.message || (status.configured ? 'Edge caching, HTTP/3, and Full SSL are fully operational.' : 'Enter your Cloudflare API token below to automate zone settings.')}
                </div>
              </div>
            </div>

            <button
              onClick={() => checkStatus()}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh status"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        )}

        {/* Setup Form */}
        <form onSubmit={handleConfigure} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Key size={14} className="text-amber-400" />
                <span>Cloudflare API Token</span>
              </label>
              <a
                href="https://dash.cloudflare.com/profile/api-tokens"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Get API Token</span>
                <ExternalLink size={10} />
              </a>
            </div>

            <div className="relative">
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your Cloudflare API Token here (Zone:DNS:Edit)"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Token requires permissions: <strong>Zone.Zone: Read</strong> and <strong>Zone.DNS: Edit</strong> for domain <code>redbird-international.com</code>.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>Domain DNS configuration and edge optimization completed successfully!</span>
            </div>
          )}

          {/* Execution Logs */}
          {logs.length > 0 && (
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 max-h-44 overflow-y-auto font-mono text-[10px] space-y-1 text-slate-300">
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1 flex items-center gap-1">
                <Terminal size={12} />
                <span>Execution Logs</span>
              </div>
              {logs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  <span className="text-amber-400">›</span> {log}
                </div>
              ))}
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:opacity-95 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-orange-600/25 transition-all flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Configuring Cloudflare DNS & Proxy...</span>
              </>
            ) : (
              <>
                <Zap size={16} />
                <span>Connect & Speed-Optimize redbird-international.com</span>
              </>
            )}
          </button>
        </form>

        {/* Speed & Optimization Badges */}
        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-3 gap-3 text-center">
          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <Lock size={16} className="mx-auto text-emerald-400 mb-1" />
            <div className="text-[10px] font-bold text-white uppercase">Full SSL/TLS</div>
            <div className="text-[9px] text-slate-500">End-to-End Encrypted</div>
          </div>
          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <Zap size={16} className="mx-auto text-amber-400 mb-1" />
            <div className="text-[10px] font-bold text-white uppercase">Cloudflare CDN</div>
            <div className="text-[9px] text-slate-500">Fast Global Edge</div>
          </div>
          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <Server size={16} className="mx-auto text-blue-400 mb-1" />
            <div className="text-[10px] font-bold text-white uppercase">Cloud Run Sync</div>
            <div className="text-[9px] text-slate-500">Auto CNAME Proxied</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CloudflareDomainManager;
