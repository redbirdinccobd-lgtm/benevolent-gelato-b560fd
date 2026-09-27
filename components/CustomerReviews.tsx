
import React from 'react';
import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';

const CustomerReviews: React.FC = () => {
  const reviews = [
    {
      name: "Kim June-Hee",
      role: "Apparel Sourcing Director, Seoul",
      content: "Red Bird International manufactures our custom 220 GSM combed cotton T-shirt program for the Korean retail market with flawless stitch precision, zero shrinkage, and swift ocean freight straight to Busan port.",
      rating: 5,
      avatar: "https://i.pravatar.cc/150?u=kim"
    },
    {
      name: "Sato Takahashi",
      role: "Retail Chain Partner, Tokyo",
      content: "Their custom knitwear and sweaters are produced exactly to our tech-pack measurements. For surplus export allocations, their legal release permits and COO paperwork are always 100% verified.",
      rating: 5,
      avatar: "https://i.pravatar.cc/150?u=sato"
    },
    {
      name: "David Miller",
      role: "Wholesale Distributor, Hamburg",
      content: "Transparent B2B pricing, strict AQL 1.5 fabric inspection, and rock-solid logistics. Their merchandising team understands export customs and digital packing lists inside out.",
      rating: 5,
      avatar: "https://i.pravatar.cc/150?u=david"
    }
  ];

  return (
    <section id="reviews" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-end justify-between mb-16 gap-6 text-center lg:text-left">
          <div>
            <h2 className="text-red-600 font-bold uppercase tracking-[0.2em] text-sm mb-4">Global Trust</h2>
            <h3 className="text-4xl font-black text-slate-900 leading-tight">What Our International <br/>Partners Say</h3>
          </div>
          <div className="bg-slate-50 px-8 py-4 rounded-2xl border border-slate-100 flex items-center gap-4">
             <div className="flex -space-x-2">
                {[1,2,3,4].map(i => <img key={i} src={`https://i.pravatar.cc/100?u=${i}`} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt=""/>)}
             </div>
             <p className="text-sm font-bold text-slate-600">4.9/5 Score from 200+ Wholesale Clients</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((rev, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ scale: 1.02 }}
              className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 relative shadow-sm"
            >
              <div className="absolute top-8 right-10 text-slate-200">
                <Quote size={48} />
              </div>
              <div className="flex gap-1 mb-6">
                {Array.from({length: rev.rating}).map((_, i) => (
                  <Star key={i} size={16} className="fill-red-500 text-red-500" />
                ))}
              </div>
              <p className="text-slate-700 font-medium leading-relaxed mb-8 relative z-10 italic">"{rev.content}"</p>
              <div className="flex items-center gap-4">
                <img src={rev.avatar} alt={rev.name} className="w-12 h-12 rounded-2xl object-cover shadow-md" />
                <div>
                  <h4 className="font-black text-slate-900 leading-none mb-1">{rev.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{rev.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;
