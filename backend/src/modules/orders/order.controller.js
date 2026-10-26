import { z } from 'zod';
import { OrderService } from './order.service.js';

export const updateOrderStatusSchema = z.object({
  status: z.enum(['ACKNOWLEDGED', 'FULFILLED'], {
    errorMap: () => ({ message: 'Status must be ACKNOWLEDGED or FULFILLED' }),
  }),
});

export class OrderController {
  static async list(req, res, next) {
    try {
      const orders = await OrderService.getOrdersForUser(req.user);
      res.status(200).json({
        success: true,
        data: { orders, count: orders.length },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const order = await OrderService.getOrderById(req.params.id, req.user);
      res.status(200).json({
        success: true,
        data: { order },
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const order = await OrderService.updateStatus(
        req.params.id,
        req.body.status,
        req.user
      );
      res.status(200).json({
        success: true,
        message: `Order status updated to ${req.body.status}`,
        data: { order },
      });
    } catch (err) {
      next(err);
    }
  }
}
