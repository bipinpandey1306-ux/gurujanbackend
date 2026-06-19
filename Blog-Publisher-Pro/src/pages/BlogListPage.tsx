import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { useListBlogs, useListCategories, useTrackPageView } from "@workspace/api-client-react";
import type { Blog, Category } from "@workspace/api-client-react";
import PublicLayout from "@/components/public/PublicLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Eye, Search } from "lucide-react";
import { format } from "date-fns";

export default function BlogListPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryId, setCategoryId] = useState(params.get("category") ?? "");
  const [page, setPage] = useState(1);
  const track = useTrackPageView();

  const { data: blogsData, isLoading } = useListBlogs({
    status: "published",
    search: searchTerm || undefined,
    categoryId: categoryId || undefined,
    page,
    limit: 9,
  });
  const { data: categories } = useListCategories();

  const blogs = (blogsData?.blogs ?? []) as Blog[];
  const total = blogsData?.total ?? 0;
  const totalPages = Math.ceil(total / 9);
  const catList = (categories ?? []) as Category[];

  useEffect(() => {
    track.mutate({ data: { path: "/blog" } });
  }, []);

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="font-serif text-4xl font-semibold text-foreground mb-3">Blog</h1>
          <p className="text-muted-foreground">Essays, reflections, and perspectives on what matters most.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={categoryId} onValueChange={(v) => { setCategoryId(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All Topics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {catList.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-serif text-xl text-foreground mb-2">No posts found</p>
            <p className="text-muted-foreground text-sm">Try adjusting your search or category filter.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">{total} post{total !== 1 ? "s" : ""}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {blogs.map((blog) => (
                <Link key={blog.id} href={`/blog/${blog.slug}`}>
                  <Card className="group h-full hover:shadow-lg transition-all duration-300 border-border hover:border-primary/30 overflow-hidden cursor-pointer flex flex-col">
                    {blog.featuredImage && (
                      <div className="aspect-video overflow-hidden">
                        <img src={blog.featuredImage} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <CardContent className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {blog.categoryName && (
                          <Badge variant="secondary" className="text-xs mb-3">{blog.categoryName}</Badge>
                        )}
                        <h2 className="font-serif font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-lg leading-snug mb-2">
                          {blog.title}
                        </h2>
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
                            <Eye size={12} /> {blog.viewCount ?? 0}
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
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <span className="text-sm text-muted-foreground px-2">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>
    </PublicLayout>
  );
}
