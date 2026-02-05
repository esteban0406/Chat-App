// src/services/message/Message.model.ts
import mongoose, { Document, Model, Schema, Types } from "mongoose";

// =======================
// Types
// =======================

export interface IMessage {
  text: string;
  sender: Types.ObjectId;
  channel: Types.ObjectId;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessageDocument extends IMessage, Document {
  _id: Types.ObjectId;
}

export interface IMessageModel extends Model<IMessageDocument> {}

// =======================
// Schema
// =======================

const messageSchema = new Schema<IMessageDocument, IMessageModel>(
  {
    text: { type: String, required: true },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    channel: {
      type: Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// =======================
// Instance Methods
// =======================

messageSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = String(obj._id);
  obj.sender = String(obj.sender);
  obj.channel = String(obj.channel);
  delete obj._id;
  delete obj.__v;
  return obj;
};

// =======================
// Model
// =======================

export const Message: IMessageModel = mongoose.model<IMessageDocument, IMessageModel>(
  "Message",
  messageSchema
);

export default Message;
