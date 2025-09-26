import express from "express";
import {
  createServer,
  joinServer,
  getServers,
  deleteServer,
  editServer,
  leaveServer
} from "../controllers/server.controller.js";
import { authMiddleware } from "../utils/middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createServer);
router.get("/", authMiddleware, getServers);
router.post("/join", joinServer);
router.delete("/:serverId", authMiddleware, deleteServer);
router.put("/:serverId", authMiddleware, editServer);
router.post("/:serverId/leave", authMiddleware, leaveServer);

export default router;
