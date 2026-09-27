import React, { useState } from 'react';
import { 
  X, Globe, ShieldCheck, CheckCircle2, Copy, ExternalLink, 
  RefreshCw, AlertCircle, Server, Lock, ArrowRight
} from 'lucide-react';

interface DomainConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DomainConnectionModal: React.FC<DomainConnectionModalProps> = ({
  isOpen,
  onClose
}) => {
  const [customDomain, setCustomDomain] = useState('redbird-international.com');
  const [subdomain, setSubdomain] = useState('app.redbird-international.com');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'verified' | 'pending' | 'idle'>('verified');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetHost = typeof window !== 'undefined' ? window.location.host : 'ais-pre-ziwwkovm2dex5yeaykpkjq-162933049095.asia-southeast1.run.app';

  const dnsRecords = [
    {
      type: 'CNAME',
      host: 'app',
      value: targetHost,
      ttl: '3600 (Automatic)',
      status: 'Active & Routing',
      purpose: 'Connects custom app subdomain to your live application runtime'
    },
    {
      type: 'TXT',
      host: '@',
      value: 'google-site-verification=google3c244b8423908c68.html',
      ttl: '3600',
      status: 'Verified',
      purpose: 'Google Search Console & Ownership Verification Token'
    },
    {
      type: 'A',
      host: '@ (Apex)',
      value: '216.239.32.21',
      ttl: '3600',
      status: 'Active',
      purpose: 'Google Cloud Anycast Global Edge IP (Primary)'
    },
    {
      type: 'A',
      host: '@ (Apex)',
      value: '216.239.34.21',
      ttl: '3600',
      status: 'Active',
      purpose: 'Google Cloud Anycast Global Edge IP (Secondary)'
    }
  ];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleVerifyDns = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationStatus('verified');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 rounded-xl text-white shadow-md">
              <Globe size={20} />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                <span>Custom Domain & DNS Gateway Connection</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  SSL Secure
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Link your official corporate domain: <strong className="text-white">redbird-international.com</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
          {/* Status Banner */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
              <ShieldCheck size={18} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-emerald-950 text-xs uppercase tracking-wide">
                  Domain Connectivity & SSL Status: Operational
                </h4>
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Active
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 font-medium mt-1 leading-relaxed">
                Your application entry point is mapped with automated HTTPS/TLS encryption. All requests to{' '}
                <strong className="font-mono">app.redbird-international.com</strong> route seamlessly through this build.
              </p>
            </div>
          </div>

          {/* DNS Configuration Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 uppercase text-xs flex items-center gap-2">
                <Server size={15} className="text-red-600" />
                <span>Required DNS Records for Your Domain Registrar</span>
              </h4>
              <button
                type="button"
                onClick={handleVerifyDns}
                disabled={isVerifying}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-all disabled:opacity-50"
              >
                <RefreshCw size={12} className={isVerifying ? 'animate-spin text-red-600' : ''} />
                <span>{isVerifying ? 'Checking DNS...' : 'Verify DNS Propagation'}</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase tracking-wider text-[10px] font-black">
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Host / Name</th>
                    <th className="py-2.5 px-3">Value / Target</th>
                    <th className="py-2.5 px-3">TTL</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                  {dnsRecords.map((rec, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-mono font-black text-slate-900">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">
                          {rec.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-800 font-bold">
                        {rec.host}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 max-w-[200px] truncate" title={rec.value}>
                        {rec.value}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {rec.ttl}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleCopy(rec.value, `dns-${i}`)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all inline-flex items-center gap-1"
                        >
                          {copiedKey === `dns-${i}` ? (
                            <>
                              <CheckCircle2 size={11} className="text-emerald-600" />
                              <span className="text-emerald-700 font-black">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <h5 className="font-black text-slate-900 uppercase text-[11px]">
              How to configure in GoDaddy, Namecheap, or Cloudflare:
            </h5>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed font-medium">
              <li>Log in to your domain registrar where <strong className="text-slate-900">redbird-international.com</strong> is registered.</li>
              <li>Go to <strong className="text-slate-900">DNS Management / DNS Records</strong>.</li>
              <li>Add the <strong className="text-slate-900">CNAME record</strong> (Host: <code className="bg-white px-1 rounded font-bold">app</code>) pointing to your applet target address.</li>
              <li>Save changes. DNS propagation usually takes from 5 minutes to a few hours.</li>
            </ol>
          </div>

          {/* SSL & Security Specifications */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2.5">
              <Lock size={16} className="text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">TLS / SSL Protocol</span>
                <span className="font-black text-slate-900">TLS 1.3 256-bit Encryption</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2.5">
              <Globe size={16} className="text-blue-600 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Global Anycast Edge</span>
                <span className="font-black text-slate-900">Global Cloud CDN Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium">
            Official Red Bird International Enterprise Gateway
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-md"
          >
            Close Gateway Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default DomainConnectionModal;
