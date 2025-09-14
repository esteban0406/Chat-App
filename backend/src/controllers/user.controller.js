import User from "../models/User.js";

// 🔹 Obtener todos los usuarios
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// 🔹 Obtener un usuario por ID
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// 🔹 Buscar usuario por username
// controllers/user.controller.js
export const searchUser = async (req, res) => {
  try {
    const { username } = req.query;
    const user = await User.findOne({ username: new RegExp(username, "i") }).select("-password");

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(user); // ✅ devuelve un objeto, no un array
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

