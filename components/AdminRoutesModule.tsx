import React, { useState } from 'react';
import { 
  Globe, 
  MapPin, 
  Ship, 
  Plane, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Database, 
  TrendingUp, 
  Trash2,
  Clock,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { OFFICE_NODES, TRADE_ROUTES, OfficeNode, TradeRoute } from './TradeRouteMap';

interface DispatchLog {
  id: string;
  containerId: string;
  routeId: string;
  cargoType: string;
  pcs: number;
  status: 'In Transit' | 'Customs Hold' | 'Discharged';
  estDelivery: string;
}

const INITIAL_DISPATCHES: DispatchLog[] = [
  { id: 'disp-1', containerId: 'RBDU-980721-0', routeId: 'route-dhaka-rotterdam', cargoType: 'Heavy Knit Hoodies', pcs: 12500, status: 'In Transit', estDelivery: '2026-07-28' },
  { id: 'disp-2', containerId: 'RBDU-450912-3', routeId: 'route-dhaka-newyork', cargoType: 'Polo Shirts (Lacoste Spec)', pcs: 8000, status: 'In Transit', estDelivery: '2026-07-13' },
  { id: 'disp-3', containerId: 'RBDU-102983-8', routeId: 'route-rotterdam-newyork', cargoType: 'Slim Denim Batches', pcs: 4500, status: 'Customs Hold', estDelivery: '2026-07-18' },
];

const AdminRoutesModule: React.FC = () => {
  const [nodes, setNodes] = useState<OfficeNode[]>(OFFICE_NODES);
  const [routes, setRoutes] = useState<TradeRoute[]>(TRADE_ROUTES);
  const [dispatches, setDispatches] = useState<DispatchLog[]>(INITIAL_DISPATCHES);
  
  // States for adding a new route/hub
  const [isAddingHub, setIsAddingHub] = useState(false);
  const [newHub, setNewHub] = useState<Partial<OfficeNode>>({
    id: '',
    name: '',
    city: '',
    country: '',
    type: 'sourcing',
    manager: '',
    throughput: '20,000 TEU',
    clearanceTime: '6-12 Hours',
    status: 'active',
    contact: '',
    description: '',
    coordinates: { x: 50, y: 50 }
  });

  const [isAddingDispatch, setIsAddingDispatch] = useState(false);
  const [newDispatch, setNewDispatch] = useState<Partial<DispatchLog>>({
    containerId: '',
    routeId: 'route-dhaka-rotterdam',
    cargoType: 'Summer Blouses',
    pcs: 5000,
    status: 'In Transit',
    estDelivery: ''
  });

  const handleAddHubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHub.city || !newHub.name || !newHub.country) return;
    
    // Auto generate a mock ID and random projection coordinates for demo visualization
    const hubId = `node-${newHub.city.toLowerCase().replace(/\s+/g, '')}`;
    const createdHub: OfficeNode = {
      id: hubId,
      name: newHub.name,
      city: newHub.city,
      country: newHub.country,
      coordinates: { 
        x: Math.floor(Math.random() * 60) + 20, // keep within standard map bound limit
        y: Math.floor(Math.random() * 40) + 20 
      },
      type: newHub.type as any,
      manager: newHub.manager || 'Sumon Ahmed',
      throughput: newHub.throughput || '25,000 TEU',
      clearanceTime: newHub.clearanceTime || '8 Hours',
      status: 'active',
      contact: newHub.contact || '+880-1966-635-888',
      description: newHub.description || 'Simulated sourcing logistics dispatch terminal.'
    };

    setNodes([...nodes, createdHub]);
    setIsAddingHub(false);
    // Reset
    setNewHub({
      id: '', name: '', city: '', country: '', type: 'sourcing', manager: '',
      throughput: '20,000 TEU', clearanceTime: '6-12 Hours', status: 'active',
      contact: '', description: '', coordinates: { x: 50, y: 50 }
    });
  };

  const handleAddDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDispatch.containerId || !newDispatch.estDelivery) return;

    const createdDispatch: DispatchLog = {
      id: `disp-${Date.now()}`,
      containerId: newDispatch.containerId,
      routeId: newDispatch.routeId || 'route-dhaka-rotterdam',
      cargoType: newDispatch.cargoType || 'Knitwear Stock',
      pcs: Number(newDispatch.pcs) || 1000,
      status: newDispatch.status as any,
      estDelivery: newDispatch.estDelivery
    };

    setDispatches([createdDispatch, ...dispatches]);
    setIsAddingDispatch(false);
    setNewDispatch({
      containerId: '',
      routeId: 'route-dhaka-rotterdam',
      cargoType: 'Summer Blouses',
      pcs: 5000,
      status: 'In Transit',
      estDelivery: ''
    });
  };

  const toggleRouteStatus = (routeId: string) => {
    setRoutes(prev => prev.map(r => {
      if (r.id === routeId) {
        const nextStatus = r.status === 'optimal' ? 'delayed' : r.status === 'delayed' ? 'congested' : 'optimal';
        return { ...r, status: nextStatus };
      }
      return r;
    }));
  };

  const toggleNodeStatus = (nodeId: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const nextStatus = n.status === 'active' ? 'delayed' : n.status === 'delayed' ? 'busy' : 'active';
        return { ...n, status: nextStatus };
      }
      return n;
    }));
  };

  return (
    <div className="space-y-10 animate-fade-in font-sans text-slate-800">
      
      {/* Upper header action list */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">Global Network Command</h2>
          <p className="text-slate-500 font-medium mt-2">Simulate congestions, dispatch container bookings, and modify active port parameters.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddingHub(true)}
            className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-red-600 transition-all flex items-center gap-2 shadow-xl active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Sourcing Hub
          </button>
          <button
            onClick={() => setIsAddingDispatch(true)}
            className="bg-red-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-slate-900 transition-all flex items-center gap-2 shadow-xl active:scale-95 shadow-red-600/20"
          >
            <Ship className="w-4 h-4" /> Log Container Booking
          </button>
        </div>
      </header>

      {/* Grid: 2 Columns (Interactive Sourcing lanes & Realtime Shipments Log) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Active Trade Routes and status controls */}
        <div className="col-span-1 lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <Globe className="text-red-600 w-5 h-5 animate-spin" style={{ animationDuration: '10s' }} />
                <h3 className="font-black text-lg uppercase text-slate-900 tracking-tight">Intercontinental Sourcing Corridors</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">ACTIVE LANES: {routes.length}</span>
            </div>

            <div className="space-y-4">
              {routes.map((route) => {
                const origin = nodes.find(n => n.id === route.from)?.city || 'Dhaka';
                const dest = nodes.find(n => n.id === route.to)?.city || 'Rotterdam';
                
                return (
                  <div key={route.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-stretch justify-between gap-4 hover:border-red-200 transition-all">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-xl ${route.type === 'air' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center`}>
                        {route.type === 'air' ? <Plane className="w-5 h-5 rotate-45" /> : <Ship className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-sm uppercase">
                          {origin} ➔ {dest}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono mt-1">
                          {route.distance} • Trans: {route.transitTime}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] bg-white border border-slate-200 text-slate-600 font-mono font-bold px-2 py-0.5 rounded-lg">
                            Carrier: {route.activeVessel}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between items-end shrink-0 gap-3">
                      {route.status === 'optimal' ? (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-mono font-bold text-[10px] rounded-full uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Optimal Flow
                        </span>
                      ) : route.status === 'delayed' ? (
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 font-mono font-bold text-[10px] rounded-full uppercase tracking-wider flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Customs Hold
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-100 text-red-700 font-mono font-bold text-[10px] rounded-full uppercase tracking-wider flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Congested Port
                        </span>
                      )}

                      <button
                        onClick={() => toggleRouteStatus(route.id)}
                        className="text-[10px] font-black text-slate-500 hover:text-red-600 uppercase border border-slate-200 bg-white hover:border-red-100 px-3 py-1.5 rounded-xl transition-all font-mono"
                      >
                        Toggle Alert State
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sourcing Hub Status Cards */}
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <MapPin className="text-red-600 w-5 h-5" />
                <h3 className="font-black text-lg uppercase text-slate-900 tracking-tight">Active Sourcing Ports & Hubs</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">TOTAL PORTS: {nodes.length}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nodes.map((node) => (
                <div key={node.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col justify-between hover:border-red-200 transition-all">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] bg-slate-200/80 text-slate-600 font-black font-mono px-2 py-0.5 rounded-lg uppercase">
                        {node.type}
                      </span>
                      <span className={`h-2.5 w-2.5 rounded-full ${node.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    </div>
                    <h4 className="font-black text-slate-900 text-sm mt-1">{node.city}, {node.country}</h4>
                    <p className="text-[11px] text-slate-400 font-medium truncate">{node.name}</p>
                    <p className="text-xs text-slate-600 font-mono mt-1">Clearance: {node.clearanceTime}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-4">
                    <span className="text-[10px] font-bold font-mono text-slate-400">Mgr: {node.city === 'Dhaka' ? 'Sumon A.' : node.manager.split(' ')[0]}</span>
                    <button
                      onClick={() => toggleNodeStatus(node.id)}
                      className="text-[9px] font-black text-slate-500 hover:text-red-600 uppercase transition-colors"
                    >
                      Cycle Status
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Container Dispatches / Live Bookings Log */}
        <div className="col-span-1 lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <Database className="text-red-600 w-5 h-5" />
                <h3 className="font-black text-lg uppercase text-slate-900 tracking-tight">Active Container Bookings</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 font-mono">COUNT: {dispatches.length}</span>
            </div>

            <div className="space-y-4">
              {dispatches.map((disp) => {
                const associatedRoute = routes.find(r => r.id === disp.routeId);
                const fromCity = associatedRoute ? nodes.find(n => n.id === associatedRoute.from)?.city : 'Dhaka';
                const toCity = associatedRoute ? nodes.find(n => n.id === associatedRoute.to)?.city : 'Rotterdam';

                return (
                  <div key={disp.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-3 relative group">
                    <button 
                      onClick={() => setDispatches(prev => prev.filter(d => d.id !== disp.id))}
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono font-black text-slate-400 block uppercase">CONTAINER BILLING ID</span>
                        <h4 className="font-mono font-black text-xs text-slate-800">{disp.containerId}</h4>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase font-mono ${disp.status === 'In Transit' ? 'bg-blue-100 text-blue-700' : disp.status === 'Customs Hold' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {disp.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono border-t border-slate-100 pt-3 text-slate-500">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Cargo Manifest</span>
                        <span className="text-slate-700 font-bold">{disp.cargoType}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Transit Volume</span>
                        <span className="text-slate-700 font-bold">{disp.pcs.toLocaleString()} Pcs</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-white rounded-xl p-2.5 border border-slate-100 text-[10px] font-mono text-slate-500">
                      <span>Corridor: {fromCity} ➔ {toCity}</span>
                      <span className="text-slate-700 font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> ETA {disp.estDelivery}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* MODAL: ADD HUB FORM */}
      {isAddingHub && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white max-w-xl w-full rounded-[2.5rem] p-10 shadow-2xl relative animate-scale-up">
            <button onClick={() => setIsAddingHub(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 font-bold text-xl">×</button>
            <h3 className="text-xl font-black text-slate-900 mb-6 uppercase italic tracking-tighter flex items-center gap-2 border-b border-slate-100 pb-3">
              <Globe className="w-5 h-5 text-red-600 animate-pulse" /> Add Sourcing Operations Hub
            </h3>
            <form onSubmit={handleAddHubSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">City Name</label>
                  <input required type="text" value={newHub.city} onChange={e => setNewHub({...newHub, city: e.target.value})} className="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold border border-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs text-slate-800" placeholder="e.g. Singapore" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Country Name</label>
                  <input required type="text" value={newHub.country} onChange={e => setNewHub({...newHub, country: e.target.value})} className="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold border border-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs text-slate-800" placeholder="e.g. Singapore" />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Hub Name (Facility Label)</label>
                <input required type="text" value={newHub.name} onChange={e => setNewHub({...newHub, name: e.target.value})} className="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold border border-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs text-slate-800" placeholder="e.g. FarEast Int'l Transit Terminal" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Hub Classification</label>
                  <select value={newHub.type} onChange={e => setNewHub({...newHub, type: e.target.value as any})} className="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold border border-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs text-slate-800">
                    <option value="sourcing">Sourcing Hub</option>
                    <option value="logistics">Logistics Depot</option>
                    <option value="headquarters">Headquarters</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Clearance Lead Time</label>
                  <input type="text" value={newHub.clearanceTime} onChange={e => setNewHub({...newHub, clearanceTime: e.target.value})} className="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold border border-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs text-slate-800" placeholder="e.g. 4-12 Hours" />
                </div>
              </div>
              <button className="w-full bg-slate-900 text-white rounded-xl py-3.5 font-black uppercase tracking-widest hover:bg-red-600 transition-all text-xs shadow-xl shadow-slate-900/10">
                Establish Hub Node
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CONTAINER BOOKING */}
      {isAddingDispatch && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white max-w-xl w-full rounded-[2.5rem] p-10 shadow-2xl relative animate-scale-up">
            <button onClick={() => setIsAddingDispatch(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 font-bold text-xl">×</button>
            <h3 className="text-xl font-black text-slate-900 mb-6 uppercase italic tracking-tighter flex items-center gap-2 border-b border-slate-100 pb-3">
              <Ship className="w-5 h-5 text-red-600 animate-pulse" /> Register New Container Bill & Cargo Manifest
            </h3>
            <form onSubmit={handleAddDispatchSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Bill of Lading Container ID</label>
                  <input required type="text" value={newDispatch.containerId} onChange={e => setNewDispatch({...newDispatch, containerId: e.target.value})} className="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold border border-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs text-slate-800" placeholder="e.g. RBDU-102941-8" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Assigned Corridor Path</label>
                  <select value={newDispatch.routeId} onChange={e => setNewDispatch({...newDispatch, routeId: e.target.value})} className="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold border border-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs text-slate-800">
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>
                        {nodes.find(n => n.id === r.from)?.city} ➔ {nodes.find(n => n.id === r.to)?.city} ({r.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Cargo Manifest Label</label>
                  <input required type="text" value={newDispatch.cargoType} onChange={e => setNewDispatch({...newDispatch, cargoType: e.target.value})} className="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold border border-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs text-slate-800" placeholder="e.g. Cotton Joggers Pack" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Total Pieces (Transit Volume)</label>
                  <input required type="number" value={newDispatch.pcs} onChange={e => setNewDispatch({...newDispatch, pcs: Number(e.target.value)})} className="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold border border-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs text-slate-800" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Fulfillment Status</label>
                  <select value={newDispatch.status} onChange={e => setNewDispatch({...newDispatch, status: e.target.value as any})} className="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold border border-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs text-slate-800">
                    <option value="In Transit">In Transit</option>
                    <option value="Customs Hold">Customs Hold</option>
                    <option value="Discharged">Discharged</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Expected Date of Delivery (ETA)</label>
                  <input required type="date" value={newDispatch.estDelivery} onChange={e => setNewDispatch({...newDispatch, estDelivery: e.target.value})} className="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold border border-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500 text-xs text-slate-800 font-mono" />
                </div>
              </div>
              <button className="w-full bg-slate-900 text-white rounded-xl py-3.5 font-black uppercase tracking-widest hover:bg-red-600 transition-all text-xs shadow-xl shadow-slate-900/10">
                Register Booking Manifest
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminRoutesModule;
