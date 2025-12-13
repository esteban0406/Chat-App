import logger from "./logger.js";
import { fail } from "./response.js";
import { fromNodeHeaders } from "better-auth/node";
import { getBetterAuth } from "../auth/betterAuth.js";

export const requestLogger = (request, response, next) => {
  logger.info("Method:", request.method);
  logger.info("Path:  ", request.path);
  logger.info("Body:  ", request.body);
  logger.info("Time: ", new Date().toISOString());
  logger.info("---");
  next();
};

export const unknownEndpoint = (request, response) =>
  fail(response, { status: 404, message: "Unknown endpoint", code: "NOT_FOUND" });

export const errorHandler = (error, request, response, next) => {
  logger.error(error.message, error);

  const status = error.status || 500;
  const code = error.code || (status === 500 ? "INTERNAL_ERROR" : undefined);
  const message = error.expose || status < 500 ? error.message : "Internal server error";

  fail(response, {
    status,
    message,
    code,
    details: error.details,
  });
};

export const authMiddleware = async (req, res, next) => {
  try {
    const { auth } = await getBetterAuth();
    const sessionResult = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    const payload = "data" in sessionResult ? sessionResult.data : sessionResult;
    const sessionUser =
      payload?.user ??
      payload?.session?.user ??
      payload?.data?.user ??
      payload?.session?.data?.user;

    if (!sessionUser) {
      return fail(res, { status: 401, message: "Not authenticated", code: "AUTH_REQUIRED" });
    }

    req.user = {
      ...sessionUser,
      _id: sessionUser.id ?? sessionUser._id,
    };
    req.session = payload?.session ?? payload?.data?.session ?? payload;

    next();
  } catch (err) {
    fail(res, { status: 401, message: "Token invalido o expirado", code: "INVALID_TOKEN" });
  }
};
