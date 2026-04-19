'use strict';

const CLAIM_STATUSES = Object.freeze([
  'pending',
  'under_review',
  'expert_assigned',
  'reported',
  'approved',
  'rejected',
  'closed',
]);

const CLAIM_STATUS_TRANSITIONS = Object.freeze({
  pending: Object.freeze(['under_review']),
  under_review: Object.freeze(['expert_assigned']),
  expert_assigned: Object.freeze(['reported']),
  reported: Object.freeze(['approved', 'rejected']),
  approved: Object.freeze(['closed']),
  rejected: Object.freeze([]),
  closed: Object.freeze([]),
});

function isValidClaimStatus(status) {
  return CLAIM_STATUSES.includes(status);
}

function getAllowedClaimTransitions(status) {
  return CLAIM_STATUS_TRANSITIONS[status] || [];
}

function createClaimStatusError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function assertValidClaimStatus(status) {
  if (isValidClaimStatus(status)) {
    return;
  }

  throw createClaimStatusError(
    `Invalid claim status '${status}'. Allowed statuses: ${CLAIM_STATUSES.join(', ')}`,
    400
  );
}

function assertClaimStatusTransition(currentStatus, nextStatus) {
  if (!isValidClaimStatus(currentStatus)) {
    throw createClaimStatusError(
      `Claim has unsupported current status '${currentStatus}'`,
      500
    );
  }

  assertValidClaimStatus(nextStatus);

  const allowed = getAllowedClaimTransitions(currentStatus);
  if (allowed.includes(nextStatus)) {
    return;
  }

  throw createClaimStatusError(
    `Cannot transition from '${currentStatus}' to '${nextStatus}'. Allowed: ${allowed.join(', ') || 'none'}`,
    409
  );
}

module.exports = {
  CLAIM_STATUSES,
  CLAIM_STATUS_TRANSITIONS,
  isValidClaimStatus,
  getAllowedClaimTransitions,
  assertValidClaimStatus,
  assertClaimStatusTransition,
};
