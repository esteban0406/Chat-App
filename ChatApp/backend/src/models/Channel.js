import mongoose from "mongoose";

const ChannelSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  type:    { type: String, enum: ["text", "voice"], default: "text" },
  server:  { type: mongoose.Schema.Types.ObjectId, ref: "Server", required: true },
  messages:[{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
}, { timestamps: true });

export default mongoose.model("Channel", ChannelSchema);
