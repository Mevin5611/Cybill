import { Invoice } from '../models/Invoice.js';
import { Payment, PaymentAllocation } from '../models/Payment.js';
import { Customer } from '../models/Customer.js';
import type { IDashboardStats, ISalesReport, IGstReport, IOutstandingReport } from '../../../shared/types/index.js';

export class ReportService {
  async getDashboardStats(): Promise<IDashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    // Today's invoices
    const todayInvoices = await Invoice.find({
      invoiceDate: { $gte: today, $lt: tomorrow },
      status: 'finalized'
    });

    const todayInvoiceTotal = todayInvoices.reduce((sum, inv) => sum + inv.finalTotal, 0);
    const billsToday = todayInvoices.length;

    // Today's payments
    const todayPayments = await Payment.find({
      date: { $gte: today, $lt: tomorrow }
    });

    const todayAmountCollected = todayPayments.reduce((sum, pay) => sum + pay.amount, 0);

    // Monthly sales
    const monthlyInvoices = await Invoice.find({
      invoiceDate: { $gte: monthStart, $lte: monthEnd },
      status: 'finalized'
    });

    const monthlySales = monthlyInvoices.reduce((sum, inv) => sum + inv.finalTotal, 0);

    // Monthly collections
    const monthlyPayments = await Payment.find({
      date: { $gte: monthStart, $lte: monthEnd }
    });

    const monthlyCollections = monthlyPayments.reduce((sum, pay) => sum + pay.amount, 0);

    // Outstanding receivables
    const outstandingInvoices = await Invoice.find({
      status: 'finalized',
      outstandingAmount: { $gt: 0 }
    });

    const totalOutstandingReceivables = outstandingInvoices.reduce(
      (sum, inv) => sum + inv.outstandingAmount,
      0
    );

    // Recent invoices
    const recentInvoices = await Invoice.find({ status: 'finalized' })
      .sort({ invoiceDate: -1 })
      .limit(5)
      .select('invoiceNumber invoiceDate customerName finalTotal outstandingAmount');

    // Recent payments
    const recentPayments = await Payment.find({})
      .sort({ date: -1 })
      .limit(5)
      .select('paymentReference customerName amount date method');

    return {
      todayInvoiceTotal,
      todayAmountCollected,
      monthlySales,
      monthlyCollections,
      totalOutstandingReceivables,
      billsToday,
      recentInvoices: recentInvoices.map((inv) => inv.toObject()),
      recentPayments: recentPayments.map((pay) => pay.toObject())
    };
  }

  async getSalesReport(startDate: Date, endDate: Date): Promise<ISalesReport[]> {
    const invoices = await Invoice.find({
      invoiceDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['finalized', 'cancelled'] }
    }).sort({ invoiceDate: 1 });

    return invoices.map((inv) => ({
      date: inv.invoiceDate,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customerName,
      total: inv.status === 'finalized' ? inv.finalTotal : 0,
      taxAmount: inv.taxBreakdown.total,
      status: inv.status
    }));
  }

  async getCollectionsReport(startDate: Date, endDate: Date): Promise<any[]> {
    const payments = await Payment.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    const methodSummary: Record<string, number> = {};
    let total = 0;

    payments.forEach((pay) => {
      methodSummary[pay.method] = (methodSummary[pay.method] || 0) + pay.amount;
      total += pay.amount;
    });

    return [
      {
        payments: payments.map((p) => ({
          date: p.date,
          reference: p.paymentReference,
          customer: p.customerName,
          amount: p.amount,
          method: p.method
        })),
        methodSummary,
        total
      }
    ];
  }

  async getOutstandingReport(): Promise<IOutstandingReport[]> {
    const invoices = await Invoice.find({
      status: 'finalized',
      outstandingAmount: { $gt: 0 }
    }).sort({ invoiceDate: 1 });

    const today = new Date();

    return invoices.map((inv) => {
      const daysOverdue = Math.floor((today.getTime() - inv.invoiceDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        customerName: inv.customerName,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        invoiceTotal: inv.finalTotal,
        paidAmount: inv.paidAmount,
        outstanding: inv.outstandingAmount,
        daysOverdue
      };
    });
  }

  async getGstReport(startDate: Date, endDate: Date): Promise<IGstReport[]> {
    const invoices = await Invoice.find({
      invoiceDate: { $gte: startDate, $lte: endDate },
      status: 'finalized'
    }).sort({ invoiceDate: 1 });

    return invoices.map((inv) => ({
      date: inv.invoiceDate,
      invoiceNumber: inv.invoiceNumber,
      taxableValue: inv.taxableValue,
      cgst: inv.taxBreakdown.cgst,
      sgst: inv.taxBreakdown.sgst,
      igst: inv.taxBreakdown.igst
    }));
  }

  async getCustomerWiseSales(startDate: Date, endDate: Date): Promise<any[]> {
    const invoices = await Invoice.find({
      invoiceDate: { $gte: startDate, $lte: endDate },
      status: 'finalized'
    });

    const customerMap = new Map<string, any>();

    invoices.forEach((inv) => {
      const key = inv.customerId?.toString() || inv.customerName;
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          customerName: inv.customerName,
          customerId: inv.customerId,
          invoices: [],
          totalSales: 0,
          totalTax: 0
        });
      }

      const customer = customerMap.get(key)!;
      customer.invoices.push(inv.invoiceNumber);
      customer.totalSales += inv.finalTotal;
      customer.totalTax += inv.taxBreakdown.total;
    });

    return Array.from(customerMap.values()).sort((a, b) => b.totalSales - a.totalSales);
  }
}

export const reportService = new ReportService();