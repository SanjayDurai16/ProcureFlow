import { AuditLog } from './audit.model.js';

export class AuditService {
  /**
   * Append-only record of a significant procurement milestone
   */
  static async record({
    entity_type,
    entity_id,
    action,
    from_state = null,
    to_state = null,
    performed_by,
    notes = '',
  }) {
    try {
      return await AuditLog.create({
        entity_type,
        entity_id,
        action,
        from_state,
        to_state,
        performed_by,
        notes,
      });
    } catch (err) {
      // Non-blocking logging failure
      console.error(`[Audit Log Error]: Failed to write ${action} event:`, err.message);
      return null;
    }
  }

  /**
   * Retrieve chronological timeline for an entity
   */
  static async getTimeline(entity_type, entity_id) {
    return AuditLog.find({ entity_type, entity_id })
      .populate('performed_by', 'name email role organization')
      .sort({ createdAt: 1 });
  }
}
