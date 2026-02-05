// src/services/server/invite/ServerInvite.model.ts
import mongoose, { Document, Model, Schema, Types } from "mongoose";

// =======================
// Types
// =======================

export type ServerInviteStatus = "pending" | "accepted" | "rejected";

export interface IServerInvite {
  from: Types.ObjectId;
  to: Types.ObjectId;
  server: Types.ObjectId;
  status: ServerInviteStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IServerInviteDocument extends IServerInvite, Document {
  _id: Types.ObjectId;
}

export interface IServerInviteModel extends Model<IServerInviteDocument> {}

// =======================
// Schema
// =======================

const serverInviteSchema = new Schema<IServerInviteDocument, IServerInviteModel>(
  {
    from: { type: Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: Schema.Types.ObjectId, ref: "User", required: true },
    server: { type: Schema.Types.ObjectId, ref: "Server", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"] as const,
      default: "pending",
    },
  },
  { timestamps: true }
);

serverInviteSchema.index({ from: 1, to: 1, server: 1 }, { unique: true });

// =======================
// Instance Methods
// =======================

serverInviteSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = String(obj._id);
  obj.from = String(obj.from);
  obj.to = String(obj.to);
  obj.server = String(obj.server);
  delete obj._id;
  delete obj.__v;
  return obj;
};

// =======================
// Model
// =======================

export const ServerInviteModel: IServerInviteModel = mongoose.model<
  IServerInviteDocument,
  IServerInviteModel
>("ServerInvite", serverInviteSchema);

export default ServerInviteModel;
