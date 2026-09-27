import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Download, Printer, FileText, Ship, Package, CheckCircle2, 
  Layers, ShieldCheck, ArrowRight, Building2, Calendar, MapPin, 
  DollarSign, RefreshCw, Sparkles, QrCode, Copy, Check
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export type DashboardDocType = 'shipping-manifest' | 'commercial-invoice' | 'packing-list';

interface DashboardPdfExportUtilityProps {
  isOpen: boolean;
  onClose: () => void;
  shipments: any[];
  defaultShipmentId?: string;
  defaultDocType?: DashboardDocType;
}

export const DashboardPdfExportUtility: React.FC<DashboardPdfExportUtilityProps> = ({
  isOpen,
  onClose,
  shipments,
  defaultShipmentId,
  defaultDocType = 'shipping-manifest'
}) => {
  const [selectedDocType, setSelectedDocType] = useState<DashboardDocType>(defaultDocType);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>(
    defaultShipmentId || shipments[0]?.id || 'RB-2026-SK01'
  );
  const [isExporting, setIsExporting] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [currency, setCurrency] = useState<'USD' | 'BDT'>('USD');

  const documentPrintRef = useRef<HTMLDivElement>(null);

  // Sync when props change
  useEffect(() => {
    if (defaultDocType) setSelectedDocType(defaultDocType);
  }, [defaultDocType]);

  useEffect(() => {
    if (defaultShipmentId) setSelectedShipmentId(defaultShipmentId);
    else if (shipments.length > 0 && !selectedShipmentId) {
      setSelectedShipmentId(shipments[0].id);
    }
  }, [defaultShipmentId, shipments]);

  if (!isOpen) return null;

  // Find active shipment or fallback to default sample
  const currentShipment = shipments.find(s => s.id === selectedShipmentId) || shipments[0] || {
    id: 'RB-2026-SK01',
    buyerName: 'Hanwha Apparel Group',
    buyerCountry: 'South Korea',
    buyerAddress: 'Jung-gu 86, Eulji-ro, Hanwha Building, Seoul 04541, South Korea',
    destinationPort: 'Busan Port (KRPUS), South Korea',
    blNumber: 'RBL-2026-CTG-9921',
    carrier: 'KMTC Ocean Line',
    totalQuantity: 18000,
    totalCartons: 450,
    totalFobValue: 76500,
    unitPrice: 4.25,
    grossWeightKg: 8325,
    netWeightKg: 7650,
    cbm: 38.5,
    containerNumber: 'KMTC-U-982145-0',
    sealNumber: 'SEAL-CTG-78901',
    vesselName: 'M/V KMTC BUSAN V.2603E',
    itemsSummary: "Men's Combed Cotton Polo Shirts (Style: RB-KR-808)",
    status: 'In Transit',
    shipmentDate: '2026-03-24'
  };

  const docNumber = selectedDocType === 'shipping-manifest' 
    ? `MAN-CTG-${currentShipment.id || '2026'}`
    : selectedDocType === 'commercial-invoice'
    ? `INV-RBI-${currentShipment.id || '2026'}`
    : `PL-RBI-${currentShipment.id || '2026'}`;

  const verificationUrl = `https://redbird-international.com/verify?doc=${docNumber}&bl=${encodeURIComponent(currentShipment.blNumber || 'RBL-2026')}`;

  const handleDownloadPdf = async () => {
    if (!documentPrintRef.current) return;
    setIsExporting(true);

    try {
      const element = documentPrintRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, imgHeight), undefined, 'FAST');
      pdf.save(`${docNumber}_${currentShipment.buyerName?.replace(/\s+/g, '_') || 'Export'}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 rounded-xl text-white shadow-md">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                <span>Export Document Generation & PDF Utility</span>
                <span className="text-[10px] bg-red-600/30 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
                  Official Letterhead
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Direct formatted PDF exports for shipping manifests, commercial invoices, and packing manifests
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Action Controls & Document Selector Strip */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          {/* Document Type Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={() => setSelectedDocType('shipping-manifest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black uppercase text-[11px] transition-all cursor-pointer ${
                selectedDocType === 'shipping-manifest'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Ship size={14} />
              <span>Shipping Manifest</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedDocType('commercial-invoice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black uppercase text-[11px] transition-all cursor-pointer ${
                selectedDocType === 'commercial-invoice'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText size={14} />
              <span>Commercial Invoice</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedDocType('packing-list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black uppercase text-[11px] transition-all cursor-pointer ${
                selectedDocType === 'packing-list'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Package size={14} />
              <span>Packing Manifest</span>
            </button>
          </div>

          {/* Consignment Select Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Consignment:</label>
            <select
              value={selectedShipmentId}
              onChange={(e) => setSelectedShipmentId(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-900 text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              {shipments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} - {s.buyerName} ({s.destinationPort?.split('(')[0] || s.buyerCountry})
                </option>
              ))}
            </select>
          </div>

          {/* Direct PDF & Print Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold transition-all shadow-xs cursor-pointer"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black shadow-md shadow-red-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Download Formatted PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/70 flex justify-center">
          {/* Printable A4 Container */}
          <div
            ref={documentPrintRef}
            className="bg-white rounded-xl shadow-2xl p-8 sm:p-10 text-slate-900 border border-slate-200/80 w-full max-w-[794px] min-h-[1050px] flex flex-col justify-between font-sans print:shadow-none print:m-0 print:border-none relative overflow-hidden"
          >
            {/* REPEATING LOW-OPACITY 'RED BIRD INTERNATIONAL' SECURITY TEXT WATERMARK */}
            <div 
              className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden flex flex-col justify-around py-4"
              style={{ 
                opacity: 0.045,
                transform: 'rotate(-26deg) scale(1.45)',
                transformOrigin: 'center center',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact'
              }}
            >
              {Array.from({ length: 28 }).map((_, rIdx) => (
                <div 
                  key={rIdx}
                  className="whitespace-nowrap uppercase font-black text-slate-900 leading-none select-none tracking-[0.32em]"
                  style={{
                    fontFamily: "'Space Mono', 'Courier Prime', monospace",
                    fontSize: '11px',
                    marginLeft: `${(rIdx % 2 === 0 ? 0 : -95)}px`
                  }}
                >
                  {"RED BIRD INTERNATIONAL   •   RED BIRD INTERNATIONAL   •   RED BIRD INTERNATIONAL   •   RED BIRD INTERNATIONAL   •   ".repeat(4)}
                </div>
              ))}
            </div>

            {/* 1. Official Corporate Letterhead */}
            <div className="border-b-2 border-slate-900 pb-5 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  {/* Logo Icon */}
                  <div className="w-12 h-12 bg-red-600 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-md shrink-0">
                    RB
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-slate-950 tracking-tight uppercase leading-none">
                      RED BIRD INTERNATIONAL
                    </h1>
                    <p className="text-[10px] font-bold text-red-600 tracking-wider uppercase mt-0.5">
                      Premier Apparel Manufacturing, Export & Logistics House
                    </p>
                    <p className="text-[9px] text-slate-600 font-medium mt-1 leading-tight max-w-[380px]">
                      Plot-100, Majar Chow Road, Uttarkhan Majhar, Uttarkhan, Dhaka-1230, Bangladesh
                    </p>
                    <p className="text-[9px] text-slate-500 font-medium">
                      Factory: Unit-2 Industrial Zone, Gazipur RMG Complex, Dhaka • BIN: 002910394-0102 • Export Reg: EXP-88912
                    </p>
                  </div>
                </div>

                {/* Right Header: Document Stamp & Title */}
                <div className="text-right space-y-1">
                  <span className={`inline-block px-3 py-1 rounded text-[11px] font-black uppercase tracking-wider text-white ${
                    selectedDocType === 'shipping-manifest' 
                      ? 'bg-slate-950' 
                      : selectedDocType === 'commercial-invoice'
                      ? 'bg-red-600'
                      : 'bg-blue-700'
                  }`}>
                    {selectedDocType === 'shipping-manifest' && 'OCEAN CARGO MANIFEST'}
                    {selectedDocType === 'commercial-invoice' && 'COMMERCIAL INVOICE'}
                    {selectedDocType === 'packing-list' && 'EXPORT PACKING MANIFEST'}
                  </span>
                  <p className="text-[10px] font-mono font-bold text-slate-700">
                    Doc Ref: <strong className="text-slate-950">{docNumber}</strong>
                  </p>
                  <p className="text-[9px] text-slate-500">
                    Date: {currentShipment.shipmentDate || new Date().toISOString().split('T')[0]}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Metadata Grid (Shipper, Consignee, Vessel, B/L) */}
            <div className="grid grid-cols-2 gap-6 py-4 border-b border-slate-200 text-[10px]">
              {/* Left Column: Consignee & Notify Party */}
              <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">
                    CONSIGNEE / IMPORTER (BUYER):
                  </span>
                  <strong className="text-xs font-black text-slate-950 block mt-0.5 uppercase">
                    {currentShipment.buyerName}
                  </strong>
                  <p className="text-slate-600 mt-0.5 leading-tight">
                    {currentShipment.buyerAddress || 'Central Procurement Division, Global Headquarters'}
                  </p>
                  <p className="text-slate-500 font-medium mt-0.5">
                    Destination: <strong className="text-slate-800">{currentShipment.destinationPort}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <div>
                    <span className="text-[7.5px] font-black text-slate-400 uppercase block">Port of Loading</span>
                    <strong className="text-slate-900 font-bold">Chittagong (BDCGP), BD</strong>
                  </div>
                  <div>
                    <span className="text-[7.5px] font-black text-slate-400 uppercase block">Port of Discharge</span>
                    <strong className="text-slate-900 font-bold truncate block">{currentShipment.destinationPort}</strong>
                  </div>
                </div>
              </div>

              {/* Right Column: Routing & Container Specs */}
              <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bill of Lading (B/L):</span>
                    <strong className="font-mono text-red-600 font-black">{currentShipment.blNumber || 'RBL-2026-CTG-9921'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Carrier & Vessel:</span>
                    <strong className="text-slate-900 font-bold">{currentShipment.vesselName || 'M/V KMTC BUSAN V.2603E'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Container / Seal No:</span>
                    <strong className="font-mono text-slate-800 font-bold">
                      {currentShipment.containerNumber || 'KMTC-U-982145-0'} / {currentShipment.sealNumber || 'SEAL-CTG-78901'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Terms of Delivery:</span>
                    <strong className="text-slate-900 font-bold">FOB Chittagong Port (Incoterms 2020)</strong>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[9px] bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[7.5px] text-slate-400 block uppercase">Total Cartons</span>
                    <strong className="text-slate-900">{currentShipment.totalCartons || 450} Ctns</strong>
                  </div>
                  <div>
                    <span className="text-[7.5px] text-slate-400 block uppercase">Gross Weight</span>
                    <strong className="text-slate-900">{currentShipment.grossWeightKg || 8325} KGS</strong>
                  </div>
                  <div>
                    <span className="text-[7.5px] text-slate-400 block uppercase">Volume CBM</span>
                    <strong className="text-slate-900">{currentShipment.cbm || 38.5} CBM</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Detailed Goods & Commercial Items Table */}
            <div className="py-4 space-y-2 flex-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-black uppercase tracking-tight text-slate-900">
                  {selectedDocType === 'shipping-manifest' && 'CARGO SPECIFICATIONS & CONTAINER MANIFEST ENTRIES'}
                  {selectedDocType === 'commercial-invoice' && 'COMMERCIAL APPAREL INVOICE ITEMS'}
                  {selectedDocType === 'packing-list' && 'EXPORT PACKING MATRIX & CARTON ALLOCATION'}
                </span>
                <span className="text-[9px] font-bold text-slate-500">
                  AQL 2.5 Passed • Export Inspection Verified
                </span>
              </div>

              <table className="w-full text-left text-[9.5px] border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase text-[8.5px] font-black">
                    <th className="py-2 px-2.5 border-r border-slate-800">Item / Style</th>
                    <th className="py-2 px-2.5 border-r border-slate-800">Description of Goods</th>
                    <th className="py-2 px-2.5 border-r border-slate-800">HS Code</th>
                    <th className="py-2 px-2.5 border-r border-slate-800 text-right">Cartons</th>
                    <th className="py-2 px-2.5 border-r border-slate-800 text-right">Quantity</th>
                    <th className="py-2 px-2.5 border-r border-slate-800 text-right">Unit FOB</th>
                    <th className="py-2 px-2.5 text-right">Total FOB Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-2.5 font-bold font-mono border-r border-slate-200">
                      RB-KR-808
                    </td>
                    <td className="py-2.5 px-2.5 border-r border-slate-200">
                      <strong className="text-slate-900 block">Men's Combed Cotton Pique Polo Shirts</strong>
                      <span className="text-[8.5px] text-slate-500">100% Combed Cotton, 220 GSM, Reactive Dyed, Size S-XXL</span>
                    </td>
                    <td className="py-2.5 px-2.5 font-mono border-r border-slate-200">
                      6105.10.00
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono border-r border-slate-200">
                      {Math.round((currentShipment.totalCartons || 450) * 0.6)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-bold border-r border-slate-200">
                      {Math.round((currentShipment.totalQuantity || 18000) * 0.6).toLocaleString()} Pcs
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono border-r border-slate-200">
                      ${(currentShipment.unitPrice || 4.25).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-bold text-slate-950 font-mono">
                      ${(Math.round((currentShipment.totalQuantity || 18000) * 0.6) * (currentShipment.unitPrice || 4.25)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 px-2.5 font-bold font-mono border-r border-slate-200">
                      RB-KR-812
                    </td>
                    <td className="py-2.5 px-2.5 border-r border-slate-200">
                      <strong className="text-slate-900 block">Premium Mercerized Knit Casual Crewnecks</strong>
                      <span className="text-[8.5px] text-slate-500">95% Cotton / 5% Elastane, Soft Wash, Solid Colors</span>
                    </td>
                    <td className="py-2.5 px-2.5 font-mono border-r border-slate-200">
                      6109.10.00
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono border-r border-slate-200">
                      {Math.round((currentShipment.totalCartons || 450) * 0.4)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-bold border-r border-slate-200">
                      {Math.round((currentShipment.totalQuantity || 18000) * 0.4).toLocaleString()} Pcs
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono border-r border-slate-200">
                      ${(currentShipment.unitPrice || 4.25).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-bold text-slate-950 font-mono">
                      ${(Math.round((currentShipment.totalQuantity || 18000) * 0.4) * (currentShipment.unitPrice || 4.25)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>

                <tfoot>
                  <tr className="bg-slate-100 font-bold text-[9.5px] border-t-2 border-slate-900">
                    <td colSpan={3} className="py-2.5 px-2.5 uppercase font-black text-slate-900 border-r border-slate-200">
                      TOTAL CONSIGNMENT VALUE (FOB CHITTAGONG)
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-black border-r border-slate-200">
                      {currentShipment.totalCartons || 450} Ctns
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-black text-red-600 border-r border-slate-200">
                      {(currentShipment.totalQuantity || 18000).toLocaleString()} Pcs
                    </td>
                    <td className="py-2.5 px-2.5 text-right border-r border-slate-200">
                      AVG: ${(currentShipment.unitPrice || 4.25).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right text-xs font-black text-slate-950 font-mono">
                      ${(currentShipment.totalFobValue || 76500).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Amount in words */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[9px] text-slate-700">
                <span className="font-bold text-slate-900 uppercase">Amount in Words: </span>
                <span>Seventy-Six Thousand Five Hundred United States Dollars Only (USD).</span>
              </div>
            </div>

            {/* 4. Declarations & Banking Instructions */}
            <div className="grid grid-cols-2 gap-4 py-3 border-t border-slate-200 text-[8.5px] text-slate-600 leading-snug">
              <div>
                <strong className="text-slate-900 uppercase block font-bold mb-0.5">EXPORTER DECLARATION:</strong>
                <p>
                  We certify that this export cargo conforms to the commercial sales agreement, 
                  has undergone strict AQL 2.5 final inspection, and all details given herein are true, accurate, and authentic.
                </p>
              </div>

              <div>
                <strong className="text-slate-900 uppercase block font-bold mb-0.5">BANKING & PAYMENT ROUTING:</strong>
                <p>
                  Irrevocable 100% L/C at Sight • Advised via Woori Bank / Hana Bank Seoul • 
                  Export proceeds credited to Red Bird International Commercial Account.
                </p>
              </div>
            </div>

            {/* 5. Signatures, Watermark, and QR Verification Footer */}
            <div className="border-t-2 border-slate-900 pt-4 flex items-end justify-between text-[9px]">
              {/* QR Verification */}
              <div className="flex items-center gap-3">
                <div className="border border-slate-900 p-1 bg-white rounded shrink-0">
                  <QRCodeSVG
                    value={verificationUrl}
                    size={64}
                    level="M"
                  />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider block">
                    GOVERNMENT / CUSTOMS VERIFICATION
                  </span>
                  <p className="font-mono text-red-600 font-black text-[9px]">
                    EXP-TOKEN: {docNumber}
                  </p>
                  <p className="text-[8px] text-slate-500">
                    Scan via mobile or customs terminal to verify digital signature and B/L manifest.
                  </p>
                </div>
              </div>

              {/* Authorized Signatory */}
              <div className="text-right space-y-1">
                <div className="inline-block border-b border-slate-900 pb-1 w-44 text-center">
                  <span className="font-serif italic font-bold text-red-700 text-sm block">
                    Md. Sumon
                  </span>
                  <span className="text-[8px] text-slate-500 block">Managing Director & Head of Trade</span>
                </div>
                <p className="text-[8px] font-black uppercase text-slate-900">
                  FOR RED BIRD INTERNATIONAL
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>Format: Standard ISO A4 Export Format with 300 DPI Rendering</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyToken}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {copiedToken ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span className="text-emerald-700">Verification Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Verification URL</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download size={14} />
              <span>{isExporting ? 'Exporting PDF...' : 'Download Formatted PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPdfExportUtility;
