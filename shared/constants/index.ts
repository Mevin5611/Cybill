export const GST_RATES = [0, 5, 12, 18, 28];

export const PAYMENT_METHODS: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  other: 'Other'
};

export const INVOICE_STATUS: Record<string, string> = {
  draft: 'Draft',
  finalized: 'Finalized',
  cancelled: 'Cancelled'
};

export const CUSTOMER_TYPES: Record<string, string> = {
  B2C: 'B2C (Retail)',
  B2B: 'B2B (Wholesale)'
};

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',

  // Settings
  SETTINGS: '/settings',

  // Customers
  CUSTOMERS: '/customers',
  CUSTOMER_DETAIL: '/customers/:id',
  CUSTOMER_LEDGER: '/customers/:id/ledger',

  // Invoices
  INVOICES: '/invoices',
  INVOICE_DRAFT: '/invoices/drafts',
  INVOICE_DETAIL: '/invoices/:id',
  INVOICE_FINALIZE: '/invoices/:id/finalize',
  INVOICE_CANCEL: '/invoices/:id/cancel',
  INVOICE_PDF: '/invoices/:id/pdf',

  // Payments
  PAYMENTS: '/payments',
  PAYMENT_DETAIL: '/payments/:id',

  // Reports
  DASHBOARD: '/reports/dashboard',
  SALES_REPORT: '/reports/sales',
  COLLECTIONS_REPORT: '/reports/collections',
  OUTSTANDING_REPORT: '/reports/outstanding',
  GST_REPORT: '/reports/gst'
};

export const DECIMAL_PLACES = 2;
export const ROUNDING_METHOD = 'round'; // 'round' | 'floor' | 'ceil'