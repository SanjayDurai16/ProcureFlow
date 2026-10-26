import { Router } from 'express';
import {
  RFQController,
  createRFQSchema,
  selectVendorSchema,
} from './rfq.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';

const router = Router();

// List RFQs (filtered based on user role)
router.get('/', authenticate, RFQController.list);

// Create RFQ in DRAFT (Buyers only)
router.post(
  '/',
  authenticate,
  requireRole('BUYER'),
  validate(createRFQSchema),
  RFQController.create
);

// Single RFQ details
router.get('/:id', authenticate, RFQController.getById);

// Publish RFQ (Buyers only)
router.patch('/:id/publish', authenticate, requireRole('BUYER'), RFQController.publish);

// Cancel RFQ (Buyers only)
router.patch('/:id/cancel', authenticate, requireRole('BUYER'), RFQController.cancel);

// Select winning quotation (Buyers only)
router.post(
  '/:id/select',
  authenticate,
  requireRole('BUYER'),
  validate(selectVendorSchema),
  RFQController.selectVendor
);

// Generate Purchase Order (Buyers only)
router.post(
  '/:id/generate-po',
  authenticate,
  requireRole('BUYER'),
  RFQController.generatePO
);

// Chronological RFQ Timeline
router.get('/:id/timeline', authenticate, RFQController.getTimeline);

export default router;
