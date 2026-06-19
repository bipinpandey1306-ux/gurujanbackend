import express, { Response, NextFunction } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import User from "../models/User";
import Blog from "../models/Blog";
import Comment from "../models/Comment";
import Category from "../models/Category";
import Album from "../models/Album";
import Media from "../models/Media";

const router = express.Router();

// Middleware to restrict access to superadmins only
export function superAdminMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== "superadmin") {
    res.status(403).json({ message: "Access Denied: Super Admin permissions required." });
    return;
  }
  next();
}

// All superadmin routes require standard auth first, then superadmin role checks
router.use(authMiddleware);
router.use(superAdminMiddleware);

// 1. GET /users - List all user accounts
router.get("/users", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find({}).select("-passwordHash").sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    console.error("Superadmin: Get users error:", error);
    res.status(500).json({ message: "Server error listing users." });
  }
});

// 2. PUT /users/:id/verify - Toggle user blue tick verification status
router.put("/users/:id/verify", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { isVerified } = req.body;
    
    if (typeof isVerified !== "boolean") {
      res.status(400).json({ message: "isVerified status must be a boolean." });
      return;
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    // Cannot verify/unverify yourself
    if (user._id.toString() === req.user!._id.toString()) {
      res.status(400).json({ message: "Cannot modify verification status of your own account." });
      return;
    }

    user.isVerified = isVerified;
    await user.save();

    res.json({ message: `User verification updated to ${isVerified}.`, user });
  } catch (error) {
    console.error("Superadmin: Verify user error:", error);
    res.status(500).json({ message: "Server error updating verification status." });
  }
});

// 3. PUT /users/:id/block - Toggle user block status
router.put("/users/:id/block", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { isBlocked } = req.body;
    
    if (typeof isBlocked !== "boolean") {
      res.status(400).json({ message: "isBlocked status must be a boolean." });
      return;
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    // Cannot block yourself
    if (user._id.toString() === req.user!._id.toString()) {
      res.status(400).json({ message: "You cannot block your own super admin account." });
      return;
    }

    user.isBlocked = isBlocked;
    await user.save();

    res.json({ message: `User block status updated to ${isBlocked}.`, user });
  } catch (error) {
    console.error("Superadmin: Block user error:", error);
    res.status(500).json({ message: "Server error updating block status." });
  }
});

// 4. DELETE /users/:id - Cascade delete user account
router.delete("/users/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    // Cannot delete yourself
    if (userToDelete._id.toString() === req.user!._id.toString()) {
      res.status(400).json({ message: "You cannot delete your own super admin account." });
      return;
    }

    const targetUserId = userToDelete._id;

    // Delete related entities in cascade
    await Comment.deleteMany({ userId: targetUserId });
    await Blog.deleteMany({ userId: targetUserId });
    await Category.deleteMany({ userId: targetUserId });
    await Media.deleteMany({ userId: targetUserId });
    await Album.deleteMany({ userId: targetUserId });
    await User.findByIdAndDelete(targetUserId);

    res.json({ message: "User account and all associated blog data deleted successfully." });
  } catch (error) {
    console.error("Superadmin: Delete user error:", error);
    res.status(500).json({ message: "Server error deleting user account." });
  }
});

// 5. PUT /users/:id/reach - Set user reach configurations
router.put("/users/:id/reach", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { reachMultiplier, minReach } = req.body;
    
    if (reachMultiplier !== undefined && (typeof reachMultiplier !== "number" || reachMultiplier < 0)) {
      res.status(400).json({ message: "reachMultiplier must be a positive number." });
      return;
    }

    if (minReach !== undefined && (typeof minReach !== "number" || minReach < 0)) {
      res.status(400).json({ message: "minReach must be a positive integer." });
      return;
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    if (reachMultiplier !== undefined) user.reachMultiplier = reachMultiplier;
    if (minReach !== undefined) user.minReach = Math.round(minReach);
    
    await user.save();

    res.json({ message: "User reach settings updated successfully.", user });
  } catch (error) {
    console.error("Superadmin: Update user reach error:", error);
    res.status(500).json({ message: "Server error updating reach metrics." });
  }
});

// 6. PUT /blogs/:id/reach - Set individual blog post reach configurations
router.put("/blogs/:id/reach", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { reachMultiplier, minReach } = req.body;
    
    if (reachMultiplier !== undefined && (typeof reachMultiplier !== "number" || reachMultiplier < 0)) {
      res.status(400).json({ message: "reachMultiplier must be a positive number." });
      return;
    }

    if (minReach !== undefined && (typeof minReach !== "number" || minReach < 0)) {
      res.status(400).json({ message: "minReach must be a positive integer." });
      return;
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      res.status(404).json({ message: "Blog post not found." });
      return;
    }

    if (reachMultiplier !== undefined) blog.reachMultiplier = reachMultiplier;
    if (minReach !== undefined) blog.minReach = Math.round(minReach);
    
    await blog.save();

    res.json({ message: "Blog post reach settings updated successfully.", blog });
  } catch (error) {
    console.error("Superadmin: Update blog reach error:", error);
    res.status(500).json({ message: "Server error updating blog reach metrics." });
  }
});

// 7. GET /stats - Super admin system statistics
router.get("/stats", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalBlogs = await Blog.countDocuments({});
    const blockedUsers = await User.countDocuments({ isBlocked: true });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    
    // Sum of all blog views (we fetch them and calculate view counts with our virality/multiplier logic)
    const allBlogs = await Blog.find({}).populate("userId", "reachMultiplier minReach");
    
    // Helper to calculate total views across all posts taking virality and reach modifiers into account
    let totalViews = 0;
    for (const blog of allBlogs) {
      const rawViews = blog.viewCount || 0;
      const bMultiplier = blog.reachMultiplier ?? 1.0;
      const uMultiplier = (blog.userId as any)?.reachMultiplier ?? 1.0;
      
      const ageInHours = (Date.now() - new Date(blog.createdAt).getTime()) / (1000 * 60 * 60);
      let viralityBoost = 0;
      if (ageInHours < 72) {
        viralityBoost = Math.max(100, Math.round(1500 * (1 - ageInHours / 72)));
      }
      
      const multiplierViews = Math.round(rawViews * bMultiplier * uMultiplier);
      const configuredMinReach = blog.minReach || (blog.userId as any)?.minReach || 0;
      const finalViews = Math.max(multiplierViews, configuredMinReach, viralityBoost);
      totalViews += finalViews;
    }

    res.json({
      totalUsers,
      totalBlogs,
      blockedUsers,
      verifiedUsers,
      totalViews
    });
  } catch (error) {
    console.error("Superadmin: Get statistics error:", error);
    res.status(500).json({ message: "Server error calculating stats." });
  }
});

// 8. POST /change-password - Change Super Admin password
router.post("/change-password", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: "Current password and new password are required." });
      return;
    }

    // Password validation criteria (between 8 and 16 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/;
    if (!passwordRegex.test(newPassword)) {
      res.status(400).json({ 
        message: "New password must be between 8 and 16 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character." 
      });
      return;
    }

    // Fetch user with password hash explicitly since it is normally excluded
    const user = await User.findById(req.user!._id);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ message: "Incorrect current password." });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Super Admin password changed successfully." });
  } catch (error) {
    console.error("Superadmin: Change password error:", error);
    res.status(500).json({ message: "Server error changing password." });
  }
});

export default router;
