import { useEffect } from "react";
import { Link, useParams } from "wouter";
import {
  useGetBlogBySlug, useListBlogComments, useSubmitComment,
  useTrackPageView, useListBlogs,
  getGetBlogBySlugQueryKey, getListBlogCommentsQueryKey,
} from "@workspace/api-client-react";
import type { Blog, Comment } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import PublicLayout from "@/components/public/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Eye, ArrowLeft, MessageSquare, User } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";

interface CommentForm {
  authorName: string;
  authorEmail: string;
  content: string;
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const track = useTrackPageView();
  const qc = useQueryClient();

  const { data: blog, isLoading } = useGetBlogBySlug(slug, {
    query: { queryKey: getGetBlogBySlugQueryKey(slug), enabled: !!slug },
  });

  const { data: comments } = useListBlogComments(blog?.id || "", {
    query: { queryKey: getListBlogCommentsQueryKey(blog?.id || ""), enabled: !!blog?.id },
  });

  const { data: relatedData } = useListBlogs({
    status: "published",
    categoryId: blog?.categoryId ?? undefined,
    limit: 3,
  });
  const related = ((relatedData?.blogs ?? []) as Blog[]).filter((b) => b.id !== blog?.id).slice(0, 2);
  const commentList = (comments ?? []) as Comment[];

  const submit = useSubmitComment();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CommentForm>();

  useEffect(() => {
    if (slug) track.mutate({ data: { path: `/blog/${slug}` } });
  }, [slug]);

  const onComment = (data: CommentForm) => {
    if (!blog?.id) return;
    submit.mutate(
      { blogId: blog.id, data },
      {
        onSuccess: () => {
          reset();
          qc.invalidateQueries({ queryKey: getListBlogCommentsQueryKey(blog.id) });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-4 py-16">
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!blog) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <h1 className="font-serif text-2xl font-semibold mb-3">Post not found</h1>
          <Link href="/blog"><Button variant="outline">Back to Blog</Button></Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <article className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/blog">
          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft size={14} /> Back to all posts
          </button>
        </Link>

        {blog.categoryName && (
          <Badge variant="secondary" className="mb-4">{blog.categoryName}</Badge>
        )}

        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground leading-tight mb-4">
          {blog.title}
        </h1>

        {blog.excerpt && (
          <p className="text-lg text-muted-foreground leading-relaxed mb-6 font-serif italic border-l-2 border-primary pl-4">
            {blog.excerpt}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-8">
          {blog.authorName && (
            <span className="flex items-center gap-1.5 font-semibold text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10 text-xs">
              <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary-foreground font-serif">
                {blog.authorName[0]}
              </span>
              By {blog.authorName}
            </span>
          )}
          {blog.publishedAt && (
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {format(new Date(blog.publishedAt), "MMMM d, yyyy")}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Eye size={14} /> {blog.viewCount ?? 0} views
          </span>
          {commentList.length > 0 && (
            <span className="flex items-center gap-1.5">
              <MessageSquare size={14} /> {commentList.length} comment{commentList.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {blog.featuredImage && (
          <div className="rounded-xl overflow-hidden mb-10 aspect-video">
            <img src={blog.featuredImage} alt={blog.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div
          className="prose prose-stone max-w-none prose-headings:font-serif prose-headings:font-semibold prose-a:text-primary prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: blog.content ?? "" }}
        />

        {blog.tags && blog.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {(blog.tags as string[]).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}

        {blog.authorName && blog.authorBio && (
          <div className="my-12 p-6 rounded-xl border border-border bg-card/60 backdrop-blur flex flex-col sm:flex-row gap-4 items-center sm:items-start text-center sm:text-left">
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 shadow-sm text-primary font-serif font-bold text-xl">
              {blog.authorName[0]}
            </div>
            <div className="space-y-1.5">
              <h4 className="font-serif font-bold text-sm text-foreground">About the Author: {blog.authorName}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{blog.authorBio}</p>
            </div>
          </div>
        )}

        <Separator className="my-12" />

        {/* Comments */}
        <section>
          <h2 className="font-serif text-2xl font-semibold mb-6">
            {commentList.length > 0 ? `${commentList.length} Comment${commentList.length !== 1 ? "s" : ""}` : "Be the first to comment"}
          </h2>

          {commentList.length > 0 && (
            <div className="space-y-6 mb-10">
              {commentList.map((c) => (
                <div key={c.id} className="flex gap-4">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-foreground">{c.authorName}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(c.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-muted/30 rounded-xl p-6 border border-border">
            <h3 className="font-serif font-semibold mb-4">Leave a comment</h3>
            <form onSubmit={handleSubmit(onComment)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input placeholder="Your name *" {...register("authorName", { required: true })} />
                  {errors.authorName && <p className="text-xs text-destructive mt-1">Name is required</p>}
                </div>
                <div>
                  <Input placeholder="Email (not published)" type="email" {...register("authorEmail")} />
                </div>
              </div>
              <div>
                <Textarea
                  placeholder="Your thoughts..."
                  rows={4}
                  {...register("content", { required: true, minLength: 10 })}
                />
                {errors.content && <p className="text-xs text-destructive mt-1">Please write at least 10 characters</p>}
              </div>
              <Button type="submit" disabled={submit.isPending}>
                {submit.isPending ? "Submitting..." : "Submit Comment"}
              </Button>
              {submit.isSuccess && (
                <p className="text-sm text-muted-foreground">Thank you — your comment is awaiting moderation.</p>
              )}
            </form>
          </div>
        </section>

        {/* Related posts */}
        {related.length > 0 && (
          <>
            <Separator className="my-12" />
            <section>
              <h2 className="font-serif text-xl font-semibold mb-5">More to read</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {related.map((r) => (
                  <Link key={r.id} href={`/blog/${r.slug}`}>
                    <div className="p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-colors cursor-pointer">
                      <h4 className="font-serif font-semibold text-sm text-foreground line-clamp-2 mb-1 hover:text-primary transition-colors">
                        {r.title}
                      </h4>
                      {r.publishedAt && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(r.publishedAt), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </article>
    </PublicLayout>
  );
}
