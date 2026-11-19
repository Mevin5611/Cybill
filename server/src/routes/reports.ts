import { Router } from 'express';
import { reportService } from '../services/reportService.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = Router();

// Dashboard statistics
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const stats = await reportService.getDashboardStats();

    res.json({
      status: 'success',
      data: stats
    });
  })
);

// Sales report
router.get(
  '/sales',
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new AppError(400, 'startDate and endDate are required');
    }

    const report = await reportService.getSalesReport(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      status: 'success',
      data: report
    });
  })
);

// Collections report
router.get(
  '/collections',
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new AppError(400, 'startDate and endDate are required');
    }

    const report = await reportService.getCollectionsReport(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      status: 'success',
      data: report
    });
  })
);

// Outstanding report
router.get(
  '/outstanding',
  asyncHandler(async (req, res) => {
    const report = await reportService.getOutstandingReport();

    res.json({
      status: 'success',
      data: report
    });
  })
);

// GST report
router.get(
  '/gst',
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new AppError(400, 'startDate and endDate are required');
    }

    const report = await reportService.getGstReport(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      status: 'success',
      data: report
    });
  })
);

// Customer-wise sales
router.get(
  '/customer-sales',
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new AppError(400, 'startDate and endDate are required');
    }

    const report = await reportService.getCustomerWiseSales(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      status: 'success',
      data: report
    });
  })
);

export default router;