// src/services/channel/Channel.model.ts
import mongoose, { Document, Model, Schema, Types } from "mongoose";

// =======================
// Types
// =======================

export type ChannelType = "text" | "voice";

export interface IChannel {
  name: string;
  type: ChannelType;
  server: Types.ObjectId;
  messages: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IChannelDocument extends IChannel, Document {
  _id: Types.ObjectId;
}

export interface IChannelModel extends Model<IChannelDocument> {}

// =======================
// Schema
// =======================

const channelSchema = new Schema<IChannelDocument, IChannelModel>(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["text", "voice"] as const, default: "text" },
    server: {
      type: Schema.Types.ObjectId,
      ref: "Server",
      required: true,
    },
    messages: [{ type: Schema.Types.ObjectId, ref: "Message" }],
  },
  { timestamps: true }
);

// =======================
// Instance Methods
// =======================

channelSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = String(obj._id);
  obj.server = String(obj.server);
  obj.messages = (obj.messages ?? []).map((m: Types.ObjectId) => String(m));
  delete obj._id;
  delete obj.__v;
  return obj;
};

// =======================
// Model
// =======================

export const Channel: IChannelModel = mongoose.model<IChannelDocument, IChannelModel>(
  "Channel",
  channelSchema
);

export default Channel;
