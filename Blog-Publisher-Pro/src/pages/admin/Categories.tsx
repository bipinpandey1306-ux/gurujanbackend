import { useState } from "react";
import {
  useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory,
  getListCategoriesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Tag, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";

interface CatForm {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
}

function CategoryDialog({ cat, onDone }: { cat?: any; onDone: () => void }) {
  const qc = useQueryClient();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CatForm>({
    defaultValues: cat ? { name: cat.name, slug: cat.slug, description: cat.description ?? "", sortOrder: cat.sortOrder ?? 0 } : {},
  });

  const nameVal = watch("name");
  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const onSubmit = (data: CatForm) => {
    const payload = { ...data, slug: data.slug || slugify(data.name), sortOrder: Number(data.sortOrder) };
    const after = () => { qc.invalidateQueries({ queryKey: ["categories"] }); onDone(); };
    if (cat) {
      update.mutate({ id: cat.id, data: payload }, { onSuccess: after });
    } else {
      create.mutate({ data: payload }, { onSuccess: after });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Name *</Label>
        <Input
          {...register("name", { required: true })}
          placeholder="e.g. Travel Stories"
          className="h-10 rounded-xl"
          onChange={(e) => {
            setValue("name", e.target.value);
            if (!cat) setValue("slug", slugify(e.target.value));
          }}
        />
        {errors.name && <p className="text-xs text-destructive font-semibold">Required</p>}
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Slug</Label>
        <Input {...register("slug")} placeholder="auto-generated" className="h-10 rounded-xl bg-background/50 border-border/50 text-xs" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</Label>
        <Textarea {...register("description")} placeholder="Short summary description" rows={3} className="rounded-xl leading-relaxed text-xs" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sort Order</Label>
        <Input type="number" {...register("sortOrder")} placeholder="0" className="w-24 h-10 rounded-xl text-xs" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" className="rounded-xl text-xs font-semibold" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={create.isPending || update.isPending} className="rounded-xl text-xs font-semibold shadow-lg shadow-primary/10">
          {cat ? "Save Changes" : "Create"}
        </Button>
      </div>
    </form>
  );
}

export default function AdminCategories() {
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const qc = useQueryClient();
  const del = useDeleteCategory();

  const { data, isLoading } = useListCategories({ scope: "mine" });
  const categories = data?.categories ?? [];

  const handleDelete = (id: number) => {
    del.mutate({ id }, { onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }) });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 90 } }
  };

  if (user?.role !== "superadmin") {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <h2 className="text-2xl font-bold font-serif">Unauthorized Access</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            This page is restricted to the Super Admin.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Categories</h1>
            <p className="text-muted-foreground text-sm mt-1">Organise your content and tags by topic</p>
          </div>
          <Dialog open={open && !editing} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 px-4 shadow-lg shadow-primary/15 hover-lift h-9 rounded-xl font-semibold text-xs">
                <Plus size={16} /> New Category
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-w-sm">
              <DialogHeader>
                <DialogTitle className="font-serif font-bold text-lg">New Category</DialogTitle>
              </DialogHeader>
              <CategoryDialog onDone={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories Main Card List */}
        <Card className="border border-border/50 shadow-sm glass-card overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-muted animate-pulse border border-border/40" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center">
                <Tag size={44} className="text-muted-foreground/40 mb-3" />
                <p className="font-serif text-lg font-bold text-foreground mb-1">No categories yet</p>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mb-4">Start creating tag categories to label your blog articles.</p>
                <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="rounded-xl border-border/70 text-xs font-semibold hover-lift">Create one now</Button>
              </div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="divide-y divide-border/40"
              >
                <AnimatePresence>
                  {categories.map((cat: any) => (
                    <motion.div 
                      key={cat.id} 
                      variants={itemVariants}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/5">
                        <Tag size={15} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground leading-snug">{cat.name}</p>
                        <p className="text-xs text-muted-foreground/80 font-medium mt-0.5">
                          /{cat.slug} · <span className="text-primary/95 font-bold">{cat.postCount ?? 0}</span> published posts
                        </p>
                      </div>
                      {cat.description && (
                        <p className="text-xs text-muted-foreground/80 hidden md:block max-w-xs truncate font-medium flex-1">
                          {cat.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Dialog open={editing?.id === cat.id} onOpenChange={(v) => { if (!v) setEditing(null); }}>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors" onClick={() => setEditing(cat)}>
                              <Edit size={14} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-2xl max-w-sm">
                            <DialogHeader>
                              <DialogTitle className="font-serif font-bold text-lg">Edit Category</DialogTitle>
                            </DialogHeader>
                            {editing?.id === cat.id && <CategoryDialog cat={cat} onDone={() => setEditing(null)} />}
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                              <Trash2 size={14} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-serif font-bold text-lg">Delete "{cat.name}"?</AlertDialogTitle>
                              <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                                Are you sure you want to delete this category? Any blog posts under "{cat.name}" will become uncategorised. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-2">
                              <AlertDialogCancel className="rounded-xl text-xs font-semibold">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(cat.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-semibold">Delete</AlertDialogAction>
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
      </div>
    </SuperAdminLayout>
  );
}
