// IndexedDB client-side database layer for Standalone React CMS
// Stores blogs, categories, comments, albums, media library items, profile settings, contacts, and page view logs

export interface LocalBlog {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  status: "draft" | "published";
  categoryId?: number;
  categoryName?: string;
  featuredImage?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  featured?: boolean;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface LocalCategory {
  id: number;
  name: string;
  postCount?: number;
}

export interface LocalComment {
  id: number;
  blogId: number;
  blogTitle?: string;
  authorName: string;
  authorEmail: string;
  content: string;
  status: "pending" | "approved" | "rejected" | "spam";
  createdAt: string;
}

export interface LocalAlbum {
  id: number;
  name: string;
  description?: string;
  photoCount?: number;
}

export interface LocalMedia {
  id: number;
  albumId?: number;
  title: string;
  url: string; // URL or Base64 Data URL
  mimeType: string;
  size: number;
  createdAt: string;
  caption?: string;
}

export interface LocalProfile {
  id: number;
  name: string;
  profileImage?: string;
  coverImage?: string;
  bio: string;
  email?: string;
  phone?: string;
  website?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  achievements?: string;
  experience?: string;
  socialLinks?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export interface LocalContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "read" | "unread";
  createdAt: string;
}

export interface LocalPageView {
  id: number;
  path: string;
  userAgent?: string;
  timestamp: string;
}

const DB_NAME = "BlogPublisherProDB";
const DB_VERSION = 4;

export class LocalStore {
  private db: IDBDatabase | null = null;

  init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) return resolve();
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => {
        console.error("IndexedDB open request error");
        reject(request.error);
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains("blogs")) {
          db.createObjectStore("blogs", { keyPath: "id", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains("categories")) {
          db.createObjectStore("categories", { keyPath: "id", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains("comments")) {
          db.createObjectStore("comments", { keyPath: "id", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains("albums")) {
          db.createObjectStore("albums", { keyPath: "id", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains("media")) {
          db.createObjectStore("media", { keyPath: "id", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains("profile")) {
          db.createObjectStore("profile", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("contact_messages")) {
          db.createObjectStore("contact_messages", { keyPath: "id", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains("page_views")) {
          db.createObjectStore("page_views", { keyPath: "id", autoIncrement: true });
        }
        const transaction = (event.currentTarget as IDBOpenDBRequest).transaction;
        if (transaction) {
          this.seedDefaultData(db, transaction);
        }
      };
    });
  }

  private seedDefaultData(db: IDBDatabase, transaction: IDBTransaction): void {
    const profileStore = transaction.objectStore("profile");
    const categoryStore = transaction.objectStore("categories");
    const blogStore = transaction.objectStore("blogs");
    const albumStore = transaction.objectStore("albums");
    const mediaStore = transaction.objectStore("media");
    const commentStore = transaction.objectStore("comments");
    const pageViewStore = transaction.objectStore("page_views");
    const contactMessageStore = transaction.objectStore("contact_messages");

    const profile: LocalProfile = {
      id: 1,
      name: "Dr. Shashi Bhushan Pandey",
      bio: "Reflections on spirituality, education, society, and the human experience — written with care, in Hindi and English.",
      email: "shashi.bhushan.pandey@example.com",
      phone: "+91 98765 43210",
      facebook: "https://facebook.com",
      twitter: "https://twitter.com",
      instagram: "https://instagram.com",
      youtube: "https://youtube.com",
      website: "https://example.com",
      achievements: "• Doctoral Degree in Spiritual Philosophy & Human Values\n• Recipient of National Award for Educational Innovation\n• Author of 5 Books on Mindfulness and Holistic Living\n• Keynote Speaker at 50+ National & International Conferences",
      experience: "• 25+ Years of Academic and Administrative Experience in Higher Education\n• Editorial Contributor to Leading Hindi and English Spiritual Journals\n• Spiritual Guide and Meditation Instructor for over a decade\n• Advisor to various educational and social development NGOs",
      socialLinks: {
        twitter: "https://twitter.com",
        facebook: "https://facebook.com",
        instagram: "https://instagram.com",
        linkedin: "https://linkedin.com"
      }
    };
    profileStore.put(profile);

    // Clear existing data to ensure a fresh, empty workspace
    categoryStore.clear();
    blogStore.clear();
    albumStore.clear();
    mediaStore.clear();
    commentStore.clear();
    pageViewStore.clear();
    contactMessageStore.clear();

    const categories: LocalCategory[] = [
      { id: 1, name: "Spiritual (धार्मिक)" },
      { id: 2, name: "Education (शिक्षा)" },
      { id: 3, name: "Technology (तकनीकी)" },
      { id: 4, name: "Society (सामाजिक)" },
      { id: 5, name: "Health (स्वास्थ्य)" },
      { id: 6, name: "Politics (राजनीति)" }
    ];
    categories.forEach(c => categoryStore.put(c));
  }

  private getStore(storeName: string, mode: IDBTransactionMode = "readonly"): IDBObjectStore {
    if (!this.db) throw new Error("Database not initialized");
    return this.db.transaction(storeName, mode).objectStore(storeName);
  }

  async getProfile(): Promise<LocalProfile> {
    await this.init();
    return new Promise((resolve, reject) => {
      const request = this.getStore("profile").get(1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateProfile(data: Partial<LocalProfile>): Promise<LocalProfile> {
    await this.init();
    const current = await this.getProfile();
    const updated = { ...current, ...data, id: 1 };
    return new Promise((resolve, reject) => {
      const request = this.getStore("profile", "readwrite").put(updated);
      request.onsuccess = () => resolve(updated);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const request = this.getStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getById<T>(storeName: string, id: number): Promise<T | null> {
    await this.init();
    return new Promise((resolve, reject) => {
      const request = this.getStore(storeName).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async save<T extends { id?: number }>(storeName: string, data: T): Promise<T> {
    await this.init();
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, "readwrite");
      if (data.id === undefined) {
        delete data.id;
      }
      const request = store.put(data);
      request.onsuccess = () => {
        const id = request.result as number;
        resolve({ ...data, id });
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: number): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const request = this.getStore(storeName, "readwrite").delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getBlogBySlug(slug: string): Promise<LocalBlog | null> {
    const blogs = await this.getAll<LocalBlog>("blogs");
    const blog = blogs.find(b => b.slug === slug);
    if (blog) {
      blog.viewCount = (blog.viewCount || 0) + 1;
      await this.save("blogs", blog);
    }
    return blog || null;
  }

  async getDatabaseDump(): Promise<string> {
    await this.init();
    const stores = ["profile", "categories", "blogs", "albums", "media", "comments", "contact_messages", "page_views"];
    const dump: Record<string, any[]> = {};
    for (const store of stores) {
      dump[store] = await this.getAll(store);
    }
    return JSON.stringify(dump, null, 2);
  }

  async restoreDatabaseDump(jsonStr: string): Promise<void> {
    await this.init();
    const dump = JSON.parse(jsonStr);
    const stores = ["profile", "categories", "blogs", "albums", "media", "comments", "contact_messages", "page_views"];
    if (!dump || typeof dump !== "object") {
      throw new Error("Invalid dump format");
    }
    for (const storeName of stores) {
      if (!Array.isArray(dump[storeName])) continue;
      const store = this.getStore(storeName, "readwrite");
      await new Promise<void>((resolve, reject) => {
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      for (const item of dump[storeName]) {
        await new Promise<void>((resolve, reject) => {
          const req = store.put(item);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      }
    }
  }
}

export const localStore = new LocalStore();