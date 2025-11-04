import mongoose from "mongoose";

const ServerSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String },
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members:     [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  channels:    [{ type: mongoose.Schema.Types.ObjectId, ref: "Channel" }],
}, { timestamps: true });

export default mongoose.model("Server", ServerSchema);
