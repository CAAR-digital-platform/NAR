const applicationModel = require('../models/applicationModel');

// ─── Valid status values ───────────────────────────────────────────────────
const VALID_STATUSES = ['pending', 'reviewed', 'accepted', 'rejected'];

/**
 * Submit a new job application.
 * Validates required fields before writing to DB.
 */
async function submitApplication({
  first_name,
  last_name,
  email,
  phone,
  field_of_interest,
  position_sought,
  message,
  cv_file,
}) {
  // Required fields
  const missing = [];
  if (!first_name) missing.push('first_name');
  if (!last_name)  missing.push('last_name');
  if (!email)      missing.push('email');

  if (missing.length > 0) {
    const err = new Error(`Missing required fields: ${missing.join(', ')}`);
    err.status = 400;
    throw err;
  }

  // Basic email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const err = new Error('Invalid email format');
    err.status = 400;
    throw err;
  }

  // Name length guards
  if (first_name.trim().length < 2 || last_name.trim().length < 2) {
    const err = new Error('First name and last name must each be at least 2 characters');
    err.status = 400;
    throw err;
  }

  // Phone format — Algerian format: 10 digits, starts with 0
  if (phone) {
    const phoneRegex = /^0[567]\d{8}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      const err = new Error('Invalid phone number format (expected: 0XXXXXXXXX)');
      err.status = 400;
      throw err;
    }
  }

  const newId = await applicationModel.createApplication({
    first_name:       first_name.trim(),
    last_name:        last_name.trim(),
    email:            email.trim().toLowerCase(),
    phone:            phone            ? phone.replace(/\s/g, '') : null,
    field_of_interest: field_of_interest ? field_of_interest.trim() : null,
    position_sought:   position_sought   ? position_sought.trim()   : null,
    message:           message           ? message.trim()           : null,
    cv_file:           cv_file           || null,
  });

  return { application_id: newId };
}

/**
 * Retrieve all job applications (admin only).
 */
async function listApplications() {
  return applicationModel.getAllApplications();
}

/**
 * Retrieve a single application by id (admin only).
 */
async function getApplicationById(id) {
  const app = await applicationModel.getApplicationById(id);
  if (!app) {
    const err = new Error('Application not found');
    err.status = 404;
    throw err;
  }
  return app;
}

/**
 * Update the status of a job application (admin only).
 */
async function updateStatus(id, status) {
  if (!VALID_STATUSES.includes(status)) {
    const err = new Error(
      `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
    );
    err.status = 400;
    throw err;
  }

  const app = await applicationModel.getApplicationById(id);
  if (!app) {
    const err = new Error('Application not found');
    err.status = 404;
    throw err;
  }

  await applicationModel.updateApplicationStatus(id, status);
  return { application_id: id, status };
}

module.exports = {
  submitApplication,
  listApplications,
  getApplicationById,
  updateStatus,
};