// src/services/user/User.model.ts
import mongoose, { Document, Model, Schema } from "mongoose";

// =======================
// TypeScript Interfaces
// =======================

export interface IUser {
  authUserId: string; 
  status?: string; 
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
  _id: mongoose.Types.ObjectId;
}

export interface IUserModel extends Model<IUserDocument> {
  findByAuthUserId(authUserId: string): Promise<IUserDocument | null>;
}

// =======================
// Mongoose Schema
// =======================

const userSchema = new Schema<IUserDocument, IUserModel>(
  {
    authUserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      ref: "user", // Better Auth's collection name
    },
    status: {
      type: String,
      trim: true,
      maxlength: 128,
    },
  },
  {
    timestamps: true,
    collection: "users", // Your custom collection
  }
);

// =======================
// Static Methods
// =======================

userSchema.statics.findByAuthUserId = async function (
  authUserId: string
): Promise<IUserDocument | null> {
  return this.findOne({ authUserId });
};

// =======================
// Instance Methods (optional)
// =======================

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = String(obj._id);
  delete obj._id;
  delete obj.__v;
  return obj;
};

// =======================
// Model Export
// =======================

export const User = mongoose.model<IUserDocument, IUserModel>(
  "User",
  userSchema
);

export default User;