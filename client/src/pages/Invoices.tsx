import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFetch } from '@/hooks/useApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Eye, Download, Printer, Plus, FileText } from 'lucide-react';
import type { IInvoice } from '@/types';

export function Invoices() {
  const [filters, setFilters] = React.useState({
    status: '',
    page: 1,
  });
  const navigate = useNavigate();

  const queryParams = new URLSearchParams();
  if (filters.status) queryParams.append('status', filters.status);
  queryParams.append('page', filters.page.toString());

  const { data, isLoading } = useFetch<
    | IInvoice[]
    | {
        status?: string;
        data?: IInvoice[];
        invoices?: IInvoice[];
      }
  >(['invoices', filters], `/invoices?${queryParams}`);

  const invoices = Array.isArray(data)
    ? data
    : data?.data ?? data?.invoices ?? [];

  const handleDownloadPdf = (id: string, invoiceNumber: string) => {
    const link = document.createElement('a');
    link.href = `/api/invoices/${id}/pdf`;
    link.download = `invoice-${invoiceNumber}.pdf`;
    link.click();
  };

  const statusStyle: Record<string, string> = {
    finalized: 'bg-emerald-50 text-emerald-700',
    draft: 'bg-amber-50 text-amber-700',
    cancelled: 'bg-red-50 text-red-700',
  };

  const input =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10';

  const label = 'mb-1 block text-xs font-semibold text-slate-500';

  const thLeft =
    'px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500';

  const thRight =
    'px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500';

  const thCenter =
    'px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500';

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">All Bills</h1>
            <p className="text-xs text-slate-500">
              Browse, print and manage invoices
            </p>
          </div>

          <button
            onClick={() => navigate('/billing')}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus size={16} />
            New Bill
          </button>
        </div>

        {/* FILTERS */}
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="max-w-xs">
            <label className={label}>Status</label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value, page: 1 })
              }
              className={input}
            >
              <option value="">All Statuses</option>
              <option value="finalized">Finalized</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading invoices...
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              <FileText className="mx-auto mb-2 text-slate-300" size={28} />
              <p>No invoices found</p>
              <button
                onClick={() => navigate('/billing')}
                className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Create your first invoice
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className={thLeft}>Invoice #</th>
                    <th className={thLeft}>Date</th>
                    <th className={thLeft}>Customer</th>
                    <th className={thRight}>Amount</th>
                    <th className={thRight}>Paid</th>
                    <th className={thRight}>Outstanding</th>
                    <th className={thCenter}>Status</th>
                    <th className={thCenter}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice._id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDate(invoice.invoiceDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {invoice.customerName}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800">
                        {formatCurrency(invoice.finalTotal)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-emerald-600">
                        {formatCurrency(invoice.paidAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-red-600">
                        {formatCurrency(invoice.outstandingAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                            statusStyle[invoice.status] ||
                            'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() =>
                              navigate(`/invoices/${invoice._id}`)
                            }
                            className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>

                          {invoice.status === 'finalized' && (
                            <>
                              <button
                                onClick={() =>
                                  handleDownloadPdf(
                                    invoice._id!,
                                    invoice.invoiceNumber
                                  )
                                }
                                className="rounded-lg p-1.5 text-violet-600 hover:bg-violet-50"
                                title="Download PDF"
                              >
                                <Download size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  window.open(
                                    `/api/invoices/${invoice._id}/pdf`
                                  )
                                }
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                                title="Print"
                              >
                                <Printer size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Invoices;