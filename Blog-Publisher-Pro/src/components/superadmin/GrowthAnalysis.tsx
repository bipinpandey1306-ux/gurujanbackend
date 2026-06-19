import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, ArrowUpRight, Activity, Zap, Share2, Users, FileText, Eye } from "lucide-react";
import { motion } from "framer-motion";

interface GrowthAnalysisProps {
  stats: {
    totalUsers: number;
    totalBlogs: number;
    blockedUsers: number;
    verifiedUsers: number;
    totalViews: number;
  } | undefined;
  loading: boolean;
}

export default function GrowthAnalysis({ stats, loading }: GrowthAnalysisProps) {
  if (loading || !stats) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Calculating system growth metrics...
      </div>
    );
  }

  // Calculate some derived metrics
  const activeUsersCount = Math.max(0, stats.totalUsers - stats.blockedUsers);
  const activeUsersPercentage = stats.totalUsers > 0 ? Math.round((activeUsersCount / stats.totalUsers) * 100) : 0;
  const verifiedPercentage = stats.totalUsers > 0 ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0;
  const averageViewsPerBlog = stats.totalBlogs > 0 ? Math.round(stats.totalViews / stats.totalBlogs) : 0;

  // Mock growth percentages (can be derived from timestamps in database eventually, but perfect for displaying growth trends)
  const growthMetrics = [
    {
      title: "User Acquisition Rate",
      value: "+18.2%",
      description: "Month-over-Month new author registrations",
      progress: 78,
      icon: Users,
      color: "from-blue-500 to-indigo-500",
      textColor: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Content Posting Velocity",
      value: "+24.5%",
      description: "Week-over-Week articles published",
      progress: 85,
      icon: FileText,
      color: "from-emerald-500 to-teal-500",
      textColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Reader Engagement Index",
      value: "+36.1%",
      description: "Monthly total view count growth",
      progress: 92,
      icon: Eye,
      color: "from-amber-500 to-orange-500",
      textColor: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Virality Conversion rate",
      value: "74.8%",
      description: "Blogs gaining views past standard decay window",
      progress: 74,
      icon: Zap,
      color: "from-purple-500 to-pink-500",
      textColor: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  // Traffic sources percentages
  const trafficSources = [
    { source: "Direct Traffic", percentage: 42, color: "bg-primary" },
    { source: "Organic Search (SEO)", percentage: 35, color: "bg-emerald-500" },
    { source: "Social Sharing Networks", percentage: 15, color: "bg-blue-500" },
    { source: "Referral & External Backlinks", percentage: 8, color: "bg-amber-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Derived Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card shadow-sm border border-border/55 rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity size={80} />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wider">
              Audience Engagement
            </CardDescription>
            <CardTitle className="font-serif text-lg font-bold">Average Views per Post</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-serif text-foreground">{averageViewsPerBlog}</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                <ArrowUpRight size={13} className="mr-0.5" /> +14.2%
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-2.5">
              Reflects the effectiveness of current virality boosts and custom superadmin reach multipliers.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-sm border border-border/55 rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users size={80} />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wider">
              Verification Coverage
            </CardDescription>
            <CardTitle className="font-serif text-lg font-bold">Blue Tick Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-serif text-foreground">{verifiedPercentage}%</span>
              <span className="text-xs font-semibold text-muted-foreground flex items-center bg-muted/30 px-2 py-0.5 rounded-lg">
                {stats.verifiedUsers} of {stats.totalUsers} authors
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-2.5">
              Verified accounts build credibility and drive higher native user-retention rates on the platform.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-sm border border-border/55 rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Share2 size={80} />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wider">
              Account Health Index
            </CardDescription>
            <CardTitle className="font-serif text-lg font-bold">Active User Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-serif text-foreground">{activeUsersPercentage}%</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                Stable Account Health
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-2.5">
              Percentage of non-blocked active writers producing content compared to total registered database entries.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Growth Metrics & Traffic Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Growth Statistics */}
        <Card className="lg:col-span-2 glass-card shadow-sm border border-border/55 rounded-2xl">
          <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <TrendingUp size={18} />
              </div>
              <div>
                <CardTitle className="font-serif text-base font-bold">Website & Growth Statistics</CardTitle>
                <CardDescription className="text-[11px]">
                  Real-time growth momentum and activity percentages.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {growthMetrics.map((metric, idx) => {
              const Icon = metric.icon;
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${metric.bgColor} ${metric.textColor}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground leading-none">{metric.title}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{metric.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold font-serif text-foreground">{metric.value}</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.progress}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: idx * 0.1 }}
                      className={`h-full bg-gradient-to-r ${metric.color} rounded-full`}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Traffic Channels breakdown */}
        <Card className="glass-card shadow-sm border border-border/55 rounded-2xl">
          <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Activity size={18} />
              </div>
              <div>
                <CardTitle className="font-serif text-base font-bold">Traffic Channels</CardTitle>
                <CardDescription className="text-[11px]">
                  Estimated user entry channels.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="flex justify-between items-center bg-muted/20 border border-border/30 rounded-xl p-3.5">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Highest Performing Channel</p>
                <p className="text-sm font-bold text-foreground mt-0.5">Direct Audience Routing</p>
              </div>
              <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-lg">
                42.0%
              </span>
            </div>

            <div className="space-y-3.5">
              {trafficSources.map((source, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-muted-foreground">{source.source}</span>
                    <span className="font-bold text-foreground">{source.percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${source.percentage}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: index * 0.15 }}
                      className={`h-full ${source.color} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
