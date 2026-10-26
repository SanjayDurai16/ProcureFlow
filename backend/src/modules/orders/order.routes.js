import { Router } from 'express';
import { OrderController, updateOrderStatusSchema } from './order.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';

const router = Router();

router.get('/', authenticate, OrderController.list);
router.get('/:id', authenticate, OrderController.getById);
router.patch(
  '/:id/status',
  authenticate,
  validate(updateOrderStatusSchema),
  OrderController.updateStatus
);

export default router;
