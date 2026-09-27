import React from 'react';

const About: React.FC = () => {
  return (
    <section id="about" className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 relative">
             <div className="absolute -top-10 -left-10 w-40 h-40 bg-red-100 rounded-full z-0 opacity-50" />
             <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-slate-100">
                <img 
                  src="/src/assets/images/korea_tshirt_craft_1790114674548.jpg" 
                  alt="Craftsmanship in High-Density Cotton Apparel" 
                  className="w-full h-auto object-cover"
                  referrerPolicy="no-referrer"
                />
             </div>
             <div className="absolute -bottom-6 -right-6 bg-slate-950 text-white p-6 sm:p-8 rounded-xl shadow-xl z-20 max-w-[260px] border border-slate-800">
                <p className="text-3xl font-black mb-1 text-red-500 tabular-nums">10+ Years</p>
                <p className="text-xs text-slate-300 leading-snug">
                  International RMG Manufacturing & Legitimate Stock Sourcing Excellence
                </p>
             </div>
          </div>
          
          <div className="lg:w-1/2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-widest rounded mb-4">
              Corporate Profile & Capabilities
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-950 mb-6 leading-tight">
              An Independent Global Hub for Custom OEM & Verified Sourcing.
            </h2>
            
            <p className="text-slate-600 text-base sm:text-lg mb-8 leading-relaxed">
              Headquartered in Dhaka, Bangladesh with dedicated international shipping corridors to South Korea, Europe, and North America, <strong>Red Bird International</strong> operates across two core, transparently governed business pillars:
            </p>
            
            <div className="space-y-6">
               <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="bg-red-600 text-white p-2.5 rounded-lg shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">1. Custom OEM Apparel Manufacturing (Buyer Request)</h3>
                    <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                      We take custom orders tailored to our customers’ specific tech-packs. We manufacture custom combed cotton T-shirts (such as heavyweight 220–260 GSM runs for South Korea), fine-gauge sweaters, hoodies, and knitwear. These orders are produced without claiming brand affiliations; private labels and detailed terms are negotiated directly with each client.
                    </p>
                  </div>
               </div>

               <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="bg-slate-900 text-white p-2.5 rounded-lg shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">2. Legitimate Stocklot & Cancelled Order Sourcing</h3>
                    <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                      For branded surplus goods (such as overproductions or cancelled export lots from top international brands like Tommy Hilfiger or Calvin Klein), we source strictly with valid factory release permissions, commercial bills of lading, and verified chain of custody in 100% legal compliance.
                    </p>
                  </div>
               </div>

               <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="bg-emerald-600 text-white p-2.5 rounded-lg shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Full Legal Assurance & Direct Client Discretion</h3>
                    <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                      We operate with complete commercial transparency. We do not act as an authorized brand licensee or manufacturing agent; rather, we provide reliable, legally backed manufacturing and allocation solutions backed by Certificate of Origin (COO) and international packing lists.
                    </p>
                  </div>
               </div>
            </div>

            {/* Compliance Guarantee Card */}
            <div className="mt-8 p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span className="font-bold block text-amber-950">Transparency & Trademark Notice:</span>
                All third-party brand names, trademarks, or registered marks referenced in stocklot contexts remain the exclusive intellectual property of their respective trademark holders. Red Bird International deals in surplus lots under legal commercial authorization and manufactures private-label OEM garments exclusively to buyer-approved designs.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
