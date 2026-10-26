import { describe, it, expect } from 'vitest';
import {
  RFQStateMachine,
  RFQ_STATUS,
} from '../../src/modules/rfqs/rfq.state-machine.js';
import { AppError } from '../../src/middleware/error.middleware.js';

describe('RFQStateMachine Unit Tests', () => {
  it('allows valid forward transitions in the happy path', () => {
    expect(RFQStateMachine.validateTransition(RFQ_STATUS.DRAFT, RFQ_STATUS.OPEN)).toBe(true);
    expect(RFQStateMachine.validateTransition(RFQ_STATUS.OPEN, RFQ_STATUS.UNDER_REVIEW)).toBe(true);
    expect(RFQStateMachine.validateTransition(RFQ_STATUS.OPEN, RFQ_STATUS.APPROVED)).toBe(true);
    expect(RFQStateMachine.validateTransition(RFQ_STATUS.UNDER_REVIEW, RFQ_STATUS.APPROVED)).toBe(true);
    expect(RFQStateMachine.validateTransition(RFQ_STATUS.APPROVED, RFQ_STATUS.PO_ISSUED)).toBe(true);
  });

  it('rejects jumping directly from DRAFT to PO_ISSUED', () => {
    expect(() =>
      RFQStateMachine.validateTransition(RFQ_STATUS.DRAFT, RFQ_STATUS.PO_ISSUED)
    ).toThrow(AppError);

    try {
      RFQStateMachine.validateTransition(RFQ_STATUS.DRAFT, RFQ_STATUS.PO_ISSUED);
    } catch (err) {
      expect(err.statusCode).toBe(422);
      expect(err.code).toBe('INVALID_STATE_TRANSITION');
    }
  });

  it('rejects transitions out of terminal PO_ISSUED state', () => {
    expect(() =>
      RFQStateMachine.validateTransition(RFQ_STATUS.PO_ISSUED, RFQ_STATUS.OPEN)
    ).toThrow(AppError);
  });

  it('rejects transitions out of terminal CANCELLED state', () => {
    expect(() =>
      RFQStateMachine.validateTransition(RFQ_STATUS.CANCELLED, RFQ_STATUS.APPROVED)
    ).toThrow(AppError);
  });

  it('determines APPROVED directly when vendor quotation is selected', () => {
    const targetStatus = RFQStateMachine.determineSelectionTargetStatus();
    expect(targetStatus).toBe(RFQ_STATUS.APPROVED);
  });
});
