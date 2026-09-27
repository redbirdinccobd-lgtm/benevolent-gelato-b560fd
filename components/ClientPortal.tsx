import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../src/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, User, LogIn, LayoutDashboard, FileText, Package, Settings, LogOut, ShieldAlert } from 'lucide-react';
import { COMPANY_NAME } from '../constants';

interface PortalUser {
  id: string;
  userId: string;
  name: string;
  company: string;
  createdAt: string;
}

const ClientPortal: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userIdInput, setUserIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [user, setUser] = useState<PortalUser | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check persisted session
  useEffect(() => {
    const savedUser = localStorage.getItem('rb_portal_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const q = query(
        collection(db, 'portalUsers'),
        where('userId', '==', userIdInput),
        where('password', '==', passwordInput),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data() as PortalUser;
        const loggedInUser = { ...userData, id: querySnapshot.docs[0].id };
        setUser(loggedInUser);
        setIsLoggedIn(true);
        localStorage.setItem('rb_portal_user', JSON.stringify(loggedInUser));
      } else {
        setError('Invalid User ID or Password. Credentials are provided by Red Bird Administration.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during secure connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rb_portal_user');
    setUser(null);
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-slate-900 to-red-600"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-600/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-slate-900/5 rounded-full blur-3xl"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden relative z-10"
        >
          <div className="p-10 pt-12 text-center border-b border-slate-100 bg-slate-50/50">
             <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-900/20 group relative overflow-hidden">
                <div className="absolute inset-0 bg-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                <LogIn className="text-white relative z-10 group-hover:scale-110 transition-transform" size={32} />
             </div>
             <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Buyer & Partner Portal</h2>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">{COMPANY_NAME}</p>
          </div>

          <form onSubmit={handleLogin} className="p-10 space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-start gap-3"
              >
                <ShieldAlert className="text-red-500 shrink-0" size={18} />
                <p className="text-xs text-red-700 font-medium leading-relaxed">{error}</p>
              </motion.div>
            )}

            <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Assigned User ID</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors">
                      <User size={18} />
                    </div>
                    <input 
                      required
                      type="text" 
                      value={userIdInput}
                      onChange={(e) => setUserIdInput(e.target.value)}
                      placeholder="Enter your ID" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:ring-4 focus:ring-red-600/10 focus:border-red-600 transition-all font-medium"
                    />
                  </div>
               </div>

               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Secure Password</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input 
                      required
                      type="password" 
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:ring-4 focus:ring-red-600/10 focus:border-red-600 transition-all font-medium"
                    />
                  </div>
               </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-slate-900 text-white rounded-2xl py-4 font-black transition-all hover:bg-slate-800 active:scale-[0.98] shadow-lg shadow-slate-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn size={20} />
                  Access Secure Portal
                </>
              )}
            </button>

            <p className="text-[10px] text-center text-slate-400 leading-relaxed px-4">
              Access is restricted to authorized partners only. Credentials are provided by the Red Bird International Master Administrator.
            </p>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-slate-900 text-white p-8 flex flex-col z-20">
         <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black">RB</div>
            <div>
               <h2 className="text-sm font-black tracking-tight uppercase leading-none">User Portal</h2>
               <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest mt-1">Authorized Access</p>
            </div>
         </div>

         <nav className="flex-1 space-y-2">
            <button className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/10 text-white font-bold transition-all">
               <LayoutDashboard size={20} />
               Dashboard Overview
            </button>
            <button className="w-full flex items-center gap-3 p-4 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all">
               <Package size={20} />
               Active Shipments
            </button>
            <button className="w-full flex items-center gap-3 p-4 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all">
               <FileText size={20} />
               My Documents
            </button>
            <button className="w-full flex items-center gap-3 p-4 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all">
               <Settings size={20} />
               Account Settings
            </button>
         </nav>

         <div className="mt-auto pt-8 border-t border-white/5">
            <div className="flex items-center gap-3 mb-6 bg-white/5 p-4 rounded-2xl">
               <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-black">
                {user?.name.charAt(0)}
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-500 truncate uppercase tracking-widest">{user?.company}</p>
               </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-4 rounded-2xl text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all font-bold"
            >
               <LogOut size={20} />
               Terminate Session
            </button>
         </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-72 flex-1 p-12">
         <header className="flex justify-between items-start mb-12">
            <div>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Welcome Back, {user?.name}</h1>
               <p className="text-slate-500 font-medium">Tracking your global garment supply chain in real-time.</p>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Portal Version</p>
               <p className="text-sm font-bold text-slate-900">v2.4.0 Final</p>
            </div>
         </header>

         {/* Placeholder Dashboard Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                  <Package size={100} />
               </div>
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Active Sourcing</h3>
               <p className="text-4xl font-black text-slate-900 mb-2">07</p>
               <p className="text-xs text-slate-500 font-medium">Shipments currently in transit</p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                  <FileText size={100} />
               </div>
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Available Documents</h3>
               <p className="text-4xl font-black text-slate-900 mb-2">24</p>
               <p className="text-xs text-slate-500 font-medium">VCOs and SCs ready for download</p>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                  <Settings size={100} />
               </div>
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">System Health</h3>
               <p className="text-4xl font-black text-green-600 mb-2">Stable</p>
               <p className="text-xs text-slate-500 font-medium">End-to-end encryption active</p>
            </div>
         </div>

         {/* Empty State Message */}
         <div className="mt-12 bg-slate-900 rounded-[2.5rem] p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            <div className="relative z-10 max-w-lg mx-auto">
               <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-600/30">
                  <LayoutDashboard size={32} />
               </div>
               <h2 className="text-2xl font-black mb-4">No Recent Announcements</h2>
               <p className="text-slate-400 text-sm leading-relaxed mb-8">
                  Your personalized dashboard will show live updates of your shipments and documents as they are processed by our export team.
               </p>
               <button className="bg-white text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all">
                  Request Data Refresh
               </button>
            </div>
         </div>
      </main>
    </div>
  );
};

export default ClientPortal;
