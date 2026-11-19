import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFetch, useMutate } from "@/hooks/useApi";
import { formatCurrency, formatDate } from "@/lib/utils";

import {
  ArrowLeft,
  Pencil,
  Printer,
  Download,
  CheckCircle2,
  Ban,
  Wallet,
  Receipt,
  UserRound,
  AlertCircle,
  X,
  FileText,
} from "lucide-react";

import type { IInvoice } from "@/types";

type InvoiceResponse =
  | IInvoice
  | { status?: string; data?: IInvoice };

export function InvoiceView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [modal, setModal] = React.useState<
    "finalize" | "payment" | "cancel" | null
  >(null);

  const [error, setError] = React.useState("");

  const {
    data: response,
    isLoading,
    refetch,
  } = useFetch<InvoiceResponse>(
    ["invoice", id],
    `/invoices/${id}`,
    { enabled: !!id }
  );

  const invoice =
    response && "data" in response
      ? response.data
      : (response as IInvoice | undefined);

  const finalizeInvoice = useMutate<
    IInvoice,
    { paidAmount: number }
  >(`/invoices/${id}/finalize`, "post");

  const updatePayment = useMutate<
    IInvoice,
    { paidAmount: number }
  >(`/invoices/${id}/payment`, "patch");

  const cancelInvoice = useMutate<
    IInvoice,
    { reason: string }
  >(`/invoices/${id}/cancel`, "post");

  const interState = (invoice?.taxBreakdown.igst || 0) > 0;

  const handleDownloadPdf = () => {
    if (!invoice?._id) return;
    window.open(`/api/invoices/${invoice._id}/pdf`, "_blank");
  };

  // -------------------- STYLES --------------------

  const label = "mb-1 text-xs font-semibold text-slate-500";

  const thLeft =
    "px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500";

  const thRight =
    "px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500";

  const statusStyle: Record<string, string> = {
    finalized: "bg-emerald-50 text-emerald-700",
    draft: "bg-amber-50 text-amber-700",
    cancelled: "bg-red-50 text-red-700",
  };

  // -------------------- LOADING / MISSING --------------------

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
          <FileText className="mx-auto mb-3 text-slate-300" size={28} />
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

  const canEdit = invoice.status !== "cancelled";
  const canFinalize = invoice.status === "draft";
  const canUpdatePayment = invoice.status === "finalized";
  const canCancel =
    invoice.status !== "cancelled" && invoice.paidAmount === 0;
  const canPrintOrDownload = invoice.status === "finalized";

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/invoices")}
              className="rounded-lg border bg-white p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Back to invoices"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {invoice.invoiceNumber}
                </h1>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                    statusStyle[invoice.status] ||
                    "bg-slate-100 text-slate-600"
                  }`}
                >
                  {invoice.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {formatDate(invoice.invoiceDate)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <button
                onClick={() => navigate(`/invoices/${invoice._id}/edit`)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Pencil size={15} />
                Edit
              </button>
            )}

            {canCancel && (
              <button
                onClick={() => setModal("cancel")}
                className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <Ban size={15} />
                Cancel
              </button>
            )}

            {canUpdatePayment && (
              <button
                onClick={() => setModal("payment")}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Wallet size={15} />
                Update Payment
              </button>
            )}

            {canPrintOrDownload && (
              <>
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Download size={15} />
                  Download
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Printer size={15} />
                  Print
                </button>
              </>
            )}

            {canFinalize && (
              <button
                onClick={() => setModal("finalize")}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <CheckCircle2 size={16} />
                Finalize Invoice
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {invoice.status === "cancelled" && invoice.cancelledReason && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            <Ban size={16} />
            Cancelled: {invoice.cancelledReason}
          </div>
        )}

        <div className="space-y-4">
          {/* CUSTOMER */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
              <UserRound size={17} className="text-indigo-600" />
              Customer Details
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className={label}>Customer Name</p>
                <p className="text-sm font-semibold text-slate-800">
                  {invoice.customerName}
                </p>
              </div>
              <div>
                <p className={label}>Phone</p>
                <p className="text-sm font-semibold text-slate-800">
                  {invoice.customerPhone || "-"}
                </p>
              </div>
              <div>
                <p className={label}>GSTIN</p>
                <p className="text-sm font-semibold text-slate-800">
                  {invoice.customerGstin || "-"}
                </p>
              </div>
              <div>
                <p className={label}>State</p>
                <p className="text-sm font-semibold text-slate-800">
                  {invoice.customerState || "-"}
                </p>
              </div>
            </div>

            {invoice.billingAddress && (
              <div className="mt-4">
                <p className={label}>Billing Address</p>
                <p className="text-sm text-slate-700">
                  {invoice.billingAddress}
                </p>
              </div>
            )}
          </div>

          {/* ITEMS */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Receipt size={17} className="text-indigo-600" />
                Invoice Items
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  {invoice.items.length}
                </span>
              </h2>

              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                {interState ? "IGST" : "CGST + SGST"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="w-10 px-2 py-2.5 text-center text-[11px] font-semibold text-slate-500">
                      #
                    </th>
                    <th className={thLeft}>Item</th>
                    <th className={thRight}>Qty</th>
                    <th className={thRight}>Unit Price</th>
                    <th className={thRight}>Net Value</th>
                    {interState ? (
                      <th className={thRight}>IGST</th>
                    ) : (
                      <>
                        <th className={thRight}>CGST</th>
                        <th className={thRight}>SGST</th>
                      </>
                    )}
                    <th className={thRight}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-2 py-2 text-center text-xs text-slate-400">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2">
                        <p className="text-sm font-medium text-slate-800">
                          {item.description}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          GST {item.gstRate}% ·{" "}
                          {item.pricingMode === "inclusive"
                            ? "Inclusive"
                            : "Exclusive"}
                        </p>
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-slate-700">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-slate-700">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-medium text-slate-700">
                        {formatCurrency(item.taxableAmount)}
                      </td>
                      {interState ? (
                        <td className="px-4 py-2 text-right text-sm text-slate-700">
                          {formatCurrency(item.igstAmount)}
                        </td>
                      ) : (
                        <>
                          <td className="px-4 py-2 text-right text-sm text-slate-700">
                            {formatCurrency(item.cgstAmount)}
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-slate-700">
                            {formatCurrency(item.sgstAmount)}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-2 text-right text-sm font-bold text-slate-900">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TOTALS + PAYMENT */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-slate-900">
                Amount Summary
              </h2>

              <div className="space-y-2 text-sm">
                <Row label="Subtotal" value={invoice.subtotal} />
                {invoice.discountAmount > 0 && (
                  <Row
                    label="Discount"
                    value={-invoice.discountAmount}
                    tone="red"
                  />
                )}
                <Row label="Taxable Value" value={invoice.taxableValue} />
                {interState ? (
                  <Row label="IGST" value={invoice.taxBreakdown.igst} />
                ) : (
                  <>
                    <Row label="CGST" value={invoice.taxBreakdown.cgst} />
                    <Row label="SGST" value={invoice.taxBreakdown.sgst} />
                  </>
                )}
                {invoice.otherCharges > 0 && (
                  <Row label="Other Charges" value={invoice.otherCharges} />
                )}
                {invoice.roundingAdjustment !== 0 && (
                  <Row
                    label="Round Off"
                    value={invoice.roundingAdjustment}
                  />
                )}

                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                  <p className="text-sm font-bold text-slate-900">
                    Final Total
                  </p>
                  <p className="text-lg font-bold text-indigo-700">
                    {formatCurrency(invoice.finalTotal)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                <Wallet size={17} className="text-indigo-600" />
                Payment Status
              </h2>

              <div className="space-y-2 text-sm">
                <Row label="Paid Amount" value={invoice.paidAmount} tone="green" />
                <Row
                  label="Outstanding"
                  value={invoice.outstandingAmount}
                  tone={invoice.outstandingAmount > 0 ? "red" : undefined}
                />
                <div className="flex items-center justify-between pt-1">
                  <p className={label}>Payment Method</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {invoice.paymentMethod || "-"}
                  </p>
                </div>
              </div>

              {invoice.notes && (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className={label}>Notes</p>
                  <p className="text-sm text-slate-700">{invoice.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FINALIZE MODAL */}
      {modal === "finalize" && (
        <AmountModal
          title="Finalize Invoice"
          description="Enter the amount paid so far. You can update this later."
          max={invoice.finalTotal}
          defaultValue={0}
          confirmLabel="Finalize"
          pending={finalizeInvoice.isPending}
          onClose={() => setModal(null)}
          onConfirm={async (amount) => {
            setError("");
            try {
              await finalizeInvoice.mutateAsync({ paidAmount: amount });
              setModal(null);
              refetch();
            } catch (err) {
              setError("Unable to finalize invoice.");
            }
          }}
        />
      )}

      {/* UPDATE PAYMENT MODAL */}
      {modal === "payment" && (
        <AmountModal
          title="Update Payment"
          description="Set the total amount paid against this invoice."
          max={invoice.finalTotal}
          defaultValue={invoice.paidAmount}
          confirmLabel="Update"
          pending={updatePayment.isPending}
          onClose={() => setModal(null)}
          onConfirm={async (amount) => {
            setError("");
            try {
              await updatePayment.mutateAsync({ paidAmount: amount });
              setModal(null);
              refetch();
            } catch (err) {
              setError("Unable to update payment.");
            }
          }}
        />
      )}

      {/* CANCEL MODAL */}
      {modal === "cancel" && (
        <ReasonModal
          pending={cancelInvoice.isPending}
          onClose={() => setModal(null)}
          onConfirm={async (reason) => {
            setError("");
            try {
              await cancelInvoice.mutateAsync({ reason });
              setModal(null);
              refetch();
            } catch (err) {
              setError("Unable to cancel invoice.");
            }
          }}
        />
      )}
    </div>
  );
}

// -------------------- HELPER COMPONENTS --------------------

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "red" | "green";
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p
        className={`text-sm font-semibold ${
          tone === "red"
            ? "text-red-600"
            : tone === "green"
            ? "text-emerald-600"
            : "text-slate-700"
        }`}
      >
        {formatCurrency(value)}
      </p>
    </div>
  );
}

function AmountModal({
  title,
  description,
  max,
  defaultValue,
  confirmLabel,
  pending,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  max: number;
  defaultValue: number;
  confirmLabel: string;
  pending: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}) {
  const [amount, setAmount] = React.useState(defaultValue);

  const input =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <p className="text-xs text-slate-500">{description}</p>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Paid Amount (max {formatCurrency(max)})
            </label>
            <input
              type="number"
              min={0}
              max={max}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className={`${input} text-right`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                onConfirm(Math.min(Math.max(amount, 0), max))
              }
              className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {pending ? "Saving..." : confirmLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReasonModal({
  pending,
  onClose,
  onConfirm,
}: {
  pending: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = React.useState("");

  const input =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">
            Cancel Invoice
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <p className="text-xs text-slate-500">
            This action cannot be undone. Please provide a reason.
          </p>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for cancellation"
            className={`${input} h-20`}
          />

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={pending || !reason.trim()}
              onClick={() => onConfirm(reason.trim())}
              className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {pending ? "Cancelling..." : "Confirm Cancel"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoiceView;