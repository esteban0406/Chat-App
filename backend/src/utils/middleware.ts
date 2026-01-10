// src/utils/middleware.ts
import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import logger from "./logger.js";
import { fail } from "./response.js";
import { getBetterAuth } from "../auth/betterAuth.js";
import type { Session, User, AuthContext } from "../auth/betterAuth.types.js";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: User & { _id: string };
      session?: Session["session"];
      authContext?: AuthContext;
    }
  }
}

export const requestLogger = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  logger.info("Method:", request.method);
  logger.info("Path:  ", request.path);
  logger.info("Body:  ", request.body);
  logger.info("Time: ", new Date().toISOString());
  logger.info("---");
  next();
};

export const unknownEndpoint = (request: Request, response: Response) =>
  fail(response, { status: 404, message: "Unknown endpoint", code: "NOT_FOUND" });

export const errorHandler = (
  error: Error & { status?: number; code?: string; expose?: boolean; details?: unknown },
  request: Request,
  response: Response,
  next: NextFunction
) => {
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

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { auth } = await getBetterAuth();
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      return fail(res, { status: 401, message: "Not authenticated", code: "AUTH_REQUIRED" });
    }

    req.user = { ...session.user, _id: session.user.id };
    req.session = session.session;
    req.authContext = { headers: req.headers as Record<string, string | string[] | undefined> };

    next();
  } catch (err) {
    fail(res, { status: 401, message: "Token invalido o expirado", code: "INVALID_TOKEN" });
  }
};
