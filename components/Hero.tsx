import React, { useState } from 'react';
import { TradeTicker } from './TradeTicker';
import { db, handleFirestoreError, OperationType } from '../src/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const Hero: React.FC = () => {
  const [isRfqOpen, setIsRfqOpen] = useState(false);
  const [garmentType, setGarmentType] = useState('Heavyweight Combed T-Shirt (Korea Spec)');
  const [fabricGsm, setFabricGsm] = useState('220 GSM Bio-Washed Single Jersey');
  const [targetMarket, setTargetMarket] = useState('South Korea (Seoul/Busan)');
  const [quantity, setQuantity] = useState('3000');
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerNotes, setBuyerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rfqError, setRfqError] = useState<string | null>(null);

  const handleRfqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerEmail.trim()) {
      setRfqError('Please provide your corporate contact email.');
      return;
    }
    setRfqError(null);
    setIsSubmitting(true);
    try {
      if (db) {
        await addDoc(collection(db, 'inquiries'), {
          name: buyerName.trim() || 'Prospective OEM Buyer',
          email: buyerEmail.trim(),
          subject: `Custom OEM Inquiry: ${garmentType} (${quantity} pcs)`,
          message: `Target Market: ${targetMarket}\nFabric/GSM: ${fabricGsm}\nQuantity: ${quantity} pcs\nNotes: ${buyerNotes}`,
          category: 'Custom OEM Manufacturing',
          createdAt: serverTimestamp()
        });
      } else {
        await new Promise(res => setTimeout(res, 600));
      }
      setSubmitted(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'inquiries');
      setRfqError('Failed to record inquiry. Please reach us directly via contact form.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="home" className="relative min-h-[92vh] flex items-center overflow-hidden bg-slate-950">
      {/* Background Image with Measured Contrast Scrim */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/src/assets/images/hero_apparel_manufacturing_1790114666237.jpg" 
          alt="International Apparel Manufacturing and Export" 
          className="w-full h-full object-cover object-center brightness-90 transform scale-105 transition-transform duration-1000 ease-out"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-900/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
      </div>

      {/* Live Market & Shipping Ticker Ribbon */}
      <div className="absolute top-[72px] md:top-[80px] left-0 w-full z-20">
        <TradeTicker />
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10 pt-28 md:pt-24 pb-16">
        <div className="max-w-3xl">
          {/* Editorial Trust Kicker */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600/90 text-white text-[11px] font-bold tracking-widest uppercase rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Custom OEM & Certified Surplus Sourcing
            </span>
            <span className="text-slate-400 text-xs hidden sm:inline">
              Dhaka · Seoul Export Line · Global Ports
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-[1.08] tracking-tight">
            Precision Apparel <br />
            <span className="text-red-500">Manufacturing</span> & <br className="hidden sm:inline" />
            Verified Stock Sourcing.
          </h1>

          <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed max-w-2xl">
            We engineer custom apparel strictly to client tech-packs—specializing in custom T-shirts exported to South Korea, fine-gauge sweaters, and knitwear—alongside legally certified factory surplus and cancelled lots with authenticated permissions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <button 
              onClick={() => setIsRfqOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold text-base transition-all shadow-xl shadow-red-600/30 text-center flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Configure Custom OEM Order</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
            <a 
              href="#products" 
              className="bg-white/10 hover:bg-white/20 text-white border border-white/25 px-8 py-4 rounded-xl font-bold text-base transition-all text-center backdrop-blur-md"
            >
              Browse Export Catalog
            </a>
          </div>
          
          {/* Quantitative Rigor Trust Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-slate-800/80 text-slate-300">
             <div>
                <span className="text-white font-black text-2xl md:text-3xl block tabular-nums">Seoul & Global</span>
                <span className="text-[11px] uppercase tracking-wider text-slate-400">Custom T-Shirt & Knit Export</span>
             </div>
             <div>
                <span className="text-white font-black text-2xl md:text-3xl block tabular-nums">100% Legal</span>
                <span className="text-[11px] uppercase tracking-wider text-slate-400">Verified Surplus Clearances</span>
             </div>
             <div>
                <span className="text-white font-black text-2xl md:text-3xl block tabular-nums">&lt; 1.5% AQL</span>
                <span className="text-[11px] uppercase tracking-wider text-slate-400">Strict 4-Point QC Protocol</span>
             </div>
             <div>
                <span className="text-white font-black text-2xl md:text-3xl block tabular-nums">350k+</span>
                <span className="text-[11px] uppercase tracking-wider text-slate-400">Monthly Factory Throughput</span>
             </div>
          </div>
        </div>
      </div>

      {/* Interactive Custom Order / RFQ Configurator Modal */}
      {isRfqOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 sm:p-8 overflow-y-auto max-h-[92vh]">
            <button 
              onClick={() => { setIsRfqOpen(false); setSubmitted(false); }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 p-2 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {submitted ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Custom Order Inquiry Received</h3>
                <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
                  Thank you! Our merchandising desk will evaluate your tech-pack specifications for {garmentType} ({quantity} pcs) and reply with fabric consumption, lead-time, and FOB pricing within 24 hours.
                </p>
                <button
                  onClick={() => { setIsRfqOpen(false); setSubmitted(false); }}
                  className="px-6 py-2.5 bg-slate-900 text-white font-medium text-sm rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleRfqSubmit} className="space-y-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-red-600 block mb-1">Direct Buyer Merchandising Desk</span>
                  <h3 className="text-2xl font-bold text-slate-900">Custom Order & Manufacturing RFQ</h3>
                  <p className="text-slate-500 text-xs mt-1">
                    Specify your production parameters. All custom branding, label attachments, and private specs are strictly confidential and negotiated directly.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Garment Category</label>
                    <select 
                      value={garmentType}
                      onChange={(e) => setGarmentType(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none"
                    >
                      <option value="Heavyweight Combed T-Shirt (Korea Spec)">Heavyweight Combed T-Shirt (Korea Spec)</option>
                      <option value="Drop-Shoulder Oversized Boxy Tee (Seoul Fit)">Drop-Shoulder Oversized Boxy Tee (Seoul Fit)</option>
                      <option value="Fine-Gauge Knitted Cotton-Merino Sweater">Fine-Gauge Knitted Cotton-Merino Sweater</option>
                      <option value="French Terry Heavyweight Hoodie (360 GSM)">French Terry Heavyweight Hoodie (360 GSM)</option>
                      <option value="Mercerized Cotton Piqué Polo">Mercerized Cotton Piqué Polo</option>
                      <option value="Custom Technical Outerwear / Pants">Custom Technical Outerwear / Pants</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Fabric & GSM Specification</label>
                    <select 
                      value={fabricGsm}
                      onChange={(e) => setFabricGsm(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none"
                    >
                      <option value="180 GSM Single Jersey (Classic Light)">180 GSM Single Jersey (Classic Light)</option>
                      <option value="220 GSM Bio-Washed Single Jersey (Korea Benchmark)">220 GSM Bio-Washed Single Jersey (Korea Benchmark)</option>
                      <option value="260 GSM Heavy Combed Interlock (Seoul Streetwear)">260 GSM Heavy Combed Interlock (Seoul Streetwear)</option>
                      <option value="12-Gauge Fine Knitted Cotton/Merino Blend">12-Gauge Fine Knitted Cotton/Merino Blend</option>
                      <option value="360 GSM Brushed French Terry">360 GSM Brushed French Terry</option>
                      <option value="Custom Buyer Tech-Pack Spec">Custom Buyer Tech-Pack Spec</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Export Market</label>
                    <select 
                      value={targetMarket}
                      onChange={(e) => setTargetMarket(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none"
                    >
                      <option value="South Korea (Seoul/Busan)">South Korea (Seoul/Busan)</option>
                      <option value="Japan (Tokyo/Osaka)">Japan (Tokyo/Osaka)</option>
                      <option value="European Union (Rotterdam/Hamburg)">European Union (Rotterdam/Hamburg)</option>
                      <option value="North America (USA/Canada)">North America (USA/Canada)</option>
                      <option value="Middle East / GCC">Middle East / GCC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Batch Volume (Pieces)</label>
                    <select 
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none font-mono"
                    >
                      <option value="1000">1,000 pcs (Test Production / Sampling)</option>
                      <option value="3000">3,000 pcs (Commercial Export Run)</option>
                      <option value="5000">5,000 pcs (Standard Batch)</option>
                      <option value="10000">10,000+ pcs (Volume Order)</option>
                      <option value="30000">30,000+ pcs (Container Load)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Buyer Name / Company</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Hanwha Trading / Seoul Retail" 
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Corporate Email *</label>
                    <input 
                      type="email" 
                      required
                      placeholder="buyer@company.com" 
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Custom Specifications & Labeling Notes</label>
                  <textarea 
                    rows={3}
                    placeholder="Provide details on woven care labels, size ratios (e.g., Korea 95-100-105-110), Pantone colorways, or target FOB price..." 
                    value={buyerNotes}
                    onChange={(e) => setBuyerNotes(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>

                {rfqError && (
                  <p className="text-red-600 text-xs font-medium">{rfqError}</p>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Confidential B2B quotation · NDA upon request
                  </span>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Transmitting...' : 'Request Feasibility & Quote'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default Hero;
