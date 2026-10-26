import { z } from 'zod';
import { RFQService } from './rfq.service.js';

export const createRFQSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  category: z.string().trim().min(2, 'Category is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unit: z.string().trim().min(1, 'Unit of measurement is required'),
  region: z.string().trim().min(2, 'Region is required'),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)) && new Date(val) > new Date(), {
    message: 'Deadline must be a future date',
  }),
});

export const selectVendorSchema = z.object({
  quotationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Quotation ID format'),
});

export class RFQController {
  static async create(req, res, next) {
    try {
      const rfq = await RFQService.createRFQ(req.user.id, req.body);
      res.status(201).json({
        success: true,
        message: 'RFQ created in DRAFT state',
        data: { rfq },
      });
    } catch (err) {
      next(err);
    }
  }

  static async list(req, res, next) {
    try {
      const rfqs = await RFQService.getRFQs(req.user, req.query);
      res.status(200).json({
        success: true,
        data: { rfqs, count: rfqs.length },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const rfq = await RFQService.getRFQById(req.params.id, req.user);
      res.status(200).json({
        success: true,
        data: { rfq },
      });
    } catch (err) {
      next(err);
    }
  }

  static async publish(req, res, next) {
    try {
      const rfq = await RFQService.publishRFQ(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        message: 'RFQ published successfully',
        data: { rfq },
      });
    } catch (err) {
      next(err);
    }
  }

  static async cancel(req, res, next) {
    try {
      const rfq = await RFQService.cancelRFQ(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        message: 'RFQ cancelled successfully',
        data: { rfq },
      });
    } catch (err) {
      next(err);
    }
  }

  static async selectVendor(req, res, next) {
    try {
      const result = await RFQService.selectVendor(
        req.params.id,
        req.body.quotationId,
        req.user.id
      );
      res.status(200).json({
        success: true,
        message: 'Vendor quotation selected and approved.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async generatePO(req, res, next) {
    try {
      const order = await RFQService.generatePO(req.params.id, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Purchase Order generated successfully',
        data: { order },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getTimeline(req, res, next) {
    try {
      const timeline = await RFQService.getTimeline(req.params.id, req.user);
      res.status(200).json({
        success: true,
        data: { timeline },
      });
    } catch (err) {
      next(err);
    }
  }
}
