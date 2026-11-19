import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Landmark } from 'lucide-react';
import type { SettingsFormData } from '@/pages/Settings';

interface Props {
  register: UseFormRegister<SettingsFormData>;
  errors: FieldErrors<SettingsFormData>;
  bankFeatureEnabled: boolean;
  qrFeatureEnabled: boolean;
  inputClass: string;
  labelClass: string;
}

const BANK_FIELDS = [
  { name: 'bankName', label: 'Bank Name', placeholder: 'State Bank of India' },
  { name: 'accountName', label: 'Account Holder Name', placeholder: 'ABC TRADERS' },
  { name: 'accountNumber', label: 'Account Number', placeholder: '1234567890123' },
  { name: 'ifsc', label: 'IFSC Code', placeholder: 'SBIN0001234' },
  { name: 'branch', label: 'Branch', placeholder: 'Main Branch, Mumbai' },
  { name: 'upiId', label: 'UPI ID', placeholder: 'yourname@bank' }
] as const;

export function PaymentSettingsSection({
  register,
  errors,
  bankFeatureEnabled,
  qrFeatureEnabled,
  inputClass,
  labelClass
}: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
        <Landmark size={17} className="text-indigo-600" />
        Payment &amp; Bank Details
      </h2>

      <div className="mb-4 space-y-2">
        <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
          <input
            type="checkbox"
            className="mt-1"
            disabled={!bankFeatureEnabled}
            {...register('payment.showBankDetails')}
          />
          <span className="text-sm">
            <span className="block font-semibold text-slate-800">
              Show bank details on invoices
            </span>
            {!bankFeatureEnabled && (
              <span className="text-xs text-amber-600">
                Disabled by administrator
              </span>
            )}
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
          <input
            type="checkbox"
            className="mt-1"
            disabled={!qrFeatureEnabled}
            {...register('payment.showPaymentQr')}
          />
          <span className="text-sm">
            <span className="block font-semibold text-slate-800">
              Show UPI QR code on invoices
            </span>
            {!qrFeatureEnabled && (
              <span className="text-xs text-amber-600">
                Disabled by administrator
              </span>
            )}
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {BANK_FIELDS.map((field) => {
          const error = errors.bankDetails?.[field.name]?.message;

          return (
            <div key={field.name}>
              <label className={labelClass}>{field.label}</label>
              <input
                {...register(`bankDetails.${field.name}` as const)}
                placeholder={field.placeholder}
                className={inputClass}
              />
              {error && (
                <p className="mt-1 text-xs text-red-500">{error}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PaymentSettingsSection;