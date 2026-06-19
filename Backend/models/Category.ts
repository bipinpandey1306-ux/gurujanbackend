import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  userId: mongoose.Types.ObjectId;
}

const CategorySchema: Schema = new Schema({
  name: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true }
});

// Category name should be unique per user
CategorySchema.index({ name: 1, userId: 1 }, { unique: true });

export default mongoose.model<ICategory>("Category", CategorySchema);
