import React from 'react';
import { useFetch } from '@/hooks/useApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Download, BarChart3 } from 'lucide-react';
import type { ISalesReport, IGstReport, IOutstandingReport } from '@/types';

export function Reports() {
  const [dateRange, setDateRange] = React.useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const [activeReport, setActiveReport] = React.useState<
    'sales' | 'gst' | 'outstanding'
  >('sales');

  const params = `startDate=${dateRange.startDate}T00:00:00&endDate=${dateRange.endDate}T23:59:59`;

  const { data: salesData } = useFetch<ISalesReport[]>(
    ['sales-report', dateRange],
    `/reports/sales?${params}`,
    { enabled: activeReport === 'sales' }
  );

  const { data: gstData } = useFetch<IGstReport[]>(
    ['gst-report', dateRange],
    `/reports/gst?${params}`,
    { enabled: activeReport === 'gst' }
  );

  const { data: outstandingData } = useFetch<IOutstandingReport[]>(
    ['outstanding-report'],
    '/reports/outstanding',
    { enabled: activeReport === 'outstanding' }
  );

  // ---- GST rows with per-invoice Total GST, plus grand totals ----
  const gstRows = (gstData || []).map((r) => ({
    date: r.date,
    invoiceNumber: r.invoiceNumber,
    taxableValue: r.taxableValue || 0,
    cgst: r.cgst || 0,
    sgst: r.sgst || 0,
    igst: r.igst || 0,
    totalGst: (r.cgst || 0) + (r.sgst || 0) + (r.igst || 0),
  }));

  const gstTotals = gstRows.reduce(
    (acc, r) => ({
      taxableValue: acc.taxableValue + r.taxableValue,
      cgst: acc.cgst + r.cgst,
      sgst: acc.sgst + r.sgst,
      igst: acc.igst + r.igst,
      totalGst: acc.totalGst + r.totalGst,
    }),
    { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalGst: 0 }
  );

  const escapeCsv = (value: unknown) => {
    const s = String(value ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const handleDownloadCsv = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;

    const csv = [
      Object.keys(data[0]),
      ...data.map((row) => Object.values(row)),
    ];
    const csvContent = csv
      .map((row) => row.map(escapeCsv).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExport = () => {
    if (activeReport === 'gst') {
      if (gstRows.length === 0) return;
      handleDownloadCsv(
        [...gstRows, { date: 'TOTAL', invoiceNumber: '', ...gstTotals }],
        'gst-report.csv'
      );
      return;
    }
    handleDownloadCsv(activeData || [], `${activeReport}-report.csv`);
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

  const tabs: Array<{ id: 'sales' | 'gst' | 'outstanding'; label: string }> = [
    { id: 'sales', label: 'Sales Report' },
    { id: 'gst', label: 'GST Report' },
    { id: 'outstanding', label: 'Outstanding' },
  ];

  const activeData =
    activeReport === 'sales'
      ? salesData
      : activeReport === 'gst'
      ? gstData
      : outstandingData;

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-900">Reports</h1>
          <p className="text-xs text-slate-500">
            Analyze sales, tax and outstanding data
          </p>
        </div>

        {/* DATE RANGE */}
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
            <div>
              <label className={label}>Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
                className={input}
              />
            </div>
            <div>
              <label className={label}>End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
                className={input}
              />
            </div>
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="mb-4 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                activeReport === tab.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SALES REPORT */}
        {activeReport === 'sales' && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {!salesData || salesData.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className={thLeft}>Date</th>
                      <th className={thLeft}>Invoice #</th>
                      <th className={thLeft}>Customer</th>
                      <th className={thRight}>Amount</th>
                      <th className={thRight}>GST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatDate(item.date)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                          {item.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {item.customerName}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-600">
                          {formatCurrency(item.taxAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* GST REPORT */}
        {activeReport === 'gst' && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {gstRows.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className={thLeft}>Date</th>
                      <th className={thLeft}>Invoice #</th>
                      <th className={thRight}>Taxable Value</th>
                      <th className={thRight}>CGST</th>
                      <th className={thRight}>SGST</th>
                      <th className={thRight}>IGST</th>
                      <th className={thRight}>Total GST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gstRows.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatDate(item.date)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                          {item.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-600">
                          {formatCurrency(item.taxableValue)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-600">
                          {formatCurrency(item.cgst)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-600">
                          {formatCurrency(item.sgst)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-600">
                          {formatCurrency(item.igst)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800">
                          {formatCurrency(item.totalGst)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                      <td
                        className="px-4 py-3 text-sm text-slate-800"
                        colSpan={2}
                      >
                        Total
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-800">
                        {formatCurrency(gstTotals.taxableValue)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-800">
                        {formatCurrency(gstTotals.cgst)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-800">
                        {formatCurrency(gstTotals.sgst)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-800">
                        {formatCurrency(gstTotals.igst)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-indigo-700">
                        {formatCurrency(gstTotals.totalGst)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* OUTSTANDING REPORT */}
        {activeReport === 'outstanding' && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {!outstandingData || outstandingData.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className={thLeft}>Customer</th>
                      <th className={thLeft}>Invoice #</th>
                      <th className={thLeft}>Date</th>
                      <th className={thRight}>Total</th>
                      <th className={thRight}>Paid</th>
                      <th className={thRight}>Outstanding</th>
                      <th className={thCenter}>Days Overdue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outstandingData.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                          {item.customerName}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {item.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatDate(item.invoiceDate)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-600">
                          {formatCurrency(item.invoiceTotal)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-emerald-600">
                          {formatCurrency(item.paidAmount)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-red-600">
                          {formatCurrency(item.outstanding)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              item.daysOverdue > 30
                                ? 'bg-red-50 text-red-700'
                                : item.daysOverdue > 0
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {item.daysOverdue}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-10 text-center text-sm text-slate-500">
      <BarChart3 className="mx-auto mb-2 text-slate-300" size={28} />
      No data available for the selected range
    </div>
  );
}

export default Reports;