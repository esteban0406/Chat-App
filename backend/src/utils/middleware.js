import logger from "./logger.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const requestLogger = (request, response, next) => {
  logger.info("Method:", request.method);
  logger.info("Path:  ", request.path);
  logger.info("Body:  ", request.body);
  logger.info("Time: ", new Date().toISOString());
  logger.info("---");
  next();
};

export const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

export const errorHandler = (error, request, response, next) => {
  logger.error(error.message, error);

  next(error);
};

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Busca al usuario en la DB y lo guarda en req.user
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    next();
  } catch (err) {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
};
