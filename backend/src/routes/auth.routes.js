import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { register, login } from "../controllers/auth.controller.js";

const router = express.Router();

// Registro/Login clásico
router.post("/register", register);
router.post("/login", login);

// ===================
// Google OAuth
// ===================
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth" }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // ✅ redirigir dinámicamente al frontend según env
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    res.redirect(
      `${frontendUrl}/oauth-success?token=${token}&username=${encodeURIComponent(
        req.user.username
      )}&email=${encodeURIComponent(req.user.email)}&avatar=${encodeURIComponent(
        req.user.avatar || ""
      )}&provider=${req.user.provider}`
    );
  }
);

// ===================
// Microsoft OAuth
// ===================
router.get("/microsoft", passport.authenticate("azuread-openidconnect", { failureRedirect: "/auth" }));

router.post(
  "/microsoft/callback",
  passport.authenticate("azuread-openidconnect", { failureRedirect: "/auth" }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.redirect(
      `https://chatapp-frontend-020n.onrender.com/oauth-success?token=${token}&username=${encodeURIComponent(
        req.user.username
      )}&email=${encodeURIComponent(req.user.email)}&avatar=${encodeURIComponent(
        req.user.avatar || ""
      )}&provider=${req.user.provider}`
    );
  }
);

export default router;
