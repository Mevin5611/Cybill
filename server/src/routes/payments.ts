import { Router } from 'express';
import { paymentService } from '../services/paymentService.js';
import { recordPaymentSchema } from '../validators/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Record payment
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = recordPaymentSchema.parse(req.body);
    const result = await paymentService.recordPayment(data);

    res.status(201).json({
      status: 'success',
      data: result
    });
  })
);

// Get payment
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const payment = await paymentService.getPayment(req.params.id);

    res.json({
      status: 'success',
      data: payment
    });
  })
);

// List payments
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { customerId, startDate, endDate, method, page, limit } = req.query;

    const filters: any = {};
    if (customerId) filters.customerId = customerId;
    if (method) filters.method = method;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (page) filters.page = parseInt(page as string, 10);
    if (limit) filters.limit = parseInt(limit as string, 10);

    const result = await paymentService.listPayments(filters);

    res.json({
      status: 'success',
      data: result.payments,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total: result.total
      }
    });
  })
);

export default router;