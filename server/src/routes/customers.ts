import { Router } from 'express';
import { customerService } from '../services/customerService.js';
import { createCustomerSchema } from '../validators/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Create customer
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createCustomerSchema.parse(req.body);
    const customer = await customerService.createCustomer(data);

    res.status(201).json({
      status: 'success',
      data: customer
    });
  })
);

// Get customer
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const customer = await customerService.getCustomer(req.params.id);

    res.json({
      status: 'success',
      data: customer
    });
  })
);

// Update customer
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = createCustomerSchema.partial().parse(req.body);
    const customer = await customerService.updateCustomer(req.params.id, data);

    res.json({
      status: 'success',
      data: customer
    });
  })
);

// List customers
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { type, search, page, limit } = req.query;

    const filters: any = {};
    if (type) filters.type = type;
    if (search) filters.search = search;
    if (page) filters.page = parseInt(page as string, 10);
    if (limit) filters.limit = parseInt(limit as string, 10);

    const result = await customerService.listCustomers(filters);

    res.json({
      status: 'success',
      data: result.customers,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total: result.total
      }
    });
  })
);

// Get customer ledger
router.get(
  '/:id/ledger',
  asyncHandler(async (req, res) => {
    const ledger = await customerService.getCustomerLedger(req.params.id);

    res.json({
      status: 'success',
      data: ledger
    });
  })
);

export default router;