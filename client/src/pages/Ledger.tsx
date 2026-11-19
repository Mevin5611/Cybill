import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFetch } from '@/hooks/useApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import {  ArrowLeft, Book, UserRound } from 'lucide-react';
import type { ILedgerEntry, ICustomer } from '@/types';


export function Ledger() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('customerId') || '';

  const { data: customerResponse } = useFetch<
    ICustomer | { status?: string; data?: ICustomer }
  >(['customer', customerId], `/customers/${customerId}`, {
    enabled: !!customerId,
  });

  const customer =
    customerResponse && 'data' in customerResponse
      ? customerResponse.data
      : customerResponse;

  const { data: ledgerResponse, isLoading } = useFetch<
    ILedgerEntry[] | { status?: string; data?: ILedgerEntry[] }
  >(['ledger', customerId], `/customers/${customerId}/ledger`, {
    enabled: !!customerId,
  });

  const ledger = Array.isArray(ledgerResponse)
    ? ledgerResponse
    : ledgerResponse?.data ?? [];

  const thLeft =
    'px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500';

  const thRight =
    'px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500';

  if (!customerId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Book className="mx-auto mb-3 text-slate-300" size={28} />
          <p className="text-sm text-slate-500">
            Please select a customer first
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="mx-auto max-w-6xl  ">
        
        <div className="mb-4 flex gap-2 items-center">
          <ArrowLeft className='border boreder-gray-300 rounded-md m-2 p-1' onClick={()=> navigate(-1)}/>
          <div><h1 className="text-xl font-bold text-slate-900">
            Customer Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Transaction history and running balance
          </p></div>
        </div>

        {customer && (
          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <UserRound size={17} className="text-indigo-600" />
              {customer.name}
            </h2>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs font-semibold text-slate-400">Phone</p>
                <p className="text-sm font-semibold text-slate-800">
                  {customer.phone}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400">Type</p>
                <p className="text-sm font-semibold text-slate-800">
                  {customer.type}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400">GSTIN</p>
                <p className="text-sm font-semibold text-slate-800">
                  {customer.gstin || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400">State</p>
                <p className="text-sm font-semibold text-slate-800">
                  {customer.state || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading ledger...
            </div>
          ) : !ledger || ledger.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No transactions found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className={thLeft}>Date</th>
                      <th className={thLeft}>Description</th>
                      <th className={thRight}>Debit</th>
                      <th className={thRight}>Credit</th>
                      <th className={thRight}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((entry, index) => (
                      <tr
                        key={index}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatDate(entry.date)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {entry.invoiceNumber && (
                            <span className="font-semibold text-slate-800">
                              {entry.invoiceNumber}
                            </span>
                          )}
                          {entry.description && (
                            <p className="text-xs text-slate-500">
                              {entry.description}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-600">
                          {entry.credit > 0
                            ? formatCurrency(entry.credit)
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                          {formatCurrency(entry.runningBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex justify-end">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-500">
                      Current Balance
                    </p>
                    <p className="text-xl font-bold text-indigo-700">
                      {formatCurrency(
                        ledger[ledger.length - 1].runningBalance
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Ledger;