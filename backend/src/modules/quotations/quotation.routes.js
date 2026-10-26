import { Router } from 'express';
import {
  QuotationController,
  submitQuotationSchema,
  previewSlabsSchema,
} from './quotation.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';

const router = Router();

// Live slab calculation preview (available to all authenticated users)
router.post(
  '/preview',
  authenticate,
  validate(previewSlabsSchema),
  QuotationController.preview
);

// Get quotes for an RFQ
router.get(
  '/rfq/:rfqId',
  authenticate,
  QuotationController.listByRFQ
);

// Submit quotation against RFQ (Vendors only)
router.post(
  '/rfq/:rfqId',
  authenticate,
  requireRole('VENDOR'),
  validate(submitQuotationSchema),
  QuotationController.submit
);

export default router;
