import mongoose, { Schema, Document } from "mongoose";

export interface IFollow extends Document {
  followerId: mongoose.Types.ObjectId;
  followingId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FollowSchema: Schema = new Schema({
  followerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  followingId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
});

// Avoid duplicate following
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

export default mongoose.model<IFollow>("Follow", FollowSchema);
