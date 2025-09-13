
import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  text:      { type: String, required: true },
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  channel:   { type: mongoose.Schema.Types.ObjectId, ref: "Channel", required: true },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("Message", MessageSchema);
