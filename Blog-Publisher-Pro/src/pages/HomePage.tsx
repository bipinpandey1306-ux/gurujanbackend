import { useEffect } from "react";
import { Link } from "wouter";
import {
  useGetFeaturedBlogs, useListBlogs, useListCategories,
  useTrackPageView,
} from "@workspace/api-client-react";
import type { Blog, Category } from "@workspace/api-client-react";
import PublicLayout from "@/components/public/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Eye, ArrowRight, BookOpen } from "lucide-react";
import { format } from "date-fns";

function BlogCard({ blog }: { blog: Blog }) {
  return (
    <Link href={`/blog/${blog.slug}`}>
      <Card className="group h-full hover:shadow-lg transition-all duration-300 border-border hover:border-primary/30 overflow-hidden cursor-pointer flex flex-col">
        {blog.featuredImage && (
          <div className="aspect-video overflow-hidden">
            <img
              src={blog.featuredImage}
              alt={blog.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
        <CardContent className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              {blog.categoryName && (
                <Badge variant="secondary" className="text-xs font-medium">
                  {blog.categoryName}
                </Badge>
              )}
            </div>
            <h3 className="font-serif font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2 text-lg leading-snug">
              {blog.title}
            </h3>
            {blog.excerpt && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{blog.excerpt}</p>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground mt-4 pt-3 border-t border-border/40">
            <div className="flex items-center gap-3">
              {blog.publishedAt && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {format(new Date(blog.publishedAt), "MMM d, yyyy")}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye size={12} />
                {blog.viewCount ?? 0}
              </span>
            </div>
            {blog.authorName && (
              <span className="font-semibold text-primary/95 text-[11px] bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                By {blog.authorName.split(" ")[0]}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function HomePage() {
  const track = useTrackPageView();
  const { data: featured } = useGetFeaturedBlogs();
  const { data: blogsData } = useListBlogs({ status: "published", limit: 6 });
  const { data: categories } = useListCategories();

  const featuredBlogs = (featured ?? []) as Blog[];
  const latestBlogs = (blogsData?.blogs ?? []) as Blog[];
  const catList = (categories ?? []) as Category[];

  useEffect(() => {
    track.mutate({ data: { path: "/" } });
  }, []);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 via-background to-background pt-16 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-primary font-medium text-sm mb-3 tracking-wider uppercase">Welcome to Gurujan</p>
              <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground leading-tight mb-5 text-gradient">
                Gurujan Portal
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                A collaborative space for writers, educators, and creators to share and discover articles on education, society, spirituality, and mental health.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/blog">
                  <Button size="lg" className="gap-2">
                    <BookOpen size={18} /> Read the Feed
                  </Button>
                </Link>
                <Link href="/portal">
                  <Button size="lg" variant="outline">Start Publishing</Button>
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex justify-end">
              <div className="relative w-72 h-72 rounded-2xl bg-gradient-to-tr from-primary/10 via-accent/5 to-primary/5 flex items-center justify-center border border-primary/20 shadow-xl overflow-hidden p-6">
                <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                <img src="/logo.png" className="w-48 h-48 object-contain animate-fade-in drop-shadow-md" alt="Gurujan Logo" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {catList.length > 0 && (
        <section className="py-8 px-4 border-b border-border">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-muted-foreground mr-1">Topics:</span>
              {catList.map((cat) => (
                <Link key={cat.id} href={`/blog?category=${cat.id}`}>
                  <Badge variant="outline" className="hover:bg-primary/10 hover:border-primary/40 cursor-pointer transition-colors text-sm">
                    {cat.name}
                    {(cat.postCount ?? 0) > 0 && (
                      <span className="ml-1 text-xs text-muted-foreground">({cat.postCount})</span>
                    )}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured posts */}
      {featuredBlogs.length > 0 && (
        <section className="py-14 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl font-semibold text-foreground">Featured</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featuredBlogs.slice(0, 2).map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest posts */}
      <section className="py-14 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-2xl font-semibold text-foreground">Latest Writing</h2>
            <Link href="/blog">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary">
                View all <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
          {latestBlogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No posts yet — check back soon.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestBlogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About preview */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">About Gurujan</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Gurujan is a collaborative space for writers, educators, and seekers. Here, we share insights, stories, and reflections on education, society, spirituality, and mental well-being to foster deep learning and positive changes.
          </p>
          <Link href="/about">
            <Button variant="outline">Learn More About Gurujan</Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
