import mongoose, { Schema, Document } from "mongoose";
import type {
  IBusinessSettings,
  IBankDetails,
  IPaymentDisplaySettings,
} from "../../../shared/types/index.js";

interface IBusinessSettingsDoc extends IBusinessSettings, Document {}

const bankDetailsSchema = new Schema<IBankDetails>(
  {
    bankName: { type: String, trim: true, default: "" },
    accountName: { type: String, trim: true, default: "" },
    accountNumber: { type: String, trim: true, default: "" },
    ifsc: { type: String, trim: true, uppercase: true, default: "" },
    branch: { type: String, trim: true, default: "" },
    upiId: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const paymentSettingsSchema = new Schema<IPaymentDisplaySettings>(
  {
    showBankDetails: { type: Boolean, default: true },
    showPaymentQr: { type: Boolean, default: true },
  },
  { _id: false },
);

const businessSettingsSchema = new Schema<IBusinessSettingsDoc>(
  {
    businessName: {
      type: String,
      required: true,
      default: "FurniBill Store",
    },
    businessLogo: String,
    businessAddress: {
      type: String,
      required: true,
    },
    businessPhone: {
      type: String,
      required: true,
    },
    gstin: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
      enum: [
        "AN",
        "AP",
        "AR",
        "AS",
        "BR",
        "CG",
        "CH",
        "CT",
        "DD",
        "DL",
        "DN",
        "GA",
        "GJ",
        "HR",
        "HP",
        "JK",
        "JH",
        "KA",
        "KL",
        "LD",
        "MP",
        "MH",
        "MN",
        "ML",
        "MZ",
        "NL",
        "OD",
        "OL",
        "PB",
        "PY",
        "RJ",
        "SK",
        "TG",
        "TR",
        "TN",
        "TS",
        "UP",
        "UK",
        "UT",
        "WB",
      ],
    },
    invoicePrefix: {
      type: String,
      default: "INV",
    },
    invoiceStartNumber: {
      type: Number,
      default: 1,
    },
    invoiceTerms: String,
    returnTerms: String,
    gstRates: {
      type: [Number],
      default: [0, 5, 12, 18, 28],
    },

    bankDetails: {
      type: bankDetailsSchema,
      default: () => ({}),
    },
    payment: {
      type: paymentSettingsSchema,
      default: () => ({}),
    },
  },

  { timestamps: true },
);

export const BusinessSettings = mongoose.model<IBusinessSettingsDoc>(
  "BusinessSettings",
  businessSettingsSchema,
);
