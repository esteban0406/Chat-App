import jwt from "jsonwebtoken";
import User from "../services/user/User.model.js";
import logger from "./logger.js";
import { fail } from "./response.js";

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
  const message =
    error.expose || status < 500
      ? error.message
      : "Internal server error";

  fail(response, {
    status,
    message,
    code,
    details: error.details,
  });
};

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return fail(res, { status: 401, message: "No token provided", code: "AUTH_REQUIRED" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Busca al usuario en la DB y lo guarda en req.user
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return fail(res, { status: 401, message: "Usuario no encontrado", code: "USER_NOT_FOUND" });
    }

    next();
  } catch (err) {
    fail(res, { status: 401, message: "Token inválido o expirado", code: "INVALID_TOKEN" });
  }
};
