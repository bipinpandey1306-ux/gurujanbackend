import express, { Response } from "express";
import mongoose from "mongoose";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import User from "../models/User";
import Follow from "../models/Follow";

const router = express.Router();

// Apply authentication middleware to all social routes
router.use(authMiddleware);

// 1. POST /follow/:id - Follow a user
router.post("/follow/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const followerId = req.user!._id;
    const followingId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(followingId as string)) {
      res.status(400).json({ message: "Invalid user ID." });
      return;
    }

    if (followerId.toString() === followingId) {
      res.status(400).json({ message: "You cannot follow yourself." });
      return;
    }

    const targetUser = await User.findById(followingId);
    if (!targetUser) {
      res.status(404).json({ message: "Target user not found." });
      return;
    }

    // Check if already following
    const existing = await Follow.findOne({ followerId, followingId });
    if (existing) {
      res.status(400).json({ message: "You are already following this user." });
      return;
    }

    const follow = new Follow({ followerId, followingId });
    await follow.save();

    res.status(201).json({ message: "Successfully followed user.", follow });
  } catch (error) {
    console.error("Social follow error:", error);
    res.status(500).json({ message: "Server error executing follow." });
  }
});

// 2. POST /unfollow/:id - Unfollow a user
router.post("/unfollow/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const followerId = req.user!._id;
    const followingId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(followingId as string)) {
      res.status(400).json({ message: "Invalid user ID." });
      return;
    }

    const result = await Follow.findOneAndDelete({ followerId, followingId });
    if (!result) {
      res.status(404).json({ message: "Follow connection not found." });
      return;
    }

    res.json({ message: "Successfully unfollowed user." });
  } catch (error) {
    console.error("Social unfollow error:", error);
    res.status(500).json({ message: "Server error executing unfollow." });
  }
});

// 3. GET /authors - List all other authors with follow statuses and stats
router.get("/authors", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!._id;

    // Retrieve all users except current logged-in user, blocked users, and super admins
    const authors = await User.find({
      _id: { $ne: currentUserId },
      isBlocked: { $ne: true },
      role: { $ne: "superadmin" }
    }).select("-passwordHash").sort({ name: 1 });

    const enrichedAuthors = await Promise.all(
      authors.map(async (author) => {
        const authorId = author._id;

        const [followersCount, followingCount, isFollowing, isFollowedBy] = await Promise.all([
          Follow.countDocuments({ followingId: authorId }),
          Follow.countDocuments({ followerId: authorId }),
          Follow.exists({ followerId: currentUserId, followingId: authorId }),
          Follow.exists({ followerId: authorId, followingId: currentUserId })
        ]);

        const authorObj = author.toObject();
        return {
          ...authorObj,
          followersCount,
          followingCount,
          isFollowing: !!isFollowing,
          isFollowedBy: !!isFollowedBy,
          isMutual: !!(isFollowing && isFollowedBy)
        };
      })
    );

    res.json({ authors: enrichedAuthors });
  } catch (error) {
    console.error("Social list authors error:", error);
    res.status(500).json({ message: "Server error retrieving author directory." });
  }
});

// 4. GET /following - List users followed by current user
router.get("/following", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!._id;

    const followDocs = await Follow.find({ followerId: currentUserId })
      .populate("followingId", "-passwordHash")
      .sort({ createdAt: -1 });

    const following = await Promise.all(
      followDocs
        .filter(f => f.followingId !== null && f.followingId !== undefined && (f.followingId as any).role !== "superadmin")
        .map(async (f) => {
          const user: any = f.followingId;
          const authorId = user._id;

          const [followersCount, followingCount, isFollowedBy] = await Promise.all([
            Follow.countDocuments({ followingId: authorId }),
            Follow.countDocuments({ followerId: authorId }),
            Follow.exists({ followerId: authorId, followingId: currentUserId })
          ]);

          const userObj = user.toObject();
          return {
            ...userObj,
            followersCount,
            followingCount,
            isFollowing: true,
            isFollowedBy: !!isFollowedBy,
            isMutual: !!isFollowedBy
          };
        })
    );

    res.json({ following });
  } catch (error) {
    console.error("Social get following error:", error);
    res.status(500).json({ message: "Server error loading following list." });
  }
});

// 5. GET /followers - List users following current user
router.get("/followers", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!._id;

    const followDocs = await Follow.find({ followingId: currentUserId })
      .populate("followerId", "-passwordHash")
      .sort({ createdAt: -1 });

    const followers = await Promise.all(
      followDocs
        .filter(f => f.followerId !== null && f.followerId !== undefined && (f.followerId as any).role !== "superadmin")
        .map(async (f) => {
          const user: any = f.followerId;
          const authorId = user._id;

          const [followersCount, followingCount, isFollowing] = await Promise.all([
            Follow.countDocuments({ followingId: authorId }),
            Follow.countDocuments({ followerId: authorId }),
            Follow.exists({ followerId: currentUserId, followingId: authorId })
          ]);

          const userObj = user.toObject();
          return {
            ...userObj,
            followersCount,
            followingCount,
            isFollowing: !!isFollowing,
            isFollowedBy: true,
            isMutual: !!isFollowing
          };
        })
    );

    res.json({ followers });
  } catch (error) {
    console.error("Social get followers error:", error);
    res.status(500).json({ message: "Server error loading followers list." });
  }
});

// 6. GET /friends - List mutual friends (mutual follows)
router.get("/friends", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!._id;

    const followingIds = await Follow.find({ followerId: currentUserId }).distinct("followingId");
    const followerIds = await Follow.find({ followingId: currentUserId }).distinct("followerId");

    const followingStr = followingIds.map(id => id.toString());
    const friendIds = followerIds.filter(id => followingStr.includes(id.toString()));

    const friends = await User.find({
      _id: { $in: friendIds },
      role: { $ne: "superadmin" }
    }).select("-passwordHash").sort({ name: 1 });

    const enrichedFriends = await Promise.all(
      friends.map(async (friend) => {
        const authorId = friend._id;

        const [followersCount, followingCount] = await Promise.all([
          Follow.countDocuments({ followingId: authorId }),
          Follow.countDocuments({ followerId: authorId })
        ]);

        const friendObj = friend.toObject();
        return {
          ...friendObj,
          followersCount,
          followingCount,
          isFollowing: true,
          isFollowedBy: true,
          isMutual: true
        };
      })
    );

    res.json({ friends: enrichedFriends });
  } catch (error) {
    console.error("Social get friends error:", error);
    res.status(500).json({ message: "Server error loading friends list." });
  }
});

// 7. GET /status/:id - Get detailed follow status between logged-in user and ID
router.get("/status/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!._id;
    const authorId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(authorId as string)) {
      res.status(400).json({ message: "Invalid user ID." });
      return;
    }

    const [isFollowing, isFollowedBy] = await Promise.all([
      Follow.exists({ followerId: currentUserId, followingId: authorId }),
      Follow.exists({ followerId: authorId, followingId: currentUserId })
    ]);

    res.json({
      isFollowing: !!isFollowing,
      isFollowedBy: !!isFollowedBy,
      isMutual: !!(isFollowing && isFollowedBy)
    });
  } catch (error) {
    console.error("Social get status error:", error);
    res.status(500).json({ message: "Server error retrieving connection status." });
  }
});

export default router;
