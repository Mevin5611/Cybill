import mongoose, { Schema } from 'mongoose';

const featureFlagSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    enabled: { type: Boolean, required: true, default: false },
    updatedBy: String
  },
  { timestamps: true }
);

export const FeatureFlag = mongoose.model('FeatureFlag', featureFlagSchema);