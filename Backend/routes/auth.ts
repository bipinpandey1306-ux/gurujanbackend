import express, { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_please_change_this_in_production";
const REGISTRATION_PASSCODE = process.env.REGISTRATION_PASSCODE || "GurujanRegister2026";

// Email Regex Validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password Strength Regex (between 8 and 16 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;

// Register Route
router.post("/register", async (req: express.Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, bio, passcode } = req.body;

    if (!name || !email || !password || !passcode) {
      res.status(400).json({ message: "Name, email, password, and registration passcode are required." });
      return;
    }

    if (passcode !== REGISTRATION_PASSCODE) {
      res.status(400).json({ message: "Invalid registration passcode. Registration denied." });
      return;
    }

    // Name length limit 100
    if (name.trim().length > 100) {
      res.status(400).json({ message: "Full name cannot exceed 100 characters." });
      return;
    }

    // Email length limit 100
    if (email.trim().length > 100) {
      res.status(400).json({ message: "Email address cannot exceed 100 characters." });
      return;
    }

    // 1. Email Regex Validation
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: "Invalid email format. Please provide a valid email." });
      return;
    }

    // 2. Password Regex Validation (8 to 16 characters)
    if (!passwordRegex.test(password)) {
      res.status(400).json({ 
        message: "Password must be between 8 and 16 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character." 
      });
      return;
    }

    // 3. Bio Maximum Length 500 Validation (Optional)
    if (bio && bio.trim().length > 500) {
      res.status(400).json({ message: "Biography cannot exceed 500 characters." });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "A user with this email address already exists." });
      return;
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create User
    const newUser = new User({
      name,
      email,
      passwordHash,
      bio,
      profileImage: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
    });

    await newUser.save();

    // Sign JWT
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: "7d" });

    // Set Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        bio: newUser.bio,
        profileImage: newUser.profileImage
      }
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration.", error: error.message });
  }
});

// Login Route
router.post("/login", async (req: express.Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required." });
      return;
    }

    // Find User (either normal email, or hashed email for super admin)
    const emailNormal = email.toLowerCase().trim();
    const emailHash = crypto.createHash("sha256").update(emailNormal).digest("hex");

    let user = await User.findOne({ email: emailNormal });
    if (!user) {
      user = await User.findOne({ email: emailHash });
    }

    if (!user) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    // Check if user is blocked
    if (user.isBlocked) {
      res.status(403).json({ message: "Your account has been blocked by the administrator." });
      return;
    }

    // Compare Password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    // Sign JWT
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

    // Set Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
        role: user.role,
        isVerified: user.isVerified,
        isBlocked: user.isBlocked,
        reachMultiplier: user.reachMultiplier,
        minReach: user.minReach
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// Get Current User Route
router.get("/me", authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    bio: req.user.bio,
    profileImage: req.user.profileImage,
    coverImage: req.user.coverImage,
    phone: req.user.phone,
    website: req.user.website,
    twitter: req.user.twitter,
    facebook: req.user.facebook,
    instagram: req.user.instagram,
    youtube: req.user.youtube,
    achievements: req.user.achievements,
    experience: req.user.experience,
    role: req.user.role,
    isVerified: req.user.isVerified,
    isBlocked: req.user.isBlocked,
    reachMultiplier: req.user.reachMultiplier,
    minReach: req.user.minReach
  });
});

// Logout Route
router.post("/logout", (req: express.Request, res: Response): void => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully." });
});

export default router;
