// src/services/server/Server.model.ts
import mongoose, { Document, Model, Schema, Types } from "mongoose";

// =======================
// Types
// =======================

export interface IServer {
  name: string;
  description?: string;
  owner: Types.ObjectId;
  members: Types.ObjectId[];
  channels: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IServerDocument extends IServer, Document {
  _id: Types.ObjectId;
}

export interface IServerModel extends Model<IServerDocument> {}

// =======================
// Schema
// =======================

const serverSchema = new Schema<IServerDocument, IServerModel>(
  {
    name: { type: String, required: true },
    description: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    channels: [{ type: Schema.Types.ObjectId, ref: "Channel" }],
  },
  { timestamps: true }
);

// =======================
// Instance Methods
// =======================

serverSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = String(obj._id);
  obj.owner = String(obj.owner);
  obj.members = (obj.members ?? []).map((m: Types.ObjectId) => String(m));
  obj.channels = (obj.channels ?? []).map((c: Types.ObjectId) => String(c));
  delete obj._id;
  delete obj.__v;
  return obj;
};

// =======================
// Model
// =======================

export const Server: IServerModel = mongoose.model<IServerDocument, IServerModel>(
  "Server",
  serverSchema
);

export default Server;
