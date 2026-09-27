import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Navigation, 
  Anchor, 
  Activity, 
  Ship, 
  Plane, 
  Clock, 
  Cpu, 
  Globe, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  Layers,
  Sparkles,
  DollarSign
} from 'lucide-react';

export interface OfficeNode {
  id: string;
  name: string;
  city: string;
  country: string;
  coordinates: { x: number; y: number }; // Percentage values for SVG projection (0-100)
  type: 'headquarters' | 'logistics' | 'sourcing';
  manager: string;
  throughput: string; // TEUs per year
  clearanceTime: string; // average customs clearance hours
  status: 'active' | 'busy' | 'delayed';
  contact: string;
  description: string;
}

export interface TradeRoute {
  id: string;
  from: string; // OfficeNode id
  to: string; // OfficeNode id
  type: 'sea' | 'air';
  distance: string;
  transitTime: string;
  activeVessel?: string;
  status: 'optimal' | 'congested' | 'delayed';
}

// Highly accurate continental paths for a clean, modern vector map projection
const WORLD_CONTINENTS = [
  // Simplified North America
  { name: 'North America', path: 'M 10,20 Q 15,15 25,18 T 35,22 T 38,35 T 28,48 T 20,40 T 10,32 Z M 15,28 Q 18,24 22,28 Z' },
  // Simplified South America
  { name: 'South America', path: 'M 26,49 Q 32,53 30,65 T 28,85 T 23,80 T 22,65 Z' },
  // Simplified Eurasia / Europe / Asia
  { name: 'Eurasia', path: 'M 40,20 Q 55,14 75,15 T 90,24 T 88,48 T 72,55 T 58,45 T 46,38 T 38,28 Z M 48,22 Q 52,18 56,22 Z' },
  // Simplified Africa
  { name: 'Africa', path: 'M 44,40 Q 55,42 58,52 T 52,72 T 44,58 Z' },
  // Simplified Australia
  { name: 'Australia', path: 'M 78,64 Q 85,65 86,72 T 78,76 T 74,68 Z' }
];

export const OFFICE_NODES: OfficeNode[] = [
  {
    id: 'node-dhaka',
    name: 'Red Bird HQ & Sourcing Operations',
    city: 'Dhaka',
    country: 'Bangladesh',
    coordinates: { x: 70.2, y: 39.8 },
    type: 'headquarters',
    manager: 'Sumon Ahmed',
    throughput: '142,000 TEU',
    clearanceTime: '12-24 Hours',
    status: 'active',
    contact: '+880-1966-635-888',
    description: 'Central nerve center for apparel sourcing, visual product design reviews, factory audits, and end-to-end quality assurance.'
  },
  {
    id: 'node-rotterdam',
    name: 'Euro Central Distribution Hub',
    city: 'Rotterdam',
    country: 'Netherlands',
    coordinates: { x: 48.5, y: 26.5 },
    type: 'logistics',
    manager: 'Gerard van der Berg',
    throughput: '98,500 TEU',
    clearanceTime: '4-8 Hours',
    status: 'active',
    contact: '+31-10-456-7890',
    description: 'Primary sea cargo intake terminal distributing bulk stock lots and custom manufactured outerwear across the European Union.'
  },
  {
    id: 'node-hamburg',
    name: 'Sourcing & Quality Office',
    city: 'Hamburg',
    country: 'Germany',
    coordinates: { x: 50.8, y: 25.2 },
    type: 'sourcing',
    manager: 'Markus Weber',
    throughput: '45,000 TEU',
    clearanceTime: '6-12 Hours',
    status: 'active',
    contact: '+49-40-7890-1234',
    description: 'European customer relations, wholesale liquidation contract verification, and direct brand partnerships.'
  },
  {
    id: 'node-newyork',
    name: 'North America Intake Depot',
    city: 'New York',
    country: 'United States',
    coordinates: { x: 25.2, y: 31.4 },
    type: 'logistics',
    manager: 'Sarah Jenkins',
    throughput: '115,000 TEU',
    clearanceTime: '8-16 Hours',
    status: 'active',
    contact: '+1-212-555-0198',
    description: 'North American headquarters supervising custom clearances, air cargo dispatches, and priority buyer contract distributions.'
  },
  {
    id: 'node-montreal',
    name: 'Canada Regional Depot',
    city: 'Montreal',
    country: 'Canada',
    coordinates: { x: 23.8, y: 28.5 },
    type: 'sourcing',
    manager: 'Jean-Pierre Roy',
    throughput: '35,000 TEU',
    clearanceTime: '4-10 Hours',
    status: 'active',
    contact: '+1-514-555-0145',
    description: 'Strategic rail cargo intermodal depot facilitating fast logistics forwarding throughout Central & Western Canadian markets.'
  }
];

export const TRADE_ROUTES: TradeRoute[] = [
  {
    id: 'route-dhaka-rotterdam',
    from: 'node-dhaka',
    to: 'node-rotterdam',
    type: 'sea',
    distance: '7,450 Nautical Miles',
    transitTime: '22 Days',
    activeVessel: 'RedBird Pioneer',
    status: 'optimal'
  },
  {
    id: 'route-dhaka-newyork',
    from: 'node-dhaka',
    to: 'node-newyork',
    type: 'air',
    distance: '12,650 km',
    transitTime: '18 Hours',
    activeVessel: 'Flight RBD-809 Heavy',
    status: 'optimal'
  },
  {
    id: 'route-rotterdam-newyork',
    from: 'node-rotterdam',
    to: 'node-newyork',
    type: 'sea',
    distance: '3,200 Nautical Miles',
    transitTime: '10 Days',
    activeVessel: 'Ocean Swift V-102',
    status: 'optimal'
  },
  {
    id: 'route-rotterdam-montreal',
    from: 'node-rotterdam',
    to: 'node-montreal',
    type: 'sea',
    distance: '2,950 Nautical Miles',
    transitTime: '9 Days',
    activeVessel: 'Global Cargo Express',
    status: 'optimal'
  }
];

const TradeRouteMap: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<OfficeNode | null>(OFFICE_NODES[0]);
  const [selectedRoute, setSelectedRoute] = useState<TradeRoute | null>(null);
  
  // Sourcing Routing Estimator State
  const [calcFrom, setCalcFrom] = useState<string>('node-dhaka');
  const [calcTo, setCalcTo] = useState<string>('node-rotterdam');
  const [calcMode, setCalcMode] = useState<'sea' | 'air'>('sea');
  const [hasCalculated, setHasCalculated] = useState(false);

  // Compute animated path coordinates
  const getRoutePath = (fromNode: OfficeNode, toNode: OfficeNode) => {
    const x1 = fromNode.coordinates.x;
    const y1 = fromNode.coordinates.y;
    const x2 = toNode.coordinates.x;
    const y2 = toNode.coordinates.y;
    
    // Create an elegant bezier curve to represent actual global air/sea routes
    const dx = x2 - x1;
    const dy = y2 - y1;
    const cx = (x1 + x2) / 2 - dy * 0.15; // bend control point
    const cy = (y1 + y2) / 2 + dx * 0.15;
    
    return `M ${x1},${y1} Q ${cx},${cy} ${x2},${y2}`;
  };

  const getRouteMidpoint = (fromNode: OfficeNode, toNode: OfficeNode) => {
    const x1 = fromNode.coordinates.x;
    const y1 = fromNode.coordinates.y;
    const x2 = toNode.coordinates.x;
    const y2 = toNode.coordinates.y;
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const cx = (x1 + x2) / 2 - dy * 0.15;
    const cy = (y1 + y2) / 2 + dx * 0.15;

    // Calculate midpoint on quadratic bezier curve
    // B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2  where t = 0.5
    const mx = 0.25 * x1 + 0.5 * cx + 0.25 * x2;
    const my = 0.25 * y1 + 0.5 * cy + 0.25 * y2;
    
    return { x: mx, y: my };
  };

  const activeCalculatedData = useMemo(() => {
    if (!calcFrom || !calcTo) return null;
    const from = OFFICE_NODES.find(n => n.id === calcFrom);
    const to = OFFICE_NODES.find(n => n.id === calcTo);
    if (!from || !to) return null;

    // Calculate approximate pixel-based distance for visual fidelity
    const dx = to.coordinates.x - from.coordinates.x;
    const dy = to.coordinates.y - from.coordinates.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    
    // Convert to realistic kilometers / miles
    const actualKm = Math.round(pixelDistance * 185);
    const co2Offset = calcMode === 'air' ? actualKm * 0.52 : actualKm * 0.04;
    const durationDays = calcMode === 'air' 
      ? Math.ceil((actualKm / 850) + 4) // hours
      : Math.ceil(actualKm / 350); // days
      
    return {
      from,
      to,
      distanceKm: actualKm.toLocaleString(),
      distanceNm: Math.round(actualKm * 0.539).toLocaleString(),
      duration: calcMode === 'air' ? `${durationDays} Hours` : `${durationDays} Days`,
      carbon: `${Math.round(co2Offset).toLocaleString()} kg CO2`,
      costFactor: calcMode === 'air' ? 'Premium Air Surcharge' : 'Standard Ocean Rate',
      vesselType: calcMode === 'air' ? 'Boeing 777 Cargo Freighter' : 'Maersk Post-Panamax Class'
    };
  }, [calcFrom, calcTo, calcMode]);

  return (
    <section id="global-network" className="py-24 bg-slate-900 border-t border-white/5 relative overflow-hidden text-white">
      {/* Absolute Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-slate-950 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8">
        
        {/* Header Title Grid */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="flex items-center gap-2 text-red-500 font-mono text-xs font-black tracking-widest uppercase mb-3">
              <Globe className="w-4 h-4 text-red-500 animate-pulse" />
              <span>International Sourcing & Logistics Core</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none uppercase">
              Global Sourcing Network
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-xl mt-4">
              Real-time visualization of our international logistics hubs, direct manufacturing routes, and active ocean container carriers.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">HQ Operations</span>
              <span className="text-sm font-mono font-bold text-white flex items-center justify-end gap-1.5 mt-0.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Dhaka, BD
              </span>
            </div>
            <div className="bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Active Vessels</span>
              <span className="text-sm font-mono font-bold text-red-400 flex items-center justify-end gap-1 mt-0.5">
                <Ship className="w-3.5 h-3.5 text-red-400" /> 8 Mainline
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Workspace Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* LEFT: 8-columns Global Map Canvas */}
          <div className="col-span-1 lg:col-span-8 bg-slate-950/80 border border-white/10 rounded-3xl p-6 relative flex flex-col justify-between shadow-2xl overflow-hidden min-h-[460px] md:min-h-[580px]">
            
            {/* Map Legends */}
            <div className="absolute top-6 left-6 z-10 flex flex-wrap gap-3 pointer-events-none">
              <div className="bg-slate-900/90 border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs backdrop-blur">
                <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-ping" />
                <span className="font-semibold text-slate-200">Red Bird Hubs</span>
              </div>
              <div className="bg-slate-900/90 border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs backdrop-blur">
                <span className="h-1 w-4 border-t border-dashed border-red-500" />
                <span className="font-semibold text-slate-300">Active Sourcing Lanes</span>
              </div>
            </div>

            {/* SVG Interactive Map */}
            <div className="flex-1 w-full relative flex items-center justify-center">
              <svg 
                viewBox="0 0 100 100" 
                className="w-full h-full max-h-[520px] select-none"
                style={{ filter: 'drop-shadow(0px 10px 20px rgba(0, 0, 0, 0.4))' }}
              >
                {/* Clean Continental Paths (Background layers) */}
                <g className="fill-slate-900 stroke-slate-800 stroke-[0.3]">
                  {WORLD_CONTINENTS.map((cont, idx) => (
                    <path 
                      key={idx} 
                      d={cont.path} 
                      className="transition-colors duration-300 hover:fill-slate-800" 
                    />
                  ))}
                </g>

                {/* Simulated Grid Overlay for hi-tech logistics feel */}
                <defs>
                  <pattern id="gridPattern" width="2" height="2" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="0.15" fill="#475569" opacity="0.25" />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#gridPattern)" pointerEvents="none" />

                {/* Draw Trade Routes lines first */}
                {TRADE_ROUTES.map((route) => {
                  const fromNode = OFFICE_NODES.find(n => n.id === route.from);
                  const toNode = OFFICE_NODES.find(n => n.id === route.to);
                  if (!fromNode || !toNode) return null;
                  
                  const isRouteSelected = selectedRoute?.id === route.id;
                  const pathD = getRoutePath(fromNode, toNode);
                  const midpoint = getRouteMidpoint(fromNode, toNode);
                  
                  return (
                    <g key={route.id} className="cursor-pointer">
                      {/* Invisible wider path for easy hovering */}
                      <path 
                        d={pathD} 
                        fill="none" 
                        stroke="transparent" 
                        strokeWidth="3"
                        onClick={() => {
                          setSelectedRoute(route);
                          setSelectedNode(null);
                        }}
                      />
                      
                      {/* Visible route pathway */}
                      <path 
                        d={pathD} 
                        fill="none" 
                        stroke={isRouteSelected ? '#f43f5e' : route.type === 'air' ? '#f59e0b' : '#3b82f6'} 
                        strokeWidth={isRouteSelected ? '0.8' : '0.4'}
                        strokeDasharray={route.type === 'air' ? '1,1' : '2,1'}
                        className="transition-all duration-300"
                        onClick={() => {
                          setSelectedRoute(route);
                          setSelectedNode(null);
                        }}
                      />

                      {/* Moving pulse dot indicating real-time vessels */}
                      <circle r="0.5" fill={route.type === 'air' ? '#fbbf24' : '#60a5fa'}>
                        <animateMotion 
                          path={pathD} 
                          dur={route.type === 'air' ? '6s' : '18s'} 
                          repeatCount="indefinite" 
                        />
                      </circle>

                      {/* Floating Indicator icon at midpoint of selected route */}
                      {isRouteSelected && (
                        <foreignObject 
                          x={midpoint.x - 3} 
                          y={midpoint.y - 3} 
                          width="6" 
                          height="6"
                        >
                          <div className="w-full h-full rounded-full bg-slate-900 border border-red-500 flex items-center justify-center p-0.5">
                            {route.type === 'air' ? (
                              <Plane className="w-2.5 h-2.5 text-amber-400 rotate-45" />
                            ) : (
                              <Ship className="w-2.5 h-2.5 text-blue-400" />
                            )}
                          </div>
                        </foreignObject>
                      )}
                    </g>
                  );
                })}

                {/* Plot Office Node dots on top of paths */}
                {OFFICE_NODES.map((node) => {
                  const isNodeSelected = selectedNode?.id === node.id;
                  
                  return (
                    <g 
                      key={node.id} 
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedNode(node);
                        setSelectedRoute(null);
                      }}
                    >
                      {/* Animated outer radar pulse ring */}
                      <circle 
                        cx={node.coordinates.x} 
                        cy={node.coordinates.y} 
                        r={isNodeSelected ? '3.5' : '2'} 
                        fill="none" 
                        stroke="#dc2626" 
                        strokeWidth="0.15" 
                        opacity={isNodeSelected ? '0.8' : '0.4'}
                      >
                        <animate 
                          attributeName="r" 
                          values="1;4" 
                          dur="2.5s" 
                          repeatCount="indefinite" 
                        />
                        <animate 
                          attributeName="opacity" 
                          values="0.8;0" 
                          dur="2.5s" 
                          repeatCount="indefinite" 
                        />
                      </circle>

                      {/* Node core marker */}
                      <circle 
                        cx={node.coordinates.x} 
                        cy={node.coordinates.y} 
                        r={isNodeSelected ? '1.2' : '0.75'} 
                        fill={isNodeSelected ? '#ef4444' : '#fff'}
                        stroke="#dc2626"
                        strokeWidth="0.2"
                        className="transition-all duration-300"
                      />

                      {/* City Text label */}
                      <text 
                        x={node.coordinates.x} 
                        y={node.coordinates.y - 1.8} 
                        textAnchor="middle" 
                        fill="#f8fafc" 
                        fontSize="1.4" 
                        fontWeight={isNodeSelected ? 'bold' : 'normal'}
                        className="font-mono tracking-tight pointer-events-none drop-shadow-md select-none"
                      >
                        {node.city}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Map bottom stats controller */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 mt-4 font-mono text-[11px] text-slate-400">
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> Ocean Sourcing (Sea)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Priority Air (Air)
                </span>
              </div>
              <span>Click any node or route path to view dispatch details</span>
            </div>
          </div>

          {/* RIGHT: 4-columns Context details / Route calculator */}
          <div className="col-span-1 lg:col-span-4 space-y-6 flex flex-col justify-between">
            
            {/* Upper Box: Detail Display Panel */}
            <div className="bg-slate-950/80 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex-1">
              <AnimatePresence mode="wait">
                
                {/* Node Selected Info */}
                {selectedNode && (
                  <motion.div
                    key={selectedNode.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div>
                        <span className="text-red-500 font-mono text-[10px] uppercase font-bold tracking-widest block">RED BIRD LOGISTICS CENTRE</span>
                        <h3 className="text-xl font-bold text-white tracking-tight mt-1">{selectedNode.name}</h3>
                      </div>
                      <div className="bg-slate-900 border border-white/10 p-2.5 rounded-xl text-red-500">
                        <MapPin className="w-5 h-5" />
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-white/5">
                      {selectedNode.description}
                    </p>

                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-500 uppercase font-semibold">Location</span>
                        <span className="text-slate-200">{selectedNode.city}, {selectedNode.country}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-500 uppercase font-semibold">Hub Type</span>
                        <span className="text-red-400 capitalize font-bold">{selectedNode.type}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-500 uppercase font-semibold">Annual Sourcing Cap</span>
                        <span className="text-slate-200">{selectedNode.throughput}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-500 uppercase font-semibold">Customs Processing</span>
                        <span className="text-slate-200 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {selectedNode.clearanceTime}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-500 uppercase font-semibold">Operations Contact</span>
                        <span className="text-slate-200">{selectedNode.contact}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500 uppercase font-semibold">Active Manager</span>
                        <span className="text-slate-200 font-bold">{selectedNode.manager}</span>
                      </div>
                    </div>

                    <div className="bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-[11px] p-3 rounded-xl flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>Node Online. Sourcing and loading operations optimal.</span>
                    </div>
                  </motion.div>
                )}

                {/* Route Selected Info */}
                {selectedRoute && (
                  <motion.div
                    key={selectedRoute.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div>
                        <span className="text-blue-400 font-mono text-[10px] uppercase font-bold tracking-widest block">INTERCONTINENTAL TRADE PATH</span>
                        <h3 className="text-xl font-bold text-white tracking-tight mt-1">
                          {OFFICE_NODES.find(n => n.id === selectedRoute.from)?.city} ➔ {OFFICE_NODES.find(n => n.id === selectedRoute.to)?.city}
                        </h3>
                      </div>
                      <div className="bg-slate-900 border border-white/10 p-2.5 rounded-xl text-blue-400">
                        {selectedRoute.type === 'air' ? <Plane className="w-5 h-5 rotate-45" /> : <Ship className="w-5 h-5" />}
                      </div>
                    </div>

                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-500 uppercase font-semibold">Transit Mode</span>
                        <span className="text-slate-200 font-bold uppercase">{selectedRoute.type} CARGO</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-500 uppercase font-semibold">Approx. Distance</span>
                        <span className="text-slate-200 font-bold">{selectedRoute.distance}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-500 uppercase font-semibold">Average Transit</span>
                        <span className="text-slate-200 font-bold">{selectedRoute.transitTime}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-500 uppercase font-semibold">Active Logistics Vehicle</span>
                        <span className="text-blue-400 font-bold">{selectedRoute.activeVessel || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500 uppercase font-semibold">Current Lane Status</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 animate-pulse" /> Optimal Path
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 text-[11px] text-slate-300">
                      We utilize multi-modal custom clearances to minimize container wait-times along this key trade corridor.
                    </div>
                  </motion.div>
                )}

                {/* Default Sourcing Intro display if nothing selected */}
                {!selectedNode && !selectedRoute && (
                  <motion.div
                    key="default-panel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col justify-center items-center h-full text-center py-8 space-y-4"
                  >
                    <div className="w-16 h-16 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center text-slate-400">
                      <Cpu className="w-8 h-8 animate-spin" style={{ animationDuration: '8s' }} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Interactive Sourcing Center</h4>
                      <p className="text-slate-400 text-xs mt-1 max-w-[240px]">
                        Select any red pulsing office node or colored shipment route path to examine performance benchmarks.
                      </p>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Lower Box: Dynamic Routing Transit Estimator */}
            <div className="bg-slate-950/80 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
                <Navigation className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-200">Logistics Route Estimator</h3>
              </div>

              <div className="space-y-4 text-xs font-mono">
                
                {/* Select From */}
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase font-bold text-[10px]">Consigner Origin (Sourcing)</label>
                  <select 
                    value={calcFrom}
                    onChange={(e) => {
                      setCalcFrom(e.target.value);
                      setHasCalculated(true);
                    }}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600 font-sans text-xs"
                  >
                    {OFFICE_NODES.map(node => (
                      <option key={node.id} value={node.id}>{node.city} ({node.country})</option>
                    ))}
                  </select>
                </div>

                {/* Select To */}
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase font-bold text-[10px]">Consignee Destination (Discharge)</label>
                  <select 
                    value={calcTo}
                    onChange={(e) => {
                      setCalcTo(e.target.value);
                      setHasCalculated(true);
                    }}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600 font-sans text-xs"
                  >
                    {OFFICE_NODES.map(node => (
                      <option key={node.id} value={node.id}>{node.city} ({node.country})</option>
                    ))}
                  </select>
                </div>

                {/* Select Mode */}
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase font-bold text-[10px]">Preferred Transit Mode</label>
                  <div className="grid grid-cols-2 gap-2 font-sans">
                    <button
                      type="button"
                      onClick={() => {
                        setCalcMode('sea');
                        setHasCalculated(true);
                      }}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${calcMode === 'sea' ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-slate-900 border-white/5 text-slate-400'}`}
                    >
                      <Ship className="w-3.5 h-3.5" /> Ocean Vessel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCalcMode('air');
                        setHasCalculated(true);
                      }}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${calcMode === 'air' ? 'bg-amber-600/10 border-amber-500 text-amber-400' : 'bg-slate-900 border-white/5 text-slate-400'}`}
                    >
                      <Plane className="w-3.5 h-3.5 rotate-45" /> Air Cargo
                    </button>
                  </div>
                </div>

                {/* Estimate Result Display */}
                {activeCalculatedData && (
                  <div className="bg-slate-900/60 rounded-xl p-3 border border-white/5 space-y-2 mt-3 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500 uppercase">Est. Sourcing Distance:</span>
                      <span className="text-slate-200 font-bold">{calcMode === 'air' ? `${activeCalculatedData.distanceKm} km` : `${activeCalculatedData.distanceNm} NM`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 uppercase">Est. Sourcing Time:</span>
                      <span className="text-red-400 font-black">{activeCalculatedData.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 uppercase">CO2 Footprint (Est):</span>
                      <span className="text-emerald-400 font-bold">{activeCalculatedData.carbon}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 uppercase">Pricing Tier:</span>
                      <span className="text-slate-200 font-bold">{activeCalculatedData.costFactor}</span>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default TradeRouteMap;
