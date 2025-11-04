import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../services/user/User.model.js";
import { ok } from "../utils/response.js";
import { createHttpError, validationError } from "../utils/httpError.js";

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  username: user.username,
  email: user.email,
  provider: user.provider,
});

// ===============================
// Registro clásico (local)
// ===============================
export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Validaciones
    if (!username || !email) {
      throw validationError("Username y email son obligatorios");
    }

    if (!password) {
      throw validationError("Password requerido para registro local");
    }

    // Evitar duplicados
    const exists = await User.findOne({ email });
    if (exists) {
      throw createHttpError(409, "User already exists", {
        code: "USER_EXISTS",
      });
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
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return ok(res, {
      status: 201,
      message: "User registered",
      data: {
        user: sanitizeUser(user),
        token,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// ===============================
// Login clásico (local)
// ===============================
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validar input
    if (!email || !password) {
      throw validationError("Email y password son obligatorios");
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw createHttpError(404, "User not found", { code: "USER_NOT_FOUND" });
    }

    if (user.provider !== "local") {
      throw createHttpError(400, `Este usuario debe iniciar sesión con ${user.provider}`, {
        code: "INVALID_PROVIDER",
        details: { provider: user.provider },
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw createHttpError(401, "Invalid credentials", { code: "INVALID_CREDENTIALS" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return ok(res, {
      message: "Login exitoso",
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    return next(error);
  }
};
