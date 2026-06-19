import { useState } from "react";
import {
  useListAuthors, useListFollowing, useListFollowers, useListFriends,
  useFollowUser, useUnfollowUser, SocialAuthor
} from "@workspace/api-client-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Users, UserPlus, UserMinus, UserCheck, Search, Globe, 
  Sparkles, Loader2, BadgeCheck, Compass, Heart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function AuthorCard({ 
  author, 
  onFollow, 
  onUnfollow, 
  isActionPending 
}: { 
  author: SocialAuthor; 
  onFollow: (id: string) => void; 
  onUnfollow: (id: string) => void; 
  isActionPending: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border border-border/50 shadow-sm glass-card overflow-hidden h-full flex flex-col justify-between hover:border-primary/20 transition-all rounded-2xl relative">
        {/* Top Cover Banner Decorator */}
        <div className="h-16 bg-gradient-to-r from-primary/10 to-accent/5 relative border-b border-border/20">
          {author.isMutual && (
            <Badge className="absolute top-3 right-3 text-[9px] uppercase font-bold tracking-wider rounded-full bg-primary/20 text-primary border border-primary/25 backdrop-blur-md">
              Mutual Friend
            </Badge>
          )}
        </div>

        <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-between gap-4">
          <div className="flex flex-col items-center text-center -mt-8">
            <Avatar className="w-16 h-16 ring-4 ring-background shadow-md">
              <AvatarImage src={author.profileImage} className="object-cover" />
              <AvatarFallback className="bg-primary text-primary-foreground font-serif text-lg font-bold">
                {author.name[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="mt-2.5 space-y-1">
              <div className="flex items-center justify-center gap-1">
                <h3 className="font-serif font-bold text-sm text-foreground leading-tight">
                  {author.name}
                </h3>
                {author.isVerified && (
                  <BadgeCheck size={14} className="text-blue-500 fill-blue-500/10 flex-shrink-0" />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">{author.email}</p>
            </div>

            <p className="text-[11px] text-muted-foreground/90 font-medium leading-relaxed mt-3 line-clamp-2 h-9">
              {author.bio || "No biography provided by author."}
            </p>
          </div>

          <div className="space-y-4">
            {/* Follower Stats Badges */}
            <div className="flex items-center justify-center gap-4 py-1.5 border-y border-border/30 text-center">
              <div>
                <p className="text-xs font-bold text-foreground font-mono">{author.followersCount ?? 0}</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Followers</p>
              </div>
              <div className="w-px h-5 bg-border/50" />
              <div>
                <p className="text-xs font-bold text-foreground font-mono">{author.followingCount ?? 0}</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Following</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-2">
              {author.isFollowing ? (
                <Button 
                  onClick={() => onUnfollow(author.id || author._id)}
                  disabled={isActionPending}
                  variant="outline" 
                  size="sm"
                  className="w-full text-xs font-semibold rounded-xl border-border/70 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 h-9 transition-colors gap-1.5"
                >
                  {isActionPending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <>
                      <UserMinus size={13} /> Unfollow
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={() => onFollow(author.id || author._id)}
                  disabled={isActionPending}
                  size="sm"
                  className="w-full text-xs font-semibold rounded-xl h-9 hover-lift gap-1.5 shadow-sm shadow-primary/5"
                >
                  {isActionPending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <>
                      {author.isFollowedBy ? (
                        <>
                          <UserCheck size={13} /> Follow Back
                        </>
                      ) : (
                        <>
                          <UserPlus size={13} /> Follow
                        </>
                      )}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AdminNetwork() {
  const [activeTab, setActiveTab] = useState<"find" | "following" | "followers" | "friends">("find");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: findData, isLoading: loadingFind } = useListAuthors();
  const { data: followingData, isLoading: loadingFollowing } = useListFollowing();
  const { data: followersData, isLoading: loadingFollowers } = useListFollowers();
  const { data: friendsData, isLoading: loadingFriends } = useListFriends();

  const follow = useFollowUser();
  const unfollow = useUnfollowUser();

  const handleFollow = (id: string) => {
    follow.mutate({ id });
  };

  const handleUnfollow = (id: string) => {
    unfollow.mutate({ id });
  };

  // Get current list based on active tab
  const getListAndLoader = () => {
    switch (activeTab) {
      case "following":
        return { list: followingData?.following ?? [], loading: loadingFollowing };
      case "followers":
        return { list: followersData?.followers ?? [], loading: loadingFollowers };
      case "friends":
        return { list: friendsData?.friends ?? [], loading: loadingFriends };
      case "find":
      default:
        return { list: findData?.authors ?? [], loading: loadingFind };
    }
  };

  const { list, loading } = getListAndLoader();

  // Filter list by search query
  const filteredList = list.filter((author) => 
    author.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    author.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground bg-gradient-to-r from-foreground via-foreground/90 to-foreground/75 bg-clip-text text-transparent flex items-center gap-2">
              <Users size={26} className="text-primary" /> Community Network
            </h1>
            <p className="text-muted-foreground text-xs mt-1 font-medium">Discover system authors, follow profiles, and grow your publishing network.</p>
          </div>
        </div>

        {/* Tab Selector & Search bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-muted/20 border border-border/30 rounded-2xl glass-card">
          {/* Tabs */}
          <div className="flex flex-wrap rounded-xl bg-background/60 p-0.5 border border-border/40 text-xs self-start md:self-auto">
            {[
              { id: "find", label: "Find Authors (खोजें)", count: findData?.authors?.length },
              { id: "following", label: "Following (अनुसरण)", count: followingData?.following?.length },
              { id: "followers", label: "Followers (अनुयायी)", count: followersData?.followers?.length },
              { id: "friends", label: "Friends (मित्र)", count: friendsData?.friends?.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSearchQuery(""); }}
                className={`px-3.5 py-2 rounded-lg transition-all font-semibold text-[11px] flex items-center gap-1.5 ${
                  activeTab === tab.id 
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <Badge variant={activeTab === tab.id ? "secondary" : "outline"} className="px-1.5 py-0 text-[9px] font-bold rounded-md">
                    {tab.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Search query */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9.5 border-border/50 text-xs bg-background/50 rounded-xl focus-visible:ring-1 focus-visible:ring-primary w-full placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        {/* Content Listing Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-60 rounded-2xl bg-muted animate-pulse border border-border/40" />
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 border border-dashed border-border/60 bg-card/15 rounded-2xl flex flex-col items-center justify-center p-6"
          >
            {activeTab === "find" && (
              <>
                <Compass size={40} className="text-muted-foreground/45 mb-3" />
                <p className="font-serif text-base font-bold text-foreground mb-1">No other authors found</p>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">You are currently the only active writer on the platform.</p>
              </>
            )}
            {activeTab === "following" && (
              <>
                <Compass size={40} className="text-muted-foreground/45 mb-3" />
                <p className="font-serif text-base font-bold text-foreground mb-1">You are not following anyone yet</p>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mb-3">Follow other authors in the "Find Authors" directory to stay updated.</p>
                <Button size="sm" onClick={() => setActiveTab("find")} className="rounded-xl text-xs font-semibold hover-lift">Browse Authors</Button>
              </>
            )}
            {activeTab === "followers" && (
              <>
                <Users size={40} className="text-muted-foreground/45 mb-3" />
                <p className="font-serif text-base font-bold text-foreground mb-1">No followers yet</p>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">Publish engaging blog articles to build your audience and gain followers.</p>
              </>
            )}
            {activeTab === "friends" && (
              <>
                <Heart size={40} className="text-muted-foreground/45 mb-3" />
                <p className="font-serif text-base font-bold text-foreground mb-1">No mutual friends yet</p>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">Follow authors who follow you back to establish mutual connections.</p>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {filteredList.map((author) => {
                const isPending = follow.isPending || unfollow.isPending;
                return (
                  <AuthorCard 
                    key={author.id || author._id}
                    author={author}
                    onFollow={handleFollow}
                    onUnfollow={handleUnfollow}
                    isActionPending={isPending}
                  />
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
}
