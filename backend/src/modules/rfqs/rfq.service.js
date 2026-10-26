import { RFQ } from './rfq.model.js';
import { RFQStateMachine, RFQ_STATUS } from './rfq.state-machine.js';
import { Quotation } from '../quotations/quotation.model.js';
import { Order } from '../orders/order.model.js';
import { AppError } from '../../middleware/error.middleware.js';
import { AuditService } from '../audit/audit.service.js';

export class RFQService {
  /**
   * Create new RFQ in DRAFT state
   */
  static async createRFQ(buyerId, data) {
    const rfq = await RFQ.create({
      ...data,
      buyer_id: buyerId,
      status: RFQ_STATUS.DRAFT,
    });

    await AuditService.record({
      entity_type: 'RFQ',
      entity_id: rfq._id,
      action: 'CREATE_DRAFT',
      from_state: null,
      to_state: RFQ_STATUS.DRAFT,
      performed_by: buyerId,
      notes: `Draft RFQ created with requested quantity: ${data.quantity} ${data.unit}`,
    });

    return rfq;
  }

  /**
   * Publish RFQ (DRAFT -> OPEN)
   */
  static async publishRFQ(rfqId, buyerId) {
    const rfq = await RFQ.findById(rfqId);
    if (!rfq) throw new AppError('RFQ not found', 404, 'NOT_FOUND');

    if (rfq.buyer_id.toString() !== buyerId.toString()) {
      throw new AppError('Forbidden: Only the creating buyer can publish this RFQ', 403, 'FORBIDDEN');
    }

    if (new Date() >= new Date(rfq.deadline)) {
      throw new AppError('Cannot publish an RFQ with an expired deadline', 400, 'DEADLINE_EXPIRED');
    }

    RFQStateMachine.validateTransition(rfq.status, RFQ_STATUS.OPEN);

    const oldStatus = rfq.status;
    rfq.status = RFQ_STATUS.OPEN;
    await rfq.save();

    await AuditService.record({
      entity_type: 'RFQ',
      entity_id: rfq._id,
      action: 'PUBLISH',
      from_state: oldStatus,
      to_state: RFQ_STATUS.OPEN,
      performed_by: buyerId,
      notes: `RFQ published to suppliers in ${rfq.region}. Deadline: ${rfq.deadline.toISOString()}`,
    });

    return rfq;
  }

  /**
   * Cancel RFQ
   */
  static async cancelRFQ(rfqId, buyerId) {
    const rfq = await RFQ.findById(rfqId);
    if (!rfq) throw new AppError('RFQ not found', 404, 'NOT_FOUND');

    if (rfq.buyer_id.toString() !== buyerId.toString()) {
      throw new AppError('Forbidden: Only the creating buyer can cancel this RFQ', 403, 'FORBIDDEN');
    }

    RFQStateMachine.validateTransition(rfq.status, RFQ_STATUS.CANCELLED);

    const oldStatus = rfq.status;
    rfq.status = RFQ_STATUS.CANCELLED;
    await rfq.save();

    await AuditService.record({
      entity_type: 'RFQ',
      entity_id: rfq._id,
      action: 'CANCEL',
      from_state: oldStatus,
      to_state: RFQ_STATUS.CANCELLED,
      performed_by: buyerId,
      notes: 'RFQ cancelled by buyer',
    });

    return rfq;
  }

  /**
   * List RFQs tailored to user role and region
   */
  static async getRFQs(user, query = {}) {
    const filter = {};

    if (user.role === 'BUYER') {
      filter.buyer_id = user.id;
    } else if (user.role === 'VENDOR') {
      filter.status = { $in: [RFQ_STATUS.OPEN, RFQ_STATUS.UNDER_REVIEW, RFQ_STATUS.APPROVED, RFQ_STATUS.PO_ISSUED] };

      if (query.region) {
        filter.region = new RegExp(query.region, 'i');
      }
      if (query.category) {
        filter.category = new RegExp(query.category, 'i');
      }
    }

    if (query.status && user.role !== 'VENDOR') {
      filter.status = query.status;
    }

    const rfqs = await RFQ.find(filter)
      .populate('buyer_id', 'name email organization region')
      .populate('selected_vendor_id', 'name organization region')
      .sort({ createdAt: -1 });

    return rfqs;
  }

  /**
   * Fetch single RFQ with relations & strict cross-organization authorization
   */
  static async getRFQById(rfqId, user) {
    const rfq = await RFQ.findById(rfqId)
      .populate('buyer_id', 'name email organization region')
      .populate('selected_vendor_id', 'name email organization region');

    if (!rfq) throw new AppError('RFQ not found', 404, 'NOT_FOUND');

    // Ownership check: Buyers can only inspect their own RFQs
    if (user.role === 'BUYER' && rfq.buyer_id._id.toString() !== user.id.toString()) {
      throw new AppError('Forbidden: You do not have permission to view this RFQ', 403, 'FORBIDDEN');
    }

    // Vendors cannot view unpromoted draft RFQs
    if (user.role === 'VENDOR' && rfq.status === RFQ_STATUS.DRAFT) {
      throw new AppError('Forbidden: Draft RFQs are not accessible to suppliers', 403, 'FORBIDDEN');
    }

    return rfq;
  }

  /**
   * Buyer selects winning quotation -> transitions to APPROVED
   */
  static async selectVendor(rfqId, quotationId, buyerId) {
    const rfq = await RFQ.findById(rfqId);
    if (!rfq) throw new AppError('RFQ not found', 404, 'NOT_FOUND');

    if (rfq.buyer_id.toString() !== buyerId.toString()) {
      throw new AppError('Forbidden: Only the RFQ owner can select a vendor', 403, 'FORBIDDEN');
    }

    const quotation = await Quotation.findOne({ _id: quotationId, rfq_id: rfqId }).populate('vendor_id');
    if (!quotation) {
      throw new AppError('Quotation not found or does not belong to this RFQ', 404, 'NOT_FOUND');
    }

    const totalAmount = quotation.evaluated_total_price;
    const targetStatus = RFQStateMachine.determineSelectionTargetStatus();
    RFQStateMachine.validateTransition(rfq.status, targetStatus);

    const oldStatus = rfq.status;
    rfq.status = targetStatus;
    rfq.selected_quotation_id = quotation._id;
    rfq.selected_vendor_id = quotation.vendor_id._id;
    rfq.selected_total_amount = totalAmount;
    await rfq.save();

    // Mark winning quotation as ACCEPTED and others as REJECTED
    await Quotation.updateMany({ rfq_id: rfqId, _id: { $ne: quotation._id } }, { status: 'REJECTED' });
    quotation.status = 'ACCEPTED';
    await quotation.save();

    await AuditService.record({
      entity_type: 'RFQ',
      entity_id: rfq._id,
      action: 'SELECT_VENDOR',
      from_state: oldStatus,
      to_state: targetStatus,
      performed_by: buyerId,
      notes: `Selected vendor ${quotation.vendor_id.name} (${quotation.vendor_id.organization}). Total evaluated spend: ₹${totalAmount.toLocaleString()}`,
    });

    return { rfq, quotation };
  }

  /**
   * Generates formal Purchase Order from APPROVED RFQ
   */
  static async generatePO(rfqId, buyerId) {
    const rfq = await RFQ.findById(rfqId)
      .populate('buyer_id')
      .populate('selected_vendor_id')
      .populate('selected_quotation_id');

    if (!rfq) throw new AppError('RFQ not found', 404, 'NOT_FOUND');

    // Strict ownership verification
    if (rfq.buyer_id._id.toString() !== buyerId.toString()) {
      throw new AppError('Forbidden: Only the creating buyer can issue a Purchase Order for this RFQ', 403, 'FORBIDDEN');
    }

    // Check if PO already exists (idempotency check)
    const existingPO = await Order.findOne({ rfq_id: rfq._id });
    if (existingPO) {
      return existingPO;
    }

    // State machine verification: MUST be in APPROVED state
    RFQStateMachine.validateTransition(rfq.status, RFQ_STATUS.PO_ISSUED);

    if (!rfq.selected_quotation_id || !rfq.selected_vendor_id) {
      throw new AppError('Cannot generate PO without an approved vendor quotation', 422, 'NO_VENDOR_SELECTED');
    }

    // Generate unique PO Number
    const count = await Order.countDocuments();
    const year = new Date().getFullYear();
    const sequence = String(count + 1).padStart(4, '0');
    const poNumber = `PO-${year}-${sequence}`;

    const quote = rfq.selected_quotation_id;
    const deliveryDeadline = new Date(Date.now() + (quote.lead_time_days || 7) * 24 * 60 * 60 * 1000);

    let order;
    try {
      order = await Order.create({
        po_number: poNumber,
        rfq_id: rfq._id,
        quotation_id: quote._id,
        buyer_id: rfq.buyer_id._id,
        vendor_id: rfq.selected_vendor_id._id,
        item_details: {
          title: rfq.title,
          category: rfq.category,
          quantity: rfq.quantity,
          unit: rfq.unit,
          unit_price: quote.evaluated_unit_price,
          total_amount: quote.evaluated_total_price,
        },
        total_amount: quote.evaluated_total_price,
        delivery_deadline: deliveryDeadline,
        terms: 'Standard MSME Commercial Terms: Net 30 days upon inspection & delivery.',
        status: 'ISSUED',
      });
    } catch (err) {
      // Concurrency race: If another concurrent request just created this PO, return it safely
      if (err.code === 11000) {
        const racePO = await Order.findOne({ rfq_id: rfq._id });
        if (racePO) return racePO;
      }
      throw err;
    }

    const oldStatus = rfq.status;
    rfq.status = RFQ_STATUS.PO_ISSUED;
    await rfq.save();

    await AuditService.record({
      entity_type: 'RFQ',
      entity_id: rfq._id,
      action: 'GENERATE_PO',
      from_state: oldStatus,
      to_state: RFQ_STATUS.PO_ISSUED,
      performed_by: buyerId,
      notes: `Purchase order ${poNumber} issued for total amount ₹${quote.evaluated_total_price.toLocaleString()}`,
    });

    return order;
  }

  /**
   * Fetch chronological timeline for RFQ
   */
  static async getTimeline(rfqId, user) {
    const rfq = await RFQ.findById(rfqId);
    if (!rfq) throw new AppError('RFQ not found', 404, 'NOT_FOUND');

    if (user.role === 'BUYER' && rfq.buyer_id.toString() !== user.id.toString()) {
      throw new AppError('Forbidden: Cannot view timeline for another organization RFQ', 403, 'FORBIDDEN');
    }

    return AuditService.getTimeline('RFQ', rfqId);
  }
}
