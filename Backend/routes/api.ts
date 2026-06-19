import express, { Response } from "express";
import mongoose from "mongoose";
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from "../middleware/auth";
import User from "../models/User";
import Blog from "../models/Blog";
import Category from "../models/Category";
import Album from "../models/Album";
import Media from "../models/Media";
import Comment from "../models/Comment";
import ContactMessage from "../models/ContactMessage";
import PageView from "../models/PageView";

const router = express.Router();

// Helper function to calculate reach-adjusted and viral-decayed views
export function calculateReach(blog: any, user: any): number {
  const rawViews = blog.viewCount || 0;
  const bMultiplier = blog.reachMultiplier ?? 1.0;
  const uMultiplier = user?.reachMultiplier ?? 1.0;
  
  // Calculate age of blog post for virality boost (first 72 hours)
  const ageInHours = (Date.now() - new Date(blog.createdAt).getTime()) / (1000 * 60 * 60);
  let viralityBoost = 0;
  
  if (ageInHours < 72) {
    // Decay curve: starts at 1500 views, decays to 100 views over 72 hours
    viralityBoost = Math.max(100, Math.round(1500 * (1 - ageInHours / 72)));
  }
  
  const multiplierViews = Math.round(rawViews * bMultiplier * uMultiplier);
  const configuredMinReach = blog.minReach || user?.minReach || 0;
  
  return Math.max(multiplierViews, configuredMinReach, viralityBoost);
}

// Helper to get the primary author (the first user in the DB) to serve as default for the public homepage
async function getDefaultUserId(): Promise<mongoose.Types.ObjectId | null> {
  const firstUser = await User.findOne().sort({ createdAt: 1 });
  return firstUser ? (firstUser._id as mongoose.Types.ObjectId) : null;
}

// ----------------------------------------------------
// 1. PROFILE API
// ----------------------------------------------------

// Get profile details (public/private)
router.get("/profile", optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { scope } = req.query;
    let userId: mongoose.Types.ObjectId | null = null;
    
    if (scope === "mine" && req.user) {
      userId = req.user._id as mongoose.Types.ObjectId;
    } else {
      userId = await getDefaultUserId();
    }

    if (!userId) {
      res.status(404).json({ message: "No author profile found. Please register first." });
      return;
    }

    const user = await User.findById(userId).select("-passwordHash");
    if (!user) {
      res.status(404).json({ message: "Profile not found." });
      return;
    }

    // React query client wrapper expects { ...profileDetails, profile: { ...profileDetails } }
    const profileData = user.toObject();
    res.json({
      ...profileData,
      profile: profileData
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error retrieving profile." });
  }
});

// Update profile details (private)
router.put("/profile", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { name, bio, profileImage, coverImage, phone, email, facebook, twitter, instagram, youtube, website, achievements, experience } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (coverImage !== undefined) user.coverImage = coverImage;
    if (phone !== undefined) user.phone = phone;
    if (email !== undefined) user.email = email;
    if (facebook !== undefined) user.facebook = facebook;
    if (twitter !== undefined) user.twitter = twitter;
    if (instagram !== undefined) user.instagram = instagram;
    if (youtube !== undefined) user.youtube = youtube;
    if (website !== undefined) user.website = website;
    if (achievements !== undefined) user.achievements = achievements;
    if (experience !== undefined) user.experience = experience;

    await user.save();
    
    const profileData = user.toObject();
    delete profileData.passwordHash;

    res.json({
      ...profileData,
      profile: profileData
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error updating profile." });
  }
});

// ----------------------------------------------------
// 2. BLOGS API
// ----------------------------------------------------

// List blogs (public cross-user global feed, private for logged-in user inside admin)
router.get("/blogs", optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, categoryId, search, limit, page, scope } = req.query;

    const query: any = {};

    if (scope === "mine" && req.user) {
      query.userId = req.user._id;
      if (status) {
        query.status = status;
      }
    } else {
      // Public feed shows only published blogs from all users
      query.status = "published";
      if (categoryId) {
        query.categoryId = categoryId;
      }
    }

    if (search) {
      const searchRegex = new RegExp(search as string, "i");
      query.$or = [
        { title: searchRegex },
        { excerpt: searchRegex },
        { content: searchRegex }
      ];
    }

    // Build options
    const skip = page && limit ? (Number(page) - 1) * Number(limit) : 0;
    const limitNum = limit ? Number(limit) : 0;

    const blogsQuery = Blog.find(query)
      .populate("userId", "name profileImage")
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const [blogs, total] = await Promise.all([
      blogsQuery.exec(),
      Blog.countDocuments(query)
    ]);

    // Enrich with author name and image flat fields
    const enrichedBlogs = blogs.map(blog => {
      const blogObj = blog.toObject();
      const userObj = blog.userId && typeof blog.userId === "object" ? blog.userId : null;
      if (userObj) {
        blogObj.authorName = (userObj as any).name;
        blogObj.authorImage = (userObj as any).profileImage;
        blogObj.authorVerified = (userObj as any).isVerified;
      }
      blogObj.viewCount = calculateReach(blog, userObj);
      return blogObj;
    });

    res.json({ blogs: enrichedBlogs, total });
  } catch (error) {
    console.error("List blogs error:", error);
    res.status(500).json({ message: "Server error listing blogs." });
  }
});

// Get blog by ID (public/private)
router.get("/blogs/:id", optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
      res.status(400).json({ message: "Invalid blog ID." });
      return;
    }

    const blog = await Blog.findById(req.params.id).populate("userId", "name profileImage bio");
    if (!blog) {
      res.status(404).json({ message: "Blog not found." });
      return;
    }

    // Secure drafts: only the author can access
    if (blog.status === "draft") {
      const isOwner = req.user && req.user._id && blog.userId && req.user._id.toString() === (blog.userId._id || blog.userId).toString();
      if (!isOwner) {
        res.status(404).json({ message: "Blog not found." });
        return;
      }
    }

    const blogObj = blog.toObject();
    const userObj = blog.userId && typeof blog.userId === "object" ? blog.userId : null;
    if (userObj) {
      blogObj.authorName = (userObj as any).name;
      blogObj.authorImage = (userObj as any).profileImage;
      blogObj.authorBio = (userObj as any).bio;
      blogObj.authorVerified = (userObj as any).isVerified;
    }
    blogObj.viewCount = calculateReach(blog, userObj);

    res.json({ blog: blogObj });
  } catch (error) {
    console.error("Get blog error:", error);
    res.status(500).json({ message: "Server error getting blog." });
  }
});

// Get blog by slug (public)
router.get("/blogs/slug/:slug", optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug }).populate("userId", "name profileImage bio");
    if (!blog) {
      res.status(404).json({ message: "Blog not found." });
      return;
    }

    // Secure drafts: only the author can access
    if (blog.status === "draft") {
      const isOwner = req.user && req.user._id && blog.userId && req.user._id.toString() === (blog.userId._id || blog.userId).toString();
      if (!isOwner) {
        res.status(404).json({ message: "Blog not found." });
        return;
      }
    }

    // Dynamically increment view count on read
    blog.viewCount = (blog.viewCount || 0) + 1;
    await blog.save();

    const blogObj = blog.toObject();
    const userObj = blog.userId && typeof blog.userId === "object" ? blog.userId : null;
    if (userObj) {
      blogObj.authorName = (userObj as any).name;
      blogObj.authorImage = (userObj as any).profileImage;
      blogObj.authorBio = (userObj as any).bio;
      blogObj.authorVerified = (userObj as any).isVerified;
    }
    blogObj.viewCount = calculateReach(blog, userObj);

    res.json(blogObj);
  } catch (error) {
    console.error("Get blog by slug error:", error);
    res.status(500).json({ message: "Server error getting blog by slug." });
  }
});

// Create Blog (private)
router.post("/blogs", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { title, slug, content, excerpt, status, categoryId, featuredImage, featured, seoTitle, seoDescription } = req.body;

    let categoryName = "";
    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (category) categoryName = category.name;
    }

    const newBlog = new Blog({
      title,
      slug,
      content,
      excerpt,
      status,
      categoryId: categoryId ? new mongoose.Types.ObjectId(categoryId) : undefined,
      categoryName,
      featuredImage,
      featured,
      seoTitle,
      seoDescription,
      userId,
      publishedAt: status === "published" ? new Date() : undefined
    });

    await newBlog.save();
    res.status(201).json(newBlog);
  } catch (error: any) {
    console.error("Create blog error:", error);
    res.status(500).json({ message: "Server error creating blog.", error: error.message });
  }
});

// Update Blog (private)
router.put("/blogs/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { title, slug, content, excerpt, status, categoryId, featuredImage, featured, seoTitle, seoDescription } = req.body;

    const blog = await Blog.findOne({ _id: req.params.id, userId });
    if (!blog) {
      res.status(404).json({ message: "Blog not found or unauthorized." });
      return;
    }

    if (title) blog.title = title;
    if (slug) blog.slug = slug;
    if (content) blog.content = content;
    if (excerpt !== undefined) blog.excerpt = excerpt;
    if (status) {
      if (status === "published" && blog.status !== "published") {
        blog.publishedAt = new Date();
      }
      blog.status = status;
    }
    if (categoryId !== undefined) {
      if (categoryId) {
        blog.categoryId = new mongoose.Types.ObjectId(categoryId);
        const category = await Category.findById(categoryId);
        blog.categoryName = category ? category.name : "";
      } else {
        blog.categoryId = undefined;
        blog.categoryName = "";
      }
    }
    if (featuredImage !== undefined) blog.featuredImage = featuredImage;
    if (featured !== undefined) blog.featured = featured;
    if (seoTitle !== undefined) blog.seoTitle = seoTitle;
    if (seoDescription !== undefined) blog.seoDescription = seoDescription;
    
    blog.updatedAt = new Date();

    await blog.save();
    res.json(blog);
  } catch (error) {
    console.error("Update blog error:", error);
    res.status(500).json({ message: "Server error updating blog." });
  }
});

// Delete Blog (private)
router.delete("/blogs/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const blog = await Blog.findOneAndDelete({ _id: req.params.id, userId });
    if (!blog) {
      res.status(404).json({ message: "Blog not found or unauthorized." });
      return;
    }
    // Delete comments associated with this blog
    await Comment.deleteMany({ blogId: req.params.id });

    res.json({ message: "Blog post deleted successfully." });
  } catch (error) {
    console.error("Delete blog error:", error);
    res.status(500).json({ message: "Server error deleting blog." });
  }
});

// ----------------------------------------------------
// 3. CATEGORIES API
// ----------------------------------------------------

// List categories (public with default, private inside auth context)
router.get("/categories", optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { scope } = req.query;
    
    if (scope === "mine" && req.user) {
      const targetUserId = req.user._id as mongoose.Types.ObjectId;
      const categories = await Category.find({ userId: targetUserId });
      
      // Enrich with post count for this user
      const enriched = await Promise.all(
        categories.map(async (cat) => {
          const count = await Blog.countDocuments({
            categoryId: cat._id,
            userId: targetUserId,
            status: "published"
          });
          return {
            id: cat._id,
            name: cat.name,
            postCount: count
          };
        })
      );

      const response = [...enriched] as any;
      response.categories = enriched;
      res.json(enriched);
      return;
    }

    // Public view: show all categories from all users
    const categories = await Category.find({});
    
    // Enrich with global post count
    const enriched = await Promise.all(
      categories.map(async (cat) => {
        const count = await Blog.countDocuments({
          categoryId: cat._id,
          status: "published"
        });
        return {
          id: cat._id,
          name: cat.name,
          postCount: count
        };
      })
    );

    const response = [...enriched] as any;
    response.categories = enriched;
    res.json(enriched);
  } catch (error) {
    console.error("List categories error:", error);
    res.status(500).json({ message: "Server error listing categories." });
  }
});

// Create Category (private)
router.post("/categories", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ message: "Category name is required." });
      return;
    }

    const existing = await Category.findOne({ name, userId });
    if (existing) {
      res.status(400).json({ message: "Category already exists." });
      return;
    }

    const newCat = new Category({ name, userId });
    await newCat.save();
    res.status(201).json(newCat);
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ message: "Server error creating category." });
  }
});

// Update Category (private)
router.put("/categories/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { name } = req.body;

    const cat = await Category.findOne({ _id: req.params.id, userId });
    if (!cat) {
      res.status(404).json({ message: "Category not found." });
      return;
    }

    cat.name = name;
    await cat.save();

    // Update related blogs
    await Blog.updateMany({ categoryId: cat._id }, { categoryName: name });

    res.json(cat);
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({ message: "Server error updating category." });
  }
});

// Delete Category (private)
router.delete("/categories/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const cat = await Category.findOneAndDelete({ _id: req.params.id, userId });
    if (!cat) {
      res.status(404).json({ message: "Category not found." });
      return;
    }

    // Unlink category on blogs
    await Blog.updateMany(
      { categoryId: req.params.id, userId },
      { $unset: { categoryId: 1, categoryName: 1 } }
    );

    res.json({ message: "Category deleted successfully." });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ message: "Server error deleting category." });
  }
});

// ----------------------------------------------------
// 4. ALBUMS & MEDIA API
// ----------------------------------------------------

// List Albums with nested photos (public/private)
router.get("/albums", optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { scope } = req.query;

    if (scope === "mine" && req.user) {
      const targetUserId = req.user._id as mongoose.Types.ObjectId;
      const albums = await Album.find({ userId: targetUserId });
      const enriched = await Promise.all(
        albums.map(async (album) => {
          const media = await Media.find({ albumId: album._id, userId: targetUserId });
          const photos = media.map(m => ({
            id: m._id,
            albumId: m.albumId,
            title: m.title,
            url: m.url,
            mimeType: m.mimeType,
            size: m.size,
            caption: m.caption,
            createdAt: m.createdAt
          }));
          return {
            id: album._id,
            name: album.name,
            description: album.description,
            photos,
            photoCount: photos.length
          };
        })
      );
      res.json(enriched);
      return;
    }

    // Public view: show all albums from all users
    const albums = await Album.find({});
    const enriched = await Promise.all(
      albums.map(async (album) => {
        const media = await Media.find({ albumId: album._id });
        const photos = media.map(m => ({
          id: m._id,
          albumId: m.albumId,
          title: m.title,
          url: m.url,
          mimeType: m.mimeType,
          size: m.size,
          caption: m.caption,
          createdAt: m.createdAt
        }));
        return {
          id: album._id,
          name: album.name,
          description: album.description,
          photos,
          photoCount: photos.length
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    console.error("List albums error:", error);
    res.status(500).json({ message: "Server error listing albums." });
  }
});

// Create Album (private)
router.post("/albums", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { name, description } = req.body;

    const newAlbum = new Album({ name, description, userId });
    await newAlbum.save();
    res.status(201).json(newAlbum);
  } catch (error) {
    console.error("Create album error:", error);
    res.status(500).json({ message: "Server error creating album." });
  }
});

// Update Album (private)
router.put("/albums/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { name, description } = req.body;

    const album = await Album.findOne({ _id: req.params.id, userId });
    if (!album) {
      res.status(404).json({ message: "Album not found." });
      return;
    }

    if (name) album.name = name;
    if (description !== undefined) album.description = description;

    await album.save();
    res.json(album);
  } catch (error) {
    console.error("Update album error:", error);
    res.status(500).json({ message: "Server error updating album." });
  }
});

// Delete Album (private)
router.delete("/albums/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const album = await Album.findOneAndDelete({ _id: req.params.id, userId });
    if (!album) {
      res.status(404).json({ message: "Album not found." });
      return;
    }
    // Delete all photos inside the album
    await Media.deleteMany({ albumId: req.params.id, userId });

    res.json({ message: "Album deleted successfully." });
  } catch (error) {
    console.error("Delete album error:", error);
    res.status(500).json({ message: "Server error deleting album." });
  }
});

// List Media Library items (private)
router.get("/media", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const media = await Media.find({ userId }).sort({ createdAt: -1 });
    const formatted = media.map(m => ({
      id: m._id,
      albumId: m.albumId,
      title: m.title,
      url: m.url,
      mimeType: m.mimeType,
      size: m.size,
      caption: m.caption,
      createdAt: m.createdAt
    }));
    res.json({ media: formatted });
  } catch (error) {
    console.error("List media error:", error);
    res.status(500).json({ message: "Server error listing media." });
  }
});

// Upload/Create Media Item (private)
router.post("/media", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { url, filename, title, albumId, caption, type, size } = req.body;

    const newMedia = new Media({
      albumId: albumId ? new mongoose.Types.ObjectId(albumId) : undefined,
      title: title || filename || "Uploaded Photo",
      url,
      mimeType: type || "image/jpeg",
      size: size || 0,
      caption: caption || "",
      userId
    });

    await newMedia.save();
    res.status(201).json(newMedia);
  } catch (error) {
    console.error("Create media error:", error);
    res.status(500).json({ message: "Server error saving media." });
  }
});

// Delete Media Item (private)
router.delete("/media/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const media = await Media.findOneAndDelete({ _id: req.params.id, userId });
    if (!media) {
      res.status(404).json({ message: "Media not found." });
      return;
    }
    res.json({ message: "Media file deleted successfully." });
  } catch (error) {
    console.error("Delete media error:", error);
    res.status(500).json({ message: "Server error deleting media." });
  }
});

// ----------------------------------------------------
// 5. COMMENTS API
// ----------------------------------------------------

// List comments (private for admin review)
router.get("/comments", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { status } = req.query;

    const query: any = { userId };
    if (status) query.status = status;

    const comments = await Comment.find(query).sort({ createdAt: -1 });
    const formatted = comments.map(c => ({
      id: c._id,
      blogId: c.blogId,
      blogTitle: c.blogTitle,
      authorName: c.authorName,
      authorEmail: c.authorEmail,
      content: c.content,
      status: c.status,
      createdAt: c.createdAt
    }));

    res.json({ comments: formatted, total: formatted.length });
  } catch (error) {
    console.error("List comments error:", error);
    res.status(500).json({ message: "Server error listing comments." });
  }
});

// Get comments for specific blog (public - returns only approved comments)
router.get("/blog-comments/:blogId", async (req: express.Request, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.blogId as string)) {
      res.status(400).json({ message: "Invalid blog ID." });
      return;
    }

    const comments = await Comment.find({
      blogId: req.params.blogId,
      status: "approved"
    }).sort({ createdAt: -1 });

    const formatted = comments.map(c => ({
      id: c._id,
      blogId: c.blogId,
      authorName: c.authorName,
      authorEmail: c.authorEmail,
      content: c.content,
      createdAt: c.createdAt
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Get blog comments error:", error);
    res.status(500).json({ message: "Server error loading comments." });
  }
});

// Submit comment (public)
router.post("/comments", async (req: express.Request, res: Response): Promise<void> => {
  try {
    const { blogId, authorName, authorEmail, content } = req.body;

    if (!blogId || !authorName || !authorEmail || !content) {
      res.status(400).json({ message: "All fields are required." });
      return;
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      res.status(404).json({ message: "Blog not found." });
      return;
    }

    const newComment = new Comment({
      blogId: blog._id,
      blogTitle: blog.title,
      authorName,
      authorEmail,
      content,
      status: "pending",
      userId: blog.userId // Owner of the blog manages comments
    });

    await newComment.save();
    res.status(201).json(newComment);
  } catch (error) {
    console.error("Submit comment error:", error);
    res.status(500).json({ message: "Server error submitting comment." });
  }
});

// Moderate comment (private)
router.put("/comments/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { status } = req.body;

    if (!status || !["approved", "rejected", "spam"].includes(status)) {
      res.status(400).json({ message: "Invalid status parameter." });
      return;
    }

    const comment = await Comment.findOne({ _id: req.params.id, userId });
    if (!comment) {
      res.status(404).json({ message: "Comment not found or unauthorized." });
      return;
    }

    comment.status = status;
    await comment.save();
    res.json(comment);
  } catch (error) {
    console.error("Moderate comment error:", error);
    res.status(500).json({ message: "Server error moderating comment." });
  }
});

// Delete comment (private)
router.delete("/comments/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const comment = await Comment.findOneAndDelete({ _id: req.params.id, userId });
    if (!comment) {
      res.status(404).json({ message: "Comment not found or unauthorized." });
      return;
    }
    res.json({ message: "Comment deleted successfully." });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ message: "Server error deleting comment." });
  }
});

// ----------------------------------------------------
// 6. TRAFFIC ANALYTICS API
// ----------------------------------------------------

// Get Dashboard Analytics (private)
router.get("/analytics/summary", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;

    const blogs = await Blog.find({ userId });
    const views = await PageView.find({ userId });
    const comments = await Comment.find({ userId });

    // Enrich view counts before partitioning/sorting
    const enrichedBlogs = blogs.map(blog => {
      const blogObj = blog.toObject();
      blogObj.viewCount = calculateReach(blog, req.user);
      return blogObj;
    });

    const published = enrichedBlogs.filter(b => b.status === "published");
    const drafts = enrichedBlogs.filter(b => b.status === "draft");
    const pending = comments.filter(c => c.status === "pending");

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    const todayViews = views.filter(v => new Date(v.timestamp).getTime() >= startOfToday).length;
    const monthlyViews = views.filter(v => new Date(v.timestamp).getTime() >= thirtyDaysAgo).length;

    // Recent published blogs
    const recent = [...published]
      .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime())
      .slice(0, 5);

    // Top viewed published blogs (sorted by reach-adjusted count)
    const top = [...published]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 5);

    // Popular categories with postCount
    const categories = await Category.find({ userId });
    const popularCats = await Promise.all(
      categories.map(async (cat) => {
        const count = await Blog.countDocuments({ categoryId: cat._id, userId, status: "published" });
        return { id: cat._id, name: cat.name, postCount: count };
      })
    );

    const filteredCats = popularCats
      .filter(c => c.postCount > 0)
      .sort((a, b) => b.postCount - a.postCount);

    res.json({
      summary: {
        totalVisitors: views.length,
        todayVisitors: todayViews,
        monthlyVisitors: monthlyViews,
        publishedBlogs: published.length,
        draftBlogs: drafts.length,
        pendingComments: pending.length,
        recentBlogs: recent,
        topBlogs: top,
        popularCategories: filteredCats,
        pageViews: views
      },
      stats: {
        publishedBlogs: published.length,
        draftBlogs: drafts.length,
        totalVisitors: views.length,
        pendingComments: pending.length,
        recentBlogs: recent,
        topBlogs: top
      }
    });
  } catch (error) {
    console.error("Get analytics summary error:", error);
    res.status(500).json({ message: "Server error loading dashboard analytics." });
  }
});

// Get Visitor Statistics Over Time (private)
router.get("/analytics/visitor-stats", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { start, end } = req.query;

    if (!start || !end) {
      res.status(400).json({ message: "Start and end dates are required." });
      return;
    }

    const views = await PageView.find({ userId });
    const startTime = new Date(start as string).getTime();
    const endTime = new Date(end as string).getTime() + 86400000; // inclusive

    const dateMap: Record<string, { count: number; userAgents: Set<string> }> = {};

    let current = startTime;
    while (current < endTime) {
      const dateStr = new Date(current).toISOString().split("T")[0];
      dateMap[dateStr] = { count: 0, userAgents: new Set() };
      current += 24 * 60 * 60 * 1000;
    }

    views.forEach(v => {
      const t = new Date(v.timestamp).getTime();
      if (t >= startTime && t < endTime) {
        const dateStr = new Date(v.timestamp).toISOString().split("T")[0];
        if (dateMap[dateStr] !== undefined) {
          dateMap[dateStr].count++;
          if (v.userAgent) {
            dateMap[dateStr].userAgents.add(v.userAgent);
          }
        }
      }
    });

    const stats = Object.entries(dateMap).map(([date, data]) => ({
      date,
      count: data.count,
      visitors: data.userAgents.size || 1
    })).sort((a, b) => a.date.localeCompare(b.date));

    res.json({ stats });
  } catch (error) {
    console.error("Get visitor stats error:", error);
    res.status(500).json({ message: "Server error retrieving visitor stats." });
  }
});

// Track page view (public)
router.post("/analytics/track", async (req: express.Request, res: Response): Promise<void> => {
  try {
    const { path } = req.body;
    if (!path) {
      res.status(400).json({ message: "Path is required." });
      return;
    }

    let targetUserId: mongoose.Types.ObjectId | null = null;

    // If path is a blog post, resolve its author
    const blogMatch = path.match(/^\/blog\/([^/]+)$/);
    if (blogMatch) {
      const slug = blogMatch[1];
      const blog = await Blog.findOne({ slug });
      if (blog && blog.userId) {
        targetUserId = blog.userId as mongoose.Types.ObjectId;
      }
    }

    const newView = new PageView({
      path,
      userAgent: req.headers["user-agent"] || "",
      userId: targetUserId || undefined
    });

    await newView.save();
    res.status(201).json(newView);
  } catch (error) {
    console.error("Track view error:", error);
    res.status(500).json({ message: "Server error logging page view." });
  }
});

// ----------------------------------------------------
// 7. CONTACT MESSAGES API
// ----------------------------------------------------

// List Messages (private)
router.get("/contact", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const messages = await ContactMessage.find({ userId }).sort({ createdAt: -1 });
    res.json({ messages, total: messages.length });
  } catch (error) {
    console.error("List contact messages error:", error);
    res.status(500).json({ message: "Server error loading messages." });
  }
});

// Submit Message (public)
router.post("/contact", async (req: express.Request, res: Response): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      res.status(400).json({ message: "All fields are required." });
      return;
    }

    const targetUserId = await getDefaultUserId();
    if (!targetUserId) {
      res.status(404).json({ message: "No active author profile to receive messages." });
      return;
    }

    const newMsg = new ContactMessage({
      name,
      email,
      subject,
      message,
      status: "unread",
      userId: targetUserId
    });

    await newMsg.save();
    res.status(201).json(newMsg);
  } catch (error) {
    console.error("Submit message error:", error);
    res.status(500).json({ message: "Server error submitting message." });
  }
});

// Delete Message (private)
router.delete("/contact/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const msg = await ContactMessage.findOneAndDelete({ _id: req.params.id, userId });
    if (!msg) {
      res.status(404).json({ message: "Message not found." });
      return;
    }
    res.json({ message: "Message deleted successfully." });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({ message: "Server error deleting message." });
  }
});

export default router;
