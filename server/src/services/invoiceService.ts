import type { IInvoice, IInvoiceItem } from "../../../shared/types/index.js";

import { Invoice } from "../models/Invoice.js";

import { PaymentAllocation } from "../models/Payment.js";

import { BusinessSettings } from "../models/BusinessSettings.js";

import { generateInvoiceNumber } from "../utils/invoiceNumbering.js";

import { calculateLineItemGst, calculateInvoiceTotal } from "../utils/gst.js";

import { AppError } from "../middleware/errorHandler.js";

export interface CreateInvoiceInput {
  customerType: "walk_in" | "registered";

  customerId?: string;

  customerName: string;
  customerPhone?: string;

  customerGstin?: string;
  customerState?: string;

  billingAddress?: string;
  vehicleNumber?: string;

  items: Array<{
    description: string;

    hsnCode?: string;
    unit?: string;

    quantity: number;
    unitPrice: number;

    discount: number;
    gstRate: number;

    pricingMode: "exclusive" | "inclusive";
  }>;

  discountAmount: number;
  otherCharges: number;

  paymentMethod?: string;
  notes?: string;
}

export class InvoiceService {
  // Shared validation + GST calculation used by both
  // create and update flows so the logic never drifts apart.
  private async buildInvoiceTotals(input: CreateInvoiceInput) {
    const settings = await BusinessSettings.findOne();

    if (!settings) {
      throw new AppError(500, "Business settings not configured");
    }

    if (!input.customerName?.trim()) {
      throw new AppError(400, "Customer name is required");
    }

    if (!input.items?.length) {
      throw new AppError(400, "At least one item is required");
    }

    const processedItems: IInvoiceItem[] = [];

    for (const item of input.items) {
      if (![0, 5, 12, 18, 28].includes(item.gstRate)) {
        throw new AppError(400, "Invalid GST rate");
      }

      let result;

      try {
        result = calculateLineItemGst({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          gstRate: item.gstRate,
          pricingMode: item.pricingMode || "exclusive",
        });
      } catch (error) {
        throw new AppError(
          400,
          error instanceof Error ? error.message : "Invalid item",
        );
      }

      processedItems.push({
        description: item.description,

        hsnCode: item.hsnCode,
        unit: item.unit || "PCS",

        quantity: item.quantity,
        unitPrice: item.unitPrice,

        discount: item.discount || 0,

        gstRate: item.gstRate,

        pricingMode: item.pricingMode || "exclusive",

        taxableAmount: result.taxableAmount,

        cgstRate: 0,
        sgstRate: 0,
        igstRate: 0,

        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,

        gstAmount: result.gstAmount,

        lineTotal: result.lineTotal,
      });
    }

    try {
      return calculateInvoiceTotal(
        {
          items: processedItems,
          discountAmount: input.discountAmount || 0,
          otherCharges: input.otherCharges || 0,
        },
        settings.state,
        input.customerState,
      );
    } catch (error) {
      throw new AppError(
        400,
        error instanceof Error ? error.message : "Invalid invoice calculation",
      );
    }
  }

  async createDraftInvoice(input: CreateInvoiceInput): Promise<IInvoice> {
    const totals = await this.buildInvoiceTotals(input);

    const invoiceNumber = await generateInvoiceNumber();

    const invoice = new Invoice({
      invoiceNumber,

      invoiceDate: new Date(),

      customerType: input.customerType,

      customerId: input.customerId || undefined,

      customerName: input.customerName,

      customerPhone: input.customerPhone,

      customerGstin: input.customerGstin,

      customerState: input.customerState,

      billingAddress: input.billingAddress,
      vehicleNumber: input.vehicleNumber?.trim() || undefined,

      items: totals.items,

      subtotal: totals.subtotal,

      discountAmount: input.discountAmount || 0,

      otherCharges: input.otherCharges || 0,

      taxableValue: totals.taxableValue,

      taxBreakdown: {
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        total: totals.totalTax,
      },

      roundingAdjustment: totals.roundingAdjustment,

      finalTotal: totals.finalTotal,

      paidAmount: 0,

      outstandingAmount: totals.finalTotal,

      status: "draft",

      paymentMethod: input.paymentMethod,

      notes: input.notes,
    });

    await invoice.save();

    return invoice.toObject() as IInvoice;
  }

  // Update a draft invoice in place. Only drafts can be
  // edited — once finalized, line items are locked and
  // only the paid amount can change (see updatePaidAmount).
  async updateDraftInvoice(
    invoiceId: string,
    input: CreateInvoiceInput,
  ): Promise<IInvoice> {
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      throw new AppError(404, "Invoice not found");
    }

    // if (invoice.status !== "draft") {
    //   throw new AppError(
    //     400,
    //     "Only draft invoices can be edited"
    //   );
    // }

    const totals = await this.buildInvoiceTotals(input);

    invoice.customerType = input.customerType;
    invoice.customerId = (input.customerId as any) || undefined;

    invoice.customerName = input.customerName;
    invoice.customerPhone = input.customerPhone;
    invoice.customerGstin = input.customerGstin;
    invoice.customerState = input.customerState;
    invoice.billingAddress = input.billingAddress;
    invoice.vehicleNumber = input.vehicleNumber?.trim() || undefined;

    invoice.items = totals.items;

    invoice.subtotal = totals.subtotal;
    invoice.discountAmount = input.discountAmount || 0;
    invoice.otherCharges = input.otherCharges || 0;

    invoice.taxableValue = totals.taxableValue;

    invoice.taxBreakdown = {
      cgst: totals.cgst,
      sgst: totals.sgst,
      igst: totals.igst,
      total: totals.totalTax,
    };

    invoice.roundingAdjustment = totals.roundingAdjustment;

    invoice.finalTotal = totals.finalTotal;

    // Drafts always carry zero paid amount until finalized.
    invoice.paidAmount = 0;
    invoice.outstandingAmount = totals.finalTotal;

    invoice.paymentMethod = input.paymentMethod;
    invoice.notes = input.notes;

    await invoice.save();

    return invoice.toObject() as IInvoice;
  }

  async finalizeInvoice(invoiceId: string, paidAmount = 0): Promise<IInvoice> {
    if (!Number.isFinite(paidAmount) || paidAmount < 0) {
      throw new AppError(400, "Invalid paid amount");
    }

    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      throw new AppError(404, "Invoice not found");
    }

    if (invoice.status !== "draft") {
      throw new AppError(400, "Only draft invoices can be finalized");
    }

    if (paidAmount > invoice.finalTotal) {
      throw new AppError(400, "Paid amount exceeds invoice total");
    }

    const result = await Invoice.findOneAndUpdate(
      {
        _id: invoiceId,
        status: "draft",
      },
      {
        $set: {
          status: "finalized",

          paidAmount: Number(paidAmount.toFixed(2)),

          outstandingAmount: Number(
            (invoice.finalTotal - paidAmount).toFixed(2),
          ),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!result) {
      throw new AppError(409, "Invoice already finalized");
    }

    return result.toObject() as IInvoice;
  }

  // Record / correct the amount paid against a finalized
  // invoice. Draft invoices don't carry a paid amount —
  // that's only set when the invoice is finalized.
  async updatePaidAmount(
    invoiceId: string,
    paidAmount: number,
  ): Promise<IInvoice> {
    if (!Number.isFinite(paidAmount) || paidAmount < 0) {
      throw new AppError(400, "Invalid paid amount");
    }

    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      throw new AppError(404, "Invoice not found");
    }

    if (invoice.status !== "finalized") {
      throw new AppError(
        400,
        "Only finalized invoices can have payments updated",
      );
    }

    if (paidAmount > invoice.finalTotal) {
      throw new AppError(400, "Paid amount exceeds invoice total");
    }

    invoice.paidAmount = Number(paidAmount.toFixed(2));

    invoice.outstandingAmount = Number(
      (invoice.finalTotal - paidAmount).toFixed(2),
    );

    await invoice.save();

    return invoice.toObject() as IInvoice;
  }

  async cancelInvoice(invoiceId: string, reason: string): Promise<IInvoice> {
    if (!reason?.trim()) {
      throw new AppError(400, "Cancellation reason is required");
    }

    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      throw new AppError(404, "Invoice not found");
    }

    if (invoice.status === "cancelled") {
      throw new AppError(400, "Invoice already cancelled");
    }

    if (invoice.paidAmount > 0) {
      throw new AppError(400, "Cannot cancel paid invoice");
    }

    const allocations = await PaymentAllocation.countDocuments({
      invoiceId,
    });

    if (allocations > 0) {
      throw new AppError(400, "Cannot cancel invoice with payments");
    }

    invoice.status = "cancelled";
    invoice.cancelledReason = reason;

    await invoice.save();

    return invoice.toObject() as IInvoice;
  }

  async getInvoice(id: string): Promise<IInvoice> {
    const invoice = await Invoice.findById(id).lean();

    if (!invoice) {
      throw new AppError(404, "Invoice not found");
    }

    return invoice as unknown as IInvoice;
  }

  async listInvoices(
    filters: {
      status?: string;
      customerId?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{
    invoices: IInvoice[];
    total: number;
  }> {
    const { status, customerId, startDate, endDate } = filters;

    const page = Math.max(1, filters.page || 1);

    const limit = Math.min(100, Math.max(1, filters.limit || 20));

    const query: Record<string, any> = {};

    if (status) {
      query.status = status;
    }

    if (customerId) {
      query.customerId = customerId;
    }

    if (startDate || endDate) {
      query.invoiceDate = {};

      if (startDate) {
        query.invoiceDate.$gte = startDate;
      }

      if (endDate) {
        query.invoiceDate.$lte = endDate;
      }
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .sort({
          invoiceDate: -1,
        })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Invoice.countDocuments(query),
    ]);

    return {
      invoices: invoices as unknown as IInvoice[],
      total,
    };
  }

  async searchInvoices(searchTerm: string): Promise<IInvoice[]> {
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const regex = new RegExp(escaped, "i");

    const invoices = await Invoice.find({
      $or: [
        { invoiceNumber: regex },
        { customerName: regex },
        { customerPhone: regex },
      ],
    })
      .sort({
        invoiceDate: -1,
      })
      .limit(10)
      .lean();

    return invoices as unknown as IInvoice[];
  }
}

export const invoiceService = new InvoiceService();
