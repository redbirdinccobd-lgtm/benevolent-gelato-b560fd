import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Printer, Download, CheckCircle2, Package, ShieldCheck, 
  MapPin, Calendar, Truck, QrCode, Barcode, Copy, Sparkles, Loader2, FileCheck
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ShippingLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentData?: any;
  onSaveLabel?: (labelData: any) => void;
}

export const ShippingLabelModal: React.FC<ShippingLabelModalProps> = ({
  isOpen,
  onClose,
  shipmentData,
  onSaveLabel
}) => {
  const [consignee, setConsignee] = useState(shipmentData?.buyerName || 'HANWHA APPAREL GROUP');
  const [consigneeAddress, setConsigneeAddress] = useState(
    shipmentData?.buyerAddress || 'Jung-gu 86, Eulji-ro, Hanwha Building, Seoul 04541, South Korea'
  );
  const [destinationPort, setDestinationPort] = useState(shipmentData?.destinationPort || 'Busan Port (KRPUS), South Korea');
  const [blNumber, setBlNumber] = useState(shipmentData?.blNumber || 'RBL-2026-CTG-9921');
  const [cartonNumber, setCartonNumber] = useState('01');
  const [totalCartons, setTotalCartons] = useState(shipmentData?.totalCartons || '450');
  const [grossWeight, setGrossWeight] = useState('18.5 KG');
  const [netWeight, setNetWeight] = useState('17.0 KG');
  const [dimensions, setDimensions] = useState('60 x 40 x 30 CM');
  const [garmentItem, setGarmentItem] = useState(shipmentData?.itemsSummary || "Men's Combed Cotton Polo Shirts (Style: RB-KR-808)");
  const [carrier, setCarrier] = useState(shipmentData?.carrier || 'KMTC Ocean Line');
  const [sealNumber, setSealNumber] = useState('SEAL-CTG-78901');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfSuccessNotice, setPdfSuccessNotice] = useState(false);
  const [pdfErrorMessage, setPdfErrorMessage] = useState<string | null>(null);

  // Sync state whenever shipmentData changes or modal opens
  useEffect(() => {
    if (shipmentData) {
      if (shipmentData.buyerName) setConsignee(shipmentData.buyerName);
      if (shipmentData.buyerAddress) setConsigneeAddress(shipmentData.buyerAddress);
      if (shipmentData.destinationPort) setDestinationPort(shipmentData.destinationPort);
      if (shipmentData.blNumber) setBlNumber(shipmentData.blNumber);
      if (shipmentData.totalCartons) setTotalCartons(String(shipmentData.totalCartons));
      if (shipmentData.itemsSummary) setGarmentItem(shipmentData.itemsSummary);
      if (shipmentData.carrier) setCarrier(shipmentData.carrier);
    }
  }, [shipmentData, isOpen]);

  const labelPrintRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!labelPrintRef.current) return;
    setIsExportingPdf(true);
    try {
      const element = labelPrintRef.current;
      const canvas = await html2canvas(element, {
        scale: 3, // High DPI for crisp barcode and text
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Standard 4x6" thermal label dimensions (101.6 mm x 152.4 mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [102, 152]
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Add with 3mm margin
      pdf.addImage(imgData, 'PNG', 3, 3, pdfWidth - 6, pdfHeight - 6, undefined, 'FAST');
      
      const fileName = `SHIPPING-LABEL_${(blNumber || 'RB').replace(/[^a-zA-Z0-9]/g, '_')}_CTN-${cartonNumber}-OF-${totalCartons}.pdf`;
      pdf.save(fileName);

      setPdfSuccessNotice(true);
      setTimeout(() => setPdfSuccessNotice(false), 3500);

      if (onSaveLabel) {
        onSaveLabel({
          consignee,
          blNumber,
          cartonNumber,
          totalCartons,
          destinationPort,
          fileName,
          downloadedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error generating PDF shipping label:', error);
      setPdfErrorMessage('Could not generate PDF shipping label. Please use the Print option as fallback.');
      setTimeout(() => setPdfErrorMessage(null), 5000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 rounded-xl text-white shadow-md">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                <span>International Ocean Cargo Shipping Label</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  ISO / GS1 Standard
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Red Bird International • Export Barcode & Packaging Identification
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

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start max-h-[80vh] overflow-y-auto">
          {/* Left: Input controls */}
          <div className="md:col-span-5 space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-black text-slate-900 uppercase text-[11px] flex items-center gap-1.5">
                <Sparkles size={14} className="text-red-600" />
                <span>Label Configuration</span>
              </h4>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Consignee (Buyer)</label>
                <input
                  type="text"
                  value={consignee}
                  onChange={(e) => setConsignee(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Discharge Port</label>
                <input
                  type="text"
                  value={destinationPort}
                  onChange={(e) => setDestinationPort(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Carton No.</label>
                  <input
                    type="text"
                    value={cartonNumber}
                    onChange={(e) => setCartonNumber(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Total Cartons</label>
                  <input
                    type="text"
                    value={totalCartons}
                    onChange={(e) => setTotalCartons(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gross Weight</label>
                  <input
                    type="text"
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Net Weight</label>
                  <input
                    type="text"
                    value={netWeight}
                    onChange={(e) => setNetWeight(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Garment Item & Style</label>
                <input
                  type="text"
                  value={garmentItem}
                  onChange={(e) => setGarmentItem(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">B/L Identifier</label>
                <input
                  type="text"
                  value={blNumber}
                  onChange={(e) => setBlNumber(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-red-600 font-bold"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                <span>{isExportingPdf ? 'Generating PDF...' : 'Download PDF Shipping Label'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs transition-all cursor-pointer"
              >
                <Printer size={15} />
                <span>Print Thermal Label (Browser)</span>
              </button>

              {pdfSuccessNotice && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>PDF label downloaded successfully!</span>
                </div>
              )}

              {pdfErrorMessage && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] font-bold flex items-center gap-2 animate-in fade-in">
                  <ShieldCheck size={15} className="text-rose-600 shrink-0" />
                  <span>{pdfErrorMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: The High-Resolution Printable Shipping Label */}
          <div className="md:col-span-7 bg-slate-100 p-4 rounded-3xl flex justify-center">
            <div
              ref={labelPrintRef}
              className="bg-white border-2 border-slate-900 rounded-xl p-5 w-full max-w-[360px] text-slate-900 shadow-xl space-y-3 font-sans print:shadow-none print:m-0"
              style={{ minHeight: '480px' }}
            >
              {/* Top Banner: Shipper */}
              <div className="border-b-2 border-slate-900 pb-2 flex justify-between items-start">
                <div>
                  <h5 className="font-black text-xs tracking-wider text-red-600 uppercase">
                    RED BIRD INTERNATIONAL
                  </h5>
                  <p className="text-[8px] text-slate-600 font-semibold leading-tight">
                    Plot-100, Majar Chow Road, Uttarkhan, Dhaka-1230, Bangladesh
                  </p>
                  <p className="text-[8px] font-bold text-slate-800">
                    BIN: 002910394-0102 • Export Reg: EXP-88912
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded">
                    EXPORT FCL
                  </span>
                </div>
              </div>

              {/* Consignee Section */}
              <div className="border-b-2 border-slate-900 pb-2">
                <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider block">
                  SHIP TO / CONSIGNEE:
                </span>
                <p className="text-sm font-black uppercase text-slate-950 leading-tight">
                  {consignee}
                </p>
                <p className="text-[9px] text-slate-700 font-medium leading-tight mt-0.5">
                  {consigneeAddress}
                </p>
              </div>

              {/* Port Routing Bar */}
              <div className="grid grid-cols-2 border-b-2 border-slate-900 pb-2 text-[9px]">
                <div className="border-r border-slate-300 pr-2">
                  <span className="text-[7px] font-black uppercase text-slate-400 block">PORT OF LOADING</span>
                  <strong className="text-slate-900 font-black">CHITTAGONG (BDCGP)</strong>
                </div>
                <div className="pl-2">
                  <span className="text-[7px] font-black uppercase text-slate-400 block">PORT OF DISCHARGE</span>
                  <strong className="text-slate-900 font-black truncate block">{destinationPort}</strong>
                </div>
              </div>

              {/* Carton Identifier Hero Box */}
              <div className="bg-slate-50 border border-slate-900 p-2.5 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[8px] font-black uppercase text-slate-500 block">PACKAGE UNIT</span>
                  <span className="text-xl font-black text-slate-950">
                    CTN {cartonNumber} <span className="text-xs text-slate-500 font-normal">OF {totalCartons}</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-black uppercase text-slate-500 block">GROSS / NET WT</span>
                  <span className="text-xs font-black text-slate-900">{grossWeight} / {netWeight}</span>
                </div>
              </div>

              {/* Garment Item Description */}
              <div className="text-[9px] border-b-2 border-slate-900 pb-2">
                <span className="text-[7.5px] font-black uppercase text-slate-400 block">DESCRIPTION OF GOODS:</span>
                <p className="font-bold text-slate-800 leading-tight">
                  {garmentItem}
                </p>
                <p className="text-[8px] text-slate-500 mt-0.5">
                  Dims: {dimensions} • Origin: BANGLADESH • Carrier: {carrier}
                </p>
              </div>

              {/* Barcode & QR Code Section */}
              <div className="flex items-center justify-between gap-3 pt-1">
                {/* Simulated Barcode */}
                <div className="space-y-1 flex-1">
                  <div className="h-10 w-full flex items-center justify-between overflow-hidden">
                    {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 3, 4, 2, 1, 3, 2].map((w, i) => (
                      <span
                        key={i}
                        className="bg-slate-950 inline-block h-full"
                        style={{ width: `${w * 1.5}px` }}
                      ></span>
                    ))}
                  </div>
                  <p className="text-[9px] font-mono font-black text-center text-slate-900 tracking-wider">
                    *{blNumber.replace(/[^a-zA-Z0-9]/g, '')}-{cartonNumber}*
                  </p>
                </div>

                {/* QR Code for customs verification */}
                <div className="border border-slate-900 p-1 bg-white rounded shrink-0">
                  <QRCodeSVG
                    value={`https://redbird-international.com/verify?bl=${encodeURIComponent(blNumber)}&ctn=${cartonNumber}`}
                    size={52}
                    level="M"
                  />
                </div>
              </div>

              {/* Safety & Handling Symbols */}
              <div className="pt-1 flex items-center justify-between text-[7px] text-slate-500 border-t border-slate-200">
                <span>KEEP DRY ☂</span>
                <span>HANDLE WITH CARE ☕</span>
                <span>THIS SIDE UP ↑↑</span>
                <span className="font-bold text-slate-700">AQL 2.5 PASS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium">
            Format: Standard 4x6" Thermal / ISO A6 Export Sticker
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-all cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isExportingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>Download PDF</span>
            </button>
            <button
              onClick={() => {
                if (onSaveLabel) {
                  onSaveLabel({
                    consignee,
                    blNumber,
                    cartonNumber,
                    totalCartons,
                    destinationPort
                  });
                }
                handlePrint();
              }}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={14} />
              <span>Print Label Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingLabelModal;
