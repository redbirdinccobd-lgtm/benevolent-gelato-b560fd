
export interface PackingListItem {
  id: string;
  itemDescription: string;
  itemType: string; // T-shirt, Pant, Boxer, Ladies Sweater, etc.
  brandName?: string; // Brand Name (Hanwha, Tommy, CK, Zara, etc.)
  packagingType?: 'single' | '2pc' | '3pc'; // For Boxers or sets
  styleNumber: string;
  colorName: string;
  sizes: {
    XS?: number;
    S: number;
    M: number;
    L: number;
    XL: number;
    '2XL': number;
  };
  totalQty: number;
  unitPrice: number;
  totalAmount: number;
  totalCartons?: number;
  cartonNumber?: string;
}

export interface ShipmentNote {
  id: string;
  author: string;
  authorEmail?: string;
  content: string;
  category: 'Status Update' | 'Customs & Clearance' | 'Freight & Logistics' | 'Quality Inspection' | 'Financial & Remittance' | 'General';
  statusTag: 'Info' | 'In Progress' | 'Alert' | 'Milestone' | 'Cleared';
  isInternal: boolean;
  createdAt: string;
}

export interface ShipmentProfile {
  id: string;
  invoiceNumber: string;
  buyerName: string;
  buyerAddress: string;
  buyerPhone?: string;
  buyerEmail?: string;
  supplierName: string;
  supplierDetails: string;
  date: string;
  
  // Contract Details
  salesContractNumber?: string;
  salesContractDate?: string;
  expNumber?: string;
  expIssueDate?: string;
  hsCode?: string;
  
  // Logistics
  portOfLoading: string;
  portOfDestination: string;
  shippingTerms: string;
  portOfDischarge: string;
  transportMode: 'Air' | 'Sea';
  totalCartons: number;
  totalGrossWeight: number;
  totalNetWeight: number;
  totalCBM: number;
  estimatedArrivalDate?: string;
  freightCostPerKg?: number;
  
  // Financial
  priceType: 'Unit Price' | 'CIF' | 'FOB';
  brandName?: string;
  currency: 'USD' | 'BDT';
  buyerOfferPrice: number;
  supplierQuotePrice: number;
  sellingPrice: number;
  shipmentCosts: number;
  advancePercentage: number;
  advancePaymentAmount?: number;
  paymentCondition?: string;
  paymentMethod?: 'TT' | 'LC' | 'Others';
  totalAmount: number;
  totalQuantity: number;
  estimatedProfit: number;
  
  // Items
  items: PackingListItem[];
  
  // QR & Status
  qrCodeData: string; // URL for verification
  status: 'In Planning' | 'Shipped' | 'Delivered';
  trackingStatus?: string;
  
  // Related Documents (URLs)
  supplierAgreementUrl?: string;
  workScheduleUrl?: string;

  // Shipment Notes & Operational Logs
  notes?: ShipmentNote[];
}

export interface VisaInvitation {
  id: string;
  buyerName: string;
  passportNumber: string;
  nationality: string;
  arrivalDate: string;
  airport: 'Hazrat Shahjalal International Airport, Dhaka';
  content: string; // Template text
}

export interface AccommodationStatement {
  id: string;
  buyerName: string;
  hotelName: string;
  stayFrom: string;
  stayTo: string;
  content: string;
}

export interface OrderPlan {
  id: string;
  orderNumber: string;
  startDate: string;
  paymentDate: string;
  shipmentDate: string;
  supplierId: string;
  buyerId: string;
  status: 'Draft' | 'Active' | 'Completed';
}

export interface Review {
  id: string;
  productId: number;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  upvotes?: number;
  downvotes?: number;
}

export interface PricingRule {
  minQty: number;
  discountPercentage: number;
}

export interface VariantAdjustment {
  [variant: string]: number; // Price adjustment (positive or negative)
}

export interface Product {
  id: number;
  name: string;
  brand: string;
  brandLogo?: string;
  category: string;
  garmentType: string;
  sourcingType?: 'Custom OEM Manufacturing' | 'Verified Surplus Sourcing';
  fabricSpec?: string;
  targetMarket?: string;
  moq?: string;
  colors: string[];
  sizes: string[];
  images: string[];
  price?: number; // Base price
  pricingRules?: {
    bulkDiscounts?: PricingRule[];
    variantAdjustments?: VariantAdjustment;
  };
  reviews?: Review[];
}

export interface NavItem {
  label: string;
  href: string;
}

export interface Service {
  title: string;
  description: string;
  icon: string;
}

export interface InvoiceItem {
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  date: string;
  clientName: string;
  clientAddress: string;
  incoterms?: string;
  portOfDischarge?: string;
  carrier?: string;
  totalCartons?: number;
  totalNetWeight?: number;
  totalGrossWeight?: number;
  totalCBM?: number;
  advancePaymentPercent?: number;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  grandTotal: number;
  status?: 'Shipped' | 'In Transit' | 'Delivered' | 'On Hold';
}

export interface Employee {
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  joiningDate: string;
  phone: string;
  email: string;
  photo: string | null;
  bloodGroup: string;
  nidPassport?: string;
  address?: string;
  emergencyContact?: string;
  salary?: number;
  qrCode?: string;
  createdAt: string;
}

export interface DetailedOrder {
  id: string; // Internal Order ID
  controlNumber: string; // RB-INV-...
  buyerName: string;
  factoryName: string;
  supplierName: string;
  
  // Timelines
  startProductionDate: string;
  paymentDate: string;
  shipmentDate: string;
  handoverDate: string;
  
  // Financials
  buyingPricePerUnit: number;
  sellingPricePerUnit: number;
  quantity: number;
  otherExpenses: number; // Logistics, etc.
  currency: 'USD' | 'BDT';
  exchangeRate: number; // For calculation
  
  status: 'In Production' | 'Payment Pending' | 'Shipped' | 'Closed';
  createdAt: string;
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  branch: string;
  swiftCode: string;
  address: string;
}

export interface SystemSettings {
  id?: string;
  companyName: string;
  address: string;
  contact: string;
  website: string;
  email: string;
  socialMedia: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  logo: string | null;
  signature: string | null;
  seal: string | null;
  bankDetails: BankDetails;
}

export interface Expense {
  id?: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  paidBy: string;
}

export interface Budget {
  id?: string;
  month: string;
  year: number;
  limit: number;
  category: string;
}

export interface SalesContract {
  id: string;
  date: string;
  buyerName: string;
  buyerAddress: string;
  items: InvoiceItem[];
  totalAmount: number;
  paymentTerms: string;
  deliveryTerms: string;
  shippingTerms: string;
  portOfDischarge: string;
  validUntil: string;
  status: string;
  invoiceId: string;
}

export interface Agreement {
  id: string;
  date: string;
  clientName: string;
  factoryName: string;
  supplierName: string;
  validUntil: string;
  terms: string;
  paymentTerms: string;
  governingLaw: string;
  createdAt: string;
}

export interface PortalUser {
  id: string;
  userId: string;
  password?: string;
  name: string;
  company: string;
  email?: string;
  status: 'Active' | 'Suspended';
  createdAt: string;
}

export interface BuyerProfile {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  destinationPort: string;
  taxId?: string;
  defaultPaymentTerms?: string;
  defaultPaymentMethod?: 'TT' | 'LC' | 'Others';
  notes?: string;
  totalOrdersCount?: number;
  totalVolumePcs?: number;
  status?: 'Active' | 'VIP' | 'Prospect';
  createdAt?: string;
}
