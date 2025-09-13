import express from "express";
import { createServer, joinServer, getServers } from "../controllers/server.controller.js";

const router = express.Router();

router.post("/", createServer);
router.post("/join", joinServer);
router.get("/", getServers);

export default router;
