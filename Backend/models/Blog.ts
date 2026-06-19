import mongoose, { Schema, Document } from "mongoose";

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  status: "draft" | "published";
  categoryId?: mongoose.Types.ObjectId;
  categoryName?: string;
  featuredImage?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  userId: mongoose.Types.ObjectId;
  authorName?: string;
  authorImage?: string;
  authorBio?: string;
  authorVerified?: boolean;
  reachMultiplier: number;
  minReach: number;
}

const BlogSchema: Schema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true },
  excerpt: { type: String, default: "" },
  content: { type: String, required: true },
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
  categoryName: { type: String, default: "" },
  featuredImage: { type: String, default: "" },
  publishedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  viewCount: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  reachMultiplier: { type: Number, default: 1.0 },
  minReach: { type: Number, default: 0 },
  seoTitle: { type: String, default: "" },
  seoDescription: { type: String, default: "" },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true }
});

// Compound index to ensure slug is unique per user
BlogSchema.index({ slug: 1, userId: 1 }, { unique: true });

export default mongoose.model<IBlog>("Blog", BlogSchema);
