import mongoose, { Schema, Document } from "mongoose";

export interface IComment extends Document {
  blogId: mongoose.Types.ObjectId;
  blogTitle?: string;
  authorName: string;
  authorEmail: string;
  content: string;
  status: "pending" | "approved" | "rejected" | "spam";
  createdAt: Date;
  userId: mongoose.Types.ObjectId;
}

const CommentSchema: Schema = new Schema({
  blogId: { type: Schema.Types.ObjectId, ref: "Blog", required: true },
  blogTitle: { type: String, default: "" },
  authorName: { type: String, required: true },
  authorEmail: { type: String, required: true },
  content: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected", "spam"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true }
});

export default mongoose.model<IComment>("Comment", CommentSchema);
