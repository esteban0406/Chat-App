import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true }, // puede venir de Google
    email:    { type: String, required: true, unique: true },
    password: { type: String }, // ya no es required: true
    avatar:   { type: String }, // URL de la foto de perfil
    provider: { type: String, enum: ["local", "google", "microsoft"], default: "local" },
    status:   { type: String, enum: ["online", "offline", "idle"], default: "offline" },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
