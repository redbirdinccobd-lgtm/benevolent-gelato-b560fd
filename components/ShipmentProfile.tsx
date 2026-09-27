import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { collection, setDoc, doc, getDoc, updateDoc, getDocs, query, limit } from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../src/firebase';
import { notifyNewShipment, notifyVerificationRequired, sendNotification } from '../src/services/notificationService';

interface ShipmentItem {
  id: string;
  itemName: string;
  styleNumber: string;
  color: string;
  size: string;
  cartonNumber: string;
  quantity: number;
  colorQuantity: number;
}

interface ShipmentProfileProps {
  initialSearch?: string;
  onViewSummary?: (shipment: any) => void;
}

const ShipmentProfile: React.FC<ShipmentProfileProps> = ({ initialSearch, onViewSummary }) => {
  const [buyerName, setBuyerName] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [salesContractNumber, setSalesContractNumber] = useState('');
  const [salesContractDate, setSalesContractDate] = useState('');
  const [expNumber, setExpNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [shipmentDate, setShipmentDate] = useState('');
  const [paymentCondition, setPaymentCondition] = useState('');
  const [shippingTerms, setShippingTerms] = useState('');
  const [portOfDischarge, setPortOfDischarge] = useState('');
  const [items, setItems] = useState<ShipmentItem[]>([]);
  
  const [controlNumber, setControlNumber] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchControlNumber, setSearchControlNumber] = useState(initialSearch || '');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [status, setStatus] = useState<'active' | 'closed'>('active');
  const [trackingStatus, setTrackingStatus] = useState<'live' | 'invalid'>('live');
  const [isVerified, setIsVerified] = useState(false);
  const [createdBy, setCreatedBy] = useState('');
  const [notes, setNotes] = useState<any[]>([]);

  const MASTER_ADMIN_EMAIL = 'sumon.hanwha@gmail.com';
  const isMasterAdmin = auth.currentUser?.email === MASTER_ADMIN_EMAIL;

  useEffect(() => {
    if (initialSearch) {
      setSearchControlNumber(initialSearch);
      fetchProfile(initialSearch);
    }
  }, [initialSearch]);

  useEffect(() => {
    if (isScannerOpen) {
      const scanner = new Html5QrcodeScanner("qr-reader", { qrbox: { width: 250, height: 250 }, fps: 5 }, false);
      scanner.render((text) => {
        scanner.clear();
        setIsScannerOpen(false);
        let id = text;
        if (text.includes('id=')) {
          const params = new URLSearchParams(text.split('?')[1]);
          id = params.get('id') || text;
        } else if (text.startsWith('RB-INV')) {
          id = text;
        }
        setSearchControlNumber(id);
        fetchProfile(id);
      }, (err) => {
         // ignore scanner errors
      });
      return () => {
        scanner.clear().catch(e => console.error(e));
      };
    }
  }, [isScannerOpen]);

  const applyShipmentData = (data: any, docId: string) => {
    setBuyerName(data.buyerName || '');
    setBuyerAddress(data.buyerAddress || '');
    setBuyerPhone(data.buyerPhone || '');
    setSalesContractNumber(data.salesContractNumber || '');
    setSalesContractDate(data.salesContractDate || '');
    setExpNumber(data.expNumber || '');
    setIssueDate(data.issueDate || '');
    setShipmentDate(data.shipmentDate || '');
    setPaymentCondition(data.paymentCondition || '');
    setShippingTerms(data.shippingTerms || '');
    setPortOfDischarge(data.portOfDischarge || '');
    setItems(data.items || []);
    setControlNumber(data.id || docId);
    setStatus(data.status || 'active');
    setTrackingStatus(data.trackingStatus || 'live');
    setIsVerified(data.isVerified ?? true); // Default to true for old data
    setCreatedBy(data.createdBy || '');
    setNotes(data.notes || []);
  };

  const fetchProfile = async (id: string) => {
    if (!id) return;
    setIsGenerating(true);
    try {
      if (!db) throw new Error("Firebase DB not initialized");
      const cleanId = id.trim();
      const docRef = doc(db, 'shipments', cleanId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        applyShipmentData(docSnap.data(), docSnap.id);
        return;
      }

      // Search collection for partial match by ID, buyer, address, or port
      const snap = await getDocs(query(collection(db, 'shipments'), limit(50)));
      let matchedDoc: any = null;
      const lower = cleanId.toLowerCase();
      snap.forEach(d => {
        const data = d.data();
        if (
          d.id.toLowerCase().includes(lower) ||
          (data.buyerAddress && data.buyerAddress.toLowerCase().includes(lower)) ||
          (data.buyerName && data.buyerName.toLowerCase().includes(lower)) ||
          (data.portOfDischarge && data.portOfDischarge.toLowerCase().includes(lower)) ||
          (data.salesContractNumber && data.salesContractNumber.toLowerCase().includes(lower))
        ) {
          if (!matchedDoc) matchedDoc = { id: d.id, ...data };
        }
      });

      if (matchedDoc) {
        applyShipmentData(matchedDoc, matchedDoc.id);
      } else {
        alert(`Shipment profile not found for: "${id}"`);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `shipments/${id}`);
      alert("Error fetching profile.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddItem = () => {
    setItems([...items, {
      id: Math.random().toString(36).substr(2, 9),
      itemName: '',
      styleNumber: '',
      color: '',
      size: '',
      cartonNumber: '',
      quantity: 0,
      colorQuantity: 0
    }]);
  };

  const handleItemChange = (id: string, field: keyof ShipmentItem, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const generateProfile = async () => {
    if (!buyerName) {
      alert("Please enter buyer details");
      return;
    }
    
    if (!shipmentDate) {
      alert("Please enter a Shipment Date.");
      return;
    }
    
    if (shipmentDate) {
      const selectedDate = new Date(shipmentDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (isNaN(selectedDate.getTime())) {
        alert("Please enter a valid Shipment Date.");
        return;
      }
      if (selectedDate > today) {
        alert("Shipment Date cannot be in the future.");
        return;
      }
    }

    setIsGenerating(true);
    const newControlNumber = `RB-INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    
    try {
      if (!db) throw new Error("Firebase DB not initialized");
      const shipmentData = {
         id: newControlNumber,
         buyerName,
         buyerAddress,
         buyerPhone,
         salesContractNumber,
         salesContractDate,
         expNumber,
         issueDate,
         shipmentDate,
         paymentCondition,
         shippingTerms,
         portOfDischarge,
         items,
         status: 'active',
         trackingStatus: 'live',
         isVerified: isMasterAdmin, // Master Admin shipments are pre-verified
         createdBy: auth.currentUser?.email || 'unknown',
         date: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'shipments', newControlNumber), shipmentData);
      setControlNumber(newControlNumber);

      // Trigger Notification for Master Admin if it's not pre-verified
      if (!isMasterAdmin) {
        await notifyNewShipment(newControlNumber, buyerName);
      }
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, 'shipments');
       alert("Failed to save shipment to verification database.");
    } finally {
       setIsGenerating(false);
    }
  };

  const handleToggleShipmentStatus = async () => {
    if (!controlNumber || !db) return;
    const newStatus = status === 'active' ? 'closed' : 'active';
    const confirmMsg = newStatus === 'closed' ? "Are you sure you want to CLOSE this shipment? This will show 'Shipment Delivered' to the buyer." : "Re-open this shipment?";
    if (!window.confirm(confirmMsg)) return;

    setIsGenerating(true);
    try {
      await updateDoc(doc(db, 'shipments', controlNumber), { status: newStatus });
      setStatus(newStatus);
      alert(`Shipment is now ${newStatus.toUpperCase()}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `shipments/${controlNumber}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleTracking = async () => {
    if (!controlNumber || !db) return;
    const newTrackStatus = trackingStatus === 'live' ? 'invalid' : 'live';
    const confirmMsg = newTrackStatus === 'invalid' ? "Invalidating this tracking link will prevent the buyer from seeing any status. Continue?" : "Restore live tracking for the buyer?";
    if (!window.confirm(confirmMsg)) return;

    setIsGenerating(true);
    try {
      await updateDoc(doc(db, 'shipments', controlNumber), { trackingStatus: newTrackStatus });
      setTrackingStatus(newTrackStatus);
      alert(`Tracking is now ${newTrackStatus.toUpperCase()}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `shipments/${controlNumber}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const printDocument = (docType: string) => {
    if (!isVerified && !isMasterAdmin) {
      alert("This shipment profile is pending verification from the Master Admin. Downloads are restricted.");
      return;
    }
    alert(`Generating ${docType} for Invoice No: ${controlNumber}`);
    window.print();
  };

  const handleVerifyShipment = async () => {
    if (!controlNumber || !db || !isMasterAdmin) return;
    if (!window.confirm("Verify this shipment? This will allow document downloads for the user and buyer.")) return;

    setIsGenerating(true);
    try {
      await updateDoc(doc(db, 'shipments', controlNumber), { isVerified: true });
      setIsVerified(true);
      alert("Shipment Verified successfully.");

      // Notify the creator if we have their email
      if (createdBy && createdBy !== 'unknown' && createdBy !== MASTER_ADMIN_EMAIL) {
        await sendNotification(
          `✅ Shipment Verified: ${controlNumber}`,
          `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #16a34a;">Verification Successful</h2>
              <p>Your shipment <strong>${controlNumber}</strong> has been verified by the Master Admin.</p>
              <p>You and the buyer can now download all documentation (Invoices, Packing Lists, etc.).</p>
              <a href="${window.location.origin}" style="display: inline-block; background: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Shipment</a>
            </div>
          `,
          createdBy
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `shipments/${controlNumber}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl animate-fade-in print:p-0 p-10 shadow-sm border border-slate-200 print:shadow-none print:border-none print:m-0 print:w-full">
      <div className="no-print">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8 border-b pb-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Shipment Profile</h3>
            <p className="text-slate-500 text-sm">Create and manage shipment documentation</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                <input 
                  type="text" 
                  placeholder="Invoice No."
                  className="px-4 py-2 bg-transparent outline-none w-48 text-sm"
                  value={searchControlNumber}
                  onChange={(e) => setSearchControlNumber(e.target.value)}
                />
                <button 
                  onClick={() => fetchProfile(searchControlNumber)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold transition-colors"
                >
                  Load
                </button>
             </div>
             <button 
               onClick={() => setIsScannerOpen(!isScannerOpen)}
               className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${isScannerOpen ? 'bg-red-100 text-red-600' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
               </svg>
               {isScannerOpen ? 'Close Scanner' : 'Scan QR'}
             </button>
          </div>
        </div>

        {isScannerOpen && (
          <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-700 mb-4 text-center">Scan QR Code from Document</h4>
            <div id="qr-reader" className="mx-auto w-full max-w-sm rounded-lg overflow-hidden bg-white shadow-sm border border-slate-200"></div>
          </div>
        )}

        {controlNumber && (
          <div className={`mb-8 p-4 rounded-xl border text-center ${isVerified ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex justify-between items-start mb-2 no-print">
               <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${isVerified ? 'bg-green-600 text-white' : 'bg-amber-600 text-white'}`}>
                  {isVerified ? 'Verified' : 'Pending Verification'}
               </span>
               {isMasterAdmin && !isVerified && (
                  <button 
                     onClick={handleVerifyShipment}
                     className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-md hover:bg-green-600 transition-colors uppercase tracking-tighter"
                  >
                     Verify Now
                  </button>
               )}
            </div>
            {!isVerified && !isMasterAdmin && (
               <button 
                  onClick={() => notifyVerificationRequired(controlNumber!)}
                  className="mb-4 w-full bg-amber-100 text-amber-700 text-[10px] font-black py-2 rounded-lg hover:bg-amber-200 transition-all uppercase tracking-widest flex items-center justify-center gap-2 no-print border border-amber-200"
               >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Remind Master Admin to Verify
               </button>
             )}
            <span className={`text-xs font-bold uppercase tracking-widest block mb-1 ${isVerified ? 'text-green-700' : 'text-amber-700'}`}>Generated Invoice Number</span>
            <div className={`font-bold text-2xl ${isVerified ? 'text-green-800' : 'text-amber-800'}`}>
              {controlNumber}
            </div>
            <div className={`mt-4 p-3 rounded-lg border no-print ${isVerified ? 'bg-white/50 border-green-200' : 'bg-white/50 border-amber-200'}`}>
               <p className={`text-[10px] uppercase font-black mb-1 ${isVerified ? 'text-green-600' : 'text-amber-600'}`}>Buyer Tracking URL</p>
               <input 
                 readOnly 
                 value={`${window.location.origin}/#track/${controlNumber}`}
                 className={`w-full bg-white border rounded px-3 py-1.5 text-xs font-mono hide-scrollbar ${isVerified ? 'border-green-300 text-green-800' : 'border-amber-300 text-amber-800'}`}
                 onClick={(e) => (e.target as HTMLInputElement).select()}
               />
               <p className={`text-[9px] mt-1 ${isVerified ? 'text-green-500' : 'text-amber-500'}`}>
                 {isVerified ? 'Provide this secure link to the buyer for live tracking.' : 'Documents will be unavailable to the buyer until verification.'}
               </p>
            </div>
            <button 
              onClick={() => {
                setControlNumber('');
                setSearchControlNumber('');
                setBuyerName('');
                setBuyerAddress('');
                setBuyerPhone('');
                setSalesContractNumber('');
                setSalesContractDate('');
                setExpNumber('');
                setIssueDate('');
                setShipmentDate('');
                setPaymentCondition('');
                setShippingTerms('');
                setPortOfDischarge('');
                setItems([]);
              }}
              className="mt-3 text-sm text-green-700 hover:text-green-900 font-bold border border-green-300 px-4 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
            >
              Clear / Start New
            </button>
          </div>
        )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h4 className="text-sm font-bold text-slate-900 mb-4 border-b pb-2">Consignee / Buyer Details</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Buyer Name</label>
              <input type="text" className="w-full px-4 py-2 bg-slate-50 border rounded-lg" value={buyerName} onChange={e => setBuyerName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Second Address</label>
              <textarea className="w-full px-4 py-2 bg-slate-50 border rounded-lg" rows={2} value={buyerAddress} onChange={e => setBuyerAddress(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Phone Number</label>
              <input type="text" className="w-full px-4 py-2 bg-slate-50 border rounded-lg" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-900 mb-4 border-b pb-2">Shipment details</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Sales Contract No.</label>
                <input type="text" className="w-full px-4 py-2 bg-slate-50 border rounded-lg" value={salesContractNumber} onChange={e => setSalesContractNumber(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">SC Date</label>
                <input type="date" className="w-full px-4 py-2 bg-slate-50 border rounded-lg" value={salesContractDate} onChange={e => setSalesContractDate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">EXP Number</label>
                <input type="text" className="w-full px-4 py-2 bg-slate-50 border rounded-lg" value={expNumber} onChange={e => setExpNumber(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Issue Date</label>
                <input type="date" className="w-full px-4 py-2 bg-slate-50 border rounded-lg" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Shipment Date</label>
                <input type="date" className="w-full px-4 py-2 bg-slate-50 border rounded-lg" value={shipmentDate} onChange={e => setShipmentDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Payment Condition</label>
                <input type="text" className="w-full px-4 py-2 bg-slate-50 border rounded-lg" placeholder="e.g. LC, TT" value={paymentCondition} onChange={e => setPaymentCondition(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Shipping Terms</label>
                <input type="text" className="w-full px-4 py-2 bg-slate-50 border rounded-lg" placeholder="e.g. FOB, CIF" value={shippingTerms} onChange={e => setShippingTerms(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Port of Discharge</label>
                <input type="text" className="w-full px-4 py-2 bg-slate-50 border rounded-lg" placeholder="e.g. Busan, Tokyo" value={portOfDischarge} onChange={e => setPortOfDischarge(e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-bold text-slate-900">Packing List & Items</h4>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200">
              Upload Input Option
            </button>
            <button onClick={handleAddItem} className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700">
              + Manually Input Item
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-bold">
              <tr>
                <th className="px-4 py-3">Item Name</th>
                <th className="px-4 py-3">Style No.</th>
                <th className="px-4 py-3">Carton No.</th>
                <th className="px-4 py-3">Color</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Color Qty</th>
                <th className="px-4 py-3">Total Qty (Calc)</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-2"><input type="text" className="w-full p-1 border rounded" value={item.itemName} onChange={e => handleItemChange(item.id, 'itemName', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className="w-full p-1 border rounded" value={item.styleNumber} onChange={e => handleItemChange(item.id, 'styleNumber', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className="w-full p-1 border rounded" value={item.cartonNumber} onChange={e => handleItemChange(item.id, 'cartonNumber', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className="w-full p-1 border rounded" value={item.color} onChange={e => handleItemChange(item.id, 'color', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className="w-full p-1 border rounded" value={item.size} onChange={e => handleItemChange(item.id, 'size', e.target.value)} /></td>
                  <td className="p-2"><input type="number" className="w-20 p-1 border rounded" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)} /></td>
                  <td className="p-2"><input type="number" className="w-20 p-1 border rounded" value={item.colorQuantity} onChange={e => handleItemChange(item.id, 'colorQuantity', parseInt(e.target.value) || 0)} /></td>
                  <td className="p-2 text-center font-bold">{item.quantity * item.colorQuantity}</td>
                  <td className="p-2">
                    <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700">✕</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">No items added. Click advanced options to start.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-4">
        {!controlNumber ? (
          <button onClick={generateProfile} className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700">
            Generate Shipment Profile & Invoice
          </button>
        ) : (
          <div className="flex gap-3">
             <button 
                onClick={() => printDocument('Commercial Invoice')} 
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isVerified || isMasterAdmin ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
             >
                Commercial Invoice
             </button>
             <button 
                onClick={() => printDocument('Packing List')} 
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isVerified || isMasterAdmin ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
             >
                Packing List
             </button>
             <button 
                onClick={() => printDocument('Sales Contract')} 
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isVerified || isMasterAdmin ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
             >
                Sales Contract
             </button>
             <button 
                onClick={() => printDocument('Shipper NOC')} 
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isVerified || isMasterAdmin ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
             >
                Shipper NOC
             </button>
             <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
             <button 
                onClick={handleToggleShipmentStatus}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${status === 'active' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
             >
                {status === 'active' ? 'Close Shipment' : 'Open Shipment'}
             </button>
             <button 
                onClick={handleToggleTracking}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${trackingStatus === 'live' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
             >
                {trackingStatus === 'live' ? 'Invalidate URL' : 'Live Tracking'}
             </button>
             {onViewSummary && (
                <button 
                   onClick={() => {
                     onViewSummary({
                      id: controlNumber,
                      buyerName,
                      buyerAddress,
                      buyerPhone,
                      salesContractNumber,
                      salesContractDate,
                      expNumber,
                      issueDate,
                      shipmentDate,
                      paymentCondition,
                      shippingTerms,
                      portOfDischarge,
                      items,
                      status,
                      trackingStatus,
                      isVerified,
                      notes
                    });
                  }}
                   className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                >
                   <FileText size={16} />
                   View Summary Report
                </button>
             )}
          </div>
        )}
      </div>
      </div>

      {/* Print Only View */}
      <div className="hidden print:block font-sans text-slate-800">
        <div className="flex justify-between items-start mb-8 border-b pb-4 border-slate-300">
          <div>
            <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tight">RED BIRD INTERNATIONAL</h1>
            <p className="text-sm">Dhaka, Bangladesh</p>
          </div>
          <div className="text-right flex space-x-6 items-start">
            <div className="text-right">
               <h2 className="text-xl font-bold uppercase mb-1">Shipment Profile</h2>
               <p className="text-sm font-bold">Invoice Number: {controlNumber}</p>
               <p className="text-sm">Date: {new Date().toLocaleDateString()}</p>
               {expNumber && <p className="text-sm font-bold mt-2">EXP: {expNumber}</p>}
               {issueDate && <p className="text-sm">Issue Date: {issueDate}</p>}
            </div>
            {controlNumber && (
              <div className="p-2 bg-white">
                <QRCodeSVG value={`${window.location.origin}/#verify?id=${controlNumber}`} size={80} />
                <p className="text-[10px] text-center mt-1 font-bold">Scan to Verify</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
          <div className="border border-slate-300 p-4 rounded-lg">
            <h3 className="font-bold border-b border-slate-200 pb-2 mb-2 uppercase text-xs tracking-wider">Consignee</h3>
            <p className="font-bold text-lg">{buyerName}</p>
            <p className="whitespace-pre-wrap">{buyerAddress}</p>
            <p className="mt-2">Tel: {buyerPhone}</p>
          </div>
          <div className="border border-slate-300 p-4 rounded-lg">
            <h3 className="font-bold border-b border-slate-200 pb-2 mb-2 uppercase text-xs tracking-wider">Shipment Details</h3>
            <p><span className="font-bold">Sales Contract:</span> {salesContractNumber}</p>
            <p><span className="font-bold">SC Date:</span> {salesContractDate}</p>
            <p><span className="font-bold">Shipment Date:</span> {shipmentDate}</p>
            <p><span className="font-bold">Payment Terms:</span> {paymentCondition}</p>
            <p><span className="font-bold">Shipping Terms:</span> {shippingTerms}</p>
            <p><span className="font-bold">Port of Discharge:</span> {portOfDischarge}</p>
          </div>
        </div>

        <table className="w-full text-sm border-collapse border border-slate-300">
          <thead className="bg-slate-100">
            <tr>
              <th className="border border-slate-300 p-2 text-left">Item / Style</th>
              <th className="border border-slate-300 p-2">Carton</th>
              <th className="border border-slate-300 p-2">Color</th>
              <th className="border border-slate-300 p-2">Size</th>
              <th className="border border-slate-300 p-2 text-right">Qty</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td className="border border-slate-300 p-2">
                   <div className="font-bold">{item.itemName}</div>
                   <div className="text-xs text-slate-500">{item.styleNumber}</div>
                </td>
                <td className="border border-slate-300 p-2 text-center">{item.cartonNumber}</td>
                <td className="border border-slate-300 p-2 text-center">{item.color}</td>
                <td className="border border-slate-300 p-2 text-center">{item.size}</td>
                <td className="border border-slate-300 p-2 text-right font-bold">{item.quantity * item.colorQuantity}</td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-bold">
               <td colSpan={4} className="border border-slate-300 p-2 text-right">Total Oty:</td>
               <td className="border border-slate-300 p-2 text-right">{items.reduce((sum, item) => sum + (item.quantity * item.colorQuantity), 0)}</td>
            </tr>
          </tbody>
        </table>
        
        <div className="mt-16 flex justify-between text-center pt-8">
           <div className="w-48 border-t border-slate-800 pt-2"><p className="text-sm font-bold">Authorized Signature</p></div>
           <div className="w-48 border-t border-slate-800 pt-2"><p className="text-sm font-bold">Buyer Signature</p></div>
        </div>
      </div>

    </div>
  );
};

export default ShipmentProfile;
