import mongoose, { Schema, Document } from 'mongoose';
import type { ICustomer } from '../../../shared/types/index.js';

interface ICustomerDoc extends ICustomer, Document {}

const customerSchema = new Schema<ICustomerDoc>(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['B2C', 'B2B'],
      default: 'B2C'
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    billingAddress: {
      type: String,
      trim: true
    },
    deliveryAddress: {
      type: String,
      trim: true
    },
    gstin: {
      type: String,
      trim: true,
      sparse: true
    },
    state: {
      type: String,
      trim: true
    },
    openingBalance: {
      type: Number,
      default: 0,
      get: (val: number) => Math.round(val * 100) / 100
    },
    notes: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

customerSchema.index({ phone: 1 });
customerSchema.index({ name: 'text' });
customerSchema.index({ gstin: 1 }, { sparse: true });

export const Customer = mongoose.model<ICustomerDoc>('Customer', customerSchema);