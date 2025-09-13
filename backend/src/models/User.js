
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true }, // 🔐 siempre guarda hash, no texto plano
  avatar:   { type: String }, // URL de la foto de perfil
  status:   { type: String, enum: ["online", "offline", "idle"], default: "offline" },
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
