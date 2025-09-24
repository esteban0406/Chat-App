import express from "express";
import { AccessToken } from "livekit-server-sdk";

const router = express.Router();

router.post("/join", async (req, res) => {
  try {
    const { identity, room } = req.body;

    if (!identity || !room) {
      return res.status(400).json({ error: "identity y room requeridos" });
    }

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      { identity }
    );

    at.addGrant({ roomJoin: true, room });

    // ✅ Esperar el string JWT real
    const jwt = await at.toJwt();

    const livekitUrl = process.env.LIVEKIT_URL || "ws://localhost:7880";

    res.json({ token: jwt, url: livekitUrl });
  } catch (err) {
    console.error("Error generando token LiveKit:", err);
    res.status(500).json({ error: "No se pudo generar token" });
  }
});

export default router;
