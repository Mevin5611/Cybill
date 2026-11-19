import React from 'react';
import { useFetch } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingCart,
  Receipt,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import type { IDashboardStats } from '@/types';

export function Dashboard() {
  const { data: stats, isLoading, error } = useFetch<IDashboardStats>(
    ['dashboard'],
    '/reports/dashboard'
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600" />
          <p className="mt-4 text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
        <div className="mx-auto flex max-w-6xl items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <AlertCircle size={16} />
          Failed to load dashboard
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Today's Invoice Total",
      value: formatCurrency(stats.todayInvoiceTotal),
      icon: ShoppingCart,
      tint: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: "Today's Collections",
      value: formatCurrency(stats.todayAmountCollected),
      icon: Wallet,
      tint: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Monthly Sales',
      value: formatCurrency(stats.monthlySales),
      icon: TrendingUp,
      tint: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Outstanding Receivables',
      value: formatCurrency(stats.totalOutstandingReceivables),
      icon: TrendingDown,
      tint: 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-xs text-slate-500">
            Overview of today's business performance
          </p>
        </div>

        {/* KEY METRICS */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">
                      {card.label}
                    </p>
                    <p className="mt-2 text-xl font-bold text-slate-900">
                      {card.value}
                    </p>
                  </div>
                  <div className={`rounded-lg p-2.5 ${card.tint}`}>
                    <Icon size={20} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* LISTS */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <Receipt size={17} className="text-indigo-600" />
              Recent Invoices
            </h2>

            <div className="divide-y divide-slate-100">
              {stats.recentInvoices.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-400">
                  No invoices yet
                </p>
              )}

              {stats.recentInvoices.map((invoice) => (
                <div
                  key={invoice._id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {invoice.invoiceNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      {invoice.customerName}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {formatCurrency(invoice.finalTotal || 0)}
                    </p>
                    <p
                      className={`text-xs ${
                        invoice.outstandingAmount
                          ? 'text-red-500'
                          : 'text-emerald-600'
                      }`}
                    >
                      {invoice.outstandingAmount
                        ? `Due: ${formatCurrency(invoice.outstandingAmount)}`
                        : 'Paid'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <ArrowUpRight size={17} className="text-indigo-600" />
              Recent Payments
            </h2>

            <div className="divide-y divide-slate-100">
              {stats.recentPayments.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-400">
                  No payments yet
                </p>
              )}

              {stats.recentPayments.map((payment) => (
                <div
                  key={payment._id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {payment.paymentReference}
                    </p>
                    <p className="text-xs text-slate-500">
                      {payment.customerName}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">
                      + {formatCurrency(payment.amount || 0)}
                    </p>
                    <p className="text-xs capitalize text-slate-500">
                      {payment.method}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50 p-5">
          <h2 className="mb-4 text-sm font-bold text-indigo-900">
            Today's Summary
          </h2>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs font-semibold text-indigo-600">
                Bills Generated
              </p>
              <p className="mt-1 text-xl font-bold text-indigo-900">
                {stats.billsToday}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-indigo-600">
                Total Invoiced
              </p>
              <p className="mt-1 text-xl font-bold text-indigo-900">
                {formatCurrency(stats.todayInvoiceTotal)}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-indigo-600">
                Collections
              </p>
              <p className="mt-1 text-xl font-bold text-emerald-600">
                {formatCurrency(stats.todayAmountCollected)}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-indigo-600">
                Outstanding
              </p>
              <p className="mt-1 text-xl font-bold text-red-600">
                {formatCurrency(stats.totalOutstandingReceivables)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;