import { useState } from "react";
import {
  useListComments, useModerateComment, useDeleteComment,
  getListCommentsQueryKey, useListBlogs,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Check, X, Trash2, MessageSquare, Calendar, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

export default function AdminComments() {
  const [status, setStatus] = useState("all");
  const qc = useQueryClient();
  const moderate = useModerateComment();
  const del = useDeleteComment();

  const params: any = {};
  if (status !== "all") params.status = status;

  const { data, isLoading } = useListComments(params);
  const comments = data?.comments ?? [];
  const total = data?.total ?? 0;

  const { data: blogsData } = useListBlogs({ scope: "mine" });
  const blogs = blogsData?.blogs ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: getListCommentsQueryKey() });

  const approve = (id: number) => moderate.mutate({ id, data: { status: "approved" } }, { onSuccess: invalidate });
  const reject = (id: number) => moderate.mutate({ id, data: { status: "rejected" } }, { onSuccess: invalidate });
  const remove = (id: number) => del.mutate({ id }, { onSuccess: invalidate });

  const statusColor: Record<string, string> = {
    approved: "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400 border-green-200/50",
    rejected: "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 border-red-200/50",
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/50",
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
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header and Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Comments</h1>
            <p className="text-muted-foreground text-sm mt-1">{total} comments submitted by readers</p>
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-40 h-10 bg-card border-border/50 rounded-xl text-xs font-semibold shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Comments</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Comments Listing Card */}
        <Card className="border border-border/50 shadow-sm glass-card overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-xl bg-muted animate-pulse border border-border/40" />
                ))}
              </div>
            ) : comments.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center">
                <MessageSquare size={44} className="text-muted-foreground/40 mb-3" />
                <p className="font-serif text-lg font-bold text-foreground mb-1">No comments found</p>
                <p className="text-xs text-muted-foreground">Comments left on your blog posts will appear here.</p>
              </div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="divide-y divide-border/40"
              >
                <AnimatePresence>
                  {comments.map((c: any) => {
                    const blog = blogs.find((b: any) => b.id === c.blogId);
                    return (
                      <motion.div 
                        key={c.id} 
                        variants={itemVariants}
                        exit={{ opacity: 0, x: -10 }}
                        className="p-5 hover:bg-muted/40 transition-all border-l-2 border-transparent hover:border-l-primary"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-foreground">{c.authorName}</span>
                              {c.authorEmail && <span className="text-xs text-muted-foreground/80 font-medium">({c.authorEmail})</span>}
                              <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider rounded-full px-2 py-0.25 border ${statusColor[c.status] ?? "bg-muted"}`}>
                                {c.status}
                              </Badge>
                            </div>
                            
                            <p className="text-xs text-foreground/90 leading-relaxed font-medium bg-background/30 p-3 rounded-xl border border-border/30 whitespace-pre-wrap">
                              "{c.content}"
                            </p>

                            <div className="flex items-center gap-3 text-xs text-muted-foreground/80 flex-wrap font-medium">
                              {blog ? (
                                <Link href={`/blog/${blog.slug}`} target="_blank" className="text-primary hover:underline truncate max-w-[250px] flex items-center gap-1.5 font-semibold">
                                  <MessageSquare size={12} className="text-primary/70" />
                                  <span>{blog.title}</span>
                                  <ExternalLink size={10} className="opacity-70" />
                                </Link>
                              ) : (
                                <span className="text-muted-foreground truncate max-w-[250px] flex items-center gap-1.5">
                                  <MessageSquare size={12} className="opacity-60" />
                                  {c.blogTitle || "Deleted Post"}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {format(new Date(c.createdAt), "MMM d, yyyy 'at' h:mm a")}
                              </span>
                            </div>
                          </div>

                        {/* Control Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {c.status !== "approved" && (
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              title="Approve Comment"
                              className="h-8 w-8 hover:bg-green-500/10 hover:text-green-600 rounded-lg transition-colors" 
                              onClick={() => approve(c.id)}
                            >
                              <Check size={16} />
                            </Button>
                          )}
                          {c.status !== "rejected" && (
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              title="Reject Comment"
                              className="h-8 w-8 hover:bg-amber-500/10 hover:text-amber-600 rounded-lg transition-colors" 
                              onClick={() => reject(c.id)}
                            >
                              <X size={16} />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                title="Delete Comment"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-serif font-bold text-lg">Delete comment?</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                                  This action cannot be undone and the comment will be permanently deleted from the database.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="gap-2">
                                <AlertDialogCancel className="rounded-xl text-xs font-semibold">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => remove(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-semibold">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
