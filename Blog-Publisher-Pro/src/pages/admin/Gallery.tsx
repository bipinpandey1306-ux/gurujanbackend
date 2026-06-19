import { useState } from "react";
import {
  useListAlbums, useCreateAlbum, useUpdateAlbum, useDeleteAlbum,
  useAddPhoto, useDeletePhoto, getListAlbumsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Image as ImageIcon, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";

function AlbumForm({ album, onDone }: { album?: any; onDone: () => void }) {
  const qc = useQueryClient();
  const create = useCreateAlbum();
  const update = useUpdateAlbum();
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: album ? { name: album.name, description: album.description ?? "", coverImage: album.coverImage ?? "" } : {},
  });

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setValue("coverImage", reader.result as string, { shouldDirty: true });
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (data: any) => {
    const after = () => { qc.invalidateQueries({ queryKey: ["albums"] }); onDone(); };
    if (album) update.mutate({ id: album.id, data }, { onSuccess: after });
    else create.mutate({ data }, { onSuccess: after });
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Album Name *</Label>
        <Input {...register("name", { required: true })} placeholder="e.g. Europe Trip 2026" className="h-10 rounded-xl" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</Label>
        <Textarea {...register("description")} rows={3} placeholder="Brief description of the album photos..." className="rounded-xl text-xs leading-relaxed" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cover Image</Label>
        {watch("coverImage") ? (
          <div className="space-y-2">
            <div className="rounded-xl overflow-hidden border border-border/50 aspect-video relative group">
              <img src={watch("coverImage")} alt="Cover preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => setValue("coverImage", "")}
                  className="rounded-lg text-xs"
                >
                  Remove Image
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border/70 hover:border-primary/45 hover:bg-primary/5 rounded-xl cursor-pointer transition-all duration-200 p-4 text-center">
            <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary">
              <Plus size={16} />
              <span className="text-xs font-bold">Upload Cover</span>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
            />
          </label>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" className="rounded-xl text-xs font-semibold" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={create.isPending || update.isPending} className="rounded-xl text-xs font-semibold shadow-lg shadow-primary/10">
          {album ? "Save Changes" : "Create Album"}
        </Button>
      </div>
    </form>
  );
}

function AddPhotoForm({ albumId, onDone }: { albumId: number; onDone: () => void }) {
  const qc = useQueryClient();
  const add = useAddPhoto();
  const { register, handleSubmit, reset, setValue, watch } = useForm<{ url: string; caption: string }>();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setValue("url", reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (data: any) => {
    add.mutate({ albumId, data }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: ["albums"] }); reset(); onDone(); },
    });
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Photo</Label>
        {watch("url") ? (
          <div className="space-y-2">
            <div className="rounded-xl overflow-hidden border border-border/50 aspect-square relative group max-w-[150px] mx-auto">
              <img src={watch("url")} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => setValue("url", "")}
                  className="rounded-lg text-[10px] h-7 px-2"
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border/70 hover:border-primary/45 hover:bg-primary/5 rounded-xl cursor-pointer transition-all duration-200 p-4 text-center">
            <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary">
              <Plus size={18} />
              <span className="text-xs font-bold">Upload Photo</span>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </label>
        )}
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Caption</Label>
        <Input {...register("caption")} placeholder="Add a short photo description" className="h-10 rounded-xl text-xs" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" className="rounded-xl text-xs font-semibold" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={add.isPending} className="rounded-xl text-xs font-semibold shadow-lg shadow-primary/10">Add Photo</Button>
      </div>
    </form>
  );
}

export default function AdminGallery() {
  const qc = useQueryClient();
  const [newAlbum, setNewAlbum] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const delAlbum = useDeleteAlbum();
  const delPhoto = useDeletePhoto();

  const { data, isLoading } = useListAlbums({ scope: "mine" });
  const albums = data?.albums ?? [];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 80 } }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Gallery</h1>
            <p className="text-muted-foreground text-sm mt-1">Organise your photo albums and media displays</p>
          </div>
          <Dialog open={newAlbum} onOpenChange={setNewAlbum}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 px-4 shadow-lg shadow-primary/15 hover-lift h-9 rounded-xl font-semibold text-xs">
                <Plus size={16} /> New Album
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-w-sm">
              <DialogHeader>
                <DialogTitle className="font-serif font-bold text-lg">New Album</DialogTitle>
              </DialogHeader>
              <AlbumForm onDone={() => setNewAlbum(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Loading / Empty / Content Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse border border-border/40" />
            ))}
          </div>
        ) : albums.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border/60 bg-card/20 rounded-2xl flex flex-col items-center justify-center">
            <ImageIcon size={44} className="text-muted-foreground/45 mb-3" />
            <p className="font-serif text-lg font-bold text-foreground mb-1">No albums found</p>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mb-4">Start creating image albums to showcase your portfolios.</p>
            <Button size="sm" variant="outline" onClick={() => setNewAlbum(true)} className="rounded-xl border-border/70 text-xs font-semibold hover-lift">Create first album</Button>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {albums.map((album: any) => (
              <motion.div key={album.id} variants={cardVariants}>
                <Card className="border border-border/50 shadow-sm glass-card overflow-hidden h-full flex flex-col hover-lift">
                  {/* Cover image strip */}
                  {album.coverImage && (
                    <div className="w-full h-32 overflow-hidden border-b border-border/30 relative">
                      <img src={album.coverImage} alt="" className="w-full h-full object-cover filter brightness-[0.85] hover:scale-105 transition-all duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/95 to-transparent pointer-events-none" />
                    </div>
                  )}

                  <CardHeader className="pb-3 pt-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="font-serif text-lg font-bold tracking-tight">{album.name}</CardTitle>
                        {album.description && <p className="text-xs text-muted-foreground/80 mt-1 font-medium leading-relaxed">{album.description}</p>}
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Dialog open={editing?.id === album.id} onOpenChange={(v) => { if (!v) setEditing(null); }}>
                          <DialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors" onClick={() => setEditing(album)}>
                              <Edit size={14} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-2xl max-w-sm">
                            <DialogHeader>
                              <DialogTitle className="font-serif font-bold text-lg">Edit Album</DialogTitle>
                            </DialogHeader>
                            {editing?.id === album.id && <AlbumForm album={album} onDone={() => setEditing(null)} />}
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
                              <AlertDialogTitle className="font-serif font-bold text-lg">Delete album?</AlertDialogTitle>
                              <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                                Are you sure you want to delete this album? All {album.photos?.length ?? 0} photos uploaded inside this album will be deleted permanently.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-2">
                              <AlertDialogCancel className="rounded-xl text-xs font-semibold">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => delAlbum.mutate({ id: album.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: ["albums"] }) })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-semibold">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-between">
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-4">
                      {(album.photos ?? []).map((p: any) => (
                        <div key={p.id} className="relative group aspect-square rounded-xl overflow-hidden bg-muted/60 border border-border/40">
                          <img src={p.url} alt={p.caption ?? ""} className="w-full h-full object-cover hover:scale-105 transition-all duration-300" />
                          <button
                            onClick={() => delPhoto.mutate({ id: p.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: ["albums"] }) })}
                            className="absolute top-1 right-1 w-5 h-5 rounded-lg bg-black/75 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <X size={10} />
                          </button>
                          {p.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 truncate">
                              {p.caption}
                            </div>
                          )}
                        </div>
                      ))}
                      <Dialog open={addingTo === album.id} onOpenChange={(v) => { if (!v) setAddingTo(null); }}>
                        <DialogTrigger asChild>
                          <button
                            onClick={() => setAddingTo(album.id)}
                            className="aspect-square rounded-xl border-2 border-dashed border-border/70 hover:border-primary/40 hover:bg-primary/5 flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:text-primary transition-all duration-200"
                          >
                            <Plus size={16} />
                            <span className="text-[10px] font-bold">Add</span>
                          </button>
                        </DialogTrigger>
                        <DialogContent className="rounded-2xl max-w-sm">
                          <DialogHeader>
                            <DialogTitle className="font-serif font-bold text-lg">Add Photo to "{album.name}"</DialogTitle>
                          </DialogHeader>
                          <AddPhotoForm albumId={album.id} onDone={() => setAddingTo(null)} />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
}
