import mongoose, { Schema, Document } from "mongoose";

import type {
  IInvoice,
  IInvoiceItem,
  ITaxBreakdown,
} from "../../../shared/types/index.js";

export interface IInvoiceDoc
  extends Omit<IInvoice, "_id" | "customerId">, Document {
  customerId?: mongoose.Types.ObjectId;
}

const invoiceItemSchema = new Schema<IInvoiceItem>(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },

    hsnCode: {
      type: String,
      trim: true,
    },

    unit: {
      type: String,
      default: "PCS",
    },

    quantity: {
      type: Number,
      required: true,
      min: 0.01,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    gstRate: {
      type: Number,
      required: true,
      enum: [0, 5, 12, 18, 28],
    },

    pricingMode: {
      type: String,
      enum: ["exclusive", "inclusive"],
      default: "exclusive",
    },

    taxableAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    cgstRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    sgstRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    igstRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    cgstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    sgstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    igstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    gstAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const taxBreakdownSchema = new Schema<ITaxBreakdown>(
  {
    cgst: {
      type: Number,
      default: 0,
      min: 0,
    },

    sgst: {
      type: Number,
      default: 0,
      min: 0,
    },

    igst: {
      type: Number,
      default: 0,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const invoiceSchema = new Schema<IInvoiceDoc>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    customerType: {
      type: String,
      enum: ["walk_in", "registered"],
      default: "walk_in",
    },

    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    customerPhone: String,

    customerGstin: {
      type: String,
      uppercase: true,
      trim: true,
    },

    customerState: String,

    billingAddress: String,
    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },

    items: {
      type: [invoiceItemSchema],
      required: true,
      validate: {
        validator: (items: IInvoiceItem[]) => items.length > 0,
        message: "At least one item is required",
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    otherCharges: {
      type: Number,
      default: 0,
      min: 0,
    },

    taxableValue: {
      type: Number,
      required: true,
      min: 0,
    },

    taxBreakdown: {
      type: taxBreakdownSchema,
      required: true,
    },

    roundingAdjustment: {
      type: Number,
      default: 0,
    },

    finalTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    outstandingAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["draft", "finalized", "cancelled"],
      default: "draft",
    },

    paymentMethod: String,

    notes: String,

    cancelledReason: String,
  },
  {
    timestamps: true,
  },
);

invoiceSchema.index({
  customerId: 1,
});

invoiceSchema.index({
  invoiceDate: -1,
});

invoiceSchema.index({
  status: 1,
});

export const Invoice = mongoose.model<IInvoiceDoc>("Invoice", invoiceSchema);
