import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Bell, Check, CheckCheck, X, ShieldAlert, Ship, FileCheck, 
  Clock, AlertTriangle, ArrowRight, Sparkles, Filter, Trash2,
  ExternalLink, CheckCircle2, ChevronRight, Volume2, VolumeX
} from 'lucide-react';
import { db } from '../src/firebase';
import { collection, onSnapshot, query, orderBy, limit, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

export interface AdminNotification {
  id: string;
  type: 'shipment' | 'approval' | 'task';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  actionTarget?: string; // Tab to navigate to (e.g. 'documents', 'shipment', 'applications')
  actionLabel?: string;
  relatedEntityId?: string; // Shipment ID, Invoice number, etc.
}

const INITIAL_NOTIFICATIONS: AdminNotification[] = [
  {
    id: 'notif-1',
    type: 'shipment',
    title: 'Shipment RB-2026-SK01 Departed Chittagong Port',
    message: 'Ocean FCL 40ft container loaded onto KMTC Ocean Line. B/L # RBL-2026-CTG-9921 verified for Busan Port discharge.',
    timestamp: 'Just now',
    read: false,
    priority: 'high',
    actionTarget: 'shipment',
    actionLabel: 'Track Shipment',
    relatedEntityId: 'RB-2026-SK01'
  },
  {
    id: 'notif-2',
    type: 'approval',
    title: 'Pending EXP & Commercial Invoice Approval',
    message: 'Hanwha Apparel Group order # SC-KR-8821 requires executive approval for Bangladesh Bank EXP submission.',
    timestamp: '15 mins ago',
    read: false,
    priority: 'high',
    actionTarget: 'documents',
    actionLabel: 'Review Invoice',
    relatedEntityId: 'RBI-INV-992102'
  },
  {
    id: 'notif-3',
    type: 'task',
    title: 'Gazipur Factory AQL 2.5 Quality Audit Scheduled',
    message: 'Batch inspection for 18,000 pcs combed polo shirts is slated for 14:00 today. Pre-shipment sample ready.',
    timestamp: '1 hour ago',
    read: false,
    priority: 'medium',
    actionTarget: 'analytics',
    actionLabel: 'View QC Metric'
  },
  {
    id: 'notif-4',
    type: 'shipment',
    title: 'Customs Clearance Staging: Long Beach Consignment',
    message: 'Consignment RB-2026-US02 documentation accepted by Chittagong Customs House. Staged for feeder vessel.',
    timestamp: '3 hours ago',
    read: true,
    priority: 'medium',
    actionTarget: 'shipment',
    actionLabel: 'View Registry',
    relatedEntityId: 'RB-2026-US02'
  },
  {
    id: 'notif-5',
    type: 'approval',
    title: 'Foreign Buyer Visa Invitation Letter Drafted',
    message: 'Official Ministry of Foreign Affairs application ready for Hanwha delegate Mr. Min-ho Park.',
    timestamp: 'Yesterday',
    read: true,
    priority: 'low',
    actionTarget: 'applications',
    actionLabel: 'Open Application'
  }
];

interface Props {
  onNavigateTab?: (tab: any, payload?: any) => void;
  onOpenShipmentModal?: (shipmentId: string) => void;
}

export const RealTimeNotificationCenter: React.FC<Props> = ({
  onNavigateTab,
  onOpenShipmentModal
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>(INITIAL_NOTIFICATIONS);
  const [filterType, setFilterType] = useState<'all' | 'shipment' | 'approval' | 'task'>('all');
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [toastNotification, setToastNotification] = useState<AdminNotification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Play subtle sound on new notification if audio enabled
  const playChime = () => {
    if (!isAudioEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
      // AudioContext not allowed or not supported
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Real-time Firestore sync with fallback
  useEffect(() => {
    if (!db) return;
    try {
      const q = query(collection(db, 'admin_notifications'), orderBy('createdAt', 'desc'), limit(15));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const fetched: AdminNotification[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              type: data.type || 'shipment',
              title: data.title || 'Operational Alert',
              message: data.message || '',
              timestamp: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
              read: !!data.read,
              priority: data.priority || 'medium',
              actionTarget: data.actionTarget,
              actionLabel: data.actionLabel,
              relatedEntityId: data.relatedEntityId
            };
          });

          // Check for newly added items to trigger toast
          if (fetched.length > 0 && fetched[0].id !== notifications[0]?.id && !fetched[0].read) {
            setToastNotification(fetched[0]);
            playChime();
            setTimeout(() => setToastNotification(null), 5000);
          }

          setNotifications(fetched);
        }
      }, (err) => {
        console.warn('Real-time notification listener note:', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore notification setup error:', e);
    }
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filterType === 'all') return notifications;
    return notifications.filter(n => n.type === filterType);
  }, [notifications, filterType]);

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (db) {
      try {
        await updateDoc(doc(db, 'admin_notifications', id), { read: true });
      } catch (e) {
        // Fallback local update is already set
      }
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const handleActionClick = (notif: AdminNotification) => {
    markAsRead(notif.id);
    setIsOpen(false);
    if (notif.actionTarget && onNavigateTab) {
      onNavigateTab(notif.actionTarget);
    }
    if (notif.relatedEntityId && onOpenShipmentModal) {
      onOpenShipmentModal(notif.relatedEntityId);
    }
  };

  // Simulate a live event to verify real-time reactivity
  const triggerSimulationAlert = () => {
    const simulationTypes: Array<'shipment' | 'approval' | 'task'> = ['shipment', 'approval', 'task'];
    const randomType = simulationTypes[Math.floor(Math.random() * simulationTypes.length)];
    
    let newNotif: AdminNotification;
    if (randomType === 'shipment') {
      newNotif = {
        id: `sim-${Date.now()}`,
        type: 'shipment',
        title: `Container RB-${Math.floor(1000 + Math.random() * 9000)} Vessel Update`,
        message: 'Ocean feeder berthed at Chittagong Port Yard. Customs seals confirmed intact.',
        timestamp: 'Just now',
        read: false,
        priority: 'high',
        actionTarget: 'shipment',
        actionLabel: 'Track Vessel'
      };
    } else if (randomType === 'approval') {
      newNotif = {
        id: `sim-${Date.now()}`,
        type: 'approval',
        title: `L/C Remittance Approval Required ($${(Math.random() * 50000 + 10000).toFixed(0)})`,
        message: 'Commercial Bank of Korea submitted Letter of Credit acceptance for review.',
        timestamp: 'Just now',
        read: false,
        priority: 'high',
        actionTarget: 'documents',
        actionLabel: 'Approve L/C'
      };
    } else {
      newNotif = {
        id: `sim-${Date.now()}`,
        type: 'task',
        title: 'New Buyer Sourcing Lead from Germany',
        message: 'Hamburg Mode Kontor GmbH requested quotation for 12,000 pcs Organic Cotton Sweaters.',
        timestamp: 'Just now',
        read: false,
        priority: 'medium',
        actionTarget: 'orders',
        actionLabel: 'View Lead'
      };
    }

    setNotifications(prev => [newNotif, ...prev]);
    setToastNotification(newNotif);
    playChime();
    setTimeout(() => setToastNotification(null), 5000);
  };

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      {/* Toast Alert Pop-in (Real-time alert banner) */}
      {toastNotification && (
        <div className="fixed top-6 right-6 z-[99999] max-w-sm w-full bg-slate-950 text-white p-4 rounded-2xl shadow-2xl border border-red-500/40 animate-in slide-in-from-top-4 duration-300 flex items-start gap-3">
          <div className="p-2 bg-red-600 rounded-xl text-white shrink-0 mt-0.5">
            {toastNotification.type === 'shipment' && <Ship size={16} />}
            {toastNotification.type === 'approval' && <FileCheck size={16} />}
            {toastNotification.type === 'task' && <AlertTriangle size={16} />}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-red-400 tracking-wider">
                Live Alert • {toastNotification.type}
              </span>
              <button 
                onClick={() => setToastNotification(null)}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X size={14} />
              </button>
            </div>
            <h4 className="text-xs font-black text-white leading-snug">
              {toastNotification.title}
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
              {toastNotification.message}
            </p>
            {toastNotification.actionLabel && (
              <button
                onClick={() => handleActionClick(toastNotification)}
                className="mt-2 text-[10px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest flex items-center gap-1"
              >
                <span>{toastNotification.actionLabel}</span>
                <ChevronRight size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-3 rounded-2xl transition-all cursor-pointer border ${
          isOpen || unreadCount > 0
            ? 'bg-slate-900 text-white border-slate-900 shadow-md'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
        }`}
        title="Real-time Operational & Approval Notifications"
      >
        <Bell size={17} className={unreadCount > 0 ? 'animate-bounce-subtle' : ''} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-[9999] animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="bg-slate-950 text-white p-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white">
                <Bell size={16} />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-tight flex items-center gap-2">
                  <span>Live Operations Feed</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                      {unreadCount} New
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-slate-400">
                  Shipment statuses, approval requests & alerts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isAudioEnabled ? 'text-amber-400 bg-white/10' : 'text-slate-400 hover:text-white'
                }`}
                title={isAudioEnabled ? "Notification sound on" : "Notification sound muted"}
              >
                {isAudioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1">
              {(['all', 'shipment', 'approval', 'task'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterType(tab)}
                  className={`px-2.5 py-1 rounded-xl font-bold uppercase text-[9.5px] transition-all cursor-pointer ${
                    filterType === tab
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab === 'shipment' ? 'Shipments' : tab === 'approval' ? 'Approvals' : 'Tasks'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={triggerSimulationAlert}
              className="text-[9.5px] font-black text-red-600 hover:text-red-700 uppercase tracking-tight flex items-center gap-1 cursor-pointer bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-lg border border-red-200/60"
              title="Test real-time event arrival"
            >
              <Sparkles size={11} />
              <span>Simulate</span>
            </button>
          </div>

          {/* Notifications Feed */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
                <p className="text-xs font-bold text-slate-700">No active notifications</p>
                <p className="text-[10px] text-slate-400">All shipments and approvals are up to date.</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3.5 transition-colors flex items-start gap-3 hover:bg-slate-50 cursor-pointer ${
                    !notif.read ? 'bg-red-50/20' : ''
                  }`}
                  onClick={() => markAsRead(notif.id)}
                >
                  {/* Category icon */}
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    notif.type === 'shipment' 
                      ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                      : notif.type === 'approval' 
                      ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                  }`}>
                    {notif.type === 'shipment' && <Ship size={14} />}
                    {notif.type === 'approval' && <FileCheck size={14} />}
                    {notif.type === 'task' && <Clock size={14} />}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                        notif.type === 'shipment'
                          ? 'bg-blue-100/70 text-blue-800'
                          : notif.type === 'approval'
                          ? 'bg-amber-100/70 text-amber-900'
                          : 'bg-purple-100/70 text-purple-900'
                      }`}>
                        {notif.type}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono text-slate-400">{notif.timestamp}</span>
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                        )}
                      </div>
                    </div>

                    <h4 className={`text-xs ${!notif.read ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                      {notif.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {notif.message}
                    </p>

                    {/* Action Chip */}
                    {notif.actionLabel && (
                      <div className="pt-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActionClick(notif);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          <span>{notif.actionLabel}</span>
                          <ArrowRight size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10.5px]">
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck size={13} className="text-emerald-600" />
              <span>Mark all as read</span>
            </button>

            <button
              type="button"
              onClick={clearAllNotifications}
              className="text-slate-400 hover:text-red-600 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeNotificationCenter;
