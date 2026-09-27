import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Ship, 
  TrendingUp, 
  TrendingDown, 
  Globe, 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Anchor, 
  CheckCircle, 
  AlertTriangle, 
  Activity,
  X,
  FileText,
  Clock,
  ArrowUpRight,
  TrendingUp as TrendingUpIcon,
  Compass,
  MapPin
} from 'lucide-react';

export interface TickerItem {
  id: string;
  category: 'shipment' | 'market' | 'news';
  title: string;
  value?: string;
  change?: string;
  isUp?: boolean;
  status?: 'in-transit' | 'cleared' | 'loading' | 'delayed' | 'info';
  timestamp: string;
  details: string;
  metaData?: Record<string, string>;
}

const TICKER_DATA: TickerItem[] = [
  // Shipments
  {
    id: 'SH-01',
    category: 'shipment',
    title: 'Vessel RedBird Pioneer (V-206B)',
    value: 'Departed Port of Chittagong',
    status: 'in-transit',
    timestamp: '10 mins ago',
    details: 'The container vessel has successfully departed Chittagong container terminal carrying 45,000 premium denim garments. Navigating at 18.4 knots. Optimal maritime conditions reported.',
    metaData: {
      'Carrier': 'Red Bird Maritime',
      'Cargo Weight': '42.5 Metric Tons',
      'Port of Loading': 'Chittagong (CGP)',
      'Port of Discharge': 'Hamburg (HAM)',
      'ETA': 'July 28, 2026',
      'Vessel IMO': '9845702',
      'Route Route': 'Suez Canal'
    }
  },
  {
    id: 'SH-02',
    category: 'shipment',
    title: 'Air Cargo RBD-809',
    value: 'Cleared JFK Customs Hub',
    status: 'cleared',
    timestamp: '45 mins ago',
    details: 'Urgent consignment of branded knit garments has passed all FDA and Custom Border Protection inspections at JFK airport. Transferred to NY logistics warehouse for retail dispatch.',
    metaData: {
      'Flight No': 'RBD-809 / Boeing 777-F',
      'Sourced Brand': 'CK / Hilfiger Mixed Lots',
      'Quantity': '12,500 units',
      'Consignee': 'North America Retail Corp',
      'Cleared Time': '2026-07-11 06:45 AM EST',
      'Warehouse Bay': 'Bay-4B'
    }
  },
  {
    id: 'SH-03',
    category: 'shipment',
    title: 'Vessel Ocean Swift (V-102)',
    value: 'Cargo Loading Complete at Rotterdam',
    status: 'loading',
    timestamp: '2 hours ago',
    details: 'Completed loading of bulk outerwear overstock consignment at Port of Rotterdam. Securing containers for North Sea crossing. Weather advisory active but no delays expected.',
    metaData: {
      'Vessel Name': 'Ocean Swift',
      'Cargo Type': 'Insulated Winter Outerwear',
      'Port of Origin': 'Rotterdam (RTM)',
      'Port of Destination': 'Felixstowe (FXT)',
      'ETA': 'July 14, 2026',
      'Container Count': '18 TEU'
    }
  },
  {
    id: 'SH-04',
    category: 'shipment',
    title: 'Vessel Global Pride (V-901)',
    value: 'Canal Delay. Rescheduled Genoa ETA',
    status: 'delayed',
    timestamp: '4 hours ago',
    details: 'Experiencing minor 18-hour congestion backlog at the Suez Canal entry corridor. Vessel systems pristine. Rescheduling subsequent European port drop-offs to prevent downstream logistics friction.',
    metaData: {
      'Vessel Name': 'Global Pride',
      'Suez Transit Slot': 'Slot #34 (Delayed)',
      'Original ETA': 'July 18, 2026',
      'Revised ETA': 'July 19, 2026 (Evening)',
      'Cargo': 'Linen & Blends Stock Lots',
      'Status Advisory': 'Non-critical delay'
    }
  },
  {
    id: 'SH-05',
    category: 'shipment',
    title: 'Montreal Port Terminal 3',
    value: '15k Heavyweight Hoodies Cleared',
    status: 'cleared',
    timestamp: '6 hours ago',
    details: 'Import customs clearance successfully processed for standard premium winter stock lot. Multi-modal rail transit initiated to distribute goods across Central Canadian retail locations.',
    metaData: {
      'Port Hub': 'Montreal (YUL)',
      'Customs Broker': 'Red Bird Customs Ltd',
      'Harmonized System Code': 'HS-6110.20',
      'Quantity': '15,000 units',
      'Priority': 'High'
    }
  },

  // Market Indices
  {
    id: 'MKT-01',
    category: 'market',
    title: 'Global Cotlook A Index',
    value: '$0.842 / lb',
    change: '+1.35%',
    isUp: true,
    timestamp: 'Live Market',
    details: 'Cotlook A Index registers strong upward momentum due to tightening organic cotton yields in major growing regions and surge in eco-textile demands from global apparel conglomerates.',
    metaData: {
      'Benchmark': 'Cotlook A (Raw Cotton)',
      'Open Rate': '$0.831',
      'Day High': '$0.845',
      'Day Low': '$0.829',
      'Volume (Est)': '85,000 Contracts',
      'YTD Performance': '+8.4%'
    }
  },
  {
    id: 'MKT-02',
    category: 'market',
    title: 'Container Freight Index (SCFI)',
    value: '$3,850 / FEU',
    change: '-2.10%',
    isUp: false,
    timestamp: 'Live Market',
    details: 'Spot container shipping rates from Shanghai to Europe record moderate relaxation as capacity constraints ease slightly with additional bulk charter ships entering operation.',
    metaData: {
      'Index': 'Shanghai Containerized Freight Index',
      'Route': 'Far East to Northern Europe',
      'Weekly Change': '-$82.50',
      'Carrier Surcharge': 'War risk surcharge adjusted down',
      'Average Transit Time': '31 days'
    }
  },
  {
    id: 'MKT-03',
    category: 'market',
    title: 'USD / BDT Exchange Rate',
    value: '118.45 BDT',
    change: '+0.15%',
    isUp: true,
    timestamp: 'Live FX',
    details: 'The US Dollar positions favorably against the Bangladeshi Taka, improving sourcing purchasing power for western apparel brands and buyers sourcing directly from South Asian production plants.',
    metaData: {
      'Currency Pair': 'USD / BDT',
      'Prev Close': '118.27',
      'Bid Rate': '118.42',
      'Ask Rate': '118.48',
      'Sourcing Impact': 'Highly favorable for USD-denominated purchase agreements'
    }
  },
  {
    id: 'MKT-04',
    category: 'market',
    title: 'Organic Certified Cotton Premium',
    value: '$1.16 / lb',
    change: '+0.52%',
    isUp: true,
    timestamp: 'Live Market',
    details: 'Sustainable sourcing premium continues historical rise. Demand for GOTS-certified raw fibers outpaces current supply streams, driving multi-year contract bookings.',
    metaData: {
      'Certification Standards': 'GOTS / OCS Certified',
      'Raw Fiber Grade': 'Premium Long Staple',
      'Supply Outlook': 'Tight throughout Q3/Q4',
      'Major Sourcing Hubs': 'India, Turkey, Texas (USA)'
    }
  },
  {
    id: 'MKT-05',
    category: 'market',
    title: 'Polyester Staple Fiber (PSF)',
    value: '$1.08 / kg',
    change: '0.00%',
    isUp: undefined,
    timestamp: 'Daily Fix',
    details: 'Synthetic polymer fiber rates stabilize amidst balanced petrochemical raw feedstocks (PTA/MEG). Consistent supply levels keep high-performance activewear production costs highly predictable.',
    metaData: {
      'Material Code': 'PSF-Grade A',
      'Primary Uses': 'Athletic Knitwear, Fleece, Padding',
      'Supply Elasticity': 'High',
      'Crude Oil Correlation': '74%'
    }
  },

  // News Headlines
  {
    id: 'NW-01',
    category: 'news',
    title: 'EU Finalizes Digital Product Passports for Apparel',
    timestamp: '3 hours ago',
    details: 'The European Parliament has formalized the rollout schedule for Digital Product Passports (DPP). By early 2027, all textiles sold in the European Union must feature traceably clear digital twins outlining materials, recyclability, and labor practices.',
    metaData: {
      'Regulatory Body': 'European Commission / Parliament',
      'Applicable Sectors': 'All Retail Textiles & Footwear',
      'Action Required': 'QR / NFC label integration at garment source',
      'Compliance Grace Period': '18 months from enactment'
    }
  },
  {
    id: 'NW-02',
    category: 'news',
    title: 'Apparel Overstock Liquidations Surge Ahead of Q3 Autumn Sourcing',
    timestamp: '5 hours ago',
    details: 'Department stores across North America and Europe report structural shifts in inventory management, triggering a 14% increase in premium designer brand surplus and cancellation stocks available to global traders.',
    metaData: {
      'Market Segment': 'Brand Excess & Overstocks',
      'Availabilities': 'Men\'s Outerwear, Sports Casuals, Premium Denim',
      'Trade Velocity': 'Accelerating (High demand for top brands)',
      'Lead Sourcing Advisor': 'Red Bird International'
    }
  },
  {
    id: 'NW-03',
    category: 'news',
    title: 'GOTS Certification Audits Toughened for South Asia Sourcing Hubs',
    timestamp: '1 day ago',
    details: 'Global Organic Textile Standard enforces stricter certification tracking, requiring end-to-end transaction certificates (TC) verified via tamper-proof blockchain ledgers to stamp out raw fiber blending fraud.',
    metaData: {
      'Standard Body': 'GOTS Global Committee',
      'Tracking Method': 'Blockchain Transaction Ledger',
      'Impact on Suppliers': 'Requires complete paper and digital audits',
      'Red Bird Audit Status': '100% compliant supply chain partners'
    }
  }
];

export const TradeTicker: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'shipment' | 'market' | 'news'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedItem, setSelectedItem] = useState<TickerItem | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Filter items based on selected category
  const filteredItems = TICKER_DATA.filter(
    (item) => activeCategory === 'all' || item.category === activeCategory
  );

  // Reset current index when category changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeCategory]);

  // Handle auto-rotation
  useEffect(() => {
    if (isPlaying && filteredItems.length > 0) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % filteredItems.length);
      }, 5000); // cycle every 5s
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, filteredItems.length]);

  const handleNext = () => {
    if (filteredItems.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % filteredItems.length);
  };

  const handlePrev = () => {
    if (filteredItems.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
  };

  const currentItem = filteredItems[currentIndex];

  const getCategoryBadge = (category: 'shipment' | 'market' | 'news') => {
    switch (category) {
      case 'shipment':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-[10px] uppercase font-bold tracking-wider">
            <Ship className="w-3 h-3 text-blue-400" />
            Shipment Dispatch
          </span>
        );
      case 'market':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] uppercase font-bold tracking-wider">
            <Activity className="w-3 h-3 text-amber-400" />
            Market Indice
          </span>
        );
      case 'news':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-[10px] uppercase font-bold tracking-wider">
            <Globe className="w-3 h-3 text-red-400" />
            Global Trade News
          </span>
        );
    }
  };

  const getStatusBadge = (status: 'in-transit' | 'cleared' | 'loading' | 'delayed' | 'info' | undefined) => {
    if (!status) return null;
    switch (status) {
      case 'in-transit':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-400">
            <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} /> In-Transit
          </span>
        );
      case 'cleared':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" /> customs cleared
          </span>
        );
      case 'loading':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400">
            <Anchor className="w-3.5 h-3.5" /> cargo loading
          </span>
        );
      case 'delayed':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5" /> Delay Advisory
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Ticker Banner Container */}
      <div id="trade-ticker" className="w-full bg-slate-950/80 backdrop-blur-md border-b border-white/10 text-white select-none">
        <div className="container mx-auto px-4 md:px-8 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Left Side: Pulse Feed Badge + Quick Categories */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              <span className="font-mono text-xs font-bold tracking-widest uppercase text-slate-300">LIVE FEED</span>
            </div>

            {/* Category selection filters */}
            <div className="flex items-center bg-slate-900/60 p-0.5 rounded-lg border border-white/5 text-xs shrink-0 font-mono">
              <button 
                onClick={() => setActiveCategory('all')} 
                className={`px-2 py-0.5 rounded-md transition-colors text-[11px] ${activeCategory === 'all' ? 'bg-red-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                ALL
              </button>
              <button 
                onClick={() => setActiveCategory('shipment')} 
                className={`px-2 py-0.5 rounded-md transition-colors text-[11px] ${activeCategory === 'shipment' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-blue-400'}`}
              >
                SHIPPING
              </button>
              <button 
                onClick={() => setActiveCategory('market')} 
                className={`px-2 py-0.5 rounded-md transition-colors text-[11px] ${activeCategory === 'market' ? 'bg-amber-600 text-white font-semibold' : 'text-slate-400 hover:text-amber-400'}`}
              >
                MARKETS
              </button>
              <button 
                onClick={() => setActiveCategory('news')} 
                className={`px-2 py-0.5 rounded-md transition-colors text-[11px] ${activeCategory === 'news' ? 'bg-red-600 text-white font-semibold' : 'text-slate-400 hover:text-red-400'}`}
              >
                NEWS
              </button>
            </div>
          </div>

          {/* Center: Dynamic Ticker item with transition */}
          <div className="flex-1 w-full min-w-0 flex items-center justify-center md:justify-start px-0 md:px-4">
            <AnimatePresence mode="wait">
              {currentItem ? (
                <motion.div
                  key={currentItem.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setSelectedItem(currentItem)}
                  className="flex items-center justify-between md:justify-start gap-3 w-full cursor-pointer hover:bg-white/5 md:py-1 md:px-2 rounded-lg transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Category Identifier */}
                    <div className="shrink-0 hidden sm:block">
                      {getCategoryBadge(currentItem.category)}
                    </div>

                    {/* Actual Content */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0 text-sm">
                      <span className="font-semibold text-slate-100 truncate max-w-[200px] sm:max-w-[320px] md:max-w-[400px]">
                        {currentItem.title}
                      </span>
                      
                      {currentItem.value && (
                        <span className="text-slate-400 font-medium">
                          {currentItem.value}
                        </span>
                      )}

                      {/* Financial Index trend markup */}
                      {currentItem.category === 'market' && currentItem.change && (
                        <span className={`inline-flex items-center font-mono text-xs font-bold ${currentItem.isUp ? 'text-emerald-400' : currentItem.isUp === false ? 'text-rose-400' : 'text-slate-400'}`}>
                          {currentItem.isUp ? (
                            <TrendingUp className="w-3.5 h-3.5 mr-0.5 shrink-0" />
                          ) : currentItem.isUp === false ? (
                            <TrendingDown className="w-3.5 h-3.5 mr-0.5 shrink-0" />
                          ) : null}
                          {currentItem.change}
                        </span>
                      )}

                      {/* Shipment Status badge in-line */}
                      {currentItem.category === 'shipment' && currentItem.status && (
                        <div className="inline-flex shrink-0">
                          {getStatusBadge(currentItem.status)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side helper info of item */}
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-mono shrink-0 ml-3">
                    <span>{currentItem.timestamp}</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-white" />
                  </div>
                </motion.div>
              ) : (
                <div className="text-slate-500 text-sm font-mono">No active reports for this feed filter.</div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Side: Manual Controls (Prev, Pause/Play, Next) */}
          <div className="flex items-center gap-1.5 self-end md:self-auto shrink-0 bg-slate-900/40 p-0.5 rounded-lg border border-white/5">
            <button 
              onClick={handlePrev}
              aria-label="Previous headline"
              className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? "Pause feed auto-play" : "Play feed auto-play"}
              className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>
            <button 
              onClick={handleNext}
              aria-label="Next headline"
              className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Interactive Detail Modal Backdrop */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Dark glass backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl shadow-slate-950 overflow-hidden text-white z-10"
            >
              {/* Header block with category and Close btn */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-2">
                  {getCategoryBadge(selectedItem.category)}
                  <span className="font-mono text-xs text-slate-500">ID: {selectedItem.id}</span>
                </div>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight leading-snug">{selectedItem.title}</h3>
                  <div className="mt-2 flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {selectedItem.timestamp}
                    </span>
                    <span>•</span>
                    <span className="text-red-500 font-bold uppercase tracking-wider">VERIFIED TRADE DISPATCH</span>
                  </div>
                </div>

                {/* Sub value bar */}
                {selectedItem.value && (
                  <div className="bg-slate-950/60 rounded-xl p-4 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-1">Current Metric</span>
                      <span className="text-lg font-mono font-bold text-slate-100">{selectedItem.value}</span>
                    </div>

                    {/* Meta indicator */}
                    {selectedItem.category === 'market' && selectedItem.change && (
                      <div className="text-right">
                        <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-1">Volatility</span>
                        <span className={`inline-flex items-center font-mono text-sm font-black ${selectedItem.isUp ? 'text-emerald-400' : selectedItem.isUp === false ? 'text-rose-400' : 'text-slate-400'}`}>
                          {selectedItem.isUp ? '+' : ''}{selectedItem.change}
                        </span>
                      </div>
                    )}

                    {selectedItem.category === 'shipment' && selectedItem.status && (
                      <div className="px-2.5 py-1 rounded bg-slate-900 border border-white/10 shrink-0">
                        {getStatusBadge(selectedItem.status)}
                      </div>
                    )}
                  </div>
                )}

                {/* Main description paragraph */}
                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block">Status Summary & Impact</span>
                  <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/20 p-4 rounded-xl border border-white/5">
                    {selectedItem.details}
                  </p>
                </div>

                {/* Metadata table if exists */}
                {selectedItem.metaData && (
                  <div className="space-y-2.5">
                    <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block">Technical Parameters</span>
                    <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-4 rounded-xl border border-white/5 font-mono text-xs">
                      {Object.entries(selectedItem.metaData).map(([key, val]) => (
                        <div key={key} className="space-y-0.5">
                          <span className="text-slate-500 block text-[10px] uppercase font-bold">{key}</span>
                          <span className="text-slate-200 block truncate">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom simulated graphics based on Category */}
                {selectedItem.category === 'shipment' && (
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 space-y-3">
                    <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block">Global Transit Route Tracker</span>
                    
                    {/* Simulated linear transit stepper */}
                    <div className="relative pt-4 pb-2">
                      <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-800 -translate-y-1/2" />
                      
                      {/* Active fill line */}
                      <div 
                        className={`absolute top-1/2 left-4 h-0.5 -translate-y-1/2 transition-all ${selectedItem.status === 'cleared' ? 'w-[calc(100%-32px)] bg-emerald-500' : selectedItem.status === 'in-transit' ? 'w-1/2 bg-blue-500' : 'w-1/4 bg-indigo-500'}`} 
                      />

                      <div className="relative flex justify-between px-1">
                        <div className="flex flex-col items-center">
                          <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center bg-slate-950 ${selectedItem.status === 'delayed' ? 'border-rose-500 bg-rose-500/20' : 'border-emerald-500 bg-emerald-500/20'}`} />
                          <span className="text-[10px] font-mono mt-1 text-slate-400">Source</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className={`w-3.5 h-3.5 rounded-full border-2 bg-slate-950 ${selectedItem.status === 'cleared' ? 'border-emerald-500 bg-emerald-500/20' : selectedItem.status === 'in-transit' ? 'border-blue-500 bg-blue-500/10 animate-pulse' : 'border-slate-700'}`} />
                          <span className="text-[10px] font-mono mt-1 text-slate-400">Midpoint</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className={`w-3.5 h-3.5 rounded-full border-2 bg-slate-950 ${selectedItem.status === 'cleared' ? 'border-emerald-500 bg-emerald-500/20' : 'border-slate-700'}`} />
                          <span className="text-[10px] font-mono mt-1 text-slate-400">Discharge</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedItem.category === 'market' && (
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 space-y-3">
                    <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block">Simulated 7-Day Price Index Trend</span>
                    
                    {/* Simulated simple mini line graph with SVG */}
                    <div className="h-20 w-full relative">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={selectedItem.isUp ? "#10b981" : "#f43f5e"} stopOpacity="0.25"/>
                            <stop offset="100%" stopColor={selectedItem.isUp ? "#10b981" : "#f43f5e"} stopOpacity="0.0"/>
                          </linearGradient>
                        </defs>
                        {/* Area Fill */}
                        <path 
                          d={selectedItem.isUp 
                            ? "M 0 25 L 20 22 L 40 24 L 60 16 L 80 14 L 100 8 L 100 30 L 0 30 Z" 
                            : "M 0 10 L 20 12 L 40 11 L 60 20 L 80 18 L 100 26 L 100 30 L 0 30 Z"
                          } 
                          fill="url(#chartGrad)"
                        />
                        {/* Stroke Line */}
                        <path 
                          d={selectedItem.isUp 
                            ? "M 0 25 L 20 22 L 40 24 L 60 16 L 80 14 L 100 8" 
                            : "M 0 10 L 20 12 L 40 11 L 60 20 L 80 18 L 100 26"
                          } 
                          fill="none" 
                          stroke={selectedItem.isUp ? "#10b981" : "#f43f5e"} 
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      {/* Interactive coordinates dots */}
                      <div className={`absolute top-2 right-2 flex items-center gap-1.5 font-mono text-[10px] ${selectedItem.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <TrendingUpIcon className="w-3.5 h-3.5" />
                        <span>Volatile Index</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action/Footer block of Modal */}
              <div className="p-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">Dispatched by Red Bird Sourcing intelligence</span>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 font-semibold rounded-lg transition-colors border border-white/5"
                >
                  Close Dispatch
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
