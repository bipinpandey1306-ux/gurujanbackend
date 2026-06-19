import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetBlog, useCreateBlog, useUpdateBlog,
  useListCategories, getListBlogsQueryKey, getGetBlogQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  List, ListOrdered, Link as LinkIcon, Quote, ArrowLeft, Save, Globe, Eye, Plus
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { motion } from "framer-motion";

interface BlogForm {
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  categoryId: string;
  tags: string;
  seoTitle: string;
  seoDescription: string;
  status: "draft" | "published";
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

// Rich text toolbar button
function ToolbarBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all hover:scale-105 active:scale-95"
    >
      {children}
    </button>
  );
}

function RichEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedSelectionRef.current = sel.getRangeAt(0);
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedSelectionRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  const exec = (cmd: string, val?: string) => {
    restoreSelection();
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) exec("createLink", url);
  };

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden glass-card shadow-sm bg-card/40">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 bg-muted/30 border-b border-border/45 flex-wrap">
        <ToolbarBtn title="Bold" onClick={() => exec("bold")}><Bold size={15} /></ToolbarBtn>
        <ToolbarBtn title="Italic" onClick={() => exec("italic")}><Italic size={15} /></ToolbarBtn>
        <Separator orientation="vertical" className="h-5 mx-1.5 opacity-60" />
        <ToolbarBtn title="Heading 1" onClick={() => exec("formatBlock", "h1")}><Heading1 size={15} /></ToolbarBtn>
        <ToolbarBtn title="Heading 2" onClick={() => exec("formatBlock", "h2")}><Heading2 size={15} /></ToolbarBtn>
        <ToolbarBtn title="Heading 3" onClick={() => exec("formatBlock", "h3")}><Heading3 size={15} /></ToolbarBtn>
        <Separator orientation="vertical" className="h-5 mx-1.5 opacity-60" />
        <ToolbarBtn title="Bullet list" onClick={() => exec("insertUnorderedList")}><List size={15} /></ToolbarBtn>
        <ToolbarBtn title="Numbered list" onClick={() => exec("insertOrderedList")}><ListOrdered size={15} /></ToolbarBtn>
        <ToolbarBtn title="Blockquote" onClick={() => exec("formatBlock", "blockquote")}><Quote size={15} /></ToolbarBtn>
        <ToolbarBtn title="Insert link" onClick={insertLink}><LinkIcon size={15} /></ToolbarBtn>
        <Separator orientation="vertical" className="h-5 mx-1.5 opacity-60" />
        <ToolbarBtn title="Remove formatting" onClick={() => exec("removeFormat")}>
          <span className="text-xs font-mono font-bold px-0.5">T</span>
        </ToolbarBtn>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Start writing your post content here..."
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        className="min-h-[420px] p-5 focus:outline-none prose prose-stone dark:prose-invert max-w-none prose-headings:font-serif text-sm leading-relaxed"
        style={{ fontFamily: "var(--app-font-sans)" }}
      />
    </div>
  );
}

export default function AdminBlogEditor() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const isEdit = !!id;

  const { data: blogData, isLoading: loadingBlog } = useGetBlog(id || "", {
    query: { queryKey: getGetBlogQueryKey(id || ""), enabled: isEdit && !!id },
  });
  const { data: catData } = useListCategories({ scope: "mine" });
  const categories = catData?.categories ?? [];

  const create = useCreateBlog();
  const update = useUpdateBlog();

  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [saveMsg, setSaveMsg] = useState("");

  const { register, handleSubmit, setValue, watch, control, reset, formState: { errors } } = useForm<BlogForm>({
    defaultValues: { status: "draft", categoryId: "none" },
  });

  const blog = blogData?.blog;

  useEffect(() => {
    if (blog) {
      reset({
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt ?? "",
        featuredImage: blog.featuredImage ?? "",
        categoryId: blog.categoryId ? String(blog.categoryId) : "none",
        tags: (blog.tags ?? []).join(", "),
        seoTitle: blog.seoTitle ?? "",
        seoDescription: blog.seoDescription ?? "",
        status: blog.status as "draft" | "published",
      });
      setContent(blog.content ?? "");
      setStatus(blog.status as "draft" | "published");
    }
  }, [blog]);

  const titleVal = watch("title");
  useEffect(() => {
    if (!isEdit) setValue("slug", slugify(titleVal ?? ""));
  }, [titleVal, isEdit]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setValue("featuredImage", base64String, { shouldDirty: true });
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (data: BlogForm, saveStatus: "draft" | "published" = status) => {
    const payload = {
      title: data.title,
      slug: data.slug,
      content,
      excerpt: data.excerpt || undefined,
      featuredImage: data.featuredImage || undefined,
      categoryId: (data.categoryId && data.categoryId !== "none") ? data.categoryId : undefined,
      tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      seoTitle: data.seoTitle || undefined,
      seoDescription: data.seoDescription || undefined,
      status: saveStatus,
    };

    const onSuccess = () => {
      qc.invalidateQueries({ queryKey: getListBlogsQueryKey() });
      setSaveMsg(saveStatus === "published" ? "Published successfully!" : "Draft saved!");
      setTimeout(() => setSaveMsg(""), 3000);
      if (!isEdit) navigate("/portal/blogs");
    };

    if (isEdit) {
      update.mutate({ id: id || "", data: payload }, { onSuccess });
    } else {
      create.mutate({ data: payload }, { onSuccess });
    }
  };

  const saving = create.isPending || update.isPending;

  if (isEdit && loadingBlog) {
    return (
      <AdminLayout>
        <div className="space-y-4 animate-pulse max-w-4xl">
          <div className="h-8 bg-muted rounded-xl w-1/3" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit((data) => onSubmit(data, status))}>
        <div className="max-w-5xl space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={() => navigate("/portal/blogs")} 
                className="text-muted-foreground hover:text-foreground p-1.5 hover:bg-muted/50 rounded-xl transition-all"
              >
                <ArrowLeft size={18} />
              </button>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
                {isEdit ? "Edit Post" : "New Post"}
              </h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {saveMsg && (
                <motion.span 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-950/20 px-2.5 py-1 rounded-lg border border-green-200/50"
                >
                  {saveMsg}
                </motion.span>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={handleSubmit((data) => onSubmit(data, "draft"))}
                className="gap-2 px-3.5 h-9 rounded-xl font-semibold border-border/60 hover-lift text-xs"
              >
                <Save size={14} /> Save Draft
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={saving}
                onClick={handleSubmit((data) => onSubmit(data, "published"))}
                className="gap-2 px-4 h-9 rounded-xl font-semibold shadow-lg shadow-primary/15 hover-lift text-xs"
              >
                <Globe size={14} /> {isEdit && blog?.status === "published" ? "Update Post" : "Publish Post"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Main Content Pane */}
            <div className="lg:col-span-2 space-y-5">
              <div className="space-y-1.5">
                <Input
                  {...register("title", { required: "Title is required" })}
                  placeholder="Enter post title here..."
                  className="text-2xl font-serif font-bold h-14 border-0 border-b border-border/40 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary text-foreground placeholder:text-muted-foreground/50 bg-transparent"
                />
                {errors.title && <p className="text-xs text-destructive font-semibold">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Article Body</Label>
                <RichEditor value={content} onChange={setContent} />
              </div>
            </div>

            {/* Right Sidebar Options Pane */}
            <div className="space-y-5">
              {/* Category & Tag details */}
              <Card className="border border-border/50 shadow-sm glass-card">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="font-serif text-sm font-bold">Metadata & Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Slug</Label>
                    <Input {...register("slug")} placeholder="url-slug-goes-here" className="h-9 rounded-xl text-xs bg-background/50 border-border/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Category</Label>
                    <Controller
                      control={control}
                      name="categoryId"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="text-xs h-9 rounded-xl bg-background/50 border-border/50">
                            <SelectValue placeholder="Select topic category" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="none">None</SelectItem>
                            {categories.map((c: any) => (
                              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Excerpt</Label>
                    <Textarea
                      {...register("excerpt")}
                      placeholder="Brief article summary for catalogs..."
                      rows={3}
                      className="text-xs rounded-xl bg-background/50 border-border/50 leading-relaxed"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Featured Image</Label>
                    
                    {watch("featuredImage") ? (
                      <div className="space-y-2">
                        <div className="rounded-xl overflow-hidden border border-border/50 aspect-video relative group">
                          <img src={watch("featuredImage")} alt="Featured preview" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button 
                              type="button" 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => setValue("featuredImage", "", { shouldDirty: true })}
                              className="rounded-lg text-xs"
                            >
                              Remove Image
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-border/70 hover:border-primary/45 hover:bg-primary/5 rounded-xl cursor-pointer transition-all duration-200 p-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-primary">
                          <Plus size={20} className="text-muted-foreground" />
                          <span className="text-xs font-bold">Upload Image</span>
                          <span className="text-[10px]">PNG, JPG, GIF up to 5MB</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tags (comma-separated)</Label>
                    <Input {...register("tags")} placeholder="news, tech, journal" className="h-9 rounded-xl text-xs bg-background/50 border-border/50" />
                  </div>
                </CardContent>
              </Card>

              {/* SEO details */}
              <Card className="border border-border/50 shadow-sm glass-card">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="font-serif text-sm font-bold">SEO Optimization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">SEO Meta Title</Label>
                    <Input {...register("seoTitle")} placeholder="Override title for Google results" className="h-9 rounded-xl text-xs bg-background/50 border-border/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Meta Description</Label>
                    <Textarea {...register("seoDescription")} placeholder="Google search result snippet..." rows={3} className="text-xs rounded-xl bg-background/50 border-border/50 leading-relaxed" />
                  </div>
                </CardContent>
              </Card>

              {/* Status details */}
              <Card className="border border-border/50 shadow-sm glass-card">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={status === "published" ? "default" : "secondary"} className="text-[10px] uppercase font-bold tracking-wider rounded-full px-2.5 py-0.5">
                      {status === "published" ? "Published" : "Draft"}
                    </Badge>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {status === "published" ? "Live on public blog" : "Visible only to author"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
