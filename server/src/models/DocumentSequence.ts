import mongoose, { Schema, Document } from 'mongoose';

interface IDocumentSequenceDoc extends Document {
  name: string;
  nextNumber: number;
  prefix: string;
  lastUsedDate: Date;
}

const documentSequenceSchema = new Schema<IDocumentSequenceDoc>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    nextNumber: {
      type: Number,
      required: true,
      default: 1
    },
    prefix: {
      type: String,
      default: 'INV'
    },
    lastUsedDate: {
      type: Date,
      default: () => new Date()
    }
  },
  { timestamps: true }
);

export const DocumentSequence = mongoose.model<IDocumentSequenceDoc>(
  'DocumentSequence',
  documentSequenceSchema
);