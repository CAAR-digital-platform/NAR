'use strict';

const ROADSIDE_REQUEST_STATUSES = Object.freeze([
  'pending',
  'dispatched',
  'on_site',
  'resolved',
  'closed',
]);

const ROADSIDE_REQUEST_TRANSITIONS = Object.freeze({
  pending: Object.freeze(['pending', 'dispatched', 'closed']),
  dispatched: Object.freeze(['dispatched', 'on_site', 'closed']),
  on_site: Object.freeze(['on_site', 'resolved', 'closed']),
  resolved: Object.freeze(['resolved', 'closed']),
  closed: Object.freeze(['closed']),
});

function isValidRoadsideRequestStatus(status) {
  return ROADSIDE_REQUEST_STATUSES.includes(status);
}

function getAllowedRoadsideRequestTransitions(status) {
  return ROADSIDE_REQUEST_TRANSITIONS[status] || [];
}

function createRoadsideStatusError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function assertValidRoadsideRequestStatus(status) {
  if (isValidRoadsideRequestStatus(status)) {
    return;
  }

  throw createRoadsideStatusError(
    `Invalid roadside request status '${status}'. Allowed statuses: ${ROADSIDE_REQUEST_STATUSES.join(', ')}`,
    400
  );
}

function assertRoadsideRequestStatusTransition(currentStatus, nextStatus) {
  if (!isValidRoadsideRequestStatus(currentStatus)) {
    throw createRoadsideStatusError(
      `Roadside request has unsupported current status '${currentStatus}'`,
      500
    );
  }

  assertValidRoadsideRequestStatus(nextStatus);

  const allowed = getAllowedRoadsideRequestTransitions(currentStatus);
  if (allowed.includes(nextStatus)) {
    return;
  }

  throw createRoadsideStatusError(
    `Cannot transition roadside request from '${currentStatus}' to '${nextStatus}'. Allowed: ${allowed.join(', ') || 'none'}`,
    409
  );
}

module.exports = {
  ROADSIDE_REQUEST_STATUSES,
  ROADSIDE_REQUEST_TRANSITIONS,
  isValidRoadsideRequestStatus,
  getAllowedRoadsideRequestTransitions,
  assertValidRoadsideRequestStatus,
  assertRoadsideRequestStatusTransition,
};
