import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  bio: string;
  profileImage?: string;
  coverImage?: string;
  phone?: string;
  website?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  achievements?: string;
  experience?: string;
  role: "user" | "superadmin";
  isVerified: boolean;
  isBlocked: boolean;
  reachMultiplier: number;
  minReach: number;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true,
    validate: {
      validator: function (v: string) {
        return v.length <= 100;
      },
      message: "Full name cannot exceed 100 characters!"
    }
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    validate: {
      validator: function (v: string) {
        return v.length <= 100;
      },
      message: "Email address cannot exceed 100 characters!"
    }
  },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["user", "superadmin"], default: "user" },
  isVerified: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  reachMultiplier: { type: Number, default: 1.0 },
  minReach: { type: Number, default: 0 },
  bio: {
    type: String,
    required: false,
    default: ""
  },
  profileImage: { type: String, default: "" },
  coverImage: { type: String, default: "" },
  phone: { type: String, default: "" },
  website: { type: String, default: "" },
  twitter: { type: String, default: "" },
  facebook: { type: String, default: "" },
  instagram: { type: String, default: "" },
  youtube: { type: String, default: "" },
  achievements: { type: String, default: "" },
  experience: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>("User", UserSchema);
