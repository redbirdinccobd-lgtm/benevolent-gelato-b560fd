import React, { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export type UnifiedDocType = 
  | 'commercial-invoice' 
  | 'pro-forma-invoice' 
  | 'packing-list' 
  | 'bill-of-lading'
  | 'invoice';

export interface UnifiedDocItem {
  id: string;
  itemDescription: string;
  styleNumber?: string;
  colorName?: string;
  hsCode?: string;
  quantity: number;
  unit?: string;
  unitPrice?: number;
  totalAmount?: number;
  cartons?: number;
  cartonRange?: string;
  sizeRatio?: string;
  grossWeightKg?: number;
  netWeightKg?: number;
  cbm?: number;
  origin?: string;
  remarks?: string;
}

export interface UnifiedLetterheadData {
  docType: UnifiedDocType;
  docTitle?: string;
  docNumber: string;
  issueDate: string;
  dueDate?: string;
  piPoRef?: string;
  shipmentDate?: string;
  incoterms?: string;
  paymentTerms?: string;
  currency?: string;
  exchangeRate?: number;
  
  // Ports & Transport
  portOfLoading?: string;
  portOfDischarge?: string;
  finalDestination?: string;
  transportMode?: string;
  vesselName?: string;
  voyageNo?: string;
  containerNumber?: string;
  sealNumber?: string;
  blNumber?: string;
  expNumber?: string;
  lcNumber?: string;

  // Shipper / Exporter
  shipperName?: string;
  shipperAddress?: string;
  shipperTel?: string;
  shipperEmail?: string;
  shipperWeb?: string;
  shipperBinTin?: string;

  // Buyer / Consignee
  buyerName: string;
  buyerAddress: string;
  buyerCityCountry?: string;
  buyerTel?: string;
  buyerEmail?: string;
  buyerTaxId?: string;
  notifyParty?: string;

  // Logistics Totals
  noOfPackages?: string | number;
  grossWeight?: string | number;
  netWeight?: string | number;
  marksAndNumbers?: string;
  totalCbm?: string | number;

  // Bank & Wire details
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  swiftCode?: string;
  branchName?: string;

  // Legal
  declarationText?: string;
  amountInWords?: string;
  authorizedSignatoryName?: string;
  authorizedSignatoryTitle?: string;

  // Security & Visual Controls
  showWatermark?: boolean;
  watermarkText?: string;
  watermarkOpacity?: number; // e.g. 0.04 to 0.15
  watermarkPattern?: 'micro-security' | 'diagonal-stripe' | 'both';
  watermarkFont?: string;
  showGuilloche?: boolean;
  showQrCode?: boolean;
  showSeal?: boolean;
  showSignature?: boolean;
  sealUrl?: string | null;
  signatureUrl?: string | null;
}

interface UnifiedExportLetterheadDocumentProps {
  data: UnifiedLetterheadData;
  items: UnifiedDocItem[];
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const UnifiedExportLetterheadDocument: React.FC<UnifiedExportLetterheadDocumentProps> = ({
  data,
  items,
  containerRef
}) => {
  const currencySymbol = data.currency === 'BDT' ? 'BDT' : data.currency === 'EUR' ? 'EUR' : 'USD';
  
  // Calculate Totals
  const totals = useMemo(() => {
    const totalQty = items.reduce((s, it) => s + Number(it.quantity || 0), 0);
    const totalAmount = items.reduce((s, it) => s + Number(it.totalAmount || (Number(it.quantity || 0) * Number(it.unitPrice || 0))), 0);
    const totalCartons = items.reduce((s, it) => s + Number(it.cartons || 0), 0);
    const totalGross = items.reduce((s, it) => s + Number(it.grossWeightKg || (Number(it.cartons || 0) * 16)), 0);
    const totalNet = items.reduce((s, it) => s + Number(it.netWeightKg || (Number(it.cartons || 0) * 14.8)), 0);
    const totalCbmVal = +(items.reduce((s, it) => s + Number(it.cbm || (Number(it.cartons || 0) * 0.08)), 0)).toFixed(2);

    return {
      totalQty,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalCartons,
      totalGross: Math.round(totalGross),
      totalNet: Math.round(totalNet),
      totalCbm: totalCbmVal
    };
  }, [items]);

  // Determine Title Banner Text based on Doc Type
  const bannerTitle = useMemo(() => {
    if (data.docTitle) return data.docTitle;
    switch (data.docType) {
      case 'pro-forma-invoice':
        return 'PRO-FORMA INVOICE';
      case 'packing-list':
        return 'EXPORT PACKING LIST & WEIGHT SPECIFICATION';
      case 'bill-of-lading':
        return 'BILL OF LADING / SEA WAYBILL';
      case 'invoice':
        return 'COMMERCIAL EXPORT INVOICE';
      case 'commercial-invoice':
      default:
        return 'COMMERCIAL INVOICE';
    }
  }, [data.docTitle, data.docType]);

  // Padded items: Ensure at least 8 rows are rendered to maintain exact A4 physical balance matching the sample PDF
  const paddedItems = useMemo(() => {
    const minRows = 8;
    const filled = [...items];
    while (filled.length < minRows) {
      filled.push({
        id: `empty-row-${filled.length + 1}`,
        itemDescription: '',
        quantity: 0,
        unit: '',
        unitPrice: 0,
        totalAmount: 0,
        cartons: 0,
        origin: '',
        remarks: ''
      });
    }
    return filled;
  }, [items]);

  const qrVerifyUrl = `https://redbird-international.com/#verify?id=${encodeURIComponent(data.docNumber)}`;

  // Repeating low-opacity 'Red Bird International' text watermark for enhanced security
  const watermarkLabel = data.watermarkText || 'Red Bird International';
  const watermarkOpacity = data.watermarkOpacity !== undefined ? data.watermarkOpacity : 0.045;
  const watermarkFont = data.watermarkFont || "'Space Mono', 'Courier Prime', 'Consolas', 'Cinzel', monospace";
  const watermarkPattern = data.watermarkPattern || 'both';

  // Generate repeating 'Red Bird International' text across the entire background
  const repeatingWatermarkLine = `${watermarkLabel}   •   ${watermarkLabel}   •   ${watermarkLabel}   •   ${watermarkLabel}   •   `;
  const repeatingWatermarkRows = Array.from({ length: 30 });

  return (
    <div className="w-full flex justify-center py-2 bg-slate-200/50 print:bg-white print:py-0">
      {/* 
        A4 Document Container
        True standard A4 dimensions: 210mm x 297mm (Aspect ratio: 1 : 1.4142)
        At screen resolution: 794px width x 1123px height
      */}
      <div 
        ref={containerRef as any}
        className="w-[794px] min-h-[1123px] max-w-full bg-white text-slate-900 shadow-2xl print:shadow-none relative px-9 py-6 flex flex-col justify-between font-sans border border-slate-300 print:border-none box-border overflow-hidden select-text"
        style={{
          boxSizing: 'border-box'
        }}
      >
        {/* =====================================================================
            1. ANTI-COUNTERFEIT SECURITY LAYER & WATERMARKS
           ===================================================================== */}
        {/* Repeating Low-Opacity 'Red Bird International' Text Watermark (Background Security Grid) */}
        {(data.showWatermark !== false) && (
          <div 
            className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden flex flex-col justify-around py-3"
            style={{ 
              opacity: watermarkOpacity,
              transform: 'rotate(-26deg) scale(1.45)',
              transformOrigin: 'center center',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          >
            {repeatingWatermarkRows.map((_, rowIndex) => (
              <div 
                key={rowIndex}
                className="whitespace-nowrap uppercase font-black text-slate-900 leading-none select-none transition-all"
                style={{
                  fontFamily: watermarkFont,
                  fontSize: '11px',
                  letterSpacing: '0.32em',
                  marginLeft: `${(rowIndex % 2 === 0 ? 0 : -95)}px`
                }}
              >
                {repeatingWatermarkLine.repeat(5)}
              </div>
            ))}
          </div>
        )}

        {/* Central Security Emblem Watermark (Authentic Sovereign Trade Seal Position) */}
        {(data.showWatermark !== false) && (watermarkPattern === 'both' || watermarkPattern === 'diagonal-stripe') && (
          <div 
            className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 overflow-hidden"
            style={{ opacity: watermarkOpacity * 1.25 }}
          >
            <div 
              className="flex flex-col items-center justify-center select-none text-center"
              style={{
                transform: 'rotate(-28deg)',
                fontFamily: watermarkFont
              }}
            >
              {/* Security Seal Ring */}
              <div className="w-56 h-56 rounded-full border-2 border-dashed border-slate-900 flex flex-col items-center justify-center p-3 relative">
                <div className="w-48 h-48 rounded-full border border-slate-800 flex flex-col items-center justify-center p-2 text-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-800 mb-1">
                    ★ RED BIRD INTERNATIONAL ★
                  </span>
                  <span className="text-3xl font-black text-slate-900 tracking-[0.2em] my-1">
                    RBI
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-slate-700">
                    DHAKA • BANGLADESH
                  </span>
                  <div className="w-16 h-px bg-slate-700 my-1"></div>
                  <span className="text-[7.5px] font-black uppercase tracking-[0.2em] text-slate-600">
                    AUTHENTICATED EXPORT
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs font-black text-slate-900 tracking-[0.35em] uppercase">
                {watermarkLabel}
              </div>
            </div>
          </div>
        )}

        {/* Guilloche Anti-Tamper Security Micro-Lines Pattern */}
        {(data.showGuilloche !== false) && (
          <div 
            className="absolute inset-0 pointer-events-none z-0 opacity-[0.025]"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, #b91c1c 1px, transparent 1px), radial-gradient(circle at 0% 0%, #0f172a 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          />
        )}

        {/* =====================================================================
            2. OFFICIAL LETTERHEAD HEADER (Centered Crimson Title & Full Contact)
           ===================================================================== */}
        <div className="relative z-10 space-y-1">
          {/* Centered Main Title */}
          <div className="text-center">
            <h1 
              className="text-[25px] font-black tracking-wide uppercase leading-tight"
              style={{ color: '#c00000', fontFamily: 'Arial, Helvetica, sans-serif' }}
            >
              {data.shipperName || 'RED BIRD INTERNATIONAL'}
            </h1>
            <p className="text-[9.5px] font-bold text-slate-700 tracking-tight uppercase mt-0.5">
              {data.shipperAddress || 'PLOT-100, MAJAR CHOW ROAD, UTTARKHAN MAJHAR, UTTARKHAN, DHAKA-1230, BANGLADESH'}
            </p>
            <p className="text-[8.5px] text-slate-600 font-medium tracking-normal mt-0.5">
              Office: +880 9658 182256 &nbsp;|&nbsp; WhatsApp: +880 1966 635888 &nbsp;|&nbsp; Email: {data.shipperEmail || 'info@redbird-international.com'} &nbsp;|&nbsp; Web: {data.shipperWeb || 'www.redbird-international.com'}
            </p>
          </div>

          {/* Left Decorative Crimson Accent Pill */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="w-9 h-2 rounded-[2px]" style={{ backgroundColor: '#c00000' }} />
            <div className="text-[7.5px] font-mono text-slate-400 uppercase tracking-widest">
              OFFICIAL EXPORT TRADE DOCUMENT • RED BIRD INTERNATIONAL
            </div>
          </div>

          {/* Document Title Banner */}
          <div 
            className="w-full py-1 px-3 text-center rounded-[2px] border"
            style={{ 
              backgroundColor: '#fee2e2', 
              borderColor: '#fca5a5',
              color: '#881337'
            }}
          >
            <h2 className="text-[12.5px] font-black uppercase tracking-[0.25em]">
              {bannerTitle}
            </h2>
          </div>

          {/* =====================================================================
              3. METADATA GRID (3 Rows x 4 Columns with Warm Pastel Yellow Cells)
             ===================================================================== */}
          <div className="border border-slate-300 rounded-[2px] text-[8.5px] leading-tight overflow-hidden mt-1">
            {/* Row 1 */}
            <div className="grid grid-cols-12 divide-x divide-slate-300 border-b border-slate-300">
              <div className="col-span-3 px-2 py-1 flex items-center gap-1.5" style={{ backgroundColor: '#fef9c3' }}>
                <span className="font-bold text-slate-700 whitespace-nowrap">
                  {data.docType === 'packing-list' ? 'PL No:' : data.docType === 'pro-forma-invoice' ? 'PI No:' : 'Invoice No:'}
                </span>
                <span className="font-black font-mono text-slate-900 truncate">{data.docNumber}</span>
              </div>
              <div className="col-span-3 px-2 py-1 flex items-center gap-1.5" style={{ backgroundColor: '#fef9c3' }}>
                <span className="font-bold text-slate-700 whitespace-nowrap">
                  {data.docType === 'packing-list' ? 'Date:' : 'Invoice Date:'}
                </span>
                <span className="font-bold text-slate-900 truncate">{data.issueDate}</span>
              </div>
              <div className="col-span-3 px-2 py-1 flex items-center gap-1.5" style={{ backgroundColor: '#fef9c3' }}>
                <span className="font-bold text-slate-700 whitespace-nowrap">PI / PO Ref:</span>
                <span className="font-bold font-mono text-slate-900 truncate">{data.piPoRef || 'SC-RBI-KR-2026-09'}</span>
              </div>
              <div className="col-span-3 px-2 py-1 flex items-center justify-between" style={{ backgroundColor: '#fef9c3' }}>
                <span className="font-bold text-slate-700">Currency:</span>
                <span className="font-black px-2 py-0.5 rounded bg-white text-slate-900 border border-slate-300 text-[8px] font-mono">
                  {data.currency || 'USD'}
                </span>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-12 divide-x divide-slate-300 border-b border-slate-300">
              <div className="col-span-3 px-2 py-1 flex items-center gap-1.5" style={{ backgroundColor: '#fef9c3' }}>
                <span className="font-bold text-slate-700 whitespace-nowrap">Shipment Date:</span>
                <span className="font-bold text-slate-900 truncate">{data.shipmentDate || data.dueDate || data.issueDate}</span>
              </div>
              <div className="col-span-3 px-2 py-1 flex items-center gap-1.5" style={{ backgroundColor: '#fef9c3' }}>
                <span className="font-bold text-slate-700 whitespace-nowrap">Incoterms:</span>
                <span className="font-bold text-slate-900 truncate">{data.incoterms || 'FOB / CIF'}</span>
              </div>
              <div className="col-span-6 px-2 py-1 flex items-center gap-1.5" style={{ backgroundColor: '#fef9c3' }}>
                <span className="font-bold text-slate-700 whitespace-nowrap">Payment Terms:</span>
                <span className="font-bold text-slate-900 truncate">{data.paymentTerms || '100% Irrevocable L/C at Sight'}</span>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-12 divide-x divide-slate-300">
              <div className="col-span-4 px-2 py-1 flex items-center gap-1.5" style={{ backgroundColor: '#fef9c3' }}>
                <span className="font-bold text-slate-700 whitespace-nowrap">Port of Loading:</span>
                <span className="font-bold text-slate-900 truncate">{data.portOfLoading || 'Chittagong Port (BDCGP)'}</span>
              </div>
              <div className="col-span-4 px-2 py-1 flex items-center gap-1.5" style={{ backgroundColor: '#fef9c3' }}>
                <span className="font-bold text-slate-700 whitespace-nowrap">Port of Discharge:</span>
                <span className="font-bold text-slate-900 truncate">{data.portOfDischarge || 'Busan Port (KRPUS)'}</span>
              </div>
              <div className="col-span-4 px-2 py-1 flex items-center gap-1.5" style={{ backgroundColor: '#fef9c3' }}>
                <span className="font-bold text-slate-700 whitespace-nowrap">Final Destination:</span>
                <span className="font-bold text-slate-900 truncate">{data.finalDestination || 'Seoul Central Logistics Hub, Korea'}</span>
              </div>
            </div>
          </div>

          {/* =====================================================================
              4. TWO-COLUMN PARTIES BOX (EXPORTER / SHIPPER vs BUYER / CONSIGNEE)
             ===================================================================== */}
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            {/* Left: EXPORTER / SHIPPER */}
            <div className="border border-slate-300 rounded-[2px] overflow-hidden flex flex-col">
              <div 
                className="py-1 px-2 text-center text-white text-[9px] font-black uppercase tracking-wider"
                style={{ backgroundColor: '#0f172a' }}
              >
                EXPORTER / SHIPPER
              </div>
              <div className="p-2 space-y-0.5 text-[8.5px] leading-tight flex-1 bg-white">
                <p className="font-black text-slate-900 text-[9px]">{data.shipperName || 'RED BIRD INTERNATIONAL'}</p>
                <p className="text-slate-700 font-medium">PLOT-100, MAJAR CHOW ROAD, UTTARKHAN MAJHAR,</p>
                <p className="text-slate-700 font-medium">UTTARKHAN, DHAKA-1230, BANGLADESH</p>
                <p className="text-slate-600">Tel: +880 9658 182256 | WhatsApp: +880 1966 635888</p>
                <p className="text-slate-600">Email: {data.shipperEmail || 'info@redbird-international.com'}</p>
                <p className="text-slate-700 font-mono font-bold pt-0.5">
                  BIN / TIN: {data.shipperBinTin || '002910394-0102 / Trade Reg: TR-DHK-88912'}
                </p>
              </div>
            </div>

            {/* Right: BUYER / CONSIGNEE */}
            <div className="border border-slate-300 rounded-[2px] overflow-hidden flex flex-col">
              <div 
                className="py-1 px-2 text-center text-white text-[9px] font-black uppercase tracking-wider"
                style={{ backgroundColor: '#0f172a' }}
              >
                BUYER / CONSIGNEE
              </div>
              <div className="p-2 space-y-0.5 text-[8.5px] leading-tight flex-1 bg-white">
                <p className="font-black text-slate-900 text-[9px]">{data.buyerName || '[Buyer Company Name]'}</p>
                <p className="text-slate-700 font-medium">{data.buyerAddress || '[Buyer Address Line 1]'}</p>
                <p className="text-slate-700 font-medium">{data.buyerCityCountry || 'Seoul, Republic of Korea'}</p>
                <p className="text-slate-600">{data.buyerTel || '+82-2-729-1114'}</p>
                <p className="text-slate-600">{data.buyerEmail || 'sourcing@hanwha.co.kr'}</p>
                <p className="text-slate-700 font-mono font-bold pt-0.5">
                  Buyer Tax ID / VAT No: {data.buyerTaxId || 'KR-TAX-104-81-01294'}
                </p>
              </div>
            </div>
          </div>

          {/* =====================================================================
              5. LOGISTICS SUMMARY STRIP (Warm Yellow Tint)
             ===================================================================== */}
          <div 
            className="border border-slate-300 rounded-[2px] py-1 px-2.5 grid grid-cols-4 gap-2 text-[8px] leading-tight mt-1.5"
            style={{ backgroundColor: '#fef9c3' }}
          >
            <div>
              <span className="font-bold text-slate-700">No. of Packages: </span>
              <span className="font-black text-slate-900">{data.noOfPackages || `${totals.totalCartons || 260} Master Cartons`}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Gross Weight: </span>
              <span className="font-black text-slate-900">{data.grossWeight || `${totals.totalGross || 4130} KGS`}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Net Weight: </span>
              <span className="font-black text-slate-900">{data.netWeight || `${totals.totalNet || 3870} KGS`}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Marks & Nos: </span>
              <span className="font-bold text-slate-900 truncate">{data.marksAndNumbers || 'RED BIRD / SEOUL / C/NO. 1-260'}</span>
            </div>
          </div>

          {/* =====================================================================
              6. ITEMS TABLE (Deep Crimson Red Header & Yellow Tint Quantity Column)
             ===================================================================== */}
          <div className="border border-slate-300 rounded-[2px] overflow-hidden mt-1.5">
            {data.docType === 'packing-list' ? (
              /* Specific Packing List Columns */
              <table className="w-full border-collapse text-left text-[8.5px]">
                <thead>
                  <tr 
                    className="text-white font-black uppercase text-[8px] tracking-tight"
                    style={{ backgroundColor: '#991b1b' }}
                  >
                    <th className="py-1 px-1.5 border border-red-900 text-center w-7">#</th>
                    <th className="py-1 px-1.5 border border-red-900 text-center w-20">Carton Range</th>
                    <th className="py-1 px-2 border border-red-900">Description of Goods</th>
                    <th className="py-1 px-1.5 border border-red-900 text-center">Style / Color</th>
                    <th className="py-1 px-1.5 border border-red-900 text-center">Quantity</th>
                    <th className="py-1 px-1.5 border border-red-900 text-center">Cartons</th>
                    <th className="py-1 px-1.5 border border-red-900 text-right">Gross Wt (KG)</th>
                    <th className="py-1 px-1.5 border border-red-900 text-right">Net Wt (KG)</th>
                    <th className="py-1 px-1.5 border border-red-900 text-right">CBM</th>
                  </tr>
                </thead>
                <tbody>
                  {paddedItems.map((it, idx) => {
                    const hasContent = Boolean(it.itemDescription || it.quantity > 0);
                    return (
                      <tr 
                        key={it.id || idx} 
                        className={`h-[22px] ${hasContent ? 'hover:bg-slate-50' : 'bg-white'}`}
                      >
                        <td className="py-0.5 px-1.5 border border-slate-300 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-0.5 px-1.5 border border-slate-300 text-center font-mono text-slate-800">
                          {hasContent ? (it.cartonRange || `C/NO. ${idx * 40 + 1} - ${(idx + 1) * 40}`) : ''}
                        </td>
                        <td className="py-0.5 px-2 border border-slate-300 font-bold text-slate-900">{it.itemDescription || ''}</td>
                        <td className="py-0.5 px-1.5 border border-slate-300 text-center font-mono text-slate-700">
                          {hasContent ? `${it.styleNumber || 'RB-STY'} / ${it.colorName || 'Asst'}` : ''}
                        </td>
                        <td 
                          className="py-0.5 px-1.5 border border-slate-300 text-center font-black font-mono text-slate-900"
                          style={{ backgroundColor: hasContent ? '#fef9c3' : 'transparent' }}
                        >
                          {hasContent ? (it.quantity || 0).toLocaleString() : ''}
                        </td>
                        <td className="py-0.5 px-1.5 border border-slate-300 text-center font-mono font-bold text-slate-800">
                          {hasContent ? (it.cartons || Math.ceil((it.quantity || 1000) / 40)) : ''}
                        </td>
                        <td className="py-0.5 px-1.5 border border-slate-300 text-right font-mono font-bold text-slate-800">
                          {hasContent ? (it.grossWeightKg || Math.round((it.quantity || 1000) * 0.28)) : ''}
                        </td>
                        <td className="py-0.5 px-1.5 border border-slate-300 text-right font-mono text-slate-700">
                          {hasContent ? (it.netWeightKg || Math.round((it.quantity || 1000) * 0.25)) : ''}
                        </td>
                        <td className="py-0.5 px-1.5 border border-slate-300 text-right font-mono text-slate-700">
                          {hasContent ? (it.cbm || +((it.cartons || 25) * 0.08).toFixed(2)) : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              /* Commercial & Pro-Forma Invoice Columns */
              <table className="w-full border-collapse text-left text-[8.5px]">
                <thead>
                  <tr 
                    className="text-white font-black uppercase text-[8px] tracking-tight"
                    style={{ backgroundColor: '#991b1b' }}
                  >
                    <th className="py-1 px-1.5 border border-red-900 text-center w-7">#</th>
                    <th className="py-1 px-2 border border-red-900">Description of Goods</th>
                    <th className="py-1 px-1.5 border border-red-900 text-center">HS Code</th>
                    <th className="py-1 px-1.5 border border-red-900 text-center">Quantity</th>
                    <th className="py-1 px-1.5 border border-red-900 text-center">Unit</th>
                    <th className="py-1 px-2 border border-red-900 text-right">Unit Price ({currencySymbol})</th>
                    <th className="py-1 px-2 border border-red-900 text-right">Amount ({currencySymbol})</th>
                    <th className="py-1 px-1.5 border border-red-900 text-center">Origin</th>
                    <th className="py-1 px-1.5 border border-red-900 text-center">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {paddedItems.map((it, idx) => {
                    const hasContent = Boolean(it.itemDescription || it.quantity > 0);
                    return (
                      <tr 
                        key={it.id || idx} 
                        className={`h-[22px] ${hasContent ? 'hover:bg-slate-50' : 'bg-white'}`}
                      >
                        {/* # Number */}
                        <td className="py-0.5 px-1.5 border border-slate-300 text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>

                        {/* Description */}
                        <td className="py-0.5 px-2 border border-slate-300 font-bold text-slate-900">
                          {it.itemDescription || ''}
                          {it.styleNumber && (
                            <span className="text-[7.5px] font-mono font-normal text-slate-500 ml-1">
                              ({it.styleNumber})
                            </span>
                          )}
                        </td>

                        {/* HS Code */}
                        <td className="py-0.5 px-1.5 border border-slate-300 text-center font-mono text-slate-700">
                          {it.hsCode || (hasContent ? '6109.10.00' : '')}
                        </td>

                        {/* Quantity (Yellow Pastel Highlight) */}
                        <td 
                          className="py-0.5 px-1.5 border border-slate-300 text-center font-black font-mono text-slate-900"
                          style={{ backgroundColor: hasContent ? '#fef9c3' : 'transparent' }}
                        >
                          {hasContent ? (it.quantity || 0).toLocaleString() : ''}
                        </td>

                        {/* Unit */}
                        <td className="py-0.5 px-1.5 border border-slate-300 text-center font-medium text-slate-700">
                          {hasContent ? (it.unit || 'PCS') : ''}
                        </td>

                        {/* Unit Price */}
                        <td className="py-0.5 px-2 border border-slate-300 text-right font-mono font-bold text-slate-800">
                          {hasContent ? (it.unitPrice ? it.unitPrice.toFixed(2) : '0.00') : ''}
                        </td>

                        {/* Total Amount */}
                        <td className="py-0.5 px-2 border border-slate-300 text-right font-mono font-black text-slate-900">
                          {hasContent ? (it.totalAmount ? it.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00') : ''}
                        </td>

                        {/* Origin */}
                        <td className="py-0.5 px-1.5 border border-slate-300 text-center text-slate-700">
                          {hasContent ? (it.origin || 'Bangladesh') : ''}
                        </td>

                        {/* Remarks */}
                        <td className="py-0.5 px-1.5 border border-slate-300 text-center text-[7.5px] text-slate-600">
                          {hasContent ? (it.remarks || 'AQL 2.5') : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* =====================================================================
              7. TOTAL INVOICE VALUE STRIP & AMOUNT IN WORDS
             ===================================================================== */}
          {/* Total Bar */}
          <div className="flex border border-slate-300 rounded-[2px] overflow-hidden text-[9px] font-black mt-1">
            <div 
              className="flex-1 py-1.5 px-3 text-white uppercase tracking-wider text-right"
              style={{ backgroundColor: '#0f172a' }}
            >
              {data.docType === 'packing-list' ? 'TOTAL PACKING SPECIFICATION' : 'TOTAL INVOICE VALUE'}
            </div>
            <div 
              className="py-1.5 px-4 text-white text-center font-mono text-[10px]"
              style={{ backgroundColor: '#991b1b', minWidth: '140px' }}
            >
              {data.docType === 'packing-list' 
                ? `${totals.totalCartons || 260} CTNS / ${totals.totalQty.toLocaleString()} PCS`
                : `${currencySymbol} $${totals.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              }
            </div>
            <div 
              className="py-1.5 px-3 text-white text-center text-[9px]"
              style={{ backgroundColor: '#991b1b' }}
            >
              {currencySymbol}
            </div>
          </div>

          {/* Amount in Words (Soft Yellow Pastel Strip) */}
          <div 
            className="border border-slate-300 rounded-[2px] py-1 px-3 flex items-center gap-2 text-[8.5px] mt-1"
            style={{ backgroundColor: '#fef9c3' }}
          >
            <span className="font-black text-slate-900 uppercase whitespace-nowrap">
              {data.docType === 'packing-list' ? 'Cargo Measurement:' : `Amount in Words (${currencySymbol}):`}
            </span>
            <span className="italic font-bold text-slate-800 truncate">
              {data.docType === 'packing-list'
                ? `Total Volume: ${totals.totalCbm || '24.4'} CBM • 40ft High Cube Container FCL • Net Weight: ${(totals.totalNet || 3870).toLocaleString()} KGS • Gross Weight: ${(totals.totalGross || 4130).toLocaleString()} KGS`
                : (data.amountInWords || `[e.g. United States Dollars ${totals.totalAmount > 0 ? totals.totalAmount.toLocaleString() : 'Zero'} Only]`)
              }
            </span>
          </div>

          {/* =====================================================================
              8. LOWER TWO-COLUMN BOXES (BANK / PAYMENT DETAILS vs DECLARATION)
             ===================================================================== */}
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            {/* Left: BANK / PAYMENT DETAILS */}
            <div className="border border-slate-300 rounded-[2px] overflow-hidden flex flex-col">
              <div 
                className="py-1 px-2 text-center text-white text-[8.5px] font-black uppercase tracking-wider"
                style={{ backgroundColor: '#0f172a' }}
              >
                {data.docType === 'packing-list' ? 'CONTAINER & LOGISTICS DETAILS' : 'BANK / PAYMENT DETAILS'}
              </div>
              <div 
                className="p-2 space-y-0.5 text-[8px] leading-tight flex-1"
                style={{ backgroundColor: '#fef9c3' }}
              >
                {data.docType === 'packing-list' ? (
                  <>
                    <p><span className="font-bold text-slate-700">Container No: </span><span className="font-black font-mono text-slate-900">{data.containerNumber || 'TCLU-9842104 (40ft High Cube)'}</span></p>
                    <p><span className="font-bold text-slate-700">Seal Number: </span><span className="font-mono text-slate-900">{data.sealNumber || 'SL-BD-77291'}</span></p>
                    <p><span className="font-bold text-slate-700">Vessel & Voyage: </span><span className="font-bold text-slate-900">{data.vesselName || 'M/V HYUNDAI FORWARD (V.2604)'}</span></p>
                    <p><span className="font-bold text-slate-700">B/L Number: </span><span className="font-black font-mono text-red-700">{data.blNumber || `RBL-2026-CTG-${data.docNumber.slice(-4)}`}</span></p>
                    <p><span className="font-bold text-slate-700">Port of Loading: </span><span className="text-slate-800">{data.portOfLoading || 'Chittagong Port BDCGP'}</span></p>
                  </>
                ) : (
                  <>
                    <p><span className="font-bold text-slate-700">Bank Name: </span><span className="font-black text-slate-900">{data.bankName || 'STANDARD ISLAMI BANK PLC'}</span></p>
                    <p><span className="font-bold text-slate-700">Account Name: </span><span className="font-bold text-slate-900">{data.accountName || 'RED BIRD INTERNATIONAL'}</span></p>
                    <p><span className="font-bold text-slate-700">Account No: </span><span className="font-black font-mono text-slate-900">{data.accountNumber || '01533005430'}</span></p>
                    <p><span className="font-bold text-slate-700">SWIFT / BIC: </span><span className="font-black font-mono text-red-700">{data.swiftCode || 'SDBLBDDH115'}</span></p>
                    <p><span className="font-bold text-slate-700">Branch: </span><span className="text-slate-800">{data.branchName || 'Plot-9, Sector-3, Uttara Model Town, Dhaka-1230, Bangladesh'}</span></p>
                  </>
                )}
              </div>
            </div>

            {/* Right: DECLARATION */}
            <div className="border border-slate-300 rounded-[2px] overflow-hidden flex flex-col bg-white">
              <div 
                className="py-1 px-2 text-center text-white text-[8.5px] font-black uppercase tracking-wider"
                style={{ backgroundColor: '#0f172a' }}
              >
                DECLARATION
              </div>
              <div className="p-2 text-[7.8px] leading-relaxed text-slate-700 flex-1 flex flex-col justify-between">
                <p>
                  {data.declarationText || (
                    data.docType === 'packing-list'
                      ? 'We hereby certify that the contents of this export consignment are fully and accurately described above by the proper shipping name, weights, and dimensions, packed in export standard 7-ply master cartons with moisture barrier polybags.'
                      : 'We hereby certify that this invoice shows the actual price of the goods described, that no other invoice has been or will be issued, and that all particulars are true and correct. All values are expressed in United States Dollars (USD). Country of Origin: Bangladesh.'
                  )}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[7px] text-slate-500 font-mono">
                  <span>Customs Verification Seal</span>
                  <span>ISO 9001:2015 / AQL 2.5 Passed</span>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================================
              9. SIGNATURES & OFFICIAL STAMP
             ===================================================================== */}
          <div className="pt-4 grid grid-cols-2 gap-8 items-end relative mt-2">
            {/* Left: Authorized Signature & Stamp */}
            <div className="text-center relative">
              {/* Optional Seal Overlay */}
              {(data.showSeal !== false) && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-85 pointer-events-none">
                  {data.sealUrl ? (
                    <img src={data.sealUrl} alt="Seal" className="w-16 h-16 object-contain rotate-6" />
                  ) : (
                    <div className="w-16 h-16 rounded-full border-2 border-red-600 flex flex-col items-center justify-center text-[6px] font-black text-red-600 uppercase text-center rotate-6 bg-white/40">
                      <span>RED BIRD</span>
                      <span>INTERNATIONAL</span>
                      <span>OFFICIAL SEAL</span>
                      <span>DHAKA</span>
                    </div>
                  )}
                </div>
              )}
              <div className="h-6"></div>
              <div className="border-t border-slate-900 pt-1">
                <p className="text-[8.5px] font-black text-slate-900 uppercase">
                  Authorized Signature & Company Stamp
                </p>
              </div>
            </div>

            {/* Right: For RED BIRD INTERNATIONAL */}
            <div className="text-center relative">
              {/* Optional Signature Overlay */}
              {(data.showSignature !== false) && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none">
                  {data.signatureUrl ? (
                    <img src={data.signatureUrl} alt="Signature" className="h-8 object-contain" />
                  ) : (
                    <span 
                      className="text-base text-red-800 font-bold italic"
                      style={{ fontFamily: 'Georgia, serif' }}
                    >
                      {data.authorizedSignatoryName || 'Md. Sumon'}
                    </span>
                  )}
                </div>
              )}
              <div className="h-6"></div>
              <div className="border-t border-slate-900 pt-1">
                <p className="text-[8.5px] font-black text-slate-900 uppercase">
                  For {data.shipperName || 'RED BIRD INTERNATIONAL'}
                </p>
                <p className="text-[7.5px] text-slate-600 uppercase">
                  {data.authorizedSignatoryTitle || 'Operations Director & Authorized Signatory'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            10. SECURITY MICROPRINT FOOTER & VERIFICATION QR
           ===================================================================== */}
        <div className="relative z-10 pt-3 border-t border-slate-200 mt-2 flex items-center justify-between text-[7px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            {(data.showQrCode !== false) && (
              <div className="p-0.5 bg-white border border-slate-300 rounded shadow-xs">
                <QRCodeSVG value={qrVerifyUrl} size={28} />
              </div>
            )}
            <div>
              <p className="font-bold text-slate-500 uppercase tracking-tight">
                SECURITY DOCUMENT — This {bannerTitle} is issued by RED BIRD INTERNATIONAL. Unauthorized copy or alteration is strictly prohibited.
              </p>
              <p>
                All amounts are in United States Dollars ({data.currency || 'USD'}) &nbsp;|&nbsp; Country of Origin: Bangladesh &nbsp;|&nbsp; Page 1 of 1 &nbsp;|&nbsp; SHA-256 Verified
              </p>
            </div>
          </div>

          <div className="text-right font-bold text-slate-500 shrink-0">
            SEC-ID: {data.docNumber}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedExportLetterheadDocument;
