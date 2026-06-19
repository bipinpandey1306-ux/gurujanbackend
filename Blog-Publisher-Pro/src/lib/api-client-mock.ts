import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "./auth-mock";

// Types corresponding to backend schemas
export interface Blog {
  id: string;
  _id?: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  status: "draft" | "published";
  categoryId?: string;
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
  authorName?: string;
  authorImage?: string;
  authorBio?: string;
}

export interface Category {
  id: string;
  _id?: string;
  name: string;
  postCount?: number;
}

export interface Comment {
  id: string;
  _id?: string;
  blogId: string;
  blogTitle?: string;
  authorName: string;
  authorEmail: string;
  content: string;
  status: "pending" | "approved" | "rejected" | "spam";
  createdAt: string;
}

export interface Album {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  photos?: Photo[];
  photoCount?: number;
}

export interface Photo {
  id: string;
  _id?: string;
  albumId?: string;
  title: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
  caption?: string;
}

export interface Profile {
  id: string;
  _id?: string;
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
}

export interface ContactMessage {
  id: string;
  _id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "read" | "unread";
  createdAt: string;
}

export interface PageView {
  id: string;
  _id?: string;
  path: string;
  userAgent?: string;
  timestamp: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role?: string;
  isVerified?: boolean;
}

// Global API Fetch Helper
async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const baseUrl = import.meta.env.VITE_API_URL || "";
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${res.status}`);
  }

  const data = await res.json();
  
  // Normalize Mongoose `_id` to `id` for frontend components compatibility
  const normalizeId = (obj: any): any => {
    if (!obj || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(normalizeId);
    
    const newObj = { ...obj };
    if (newObj._id) {
      newObj.id = newObj._id.toString();
    }
    
    // Normalize nested keys recursively
    for (const key of Object.keys(newObj)) {
      if (typeof newObj[key] === "object") {
        newObj[key] = normalizeId(newObj[key]);
      }
    }
    return newObj;
  };

  return normalizeId(data);
}

// Query Keys Helper Functions
export const getGetProfileQueryKey = (params?: any) => ["profile", params];
export const getListBlogsQueryKey = (params?: any) => ["blogs", params];
export const getGetBlogQueryKey = (id: string | number) => ["blog", id];
export const getGetBlogBySlugQueryKey = (slug: string) => ["blog-by-slug", slug];
export const getListCategoriesQueryKey = (params?: any) => ["categories", params];
export const getListAlbumsQueryKey = (params?: any) => ["albums", params];
export const getListMediaQueryKey = () => ["media"];
export const getListCommentsQueryKey = (params?: any) => ["comments", params];
export const getListBlogCommentsQueryKey = (blogId: string | number) => ["blog-comments", blogId];
export const getGetAnalyticsSummaryQueryKey = () => ["analytics-summary"];
export const getGetVisitorStatsQueryKey = (params?: any) => ["visitor-stats", params];
export const getListContactMessagesQueryKey = () => ["contact-messages"];

// 1. Profile Hooks
export function useGetProfile(params?: { scope?: "mine" | "public" }) {
  return useQuery<Profile & { profile: Profile }>({
    queryKey: getGetProfileQueryKey(params),
    queryFn: () => {
      const q = new URLSearchParams();
      if (params?.scope) q.append("scope", params.scope);
      return apiRequest<Profile & { profile: Profile }>(`/api/profile?${q.toString()}`);
    }
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: Partial<Profile> }) => 
      apiRequest<Profile & { profile: Profile }>("/api/profile", {
        method: "PUT",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getGetProfileQueryKey() });
    }
  });
}

// 2. Blog Hooks
export function useListBlogs(params?: { status?: "draft" | "published"; categoryId?: string | number; limit?: number; search?: string; page?: number; scope?: "mine" | "public" }) {
  return useQuery<{ blogs: Blog[]; total: number }>({
    queryKey: getListBlogsQueryKey(params),
    queryFn: () => {
      const q = new URLSearchParams();
      if (params?.scope) {
        q.append("scope", params.scope);
      } else if (params?.status === "draft") {
        q.append("scope", "mine");
      }
      if (params?.status) q.append("status", params.status);
      if (params?.categoryId) q.append("categoryId", params.categoryId.toString());
      if (params?.search) q.append("search", params.search);
      if (params?.limit) q.append("limit", params.limit.toString());
      if (params?.page) q.append("page", params.page.toString());
      return apiRequest<{ blogs: Blog[]; total: number }>(`/api/blogs?${q.toString()}`);
    }
  });
}

export function useGetBlog(id: string | number, options?: { query?: { queryKey?: any[]; enabled?: boolean } }) {
  return useQuery<{ blog: Blog | null }>({
    queryKey: getGetBlogQueryKey(id),
    queryFn: () => apiRequest<{ blog: Blog | null }>(`/api/blogs/${id}`),
    enabled: options?.query?.enabled !== false
  });
}

export function useGetBlogBySlug(slug: string, options?: { query?: { queryKey?: any[]; enabled?: boolean } }) {
  return useQuery<Blog | null>({
    queryKey: getGetBlogBySlugQueryKey(slug),
    queryFn: () => apiRequest<Blog | null>(`/api/blogs/slug/${slug}`),
    enabled: options?.query?.enabled !== false
  });
}

export function useGetFeaturedBlogs() {
  return useQuery<Blog[]>({
    queryKey: ["featured-blogs"],
    queryFn: async () => {
      const data = await apiRequest<{ blogs: Blog[] }>("/api/blogs?status=published");
      return data.blogs.filter(b => b.featured);
    }
  });
}

export function useCreateBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: Omit<Blog, "id" | "createdAt" | "updatedAt" | "viewCount"> }) => 
      apiRequest<Blog>("/api/blogs", {
        method: "POST",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blogs"] });
      qc.invalidateQueries({ queryKey: ["featured-blogs"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["analytics-summary"] });
    }
  });
}

export function useUpdateBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<Blog> }) => 
      apiRequest<Blog>(`/api/blogs/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["blogs"] });
      qc.invalidateQueries({ queryKey: ["featured-blogs"] });
      qc.invalidateQueries({ queryKey: ["blog", variables.id] });
      qc.invalidateQueries({ queryKey: ["blog-by-slug"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["analytics-summary"] });
    }
  });
}

export function useDeleteBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string | number }) => 
      apiRequest<{ message: string }>(`/api/blogs/${variables.id}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blogs"] });
      qc.invalidateQueries({ queryKey: ["featured-blogs"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["analytics-summary"] });
    }
  });
}

// 3. Category Hooks
export function useListCategories(params?: { scope?: "mine" | "public" }) {
  return useQuery<Category[] & { categories: Category[] }>({
    queryKey: getListCategoriesQueryKey(params),
    queryFn: async () => {
      const q = new URLSearchParams();
      if (params?.scope) q.append("scope", params.scope);
      const list = await apiRequest<Category[]>(`/api/categories?${q.toString()}`);
      const response = [...list] as any;
      response.categories = list;
      return response;
    }
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: { name: string } }) => 
      apiRequest<Category>("/api/categories", {
        method: "POST",
        body: JSON.stringify({ name: data.name })
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["analytics-summary"] });
    }
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: { name: string } }) => 
      apiRequest<Category>(`/api/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name: data.name })
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      qc.invalidateQueries({ queryKey: ["blogs"] });
      qc.invalidateQueries({ queryKey: ["blog"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["analytics-summary"] });
    }
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string | number }) => 
      apiRequest<{ message: string }>(`/api/categories/${variables.id}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      qc.invalidateQueries({ queryKey: ["blogs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["analytics-summary"] });
    }
  });
}

// 4. Album & Gallery Hooks
export function useListAlbums(params?: { scope?: "mine" | "public" }) {
  return useQuery<Album[] & { albums: Album[] }>({
    queryKey: getListAlbumsQueryKey(params),
    queryFn: async () => {
      const q = new URLSearchParams();
      if (params?.scope) q.append("scope", params.scope);
      const list = await apiRequest<Album[]>(`/api/albums?${q.toString()}`);
      const response = [...list] as any;
      response.albums = list;
      return response;
    }
  });
}

export function useCreateAlbum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: { name: string; description?: string } }) => 
      apiRequest<Album>("/api/albums", {
        method: "POST",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListAlbumsQueryKey() });
    }
  });
}

export function useUpdateAlbum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: { name: string; description?: string } }) => 
      apiRequest<Album>(`/api/albums/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListAlbumsQueryKey() });
    }
  });
}

export function useDeleteAlbum() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string | number }) => 
      apiRequest<{ message: string }>(`/api/albums/${variables.id}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListAlbumsQueryKey() });
      qc.invalidateQueries({ queryKey: getListMediaQueryKey() });
    }
  });
}

export function useAddPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ albumId, data }: { albumId: string | number; data: { url: string; caption?: string } }) => 
      apiRequest<Photo>("/api/media", {
        method: "POST",
        body: JSON.stringify({
          url: data.url,
          title: data.caption || "Photo",
          caption: data.caption,
          albumId
        })
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListAlbumsQueryKey() });
      qc.invalidateQueries({ queryKey: getListMediaQueryKey() });
    }
  });
}

export function useDeletePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string | number }) => 
      apiRequest<{ message: string }>(`/api/media/${variables.id}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListAlbumsQueryKey() });
      qc.invalidateQueries({ queryKey: getListMediaQueryKey() });
    }
  });
}

// 5. Media Library Hooks
export function useListMedia() {
  return useQuery<{ media: Photo[] }>({
    queryKey: getListMediaQueryKey(),
    queryFn: () => apiRequest<{ media: Photo[] }>("/api/media")
  });
}

export function useUploadMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: { url: string; filename?: string; type?: string; size?: number } }) => 
      apiRequest<Photo>("/api/media", {
        method: "POST",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListMediaQueryKey() });
    }
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string | number }) => 
      apiRequest<{ message: string }>(`/api/media/${variables.id}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListMediaQueryKey() });
      qc.invalidateQueries({ queryKey: getListAlbumsQueryKey() });
    }
  });
}

// 6. Comments Hooks
export function useListComments(params?: { status?: string }) {
  return useQuery<{ comments: Comment[]; total: number }>({
    queryKey: getListCommentsQueryKey(params),
    queryFn: () => {
      const q = params?.status ? `?status=${params.status}` : "";
      return apiRequest<{ comments: Comment[]; total: number }>(`/api/comments${q}`);
    }
  });
}

export function useListBlogComments(blogId: string | number, options?: { query?: { queryKey?: any[]; enabled?: boolean } }) {
  return useQuery<Comment[]>({
    queryKey: getListBlogCommentsQueryKey(blogId),
    queryFn: () => apiRequest<Comment[]>(`/api/blog-comments/${blogId}`),
    enabled: options?.query?.enabled !== false
  });
}

export function useSubmitComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ blogId, data }: { blogId: string | number; data: { authorName: string; authorEmail: string; content: string } }) => 
      apiRequest<Comment>("/api/comments", {
        method: "POST",
        body: JSON.stringify({ blogId, ...data })
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: getListBlogCommentsQueryKey(variables.blogId) });
      qc.invalidateQueries({ queryKey: getListCommentsQueryKey() });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["analytics-summary"] });
    }
  });
}

export function useModerateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: { status: "approved" | "rejected" | "spam" } }) => 
      apiRequest<Comment>(`/api/comments/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: data.status })
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListCommentsQueryKey() });
      qc.invalidateQueries({ queryKey: ["blog-comments"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["analytics-summary"] });
    }
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string | number }) => 
      apiRequest<{ message: string }>(`/api/comments/${variables.id}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListCommentsQueryKey() });
      qc.invalidateQueries({ queryKey: ["blog-comments"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["analytics-summary"] });
    }
  });
}

// 7. Analytics Hooks
export function useGetAnalyticsSummary() {
  return useQuery<{
    summary: {
      totalVisitors: number;
      todayVisitors: number;
      monthlyVisitors: number;
      publishedBlogs: number;
      draftBlogs: number;
      pendingComments: number;
      recentBlogs: Blog[];
      topBlogs: Blog[];
      popularCategories: { id: string; name: string; postCount: number }[];
      pageViews: PageView[];
    };
  }>({
    queryKey: getGetAnalyticsSummaryQueryKey(),
    queryFn: () => apiRequest<{
      summary: {
        totalVisitors: number;
        todayVisitors: number;
        monthlyVisitors: number;
        publishedBlogs: number;
        draftBlogs: number;
        pendingComments: number;
        recentBlogs: Blog[];
        topBlogs: Blog[];
        popularCategories: { id: string; name: string; postCount: number }[];
        pageViews: PageView[];
      };
    }>("/api/analytics/summary")
  });
}

export function useGetVisitorStats(params: { start: string; end: string }) {
  return useQuery<{ stats: { date: string; count: number; visitors: number }[] }>({
    queryKey: getGetVisitorStatsQueryKey(params),
    queryFn: () => apiRequest<{ stats: { date: string; count: number; visitors: number }[] }>(
      `/api/analytics/visitor-stats?start=${params.start}&end=${params.end}`
    )
  });
}

export function useTrackPageView() {
  return useMutation({
    mutationFn: ({ data }: { data: { path: string } }) => 
      apiRequest<PageView>("/api/analytics/track", {
        method: "POST",
        body: JSON.stringify(data)
      })
  });
}

// 8. Contact Message Hooks
export function useSubmitContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: { name: string; email: string; subject: string; message: string } }) => 
      apiRequest<ContactMessage>("/api/contact", {
        method: "POST",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListContactMessagesQueryKey() });
    }
  });
}

export function useListContactMessages() {
  return useQuery<{ messages: ContactMessage[]; total: number }>({
    queryKey: getListContactMessagesQueryKey(),
    queryFn: () => apiRequest<{ messages: ContactMessage[]; total: number }>("/api/contact")
  });
}

export function useDeleteContactMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string | number }) => 
      apiRequest<{ message: string }>(`/api/contact/${variables.id}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListContactMessagesQueryKey() });
    }
  });
}

// Dashboard statistics widget hook
export function useGetDashboardStats() {
  return useQuery<{
    stats: {
      publishedBlogs: number;
      draftBlogs: number;
      totalVisitors: number;
      pendingComments: number;
      recentBlogs: Blog[];
      topBlogs: Blog[];
    };
  }>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const data = await apiRequest<{
        stats: {
          publishedBlogs: number;
          draftBlogs: number;
          totalVisitors: number;
          pendingComments: number;
          recentBlogs: Blog[];
          topBlogs: Blog[];
        };
      }>("/api/analytics/summary");
      return data;
    }
  });
}

// 9. Super Admin Hooks
export interface SuperadminUser {
  id: string;
  name: string;
  email: string;
  bio?: string;
  profileImage?: string;
  role: "user" | "superadmin";
  isVerified: boolean;
  isBlocked: boolean;
  reachMultiplier: number;
  minReach: number;
  createdAt: string;
}

export function useSuperadminUsers() {
  return useQuery<{ users: SuperadminUser[] }>({
    queryKey: ["superadmin-users"],
    queryFn: () => apiRequest<{ users: SuperadminUser[] }>("/api/superadmin/users")
  });
}

export function useSuperadminStats() {
  return useQuery<{
    totalUsers: number;
    totalBlogs: number;
    blockedUsers: number;
    verifiedUsers: number;
    totalViews: number;
  }>({
    queryKey: ["superadmin-stats"],
    queryFn: () => apiRequest<{
      totalUsers: number;
      totalBlogs: number;
      blockedUsers: number;
      verifiedUsers: number;
      totalViews: number;
    }>("/api/superadmin/stats")
  });
}

export function useSuperadminVerifyUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      apiRequest<{ user: SuperadminUser }>(`/api/superadmin/users/${id}/verify`, {
        method: "PUT",
        body: JSON.stringify({ isVerified })
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin-users"] });
      qc.invalidateQueries({ queryKey: ["superadmin-stats"] });
    }
  });
}

export function useSuperadminBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isBlocked }: { id: string; isBlocked: boolean }) =>
      apiRequest<{ user: SuperadminUser }>(`/api/superadmin/users/${id}/block`, {
        method: "PUT",
        body: JSON.stringify({ isBlocked })
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin-users"] });
      qc.invalidateQueries({ queryKey: ["superadmin-stats"] });
    }
  });
}

export function useSuperadminDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      apiRequest<{ message: string }>(`/api/superadmin/users/${id}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin-users"] });
      qc.invalidateQueries({ queryKey: ["superadmin-stats"] });
    }
  });
}

export function useSuperadminUpdateUserReach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reachMultiplier, minReach }: { id: string; reachMultiplier?: number; minReach?: number }) =>
      apiRequest<{ user: SuperadminUser }>(`/api/superadmin/users/${id}/reach`, {
        method: "PUT",
        body: JSON.stringify({ reachMultiplier, minReach })
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin-users"] });
      qc.invalidateQueries({ queryKey: ["superadmin-stats"] });
    }
  });
}

export function useSuperadminUpdateBlogReach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reachMultiplier, minReach }: { id: string; reachMultiplier?: number; minReach?: number }) =>
      apiRequest<{ blog: Blog }>(`/api/superadmin/blogs/${id}/reach`, {
        method: "PUT",
        body: JSON.stringify({ reachMultiplier, minReach })
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blogs"] });
      qc.invalidateQueries({ queryKey: ["superadmin-stats"] });
    }
  });
}

export function useSuperadminChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword?: string; newPassword?: string }) =>
      apiRequest<{ message: string }>("/api/superadmin/change-password", {
        method: "POST",
        body: JSON.stringify(data)
      })
  });
}

// ==========================================
// 9. SOCIAL NETWORKING HOOKS (Friends & Followers)
// ==========================================
export interface SocialAuthor {
  id: string;
  _id: string;
  name: string;
  email: string;
  bio: string;
  profileImage?: string;
  isVerified: boolean;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutual: boolean;
}

export function useListAuthors() {
  return useQuery<{ authors: SocialAuthor[] }>({
    queryKey: ["social-authors"],
    queryFn: () => apiRequest<{ authors: SocialAuthor[] }>("/api/social/authors")
  });
}

export function useListFollowing() {
  return useQuery<{ following: SocialAuthor[] }>({
    queryKey: ["social-following"],
    queryFn: () => apiRequest<{ following: SocialAuthor[] }>("/api/social/following")
  });
}

export function useListFollowers() {
  return useQuery<{ followers: SocialAuthor[] }>({
    queryKey: ["social-followers"],
    queryFn: () => apiRequest<{ followers: SocialAuthor[] }>("/api/social/followers")
  });
}

export function useListFriends() {
  return useQuery<{ friends: SocialAuthor[] }>({
    queryKey: ["social-friends"],
    queryFn: () => apiRequest<{ friends: SocialAuthor[] }>("/api/social/friends")
  });
}

export function useFollowUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      apiRequest<{ message: string; follow: any }>(`/api/social/follow/${id}`, {
        method: "POST"
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["social-authors"] });
      qc.invalidateQueries({ queryKey: ["social-following"] });
      qc.invalidateQueries({ queryKey: ["social-followers"] });
      qc.invalidateQueries({ queryKey: ["social-friends"] });
      qc.invalidateQueries({ queryKey: ["social-status", variables.id] });
    }
  });
}

export function useUnfollowUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      apiRequest<{ message: string }>(`/api/social/unfollow/${id}`, {
        method: "POST"
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["social-authors"] });
      qc.invalidateQueries({ queryKey: ["social-following"] });
      qc.invalidateQueries({ queryKey: ["social-followers"] });
      qc.invalidateQueries({ queryKey: ["social-friends"] });
      qc.invalidateQueries({ queryKey: ["social-status", variables.id] });
    }
  });
}

export function useFollowStatus(id: string) {
  return useQuery<{ isFollowing: boolean; isFollowedBy: boolean; isMutual: boolean }>({
    queryKey: ["social-status", id],
    queryFn: () => apiRequest<{ isFollowing: boolean; isFollowedBy: boolean; isMutual: boolean }>(`/api/social/status/${id}`),
    enabled: !!id
  });
}

