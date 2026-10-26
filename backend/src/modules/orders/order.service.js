import { Order } from './order.model.js';
import { AppError } from '../../middleware/error.middleware.js';
import { AuditService } from '../audit/audit.service.js';

const ALLOWED_ORDER_TRANSITIONS = {
  ISSUED: ['ACKNOWLEDGED'],
  ACKNOWLEDGED: ['FULFILLED'],
  FULFILLED: [],
};

export class OrderService {
  static async getOrderById(orderId, user) {
    const order = await Order.findById(orderId)
      .populate('buyer_id', 'name email organization region')
      .populate('vendor_id', 'name email organization region')
      .populate('rfq_id', 'rfq_number title description quantity unit')
      .populate('quotation_id', 'lead_time_days evaluated_unit_price evaluated_total_price');

    if (!order) throw new AppError('Purchase Order not found', 404, 'NOT_FOUND');

    // Strict access control: only the buyer or assigned vendor
    if (
      order.buyer_id._id.toString() !== user.id.toString() &&
      order.vendor_id._id.toString() !== user.id.toString()
    ) {
      throw new AppError('Unauthorized: You do not have permission to view this Purchase Order', 403, 'FORBIDDEN');
    }

    return order;
  }

  static async getOrdersForUser(user) {
    const filter = {};
    if (user.role === 'BUYER') {
      filter.buyer_id = user.id;
    } else if (user.role === 'VENDOR') {
      filter.vendor_id = user.id;
    }

    return Order.find(filter)
      .populate('buyer_id', 'name email organization region')
      .populate('vendor_id', 'name email organization region')
      .populate('rfq_id', 'rfq_number title quantity unit')
      .sort({ createdAt: -1 });
  }

  static async updateStatus(orderId, newStatus, user) {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Purchase Order not found', 404, 'NOT_FOUND');

    if (order.vendor_id.toString() !== user.id.toString()) {
      throw new AppError('Forbidden: Only the assigned vendor can update order fulfillment status', 403, 'FORBIDDEN');
    }

    const currentStatus = order.status;
    const allowed = ALLOWED_ORDER_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        `Invalid order status transition: Cannot change from '${currentStatus}' to '${newStatus}'. Allowed: [${allowed.join(', ') || 'Terminal'}]`,
        422,
        'INVALID_ORDER_TRANSITION'
      );
    }

    order.status = newStatus;
    await order.save();

    await AuditService.record({
      entity_type: 'ORDER',
      entity_id: order._id,
      action: newStatus === 'ACKNOWLEDGED' ? 'ACKNOWLEDGE_PO' : 'FULFILL_PO',
      from_state: currentStatus,
      to_state: newStatus,
      performed_by: user.id,
      notes: `Purchase order ${order.po_number} status updated to ${newStatus}`,
    });

    return order;
  }
}
