const pool = require('../db');

/**
 * Insert a new job application.
 * Returns the insertId of the new record.
 */
async function createApplication({
  first_name,
  last_name,
  email,
  phone,
  field_of_interest,
  position_sought,
  message,
  cv_file,
}) {
  const [result] = await pool.execute(
    `INSERT INTO job_applications
       (first_name, last_name, email, phone, field_of_interest,
        position_sought, message, cv_file, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      first_name,
      last_name,
      email,
      phone    || null,
      field_of_interest || null,
      position_sought   || null,
      message  || null,
      cv_file  || null,
    ]
  );
  return result.insertId;
}

/**
 * Fetch all job applications, newest first.
 */
async function getAllApplications() {
  const [rows] = await pool.execute(
    `SELECT id, first_name, last_name, email, phone,
            field_of_interest, position_sought, message,
            cv_file, status, created_at
     FROM job_applications
     ORDER BY created_at DESC`
  );
  return rows;
}

/**
 * Fetch a single application by id.
 */
async function getApplicationById(id) {
  const [rows] = await pool.execute(
    `SELECT id, first_name, last_name, email, phone,
            field_of_interest, position_sought, message,
            cv_file, status, created_at
     FROM job_applications
     WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Update application status (pending → reviewed → accepted → rejected).
 */
async function updateApplicationStatus(id, status) {
  await pool.execute(
    'UPDATE job_applications SET status = ? WHERE id = ?',
    [status, id]
  );
}

module.exports = {
  createApplication,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
};