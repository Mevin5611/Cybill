import type { ICustomer } from '../../../shared/types/index.js';
import { Customer } from '../models/Customer.js';
import { Invoice } from '../models/Invoice.js';
import { Payment, PaymentAllocation } from '../models/Payment.js';
import { AppError } from '../middleware/errorHandler.js';

export interface CreateCustomerInput {
  name: string;
  type: 'B2C' | 'B2B';
  phone: string;
  billingAddress?: string;
  deliveryAddress?: string;
  gstin?: string;
  state?: string;
  openingBalance?: number;
  notes?: string;
}

export class CustomerService {
  async createCustomer(input: CreateCustomerInput): Promise<ICustomer> {
    const customer = new Customer({
      ...input,
      openingBalance: input.openingBalance || 0
    });

    await customer.save();
    return customer.toObject();
  }

  async getCustomer(id: string): Promise<ICustomer> {
    const customer = await Customer.findById(id);

    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    return customer.toObject();
  }

  async updateCustomer(id: string, input: Partial<CreateCustomerInput>): Promise<ICustomer> {
    const customer = await Customer.findByIdAndUpdate(id, input, { new: true });

    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    return customer.toObject();
  }

  async listCustomers(
    filters: {
      type?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ customers: ICustomer[]; total: number }> {
    const { type, search, page = 1, limit = 20 } = filters;

    const query: Record<string, any> = {};

    if (type) query.type = type;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
        { gstin: new RegExp(search, 'i') }
      ];
    }

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return { customers: customers as ICustomer[], total };
  }

  async getCustomerLedger(customerId: string): Promise<any[]> {
    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    const ledgerEntries: any[] = [];

    // Opening balance
    if (customer.openingBalance !== 0) {
      ledgerEntries.push({
        date: customer.createdAt,
        description: 'Opening Balance',
        debit: customer.openingBalance > 0 ? customer.openingBalance : 0,
        credit: customer.openingBalance < 0 ? Math.abs(customer.openingBalance) : 0,
        runningBalance: customer.openingBalance
      });
    }

    // Invoices
    const invoices = await Invoice.find({
      customerId,
      status: { $in: ['finalized', 'cancelled'] }
    }).sort({ invoiceDate: 1 });

    let runningBalance = customer.openingBalance;

    invoices.forEach((invoice) => {
      if (invoice.status === 'finalized') {
        runningBalance += invoice.finalTotal;
        ledgerEntries.push({
          date: invoice.invoiceDate,
          invoiceNumber: invoice.invoiceNumber,
          invoiceId: invoice._id,
          description: `Invoice ${invoice.invoiceNumber}`,
          debit: invoice.finalTotal,
          credit: 0,
          runningBalance
        });
      }
    });

    // Payments
    const paymentAllocations = await PaymentAllocation.find().populate('paymentId');

    const invoiceIds = invoices.map((inv) => inv._id);
    const relevantAllocations = paymentAllocations.filter((alloc) =>
      invoiceIds.some((id) => id.equals(alloc.invoiceId))
    );

    relevantAllocations.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateA.getTime() - dateB.getTime();
    });

    relevantAllocations.forEach((alloc) => {
      runningBalance -= alloc.allocatedAmount;
      ledgerEntries.push({
        date: alloc.createdAt,
        paymentReference: alloc.paymentId._id,
        description: `Payment against ${invoices.find((inv) => inv._id.equals(alloc.invoiceId))?.invoiceNumber || 'Invoice'}`,
        debit: 0,
        credit: alloc.allocatedAmount,
        runningBalance
      });
    });

    ledgerEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return ledgerEntries;
  }

  async getCustomerBalance(customerId: string): Promise<number> {
    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    let balance = customer.openingBalance;

    // Add all finalized invoices
    const invoices = await Invoice.find({
      customerId,
      status: 'finalized'
    });

    invoices.forEach((invoice) => {
      balance += invoice.outstandingAmount;
    });

    return balance;
  }
}

export const customerService = new CustomerService();