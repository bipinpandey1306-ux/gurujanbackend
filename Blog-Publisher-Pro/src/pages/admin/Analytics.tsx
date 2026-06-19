import { useState } from "react";
import { useGetAnalyticsSummary, useGetVisitorStats, useListBlogs } from "@workspace/api-client-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { 
  Eye, TrendingUp, CalendarDays, BookOpen, BarChart3, Tag, Globe, 
  Smartphone, Laptop, Tablet, Activity, Clock, ArrowUpRight, ChevronRight, 
  Compass, Sparkles
} from "lucide-react";
import { format, subDays, formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

// Stat Card Component
function StatCard({ title, value, icon: Icon, sub, delay = 0 }: { title: string; value: number | string; icon: any; sub?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="relative overflow-hidden rounded-2xl border border-border/40 bg-background/50 backdrop-blur-md shadow-sm p-5 flex flex-col justify-between"
    >
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-[0.03] blur-lg pointer-events-none -mr-4 -mt-4 bg-primary" />
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-sm">
          <Icon size={15} />
        </div>
      </div>
      <div className="mt-4">
        <p className="font-serif text-3xl font-bold text-foreground tracking-tight leading-none">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground/80 font-medium mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function AdminAnalytics() {
  const [trendView, setTrendView] = useState<"visitors" | "views">("visitors");
  const { data: summaryData, isLoading: isSummaryLoading } = useGetAnalyticsSummary();
  const summary = summaryData?.summary;
  const pageViews = summary?.pageViews ?? [];
  const topBlogs = summary?.topBlogs ?? [];

  const { data: blogsData } = useListBlogs({ scope: "mine" });
  const blogs = blogsData?.blogs ?? [];

  const end = new Date();
  const start = subDays(end, 29);
  const { data: statsData, isLoading: isStatsLoading } = useGetVisitorStats({
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  });
  
  const chartData = statsData?.stats ?? [];

  // Parse Browser & Device details from User Agents in local DB
  const totalViews = pageViews.length || 1;
  const browserCounts: Record<string, number> = {};
  const deviceCounts = { Desktop: 0, Mobile: 0, Tablet: 0 };
  const pathCounts: Record<string, number> = {};

  pageViews.forEach((v: any) => {
    const ua = v.userAgent || "";
    const path = v.path || "/";

    // 1. Browser parsing
    let browser = "Other";
    if (ua.includes("Chrome") && !ua.includes("Chromium") && !ua.includes("Edg")) browser = "Chrome";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg")) browser = "Edge";
    browserCounts[browser] = (browserCounts[browser] || 0) + 1;

    // 2. Device parsing
    if (/Mobi|Android|iPhone/i.test(ua)) deviceCounts.Mobile++;
    else if (/Tablet|iPad/i.test(ua)) deviceCounts.Tablet++;
    else deviceCounts.Desktop++;

    // 3. Path parsing
    pathCounts[path] = (pathCounts[path] || 0) + 1;
  });

  // Sort and format Browser statistics
  const formattedBrowsers = Object.entries(browserCounts)
    .map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / totalViews) * 100),
      color: {
        Chrome: "bg-blue-500",
        Safari: "bg-amber-500",
        Firefox: "bg-rose-500",
        Edge: "bg-emerald-500",
        Other: "bg-slate-400"
      }[name] || "bg-slate-400"
    }))
    .sort((a, b) => b.count - a.count);

  // Format Device stats
  const formattedDevices = Object.entries(deviceCounts).map(([name, count]) => ({
    name,
    count,
    pct: Math.round((count / totalViews) * 100),
    icon: {
      Desktop: Laptop,
      Mobile: Smartphone,
      Tablet: Tablet
    }[name as "Desktop" | "Mobile" | "Tablet"] || Laptop,
    color: {
      Desktop: "from-blue-500 to-indigo-500",
      Mobile: "from-purple-500 to-pink-500",
      Tablet: "from-amber-500 to-orange-500"
    }[name as "Desktop" | "Mobile" | "Tablet"] || "from-slate-500 to-slate-600"
  }));

  // Resolve popular paths to real blog post titles
  const formattedPaths = Object.entries(pathCounts)
    .map(([path, count]) => {
      let title = path;
      let type: "core" | "post" = "core";
      if (path === "/") title = "Home Page (मुख्य पृष्ठ)";
      else if (path === "/blog") title = "Blog Index (लेख सूची)";
      else if (path === "/gallery") title = "Gallery View (चित्र दीर्घा)";
      else if (path === "/about") title = "About Author (लेखक परिचय)";
      else if (path === "/contact") title = "Contact Desk (सम्पर्क सूत्र)";
      else if (path.startsWith("/blog/")) {
        const slug = path.replace("/blog/", "");
        const matchedBlog = blogs.find((b: any) => b.slug === slug);
        title = matchedBlog ? matchedBlog.title : `Post: ${slug}`;
        type = "post";
      }
      return { path, title, count, type, pct: Math.round((count / totalViews) * 100) };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Live Activity: Last 10 visitors
  const liveViews = [...pageViews]
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)
    .map((v: any) => {
      let resolvedTitle = v.path;
      if (v.path === "/") resolvedTitle = "Home Page";
      else if (v.path === "/blog") resolvedTitle = "Blog Index";
      else if (v.path === "/gallery") resolvedTitle = "Gallery";
      else if (v.path === "/contact") resolvedTitle = "Contact";
      else if (v.path === "/about") resolvedTitle = "About";
      else if (v.path.startsWith("/blog/")) {
        const slug = v.path.replace("/blog/", "");
        const matched = blogs.find((b: any) => b.slug === slug);
        resolvedTitle = matched ? matched.title : `Post: ${slug}`;
      }

      // Check device
      let device = "Desktop";
      if (/Mobi|Android|iPhone/i.test(v.userAgent)) device = "Mobile";
      else if (/Tablet|iPad/i.test(v.userAgent)) device = "Tablet";

      return {
        ...v,
        resolvedTitle,
        device
      };
    });

  // Chart data formatting
  const formattedChart = chartData.map((d: any) => ({
    date: format(new Date(d.date), "MMM d"),
    Visitors: d.visitors || 0,
    PageViews: d.count || 0
  }));

  const isLoading = isSummaryLoading || isStatsLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground bg-gradient-to-r from-foreground via-foreground/90 to-foreground/75 bg-clip-text text-transparent flex items-center gap-2">
              <Activity size={26} className="text-primary" /> Analytics Center
            </h1>
            <p className="text-muted-foreground text-xs mt-1 font-medium">Real-time visitor logs, browser distribution, and content view stats.</p>
          </div>
          <div className="flex rounded-xl bg-muted/60 p-0.5 border border-border/30 text-xs">
            <button
              onClick={() => setTrendView("visitors")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                trendView === "visitors" ? "bg-primary text-primary-foreground font-bold shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Unique Visitors
            </button>
            <button
              onClick={() => setTrendView("views")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                trendView === "views" ? "bg-primary text-primary-foreground font-bold shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Page Views
            </button>
          </div>
        </div>

        {/* 4 Stats Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse border border-border/30" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Hits" value={pageViews.length} icon={Eye} sub="Cumulative page hits" delay={0.01} />
            <StatCard title="Today's Traffic" value={summary?.todayVisitors ?? 0} icon={CalendarDays} sub="Active visitor actions" delay={0.02} />
            <StatCard title="This Month" value={summary?.monthlyVisitors ?? 0} icon={TrendingUp} sub="Views past 30 days" delay={0.03} />
            <StatCard title="Articles Online" value={summary?.publishedBlogs ?? 0} icon={BookOpen} sub="Published posts online" delay={0.04} />
          </div>
        )}

        {/* Chart Section */}
        <Card className="border border-border/40 shadow-sm glass-card bg-background/40 backdrop-blur-md">
          <CardHeader className="pb-4 border-b border-border/20 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-serif text-lg font-bold tracking-tight text-foreground">Traffic Analytics Trend</CardTitle>
              <CardDescription className="text-[10px]">Daily aggregation metrics over the last 30 days.</CardDescription>
            </div>
            <BarChart3 size={16} className="text-primary" />
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="h-64 rounded-xl bg-muted animate-pulse" />
            ) : formattedChart.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-xs p-4 border border-dashed rounded-xl">
                <BarChart3 size={32} className="text-muted-foreground/35 mb-2" />
                <span>No telemetry logs captured yet. Try accessing your public articles.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={formattedChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.4)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsla(var(--background) / 0.95)",
                      border: "1px solid hsl(var(--border) / 0.5)",
                      borderRadius: "12px",
                      fontSize: "11px",
                      boxShadow: "0 10px 25px -10px rgba(0,0,0,0.15)"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={trendView === "visitors" ? "Visitors" : "PageViews"}
                    name={trendView === "visitors" ? "Unique Visitors" : "Page Views"}
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorTraffic)"
                    dot={{ r: 2, strokeWidth: 1 }}
                    activeDot={{ r: 4, strokeWidth: 1 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Middle Details Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Popular Pages & Paths */}
          <Card className="border border-border/40 shadow-sm glass-card lg:col-span-2">
            <CardHeader className="pb-3 border-b border-border/20">
              <CardTitle className="font-serif text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <Globe size={16} className="text-indigo-500" /> Popular Paths
              </CardTitle>
              <CardDescription className="text-[10px]">Paths with most visits dynamically matched with title indexes.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-10 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : formattedPaths.length === 0 ? (
                <div className="text-center py-10 text-xs text-muted-foreground">No path data available.</div>
              ) : (
                <div className="space-y-4">
                  {formattedPaths.map((item, index) => (
                    <div key={index} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-foreground truncate max-w-[70%]" title={item.title}>
                          {item.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <code className="text-[9px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded">{item.path}</code>
                          <span className="font-bold text-foreground w-8 text-right font-mono">{item.count}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${item.pct}%` }}
                            transition={{ duration: 0.6, delay: index * 0.05 }}
                            className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full" 
                          />
                        </div>
                        <span className="text-[9px] font-bold text-muted-foreground w-8 text-right font-mono">{item.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Device & Browser Share breakdown */}
          <Card className="border border-border/40 shadow-sm glass-card">
            <CardHeader className="pb-3 border-b border-border/20">
              <CardTitle className="font-serif text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <Laptop size={16} className="text-emerald-500" /> Platform Split
              </CardTitle>
              <CardDescription className="text-[10px]">Devices and browsers used by readers.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              
              {/* Devices */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Traffic By Device</span>
                {isLoading ? (
                  <div className="h-20 rounded bg-muted animate-pulse" />
                ) : (
                  <div className="space-y-3">
                    {formattedDevices.map((device, i) => {
                      const DeviceIcon = device.icon;
                      return (
                        <div key={i} className="flex items-center justify-between text-xs gap-3">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <DeviceIcon size={14} className="text-foreground/80" />
                            <span className="font-medium text-foreground">{device.name}</span>
                          </div>
                          <div className="flex-1 max-w-[120px] h-2 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${device.color} rounded-full`} style={{ width: `${device.pct}%` }} />
                          </div>
                          <span className="font-bold text-foreground font-mono w-10 text-right">{device.pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Browsers */}
              <div className="space-y-3 pt-2 border-t border-border/20">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Browsers Used</span>
                {isLoading ? (
                  <div className="h-20 rounded bg-muted animate-pulse" />
                ) : formattedBrowsers.length === 0 ? (
                  <div className="text-center py-2 text-xs text-muted-foreground">No browser logs found.</div>
                ) : (
                  <div className="space-y-3">
                    {formattedBrowsers.map((browser, i) => (
                      <div key={i} className="flex items-center justify-between text-xs gap-3">
                        <span className="font-medium text-muted-foreground">{browser.name}</span>
                        <div className="flex-1 max-w-[120px] h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${browser.color} rounded-full`} style={{ width: `${browser.pct}%` }} />
                        </div>
                        <span className="font-bold text-foreground font-mono w-10 text-right">{browser.pct}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </CardContent>
          </Card>

        </div>

        {/* Bottom Details Row: Top Performing Blogs vs Live Visitor Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top performing blogs list */}
          <Card className="border border-border/40 shadow-sm glass-card">
            <CardHeader className="pb-3 border-b border-border/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-serif text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" /> Best Performing Posts
                </CardTitle>
                <CardDescription className="text-[10px]">Published posts ranked by hits.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : topBlogs.length === 0 ? (
                <div className="text-center py-10 text-xs text-muted-foreground">No published posts available.</div>
              ) : (
                <div className="space-y-3">
                  {topBlogs.map((post: any, idx: number) => (
                    <div 
                      key={post.id} 
                      className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-border/20 hover:bg-muted/40 transition-all gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 text-xs font-bold font-mono">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate max-w-[200px]" title={post.title}>
                            {post.title}
                          </p>
                          <span className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-wider">{post.categoryName || "Uncategorized"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-xs font-bold text-foreground font-mono">{post.viewCount || 0}</p>
                          <p className="text-[9px] text-muted-foreground">reads</p>
                        </div>
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          <button className="p-1 rounded-lg bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50">
                            <ArrowUpRight size={13} />
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Visitor Timeline Feed */}
          <Card className="border border-border/40 shadow-sm glass-card">
            <CardHeader className="pb-3 border-b border-border/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-serif text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Clock size={16} className="text-rose-500" /> Live Visitor Timeline
                </CardTitle>
                <CardDescription className="text-[10px]">Real-time stream of page hits logged in browser memory.</CardDescription>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Active</span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : liveViews.length === 0 ? (
                <div className="text-center py-10 text-xs text-muted-foreground">No visitor logs found.</div>
              ) : (
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {liveViews.map((v: any, index: number) => {
                    const DeviceIcon = {
                      Desktop: Laptop,
                      Mobile: Smartphone,
                      Tablet: Tablet
                    }[v.device as "Desktop" | "Mobile" | "Tablet"] || Laptop;

                    return (
                      <div key={index} className="flex items-start gap-3 relative pb-3 border-b border-border/10 last:border-b-0 last:pb-0">
                        <div className="w-7 h-7 rounded-xl bg-muted/40 flex items-center justify-center text-muted-foreground mt-0.5 shrink-0 shadow-sm">
                          <DeviceIcon size={12} />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center justify-between text-[11px] gap-2">
                            <span className="font-semibold text-foreground truncate max-w-[70%]" title={v.resolvedTitle}>
                              {v.resolvedTitle}
                            </span>
                            <span className="text-[9px] text-muted-foreground shrink-0 font-medium font-mono">
                              {formatDistanceToNow(new Date(v.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-muted-foreground/80 flex-wrap">
                            <code className="bg-muted/50 px-1 py-0.25 rounded font-mono">{v.path}</code>
                            <span>•</span>
                            <span className="truncate max-w-[150px] font-medium" title={v.userAgent}>
                              {v.userAgent?.split(" ")[0] || "Client Platform"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>
    </AdminLayout>
  );
}
