import mongoose from "mongoose";

const serverInviteSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    server: { type: mongoose.Schema.Types.ObjectId, ref: "Server", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

serverInviteSchema.index({ from: 1, to: 1, server: 1 }, { unique: true });

export default mongoose.model("ServerInvite", serverInviteSchema);
