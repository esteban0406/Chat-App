import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    authId: {
      type: String,
      index: true,
      unique: true,
      sparse: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      // Solo requerido para usuarios locales
      required: function () {
        return this.provider === "local";
      },
    },
    avatar: {
      type: String,
    },
    provider: {
      type: String,
      enum: ["local", "google", "microsoft", "better-auth"],
      default: "local",
    },
    status: {
      type: String,
      enum: ["online", "offline", "idle"],
      default: "offline",
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
