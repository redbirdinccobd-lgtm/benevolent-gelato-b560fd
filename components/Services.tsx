import React from 'react';
import { SERVICES } from '../constants';

const Services: React.FC = () => {
  return (
    <section id="services" className="py-24 bg-slate-950 text-white relative overflow-hidden">
      {/* Background Accent Gradients */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <span className="text-red-500 font-bold tracking-widest uppercase text-xs block mb-3">
              Operational Framework & Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
              Engineered for Discerning Global Apparel Buyers.
            </h2>
          </div>
          <p className="text-slate-400 text-base max-w-md leading-relaxed">
            Whether you require custom manufacturing for South Korea’s rigorous retail market or legally verified surplus stocklots, we manage the entire supply chain with total precision.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((service, index) => (
            <div 
              key={index} 
              className="p-8 bg-slate-900/80 rounded-2xl border border-slate-800/80 hover:border-red-500/50 transition-all duration-300 group flex flex-col justify-between hover:-translate-y-1 shadow-lg"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <div className="text-xs font-mono text-red-400 mb-2">0{index + 1}.</div>
                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-red-400 transition-colors">
                  {service.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-800/60 flex items-center text-xs font-semibold text-slate-400 group-hover:text-white transition-colors">
                <span>Verified Quality Standard</span>
                <span className="ml-auto text-red-500">→</span>
              </div>
            </div>
          ))}
        </div>

        {/* B2B Assurance Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-850 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Pre-Shipment Inspection & Packing Matrix</h4>
              <p className="text-xs text-slate-400">All shipments include automated carton breakdown, size assortment verification, and digital packing lists.</p>
            </div>
          </div>
          <a 
            href="#contact" 
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold whitespace-nowrap transition-colors shadow-lg shadow-red-600/30"
          >
            Connect with Merchandiser
          </a>
        </div>
      </div>
    </section>
  );
};

export default Services;
