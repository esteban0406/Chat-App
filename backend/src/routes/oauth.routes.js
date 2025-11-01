// src/routes/oauth.routes.js
import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = express.Router();

// =======================
// 🔹 GOOGLE
// =======================
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth" }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    res.redirect(
      `${frontendUrl}/oauth-success?token=${token}&username=${encodeURIComponent(
        req.user.username
      )}&email=${encodeURIComponent(req.user.email)}&avatar=${encodeURIComponent(
        req.user.avatar || ""
      )}&provider=${req.user.provider}&id=${req.user._id}`
    );
  }
);

// =======================
// 🔹 MICROSOFT
// =======================
router.get("/microsoft", passport.authenticate("azuread-openidconnect", { failureRedirect: "/auth" }));

router.post(
  "/microsoft/callback",
  passport.authenticate("azuread-openidconnect", { failureRedirect: "/auth" }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    res.redirect(
      `${frontendUrl}/oauth-success?token=${token}&username=${encodeURIComponent(
        req.user.username
      )}&email=${encodeURIComponent(req.user.email)}&avatar=${encodeURIComponent(
        req.user.avatar || ""
      )}&provider=${req.user.provider}&id=${req.user._id}`
    );
  }
);

export default router;
