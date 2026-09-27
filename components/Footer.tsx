import React, { useState } from 'react';
import { COMPANY_NAME, NAV_ITEMS, COMPANY_ADDRESS, COMPANY_EMAIL, COMPANY_PHONE } from '../constants';
import { db, handleFirestoreError, OperationType } from '../src/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      if (db) {
        await addDoc(collection(db, 'inquiries'), {
          name: 'Newsletter Subscriber',
          email: email.trim(),
          message: 'Subscribed to newsletter for latest stock lots and global trade updates.',
          subject: 'Newsletter Subscription',
          company: 'N/A',
          createdAt: serverTimestamp()
        });
      } else {
        // Fallback for offline mode or unit testing
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      setIsSubmitted(true);
      setEmail('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'inquiries');
      setError('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-slate-900 pt-20 pb-10 text-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 lg:col-span-1">
             <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12">
                   <img 
                     src="/logo.png" 
                     alt="Red Bird International Logo" 
                     className="w-full h-full object-contain"
                     onError={(e) => {
                       // Fallback if logo.png is not found
                       e.currentTarget.style.display = 'none';
                       e.currentTarget.parentElement!.innerHTML = `
                         <div class="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                           <span class="text-white font-bold text-sm">R</span>
                         </div>
                       `;
                     }}
                   />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-md leading-none">RED BIRD</span>
                  <span className="text-[8px] tracking-widest font-semibold text-red-500 uppercase">INTERNATIONAL</span>
                </div>
             </div>
             <p className="text-slate-400 mb-6 leading-relaxed">
               Red Bird International is a premier global trade and apparel export hub. Specializing in custom OEM manufacturing (notably high-density T-shirts for South Korea and fine-gauge knitwear) alongside legally certified surplus lot sourcing.
             </p>
             <div className="space-y-2 text-slate-400 text-xs">
               <p className="flex items-center gap-2">
                 <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                 {COMPANY_ADDRESS}
               </p>
               <p className="flex items-center gap-2">
                 <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                 {COMPANY_EMAIL}
               </p>
               <p className="flex items-center gap-2">
                 <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                 {COMPANY_PHONE}
               </p>
             </div>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-4">
              {NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-slate-400 hover:text-red-500 transition-colors">{item.label}</a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-6">Production & Export Lines</h4>
            <ul className="space-y-4 text-sm">
               <li><a href="#products" className="text-slate-400 hover:text-red-500 transition-colors">Custom T-Shirts (Korea Line)</a></li>
               <li><a href="#products" className="text-slate-400 hover:text-red-500 transition-colors">Fine Knit Sweaters & Pullovers</a></li>
               <li><a href="#products" className="text-slate-400 hover:text-red-500 transition-colors">Heavy French Terry Hoodies</a></li>
               <li><a href="#products" className="text-slate-400 hover:text-red-500 transition-colors">Verified Surplus Allocation Lots</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-6 text-white">Export Inquiries</h4>
            <p className="text-slate-400 mb-4 text-sm">Subscribe for new OEM production windows and certified surplus lot allocations.</p>
            {isSubmitted ? (
              <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs p-4 rounded-xl flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Subscription successful! Thank you.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex">
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    disabled={isSubmitting}
                    className="bg-slate-800 border-none rounded-l-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-red-600 w-full disabled:opacity-50 text-white" 
                  />
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-red-600 px-4 rounded-r-lg hover:bg-red-700 transition-colors disabled:bg-slate-700 flex items-center justify-center min-w-[48px]"
                  >
                    {isSubmitting ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    )}
                  </button>
                </div>
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </form>
            )}
          </div>
        </div>

        {/* Global Legal & Compliance Notice */}
        <div className="border-t border-slate-800 py-6 text-xs text-slate-500 leading-relaxed">
          <p className="max-w-5xl">
            <strong className="text-slate-400">Legal & Commercial Governance:</strong> Red Bird International operates as an independent apparel contract manufacturer and secondary market surplus exporter. We are not an authorized licensee, official retailer, or direct manufacturing agent of any third-party brands. All custom manufacturing orders are produced to client tech-packs under confidential contract. Surplus inventory lots are sourced and exported strictly with certified factory release permissions and full customs compliance. All trademarks remain the exclusive property of their respective owners.
          </p>
        </div>
        
        <div className="border-t border-slate-800/80 pt-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-slate-500 text-xs">
           <p>© {new Date().getFullYear()} {COMPANY_NAME}. All Rights Reserved.</p>
           <div className="flex space-x-6">
              <a href="#secure-portal-redbird" className="hover:text-red-500 transition-colors font-bold uppercase tracking-widest text-[10px]">Admin Access</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
           </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
