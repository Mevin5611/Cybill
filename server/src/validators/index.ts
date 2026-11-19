import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* Customers                                                           */
/* ------------------------------------------------------------------ */

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').trim(),
  type: z.enum(['B2C', 'B2B']),
  phone: z.string().min(10, 'Valid phone number required').trim(),
  billingAddress: z.string().optional(),
  vehicleNumber: z.string().trim().max(20).optional(),
  deliveryAddress: z.string().optional(),
  gstin: z.string().optional(),
  state: z.string().optional(),
  openingBalance: z.number().default(0),
  notes: z.string().optional()
});

/* ------------------------------------------------------------------ */
/* Invoices                                                            */
/* ------------------------------------------------------------------ */

export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  quantity: z.number().min(0.01, 'Quantity must be at least 0.01'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  discount: z.number().min(0, 'Discount must be non-negative').default(0),
  gstRate: z.union([
    z.literal(0),
    z.literal(5),
    z.literal(12),
    z.literal(18),
    z.literal(28),
    z.enum(['0', '5', '12', '18', '28']).transform(Number)
  ]),
  pricingMode: z.enum(['exclusive', 'inclusive']).default('exclusive')
});

export const createInvoiceSchema = z.object({
  customerType: z.enum(['walk_in', 'registered']),
  customerId: z.string().optional(),
  customerName: z.string().min(1, 'Customer name required'),
  customerPhone: z.string().optional(),
  customerGstin: z.string().optional(),
  customerState: z.string().optional(),
  billingAddress: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item required'),
  discountAmount: z.number().min(0).default(0),
  otherCharges: z.number().min(0).default(0),
  paymentMethod: z.string().optional(),
  notes: z.string().optional()
});

/* ------------------------------------------------------------------ */
/* Payments                                                            */
/* ------------------------------------------------------------------ */

export const recordPaymentSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(1, 'Customer name required'),
  amount: z.number().min(0.01, 'Amount must be greater than zero'),
  method: z.enum(['cash', 'upi', 'card', 'bank_transfer', 'cheque', 'other']),
  allocations: z
    .array(
      z.object({
        invoiceId: z.string(),
        amount: z.number().min(0.01)
      })
    )
    .optional(),
  notes: z.string().optional()
});

/* ------------------------------------------------------------------ */
/* Bank details and payment display                                    */
/* ------------------------------------------------------------------ */

const optionalPattern = (pattern: RegExp, message: string) =>
  z
    .string()
    .trim()
    .default('')
    .refine((value) => value === '' || pattern.test(value), { message });

export const bankDetailsSchema = z.object({
  bankName: z.string().trim().max(100).default(''),
  accountName: z.string().trim().max(100).default(''),
  accountNumber: optionalPattern(
    /^\d{6,18}$/,
    'Account number must be 6–18 digits'
  ),
  ifsc: optionalPattern(/^[A-Z]{4}0[A-Z0-9]{6}$/i, 'Invalid IFSC code'),
  branch: z.string().trim().max(150).default(''),
  upiId: optionalPattern(
    /^[\w.\-]{2,256}@[A-Za-z]{2,64}$/,
    'Invalid UPI ID'
  )
});

export const paymentSettingsSchema = z.object({
  showBankDetails: z.boolean(),
  showPaymentQr: z.boolean()
});

/* ------------------------------------------------------------------ */
/* Business settings                                                   */
/* ------------------------------------------------------------------ */

export const businessSettingsSchema = z.object({
  businessName: z.string().trim().min(1, 'Business name is required'),
  businessLogo: z.string().optional(),
  businessAddress: z.string().trim().min(1, 'Address is required'),
  businessPhone: z.string().trim().min(1, 'Phone is required'),
  gstin: z.string().trim().min(1, 'GSTIN is required'),
  state: z.string().trim().min(2, 'State is required'),
  invoicePrefix: z.string().trim().optional(),
  invoiceStartNumber: z.coerce.number().int().min(1).optional(),
  invoiceTerms: z.string().optional(),
  returnTerms: z.string().optional(),
  gstRates: z.array(z.number()).optional(),

  bankDetails: bankDetailsSchema.optional(),
  payment: paymentSettingsSchema.optional()
});

export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;