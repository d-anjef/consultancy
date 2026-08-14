import { describe, it, expect } from 'vitest';
import {
  LEAD_STATUS_TRANSITIONS,
  APPLICATION_STATUS_TRANSITIONS,
  DOCUMENT_STATUS_TRANSITIONS,
  COUNSELING_STATUS_TRANSITIONS,
  TASK_STATUS_TRANSITIONS,
} from '@consultancy/config';

describe('Lead State Machine', () => {
  it('NEW leads can transition to CONTACTED', () => {
    expect(LEAD_STATUS_TRANSITIONS.NEW).toContain('CONTACTED');
  });

  it('CONVERTED is terminal', () => {
    expect(LEAD_STATUS_TRANSITIONS.CONVERTED).toEqual([]);
  });

  it('LOST is terminal', () => {
    expect(LEAD_STATUS_TRANSITIONS.LOST).toEqual([]);
  });
});

describe('Application State Machine', () => {
  it('DRAFT can transition to REGISTERED', () => {
    expect(APPLICATION_STATUS_TRANSITIONS.DRAFT).toContain('REGISTERED');
  });

  it('DOCUMENT_VERIFICATION can move to FINAL_APPROVAL', () => {
    expect(APPLICATION_STATUS_TRANSITIONS.DOCUMENT_VERIFICATION).toContain(
      'FINAL_APPROVAL',
    );
  });

  it('APPROVED can transition to COMPLETED', () => {
    expect(APPLICATION_STATUS_TRANSITIONS.APPROVED).toContain('COMPLETED');
  });

  it('COMPLETED and REJECTED and CANCELLED are terminal', () => {
    expect(APPLICATION_STATUS_TRANSITIONS.COMPLETED).toEqual([]);
    expect(APPLICATION_STATUS_TRANSITIONS.REJECTED).toEqual([]);
    expect(APPLICATION_STATUS_TRANSITIONS.CANCELLED).toEqual([]);
  });
});

describe('Document State Machine', () => {
  it('SUBMITTED can go to UNDER_REVIEW', () => {
    expect(DOCUMENT_STATUS_TRANSITIONS.SUBMITTED).toContain('UNDER_REVIEW');
  });

  it('VERIFIED can go to APPROVED (final)', () => {
    expect(DOCUMENT_STATUS_TRANSITIONS.VERIFIED).toContain('APPROVED');
  });

  it('APPROVED is terminal', () => {
    expect(DOCUMENT_STATUS_TRANSITIONS.APPROVED).toEqual([]);
  });
});

describe('Counseling State Machine', () => {
  it('BOOKED can transition to attended states', () => {
    expect(COUNSELING_STATUS_TRANSITIONS.BOOKED).toContain('ATTENDED');
    expect(COUNSELING_STATUS_TRANSITIONS.BOOKED).toContain('NO_SHOW');
  });

  it('ATTENDED is terminal', () => {
    expect(COUNSELING_STATUS_TRANSITIONS.ATTENDED).toEqual([]);
  });
});

describe('Task State Machine', () => {
  it('OPEN can transition to IN_PROGRESS', () => {
    expect(TASK_STATUS_TRANSITIONS.OPEN).toContain('IN_PROGRESS');
  });

  it('COMPLETED is terminal', () => {
    expect(TASK_STATUS_TRANSITIONS.COMPLETED).toEqual([]);
  });
});