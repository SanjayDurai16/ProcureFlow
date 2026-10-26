import { z } from 'zod';
import { QuotationService } from './quotation.service.js';

const slabSchema = z.object({
  min_qty: z.number().int().min(1, 'Min quantity must be >= 1'),
  max_qty: z.number().int().min(1).nullable().optional(),
  unit_price: z.number().positive('Unit price must be greater than 0'),
});

export const submitQuotationSchema = z.object({
  slabs: z.array(slabSchema).min(1, 'At least one slab is required'),
  lead_time_days: z.number().int().min(1, 'Lead time must be at least 1 day'),
  validity_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Validity date must be a valid date string',
  }),
  notes: z.string().optional(),
});

export const previewSlabsSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  slabs: z.array(slabSchema).min(1, 'At least one slab is required'),
});

export class QuotationController {
  static async submit(req, res, next) {
    try {
      const quotation = await QuotationService.submitQuotation(
        req.user.id,
        req.params.rfqId,
        req.body
      );
      res.status(201).json({
        success: true,
        message: 'Quotation submitted successfully',
        data: { quotation },
      });
    } catch (err) {
      next(err);
    }
  }

  static async listByRFQ(req, res, next) {
    try {
      const result = await QuotationService.getQuotationsForRFQ(
        req.params.rfqId,
        req.user
      );
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async preview(req, res, next) {
    try {
      const { quantity, slabs } = req.body;
      const result = QuotationService.calculatePreview(quantity, slabs);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
