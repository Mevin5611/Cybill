export type { 
  ICustomer, IInvoice, IInvoiceItem, IPayment, ILedgerEntry, 
  IBusinessSettings, IDashboardStats, CustomerType, PricingMode, 
  InvoiceStatus, PaymentMethod 
} from '../../../shared/types/index.js';

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

export type FeatureKey = 'bank_details_on_invoice' | 'upi_qr_on_invoice';

export interface IFeatureStatus {
  key: FeatureKey;
  label: string;
  description: string;
  defaultEnabled: boolean;
  enabled: boolean;
}
