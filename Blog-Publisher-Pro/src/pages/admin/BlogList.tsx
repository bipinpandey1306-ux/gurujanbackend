import { useState } from "react";
import { Link } from "wouter";
import { useListBlogs, useDeleteBlog, getListBlogsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Trash2, Eye, Calendar, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminBlogList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const deleteBlog = useDeleteBlog();

  const params: any = { page, limit: 15, scope: "mine" };
  if (search) params.search = search;
  if (status !== "all") params.status = status;

  const { data, isLoading } = useListBlogs(params);
  const blogs = data?.blogs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 15);

  const handleDelete = (id: number) => {
    deleteBlog.mutate({ id }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: ["blogs"] }),
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Blog Posts</h1>
            <p className="text-muted-foreground text-sm mt-1">Write, edit, and curate your articles</p>
          </div>
          <Link href="/portal/blogs/new" className="inline-flex items-center justify-center gap-2 px-4 bg-primary text-primary-foreground shadow-lg shadow-primary/15 hover-lift h-9 rounded-xl font-semibold text-xs transition-colors hover:bg-primary/90">
            <Plus size={16} /> New Post
          </Link>
        </div>

        {/* Filters Card */}
        <div className="flex flex-col sm:flex-row gap-3 bg-card/45 p-4 rounded-2xl border border-border/40 backdrop-blur-md glass-card">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search posts by title or content..." 
              className="pl-10 h-10 bg-background/50 border-border/50 focus-visible:ring-primary/20 rounded-xl text-xs font-medium placeholder:text-muted-foreground/60" 
              value={search} 
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
            />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40 h-10 bg-background/50 border-border/50 rounded-xl text-xs font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Blog Post List Card */}
        <Card className="border border-border/50 shadow-sm glass-card overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-muted animate-pulse border border-border/40" />
                ))}
              </div>
            ) : blogs.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center">
                <BookOpen size={44} className="text-muted-foreground/40 mb-3" />
                <p className="font-serif text-lg font-bold text-foreground mb-1">No posts found</p>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mb-4">Start creating content to see your posts listed here.</p>
                <Link href="/portal/blogs/new" className="mt-1 inline-flex items-center justify-center gap-2 px-4 h-9 border border-border/70 rounded-xl hover-lift text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors">
                  Create your first post
                </Link>
              </div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="divide-y divide-border/40"
              >
                <AnimatePresence>
                  {blogs.map((blog: any) => (
                    <motion.div 
                      key={blog.id} 
                      variants={itemVariants}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold text-sm text-foreground truncate">{blog.title}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground/80 flex-wrap">
                          {blog.categoryName && (
                            <Badge variant="outline" className="text-[10px] font-bold bg-muted/30 border-border/45 px-2 rounded-lg text-muted-foreground">
                              {blog.categoryName}
                            </Badge>
                          )}
                          {blog.publishedAt && (
                            <span className="flex items-center gap-1 font-medium">
                              <Calendar size={12} className="text-primary/70" />
                              {format(new Date(blog.publishedAt), "MMM d, yyyy")}
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-medium">
                            <Eye size={12} className="text-primary/70" /> {blog.viewCount ?? 0} views
                          </span>
                        </div>
                      </div>
                      <Badge variant={blog.status === "published" ? "default" : "secondary"} className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full tracking-wider flex-shrink-0">
                        {blog.status}
                      </Badge>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link href={`/portal/blogs/${blog.id}/edit`}>
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors">
                            <Edit size={14} />
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                              <Trash2 size={14} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-serif font-bold text-lg">Delete post?</AlertDialogTitle>
                              <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                                This will permanently delete "{blog.title}". This action cannot be undone and the post will be lost forever.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-2">
                              <AlertDialogCancel className="rounded-xl text-xs font-semibold">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(blog.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-semibold">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page <= 1} 
              onClick={() => setPage((p) => p - 1)}
              className="rounded-xl border-border/70 gap-1.5 h-8 font-semibold text-xs"
            >
              <ChevronLeft size={14} /> Previous
            </Button>
            <span className="text-xs font-bold text-muted-foreground px-2">Page {page} of {totalPages}</span>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page >= totalPages} 
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border-border/70 gap-1.5 h-8 font-semibold text-xs"
            >
              Next <ChevronRight size={14} />
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
