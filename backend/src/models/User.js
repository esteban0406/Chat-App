import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
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
      enum: ["local", "google", "microsoft"],
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

UserSchema.index({ email: 1 }, { unique: true });

export default mongoose.model("User", UserSchema);
