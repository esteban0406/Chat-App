import express from "express";
import { sendServerInvite, respondServerInvite } from "../controllers/serverInvite.controller.js";

const router = express.Router();

router.post("/send", sendServerInvite);
router.post("/respond", respondServerInvite);

export default router;
