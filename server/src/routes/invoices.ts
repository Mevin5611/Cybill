import { Router } from 'express';
import { invoiceService } from '../services/invoiceService.js';
import { createInvoiceSchema } from '../validators/index.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { generateInvoicePdf } from '../utils/pdf.js';
import { BusinessSettings } from '../models/BusinessSettings.js';
import type { IBusinessSettings } from '../../../shared/types/index.js';
import { getInvoicePaymentOptions } from '../services/features.js';

const router = Router();

// Save a draft invoice.
router.post(
  '/drafts',
  asyncHandler(async (req, res) => {
    const data = createInvoiceSchema.parse(req.body);
    const invoice = await invoiceService.createDraftInvoice(data);

    res.status(201).json({
      status: 'success',
      data: invoice,
    });
  })
);

// Create and finalize a bill in one request.
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { paidAmount = 0, ...invoicePayload } = req.body;

    const data = createInvoiceSchema.parse(invoicePayload);
    const payment = Number(paidAmount);

    if (!Number.isFinite(payment) || payment < 0) {
      throw new AppError(400, 'Paid amount must be a valid non-negative number');
    }

    const draft = await invoiceService.createDraftInvoice(data);

    const invoice = await invoiceService.finalizeInvoice(
      String(draft._id),
      payment
    );

    res.status(201).json({
      status: 'success',
      data: invoice,
    });
  })
);

// Update an existing draft invoice (full edit).
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = createInvoiceSchema.parse(req.body);
    const invoice = await invoiceService.updateDraftInvoice(req.params.id, data);
    res.json({ status: "success", data: invoice });
  })
);

// Finalize an existing draft.
router.post(
  '/:id/finalize',
  asyncHandler(async (req, res) => {
    const { paidAmount = 0 } = req.body;
    const payment = Number(paidAmount);

    if (!Number.isFinite(payment) || payment < 0) {
      throw new AppError(400, 'Paid amount must be a valid non-negative number');
    }

    const invoice = await invoiceService.finalizeInvoice(
      req.params.id,
      payment
    );

    res.json({
      status: 'success',
      data: invoice,
    });
  })
);

// Update the paid amount on a finalized invoice.
router.patch(
  '/:id/payment',
  asyncHandler(async (req, res) => {
    const { paidAmount } = req.body;
    const payment = Number(paidAmount);

    if (!Number.isFinite(payment) || payment < 0) {
      throw new AppError(400, 'Paid amount must be a valid non-negative number');
    }

    const invoice = await invoiceService.updatePaidAmount(
      req.params.id,
      payment
    );

    res.json({
      status: 'success',
      data: invoice,
    });
  })
);

// Cancel an invoice.
router.post(
  '/:id/cancel',
  asyncHandler(async (req, res) => {
    const { reason } = req.body;

    if (!reason) {
      throw new AppError(400, 'Cancellation reason is required');
    }

    const invoice = await invoiceService.cancelInvoice(
      req.params.id,
      reason
    );

    res.json({
      status: 'success',
      data: invoice,
    });
  })
);

// Search invoices. Keep this before generic GET /:id routes.
router.get(
  '/search/:term',
  asyncHandler(async (req, res) => {
    const invoices = await invoiceService.searchInvoices(req.params.term);

    res.json({
      status: 'success',
      data: invoices,
    });
  })
);

// Download invoice PDF.
router.get(
  '/:id/pdf',
  asyncHandler(async (req, res) => {
    const invoice = await invoiceService.getInvoice(req.params.id);

    const settings = await BusinessSettings
      .findOne()
      .lean<IBusinessSettings>();

    if (!settings) {
      throw new AppError(500, 'Business settings not configured');
    }

    // Admin feature flags + business preferences + data presence
    const paymentOptions = await getInvoicePaymentOptions(settings);

    const pdfStream = await generateInvoicePdf(
      invoice,
      settings,
      paymentOptions
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`
    );

    pdfStream.pipe(res);
  })
);
// Get one invoice.
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const invoice = await invoiceService.getInvoice(req.params.id);

    res.json({
      status: 'success',
      data: invoice,
    });
  })
);

// List invoices.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      status,
      customerId,
      startDate,
      endDate,
      page,
      limit,
    } = req.query;

    const filters: any = {};

    if (status) filters.status = status;
    if (customerId) filters.customerId = customerId;

    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }

    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }

    if (page) filters.page = parseInt(page as string, 10);
    if (limit) filters.limit = parseInt(limit as string, 10);

    const result = await invoiceService.listInvoices(filters);

    res.json({
      status: 'success',
      data: result.invoices,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total: result.total,
      },
    });
  })
);

export default router;