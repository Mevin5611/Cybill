// Customer types
export type CustomerType = 'B2C' | 'B2B';

export interface ICustomer {
  _id?: string;
  name: string;
  type: CustomerType;
  phone: string;
  email?: string;
  billingAddress?: string;
  deliveryAddress?: string;
  gstin?: string;
  state?: string;
  openingBalance: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Invoice types
export type PricingMode = 'exclusive' | 'inclusive';
export type InvoiceStatus = 'draft' | 'finalized' | 'cancelled';
export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque' | 'other';

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  gstRate: number;
  pricingMode: PricingMode;
  taxableAmount: number;
  gstAmount: number;
  lineTotal: number;
}

export interface ITaxBreakdown {
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface IInvoice {
  _id?: string;
  invoiceNumber: string;
  invoiceDate: Date;
  customerType: 'walk_in' | 'registered';
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerGstin?: string;
  customerState?: string;
  billingAddress?: string;
  items: IInvoiceItem[];
  subtotal: number;
  discountAmount: number;
  otherCharges: number;
  taxableValue: number;
  taxBreakdown: ITaxBreakdown;
  roundingAdjustment: number;
  finalTotal: number;
  paidAmount: number;
  outstandingAmount: number;
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  cancelledReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Payment types
export interface IPayment {
  _id?: string;
  paymentReference: string;
  customerId?: string;
  customerName: string;
  date: Date;
  amount: number;
  method: PaymentMethod;
  notes?: string;
  createdAt?: Date;
}

export interface IPaymentAllocation {
  _id?: string;
  paymentId: string;
  invoiceId: string;
  allocatedAmount: number;
  createdAt?: Date;
}

// Customer Ledger Entry
export interface ILedgerEntry {
  date: Date;
  invoiceNumber?: string;
  invoiceId?: string;
  paymentReference?: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

// Business Settings
export interface IBusinessSettings {
  _id?: string;
  businessName: string;
  businessLogo?: string;
  businessAddress: string;
  businessPhone: string;
  gstin: string;
  state: string;
  invoicePrefix: string;
  invoiceStartNumber: number;
  invoiceTerms?: string;
  returnTerms?: string;
  gstRates: number[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Dashboard Statistics
export interface IDashboardStats {
  todayInvoiceTotal: number;
  todayAmountCollected: number;
  monthlySales: number;
  monthlyCollections: number;
  totalOutstandingReceivables: number;
  billsToday: number;
  recentInvoices: Partial<IInvoice>[];
  recentPayments: Partial<IPayment>[];
}

// Report types
export interface ISalesReport {
  date: Date;
  invoiceNumber: string;
  customerName: string;
  total: number;
  taxAmount: number;
  status: InvoiceStatus;
}

export interface IGstReport {
  date: Date;
  invoiceNumber: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export interface IOutstandingReport {
  customerName: string;
  invoiceNumber: string;
  invoiceDate: Date;
  invoiceTotal: number;
  paidAmount: number;
  outstanding: number;
  daysOverdue: number;
}

export interface IInvoiceItem {
  description: string;

  hsnCode?: string;
  unit?: string;

  quantity: number;
  unitPrice: number;

  discount: number;

  gstRate: number;

  pricingMode: "exclusive" | "inclusive";

  taxableAmount: number;

  cgstRate: number;
  sgstRate: number;
  igstRate: number;

  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;

  gstAmount: number;

  lineTotal: number;
}

export interface ITaxBreakdown {
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface IInvoice {
  _id?: string;

  invoiceNumber: string;
  invoiceDate: Date;

  customerType: "walk_in" | "registered";
  customerId?: string;

  customerName: string;
  customerPhone?: string;
  customerGstin?: string;
  customerState?: string;
  billingAddress?: string;
  vehicleNumber?: string;

  items: IInvoiceItem[];

  subtotal: number;
  discountAmount: number;
  otherCharges: number;

  taxableValue: number;

  taxBreakdown: ITaxBreakdown;

  roundingAdjustment: number;
  finalTotal: number;

  paidAmount: number;
  outstandingAmount: number;

  status: "draft" | "finalized" | "cancelled";

  paymentMethod?: string;
  notes?: string;
  cancelledReason?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  upiId: string;
}

export interface IPaymentDisplaySettings {
  showBankDetails: boolean;
  showPaymentQr: boolean;
}

/** Every feature the admin can toggle. Add new keys here. */
export type FeatureKey =
  | 'bank_details_on_invoice'
  | 'upi_qr_on_invoice';

export interface IFeatureDefinition {
  key: FeatureKey;
  label: string;
  description: string;
  defaultEnabled: boolean;
}

export interface IFeatureStatus extends IFeatureDefinition {
  enabled: boolean;
}
