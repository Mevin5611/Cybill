import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFetch, useMutate } from '@/hooks/useApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Search, X, Wallet, CheckCircle2 } from 'lucide-react';
import type { IPayment, ICustomer } from '@/types';

const paymentSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(1),
  amount: z.coerce.number().min(0.01),
  method: z.enum(['cash', 'upi', 'card', 'bank_transfer', 'cheque', 'other']),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export function Payments() {
  const [showForm, setShowForm] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCustomer, setSelectedCustomer] =
    React.useState<ICustomer | null>(null);

  const { data: customerResponse } = useFetch<
    ICustomer[] | { customers?: ICustomer[]; data?: ICustomer[] }
  >(['customers', searchTerm], `/customers?search=${searchTerm}&limit=10`);

  const customers = Array.isArray(customerResponse)
    ? customerResponse
    : customerResponse?.customers ?? customerResponse?.data ?? [];

  const { data: paymentResponse, isLoading, refetch } = useFetch<
    IPayment[] | { payments?: IPayment[]; data?: IPayment[] }
  >(['payments'], '/payments');

  const payments = Array.isArray(paymentResponse)
    ? paymentResponse
    : paymentResponse?.payments ?? paymentResponse?.data ?? [];

  const recordPayment = useMutate<any, PaymentFormData>('/payments', 'post');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      method: 'cash',
    },
  });

  const onSubmit = async (data: PaymentFormData) => {
    try {
      await recordPayment.mutateAsync(data);
      reset();
      setShowForm(false);
      setSelectedCustomer(null);
      refetch();
    } catch (error) {
      alert('Failed to record payment');
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setSelectedCustomer(null);
    setSearchTerm('');
    reset();
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
            <h1 className="text-xl font-bold text-slate-900">Payments</h1>
            <p className="text-xs text-slate-500">
              Track payments received from customers
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus size={16} />
            Record Payment
          </button>
        </div>

        {/* LIST */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading payments...
            </div>
          ) : !payments || payments.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              <Wallet className="mx-auto mb-2 text-slate-300" size={28} />
              No payments recorded yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className={thLeft}>Reference</th>
                    <th className={thLeft}>Date</th>
                    <th className={thLeft}>Customer</th>
                    <th className={thRight}>Amount</th>
                    <th className={thCenter}>Method</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment._id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                        {payment.paymentReference}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDate(payment.date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {payment.customerName}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-600">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-4 py-3 text-center text-sm capitalize text-slate-600">
                        {payment.method}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Wallet size={17} className="text-indigo-600" />
                Record Payment
              </h2>
              <button
                onClick={closeForm}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="max-h-[70vh] space-y-4 overflow-y-auto p-5"
            >
              <div className="relative">
                <label className={label}>Customer *</label>

                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Search customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${input} pl-9`}
                  />
                </div>

                {searchTerm && customers.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200">
                    {customers.map((customer) => (
                      <button
                        key={customer._id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setValue('customerId', customer._id!);
                          setValue('customerName', customer.name);
                          setSearchTerm('');
                        }}
                        className="block w-full border-b border-slate-100 px-3 py-2 text-left last:border-0 hover:bg-slate-50"
                      >
                        <p className="text-sm font-semibold text-slate-800">
                          {customer.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {customer.phone}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {selectedCustomer && (
                  <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 size={14} />
                    {selectedCustomer.name}
                  </p>
                )}
              </div>

              <div>
                <label className={label}>Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('amount')}
                  className={`${input} text-right`}
                />
                {errors.amount && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              <div>
                <label className={label}>Method *</label>
                <select {...register('method')} className={input}>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className={label}>Notes</label>
                <textarea
                  {...register('notes')}
                  className={`${input} h-20`}
                  placeholder="Payment notes..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={recordPayment.isPending}
                  className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {recordPayment.isPending ? 'Recording...' : 'Record Payment'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payments;