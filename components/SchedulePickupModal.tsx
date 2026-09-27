import React, { useState } from 'react';
import { 
  X, Calendar, Clock, Truck, MapPin, CheckCircle2, ShieldCheck, 
  Package, AlertCircle, ArrowRight, UserCheck
} from 'lucide-react';

interface SchedulePickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSchedule?: (pickupDetails: any) => void;
  defaultBuyer?: string;
  defaultShipmentId?: string;
}

export const SchedulePickupModal: React.FC<SchedulePickupModalProps> = ({
  isOpen,
  onClose,
  onConfirmSchedule,
  defaultBuyer,
  defaultShipmentId
}) => {
  const [pickupFacility, setPickupFacility] = useState('Unit-2 Industrial Zone, Gazipur RMG Complex, Dhaka');
  const [destinationHub, setDestinationHub] = useState('Chittagong Port CFS Terminal (BDCGP)');
  const [carrier, setCarrier] = useState('KMTC Logistics & Dedicated Container Haulage');
  const [vehicleType, setVehicleType] = useState('40ft High Cube Container Prime Mover');
  const [pickupDate, setPickupDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [pickupTimeSlot, setPickupTimeSlot] = useState('09:00 AM - 12:00 PM');
  const [estimatedCartons, setEstimatedCartons] = useState('450 Cartons (18,000 Pcs)');
  const [driverName, setDriverName] = useState('Md. Rafiqul Islam');
  const [driverPhone, setDriverPhone] = useState('+880 1712 345678');
  const [vehiclePlate, setVehiclePlate] = useState('DHAKA METRO-TA-11-8924');
  const [specialInstructions, setSpecialInstructions] = useState(
    'Cargo packed in export cartons with waterproof moisture barriers. Pre-cleared by BGMEA/Customs inspection officer.'
  );
  const [isSuccess, setIsSuccess] = useState(false);
  const [gatePassId, setGatePassId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedPass = `GP-RBI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setGatePassId(generatedPass);
    setIsSuccess(true);

    if (onConfirmSchedule) {
      onConfirmSchedule({
        gatePassId: generatedPass,
        pickupFacility,
        destinationHub,
        carrier,
        vehicleType,
        pickupDate,
        pickupTimeSlot,
        estimatedCartons,
        driverName,
        driverPhone,
        vehiclePlate,
        buyer: defaultBuyer || 'Hanwha Apparel Group',
        shipmentId: defaultShipmentId || 'RB-2026-SK01'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 rounded-xl text-white shadow-md">
              <Truck size={20} />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                <span>Schedule Export Cargo Pickup & Haulage</span>
              </h3>
              <p className="text-xs text-slate-300">
                Direct container dispatch from RMG factory to Chittagong Port CFS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={36} />
            </div>
            <h4 className="text-xl font-black text-slate-900">
              Cargo Pickup Successfully Scheduled!
            </h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Your container pickup request has been verified and registered into the logistics queue. 
              An electronic Gate Pass has been issued for gate security clearance.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-md mx-auto text-left space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Gate Pass ID</span>
                <span className="font-mono font-black text-red-600 text-sm">{gatePassId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Date:</span>
                <strong className="text-slate-900">{pickupDate} ({pickupTimeSlot})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pickup Facility:</span>
                <strong className="text-slate-900 truncate max-w-[200px]">{pickupFacility}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Haulage Vehicle:</span>
                <strong className="text-slate-900">{vehiclePlate}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cargo Volume:</span>
                <strong className="text-emerald-700">{estimatedCartons}</strong>
              </div>
            </div>

            <div className="pt-3">
              <button
                onClick={() => {
                  setIsSuccess(false);
                  onClose();
                }}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Done & Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Origin Facility (Factory / Warehouse)
                </label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={pickupFacility}
                    onChange={(e) => setPickupFacility(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Destination Port Terminal
                </label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500" />
                  <input
                    type="text"
                    value={destinationHub}
                    onChange={(e) => setDestinationHub(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Pickup Date
                </label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Time Slot Window
                </label>
                <div className="relative">
                  <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={pickupTimeSlot}
                    onChange={(e) => setPickupTimeSlot(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white"
                  >
                    <option value="06:00 AM - 09:00 AM">06:00 AM - 09:00 AM (Early Dispatch)</option>
                    <option value="09:00 AM - 12:00 PM">09:00 AM - 12:00 PM (Morning Window)</option>
                    <option value="01:00 PM - 04:00 PM">01:00 PM - 04:00 PM (Afternoon Window)</option>
                    <option value="05:00 PM - 08:00 PM">05:00 PM - 08:00 PM (Night Transit to CTG)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Carrier Line & Transport Unit
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white"
                >
                  <option value="40ft High Cube Container Prime Mover">40ft High Cube Container Prime Mover</option>
                  <option value="20ft Standard GP Container Prime Mover">20ft Standard GP Container Prime Mover</option>
                  <option value="10-Ton Heavy Duty Covered Van">10-Ton Heavy Duty Covered Van</option>
                  <option value="Dedicated Air Cargo CFS Feeder Truck">Dedicated Air Cargo CFS Feeder Truck</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Vehicle Plate / Reg No.
                </label>
                <input
                  type="text"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="e.g. DHAKA METRO-TA-11-8924"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Designated Driver Name
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Driver Phone (Emergency Contact)
                </label>
                <input
                  type="text"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Cargo Package & Volume Summary
              </label>
              <input
                type="text"
                value={estimatedCartons}
                onChange={(e) => setEstimatedCartons(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Customs & Security Instructions
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white"
              />
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Encrypted Gate Pass will be generated instantly</span>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  <span>Confirm Schedule</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SchedulePickupModal;
