import mongoose, { Schema, Document } from "mongoose";

export interface IAlbum extends Document {
  name: string;
  description?: string;
  userId: mongoose.Types.ObjectId;
}

const AlbumSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true }
});

export default mongoose.model<IAlbum>("Album", AlbumSchema);
