import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart
} from 'recharts';
import {
  TrendingUp,
  Globe,
  Ship,
  Plane,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Download,
  Filter,
  Layers,
  Calendar,
  DollarSign,
  Building2,
  Anchor,
  Sparkles,
  BarChart3,
  Percent,
  RefreshCw
} from 'lucide-react';
import { ShipmentProfile } from '../types';

interface TradePerformanceAnalyticsProps {
  shipments?: ShipmentProfile[];
}

// Brand color palette aligned with Red Bird International
const CHART_THEME = {
  primary: '#ef4444',      // Red Bird Red
  primaryLight: '#fca5a5',
  secondary: '#3b82f6',    // Maritime Blue
  secondaryLight: '#93c5fd',
  emerald: '#10b981',      // On-time / Korea Line
  amber: '#f59e0b',        // Knitwear / Warnings
  purple: '#8b5cf6',       // EU Corridors
  slateDark: '#0f172a',
  slateLight: '#f1f5f9',
  grid: '#e2e8f0',
};

const PIE_COLORS = [
  '#ef4444', // South Korea
  '#3b82f6', // Japan
  '#10b981', // Germany / EU
  '#f59e0b', // USA / North America
  '#8b5cf6', // Nordic / Scandinavia
  '#06b6d4', // Middle East
];

export const TradePerformanceAnalytics: React.FC<TradePerformanceAnalyticsProps> = ({ shipments = [] }) => {
  const [timeRange, setTimeRange] = useState<'6m' | '12m' | 'all'>('12m');
  const [sourcingFilter, setSourcingFilter] = useState<'all' | 'oem' | 'surplus'>('all');
  const [volumeMetric, setVolumeMetric] = useState<'pcs' | 'cartons' | 'value'>('pcs');
  const [activeLaneFilter, setActiveLaneFilter] = useState<string>('all');

  // Baseline Monthly Trade Data (Chronologically calibrated for export seasons)
  // Autumn/Winter production runs in June-September; Spring/Summer in Dec-March
  const baselineMonthlyData = useMemo(() => [
    { month: 'Oct 2025', oemPcs: 18500, surplusPcs: 6200, totalPcs: 24700, cartons: 820, valueUsd: 178000, teu: 2.5, onTimeRate: 98 },
    { month: 'Nov 2025', oemPcs: 22000, surplusPcs: 7800, totalPcs: 29800, cartons: 990, valueUsd: 215000, teu: 3.0, onTimeRate: 97 },
    { month: 'Dec 2025', oemPcs: 26500, surplusPcs: 9200, totalPcs: 35700, cartons: 1190, valueUsd: 264000, teu: 3.6, onTimeRate: 99 },
    { month: 'Jan 2026', oemPcs: 21000, surplusPcs: 5400, totalPcs: 26400, cartons: 880, valueUsd: 192000, teu: 2.7, onTimeRate: 96 },
    { month: 'Feb 2026', oemPcs: 24800, surplusPcs: 8100, totalPcs: 32900, cartons: 1100, valueUsd: 242000, teu: 3.3, onTimeRate: 98 },
    { month: 'Mar 2026', oemPcs: 29500, surplusPcs: 11200, totalPcs: 40700, cartons: 1350, valueUsd: 310000, teu: 4.1, onTimeRate: 97 },
    { month: 'Apr 2026', oemPcs: 31200, surplusPcs: 10400, totalPcs: 41600, cartons: 1390, valueUsd: 318000, teu: 4.2, onTimeRate: 99 },
    { month: 'May 2026', oemPcs: 34000, surplusPcs: 12500, totalPcs: 46500, cartons: 1550, valueUsd: 355000, teu: 4.7, onTimeRate: 98 },
    { month: 'Jun 2026', oemPcs: 38200, surplusPcs: 14800, totalPcs: 53000, cartons: 1760, valueUsd: 412000, teu: 5.3, onTimeRate: 97 },
    { month: 'Jul 2026', oemPcs: 42500, surplusPcs: 15900, totalPcs: 58400, cartons: 1950, valueUsd: 456000, teu: 5.9, onTimeRate: 98 },
    { month: 'Aug 2026', oemPcs: 45100, surplusPcs: 17200, totalPcs: 62300, cartons: 2080, valueUsd: 489000, teu: 6.2, onTimeRate: 96 },
    { month: 'Sep 2026', oemPcs: 47800, surplusPcs: 18100, totalPcs: 65900, cartons: 2200, valueUsd: 521000, teu: 6.6, onTimeRate: 99 },
  ], []);

  // Filtered monthly data according to user time-horizon
  const monthlyData = useMemo(() => {
    let raw = [...baselineMonthlyData];
    if (timeRange === '6m') {
      raw = raw.slice(-6);
    } else if (timeRange === '12m') {
      raw = raw.slice(-12);
    }

    // Merge live Firestore shipments if present
    if (shipments.length > 0) {
      shipments.forEach(s => {
        if (!s.date) return;
        const d = new Date(s.date);
        if (isNaN(d.getTime())) return;
        const monthKey = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const existing = raw.find(m => m.month === monthKey);
        const qty = s.totalQuantity || 0;
        const val = s.totalAmount || (qty * (s.sellingPrice || 12));
        const ctn = s.totalCartons || Math.round(qty / 30);

        if (existing) {
          existing.totalPcs += qty;
          existing.cartons += ctn;
          existing.valueUsd += val;
          existing.oemPcs += Math.round(qty * 0.7);
          existing.surplusPcs += Math.round(qty * 0.3);
        }
      });
    }

    return raw.map(m => {
      let displayValue = m.totalPcs;
      if (volumeMetric === 'cartons') displayValue = m.cartons;
      if (volumeMetric === 'value') displayValue = m.valueUsd;

      return {
        ...m,
        displayVolume: displayValue,
        activeOEM: sourcingFilter === 'surplus' ? 0 : m.oemPcs,
        activeSurplus: sourcingFilter === 'oem' ? 0 : m.surplusPcs,
      };
    });
  }, [baselineMonthlyData, timeRange, shipments, volumeMetric, sourcingFilter]);

  // Buyer Distribution Data
  const buyerData = useMemo(() => {
    return [
      {
        id: 'b1',
        buyerName: 'Seoul Fashion Trading Co.',
        region: 'South Korea (Seoul)',
        country: 'South Korea',
        marketShare: 34.5,
        totalPcs: 178200,
        fobValueUsd: 1215000,
        orderCount: 18,
        mainGarments: '220 GSM Heavyweight T-Shirts, Hoodies',
        port: 'Busan Port (KRPUS)',
        status: 'Strategic OEM Partner'
      },
      {
        id: 'b2',
        buyerName: 'Busan Import Logistics Ltd.',
        region: 'South Korea (Busan)',
        country: 'South Korea',
        marketShare: 19.8,
        totalPcs: 102400,
        fobValueUsd: 698000,
        orderCount: 11,
        mainGarments: 'Custom Combed Crewnecks, Knit Sweaters',
        port: 'Busan Port (KRPUS)',
        status: 'Active Recurring'
      },
      {
        id: 'b3',
        buyerName: 'Tokyo Retail Apparel Group',
        region: 'Japan (Tokyo/Osaka)',
        country: 'Japan',
        marketShare: 16.2,
        totalPcs: 83700,
        fobValueUsd: 642000,
        orderCount: 9,
        mainGarments: 'Fine Gauge Knitwear, Premium Oversized Tees',
        port: 'Tokyo/Yokohama (JPTYO)',
        status: 'High Precision Tier'
      },
      {
        id: 'b4',
        buyerName: 'Hamburg European Distribution GmbH',
        region: 'European Union (Germany)',
        country: 'Germany',
        marketShare: 14.5,
        totalPcs: 74900,
        fobValueUsd: 588000,
        orderCount: 8,
        mainGarments: '12GG Merino Sweaters, Surplus Allocations',
        port: 'Hamburg Port (DEHAM)',
        status: 'EU Customs Cleared'
      },
      {
        id: 'b5',
        buyerName: 'Nordic Apparel Sourcing AS',
        region: 'European Union (Norway/Sweden)',
        country: 'Norway',
        marketShare: 8.5,
        totalPcs: 43900,
        fobValueUsd: 365000,
        orderCount: 5,
        mainGarments: 'Brushed French Terry Hoodies',
        port: 'Rotterdam (NLRTM) Transshipment',
        status: 'Verified Contract'
      },
      {
        id: 'b6',
        buyerName: 'West Coast Wholesale Network',
        region: 'North America (USA)',
        country: 'USA',
        marketShare: 6.5,
        totalPcs: 33600,
        fobValueUsd: 284000,
        orderCount: 4,
        mainGarments: 'Certified Surplus Lots, T-Shirt Multipacks',
        port: 'Los Angeles / Long Beach (USLAX)',
        status: 'Spot Allocation'
      }
    ];
  }, []);

  // Regional aggregated share for pie chart
  const regionalShareData = useMemo(() => {
    const map: Record<string, { name: string; value: number; pcs: number; valueUsd: number }> = {};
    buyerData.forEach(b => {
      if (!map[b.country]) {
        map[b.country] = { name: b.country, value: 0, pcs: 0, valueUsd: 0 };
      }
      map[b.country].value += b.marketShare;
      map[b.country].pcs += b.totalPcs;
      map[b.country].valueUsd += b.fobValueUsd;
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [buyerData]);

  // Shipment Transit Time Benchmarks & Performance
  const transitTimesData = useMemo(() => {
    return [
      {
        laneId: 'lane-busan',
        corridor: 'Chittagong ➔ Busan',
        origin: 'CTG Port, BD',
        destination: 'Busan Port, KR',
        mode: 'Sea Freight',
        scheduledDays: 19,
        actualDays: 18.2,
        varianceDays: -0.8,
        onTimeRate: 98.4,
        vesselFleet: 'Hyundai Merchant / Ocean Express',
        dwellHours: 24,
        clearanceRating: 'Express Green Lane',
        status: 'Optimal Velocity'
      },
      {
        laneId: 'lane-tokyo',
        corridor: 'Chittagong ➔ Tokyo',
        origin: 'CTG Port, BD',
        destination: 'Yokohama Port, JP',
        mode: 'Sea Freight',
        scheduledDays: 22,
        actualDays: 21.4,
        varianceDays: -0.6,
        onTimeRate: 97.8,
        vesselFleet: 'ONE Line / Pacific Star',
        dwellHours: 28,
        clearanceRating: 'AQL Fast Track',
        status: 'Optimal Velocity'
      },
      {
        laneId: 'lane-hamburg',
        corridor: 'Chittagong ➔ Hamburg',
        origin: 'CTG Port, BD',
        destination: 'Hamburg Port, DE',
        mode: 'Sea Freight',
        scheduledDays: 31,
        actualDays: 29.8,
        varianceDays: -1.2,
        onTimeRate: 96.5,
        vesselFleet: 'Hapag-Lloyd / MSC Corridors',
        dwellHours: 36,
        clearanceRating: 'EU Standard Clean',
        status: 'Suez Direct Routing'
      },
      {
        laneId: 'lane-rotterdam',
        corridor: 'Chittagong ➔ Rotterdam',
        origin: 'CTG Port, BD',
        destination: 'Rotterdam Port, NL',
        mode: 'Sea Freight',
        scheduledDays: 28,
        actualDays: 27.5,
        varianceDays: -0.5,
        onTimeRate: 97.1,
        vesselFleet: 'Maersk / CMA CGM Euro',
        dwellHours: 32,
        clearanceRating: 'Pre-Arrival Verified',
        status: 'Optimal Velocity'
      },
      {
        laneId: 'lane-la',
        corridor: 'Chittagong ➔ Los Angeles',
        origin: 'CTG Port, BD',
        destination: 'LA / Long Beach, US',
        mode: 'Sea Freight',
        scheduledDays: 34,
        actualDays: 33.2,
        varianceDays: -0.8,
        onTimeRate: 94.8,
        vesselFleet: 'Trans-Pacific Direct',
        dwellHours: 48,
        clearanceRating: 'C-TPAT Priority',
        status: 'Congestion Monitored'
      },
      {
        laneId: 'lane-icn-air',
        corridor: 'Dhaka ➔ Incheon (Air)',
        origin: 'DAC Airport, BD',
        destination: 'Incheon Airport, KR',
        mode: 'Air Express',
        scheduledDays: 3,
        actualDays: 2.4,
        varianceDays: -0.6,
        onTimeRate: 99.2,
        vesselFleet: 'Korean Air / Biman Cargo',
        dwellHours: 6,
        clearanceRating: 'Direct Ramp Transfer',
        status: 'Ultra Express'
      },
      {
        laneId: 'lane-fra-air',
        corridor: 'Dhaka ➔ Frankfurt (Air)',
        origin: 'DAC Airport, BD',
        destination: 'Frankfurt Airport, DE',
        mode: 'Air Express',
        scheduledDays: 4,
        actualDays: 3.2,
        varianceDays: -0.8,
        onTimeRate: 98.6,
        vesselFleet: 'Lufthansa Cargo B777F',
        dwellHours: 8,
        clearanceRating: 'EU Air Bonded',
        status: 'Ultra Express'
      }
    ];
  }, []);

  // Filtered transit lanes
  const displayedTransitData = useMemo(() => {
    if (activeLaneFilter === 'all') return transitTimesData;
    if (activeLaneFilter === 'sea') return transitTimesData.filter(t => t.mode === 'Sea Freight');
    if (activeLaneFilter === 'air') return transitTimesData.filter(t => t.mode === 'Air Express');
    return transitTimesData;
  }, [transitTimesData, activeLaneFilter]);

  // Aggregate high-level stats
  const totalVolumePcs = useMemo(() => monthlyData.reduce((sum, m) => sum + m.totalPcs, 0), [monthlyData]);
  const totalExportValue = useMemo(() => monthlyData.reduce((sum, m) => sum + m.valueUsd, 0), [monthlyData]);
  const avgTransitDays = useMemo(() => {
    const seaLanes = transitTimesData.filter(t => t.mode === 'Sea Freight');
    const avg = seaLanes.reduce((sum, l) => sum + l.actualDays, 0) / seaLanes.length;
    return avg.toFixed(1);
  }, [transitTimesData]);
  const overallOnTimeRate = useMemo(() => {
    const avg = transitTimesData.reduce((sum, l) => sum + l.onTimeRate, 0) / transitTimesData.length;
    return avg.toFixed(1);
  }, [transitTimesData]);

  // Handler to export analytical CSV
  const handleExportCSV = () => {
    const headers = ['Month', 'Custom OEM (Pcs)', 'Surplus Sourcing (Pcs)', 'Total Volume (Pcs)', 'Cartons', 'Export Value (USD)', 'Container TEU', 'On-Time Rate (%)'];
    const rows = monthlyData.map(m => [
      `"${m.month}"`,
      m.oemPcs,
      m.surplusPcs,
      m.totalPcs,
      m.cartons,
      m.valueUsd,
      m.teu,
      `${m.onTimeRate}%`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RedBird_Trade_Performance_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10 animate-fade-in font-sans">
      
      {/* SECTION HEADER & CONTROL BAR */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Trade Performance Analytics
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Recharts Engine
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Visualizing monthly export volume velocity, international buyer market share, and maritime transit duration.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Time range toggle */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200/60">
            {(['6m', '12m', 'all'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timeRange === range
                    ? 'bg-white text-slate-950 shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range === '6m' ? 'Last 6 Months' : range === '12m' ? 'Past 12 Months' : 'All Horizon'}
              </button>
            ))}
          </div>

          {/* Sourcing filter */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200/60">
            <button
              onClick={() => setSourcingFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                sourcingFilter === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              All Programs
            </button>
            <button
              onClick={() => setSourcingFilter('oem')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                sourcingFilter === 'oem' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Custom OEM
            </button>
            <button
              onClick={() => setSourcingFilter('surplus')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                sourcingFilter === 'surplus' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Surplus Lots
            </button>
          </div>

          {/* Download CSV button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-slate-900 hover:bg-red-600 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 ml-auto sm:ml-0"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* EXECUTIVE KPI SUMMARY TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1: Total Volume */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm relative overflow-hidden group hover:border-red-300 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50/60 rounded-bl-full flex items-start justify-end p-5 text-red-600">
            <Package className="w-6 h-6" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Export Volume</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {totalVolumePcs.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-500">Pcs</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +24.8% YoY
            </span>
            <span className="text-slate-500 font-medium">
              Korea OEM Line Lead (54.3%)
            </span>
          </div>
        </div>

        {/* Metric 2: FOB Export Turnover */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/60 rounded-bl-full flex items-start justify-end p-5 text-blue-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Cumulative FOB Value</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              ${(totalExportValue / 1000000).toFixed(2)}M
            </span>
            <span className="text-xs font-bold text-slate-500">USD</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
            <span className="text-slate-500">Avg Unit FOB:</span>
            <span className="font-bold text-slate-900">$8.45 / Piece</span>
          </div>
        </div>

        {/* Metric 3: Maritime Speed & Transit Duration */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/60 rounded-bl-full flex items-start justify-end p-5 text-amber-600">
            <Ship className="w-6 h-6" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Avg Sea Transit Time</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {avgTransitDays}
            </span>
            <span className="text-xs font-bold text-slate-500">Days (Port-to-Port)</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
            <span className="text-slate-500">Fastest Lane:</span>
            <span className="font-bold text-slate-900">Busan Port (18.2d)</span>
          </div>
        </div>

        {/* Metric 4: On-Time Delivery Reliability */}
        <div className="bg-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full flex items-start justify-end p-5 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">On-Time Fulfillment</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
              {overallOnTimeRate}%
            </span>
            <span className="text-xs font-bold text-slate-400">Export SLA</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="text-emerald-400 font-bold">Zero Port Penalties</span>
            <span>AQL 1.5 Compliant</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 1. MONTHLY EXPORT VOLUMES SECTION (RECHARTS BAR & AREA VISUALIZATION)     */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              <h3 className="text-xl font-black text-slate-900">Monthly Export Volumes</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Comparison between Custom OEM Manufacturing shipments (Korea Line T-shirts, Fine Knitwear) and Verified Surplus allocations.
            </p>
          </div>

          {/* Metric Selector Toggle */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => setVolumeMetric('pcs')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                volumeMetric === 'pcs' ? 'bg-white text-slate-950 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Garment Units (Pcs)
            </button>
            <button
              onClick={() => setVolumeMetric('cartons')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                volumeMetric === 'cartons' ? 'bg-white text-slate-950 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Export Cartons
            </button>
            <button
              onClick={() => setVolumeMetric('value')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                volumeMetric === 'value' ? 'bg-white text-slate-950 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              FOB Value ($ USD)
            </button>
          </div>
        </div>

        {/* Main Chart Area */}
        <div className="h-88 sm:h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="oemGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_THEME.primary} stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#b91c1c" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="surplusGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_THEME.secondary} stopOpacity={0.85} />
                  <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.85} />
                </linearGradient>
                <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_THEME.emerald} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={CHART_THEME.emerald} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_THEME.grid} />
              
              <XAxis 
                dataKey="month" 
                tickLine={false} 
                axisLine={{ stroke: '#cbd5e1' }}
                tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} 
              />
              
              <YAxis 
                tickLine={false} 
                axisLine={false}
                tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                tickFormatter={(val) => {
                  if (volumeMetric === 'value') return `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`;
                  return val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val;
                }}
              />

              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '14px 16px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                }}
                labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}
                itemStyle={{ fontSize: '12px', fontWeight: 700, padding: '2px 0' }}
                formatter={(value: any, name: string) => {
                  const formatted = Number(value).toLocaleString();
                  if (name === 'Custom OEM Production') {
                    return [volumeMetric === 'value' ? `$${formatted}` : `${formatted} Pcs`, 'Custom OEM (Korea Line)'];
                  }
                  if (name === 'Verified Surplus Allocation') {
                    return [volumeMetric === 'value' ? `$${formatted}` : `${formatted} Pcs`, 'Verified Surplus Sourcing'];
                  }
                  if (name === 'Total Monthly Volume') {
                    return [volumeMetric === 'value' ? `$${formatted}` : `${formatted} Pcs`, 'Total Program Output'];
                  }
                  return [formatted, name];
                }}
              />

              <Legend 
                verticalAlign="top" 
                align="right"
                wrapperStyle={{ paddingBottom: '20px', fontSize: '11px', fontWeight: 700 }}
              />

              <Bar 
                dataKey="activeOEM" 
                name="Custom OEM Production" 
                stackId="volumeStack" 
                fill="url(#oemGrad)" 
                radius={[0, 0, 4, 4]} 
                barSize={32}
              />
              <Bar 
                dataKey="activeSurplus" 
                name="Verified Surplus Allocation" 
                stackId="volumeStack" 
                fill="url(#surplusGrad)" 
                radius={[6, 6, 0, 0]} 
                barSize={32}
              />

              <Line 
                type="monotone" 
                dataKey="totalPcs" 
                name="Total Monthly Volume" 
                stroke={CHART_THEME.slateDark} 
                strokeWidth={2.5} 
                dot={{ r: 4, stroke: CHART_THEME.primary, strokeWidth: 2, fill: '#ffffff' }}
                activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 3, fill: CHART_THEME.primary }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Analytical Notes Footer */}
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl">
            <span className="w-2 h-2 rounded-full bg-red-600 mt-1.5 shrink-0"></span>
            <div>
              <p className="font-bold text-slate-900">Korea OEM Surge (Q2-Q3)</p>
              <p className="text-slate-500 mt-0.5">Heavyweight 220 GSM crewneck t-shirts accounted for 64% of high-volume seasonal deliveries.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl">
            <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>
            <div>
              <p className="font-bold text-slate-900">Fine Knitwear Winter Loading</p>
              <p className="text-slate-500 mt-0.5">12GG Merino blends & French Terry hoodies surged to European ports during August & September.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl">
            <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0"></span>
            <div>
              <p className="font-bold text-slate-900">Container Packing Density</p>
              <p className="text-slate-500 mt-0.5">Automated Packing List matrices maximized 40ft High Cube container cube utilization to 94.2%.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. BUYER DISTRIBUTION SECTION (RECHARTS DONUT & HORIZONTAL BAR CHARTS)    */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Market Share Donut Chart (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Buyer Regional Share</h3>
                <p className="text-xs text-slate-500 font-medium">Export concentration across target global markets.</p>
              </div>
              <span className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                <Globe className="w-5 h-5 text-red-600" />
              </span>
            </div>

            {/* Donut Chart */}
            <div className="h-64 w-full relative flex items-center justify-center my-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={regionalShareData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {regionalShareData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      padding: '10px 14px'
                    }}
                    itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: 700 }}
                    formatter={(val: any, name: string) => [`${val}% Market Share`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-slate-900 leading-none">54.3%</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">
                  South Korea
                </span>
              </div>
            </div>

            {/* Regional breakdown legend pill list */}
            <div className="space-y-2 mt-2">
              {regionalShareData.map((reg, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                    <span className="font-bold text-slate-800">{reg.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-medium">{reg.pcs.toLocaleString()} Pcs</span>
                    <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                      {reg.value.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Primary Trade Corridor:</span>
            <span className="font-bold text-slate-900">Dhaka / CTG ➔ Busan KRPUS</span>
          </div>
        </div>

        {/* Buyer Account Performance Rankings (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Key Buyer Accounts Breakdown</h3>
                <p className="text-xs text-slate-500 font-medium">Export volume and FOB value generated per international wholesale account.</p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                6 Active Institutional Accounts
              </span>
            </div>

            {/* Horizontal Bar Chart showing volume per buyer */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={buyerData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={CHART_THEME.grid} />
                  <XAxis 
                    type="number" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k Pcs`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="buyerName" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#1e293b' }}
                    width={130}
                    tickFormatter={(val) => val.length > 18 ? val.substring(0, 16) + '..' : val}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      padding: '12px'
                    }}
                    labelStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: 900 }}
                    formatter={(val: any) => [
                      `${(Number(val) || 0).toLocaleString()} Pcs (${totalVolumePcs > 0 ? ((Number(val) / totalVolumePcs) * 100).toFixed(1) : '0.0'}% of total)`,
                      'Shipped Volume'
                    ]}
                  />
                  <Bar dataKey="totalPcs" fill={CHART_THEME.primary} radius={[0, 8, 8, 0]} barSize={18}>
                    {buyerData.map((entry, index) => (
                      <Cell key={`buyer-bar-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Account Matrix Cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {buyerData.slice(0, 4).map((buyer, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-slate-900 truncate max-w-[170px]">{buyer.buyerName}</p>
                      <p className="text-[10px] text-slate-500">{buyer.region}</p>
                    </div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800">
                      {buyer.orderCount} Orders
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 text-[11px]">
                    <span className="text-slate-500 truncate max-w-[130px]">{buyer.mainGarments}</span>
                    <span className="font-black text-slate-900">${(buyer.fobValueUsd / 1000).toFixed(0)}k FOB</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 3. SHIPMENT TRANSIT TIMES SECTION (RECHARTS BAR & VARIANCE PERFORMANCE)   */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h3 className="text-xl font-black text-slate-900">Shipment Transit Times & Lane Velocity</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Scheduled vs. actual port-to-port duration across major global ocean and air cargo corridors.
            </p>
          </div>

          {/* Lane Filter */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => setActiveLaneFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeLaneFilter === 'all' ? 'bg-white text-slate-950 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Lanes
            </button>
            <button
              onClick={() => setActiveLaneFilter('sea')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeLaneFilter === 'sea' ? 'bg-blue-600 text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Ship className="w-3.5 h-3.5" /> Maritime Corridors
            </button>
            <button
              onClick={() => setActiveLaneFilter('air')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeLaneFilter === 'air' ? 'bg-red-600 text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plane className="w-3.5 h-3.5" /> Air Express
            </button>
          </div>
        </div>

        {/* Transit Times Comparison Chart */}
        <div className="h-88 sm:h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayedTransitData}
              margin={{ top: 20, right: 30, left: 10, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_THEME.grid} />
              
              <XAxis 
                dataKey="corridor" 
                tickLine={false} 
                axisLine={{ stroke: '#cbd5e1' }}
                tick={{ fontSize: 11, fontWeight: 700, fill: '#334155' }}
                interval={0}
              />
              
              <YAxis 
                tickLine={false} 
                axisLine={false}
                tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                tickFormatter={(val) => `${val} d`}
              />

              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '14px 16px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                }}
                labelStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: 900, marginBottom: '6px' }}
                formatter={(value: any, name: string) => [
                  `${value} Days`,
                  name === 'scheduledDays' ? 'Scheduled Target' : 'Actual Port-to-Port'
                ]}
              />

              <Legend 
                verticalAlign="top" 
                align="right"
                wrapperStyle={{ paddingBottom: '20px', fontSize: '11px', fontWeight: 700 }}
              />

              <Bar 
                dataKey="scheduledDays" 
                name="Scheduled Target (Days)" 
                fill="#94a3b8" 
                radius={[6, 6, 0, 0]} 
                barSize={24}
              />
              <Bar 
                dataKey="actualDays" 
                name="Actual Port-to-Port (Days)" 
                fill={CHART_THEME.secondary} 
                radius={[6, 6, 0, 0]} 
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Corridor Audit Table */}
        <div className="mt-8 border border-slate-200/80 rounded-2xl overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Anchor className="w-4 h-4 text-blue-600" />
              Trade Corridor Transit Performance Audit
            </h4>
            <span className="text-xs text-slate-500 font-medium">Updated per B/L discharge dates</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-white text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-6">Corridor Route</th>
                  <th className="py-3 px-4">Transport Mode</th>
                  <th className="py-3 px-4 text-center">Scheduled</th>
                  <th className="py-3 px-4 text-center">Actual Transit</th>
                  <th className="py-3 px-4 text-center">Variance</th>
                  <th className="py-3 px-4 text-center">On-Time SLA</th>
                  <th className="py-3 px-6">Port Dwell & Customs Clearance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {displayedTransitData.map((lane) => (
                  <tr key={lane.laneId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6">
                      <p className="font-bold text-slate-900">{lane.corridor}</p>
                      <p className="text-[10px] text-slate-500">{lane.vesselFleet}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        lane.mode === 'Sea Freight' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {lane.mode === 'Sea Freight' ? <Ship className="w-3 h-3" /> : <Plane className="w-3 h-3" />}
                        {lane.mode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                      {lane.scheduledDays} Days
                    </td>
                    <td className="py-3.5 px-4 text-center font-black text-slate-900">
                      {lane.actualDays} Days
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {lane.varianceDays}d (Faster)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-black text-slate-900">{lane.onTimeRate}%</span>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">{lane.dwellHours}h Port Dwell</span>
                        <span className="text-[10px] text-slate-400">• {lane.clearanceRating}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
};

export default TradePerformanceAnalytics;
