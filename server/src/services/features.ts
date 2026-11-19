import { FeatureFlag } from '../models/FeatureFlag.js';
import { FEATURE_DEFINITIONS, FEATURE_KEYS } from '../config/features.js';
import type {
  FeatureKey,
  IBusinessSettings,
  IFeatureStatus
} from '../../../shared/types/index.js';

export type FeatureMap = Record<FeatureKey, boolean>;

/** Defaults from the registry, overridden by anything stored in the DB. */
export async function getFeatureMap(): Promise<FeatureMap> {
  const map = Object.fromEntries(
    FEATURE_DEFINITIONS.map((d) => [d.key, d.defaultEnabled])
  ) as FeatureMap;

  const stored = await FeatureFlag.find({
    key: { $in: FEATURE_KEYS }
  }).lean();

  for (const flag of stored) {
    map[flag.key as FeatureKey] = flag.enabled;
  }

  return map;
}

export async function listFeatures(): Promise<IFeatureStatus[]> {
  const map = await getFeatureMap();
  return FEATURE_DEFINITIONS.map((d) => ({
    ...d,
    enabled: map[d.key]
  }));
}

export async function setFeatureEnabled(
  key: FeatureKey,
  enabled: boolean,
  updatedBy?: string
): Promise<void> {
  await FeatureFlag.updateOne(
    { key },
    { $set: { enabled, updatedBy } },
    { upsert: true }
  );
}

/**
 * Combines the admin feature switches with the business owner's preferences
 * and the presence of data. Used by the invoice PDF generator.
 */
export async function getInvoicePaymentOptions(
  settings: IBusinessSettings
): Promise<{ showBankDetails: boolean; showPaymentQr: boolean }> {
  const features = await getFeatureMap();

  const bank = settings.bankDetails;
  const prefs = settings.payment;

  const hasBankDetails = Object.values(bank ?? {}).some(
    (value) => Boolean(value)
  );

  const showBankDetails =
    features.bank_details_on_invoice &&
    (prefs?.showBankDetails ?? true) &&
    hasBankDetails;

  const showPaymentQr =
    showBankDetails &&
    features.upi_qr_on_invoice &&
    (prefs?.showPaymentQr ?? true) &&
    Boolean(bank?.upiId);

  return { showBankDetails, showPaymentQr };
}