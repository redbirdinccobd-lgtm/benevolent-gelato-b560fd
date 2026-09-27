import { authenticatedFetch } from './authenticatedFetch';
export interface AiDraftRequest {
  orderData: any;
  documentType?: 'both' | 'commercial-invoice' | 'packing-list';
  customInstructions?: string;
}

export interface AiDraftResponse {
  success: boolean;
  isAiGenerated: boolean;
  model?: string;
  source?: string;
  fallbackNotice?: string;
  commercialInvoice: {
    docNumber: string;
    issueDate: string;
    dueDate: string;
    expiryOrShippedDate: string;
    blNumber: string;
    bookingRef: string;
    expNumber: string;
    contractNumber: string;
    lcNumber: string;
    lcBank: string;
    paymentTerms: string;
    incoterms: string;
    currency: string;
    exchangeRate: number;
    buyerName: string;
    buyerAttention?: string;
    buyerAddress: string;
    buyerCountry: string;
    buyerContact?: string;
    buyerEmail?: string;
    buyerTaxId?: string;
    notifyParty?: string;
    transportMode: 'Sea Freight' | 'Air Cargo';
    vesselName?: string;
    voyageOrFlightNo?: string;
    containerNumber?: string;
    sealNumber?: string;
    portOfLoading: string;
    portOfDischarge: string;
    finalDestination: string;
    placeOfDelivery?: string;
    freightTerms?: 'FREIGHT PREPAID' | 'FREIGHT COLLECT';
    marksAndNumbers: string;
    packageKind: string;
    generalDescription: string;
    declarationText: string;
    specialNotes: string;
  };
  items: Array<{
    styleNumber: string;
    itemDescription: string;
    colorName: string;
    hsCode: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    cartons: number;
    grossWeightKg: number;
    netWeightKg: number;
    cbm: number;
    sizeRatio?: string;
  }>;
  packingList: {
    totalCartons: number;
    totalGrossWeightKg: number;
    totalNetWeightKg: number;
    totalCbm: number;
    cartonNumberRange: string;
    packageDimensions?: string;
    shippingMarksSummary?: string;
    tareWeightSummary?: string;
  };
  aiComplianceInsights: {
    hsCodeRationale: string;
    customsDutyCategory?: string;
    packagingSafetyAdvice: string;
    incotermsRiskTransfer: string;
    regulatoryCheck?: string;
  };
}

export async function requestAiDraftExportDocuments(
  orderData: any,
  documentType: 'both' | 'commercial-invoice' | 'packing-list' = 'both',
  customInstructions: string = ''
): Promise<AiDraftResponse> {
  const response = await authenticatedFetch('/api/ai/draft-documents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      orderData,
      documentType,
      customInstructions,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI drafting failed: ${response.status} - ${errorText}`);
  }

  const data: AiDraftResponse = await response.json();
  return data;
}
