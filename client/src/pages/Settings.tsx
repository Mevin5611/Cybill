import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFetch, useMutate } from "@/hooks/useApi";
import { Save, Building2, Receipt } from "lucide-react";
import type { IBusinessSettings } from "@/types";
import { FeatureKey } from "../../../shared/types";
import PaymentSettingsSection from "@/components/settings/PaymentSettingsSection";

const optionalPattern = (pattern: RegExp, message: string) =>
  z
    .string()
    .trim()
    .default("")
    .refine((value) => value === "" || pattern.test(value), { message });

const bankDetailsSchema = z.object({
  bankName: z.string().trim().max(100).default(""),
  accountName: z.string().trim().max(100).default(""),
  accountNumber: optionalPattern(
    /^\d{6,18}$/,
    "Account number must be 6–18 digits",
  ),
  ifsc: optionalPattern(/^[A-Z]{4}0[A-Z0-9]{6}$/i, "Invalid IFSC code"),
  branch: z.string().trim().max(150).default(""),
  upiId: optionalPattern(/^[\w.\-]{2,256}@[A-Za-z]{2,64}$/, "Invalid UPI ID"),
});

const settingsSchema = z.object({
  businessName: z.string().min(1),
  businessAddress: z.string().min(1),
  businessPhone: z.string().min(1),
  gstin: z.string().min(1),
  state: z.string(),
  invoicePrefix: z.string().default("INV"),
  invoiceStartNumber: z.coerce.number().default(1),
  invoiceTerms: z.string().optional(),
  returnTerms: z.string().optional(),
  bankDetails: bankDetailsSchema,
  payment: z.object({
    showBankDetails: z.boolean(),
    showPaymentQr: z.boolean(),
  }),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;

const INDIAN_STATES = [
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
];

export function Settings() {
  const { data: settings, isLoading } = useFetch<IBusinessSettings>(
    ["settings"],
    "/settings",
  );

  const updateSettings = useMutate<IBusinessSettings, SettingsFormData>(
    "/settings",
    "put",
  );

  const { data: features } = useFetch<Record<FeatureKey, boolean>>(
    ["features"],
    "/settings/features",
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    values: settings as SettingsFormData,
  });

  React.useEffect(() => {
    if (settings) {
      reset(settings as SettingsFormData);
    }
  }, [settings, reset]);

  const onSubmit = async (data: SettingsFormData) => {
    try {
      await updateSettings.mutateAsync(data);
      alert("Settings updated successfully");
    } catch (error) {
      alert("Failed to update settings");
    }
  };

  const input =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10";

  const label = "mb-1 block text-xs font-semibold text-slate-500";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 ">
      <div className="mx-auto">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-900">
            Business Settings
          </h1>
          <p className="text-xs text-slate-500">
            Configure your business profile and invoicing preferences
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* BUSINESS INFORMATION */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
              <Building2 size={17} className="text-indigo-600" />
              Business Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className={label}>Business Name *</label>
                <input {...register("businessName")} className={input} />
                {errors.businessName && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.businessName.message}
                  </p>
                )}
              </div>

              <div>
                <label className={label}>Address *</label>
                <textarea
                  {...register("businessAddress")}
                  className={`${input} h-20`}
                />
                {errors.businessAddress && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.businessAddress.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={label}>Phone *</label>
                  <input {...register("businessPhone")} className={input} />
                </div>
                <div>
                  <label className={label}>State *</label>
                  <select {...register("state")} className={input}>
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={label}>GSTIN *</label>
                <input
                  {...register("gstin")}
                  className={input}
                  placeholder="e.g., 27AABCT1234H1Z0"
                />
              </div>
            </div>
          </div>

          {/* INVOICE SETTINGS */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
              <Receipt size={17} className="text-indigo-600" />
              Invoice Settings
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={label}>Invoice Prefix</label>
                  <input
                    {...register("invoicePrefix")}
                    className={input}
                    placeholder="INV"
                  />
                </div>
                <div>
                  <label className={label}>Start Number</label>
                  <input
                    type="number"
                    {...register("invoiceStartNumber")}
                    className={input}
                  />
                </div>
              </div>

              <div>
                <label className={label}>Invoice Terms</label>
                <textarea
                  {...register("invoiceTerms")}
                  className={`${input} h-20`}
                  placeholder="Payment terms, warranty information, etc."
                />
              </div>

              <div>
                <label className={label}>Return Terms</label>
                <textarea
                  {...register("returnTerms")}
                  className={`${input} h-20`}
                  placeholder="Return and refund policy..."
                />
              </div>
            </div>
          </div>

          {(features?.bank_details_on_invoice &&
            features?.upi_qr_on_invoice) && (
            <PaymentSettingsSection
              register={register}
              errors={errors}
              bankFeatureEnabled={features?.bank_details_on_invoice ?? false}
              qrFeatureEnabled={features?.upi_qr_on_invoice ?? false}
              inputClass={input}
              labelClass={label}
            />
          )}

          {/* SAVE */}
          <button
            type="submit"
            disabled={updateSettings.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save size={18} />
            {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Settings;
