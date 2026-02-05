// src/services/user/friendRequest/FriendRequest.model.ts
import mongoose, { Document, Model, Schema, Types } from "mongoose";

// =======================
// Types
// =======================

export type FriendRequestStatus = "pending" | "accepted" | "rejected";

export interface IFriendRequest {
  from: Types.ObjectId;
  to: Types.ObjectId;
  status: FriendRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFriendRequestDocument extends IFriendRequest, Document {
  _id: Types.ObjectId;
}

export interface IFriendRequestModel extends Model<IFriendRequestDocument> {}

// =======================
// Schema
// =======================

const friendRequestSchema = new Schema<IFriendRequestDocument, IFriendRequestModel>(
  {
    from: { type: Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"] as const,
      default: "pending",
    },
  },
  { timestamps: true }
);

// =======================
// Instance Methods
// =======================

friendRequestSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = String(obj._id);
  obj.from = String(obj.from);
  obj.to = String(obj.to);
  delete obj._id;
  delete obj.__v;
  return obj;
};

// =======================
// Model
// =======================

export const FriendRequestModel: IFriendRequestModel = mongoose.model<
  IFriendRequestDocument,
  IFriendRequestModel
>("FriendRequest", friendRequestSchema);

export default FriendRequestModel;
