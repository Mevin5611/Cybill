import { Router } from 'express';
import { BusinessSettings } from '../models/BusinessSettings.js';
import { businessSettingsSchema } from '../validators/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getFeatureMap } from '../services/features.js';

const router = Router();

// Get settings
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    let settings = await BusinessSettings.findOne();

    if (!settings) {
      settings = new BusinessSettings({
        businessName: 'FurniBill Store',
        businessAddress: 'Address',
        businessPhone: '+91-0000000000',
        gstin: '',
        state: 'KL'
      });
      await settings.save();
    }

    res.json({
      status: 'success',
      data: settings.toObject()
    });
  })
);

// Which features the admin has enabled (used by the Settings UI)
router.get(
  '/features',
  asyncHandler(async (_req, res) => {
    res.json({
      status: 'success',
      data: await getFeatureMap()
    });
  })
);

// Update settings
router.put(
  '/',
  asyncHandler(async (req, res) => {
    const data = businessSettingsSchema.parse(req.body);

    let settings = await BusinessSettings.findOne();

    if (!settings) {
      settings = new BusinessSettings(data);
    } else {
      settings.set(data);

      // Make sure nested objects are written even if Mongoose
      // does not detect the change on its own.
      if (data.bankDetails) settings.markModified('bankDetails');
      if (data.payment) settings.markModified('payment');
    }

    await settings.save();

    res.json({
      status: 'success',
      data: settings.toObject()
    });
  })
);

export default router;