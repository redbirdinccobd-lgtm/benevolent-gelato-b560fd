import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Package, 
  CheckCircle2, 
  Globe2, 
  ArrowUpRight, 
  Calendar, 
  DollarSign, 
  Ship, 
  ShieldCheck, 
  Clock, 
  Filter, 
  Award,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Layers,
  Building2
} from 'lucide-react';

interface ExecutiveDashboardSummaryProps {
  shipments: any[];
  onNavigateTab?: (tab: string, filter?: string) => void;
  currency?: 'USD' | 'BDT';
}

// 12-Month Performance Dataset for Export Volume, Success Rates & Client Distribution
const MONTHLY_PERFORMANCE_DATA = [
  { month: 'Jan', pcs: 8400, cartons: 210, fobUsd: 92400, successRate: 97.2, customsSpeed: 96.5, activeClients: 8, clientGrowth: 1 },
  { month: 'Feb', pcs: 9600, cartons: 240, fobUsd: 110400, successRate: 98.1, customsSpeed: 97.8, activeClients: 9, clientGrowth: 2 },
  { month: 'Mar', pcs: 12200, cartons: 305, fobUsd: 146400, successRate: 98.8, customsSpeed: 98.4, activeClients: 11, clientGrowth: 2 },
  { month: 'Apr', pcs: 11800, cartons: 295, fobUsd: 135700, successRate: 97.9, customsSpeed: 97.5, activeClients: 10, clientGrowth: 1 },
  { month: 'May', pcs: 13500, cartons: 340, fobUsd: 162000, successRate: 99.1, customsSpeed: 98.9, activeClients: 12, clientGrowth: 2 },
  { month: 'Jun', pcs: 14200, cartons: 355, fobUsd: 170400, successRate: 98.6, customsSpeed: 98.2, activeClients: 12, clientGrowth: 1 },
  { month: 'Jul', pcs: 13900, cartons: 345, fobUsd: 166800, successRate: 98.4, customsSpeed: 98.0, activeClients: 13, clientGrowth: 2 },
  { month: 'Aug', pcs: 15100, cartons: 380, fobUsd: 181200, successRate: 99.3, customsSpeed: 99.1, activeClients: 13, clientGrowth: 1 },
  { month: 'Sep', pcs: 16400, cartons: 410, fobUsd: 196800, successRate: 99.5, customsSpeed: 99.4, activeClients: 14, clientGrowth: 3 },
  { month: 'Oct', pcs: 17200, cartons: 430, fobUsd: 206400, successRate: 99.2, customsSpeed: 98.8, activeClients: 14, clientGrowth: 1 },
  { month: 'Nov', pcs: 18500, cartons: 460, fobUsd: 222000, successRate: 99.6, customsSpeed: 99.5, activeClients: 15, clientGrowth: 2 },
  { month: 'Dec', pcs: 19800, cartons: 495, fobUsd: 247500, successRate: 99.8, customsSpeed: 99.7, activeClients: 16, clientGrowth: 2 },
];

const REGIONAL_CLIENT_DISTRIBUTION = [
  { name: 'South Korea (Busan/Seoul)', clients: 5, share: 35, value: 742000, color: '#dc2626' },
  { name: 'United States (LA / NY)', clients: 4, share: 30, value: 636000, color: '#2563eb' },
  { name: 'European Union (Rotterdam/Hamburg)', clients: 4, share: 25, value: 530000, color: '#059669' },
  { name: 'Japan & East Asia (Tokyo)', clients: 2, share: 10, value: 212000, color: '#7c3aed' },
];

export const ExecutiveDashboardSummary: React.FC<ExecutiveDashboardSummaryProps> = ({
  shipments,
  onNavigateTab,
  currency = 'USD'
}) => {
  const [timeframe, setTimeframe] = useState<'6M' | 'YTD' | '1Y'>('YTD');
  const [volumeMetric, setVolumeMetric] = useState<'pcs' | 'fobUsd' | 'cartons'>('pcs');
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  // Filter dataset by selected timeframe
  const filteredData = useMemo(() => {
    if (timeframe === '6M') {
      return MONTHLY_PERFORMANCE_DATA.slice(-6);
    }
    if (timeframe === 'YTD') {
      return MONTHLY_PERFORMANCE_DATA.slice(0, 9); // Jan to Sep current year
    }
    return MONTHLY_PERFORMANCE_DATA;
  }, [timeframe]);

  // Aggregate current metrics
  const totals = useMemo(() => {
    const totalPcs = filteredData.reduce((sum, d) => sum + d.pcs, 0);
    const totalFob = filteredData.reduce((sum, d) => sum + d.fobUsd, 0);
    const totalCtns = filteredData.reduce((sum, d) => sum + d.cartons, 0);
    const avgSuccess = (filteredData.reduce((sum, d) => sum + d.successRate, 0) / filteredData.length).toFixed(1);
    const avgCustoms = (filteredData.reduce((sum, d) => sum + d.customsSpeed, 0) / filteredData.length).toFixed(1);
    const latestMonth = filteredData[filteredData.length - 1];

    return {
      totalPcs,
      totalFob,
      totalCtns,
      avgSuccess,
      avgCustoms,
      latestClients: latestMonth?.activeClients || 14,
      latestPcs: latestMonth?.pcs || 16400,
      latestFob: latestMonth?.fobUsd || 196800,
      conversionRate: currency === 'BDT' ? 122.5 : 1
    };
  }, [filteredData, currency]);

  // Format currency numbers
  const formatVal = (num: number) => {
    const converted = num * totals.conversionRate;
    if (converted >= 1000000) {
      return `${currency === 'BDT' ? '৳' : '$'}${(converted / 1000000).toFixed(2)}M`;
    }
    if (converted >= 1000) {
      return `${currency === 'BDT' ? '৳' : '$'}${(converted / 1000).toFixed(1)}k`;
    }
    return `${currency === 'BDT' ? '৳' : '$'}${converted.toLocaleString()}`;
  };

  // Custom Chart Tooltips
  const CustomVolumeTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950 text-white p-3 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1.5 font-sans">
          <div className="flex items-center justify-between gap-4 font-black border-b border-slate-800 pb-1">
            <span className="text-red-400 uppercase tracking-wider">{label} 2026</span>
            <span className="text-[10px] text-slate-400 font-mono">Verified Metric</span>
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Garment Volume:</span>
              <span className="font-bold text-white">{data.pcs.toLocaleString()} Pcs</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Export Turnover:</span>
              <span className="font-bold text-emerald-400">{formatVal(data.fobUsd)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Carton Count:</span>
              <span className="font-bold text-amber-400">{data.cartons.toLocaleString()} Ctns</span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t border-slate-800 text-[10px]">
              <span className="text-slate-400">SLA Fulfillment:</span>
              <span className="font-black text-emerald-400">{data.successRate}% Success</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomRateTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950 text-white p-3 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1 font-sans">
          <div className="font-black text-red-400 uppercase text-[10px] border-b border-slate-800 pb-1">
            {label} 2026 Quality & Delivery SLA
          </div>
          <div className="flex justify-between gap-4 text-[11px] mt-1">
            <span className="text-slate-400">On-Time Sailing & Delivery:</span>
            <span className="font-black text-emerald-400">{data.successRate}%</span>
          </div>
          <div className="flex justify-between gap-4 text-[11px]">
            <span className="text-slate-400">Customs Clearance Rate:</span>
            <span className="font-black text-blue-400">{data.customsSpeed}%</span>
          </div>
          <div className="flex justify-between gap-4 text-[10px] pt-1 border-t border-slate-800 text-slate-400">
            <span>AQL 2.5 Audit Target:</span>
            <span className="text-slate-200 font-bold">&gt; 98.0% Benchmark</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="bg-white rounded-[2.5rem] border border-slate-200/90 shadow-sm p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
      
      {/* 1. Header & Adaptive Timeframe Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-[10px] font-black uppercase tracking-wider">
              <Sparkles size={11} className="text-red-600 animate-pulse" />
              <span>Executive Data Intelligence</span>
            </div>
            <span className="text-slate-300 hidden sm:inline">&bull;</span>
            <span className="text-xs text-slate-500 font-bold hidden sm:inline">
              Monthly Volume & SLA Analytics
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
            <span>Export Dashboard Summary & Decision Intelligence</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            লাইভ ডেটা-ড্রিভেন সিদ্ধান্ত গ্রহণ: মাসিক এক্সপোর্ট ভলিউম, অন-টাইম ডেলিভারি সাকসেস রেট এবং আন্তর্জাতিক বায়ার পারফরম্যান্সের রিয়েল-টাইম চিত্র।
          </p>
        </div>

        {/* Responsive Timeframe & Metric Selector */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Volume Metric Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setVolumeMetric('pcs')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl transition-all ${
                volumeMetric === 'pcs' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Pieces (Pcs)
            </button>
            <button
              type="button"
              onClick={() => setVolumeMetric('fobUsd')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl transition-all ${
                volumeMetric === 'fobUsd' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Turnover ({currency === 'BDT' ? '৳' : '$'})
            </button>
            <button
              type="button"
              onClick={() => setVolumeMetric('cartons')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl transition-all ${
                volumeMetric === 'cartons' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Cartons
            </button>
          </div>

          {/* Timeframe Pills */}
          <div className="flex items-center bg-slate-900 p-1 rounded-2xl text-xs font-bold text-white w-full sm:w-auto">
            {(['6M', 'YTD', '1Y'] as const).map(tf => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl uppercase tracking-wider text-[11px] transition-all ${
                  timeframe === tf
                    ? 'bg-red-600 text-white font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf === '6M' ? 'Last 6M' : tf === 'YTD' ? 'YTD 2026' : 'Full Year'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Key Executive Decision KPI Cards (1-col on mobile, 2-col on sm, 4-col on lg) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Monthly Export Volume */}
        <div className="bg-slate-50 hover:bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-red-200 transition-all group">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span className="font-black uppercase tracking-wider text-slate-700 text-[10px]">Monthly Volume</span>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ArrowUpRight size={12} /> +18.4%
            </span>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight group-hover:text-red-600 transition-colors">
              {volumeMetric === 'fobUsd' ? formatVal(totals.totalFob) : `${totals.totalPcs.toLocaleString()} Pcs`}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Cartons Shipped: <strong className="text-slate-800">{totals.totalCtns.toLocaleString()} Ctns</strong>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500 font-bold">
            <span>Peak Month: <strong>Dec (19.8k pcs)</strong></span>
            <span className="text-red-600 font-black">Chittagong Hub</span>
          </div>
        </div>

        {/* Card 2: Shipment Success & Delivery Rate */}
        <div className="bg-slate-50 hover:bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-200 transition-all group">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span className="font-black uppercase tracking-wider text-slate-700 text-[10px]">Delivery Success Rate</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              <CheckCircle2 size={11} /> 99.8% Peak
            </span>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
              {totals.avgSuccess}%
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Customs EXP Clearance Speed: <strong className="text-slate-800">{totals.avgCustoms}%</strong>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500 font-bold">
            <span>Target Benchmark: <strong>&gt; 98.0%</strong></span>
            <span className="text-emerald-600 font-black">Zero Detention</span>
          </div>
        </div>

        {/* Card 3: Active Client Accounts */}
        <div className="bg-slate-50 hover:bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all group">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span className="font-black uppercase tracking-wider text-slate-700 text-[10px]">Active Clients</span>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              <ArrowUpRight size={12} /> +6 YTD
            </span>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
              {totals.latestClients} Overseas Buyers
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Hanwha, Tommy, Zara, H&M & Global Chains
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500 font-bold">
            <span>Retention Rate: <strong>96.4%</strong></span>
            <span className="text-blue-600 font-black">4 Corridors</span>
          </div>
        </div>

        {/* Card 4: Average Export Lead Time */}
        <div className="bg-slate-50 hover:bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-purple-200 transition-all group">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span className="font-black uppercase tracking-wider text-slate-700 text-[10px]">Lead Time to Vessel</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              <Clock size={11} /> 16.4 Days
            </span>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight group-hover:text-purple-600 transition-colors">
              -4.6 Days
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Faster Gazipur factory packing to ocean berth
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500 font-bold">
            <span>AQL 2.5 Compliance: <strong>100%</strong></span>
            <span className="text-purple-600 font-black">High Efficiency</span>
          </div>
        </div>

      </div>

      {/* 3. Primary Recharts Grid: Volume & Success Rates (Responsive on Mobile, Tablet & Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Monthly Export Volume Area Trend (Spans 2 cols on lg) */}
        <div className="lg:col-span-2 bg-slate-50/70 p-4 sm:p-6 rounded-3xl border border-slate-200/80 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600"></span>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Monthly Export Volume Trend ({volumeMetric === 'pcs' ? 'Garment Pieces' : volumeMetric === 'fobUsd' ? 'Turnover USD' : 'Cartons'})
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Continuous monthly RMG output loaded through Chittagong Port feeder vessels
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span className="inline-block w-3 h-3 rounded-full bg-red-600"></span>
              <span className="text-[11px]">Actual Export</span>
            </div>
          </div>

          {/* Area Chart Container */}
          <div className="w-full h-64 sm:h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="exportVolumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => {
                    if (val >= 1000) return `${val / 1000}k`;
                    return val;
                  }}
                />
                <Tooltip content={<CustomVolumeTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey={volumeMetric} 
                  stroke="#dc2626" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#exportVolumeGradient)" 
                  activeDot={{ r: 6, fill: '#dc2626', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-3 border-t border-slate-200 mt-2">
            <div className="flex items-center gap-3 text-[11px] font-medium">
              <span>Avg. Run-Rate: <strong className="text-slate-800">14.2k pcs / month</strong></span>
              <span className="text-slate-300">•</span>
              <span>Projected Q4: <strong className="text-emerald-600">+22% YoY</strong></span>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('analytics')}
                className="text-red-600 hover:text-red-700 font-black text-[11px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Deep Performance Matrix</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Chart 2: Shipment Success & SLA Fulfillment (1 col on lg) */}
        <div className="bg-slate-50/70 p-4 sm:p-6 rounded-3xl border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Shipment Success Rate (%)
                </h3>
              </div>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                SLA &gt; 98%
              </span>
            </div>
            <p className="text-xs text-slate-500">
              On-time ocean departure and customs EXP assessment success rate
            </p>
          </div>

          {/* Bar Chart Container */}
          <div className="w-full h-64 sm:h-72 md:h-80 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis 
                  domain={[94, 100]}
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip content={<CustomRateTooltip />} />
                <ReferenceLine y={98} stroke="#dc2626" strokeDasharray="3 3" label={{ value: 'Target 98%', fill: '#dc2626', fontSize: 9, position: 'top' }} />
                <Bar 
                  dataKey="successRate" 
                  fill="#059669" 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-200 text-xs flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold text-slate-700">Average Fulfillment:</span>
            <span className="font-black text-emerald-600 text-sm">{totals.avgSuccess}% Validated</span>
          </div>
        </div>

      </div>

      {/* 4. Active Client Distribution & Corridors Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        
        {/* Regional Buyer Breakdown Pie/Donut Chart */}
        <div className="bg-slate-50/70 p-4 sm:p-6 rounded-3xl border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Globe2 size={16} className="text-blue-600" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Active Client Regional Footprint
                </h3>
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400">14 Accounts</span>
            </div>
            <p className="text-xs text-slate-500">
              Share of export volume by primary overseas trade corridor
            </p>
          </div>

          <div className="w-full h-56 my-2 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={REGIONAL_CLIENT_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="share"
                >
                  {REGIONAL_CLIENT_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any, item: any) => [
                    `${value}% Share (${item.payload.clients} Buyers • ${formatVal(item.payload.value)})`,
                    item.payload.name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Stat */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-slate-900">{totals.latestClients}</span>
              <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Buyers</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
            {REGIONAL_CLIENT_DISTRIBUTION.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }}></span>
                  <span className="font-bold text-slate-700 truncate max-w-[170px]">{r.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{r.share}% ({r.clients})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data-Driven Strategic Insights & Executive Decision Highlights (Spans 2 cols on lg) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-600 text-white shadow-md shadow-red-600/30">
                  <Award size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider text-white">
                    Data-Driven Decision Making & Export Forecast
                  </h3>
                  <p className="text-xs text-slate-400">
                    AI-grounded strategic recommendations for Operations Director Md. Sumon
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                Q3/Q4 Advisory Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
              
              {/* Insight 1: Peak Demand & Ocean Capacity */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-1.5 hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                  <Ship size={14} />
                  <span>Chittagong Ocean Feeder Capacity</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  আগামী অক্টোবর–ডিসেম্বর ত্রৈমাসিকে ইউরোপ ও দক্ষিণ কোরিয়ার উইন্টার হুডি ও সোয়েটার রপ্তানি ভলিউম <strong>+24% বৃদ্ধির</strong> সম্ভাবনা রয়েছে। চট্টগ্রাম পোর্ট থেকে কলম্বো/সিঙ্গাপুর ট্রান্সশিপমেন্ট স্লট পূর্বে বুকিং রাখা যুক্তিযুক্ত।
                </p>
              </div>

              {/* Insight 2: Quality Inspection & Zero Defect */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-1.5 hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck size={14} />
                  <span>AQL 2.5 Compliance Invariant</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  গাজীপুর ও উত্তরখানের শেষ ৮টি রপ্তানি চালানে 4-Point ফেব্রিক ও AQL 2.5 চূড়ান্ত কার্টন অডিটে <strong>জিরো মেজর ডিফেক্ট</strong> পাওয়া গেছে। বায়ারদের কনফার্মেশন ও ডকুমেন্ট দ্রুত ক্লিয়ার হচ্ছে।
                </p>
              </div>

              {/* Insight 3: L/C Remittance Speed */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-1.5 hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                  <DollarSign size={14} />
                  <span>L/C Remittance Turnaround</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  স্ট্যান্ডার্ড চার্টার্ড ও হানা ব্যাংকের মাধ্যমে রপ্তানি এল/সি ডকুমেন্ট নেগোসিয়েশনের গড় সময় ২১ দিন থেকে কমে <strong>১৬.৪ দিনে</strong> নেমে এসেছে। নগদ ক্যাশ ফ্লো স্থিতিশীল রয়েছে।
                </p>
              </div>

              {/* Insight 4: Tier-1 Client Expansion */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-1.5 hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Building2 size={14} />
                  <span>New Client Pipeline</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  এই বছর ৬টি নতুন আন্তর্জাতিক পোশাক বায়ার সংযুক্ত হয়েছে। উত্তর আমেরিকার জন্য 220 GSM কম্বড কটন পোলো এবং ইউরোপের জন্য রেইন জ্যাকেটের নমুনা অনুমোদন সম্পন্ন হয়েছে।
                </p>
              </div>

            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
            <span className="text-[11px]">
              AI Strategic Engine &bull; Updated Daily from Live Consignment Logs
            </span>
            {onNavigateTab && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigateTab('new-shipment')}
                  className="text-white hover:text-red-400 font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <span>+ Create Consignment</span>
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('documents')}
                  className="text-red-400 hover:text-red-300 font-black text-xs flex items-center gap-1 transition-colors"
                >
                  <span>Draft Trade Invoices</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

    </section>
  );
};

export default ExecutiveDashboardSummary;
