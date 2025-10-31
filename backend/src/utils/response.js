/**
 * Centralized helpers for shaping HTTP JSON responses.
 * Use these helpers instead of calling res.json directly to keep payloads consistent.
 */

/**
 * Send a successful response with a consistent envelope.
 * @param {import("express").Response} res
 * @param {Object} [options]
 * @param {number} [options.status=200]
 * @param {string} [options.message="Success"]
 * @param {any} [options.data=null]
 */
export const ok = (res, { status = 200, message = "Success", data } = {}) => {
  const payload = {
    success: true,
    message,
  };

  if (data !== undefined) {
    payload.data = data;
  }

  return res.status(status).json(payload);
};

/**
 * Send an error response with a consistent envelope.
 * @param {import("express").Response} res
 * @param {Object} [options]
 * @param {number} [options.status=500]
 * @param {string} options.message
 * @param {string} [options.code]
 * @param {any} [options.details]
 */
export const fail = (res, { status = 500, message = "Internal server error", code, details } = {}) => {
  const payload = {
    success: false,
    message,
  };

  if (code !== undefined) {
    payload.code = code;
  }

  if (details !== undefined) {
    payload.details = details;
  }

  return res.status(status).json(payload);
};
