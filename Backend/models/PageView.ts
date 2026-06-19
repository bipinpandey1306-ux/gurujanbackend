import mongoose, { Schema, Document } from "mongoose";

export interface IPageView extends Document {
  path: string;
  userAgent?: string;
  timestamp: Date;
  userId?: mongoose.Types.ObjectId;
}

const PageViewSchema: Schema = new Schema({
  path: { type: String, required: true },
  userAgent: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: false }
});

export default mongoose.model<IPageView>("PageView", PageViewSchema);
