import { AppError } from '../../middleware/error.middleware.js';

export const RFQ_STATUS = {
  DRAFT: 'DRAFT',
  OPEN: 'OPEN',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  PO_ISSUED: 'PO_ISSUED',
  CANCELLED: 'CANCELLED',
};

// Transition table: currentStatus -> array of allowed next states
export const ALLOWED_TRANSITIONS = {
  [RFQ_STATUS.DRAFT]: [RFQ_STATUS.OPEN, RFQ_STATUS.CANCELLED],
  [RFQ_STATUS.OPEN]: [RFQ_STATUS.UNDER_REVIEW, RFQ_STATUS.APPROVED, RFQ_STATUS.CANCELLED],
  [RFQ_STATUS.UNDER_REVIEW]: [RFQ_STATUS.APPROVED, RFQ_STATUS.CANCELLED],
  [RFQ_STATUS.APPROVED]: [RFQ_STATUS.PO_ISSUED, RFQ_STATUS.CANCELLED],
  [RFQ_STATUS.PO_ISSUED]: [], // Terminal state
  [RFQ_STATUS.CANCELLED]: [], // Terminal state
};

export class RFQStateMachine {
  /**
   * Validates if a transition from currentStatus to targetStatus is permitted.
   * Throws AppError(422) if transition is invalid.
   */
  static validateTransition(currentStatus, targetStatus) {
    if (!ALLOWED_TRANSITIONS[currentStatus]) {
      throw new AppError(
        `Unknown or unsupported source state: '${currentStatus}'`,
        422,
        'UNKNOWN_STATE'
      );
    }

    const allowed = ALLOWED_TRANSITIONS[currentStatus];
    if (!allowed.includes(targetStatus)) {
      throw new AppError(
        `Illegal state transition: Cannot move RFQ from '${currentStatus}' to '${targetStatus}'. Allowed transitions: [${allowed.join(', ') || 'None (Terminal)'}]`,
        422,
        'INVALID_STATE_TRANSITION'
      );
    }

    return true;
  }

  /**
   * Determines next status upon vendor selection (direct approval for buyer).
   */
  static determineSelectionTargetStatus() {
    return RFQ_STATUS.APPROVED;
  }
}
