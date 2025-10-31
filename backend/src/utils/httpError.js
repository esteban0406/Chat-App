export class HttpError extends Error {
  constructor(status, message, { code, details, expose } = {}) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.expose = expose ?? status < 500;
  }
}

/**
 * Factory helper to align with Express error-handling expectations.
 * @param {number} status
 * @param {string} message
 * @param {{code?: string, details?: any, expose?: boolean}} [options]
 */
export const createHttpError = (status, message, options) => {
  return new HttpError(status, message, options);
};

/**
 * Helper for generating validation errors with consistent metadata.
 * @param {string} message
 * @param {any} [details]
 */
export const validationError = (message, details) =>
  createHttpError(400, message, { code: "VALIDATION_ERROR", details });
