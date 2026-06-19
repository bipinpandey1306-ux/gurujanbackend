import mongoose, { Schema, Document } from "mongoose";

export interface IMedia extends Document {
  albumId?: mongoose.Types.ObjectId;
  title: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  caption?: string;
  userId: mongoose.Types.ObjectId;
}

const MediaSchema: Schema = new Schema({
  albumId: { type: Schema.Types.ObjectId, ref: "Album" },
  title: { type: String, required: true },
  url: { type: String, required: true },
  mimeType: { type: String, default: "image/jpeg" },
  size: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  caption: { type: String, default: "" },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true }
});

export default mongoose.model<IMedia>("Media", MediaSchema);
