import type {
  FeatureKey,
  IFeatureDefinition
} from '../../../shared/types/index.js';

export const FEATURE_DEFINITIONS: IFeatureDefinition[] = [
  {
    key: 'bank_details_on_invoice',
    label: 'Bank details on invoice',
    description: 'Prints the bank account block on tax invoices.',
    defaultEnabled: true
  },
  {
    key: 'upi_qr_on_invoice',
    label: 'UPI QR code on invoice',
    description: 'Prints a scannable UPI payment QR inside the bank block.',
    defaultEnabled: true
  }
];

export const FEATURE_KEYS = FEATURE_DEFINITIONS.map(
  (f) => f.key
) as [FeatureKey, ...FeatureKey[]];