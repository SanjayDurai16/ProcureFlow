import { Quotation } from './quotation.model.js';
import { RFQ } from '../rfqs/rfq.model.js';
import { RFQ_STATUS } from '../rfqs/rfq.state-machine.js';
import { PricingEngine } from './pricing-engine.js';
import { AppError } from '../../middleware/error.middleware.js';
import { AuditService } from '../audit/audit.service.js';

export class QuotationService {
  /**
   * Vendor submits quotation with tiered slabs against open RFQ
   */
  static async submitQuotation(vendorId, rfqId, quoteData) {
    const rfq = await RFQ.findById(rfqId);
    if (!rfq) throw new AppError('RFQ not found', 404, 'NOT_FOUND');

    if (rfq.status !== RFQ_STATUS.OPEN) {
      throw new AppError(
        `Quotations can only be submitted for OPEN RFQs. Current status is '${rfq.status}'`,
        422,
        'RFQ_NOT_OPEN'
      );
    }

    if (new Date() >= new Date(rfq.deadline)) {
      throw new AppError('The quotation submission deadline for this RFQ has expired', 400, 'DEADLINE_EXPIRED');
    }

    // Evaluate pricing slabs against RFQ requested quantity
    const pricing = PricingEngine.calculatePrice(rfq.quantity, quoteData.slabs);

    // Upsert quotation for this vendor and RFQ (ensures a vendor can only mutate their own quote)
    let quotation = await Quotation.findOne({ rfq_id: rfqId, vendor_id: vendorId });
    const isUpdate = !!quotation;

    if (quotation) {
      quotation.slabs = quoteData.slabs;
      quotation.evaluated_unit_price = pricing.unitPrice;
      quotation.evaluated_total_price = pricing.totalPrice;
      quotation.lead_time_days = quoteData.lead_time_days;
      quotation.validity_date = quoteData.validity_date;
      quotation.notes = quoteData.notes || '';
      quotation.status = 'SUBMITTED';
      await quotation.save();
    } else {
      quotation = await Quotation.create({
        rfq_id: rfqId,
        vendor_id: vendorId,
        slabs: quoteData.slabs,
        evaluated_unit_price: pricing.unitPrice,
        evaluated_total_price: pricing.totalPrice,
        lead_time_days: quoteData.lead_time_days,
        validity_date: quoteData.validity_date,
        notes: quoteData.notes || '',
        status: 'SUBMITTED',
      });
    }

    await AuditService.record({
      entity_type: 'RFQ',
      entity_id: rfq._id,
      action: isUpdate ? 'UPDATE_QUOTE' : 'SUBMIT_QUOTE',
      from_state: rfq.status,
      to_state: rfq.status,
      performed_by: vendorId,
      notes: `Quotation ${isUpdate ? 'updated' : 'submitted'}: Evaluated price ₹${pricing.unitPrice}/unit, Total ₹${pricing.totalPrice.toLocaleString()} for ${rfq.quantity} ${rfq.unit}`,
    });

    return quotation;
  }

  /**
   * Retrieves quotes for an RFQ with comparative highlights & tie support
   */
  static async getQuotationsForRFQ(rfqId, user) {
    const rfq = await RFQ.findById(rfqId);
    if (!rfq) throw new AppError('RFQ not found', 404, 'NOT_FOUND');

    // Strict ownership verification:
    // Buyers can only see quotations for RFQs that belong to them
    if (user.role === 'BUYER' && rfq.buyer_id.toString() !== user.id.toString()) {
      throw new AppError('Forbidden: Cannot view quotations for an RFQ belonging to another organization', 403, 'FORBIDDEN');
    }

    // Vendors cannot view quotes for draft RFQs
    if (user.role === 'VENDOR' && rfq.status === RFQ_STATUS.DRAFT) {
      throw new AppError('Forbidden: Cannot view quotations for draft requirements', 403, 'FORBIDDEN');
    }

    let query = { rfq_id: rfqId };

    // Vendors can only see their own quote; Buyer sees all quotes for their RFQ
    if (user.role === 'VENDOR') {
      query.vendor_id = user.id;
    }

    const quotes = await Quotation.find(query)
      .populate('vendor_id', 'name email organization region')
      .sort({ evaluated_total_price: 1 });

    if (quotes.length === 0) {
      return { quotes: [], comparison: null };
    }

    // Determine comparative metadata with full tie handling
    let lowestPrice = Infinity;
    let fastestLeadTime = Infinity;

    quotes.forEach((q) => {
      if (q.evaluated_total_price < lowestPrice) {
        lowestPrice = q.evaluated_total_price;
      }
      if (q.lead_time_days < fastestLeadTime) {
        fastestLeadTime = q.lead_time_days;
      }
    });

    const lowestPriceQuoteIds = quotes
      .filter((q) => q.evaluated_total_price === lowestPrice)
      .map((q) => q._id.toString());

    const fastestDeliveryQuoteIds = quotes
      .filter((q) => q.lead_time_days === fastestLeadTime)
      .map((q) => q._id.toString());

    return {
      quotes,
      comparison: {
        totalQuotes: quotes.length,
        lowestPrice,
        lowestPriceQuoteIds,
        lowestPriceQuoteId: lowestPriceQuoteIds[0] || null, // Backward compatible
        fastestLeadTime,
        fastestDeliveryQuoteIds,
        fastestDeliveryQuoteId: fastestDeliveryQuoteIds[0] || null, // Backward compatible
        hasPriceTie: lowestPriceQuoteIds.length > 1,
        hasDeliveryTie: fastestDeliveryQuoteIds.length > 1,
      },
    };
  }

  /**
   * Live calculation helper for frontend quote builder
   */
  static calculatePreview(quantity, slabs) {
    return PricingEngine.calculatePrice(quantity, slabs);
  }
}
