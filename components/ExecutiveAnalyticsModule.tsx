import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  Package,
  CheckCircle2,
  Users,
  Calendar,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Ship,
  Plane,
  Download,
  DollarSign,
  Layers,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface ExecutiveAnalyticsModuleProps {
  shipments?: any[];
  onNavigateTab?: (tab: string, filter?: string) => void;
}

// 12-Month Historical & Current Trade Analytics Dataset
const MONTHLY_ANALYTICS_DATA = [
  { month: 'Oct 2025', volumeUnits: 34200, volumeCartons: 855, revenueUSD: 145000, oceanVol: 28500, airVol: 5700, onTimeRate: 97.4, customsClearance: 98.1, qcPassRate: 98.8, incidentRate: 2.1, activeBuyers: 84, newBuyers: 6, retentionRate: 85 },
  { month: 'Nov 2025', volumeUnits: 38600, volumeCartons: 965, revenueUSD: 168000, oceanVol: 32000, airVol: 6600, onTimeRate: 97.8, customsClearance: 98.5, qcPassRate: 99.0, incidentRate: 1.9, activeBuyers: 89, newBuyers: 7, retentionRate: 86 },
  { month: 'Dec 2025', volumeUnits: 46500, volumeCartons: 1162, revenueUSD: 204000, oceanVol: 38000, airVol: 8500, onTimeRate: 98.2, customsClearance: 98.8, qcPassRate: 99.2, incidentRate: 1.6, activeBuyers: 96, newBuyers: 9, retentionRate: 87 },
  { month: 'Jan 2026', volumeUnits: 41000, volumeCartons: 1025, revenueUSD: 182000, oceanVol: 34500, airVol: 6500, onTimeRate: 98.0, customsClearance: 98.4, qcPassRate: 99.1, incidentRate: 1.7, activeBuyers: 101, newBuyers: 8, retentionRate: 88 },
  { month: 'Feb 2026', volumeUnits: 43800, volumeCartons: 1095, revenueUSD: 196000, oceanVol: 36800, airVol: 7000, onTimeRate: 98.4, customsClearance: 98.9, qcPassRate: 99.3, incidentRate: 1.5, activeBuyers: 108, newBuyers: 10, retentionRate: 88 },
  { month: 'Mar 2026', volumeUnits: 49500, volumeCartons: 1238, revenueUSD: 228000, oceanVol: 41500, airVol: 8000, onTimeRate: 98.6, customsClearance: 99.0, qcPassRate: 99.4, incidentRate: 1.3, activeBuyers: 116, newBuyers: 11, retentionRate: 89 },
  { month: 'Apr 2026', volumeUnits: 52400, volumeCartons: 1310, revenueUSD: 241000, oceanVol: 44000, airVol: 8400, onTimeRate: 98.5, customsClearance: 99.1, qcPassRate: 99.5, incidentRate: 1.4, activeBuyers: 124, newBuyers: 12, retentionRate: 90 },
  { month: 'May 2026', volumeUnits: 56800, volumeCartons: 1420, revenueUSD: 265000, oceanVol: 48000, airVol: 8800, onTimeRate: 98.8, customsClearance: 99.2, qcPassRate: 99.6, incidentRate: 1.1, activeBuyers: 132, newBuyers: 13, retentionRate: 90 },
  { month: 'Jun 2026', volumeUnits: 59200, volumeCartons: 1480, revenueUSD: 279000, oceanVol: 50500, airVol: 8700, onTimeRate: 98.7, customsClearance: 99.3, qcPassRate: 99.5, incidentRate: 1.2, activeBuyers: 138, newBuyers: 11, retentionRate: 91 },
  { month: 'Jul 2026', volumeUnits: 62500, volumeCartons: 1563, revenueUSD: 295000, oceanVol: 53500, airVol: 9000, onTimeRate: 98.9, customsClearance: 99.4, qcPassRate: 99.7, incidentRate: 1.0, activeBuyers: 144, newBuyers: 12, retentionRate: 91 },
  { month: 'Aug 2026', volumeUnits: 64800, volumeCartons: 1620, revenueUSD: 312000, oceanVol: 55800, airVol: 9000, onTimeRate: 99.0, customsClearance: 99.5, qcPassRate: 99.7, incidentRate: 0.9, activeBuyers: 152, newBuyers: 14, retentionRate: 92 },
  { month: 'Sep 2026', volumeUnits: 68400, volumeCartons: 1710, revenueUSD: 334000, oceanVol: 59000, airVol: 9400, onTimeRate: 99.2, customsClearance: 99.6, qcPassRate: 99.8, incidentRate: 0.8, activeBuyers: 161, newBuyers: 15, retentionRate: 93 }
];

const REGIONAL_BUYER_DISTRIBUTION = [
  { name: 'South Korea (Hanwha & Seoul Retail)', value: 42, color: '#dc2626' },
  { name: 'United States & Canada', value: 26, color: '#2563eb' },
  { name: 'European Union (Germany/Nordics)', value: 18, color: '#059669' },
  { name: 'Japan (Tokyo Merchandising)', value: 14, color: '#d97706' }
];

export const ExecutiveAnalyticsModule: React.FC<ExecutiveAnalyticsModuleProps> = ({
  shipments = [],
  onNavigateTab
}) => {
  // Controls
  const [timeHorizon, setTimeHorizon] = useState<'6m' | '12m' | 'ytd'>('12m');
  const [volumeMetric, setVolumeMetric] = useState<'units' | 'cartons' | 'revenue'>('units');
  const [modeFilter, setModeFilter] = useState<'all' | 'ocean' | 'air'>('all');

  // Filtered dataset
  const filteredData = useMemo(() => {
    let dataset = [...MONTHLY_ANALYTICS_DATA];
    if (timeHorizon === '6m') {
      dataset = dataset.slice(-6);
    } else if (timeHorizon === 'ytd') {
      dataset = dataset.slice(-9); // Jan to Sep 2026
    }
    return dataset;
  }, [timeHorizon]);

  // Aggregate Metrics
  const aggregates = useMemo(() => {
    const totalVolume = filteredData.reduce((sum, d) => sum + d.volumeUnits, 0);
    const totalCartons = filteredData.reduce((sum, d) => sum + d.volumeCartons, 0);
    const totalRevenue = filteredData.reduce((sum, d) => sum + d.revenueUSD, 0);
    const count = filteredData.length;
    const avgOnTime = count > 0 ? +(filteredData.reduce((sum, d) => sum + d.onTimeRate, 0) / count).toFixed(1) : 0;
    const avgQcPass = count > 0 ? +(filteredData.reduce((sum, d) => sum + d.qcPassRate, 0) / count).toFixed(1) : 0;
    const latestActiveBuyers = count > 0 ? filteredData[count - 1].activeBuyers : 0;
    const totalNewBuyers = filteredData.reduce((sum, d) => sum + d.newBuyers, 0);

    return {
      totalVolume,
      totalCartons,
      totalRevenue,
      avgOnTime,
      avgQcPass,
      latestActiveBuyers,
      totalNewBuyers
    };
  }, [filteredData]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = 'Month,Total Units,Cartons,Revenue (USD),Ocean Vol,Air Vol,On-Time Rate %,QC Pass Rate %,Active Buyers,New Buyers\n';
    const rows = filteredData.map(d => 
      `${d.month},${d.volumeUnits},${d.volumeCartons},${d.revenueUSD},${d.oceanVol},${d.airVol},${d.onTimeRate},${d.qcPassRate},${d.activeBuyers},${d.newBuyers}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `redbird-analytics-${timeHorizon}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 font-sans animate-fade-in">
      {/* Header & Controls Bar */}
      <header className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-slate-500 font-medium">
            <span>Executive Intelligence</span>
            <span aria-hidden="true">·</span>
            <span>Accredited RMG Trade Metrics</span>
            <span aria-hidden="true">·</span>
            <span className="text-red-600 font-bold">Recharts Powered</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
            Export Volumes & Operational Analytics
          </h2>
          <p className="text-slate-500 text-xs mt-1 max-w-2xl leading-relaxed">
            Real-time multi-dimensional tracking of monthly apparel export throughput, ocean/air fulfillment success rates, and customer acquisition growth.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Horizon Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setTimeHorizon('6m')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                timeHorizon === '6m' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 6 Months
            </button>
            <button
              onClick={() => setTimeHorizon('12m')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                timeHorizon === '12m' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              12 Months
            </button>
            <button
              onClick={() => setTimeHorizon('ytd')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                timeHorizon === 'ytd' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              YTD 2026
            </button>
          </div>

          {/* Export CSV Report */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </header>

      {/* Primary Executive Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Export Volume ({timeHorizon.toUpperCase()})</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {aggregates.totalVolume.toLocaleString()}
            </h3>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              +18.4% <ArrowUpRight size={14} />
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {aggregates.totalCartons.toLocaleString()} export cartons dispatched
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Export Gross Value</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              ${(aggregates.totalRevenue / 1000000).toFixed(2)}M
            </h3>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              +24.1% <ArrowUpRight size={14} />
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            USD trade remittance via L/C & TT
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Shipment SLA Success Rate</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {aggregates.avgOnTime}%
            </h3>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              Target 98.0%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {aggregates.avgQcPass}% AQL 2.5 QC pass rate
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Active Global Buyers</p>
          <div className="flex items-baseline justify-between mt-2">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {aggregates.latestActiveBuyers}
            </h3>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              +{aggregates.totalNewBuyers} new
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            92% recurring repeat order rate
          </p>
        </div>
      </section>

      {/* CHART SECTION 1: Monthly Export Volume Trends */}
      <section className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Monthly Export Volume & Sourcing Throughput
              </h3>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              Visualizing output volume across ready-made garments, knitted cotton styles, and export packaging.
            </p>
          </div>

          {/* Metric Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setVolumeMetric('units')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  volumeMetric === 'units' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Volume (Pieces)
              </button>
              <button
                onClick={() => setVolumeMetric('cartons')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  volumeMetric === 'cartons' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cartons
              </button>
              <button
                onClick={() => setVolumeMetric('revenue')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  volumeMetric === 'revenue' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Value ($ USD)
              </button>
            </div>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorOcean" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => 
                  volumeMetric === 'revenue' 
                    ? `$${(val / 1000).toFixed(0)}k` 
                    : volumeMetric === 'cartons' 
                      ? `${val}` 
                      : `${(val / 1000).toFixed(0)}k`
                }
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#1e293b', 
                  borderRadius: '1rem', 
                  color: '#fff', 
                  fontSize: '12px' 
                }}
                formatter={(val: any, name: any) => [
                  volumeMetric === 'revenue' ? `$${Number(val).toLocaleString()}` : `${Number(val).toLocaleString()} ${volumeMetric}`,
                  name === 'volumeUnits' ? 'Total Pcs Exported' : name === 'volumeCartons' ? 'Total Cartons' : 'Export Value'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey={volumeMetric === 'units' ? 'volumeUnits' : volumeMetric === 'cartons' ? 'volumeCartons' : 'revenueUSD'} 
                stroke="#dc2626" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorVolume)" 
                name={volumeMetric === 'units' ? 'volumeUnits' : volumeMetric === 'cartons' ? 'volumeCartons' : 'revenueUSD'}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Mode Split Breakdown (Ocean vs Air) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-blue-100 text-blue-700">
                <Ship size={18} />
              </span>
              <div>
                <p className="font-bold text-slate-800">Ocean Freight Corridors (FCL / LCL)</p>
                <p className="text-slate-500 text-[11px]">Chittagong Port to Busan, Los Angeles & Hamburg</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-black text-slate-900 text-sm">86.2%</span>
              <p className="text-slate-400 text-[11px]">Primary Bulk Routing</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-red-100 text-red-700">
                <Plane size={18} />
              </span>
              <div>
                <p className="font-bold text-slate-800">Air Express Fast-Track</p>
                <p className="text-slate-500 text-[11px]">DAC Airport Priority Samples & Seasonal Launches</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-black text-slate-900 text-sm">13.8%</span>
              <p className="text-slate-400 text-[11px]">Express Fulfillment</p>
            </div>
          </div>
        </div>
      </section>

      {/* CHART SECTION 2 & 3 GRID: Shipment Success Rates & Customer Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CHART SECTION 2: Shipment Success & SLA Rates */}
        <section className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    Shipment Success & Fulfillment Rates
                  </h3>
                </div>
                <p className="text-slate-500 text-xs mt-0.5">
                  Monthly On-Time Delivery % vs 98.0% Benchmark SLA target.
                </p>
              </div>
              <span className="text-xs font-black text-emerald-600">99.2% Current</span>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={filteredData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis domain={[95, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#1e293b', 
                      borderRadius: '1rem', 
                      color: '#fff', 
                      fontSize: '12px' 
                    }}
                    formatter={(val: any, name: any) => [
                      `${val}%`, 
                      name === 'onTimeRate' ? 'On-Time Delivery SLA' : name === 'customsClearance' ? 'Customs 1st-Pass Rate' : 'QC Pass Rate'
                    ]}
                  />
                  <ReferenceLine y={98.0} stroke="#dc2626" strokeDasharray="4 4" label={{ value: 'Target 98%', fill: '#dc2626', fontSize: 10, position: 'right' }} />
                  <Bar dataKey="customsClearance" fill="#93c5fd" opacity={0.4} barSize={14} radius={[4, 4, 0, 0]} name="customsClearance" />
                  <Line type="monotone" dataKey="onTimeRate" stroke="#059669" strokeWidth={3} dot={{ fill: '#059669', r: 4 }} name="onTimeRate" />
                  <Line type="monotone" dataKey="qcPassRate" stroke="#2563eb" strokeWidth={2} strokeDasharray="2 2" dot={false} name="qcPassRate" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-center text-xs">
            <div className="p-3 rounded-xl bg-slate-50">
              <p className="text-slate-400 text-[10px] font-bold uppercase">On-Time SLA</p>
              <p className="text-base font-black text-emerald-600 mt-0.5">{aggregates.avgOnTime}%</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <p className="text-slate-400 text-[10px] font-bold uppercase">Customs 1st Pass</p>
              <p className="text-base font-black text-blue-600 mt-0.5">99.1%</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <p className="text-slate-400 text-[10px] font-bold uppercase">Exception Rate</p>
              <p className="text-base font-black text-slate-800 mt-0.5">0.8%</p>
            </div>
          </div>
        </section>

        {/* CHART SECTION 3: Customer Growth & Buyer Acquisition Trends */}
        <section className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    Customer Growth & Buyer Trends
                  </h3>
                </div>
                <p className="text-slate-500 text-xs mt-0.5">
                  Cumulative active buyer accounts & monthly enterprise acquisitions.
                </p>
              </div>
              <span className="text-xs font-black text-blue-600">{aggregates.latestActiveBuyers} Enterprise Buyers</span>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#1e293b', 
                      borderRadius: '1rem', 
                      color: '#fff', 
                      fontSize: '12px' 
                    }}
                    formatter={(val: any, name: any) => [
                      val, 
                      name === 'activeBuyers' ? 'Total Active Buyers' : 'New Acquisitions'
                    ]}
                  />
                  <Bar dataKey="activeBuyers" fill="#2563eb" radius={[6, 6, 0, 0]} name="activeBuyers" />
                  <Bar dataKey="newBuyers" fill="#f87171" radius={[6, 6, 0, 0]} name="newBuyers" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Regional Buyer Share Distribution */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Regional Market Share Breakdown
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {REGIONAL_BUYER_DISTRIBUTION.map((reg, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: reg.color }}></span>
                    <span className="font-black text-slate-800">{reg.value}%</span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate" title={reg.name}>{reg.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Strategic Operational Recommendations Banner */}
      <footer className="bg-slate-900 text-white p-6 sm:p-8 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
            <Sparkles size={16} />
            <span>AI Supply Chain Optimization Insights</span>
          </div>
          <h4 className="text-lg font-black tracking-tight">Capacity & Throughput Advisory</h4>
          <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
            Q4 export volume is projected to grow by +16.8% led by South Korean streetwear collections and US West Coast spring bulk orders. Ocean freight container booking 14 days in advance is recommended to maintain the 99% SLA benchmark.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab?.('documents')}
            className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-red-600/30 cursor-pointer"
          >
            Draft Next Consignment
          </button>
        </div>
      </footer>
    </div>
  );
};
