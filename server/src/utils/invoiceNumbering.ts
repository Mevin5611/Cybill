import { DocumentSequence } from '../models/DocumentSequence.js';

/**
 * Generate a unique invoice number
 * Thread-safe using MongoDB atomic operations
 */
export async function generateInvoiceNumber(prefix: string = 'INV'): Promise<string> {
  const sequence = await DocumentSequence.findOneAndUpdate(
    { name: 'invoice_number' },
    {
      $inc: { nextNumber: 1 },
      $set: { prefix, lastUsedDate: new Date() }
    },
    { upsert: true, new: true }
  );

  const number = String(sequence.nextNumber).padStart(5, '0');
  return `${prefix}-${number}`;
}

export async function resetInvoiceNumbering(date: Date = new Date()): Promise<void> {
  const lastUsedDate = new Date(date);
  lastUsedDate.setHours(0, 0, 0, 0);

  const sequence = await DocumentSequence.findOne({ name: 'invoice_number' });

  if (!sequence) {
    await DocumentSequence.create({ name: 'invoice_number', nextNumber: 1 });
    return;
  }

  const lastDate = new Date(sequence.lastUsedDate);
  lastDate.setHours(0, 0, 0, 0);

  // Reset if different day
  if (lastDate.getTime() !== lastUsedDate.getTime()) {
    await DocumentSequence.updateOne(
      { name: 'invoice_number' },
      { nextNumber: 1, lastUsedDate: new Date() }
    );
  }
}