import mongoose, { Schema, Document } from 'mongoose';
import type { IPayment, IPaymentAllocation } from '../../../shared/types/index.js';

interface IPaymentDoc extends IPayment, Document {}
interface IPaymentAllocationDoc extends IPaymentAllocation, Document {}

const paymentSchema = new Schema<IPaymentDoc>(
  {
    paymentReference: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      sparse: true
    },
    customerName: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true,
      default: () => new Date()
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    method: {
      type: String,
      enum: ['cash', 'upi', 'card', 'bank_transfer', 'cheque', 'other'],
      required: true
    },
    notes: String
  },
  { timestamps: true }
);

paymentSchema.index({ customerId: 1 });
paymentSchema.index({ date: 1 });

const paymentAllocationSchema = new Schema<IPaymentAllocationDoc>(
  {
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true
    },
    allocatedAmount: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { timestamps: true }
);

paymentAllocationSchema.index({ paymentId: 1 });
paymentAllocationSchema.index({ invoiceId: 1 });
paymentAllocationSchema.index({ paymentId: 1, invoiceId: 1 }, { unique: true });

export const Payment = mongoose.model<IPaymentDoc>('Payment', paymentSchema);
export const PaymentAllocation = mongoose.model<IPaymentAllocationDoc>(
  'PaymentAllocation',
  paymentAllocationSchema
);