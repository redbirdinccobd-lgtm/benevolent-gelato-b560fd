import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
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
  Ship,
  Plane,
  Clock,
  TrendingUp,
  Package,
  BarChart3,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Download,
  Filter,
  Layers,
  Globe,
  Anchor,
  Gauge,
  Zap,
  Sparkles,
  RefreshCw,
  Sliders,
  ChevronRight,
  Info,
  Building2,
  FileCheck
} from 'lucide-react';
import { ShipmentProfile } from '../types';

interface ExportVolumeLeadTimeAnalyticsProps {
  shipments?: ShipmentProfile[] | any[];
  onNavigateTab?: (tab: string, filter?: string) => void;
}

// Brand color palette strictly aligned with Red Bird International design tokens
const BRAND_COLORS = {
  red: '#dc2626',           // Red Bird Primary Red
  redLight: '#fee2e2',
  redDark: '#991b1b',
  blue: '#2563eb',          // Maritime Ocean Blue
  blueLight: '#dbeafe',
  emerald: '#059669',       // Cleared / On-Time SLA
  emeraldLight: '#d1fae5',
  amber: '#d97706',         // Port Staging / EXP Clearance
  amberLight: '#fef3c7',
  purple: '#7c3aed',        // Factory QA / Internal Stage
  purpleLight: '#ede9fe',
  slateDark: '#0f172a',
  slateMuted: '#64748b',
  slateBorder: '#e2e8f0',
  cardBg: '#ffffff',
  slateBg: '#f8fafc'
};

const PIE_PALETTE = [
  '#dc2626', // South Korea
  '#2563eb', // Japan
  '#059669', // Germany / EU
  '#d97706', // USA / North America
  '#7c3aed', // Nordic Countries
  '#0891b2', // Other Global Corridors
];

const SLA_COLORS = {
  ahead: '#059669',     // Ahead of schedule (>2 days buffer)
  onTime: '#2563eb',    // Exactly on-time (within 1 day)
  minorDelay: '#d97706',// 1-3 days buffer delay
  exception: '#dc2626'  // >3 days delay requiring intervention
};

export const ExportVolumeLeadTimeAnalytics: React.FC<ExportVolumeLeadTimeAnalyticsProps> = ({
  shipments = [],
  onNavigateTab
}) => {
  // Filter States
  const [timeHorizon, setTimeHorizon] = useState<'6m' | '12m' | 'all'>('12m');
  const [modeFilter, setModeFilter] = useState<'all' | 'Sea' | 'Air'>('all');
  const [volumeMetric, setVolumeMetric] = useState<'pcs' | 'cartons' | 'weight'>('pcs');
  const [destinationFilter, setDestinationFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'stages' | 'corridors' | 'simulator'>('overview');

  // Interactive Lead Time Simulator Inputs
  const [simDestination, setSimDestination] = useState<string>('Busan, South Korea');
  const [simMode, setSimMode] = useState<'Sea' | 'Air'>('Sea');
  const [simVolume, setSimVolume] = useState<number>(18000);
  const [simExpPreClearance, setSimExpPreClearance] = useState<boolean>(true);

  // Baseline Monthly Volume & Lead Time Dataset (12 Months, calibrated for Bangladesh Garment Exports)
  const baselineMonthlyMetrics = useMemo(() => [
    {
      month: 'Oct 2025',
      monthShort: 'Oct',
      seaVolumePcs: 19400,
      airVolumePcs: 3800,
      totalPcs: 23200,
      cartons: 770,
      grossWeightKg: 11600,
      avgSeaLeadTime: 23.4,
      avgAirLeadTime: 5.2,
      targetSeaSla: 24.0,
      customsClearanceDays: 3.4,
      onTimeRate: 97.2,
      shipmentCount: 6
    },
    {
      month: 'Nov 2025',
      monthShort: 'Nov',
      seaVolumePcs: 23500,
      airVolumePcs: 4500,
      totalPcs: 28000,
      cartons: 930,
      grossWeightKg: 14000,
      avgSeaLeadTime: 22.8,
      avgAirLeadTime: 5.0,
      targetSeaSla: 24.0,
      customsClearanceDays: 3.1,
      onTimeRate: 98.0,
      shipmentCount: 7
    },
    {
      month: 'Dec 2025',
      monthShort: 'Dec',
      seaVolumePcs: 28200,
      airVolumePcs: 5800,
      totalPcs: 34000,
      cartons: 1130,
      grossWeightKg: 17000,
      avgSeaLeadTime: 22.1,
      avgAirLeadTime: 4.8,
      targetSeaSla: 24.0,
      customsClearanceDays: 2.9,
      onTimeRate: 98.8,
      shipmentCount: 9
    },
    {
      month: 'Jan 2026',
      monthShort: 'Jan',
      seaVolumePcs: 21800,
      airVolumePcs: 3900,
      totalPcs: 25700,
      cartons: 860,
      grossWeightKg: 12850,
      avgSeaLeadTime: 22.5,
      avgAirLeadTime: 4.9,
      targetSeaSla: 24.0,
      customsClearanceDays: 3.0,
      onTimeRate: 97.5,
      shipmentCount: 6
    },
    {
      month: 'Feb 2026',
      monthShort: 'Feb',
      seaVolumePcs: 26400,
      airVolumePcs: 4800,
      totalPcs: 31200,
      cartons: 1040,
      grossWeightKg: 15600,
      avgSeaLeadTime: 21.9,
      avgAirLeadTime: 4.7,
      targetSeaSla: 24.0,
      customsClearanceDays: 2.7,
      onTimeRate: 98.4,
      shipmentCount: 8
    },
    {
      month: 'Mar 2026',
      monthShort: 'Mar',
      seaVolumePcs: 31200,
      airVolumePcs: 6100,
      totalPcs: 37300,
      cartons: 1240,
      grossWeightKg: 18650,
      avgSeaLeadTime: 21.5,
      avgAirLeadTime: 4.6,
      targetSeaSla: 24.0,
      customsClearanceDays: 2.6,
      onTimeRate: 98.9,
      shipmentCount: 10
    },
    {
      month: 'Apr 2026',
      monthShort: 'Apr',
      seaVolumePcs: 34500,
      airVolumePcs: 6400,
      totalPcs: 40900,
      cartons: 1360,
      grossWeightKg: 20450,
      avgSeaLeadTime: 21.2,
      avgAirLeadTime: 4.5,
      targetSeaSla: 24.0,
      customsClearanceDays: 2.5,
      onTimeRate: 99.1,
      shipmentCount: 11
    },
    {
      month: 'May 2026',
      monthShort: 'May',
      seaVolumePcs: 38200,
      airVolumePcs: 7200,
      totalPcs: 45400,
      cartons: 1510,
      grossWeightKg: 22700,
      avgSeaLeadTime: 20.8,
      avgAirLeadTime: 4.4,
      targetSeaSla: 24.0,
      customsClearanceDays: 2.4,
      onTimeRate: 99.2,
      shipmentCount: 12
    },
    {
      month: 'Jun 2026',
      monthShort: 'Jun',
      seaVolumePcs: 42100,
      airVolumePcs: 8100,
      totalPcs: 50200,
      cartons: 1670,
      grossWeightKg: 25100,
      avgSeaLeadTime: 20.4,
      avgAirLeadTime: 4.3,
      targetSeaSla: 24.0,
      customsClearanceDays: 2.3,
      onTimeRate: 99.4,
      shipmentCount: 13
    },
    {
      month: 'Jul 2026',
      monthShort: 'Jul',
      seaVolumePcs: 46800,
      airVolumePcs: 8900,
      totalPcs: 55700,
      cartons: 1860,
      grossWeightKg: 27850,
      avgSeaLeadTime: 20.1,
      avgAirLeadTime: 4.2,
      targetSeaSla: 24.0,
      customsClearanceDays: 2.2,
      onTimeRate: 99.5,
      shipmentCount: 14
    },
    {
      month: 'Aug 2026',
      monthShort: 'Aug',
      seaVolumePcs: 49500,
      airVolumePcs: 9400,
      totalPcs: 58900,
      cartons: 1960,
      grossWeightKg: 29450,
      avgSeaLeadTime: 19.8,
      avgAirLeadTime: 4.1,
      targetSeaSla: 24.0,
      customsClearanceDays: 2.1,
      onTimeRate: 99.6,
      shipmentCount: 15
    },
    {
      month: 'Sep 2026',
      monthShort: 'Sep',
      seaVolumePcs: 53200,
      airVolumePcs: 10100,
      totalPcs: 63300,
      cartons: 2110,
      grossWeightKg: 31650,
      avgSeaLeadTime: 19.4,
      avgAirLeadTime: 4.0,
      targetSeaSla: 24.0,
      customsClearanceDays: 2.0,
      onTimeRate: 99.7,
      shipmentCount: 16
    }
  ], []);

  // Filter Monthly Data based on time horizon & live Firestore shipments
  const filteredMonthlyData = useMemo(() => {
    let list = [...baselineMonthlyMetrics];
    if (timeHorizon === '6m') {
      list = list.slice(-6);
    } else if (timeHorizon === '12m') {
      list = list.slice(-12);
    }

    // Merge live Firestore shipments if present
    if (shipments && shipments.length > 0) {
      shipments.forEach(s => {
        if (!s.date) return;
        const d = new Date(s.date);
        if (isNaN(d.getTime())) return;
        const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
        const existing = list.find(m => m.monthShort === monthShort);

        const qty = Number(s.totalQuantity) || 0;
        const ctn = Number(s.totalCartons) || Math.round(qty / 30);
        const wt = Number(s.totalGrossWeight) || Math.round(qty * 0.5);
        const isAir = s.transportMode === 'Air';

        if (existing) {
          if (isAir) {
            existing.airVolumePcs += qty;
          } else {
            existing.seaVolumePcs += qty;
          }
          existing.totalPcs += qty;
          existing.cartons += ctn;
          existing.grossWeightKg += wt;
          existing.shipmentCount += 1;
        }
      });
    }

    return list.map(item => {
      let displaySeaVol = item.seaVolumePcs;
      let displayAirVol = item.airVolumePcs;
      let displayTotal = item.totalPcs;

      if (volumeMetric === 'cartons') {
        displaySeaVol = Math.round(item.seaVolumePcs / 30);
        displayAirVol = Math.round(item.airVolumePcs / 30);
        displayTotal = item.cartons;
      } else if (volumeMetric === 'weight') {
        // Metric tons (MT)
        displaySeaVol = Number((item.seaVolumePcs * 0.0005).toFixed(1));
        displayAirVol = Number((item.airVolumePcs * 0.0005).toFixed(1));
        displayTotal = Number((item.grossWeightKg / 1000).toFixed(1));
      }

      return {
        ...item,
        displaySeaVol: modeFilter === 'Air' ? 0 : displaySeaVol,
        displayAirVol: modeFilter === 'Sea' ? 0 : displayAirVol,
        displayTotal: modeFilter === 'Sea' ? displaySeaVol : modeFilter === 'Air' ? displayAirVol : displayTotal,
      };
    });
  }, [baselineMonthlyMetrics, timeHorizon, volumeMetric, modeFilter, shipments]);

  // Aggregate Key Performance Indicators (KPIs)
  const aggregatedKpis = useMemo(() => {
    const totalPieces = filteredMonthlyData.reduce((acc, m) => acc + m.totalPcs, 0);
    const totalCartons = filteredMonthlyData.reduce((acc, m) => acc + m.cartons, 0);
    const totalMetricTons = (filteredMonthlyData.reduce((acc, m) => acc + m.grossWeightKg, 0) / 1000).toFixed(1);

    const seaPieces = filteredMonthlyData.reduce((acc, m) => acc + m.seaVolumePcs, 0);
    const airPieces = filteredMonthlyData.reduce((acc, m) => acc + m.airVolumePcs, 0);
    const seaRatio = Math.round((seaPieces / (totalPieces || 1)) * 100);
    const airRatio = 100 - seaRatio;

    const count = filteredMonthlyData.length;
    const avgSeaLeadTime = count > 0 ? (filteredMonthlyData.reduce((acc, m) => acc + m.avgSeaLeadTime, 0) / count).toFixed(1) : '0.0';
    const avgAirLeadTime = count > 0 ? (filteredMonthlyData.reduce((acc, m) => acc + m.avgAirLeadTime, 0) / count).toFixed(1) : '0.0';
    const avgCustomsDays = count > 0 ? (filteredMonthlyData.reduce((acc, m) => acc + m.customsClearanceDays, 0) / count).toFixed(1) : '0.0';
    const avgOnTimeRate = count > 0 ? (filteredMonthlyData.reduce((acc, m) => acc + m.onTimeRate, 0) / count).toFixed(1) : '0.0';
    const totalShipments = filteredMonthlyData.reduce((acc, m) => acc + m.shipmentCount, 0);

    return {
      totalPieces,
      totalCartons,
      totalMetricTons,
      seaRatio,
      airRatio,
      avgSeaLeadTime,
      avgAirLeadTime,
      avgCustomsDays,
      avgOnTimeRate,
      totalShipments
    };
  }, [filteredMonthlyData]);

  // Stage Breakdown Data for Key Destination Corridors (Bangladesh RMG Logistics Chain)
  const corridorStageData = useMemo(() => [
    {
      corridor: 'Busan, South Korea',
      shortName: 'Korea (Sea)',
      mode: 'Ocean FCL',
      factoryQA: 6.5,
      inlandCustomsExp: 2.8,
      portFeederLashing: 2.2,
      mainLegTransit: 11.2,
      destClearance: 1.8,
      totalDays: 24.5,
      targetSla: 26.0,
      slaVariance: -1.5,
      volumePcs: 172000,
      carrier: 'HMM / Sinokor Line',
      reliability: 99.4
    },
    {
      corridor: 'Tokyo/Yokohama, Japan',
      shortName: 'Japan (Sea)',
      mode: 'Ocean FCL',
      factoryQA: 6.8,
      inlandCustomsExp: 2.7,
      portFeederLashing: 2.4,
      mainLegTransit: 13.5,
      destClearance: 2.0,
      totalDays: 27.4,
      targetSla: 29.0,
      slaVariance: -1.6,
      volumePcs: 108500,
      carrier: 'ONE Line / NYK',
      reliability: 98.8
    },
    {
      corridor: 'Hamburg/Rotterdam, EU',
      shortName: 'EU Hub (Sea)',
      mode: 'Ocean FCL',
      factoryQA: 7.2,
      inlandCustomsExp: 3.1,
      portFeederLashing: 2.6,
      mainLegTransit: 21.4,
      destClearance: 2.2,
      totalDays: 36.5,
      targetSla: 38.0,
      slaVariance: -1.5,
      volumePcs: 84000,
      carrier: 'Hapag-Lloyd / Maersk',
      reliability: 97.6
    },
    {
      corridor: 'Los Angeles, USA',
      shortName: 'US West (Sea)',
      mode: 'Ocean FCL',
      factoryQA: 7.0,
      inlandCustomsExp: 3.0,
      portFeederLashing: 2.5,
      mainLegTransit: 23.8,
      destClearance: 2.5,
      totalDays: 38.8,
      targetSla: 40.0,
      slaVariance: -1.2,
      volumePcs: 61500,
      carrier: 'CMA CGM / ONE',
      reliability: 96.9
    },
    {
      corridor: 'Incheon/Seoul, South Korea (Air)',
      shortName: 'Korea (Air)',
      mode: 'Air Cargo Express',
      factoryQA: 2.0,
      inlandCustomsExp: 0.8,
      portFeederLashing: 0.4,
      mainLegTransit: 1.2,
      destClearance: 0.6,
      totalDays: 5.0,
      targetSla: 6.0,
      slaVariance: -1.0,
      volumePcs: 45800,
      carrier: 'Korean Air / Biman Cargo',
      reliability: 99.8
    }
  ], []);

  // Destination Volume Distribution for Donut Chart
  const destinationDistribution = useMemo(() => [
    { name: 'South Korea (Busan/Incheon)', value: 217800, share: '43.2%', color: '#dc2626' },
    { name: 'Japan (Tokyo/Yokohama)', value: 118200, share: '23.4%', color: '#2563eb' },
    { name: 'Germany & EU (Hamburg)', value: 89400, share: '17.7%', color: '#059669' },
    { name: 'USA & North America (LA)', value: 64200, share: '12.7%', color: '#d97706' },
    { name: 'Other Destinations', value: 15100, share: '3.0%', color: '#7c3aed' }
  ], []);

  // SLA Reliability Categories for Donut Chart
  const slaReliabilityData = useMemo(() => [
    { name: 'Ahead of Target SLA (>2 Days Early)', value: 58, percentage: '58%', color: SLA_COLORS.ahead },
    { name: 'On-Time Benchmark (±1 Day Buffer)', value: 39, percentage: '39%', color: SLA_COLORS.onTime },
    { name: 'Minor Buffer Delay (1-2 Days)', value: 2.5, percentage: '2.5%', color: SLA_COLORS.minorDelay },
    { name: 'Critical Exception (>3 Days Delay)', value: 0.5, percentage: '0.5%', color: SLA_COLORS.exception }
  ], []);

  // Garment Category Volume Split
  const garmentCategoryData = useMemo(() => [
    { category: 'Heavyweight Hoodies & Sweatshirts', pcs: 135000, cartons: 4500, share: '26.7%' },
    { category: 'Denim Jeans & Stretch Trousers', pcs: 118000, cartons: 3930, share: '23.4%' },
    { category: 'Performance Polo Shirts & Tees', pcs: 96000, cartons: 3200, share: '19.0%' },
    { category: 'Technical Outerwear & Windbreakers', pcs: 84000, cartons: 2800, share: '16.6%' },
    { category: 'Combed Cotton Underwear & Boxers', pcs: 72000, cartons: 2400, share: '14.3%' }
  ], []);

  // Interactive Lead Time Simulator Calculations
  const simResults = useMemo(() => {
    let factoryDays = 6.0;
    let customsDays = simExpPreClearance ? 1.5 : 3.5;
    let portBerthDays = 2.0;
    let oceanDays = 12.0;
    let destDays = 1.5;

    if (simDestination.includes('Japan')) {
      oceanDays = 14.0;
      destDays = 2.0;
    } else if (simDestination.includes('EU') || simDestination.includes('Hamburg')) {
      oceanDays = 22.0;
      destDays = 2.5;
    } else if (simDestination.includes('USA') || simDestination.includes('Los Angeles')) {
      oceanDays = 24.5;
      destDays = 2.5;
    }

    if (simMode === 'Air') {
      factoryDays = 2.0;
      customsDays = simExpPreClearance ? 0.6 : 1.2;
      portBerthDays = 0.4;
      oceanDays = 1.2; // Flight time + airport hub
      destDays = 0.8;
    }

    // Adjust for high volume packing list
    if (simVolume > 30000) {
      factoryDays += 1.5;
    }

    const totalEstimatedDays = Number((factoryDays + customsDays + portBerthDays + oceanDays + destDays).toFixed(1));
    const targetBenchmark = simMode === 'Air' ? 6.0 : (simDestination.includes('Korea') ? 25.0 : simDestination.includes('Japan') ? 28.0 : 38.0);
    const variance = Number((totalEstimatedDays - targetBenchmark).toFixed(1));

    return {
      factoryDays,
      customsDays,
      portBerthDays,
      transitDays: oceanDays,
      destDays,
      totalEstimatedDays,
      targetBenchmark,
      variance,
      projectedArrivalDays: Math.ceil(totalEstimatedDays)
    };
  }, [simDestination, simMode, simVolume, simExpPreClearance]);

  // Unit Label Formatter
  const getUnitLabel = () => {
    if (volumeMetric === 'cartons') return 'Cartons';
    if (volumeMetric === 'weight') return 'Metric Tons (MT)';
    return 'Pieces (Pcs)';
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-12">
      {/* Header Section with Navigation Bar & Actions */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-600/30 text-red-300 border border-red-500/30 flex items-center gap-1.5">
                <BarChart3 size={13} className="text-red-400" />
                Executive Logistics Intelligence
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" />
                Live Recharts Engine
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Export Shipment Volumes & Lead Time Analytics
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              High-precision operational telemetry tracking containerized cargo volumes, customs EXP clearance throughput, port dwell times, and ocean transit SLAs from Chittagong Port (BDCGP) to Asian, European, and North American distribution hubs.
            </p>
          </div>

          {/* Quick Sub-Navigation Pills */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            {[
              { id: 'overview', label: 'Volume & Trends', icon: TrendingUp },
              { id: 'stages', label: 'Lead Time Stages', icon: Clock },
              { id: 'corridors', label: 'Corridor Matrix', icon: Globe },
              { id: 'simulator', label: 'SLA Simulator', icon: Gauge },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    activeTab === tab.id
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Time Horizon */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1">
              <Calendar size={12} className="text-red-400" />
              Time Horizon
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[
                { id: '6m', label: 'Last 6M' },
                { id: '12m', label: '12 Months' },
                { id: 'all', label: 'Full Year' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setTimeHorizon(item.id as any)}
                  className={`py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    timeHorizon === item.id
                      ? 'bg-red-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transport Mode */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1">
              <Ship size={12} className="text-blue-400" />
              Transport Mode
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[
                { id: 'all', label: 'All Modes' },
                { id: 'Sea', label: 'Ocean FCL' },
                { id: 'Air', label: 'Air Express' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setModeFilter(m.id as any)}
                  className={`py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    modeFilter === m.id
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Volume Metric */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1">
              <Package size={12} className="text-amber-400" />
              Volume Metric Unit
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[
                { id: 'pcs', label: 'Units (Pcs)' },
                { id: 'cartons', label: 'Cartons' },
                { id: 'weight', label: 'Weight (MT)' }
              ].map(unit => (
                <button
                  key={unit.id}
                  onClick={() => setVolumeMetric(unit.id as any)}
                  className={`py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    volumeMetric === unit.id
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {unit.label}
                </button>
              ))}
            </div>
          </div>

          {/* Destination Quick Filter */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1">
              <Globe size={12} className="text-emerald-400" />
              Destination Corridor
            </label>
            <select
              value={destinationFilter}
              onChange={e => setDestinationFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              <option value="all">Global (All Maritime Corridors)</option>
              <option value="korea">South Korea (Busan & Incheon)</option>
              <option value="japan">Japan (Tokyo & Yokohama)</option>
              <option value="eu">European Union (Hamburg & Rotterdam)</option>
              <option value="usa">USA & Canada (Los Angeles & Long Beach)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Exported Volume */}
        <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-slate-200/80 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-[3rem] transition-all group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Export Volume</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <Package size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight relative z-10">
            {aggregatedKpis.totalPieces.toLocaleString()}{' '}
            <span className="text-xs font-bold text-slate-500 uppercase">Pcs</span>
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>{aggregatedKpis.totalCartons.toLocaleString()} Cartons</span>
            <span className="text-emerald-600 flex items-center gap-0.5 font-black">
              <ArrowUpRight size={13} />
              +18.4% YoY
            </span>
          </div>
        </div>

        {/* Avg Sea Transit Lead Time */}
        <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-slate-200/80 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[3rem] transition-all group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avg Ocean Lead Time</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Ship size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-blue-600 tracking-tight relative z-10">
            {aggregatedKpis.avgSeaLeadTime}{' '}
            <span className="text-xs font-bold text-slate-500 uppercase">Days</span>
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Target SLA: 24.0d</span>
            <span className="text-emerald-600 font-black">-2.6d Ahead</span>
          </div>
        </div>

        {/* Customs EXP Clearance Speed */}
        <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-slate-200/80 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-[3rem] transition-all group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customs EXP Speed</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <FileCheck size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight relative z-10">
            {aggregatedKpis.avgCustomsDays}{' '}
            <span className="text-xs font-bold text-slate-500 uppercase">Days</span>
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>Chittagong Port Terminal</span>
            <span className="text-emerald-600 font-black">Pre-Clearance Fast-Track</span>
          </div>
        </div>

        {/* On-Time SLA Delivery Reliability */}
        <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-slate-200/80 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[3rem] transition-all group-hover:scale-110"></div>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">On-Time SLA Delivery</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Gauge size={18} />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600 tracking-tight relative z-10">
            {aggregatedKpis.avgOnTimeRate}%
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
            <span>{aggregatedKpis.totalShipments} Consignments Audited</span>
            <span className="text-emerald-600 font-black">Tier-1 Grade</span>
          </div>
        </div>
      </div>

      {/* Main Charts Section based on Active Tab */}

      {/* TAB 1: OVERVIEW - VOLUME & LEAD TIME TRENDS */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* Main Chart 1: Export Shipment Volumes & Capacity Trend */}
          <div className="bg-white rounded-[2.5rem] p-7 sm:p-9 shadow-sm border border-slate-200/80">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    Monthly Export Shipment Volumes & Transport Allocation
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Breakdown of exported volume by Sea Freight (Ocean FCL) vs. Air Express Freight in {getUnitLabel()}.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-blue-600"></span>
                  <span className="text-slate-600">Ocean Freight ({aggregatedKpis.seaRatio}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-red-600"></span>
                  <span className="text-slate-600">Air Express ({aggregatedKpis.airRatio}%)</span>
                </div>
              </div>
            </div>

            {/* Recharts Composed Volume Chart */}
            <div className="h-80 sm:h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={filteredMonthlyData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="monthShort" 
                    tickLine={false} 
                    axisLine={{ stroke: '#cbd5e1' }} 
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={{ stroke: '#cbd5e1' }} 
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderRadius: '1rem', 
                      border: '1px solid #334155',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                      color: '#ffffff',
                      fontSize: '12px'
                    }}
                    formatter={(value: any, name: string) => [
                      `${Number(value).toLocaleString()} ${getUnitLabel()}`, 
                      name === 'displaySeaVol' ? 'Ocean Freight' : name === 'displayAirVol' ? 'Air Express' : 'Total Volume'
                    ]}
                    labelFormatter={(label) => `Shipping Period: ${label} 2025/2026`}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '15px', fontSize: '11px', fontWeight: 'bold' }}
                    formatter={(value) => value === 'displaySeaVol' ? 'Ocean Freight Volume' : value === 'displayAirVol' ? 'Air Freight Volume' : 'Total Consignment Volume'}
                  />
                  <Bar dataKey="displaySeaVol" stackId="a" fill="#2563eb" radius={[0, 0, 4, 4]} name="Ocean Freight" />
                  <Bar dataKey="displayAirVol" stackId="a" fill="#dc2626" radius={[6, 6, 0, 0]} name="Air Freight" />
                  <Line type="monotone" dataKey="displayTotal" stroke="#0f172a" strokeWidth={3} dot={{ fill: '#dc2626', r: 4 }} name="Total Output" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grid of Two Charts: Lead Time Trend vs SLA + Destination Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart 2: Lead Time Evolution vs Target SLA */}
            <div className="bg-white rounded-[2.5rem] p-7 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                      Lead Time Evolution vs. Target SLA (Days)
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Continuous Gain
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mb-6">
                  Comparison of actual ocean freight transit duration against customer SLA benchmark (24.0 days).
                </p>

                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredMonthlyData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="monthShort" tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                      <YAxis domain={[16, 26]} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderRadius: '1rem', 
                          border: '1px solid #334155',
                          color: '#ffffff',
                          fontSize: '12px'
                        }}
                        formatter={(val: any, name: string) => [`${val} Days`, name === 'avgSeaLeadTime' ? 'Actual Ocean Lead Time' : 'Customer SLA Benchmark']}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <ReferenceLine y={24.0} stroke="#dc2626" strokeDasharray="4 4" label={{ value: 'Target SLA (24.0d)', fill: '#dc2626', fontSize: 10, fontWeight: 800, position: 'top' }} />
                      <Line 
                        type="monotone" 
                        dataKey="avgSeaLeadTime" 
                        stroke="#2563eb" 
                        strokeWidth={3.5} 
                        dot={{ fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2, r: 5 }} 
                        activeDot={{ r: 7 }}
                        name="Actual Lead Time" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Oct 2025: 23.4 Days</span>
                <span className="text-emerald-600 font-bold">Sep 2026: 19.4 Days (-17.1% Cycle Speedup)</span>
              </div>
            </div>

            {/* Chart 3: Destination Corridor Volume Split (Donut Chart) */}
            <div className="bg-white rounded-[2.5rem] p-7 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                      Export Volume by Destination Corridor
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Port Allocation
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mb-4">
                  Distribution of containerized consignments across prime trade routes.
                </p>

                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={destinationDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {destinationDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderRadius: '1rem', 
                          border: '1px solid #334155',
                          color: '#ffffff',
                          fontSize: '12px'
                        }}
                        formatter={(val: any) => [`${Number(val).toLocaleString()} Pcs`, 'Export Volume']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Corridor Custom Legend */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
                {destinationDistribution.map((d, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }}></span>
                    <span className="font-bold text-slate-700 truncate">{d.name}</span>
                    <span className="text-slate-400 font-mono ml-auto">{d.share}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STAGES - END-TO-END LEAD TIME STAGE BREAKDOWN */}
      {activeTab === 'stages' && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] p-7 sm:p-9 shadow-sm border border-slate-200/80">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    End-to-End Export Stage Lead Time Breakdown (Days)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Detailed analysis of days consumed in Factory QA & Packing, Inland Customs EXP Clearance, Port Feeder Lashing, Ocean/Air Transit, and Destination Port Discharge.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-700">
                  Stacked Multi-Stage View
                </span>
              </div>
            </div>

            {/* Stacked BarChart for Stages */}
            <div className="h-80 sm:h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={corridorStageData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} unit=" d" />
                  <YAxis 
                    dataKey="shortName" 
                    type="category" 
                    tick={{ fill: '#0f172a', fontSize: 11, fontWeight: 800 }}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderRadius: '1rem', 
                      border: '1px solid #334155',
                      color: '#ffffff',
                      fontSize: '12px'
                    }}
                    formatter={(val: any, name: string) => [`${val} Days`, name]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '11px', fontWeight: 'bold' }} />
                  <Bar dataKey="factoryQA" stackId="a" fill="#7c3aed" name="1. Factory QA & Packing" />
                  <Bar dataKey="inlandCustomsExp" stackId="a" fill="#d97706" name="2. Inland Transit & EXP Filing" />
                  <Bar dataKey="portFeederLashing" stackId="a" fill="#059669" name="3. Chittagong Port Berthing" />
                  <Bar dataKey="mainLegTransit" stackId="a" fill="#2563eb" name="4. Ocean / Air Transit" />
                  <Bar dataKey="destClearance" stackId="a" fill="#dc2626" name="5. Consignee Discharge" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stage Description Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-8 pt-6 border-t border-slate-100">
              {[
                { stage: '1. Factory QA Pass', color: 'border-purple-500 bg-purple-50/40 text-purple-900', avg: '6.2 Days', desc: 'Fabric inspection, sewing completion, needle detection pass & carton sealing.' },
                { stage: '2. Customs EXP Filing', color: 'border-amber-500 bg-amber-50/40 text-amber-900', avg: '2.8 Days', desc: 'Bangladesh Bank EXP issuance, Bill of Export filing, and bonded carrier dispatch.' },
                { stage: '3. Chittagong Port Dwell', color: 'border-emerald-500 bg-emerald-50/40 text-emerald-900', avg: '2.3 Days', desc: 'Container terminal gate-in, customs inspection check, and feeder vessel loading.' },
                { stage: '4. Maritime Main Transit', color: 'border-blue-500 bg-blue-50/40 text-blue-900', avg: '15.4 Days', desc: 'Feeder link to Singapore/Colombo transshipment mother vessel onwards to destination port.' },
                { stage: '5. Consignee Delivery', color: 'border-red-500 bg-red-50/40 text-red-900', avg: '1.9 Days', desc: 'Inward customs clearance, customs duty bond release & final warehouse gate-in.' },
              ].map((st, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border-l-4 ${st.color} flex flex-col justify-between`}>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider block mb-1">{st.stage}</span>
                    <p className="text-[11px] text-slate-600 leading-snug">{st.desc}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Avg Duration</span>
                    <span className="text-xs font-black font-mono">{st.avg}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SLA Reliability & Delay Variance Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-[2.5rem] p-7 sm:p-8 shadow-sm border border-slate-200/80">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    SLA Compliance & Reliability Distribution
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                  98.4% OTIF
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-4">
                Percentage of consignments delivered ahead of schedule, exactly on-time, or with minor buffer delays.
              </p>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={slaReliabilityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {slaReliabilityData.map((entry, index) => (
                        <Cell key={`sla-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any) => [`${val}%`, 'Consignments']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                {slaReliabilityData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="font-bold text-slate-700">{item.name}</span>
                    </div>
                    <span className="font-black font-mono text-slate-900">{item.percentage}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Garment Category Packing Volume */}
            <div className="bg-white rounded-[2.5rem] p-7 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                      Volume by Apparel Category
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    RMG Matrix
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mb-6">
                  Total exported volume categorized by garment style and carton density.
                </p>

                <div className="space-y-4">
                  {garmentCategoryData.map((cat, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-800">{cat.category}</span>
                        <span className="text-slate-500 font-mono">{cat.pcs.toLocaleString()} Pcs ({cat.cartons} Ctn)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full" 
                          style={{ width: cat.share }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-bold">
                <span>Standardized 24-36 Pcs per Export Master Carton</span>
                <span className="text-slate-900 font-black">505,000 Pcs Audited</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CORRIDORS - DETAILED MATRIX & BENCHMARKING TABLE */}
      {activeTab === 'corridors' && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] p-7 sm:p-9 shadow-sm border border-slate-200/80">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    International Trade Corridor Benchmarking Table
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Direct comparison of operational stages, partner shipping lines, target SLAs, and lead time buffers across all export corridors.
                </p>
              </div>

              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-200">
                5 Primary Trade Lanes
              </span>
            </div>

            {/* Responsive Corridor Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-white text-[10px] font-black uppercase tracking-wider">
                    <th className="p-3.5 rounded-l-xl">Destination Port / Hub</th>
                    <th className="p-3.5">Mode & Carrier</th>
                    <th className="p-3.5 text-center">Factory & EXP</th>
                    <th className="p-3.5 text-center">Transit Days</th>
                    <th className="p-3.5 text-center">Total Lead Time</th>
                    <th className="p-3.5 text-center">Target SLA</th>
                    <th className="p-3.5 text-center">Buffer Variance</th>
                    <th className="p-3.5 rounded-r-xl text-right">Reliability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {corridorStageData.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="font-black text-slate-900">{c.corridor}</div>
                        <div className="text-[10px] text-slate-400 font-medium">Chittagong Port (BDCGP) Origin</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mb-0.5 ${
                          c.mode.includes('Air') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {c.mode}
                        </span>
                        <div className="text-[11px] text-slate-600 font-bold">{c.carrier}</div>
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-700">
                        {(c.factoryQA + c.inlandCustomsExp + c.portFeederLashing).toFixed(1)}d
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-blue-600">
                        {c.mainLegTransit.toFixed(1)}d
                      </td>
                      <td className="p-3.5 text-center font-mono font-black text-slate-900 text-sm">
                        {c.totalDays.toFixed(1)} Days
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-500">
                        {c.targetSla.toFixed(1)}d
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black font-mono bg-emerald-100 text-emerald-800">
                          {c.slaVariance}d Early
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-black font-mono text-emerald-600 text-sm">
                        {c.reliability}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SIMULATOR - INTERACTIVE LEAD TIME & SLA ESTIMATOR */}
      {activeTab === 'simulator' && (
        <div className="space-y-8 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] p-7 sm:p-9 shadow-sm border border-slate-200/80">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-red-600 text-white rounded-xl">
                <Gauge size={18} />
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Interactive Export Lead Time & SLA Estimator
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-8">
              Simulate end-to-end delivery timetables for pending international buyer contracts based on transport mode, target volume, and customs EXP pre-clearance status.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Simulator Controls */}
              <div className="lg:col-span-5 space-y-5 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Sliders size={14} className="text-red-600" />
                  Consignment Parameters
                </h4>

                {/* Destination */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Destination Port / Region
                  </label>
                  <select
                    value={simDestination}
                    onChange={e => setSimDestination(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-600 shadow-sm"
                  >
                    <option value="Busan, South Korea">Busan Port (South Korea)</option>
                    <option value="Tokyo/Yokohama, Japan">Tokyo / Yokohama (Japan)</option>
                    <option value="Hamburg/Rotterdam, EU">Hamburg / Rotterdam (Germany & EU)</option>
                    <option value="Los Angeles, USA">Los Angeles / Long Beach (USA)</option>
                  </select>
                </div>

                {/* Transport Mode */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Freight Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSimMode('Sea')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                        simMode === 'Sea'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Ship size={14} />
                      <span>Ocean FCL</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimMode('Air')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                        simMode === 'Air'
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Plane size={14} />
                      <span>Air Express</span>
                    </button>
                  </div>
                </div>

                {/* Target Volume Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Export Order Volume
                    </label>
                    <span className="text-xs font-mono font-black text-red-600">
                      {simVolume.toLocaleString()} Pcs (~{Math.round(simVolume / 30)} Cartons)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2000}
                    max={60000}
                    step={1000}
                    value={simVolume}
                    onChange={e => setSimVolume(Number(e.target.value))}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                    <span>2k Pcs (LCL)</span>
                    <span>30k Pcs (20ft FCL)</span>
                    <span>60k Pcs (40ft HQ)</span>
                  </div>
                </div>

                {/* EXP Pre-Clearance Toggle */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Chittagong EXP Pre-Filing</span>
                    <span className="text-[10px] text-slate-500">Accelerates port customs clearance by 2.0 days</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSimExpPreClearance(!simExpPreClearance)}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                      simExpPreClearance ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      simExpPreClearance ? 'translate-x-6' : 'translate-x-0'
                    }`}></div>
                  </button>
                </div>
              </div>

              {/* Right Column: Projected Timetable Result */}
              <div className="lg:col-span-7 bg-slate-900 text-white p-7 rounded-3xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-400 block">
                        Projected Timetable
                      </span>
                      <h4 className="text-2xl font-black text-white">
                        Estimated Lead Time: {simResults.totalEstimatedDays} Days
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {simResults.variance <= 0 ? `${Math.abs(simResults.variance)}d Ahead of Target` : `${simResults.variance}d Buffer Risk`}
                      </span>
                    </div>
                  </div>

                  {/* Visual Step Timeline */}
                  <div className="space-y-3 mb-6">
                    {[
                      { step: 'Factory Finishing & Needle Detection', days: `${simResults.factoryDays}d`, color: 'bg-purple-500' },
                      { step: 'Customs EXP Clearance & L/C Verification', days: `${simResults.customsDays}d`, color: 'bg-amber-500' },
                      { step: 'Port Terminal Gate-In & Feeder Stowing', days: `${simResults.portBerthDays}d`, color: 'bg-emerald-500' },
                      { step: `${simMode === 'Sea' ? 'Ocean Voyage to Destination Port' : 'Direct Air Cargo Flight Hub'}`, days: `${simResults.transitDays}d`, color: 'bg-blue-500' },
                      { step: 'Inward Customs Discharge to Consignee', days: `${simResults.destDays}d`, color: 'bg-red-500' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${item.color}`}></span>
                          <span className="font-bold text-slate-300">{item.step}</span>
                        </div>
                        <span className="font-mono font-black text-white">{item.days}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Target Customer SLA: {simResults.targetBenchmark} Days</span>
                  <button
                    onClick={() => {
                      if (onNavigateTab) onNavigateTab('new-shipment');
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                  >
                    Draft Booking with this SLA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportVolumeLeadTimeAnalytics;
