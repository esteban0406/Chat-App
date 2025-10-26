import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ===============================
// Registro clásico (local)
// ===============================
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validaciones
    if (!username || !email) {
      return res.status(400).json({ message: "Username y email son obligatorios" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password requerido para registro local" });
    }

    // Evitar duplicados
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash del password
    const hashed = await bcrypt.hash(password, 10);

    // Crear usuario local
    const user = new User({
      username,
      email,
      password: hashed,
      provider: "local",
    });
    await user.save();

    // Firmar JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "User registered",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        provider: user.provider,
      },
      token,
    });
  } catch (err) {
    console.error("❌ Error en register:", err.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// ===============================
// Login clásico (local)
// ===============================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar input
    if (!email || !password) {
      return res.status(400).json({ message: "Email y password son obligatorios" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.provider !== "local") {
      return res
        .status(400)
        .json({ message: `Este usuario debe iniciar sesión con ${user.provider}` });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        provider: user.provider,
      },
    });
  } catch (err) {
    console.error("❌ Error en login:", err.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
};
