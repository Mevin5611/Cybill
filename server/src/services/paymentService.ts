import type { IPayment } from '../../../shared/types/index.js';
import { Payment, PaymentAllocation } from '../models/Payment.js';
import { Invoice } from '../models/Invoice.js';
import { Customer } from '../models/Customer.js';
import { AppError } from '../middleware/errorHandler.js';

export interface RecordPaymentInput {
  customerId?: string;
  customerName: string;
  amount: number;
  method: string;
  allocations?: Array<{
    invoiceId: string;
    amount: number;
  }>;
  notes?: string;
}

export class PaymentService {
  async recordPayment(input: RecordPaymentInput): Promise<{ payment: IPayment; allocations: any[] }> {
    const paymentReference = `PAY-${Date.now()}`;

    const payment = new Payment({
      paymentReference,
      customerId: input.customerId,
      customerName: input.customerName,
      date: new Date(),
      amount: input.amount,
      method: input.method,
      notes: input.notes
    });

    await payment.save();

    // Handle allocations
    const allocations = [];

    if (input.allocations && input.allocations.length > 0) {
      let remainingAmount = input.amount;

      for (const alloc of input.allocations) {
        if (remainingAmount <= 0) break;

        const invoice = await Invoice.findById(alloc.invoiceId);

        if (!invoice) {
          throw new AppError(404, `Invoice not found: ${alloc.invoiceId}`);
        }

        // Check if allocation already exists
        const existing = await PaymentAllocation.findOne({
          paymentId: payment._id,
          invoiceId: alloc.invoiceId
        });

        if (existing) {
          throw new AppError(400, `Allocation already exists for invoice ${invoice.invoiceNumber}`);
        }

        const allocAmount = Math.min(alloc.amount, remainingAmount, invoice.outstandingAmount);

        if (allocAmount <= 0) {
          throw new AppError(400, `Invalid allocation amount for invoice ${invoice.invoiceNumber}`);
        }

        const allocation = new PaymentAllocation({
          paymentId: payment._id,
          invoiceId: invoice._id,
          allocatedAmount: allocAmount
        });

        await allocation.save();

        // Update invoice outstanding amount
        invoice.paidAmount += allocAmount;
        invoice.outstandingAmount = invoice.finalTotal - invoice.paidAmount;
        await invoice.save();

        allocations.push(allocation.toObject());
        remainingAmount -= allocAmount;
      }
    } else if (input.customerId) {
      // Auto-allocate to oldest unpaid invoices
      const invoices = await Invoice.find({
        customerId: input.customerId,
        status: 'finalized',
        outstandingAmount: { $gt: 0 }
      }).sort({ invoiceDate: 1 });

      let remainingAmount = input.amount;

      for (const invoice of invoices) {
        if (remainingAmount <= 0) break;

        const allocAmount = Math.min(remainingAmount, invoice.outstandingAmount);

        const allocation = new PaymentAllocation({
          paymentId: payment._id,
          invoiceId: invoice._id,
          allocatedAmount: allocAmount
        });

        await allocation.save();

        invoice.paidAmount += allocAmount;
        invoice.outstandingAmount = invoice.finalTotal - invoice.paidAmount;
        await invoice.save();

        allocations.push(allocation.toObject());
        remainingAmount -= allocAmount;
      }
    }

    return {
      payment: payment.toObject(),
      allocations
    };
  }

  async getPayment(id: string): Promise<IPayment> {
    const payment = await Payment.findById(id);

    if (!payment) {
      throw new AppError(404, 'Payment not found');
    }

    return payment.toObject();
  }

  async listPayments(
    filters: {
      customerId?: string;
      startDate?: Date;
      endDate?: Date;
      method?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ payments: IPayment[]; total: number }> {
    const { customerId, startDate, endDate, method, page = 1, limit = 20 } = filters;

    const query: Record<string, any> = {};

    if (customerId) query.customerId = customerId;
    if (method) query.method = method;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return { payments: payments as IPayment[], total };
  }
}

export const paymentService = new PaymentService();