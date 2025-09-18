import express from "express";
import { createServer, joinServer, getServers } from "../controllers/server.controller.js";
import { authMiddleware } from "../utils/middleware.js";


const router = express.Router();

router.post("/", authMiddleware, createServer);
router.post("/join", joinServer);
router.get("/", authMiddleware, getServers);

export default router;
