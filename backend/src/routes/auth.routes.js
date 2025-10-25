import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { register, login } from "../controllers/auth.controller.js";

const router = express.Router();

// 🔹 Registro y login clásico
router.post("/register", register);
router.post("/login", login);

// 🔹 Login con Google
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Generar tu propio JWT para integrarlo igual que el login clásico
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user: req.user });
  }
);

// 🔹 Login con Microsoft
router.get("/microsoft", passport.authenticate("azuread-openidconnect", { failureRedirect: "/login" }));

router.post(
  "/microsoft/callback",
  passport.authenticate("azuread-openidconnect", { failureRedirect: "/login" }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user: req.user });
  }
);

export default router;
