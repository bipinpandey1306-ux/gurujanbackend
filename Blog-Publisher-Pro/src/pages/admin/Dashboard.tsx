import AdminLayout from "@/components/admin/AdminLayout";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Image, MessageSquare, Plus, TrendingUp, BookOpen, Clock, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

function StatCard({ title, value, icon: Icon, sub }: { title: string; value: number | string; icon: any; sub?: string }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="glass-card relative overflow-hidden border border-border/50 shadow-sm">
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.03] blur-xl pointer-events-none -mr-6 -mt-6 bg-primary" />
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
              <p className="font-serif text-3.5xl font-bold text-foreground tracking-tight">{value}</p>
              {sub && <p className="text-[11px] text-muted-foreground font-medium">{sub}</p>}
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center border border-primary/10 shadow-sm flex-shrink-0">
              <Icon size={18} className="text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user?.role === "superadmin") {
      setLocation("/portal/superadmin-secure-gate-token-9b1deb4d3b7d4f968e7e1f440a3243f78923a1ef96d84a7e930f3532cb11b439-management-dashboard/overview");
    }
  }, [user, setLocation]);

  if (user?.role === "superadmin") {
    return null;
  }

  const { data, isLoading } = useGetDashboardStats();
  const stats = data?.stats;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Upper Dashboard Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your writing, content, and local workspace</p>
          </div>
          <Link href="/portal/blogs/new" className="inline-flex items-center justify-center gap-2 px-4 bg-primary text-primary-foreground shadow-lg shadow-primary/15 hover-lift h-9 rounded-xl font-semibold text-xs transition-colors hover:bg-primary/90">
            <Plus size={16} /> New Post
          </Link>
        </div>

        {/* 4 Stat Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[102px] rounded-xl bg-muted/60 animate-pulse border border-border/40" />
            ))}
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <StatCard title="Published" value={stats?.publishedBlogs ?? 0} icon={BookOpen} sub="posts live on site" />
            <StatCard title="Drafts" value={stats?.draftBlogs ?? 0} icon={Clock} sub="articles in progress" />
            <StatCard title="Total Visitors" value={stats?.totalVisitors ?? 0} icon={Eye} sub="views across posts" />
            <StatCard title="Pending" value={stats?.pendingComments ?? 0} icon={MessageSquare} sub="comments moderation" />
          </motion.div>
        )}

        {/* Recent & Top Blogs Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent posts */}
          <Card className="border border-border/50 shadow-sm glass-card flex flex-col">
            <CardHeader className="pb-4 border-b border-border/40">
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif text-lg font-bold tracking-tight">Recent Posts</CardTitle>
                <Link href="/portal/blogs">
                  <Button variant="ghost" size="sm" className="text-xs text-primary font-semibold hover:bg-primary/5 h-8 px-3 rounded-lg gap-1">
                    View all <ChevronRight size={13} />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-1">
              {(stats?.recentBlogs ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BookOpen size={28} className="text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No blog posts found yet.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {(stats?.recentBlogs ?? []).map((blog: any) => (
                    <div key={blog.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/30">
                      <div className="min-w-0 flex-1 mr-4">
                        <p className="text-sm font-semibold text-foreground truncate">{blog.title}</p>
                        <p className="text-xs text-muted-foreground/80 mt-1">{blog.createdAt ? format(new Date(blog.createdAt), "MMM d, yyyy") : ""}</p>
                      </div>
                      <Badge variant={blog.status === "published" ? "default" : "secondary"} className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0">
                        {blog.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top posts */}
          <Card className="border border-border/50 shadow-sm glass-card flex flex-col">
            <CardHeader className="pb-4 border-b border-border/40">
              <div className="flex items-center justify-between">
                <CardTitle className="font-serif text-lg font-bold tracking-tight">Top Performing Posts</CardTitle>
                <TrendingUp size={16} className="text-primary" />
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-1">
              {(stats?.topBlogs ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <TrendingUp size={28} className="text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No traffic stats available yet.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {(stats?.topBlogs ?? []).map((blog: any, i: number) => (
                    <div key={blog.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/30">
                      <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold font-mono">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{blog.title}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground flex-shrink-0 bg-muted/60 px-2.5 py-1 rounded-lg">
                        <Eye size={12} className="text-primary" /> {blog.viewCount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Section */}
        <div className="max-w-2xl">
          {/* Quick Actions */}
          <Card className="border border-border/50 shadow-sm glass-card flex flex-col">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="font-serif text-lg font-bold tracking-tight">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex-1">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { href: "/portal/blogs/new", icon: FileText, label: "New Post", desc: "Compose blog post" },
                  { href: "/portal/comments", icon: MessageSquare, label: "Comments", desc: "Approve responses" },
                  { href: "/portal/gallery", icon: Image, label: "Gallery", desc: "Organize photo albums" },
                  { href: "/portal/analytics", icon: TrendingUp, label: "Analytics", desc: "View visitor reports" },
                ].map(({ href, icon: Icon, label, desc }) => (
                  <Link key={href} href={href}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex flex-col items-start gap-2.5 p-4 rounded-xl border border-border/50 hover:border-primary/20 hover:bg-primary/5 cursor-pointer transition-all h-full"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/5">
                        <Icon size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{desc}</p>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
