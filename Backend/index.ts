import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import authRoutes from "./routes/auth";
import apiRoutes from "./routes/api";
import superadminRoutes from "./routes/superadmin";
import socialRoutes from "./routes/social";
import User from "./models/User";
import Category from "./models/Category";
import Album from "./models/Album";
import Media from "./models/Media";


// Load environment variables
// Triggering fresh rebuild for Render database connection
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/blog_publisher_pro";

// Middlewares
app.use(cors({
  origin: true, // Allow requests from all origins (including localhost:5173/5174)
  credentials: true
}));

// Increase JSON body limit to support base64 image uploads in media gallery
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Route mounts
app.use("/api/auth", authRoutes);
app.use("/api", apiRoutes);
app.use("/api/superadmin", superadminRoutes);
app.use("/api/social", socialRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

// Seed Super Admin if not already present
async function seedSuperAdmin(): Promise<void> {
  try {
    let superAdmin = await User.findOne({ role: "superadmin" });
    if (!superAdmin) {
      const email = "superadmin@gurujan.com";
      const defaultPassword = process.env.SUPERADMIN_DEFAULT_PASSWORD || "SuperAdminSecurePassword123!";
      
      // Calculate SHA-256 hash of email (stored in database for anonymity and security)
      const emailHash = crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
      
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(defaultPassword, salt);
      
      superAdmin = new User({
        name: "Super Admin",
        email: emailHash, // Email is hashed!
        passwordHash,
        role: "superadmin",
        bio: "System Administrator for Gurujan publishing portal.",
        isVerified: true
      });
      
      await superAdmin.save();
      console.log("------------------------------------------------------------");
      console.log("Super Admin seeded successfully!");
      console.log(`Email (in database): ${emailHash}`);
      console.log("------------------------------------------------------------");
    }

    // Seed default categories for Super Admin if they do not exist yet
    const categoryCount = await Category.countDocuments({ userId: superAdmin._id });
    if (categoryCount === 0) {
      const defaultCategories = [
        "Spirituality (आध्यात्मिकता)",
        "Mental Health (मानसिक स्वास्थ्य)",
        "Education (शिक्षा)",
        "Society (समाज)",
        "Literature (साहित्य)",
        "Philosophy (दर्शन)"
      ];
      
      const categoryDocs = defaultCategories.map(name => ({
        name,
        userId: superAdmin!._id
      }));
      
      await Category.insertMany(categoryDocs);
      console.log("Seeded default blog categories for Super Admin successfully.");
    }
    
    // Seed default gallery albums and images
    await seedGallery(superAdmin._id as mongoose.Types.ObjectId);
  } catch (error) {
    console.error("Failed to seed Super Admin / categories:", error);
  }
}

// Seed default gallery albums and images
async function seedGallery(superAdminId: mongoose.Types.ObjectId): Promise<void> {
  try {
    const albumCount = await Album.countDocuments({ userId: superAdminId });
    if (albumCount === 0) {
      console.log("Seeding default gallery albums and images for Super Admin...");
      
      const spiritualityAlbum = new Album({
        name: "Spirituality (आध्यात्मिकता)",
        description: "Shedding light on the inner journey, meditation, and sacred spaces.",
        userId: superAdminId
      });
      await spiritualityAlbum.save();

      const scienceAlbum = new Album({
        name: "Science & Universe (विज्ञान और ब्रह्मांड)",
        description: "Exploring the cosmos, laboratory discoveries, and the wonders of scientific inquiry.",
        userId: superAdminId
      });
      await scienceAlbum.save();

      const creativeAlbum = new Album({
        name: "Editorial & Creative (संपादकीय और रचना)",
        description: "Captured moments of literary creation, classic typewriters, and creative workspaces.",
        userId: superAdminId
      });
      await creativeAlbum.save();

      const spiritualityPhotos = [
        {
          title: "Meditation at Sunrise",
          url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=60",
          caption: "Finding inner peace and mindfulness amidst the silence of dawn.",
          albumId: spiritualityAlbum._id,
          userId: superAdminId
        },
        {
          title: "Sacred Temple",
          url: "https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&auto=format&fit=crop&q=60",
          caption: "Ancient architectures radiating timeless spiritual energy and tranquility.",
          albumId: spiritualityAlbum._id,
          userId: superAdminId
        },
        {
          title: "Zen Stone Garden",
          url: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&auto=format&fit=crop&q=60",
          caption: "Perfect balance and focus represented through stacked river stones.",
          albumId: spiritualityAlbum._id,
          userId: superAdminId
        },
        {
          title: "Glow of the Diya",
          url: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=800&auto=format&fit=crop&q=60",
          caption: "Dispelling darkness with the warm, serene flame of a traditional oil lamp.",
          albumId: spiritualityAlbum._id,
          userId: superAdminId
        }
      ];

      const sciencePhotos = [
        {
          title: "Deep Space Nebula",
          url: "https://images.unsplash.com/photo-1464802686167-b939a6910659?w=800&auto=format&fit=crop&q=60",
          caption: "Gazing into the vastness of the cosmos, filled with dust, gas, and infinite possibilities.",
          albumId: scienceAlbum._id,
          userId: superAdminId
        },
        {
          title: "Scientific Research",
          url: "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?w=800&auto=format&fit=crop&q=60",
          caption: "Unlocking secrets of life through microscopic details in modern laboratories.",
          albumId: scienceAlbum._id,
          userId: superAdminId
        },
        {
          title: "Chemical Glassware",
          url: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=800&auto=format&fit=crop&q=60",
          caption: "Precise experiments and solutions reacting in standard laboratory beakers.",
          albumId: scienceAlbum._id,
          userId: superAdminId
        },
        {
          title: "Interconnected Data",
          url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=60",
          caption: "Visualizing the beauty of complex data networks and computational neuroscience.",
          albumId: scienceAlbum._id,
          userId: superAdminId
        }
      ];

      const creativePhotos = [
        {
          title: "Vintage Typewriter",
          url: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop&q=60",
          caption: "Every keypress is a step closer to expressing human thoughts and stories.",
          albumId: creativeAlbum._id,
          userId: superAdminId
        },
        {
          title: "Treasures of Wisdom",
          url: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&auto=format&fit=crop&q=60",
          caption: "A beautifully stacked library representing centuries of accumulated literature.",
          albumId: creativeAlbum._id,
          userId: superAdminId
        },
        {
          title: "Writer's Companion",
          url: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800&auto=format&fit=crop&q=60",
          caption: "A fresh notebook, an ink pen, and an open book ready for new ideas.",
          albumId: creativeAlbum._id,
          userId: superAdminId
        },
        {
          title: "Creative Workspace",
          url: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=60",
          caption: "The quiet desk where words flow and stories come to life.",
          albumId: creativeAlbum._id,
          userId: superAdminId
        }
      ];

      await Media.insertMany([
        ...spiritualityPhotos,
        ...sciencePhotos,
        ...creativePhotos
      ]);

      console.log("Successfully seeded default gallery albums and images!");
    }
  } catch (error) {
    console.error("Failed to seed gallery albums and images:", error);
  }
}


// Database Connection and Server Startup
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB successfully at:", MONGODB_URI);
    await seedSuperAdmin();
    app.listen(PORT, () => {
      console.log(`Backend server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    console.log("Starting server in fallback mode (database disconnected)...");
    
    // Start server anyway so the frontend doesn't crash on connection drop
    app.listen(PORT, () => {
      console.log(`Backend server running in fallback mode on port ${PORT}`);
    });
  });
