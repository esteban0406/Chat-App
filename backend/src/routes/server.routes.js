import express from "express";
import {
  createServer,
  joinServer,
  getServers,
  deleteServer,
} from "../controllers/server.controller.js";
import { authMiddleware } from "../utils/middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createServer);
router.get("/", authMiddleware, getServers);
router.post("/join", joinServer);
router.delete("/:serverId", authMiddleware, deleteServer);

export default router;
