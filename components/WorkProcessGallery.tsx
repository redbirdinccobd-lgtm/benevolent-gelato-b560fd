import React from 'react';
import { motion } from 'motion/react';

const WorkProcessGallery: React.FC = () => {
  const processes = [
    { 
      url: '/src/assets/images/hero_apparel_manufacturing_1790114666237.jpg', 
      title: 'Knitting & Yarn Precision', 
      desc: 'High-density circular knitting and yarn calibration to exact GSM benchmarks.' 
    },
    { 
      url: '/src/assets/images/korea_tshirt_craft_1790114674548.jpg', 
      title: 'Custom Cutting & Seaming', 
      desc: 'Laser-guided cutting and 4-needle overlock stitching for Korean export runs.' 
    },
    { 
      url: '/src/assets/images/custom_knitwear_sweater_1790114683287.jpg', 
      title: 'Fine Knitwear Assembly', 
      desc: '12GG/14GG fine gauge sweater linking, hand-finishing, and steam blocking.' 
    },
    { 
      url: '/src/assets/images/warehouse_export_logistics_1790114694683.jpg', 
      title: 'Logistics & Container Loading', 
      desc: 'Systematic carton labeling, digital packing list sync, and ocean container sealing.' 
    },
  ];

  return (
    <section id="gallery" className="py-24 bg-slate-50">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <span className="text-red-600 font-bold uppercase tracking-[0.2em] text-xs mb-3 block">
            Inside our Manufacturing & Export Facilities
          </span>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-950 mb-4 tracking-tight">
            Our Industrial Work Process
          </h3>
          <p className="text-slate-600 max-w-2xl mx-auto text-base">
            From technical fabric knitting and precision sewing to verified surplus allocation and international shipping logistics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {processes.map((proc, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -8 }}
              className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-slate-200/70 group flex flex-col"
            >
              <div className="aspect-[4/3] sm:aspect-[3/4] overflow-hidden relative">
                <img 
                  src={proc.url} 
                  alt={proc.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end p-5">
                  <div className="text-white">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-400 block mb-1">
                      Step 0{idx + 1}
                    </span>
                    <p className="font-bold text-lg leading-tight">{proc.title}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white flex-grow flex items-center">
                <p className="text-xs text-slate-600 leading-relaxed">{proc.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-16 bg-slate-900 rounded-3xl p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 overflow-hidden relative shadow-2xl">
           <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
           <div className="relative z-10 text-center lg:text-left">
              <span className="text-red-400 text-xs font-bold tracking-widest uppercase block mb-1">
                Quality Verification & Traceability
              </span>
              <h4 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
                Digital Documentation & Pre-Shipment Inspection
              </h4>
              <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
                Every consignment includes video inspection proofs, shade lot reports, tensile strength data, and automated container packing matrices ready for customs clearance.
              </p>
           </div>
           <a 
             href="#contact"
             className="relative z-10 bg-white hover:bg-slate-100 text-slate-950 px-8 py-4 rounded-xl font-bold text-sm transition-all flex items-center gap-3 active:scale-95 shadow-xl shrink-0"
           >
              <span>Request Inspection Protocol</span>
              <span className="text-red-600 font-bold">→</span>
           </a>
        </div>
      </div>
    </section>
  );
};

export default WorkProcessGallery;
