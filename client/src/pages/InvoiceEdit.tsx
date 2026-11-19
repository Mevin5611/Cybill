import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Decimal from "decimal.js";

import { useFetch, useMutate } from "@/hooks/useApi";
import { formatCurrency } from "@/lib/utils";
import {
  BLANK,
  numberInputClass,
  numberInputGuards,
} from "@/lib/invoiceFormHelpers";

import {
  Plus,
  Trash2,
  Save,
  Search,
  ArrowLeft,
  UserRound,
  Receipt,
  AlertCircle,
  Wallet,
} from "lucide-react";

import type { ICustomer, IInvoice } from "@/types";

Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
});

const D = (value: number | string) => new Decimal(value || 0);

const round2 = (value: Decimal) =>
  value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();

const GST_RATES = [0, 5, 12, 18, 28];
const BUSINESS_STATE = "Kerala";

// -------------------- SCHEMA --------------------

const invoiceFormSchema = z.object({
  customerType: z.enum(["walk_in", "registered"]),
  customerId: z.string().optional(),
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().optional(),
  customerGstin: z.string().optional(),
  customerState: z.string().optional(),
  billingAddress: z.string().optional(),

  vehicleNumber: z.string().optional(),

  items: z
    .array(
      z.object({
        description: z.string().min(1, "Item name required"),
        quantity: z.coerce.number().positive("Invalid quantity"),
        unitPrice: z.coerce.number().min(0),
        discount: z.coerce.number().min(0).default(0),
        gstRate: z.coerce.number(),
        pricingMode: z.enum(["exclusive", "inclusive"]),
      })
    )
    .min(1),

  discountAmount: z.coerce.number().min(0).default(0),
  otherCharges: z.coerce.number().min(0).default(0),

  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

const newItem = {
  description: "",
  quantity: 1,
  unitPrice: BLANK,
  discount: 0,
  gstRate: 18,
  pricingMode: "exclusive" as const,
};

// -------------------- GST CALCULATION (preview only) --------------------

interface CalculatedItem {
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  gst: number;
  total: number;
}

function calculateItems(
  items: InvoiceFormData["items"],
  invoiceDiscount: number,
  interState: boolean
) {
  const original = items.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const discount = Number(item.discount) || 0;
    const rate = Number(item.gstRate) || 0;

    const gross = D(quantity).mul(price);
    const amount = Decimal.max(0, gross.minus(discount));

    const taxable =
      item.pricingMode === "inclusive"
        ? amount.mul(100).div(D(100).plus(rate))
        : amount;

    return { taxable: round2(taxable), rate };
  });

  const subtotal = original.reduce(
    (sum, item) => sum.plus(item.taxable),
    D(0)
  );

  const discount = Decimal.min(
    Decimal.max(0, D(invoiceDiscount || 0)),
    subtotal
  );

  let remainingDiscount = discount;

  const calculated: CalculatedItem[] = original.map((item, index) => {
    let share = D(0);

    if (!subtotal.isZero()) {
      if (index === original.length - 1) {
        share = remainingDiscount;
      } else {
        share = discount.mul(item.taxable).div(subtotal).toDecimalPlaces(2);
        remainingDiscount = remainingDiscount.minus(share);
      }
    }

    const taxable = round2(Decimal.max(0, D(item.taxable).minus(share)));
    const gst = round2(D(taxable).mul(item.rate).div(100));

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (interState) {
      igst = gst;
    } else {
      cgst = round2(D(gst).div(2));
      sgst = round2(D(gst).minus(cgst));
    }

    return {
      taxable,
      cgst,
      sgst,
      igst,
      gst,
      total: round2(D(taxable).plus(gst)),
    };
  });

  const taxableValue = calculated.reduce((sum, item) => sum + item.taxable, 0);
  const cgst = calculated.reduce((sum, item) => sum + item.cgst, 0);
  const sgst = calculated.reduce((sum, item) => sum + item.sgst, 0);
  const igst = calculated.reduce((sum, item) => sum + item.igst, 0);

  return {
    items: calculated,
    subtotal: round2(subtotal),
    discount: round2(discount),
    taxableValue: round2(D(taxableValue)),
    cgst: round2(D(cgst)),
    sgst: round2(D(sgst)),
    igst: round2(D(igst)),
    totalGst: round2(D(cgst).plus(sgst).plus(igst)),
  };
}

type InvoiceResponse = IInvoice | { status?: string; data?: IInvoice };

// -------------------- COMPONENT --------------------

export function InvoiceEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [showCustomers, setShowCustomers] = React.useState(false);
  const [error, setError] = React.useState("");

  const { data: response, isLoading } = useFetch<InvoiceResponse>(
    ["invoice", id],
    `/invoices/${id}`,
    { enabled: !!id }
  );

  const invoice =
    response && "data" in response
      ? response.data
      : (response as IInvoice | undefined);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      customerType: "walk_in",
      customerId: "",
      customerName: "",
      customerPhone: "",
      customerGstin: "",
      customerState: "Kerala",
      billingAddress: "",
      vehicleNumber: "",
      items: [{ ...newItem }],
      discountAmount: BLANK,
      otherCharges: BLANK,
      paymentMethod: "Cash",
      notes: "",
    },
  });

  // Populate the form once the invoice loads.
  // Zero amounts are shown as blank so the fields never display "0".
  React.useEffect(() => {
    if (!invoice) return;

    reset({
      customerType: invoice.customerType,
      customerId: invoice.customerId ? String(invoice.customerId) : "",
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone || "",
      customerGstin: invoice.customerGstin || "",
      customerState: invoice.customerState || "Kerala",
      billingAddress: invoice.billingAddress || "",
      vehicleNumber: invoice.vehicleNumber || "",
      items: invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice || BLANK,
        discount: item.discount,
        gstRate: item.gstRate,
        pricingMode: item.pricingMode,
      })),
      discountAmount: invoice.discountAmount || BLANK,
      otherCharges: invoice.otherCharges || BLANK,
      paymentMethod: invoice.paymentMethod || "Cash",
      notes: invoice.notes || "",
    });
  }, [invoice, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const customerType = useWatch({ control, name: "customerType" });
  const customerState = useWatch({ control, name: "customerState" });
  const items = useWatch({ control, name: "items" }) || [];
  const discountAmount = useWatch({ control, name: "discountAmount" }) || 0;
  const otherCharges = useWatch({ control, name: "otherCharges" }) || 0;

  const interState =
    Boolean(customerState) &&
    customerState!.trim().toLowerCase() !== BUSINESS_STATE.toLowerCase();

  const gstCalculation = React.useMemo(
    () => calculateItems(items, Number(discountAmount), interState),
    [items, discountAmount, interState]
  );

  const beforeRound = D(gstCalculation.taxableValue)
    .plus(gstCalculation.totalGst)
    .plus(Number(otherCharges));

  const finalTotal = beforeRound
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toNumber();

  const roundOff = round2(D(finalTotal).minus(beforeRound));

  const { data: customerResponse } = useFetch<
    ICustomer[] | { customers: ICustomer[] }
  >(
    ["customers", searchTerm],
    `/customers?search=${encodeURIComponent(searchTerm)}&limit=10`
  );

  const customers = Array.isArray(customerResponse)
    ? customerResponse
    : customerResponse?.customers || [];

  const updateInvoice = useMutate<IInvoice, InvoiceFormData>(
    `/invoices/${id}`,
    "put"
  );

  const selectCustomer = (customer: ICustomer) => {
    setValue("customerId", customer._id || "");
    setValue("customerName", customer.name);
    setValue("customerPhone", customer.phone || "");
    setValue("customerGstin", customer.gstin || "");
    setValue("customerState", customer.state || "Kerala");
    setValue("billingAddress", customer.billingAddress || "");
    setSearchTerm(customer.name);
    setShowCustomers(false);
  };

  const onSubmit = async (data: InvoiceFormData) => {
    setError("");

    try {
      const payload = {
        ...data,
        items: data.items.map((item) => ({
          ...item,
          gstRate: Number(item.gstRate),
        })),
      };

      await updateInvoice.mutateAsync(payload);
      navigate(`/invoices/${id}`);
    } catch (err) {
      console.error(err);
      setError("Unable to save changes. Please try again.");
    }
  };

  // -------------------- STYLES --------------------

  const input =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10";

  const tableInput =
    "w-full min-w-0 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10";

  const label = "mb-1 block text-xs font-semibold text-slate-500";

  const thLeft =
    "px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500";

  const thRight =
    "px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500";

  const tdValue = "px-4 py-2 text-right align-middle";

  const summaryStats: Array<{
    label: string;
    value: string;
    tone?: "red";
  }> = [
    { label: "Subtotal", value: formatCurrency(gstCalculation.subtotal) },
  ];

  if (gstCalculation.discount > 0) {
    summaryStats.push({
      label: "Discount",
      value: `-${formatCurrency(gstCalculation.discount)}`,
      tone: "red",
    });
  }

  summaryStats.push({
    label: "Taxable",
    value: formatCurrency(gstCalculation.taxableValue),
  });

  if (interState) {
    summaryStats.push({
      label: "IGST",
      value: formatCurrency(gstCalculation.igst),
    });
  } else {
    summaryStats.push({
      label: "CGST",
      value: formatCurrency(gstCalculation.cgst),
    });
    summaryStats.push({
      label: "SGST",
      value: formatCurrency(gstCalculation.sgst),
    });
  }

  if (Number(otherCharges) > 0) {
    summaryStats.push({
      label: "Other",
      value: formatCurrency(Number(otherCharges)),
    });
  }

  summaryStats.push({ label: "Round off", value: formatCurrency(roundOff) });

  // -------------------- GUARD STATES --------------------

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading invoice...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-slate-500">Invoice not found</p>
          <button
            onClick={() => navigate("/invoices")}
            className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Back to invoices
          </button>
        </div>
      </div>
    );
  }

  // -------------------- UI --------------------

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/invoices/${invoice._id}`)}
              className="rounded-lg border bg-white p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Back to invoice"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Edit Invoice {invoice.invoiceNumber}
              </h1>
              <p className="text-xs text-slate-500">
                Draft invoice — changes are saved immediately
              </p>
            </div>
          </div>

          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            DRAFT
          </span>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          {/* CUSTOMER */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <UserRound size={17} className="text-indigo-600" />
                Customer Details
              </h2>

              <div className="flex rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setValue("customerType", "walk_in");
                    setValue("customerId", "");
                  }}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                    customerType === "walk_in"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  Walk-in
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setValue("customerType", "registered");
                    setValue("customerId", "");
                  }}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                    customerType === "registered"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  Registered
                </button>
              </div>
            </div>

            {customerType === "registered" && (
              <div className="relative mb-3">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowCustomers(true);
                    }}
                    onFocus={() => setShowCustomers(true)}
                    placeholder="Search registered customer..."
                    className={`${input} pl-9`}
                  />
                </div>

                {showCustomers && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-auto rounded-lg border bg-white shadow-lg">
                    {customers.map((customer) => (
                      <button
                        type="button"
                        key={customer._id}
                        onClick={() => selectCustomer(customer)}
                        className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                      >
                        <p className="text-sm font-semibold">{customer.name}</p>
                        <p className="text-xs text-slate-500">{customer.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className={label}>Customer Name *</label>
                <input
                  {...register("customerName")}
                  placeholder="Customer name"
                  className={input}
                />
                {errors.customerName && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.customerName.message}
                  </p>
                )}
              </div>

              <div>
                <label className={label}>Phone</label>
                <input
                  {...register("customerPhone")}
                  placeholder="Phone number"
                  className={input}
                />
              </div>

              <div>
                <label className={label}>GSTIN</label>
                <input
                  {...register("customerGstin")}
                  placeholder="GSTIN"
                  className={input}
                />
              </div>

              <div>
                <label className={label}>State</label>
                <select {...register("customerState")} className={input}>
                  <option value="Kerala">Kerala</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex mt-3 gap-3">
              <div className="w-1/2">
                <label className={label}>BillingAddress</label>
                <input
                  {...register("billingAddress")}
                  placeholder="Billing address (optional)"
                  className={input}
                />
              </div>
              <div className="w-1/4">
                <label className={label}>Motor Vehicle No</label>
                <input
                  {...register("vehicleNumber")}
                  placeholder="e.g. KL 07 AB 1234"
                  className={`${input} uppercase`}
                />
              </div>
            </div>
          </div>

          {/* ITEM TABLE */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Receipt size={17} className="text-indigo-600" />
                Invoice Items
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  {fields.length}
                </span>
              </h2>

              <div className="flex items-center gap-3">
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  {interState ? "IGST" : "CGST + SGST"}
                </span>

                <button
                  type="button"
                  onClick={() => append({ ...newItem })}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  <Plus size={15} />
                  Add Item
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] table-fixed">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="w-10 px-2 py-2.5 text-center text-[11px] font-semibold text-slate-500">
                      #
                    </th>
                    <th className={thLeft}>Item</th>
                    <th className={`${thRight} w-24`}>Qty</th>
                    <th className={`${thRight} w-32`}>Unit Price</th>
                    <th className={`${thRight} w-28`}>Net Value</th>
                    {interState ? (
                      <th className={`${thRight} w-28`}>IGST</th>
                    ) : (
                      <>
                        <th className={`${thRight} w-24`}>CGST</th>
                        <th className={`${thRight} w-24`}>SGST</th>
                      </>
                    )}
                    <th className={`${thRight} w-32`}>Total</th>
                    <th className="w-10 px-2" />
                  </tr>
                </thead>

                <tbody>
                  {fields.map((field, index) => {
                    const item = items[index];
                    const calc = gstCalculation.items[index];
                    const rate = Number(item?.gstRate) || 0;
                    const itemError = errors.items?.[index]?.description;

                    return (
                      <tr
                        key={field.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-2 py-2 text-center align-top text-xs text-slate-400">
                          <div className="pt-2">{index + 1}</div>
                        </td>

                        <td className="px-2 py-2 align-top">
                          <input
                            {...register(`items.${index}.description`)}
                            placeholder="Item description"
                            className={`${tableInput} ${
                              itemError ? "border-red-300" : ""
                            }`}
                          />

                          <div className="mt-1.5 flex gap-2">
                            <select
                              {...register(`items.${index}.gstRate`)}
                              className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-600 outline-none focus:border-indigo-500"
                            >
                              {GST_RATES.map((gst) => (
                                <option key={gst} value={gst}>
                                  GST {gst}%
                                </option>
                              ))}
                            </select>

                            <select
                              {...register(`items.${index}.pricingMode`)}
                              className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-600 outline-none focus:border-indigo-500"
                            >
                              <option value="exclusive">Exclusive</option>
                              <option value="inclusive">Inclusive</option>
                            </select>
                          </div>
                        </td>

                        <td className="px-2 py-2 align-top">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            {...register(`items.${index}.quantity`)}
                            {...numberInputGuards}
                            className={`${tableInput} ${numberInputClass} text-right`}
                          />
                        </td>

                        <td className="px-2 py-2 align-top">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...register(`items.${index}.unitPrice`)}
                            {...numberInputGuards}
                            className={`${tableInput} ${numberInputClass} text-right`}
                          />
                        </td>

                        <td
                          className={`${tdValue} align-top text-sm font-medium text-slate-700`}
                        >
                          <div className="pt-1.5">
                            {formatCurrency(calc?.taxable || 0)}
                          </div>
                        </td>

                        {interState ? (
                          <td className={`${tdValue} align-top`}>
                            <div className="pt-1.5 text-sm font-medium text-slate-700">
                              {formatCurrency(calc?.igst || 0)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {rate}%
                            </div>
                          </td>
                        ) : (
                          <>
                            <td className={`${tdValue} align-top`}>
                              <div className="pt-1.5 text-sm font-medium text-slate-700">
                                {formatCurrency(calc?.cgst || 0)}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {rate / 2}%
                              </div>
                            </td>
                            <td className={`${tdValue} align-top`}>
                              <div className="pt-1.5 text-sm font-medium text-slate-700">
                                {formatCurrency(calc?.sgst || 0)}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {rate / 2}%
                              </div>
                            </td>
                          </>
                        )}

                        <td
                          className={`${tdValue} align-top text-sm font-bold text-slate-900`}
                        >
                          <div className="pt-1.5">
                            {formatCurrency(calc?.total || 0)}
                          </div>
                        </td>

                        <td className="px-2 py-2 align-top">
                          <button
                            type="button"
                            disabled={fields.length === 1}
                            onClick={() => remove(index)}
                            className="mt-0.5 rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                            aria-label="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ADDITIONAL DETAILS */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <Wallet size={17} className="text-indigo-600" />
              Charges & Payment
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className={label}>Invoice Discount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  {...register("discountAmount")}
                  {...numberInputGuards}
                  className={`${input} ${numberInputClass} text-right`}
                />
              </div>

              <div>
                <label className={label}>Other Charges</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  {...register("otherCharges")}
                  {...numberInputGuards}
                  className={`${input} ${numberInputClass} text-right`}
                />
              </div>

              

              <div>
                <label className={label}>Payment Method</label>
                <select {...register("paymentMethod")} className={input}>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit">Credit</option>
                </select>
              </div>

              <div>
                <label className={label}>Notes</label>
                <input
                  {...register("notes")}
                  placeholder="Invoice notes (optional)"
                  className={input}
                />
              </div>
            </div>
          </div>

          {/* STICKY BOTTOM BAR */}
          <div className="sticky bottom-0 z-30 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-6px_20px_rgba(15,23,42,0.08)] backdrop-blur lg:-mx-6 lg:px-6">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="hidden flex-wrap items-center gap-x-5 gap-y-1 md:flex">
                {summaryStats.map((stat) => (
                  <div key={stat.label} className="leading-tight">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {stat.label}
                    </p>
                    <p
                      className={`text-sm font-semibold tabular-nums ${
                        stat.tone === "red" ? "text-red-600" : "text-slate-700"
                      }`}
                    >
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end lg:gap-4">
                <div className="rounded-lg bg-indigo-50 px-4 py-1.5 text-right leading-tight">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
                    Net Amount · {fields.length}{" "}
                    {fields.length === 1 ? "item" : "items"}
                  </p>
                  <p className="text-xl font-bold tabular-nums text-indigo-700">
                    {formatCurrency(finalTotal)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/invoices/${invoice._id}`)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Discard
                  </button>

                  <button
                    type="button"
                    disabled={updateInvoice.isPending}
                    onClick={handleSubmit(onSubmit)}
                    className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Save size={16} />
                    {updateInvoice.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InvoiceEdit;