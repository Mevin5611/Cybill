import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFetch, useMutate } from '@/hooks/useApi';
import { Plus, Eye, Search, UserRound, X } from 'lucide-react';
import type { ICustomer } from '@/types';

const customerSchema = z.object({
  name: z.string().min(1, 'Name required'),
  type: z.enum(['B2C', 'B2B']),
  phone: z.string().min(10, 'Valid phone required'),
  billingAddress: z.string().optional(),
  deliveryAddress: z.string().optional(),
  gstin: z.string().optional(),
  state: z.string().optional(),
  openingBalance: z.coerce.number().default(0),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export function Customers() {
  const [showForm, setShowForm] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [customerType, setCustomerType] = React.useState<'B2C' | 'B2B' | ''>('');
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useFetch<
    ICustomer[] | { customers?: ICustomer[]; data?: ICustomer[] }
  >(
    ['customers', searchTerm, customerType],
    `/customers?search=${encodeURIComponent(searchTerm)}${
      customerType ? `&type=${customerType}` : ''
    }`
  );

  const customers = Array.isArray(data)
    ? data
    : data?.customers ?? data?.data ?? [];

  const createCustomer = useMutate<ICustomer, CustomerFormData>(
    '/customers',
    'post'
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      type: 'B2C',
      openingBalance: 0,
    },
  });

  const onSubmit = async (formData: CustomerFormData) => {
    try {
      await createCustomer.mutateAsync(formData);
      reset();
      setShowForm(false);
      refetch();
    } catch (error) {
      alert('Failed to create customer');
    }
  };

  const input =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10';

  const label = 'mb-1 block text-xs font-semibold text-slate-500';

  const thLeft =
    'px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500';

  const thCenter =
    'px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500';

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Customers</h1>
            <p className="text-xs text-slate-500">
              Manage your retail and wholesale customers
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus size={16} />
            Add Customer
          </button>
        </div>

        {/* FILTERS */}
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${input} pl-9`}
              />
            </div>

            <select
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value as any)}
              className={input}
            >
              <option value="">All Types</option>
              <option value="B2C">B2C (Retail)</option>
              <option value="B2B">B2B (Wholesale)</option>
            </select>
          </div>
        </div>

        {/* LIST */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading customers...
            </div>
          ) : customers.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              <UserRound className="mx-auto mb-2 text-slate-300" size={28} />
              No customers found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className={thLeft}>Name</th>
                    <th className={thLeft}>Type</th>
                    <th className={thLeft}>Phone</th>
                    <th className={thLeft}>GSTIN</th>
                    <th className={thCenter}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr
                      key={customer._id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                        {customer.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            customer.type === 'B2B'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {customer.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {customer.phone}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {customer.gstin || '-'}
                      </td>
                      
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() =>
                              navigate(`/ledger?customerId=${customer._id}`)
                            }
                            className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50"
                            title="View Ledger"
                          >
                            <Eye size={17} />
                          </button>
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

      {/* ADD CUSTOMER MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <UserRound size={17} className="text-indigo-600" />
                Add New Customer
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="max-h-[70vh] space-y-4 overflow-y-auto p-5"
            >
              <div>
                <label className={label}>Name *</label>
                <input {...register('name')} className={input} />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className={label}>Type *</label>
                <select {...register('type')} className={input}>
                  <option value="B2C">B2C (Retail)</option>
                  <option value="B2B">B2B (Wholesale)</option>
                </select>
              </div>

              <div>
                <label className={label}>Phone *</label>
                <input {...register('phone')} className={input} />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.phone.message}
                  </p>
                )}
              </div>



              <div>
                <label className={label}>GSTIN</label>
                <input {...register('gstin')} className={input} />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={createCustomer.isPending}
                  className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createCustomer.isPending ? 'Adding...' : 'Add Customer'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
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

export default Customers;