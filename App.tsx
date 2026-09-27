
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import WorkProcessGallery from './components/WorkProcessGallery';
import Products from './components/Products';
import Services from './components/Services';
import CustomerReviews from './components/CustomerReviews';
import Contact from './components/Contact';
import Footer from './components/Footer';
import AdminPortal from './components/AdminPortal';
import VerificationModule from './components/VerificationModule';
import ShipmentTracker from './components/ShipmentTracker';
import ClientPortal from './components/ClientPortal';
import { BrandingStudio } from './src/components/brand/BrandingStudio';
import TradeRouteMap from './components/TradeRouteMap';

import { motion, AnimatePresence } from 'motion/react';

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<'home' | 'admin' | 'verify' | 'track' | 'client' | 'branding'>('home');
  const [params, setParams] = useState<string | null>(null);

  // Simple route simulation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#branding' || hash === '#branding-guidelines' || hash === '#brand-book' || hash === '#brand') {
        setCurrentRoute('branding');
      } else if (hash.startsWith('#verify')) {
        setCurrentRoute('verify');
      } else if (hash.startsWith('#track/')) {
        const id = hash.replace('#track/', '');
        setParams(id);
        setCurrentRoute('track');
      } else if (hash === '#client-access') {
        setCurrentRoute('client');
      } else if (hash === '#secure-portal-redbird' || hash === '#admin' || hash === '#admin-login' || hash === '#redbird-admin' || hash === '#redbird-portal') {
        setCurrentRoute('admin');
      } else {
        setCurrentRoute('home');
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const renderRoute = () => {
    switch (currentRoute) {
      case 'branding':
        return <BrandingStudio />;
      case 'admin':
        return <AdminPortal />;
      case 'verify':
        return <VerificationModule />;
      case 'track':
        return params ? <ShipmentTracker shipmentId={params} /> : <div className="p-20 text-center">Invalid Tracking ID</div>;
      case 'client':
        return <div className="min-h-screen bg-slate-50"><ClientPortal /></div>;
      default:
        return (
          <div className="min-h-screen bg-white">
            <Navbar />
            <Hero />
            <About />
            <Services />
            <WorkProcessGallery />
            <TradeRouteMap />
            <Products />
            
            {/* Capabilities & Compliance Standards Ribbon */}
            <section className="py-10 bg-slate-900 border-y border-slate-800 text-slate-300">
               <div className="container mx-auto px-4 overflow-hidden">
                  <div className="flex items-center space-x-12 animate-scroll font-bold text-sm tracking-widest uppercase">
                     <span className="flex items-center gap-2 text-white shrink-0">
                       <span className="w-2 h-2 rounded-full bg-red-500" />
                       Custom OEM T-Shirt Manufacturing
                     </span>
                     <span className="text-slate-600 shrink-0">/</span>
                     <span className="text-slate-300 shrink-0">Export Line to South Korea (Seoul/Busan)</span>
                     <span className="text-slate-600 shrink-0">/</span>
                     <span className="flex items-center gap-2 text-white shrink-0">
                       <span className="w-2 h-2 rounded-full bg-red-500" />
                       Fine-Gauge Sweaters & Knitted Outerwear
                     </span>
                     <span className="text-slate-600 shrink-0">/</span>
                     <span className="text-slate-300 shrink-0">100% Legal Surplus Sourcing & Clearances</span>
                     <span className="text-slate-600 shrink-0">/</span>
                     <span className="flex items-center gap-2 text-white shrink-0">
                       <span className="w-2 h-2 rounded-full bg-red-500" />
                       Direct Buyer Tech-Pack Negotiation
                     </span>
                     <span className="text-slate-600 shrink-0">/</span>
                     <span className="text-slate-300 shrink-0">Strict 4-Point Fabric AQL Inspection</span>
                     <span className="text-slate-600 shrink-0">/</span>
                     <span className="flex items-center gap-2 text-white shrink-0">
                       <span className="w-2 h-2 rounded-full bg-red-500" />
                       Private-Label & Confidential Merchandising
                     </span>
                     <span className="text-slate-600 shrink-0">/</span>
                     <span className="text-slate-300 shrink-0">Full Certificate of Origin (COO) Compliance</span>
                  </div>
               </div>
            </section>

            <CustomerReviews />
            <Contact />
            <Footer />
          </div>
        );
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentRoute + (params || '')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderRoute()}
      </motion.div>
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          display: flex;
          width: 200%;
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </AnimatePresence>
  );
};

export default App;