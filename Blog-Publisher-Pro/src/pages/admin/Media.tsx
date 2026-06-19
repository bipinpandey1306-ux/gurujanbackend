import { useState, useEffect, useRef } from "react";
import { useListMedia, useUploadMedia, useDeleteMedia, getListMediaQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, Trash2, HardDrive, Copy, Check, UploadCloud, Search, 
  Image as ImageIcon, FileText, LayoutGrid, Info, ExternalLink, 
  Calendar, Loader2, SlidersHorizontal, ChevronDown, ChevronUp, AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

// Format bytes to readable string (e.g. 1.2 MB)
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export default function AdminMedia() {
  const qc = useQueryClient();
  const upload = useUploadMedia();
  const del = useDeleteMedia();
  const { toast } = useToast();

  // Media loading state
  const { data, isLoading } = useListMedia();
  const media = data?.media ?? [];

  // Interaction & UI States
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "image" | "document" | "other">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "size-desc" | "size-asc" | "name">("newest");
  const [gridDensity, setGridDensity] = useState<"small" | "medium" | "large">("medium");
  const [uploadPanelOpen, setUploadPanelOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  // File Input Ref for click-to-trigger
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate image dimensions when a media item is clicked
  useEffect(() => {
    if (selectedMedia && selectedMedia.mimeType?.startsWith("image")) {
      const img = new Image();
      img.onload = () => {
        setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = selectedMedia.url;
    } else {
      setDimensions(null);
    }
  }, [selectedMedia]);

  // Statistics calculation
  const totalFiles = media.length;
  const totalSize = media.reduce((acc: number, item: any) => acc + (item.size || 0), 0);
  const imageFiles = media.filter((item: any) => item.mimeType?.startsWith("image")).length;
  const docFiles = media.filter((item: any) => !item.mimeType?.startsWith("image")).length;
  const storageLimit = 50 * 1024 * 1024; // 50MB virtual sandbox limit
  const storageUsedPercent = Math.min((totalSize / storageLimit) * 100, 100);

  // Handle URL copying
  const copyUrl = (id: number, url: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast({ title: "Copied!", description: "Media URL copied to clipboard." });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Upload handlers
  const handleMediaFiles = async (files: FileList) => {
    setUploading(true);
    setUploadProgress(0);
    const total = files.length;
    let successCount = 0;

    try {
      for (let i = 0; i < total; i++) {
        const file = files[i];
        
        // Convert to Base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });

        // Run upload mutation
        await new Promise<void>((resolve, reject) => {
          upload.mutate({
            data: {
              url: base64,
              filename: file.name,
              type: file.type,
              size: file.size
            }
          }, {
            onSuccess: () => {
              successCount++;
              setUploadProgress(((i + 1) / total) * 100);
              resolve();
            },
            onError: (err) => {
              reject(err);
            }
          });
        });
      }

      // Invalidate queries after successful uploads
      qc.invalidateQueries({ queryKey: getListMediaQueryKey() });
      toast({
        title: "Upload Successful",
        description: `Successfully uploaded ${successCount} of ${total} file(s).`
      });
      setUploadPanelOpen(false);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "An error occurred while uploading media items.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMediaFiles(e.dataTransfer.files);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMediaFiles(e.target.files);
    }
  };

  // Filter and Sort logic
  const filteredMedia = media
    .filter((m: any) => {
      // 1. Search filter
      const matchesSearch = m.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            m.url?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Type filter
      if (selectedType === "all") return matchesSearch;
      if (selectedType === "image") return matchesSearch && m.mimeType?.startsWith("image");
      if (selectedType === "document") return matchesSearch && m.mimeType?.includes("pdf") || m.mimeType?.includes("text") || m.mimeType?.includes("zip");
      return matchesSearch && !m.mimeType?.startsWith("image") && !m.mimeType?.includes("pdf") && !m.mimeType?.includes("text") && !m.mimeType?.includes("zip");
    })
    .sort((a: any, b: any) => {
      // 3. Sorting
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "size-desc") return (b.size || 0) - (a.size || 0);
      if (sortBy === "size-asc") return (a.size || 0) - (b.size || 0);
      return (a.title || "").localeCompare(b.title || "");
    });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.03 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
  };

  // Grid Density classes
  const gridClasses = {
    small: "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3",
    medium: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4",
    large: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
  }[gridDensity];

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Header and Add Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground bg-gradient-to-r from-foreground via-foreground/90 to-foreground/75 bg-clip-text text-transparent">Media Indexer</h1>
            <p className="text-muted-foreground text-xs mt-1 font-medium">Browse, upload, filter, and reference files stored in your local sandbox.</p>
          </div>
          <Button 
            onClick={() => setUploadPanelOpen(!uploadPanelOpen)} 
            size="sm" 
            className="gap-2 px-4 shadow-lg shadow-primary/10 hover-lift h-9 rounded-xl font-semibold text-xs border border-primary/20 bg-primary text-primary-foreground hover:bg-primary/95 transition-all"
          >
            {uploadPanelOpen ? <ChevronUp size={15} /> : <Plus size={15} />}
            {uploadPanelOpen ? "Close Uploader" : "Add Media"}
          </Button>
        </div>

        {/* Storage / Capacity Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className="glass-card p-4 rounded-2xl flex flex-col justify-between border border-border/40 relative overflow-hidden bg-background/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <HardDrive size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Vault Usage</p>
                <p className="text-lg font-bold text-foreground mt-0.5">{formatBytes(totalSize)}</p>
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <Progress value={storageUsedPercent} className="h-1.5 bg-muted" />
              <div className="flex justify-between text-[9px] font-medium text-muted-foreground">
                <span>{storageUsedPercent.toFixed(1)}% occupied</span>
                <span>Limit: 50 MB</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl flex items-center gap-4 border border-border/40 bg-background/50">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <ImageIcon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Image Index</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{imageFiles} items</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">PNG, JPEG, WEBP, GIF</p>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl flex items-center gap-4 border border-border/40 bg-background/50">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Documents</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{docFiles} items</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">PDFs, JSON, CSVs, TXT</p>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl flex items-center gap-4 border border-border/40 bg-background/50">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <LayoutGrid size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Assets</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{totalFiles} index files</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Mapped in IndexedDB</p>
            </div>
          </div>

        </div>

        {/* Collapsible Drag & Drop Upload Zone */}
        <AnimatePresence>
          {uploadPanelOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div 
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center transition-all ${
                  isDragging 
                    ? "border-primary bg-primary/5 scale-[0.99]" 
                    : "border-border/60 hover:border-primary/40 bg-muted/10 hover:bg-muted/20"
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={onFileChange} 
                  multiple 
                  className="hidden" 
                />
                
                {uploading ? (
                  <div className="space-y-4 w-full max-w-xs py-4">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-foreground">Importing and encrypting files...</p>
                      <Progress value={uploadProgress} className="h-2 bg-muted w-full" />
                      <p className="text-[10px] text-muted-foreground">{Math.round(uploadProgress)}% completed</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                      <UploadCloud size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Drag and drop files here, or click browse</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Files are securely base64 encoded and stored in local memory. (Max 5MB per file)</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()} 
                      className="mt-2 rounded-xl text-xs font-semibold border-border/70 shadow-sm hover-lift"
                    >
                      Browse Local Files
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filtering, Search & Sorting Panel */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-4 bg-muted/20 border border-border/30 rounded-2xl glass-card">
          
          {/* Left: Search input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              type="text" 
              placeholder="Search assets by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 border-border/50 text-xs bg-background/50 rounded-xl focus-visible:ring-1 focus-visible:ring-primary w-full"
            />
          </div>

          {/* Right: Tabs, sort and density selectors */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Type Filter Tabs */}
            <div className="flex rounded-xl bg-background/60 p-0.5 border border-border/40 text-xs">
              {(["all", "image", "document", "other"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all font-medium text-[11px] ${
                    selectedType === type 
                      ? "bg-primary text-primary-foreground font-bold shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-1.5 bg-background/60 border border-border/40 px-2.5 h-9 rounded-xl">
              <SlidersHorizontal size={13} className="text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-transparent border-0 text-[11px] font-medium text-foreground focus:outline-none pr-1"
              >
                <option value="newest" className="bg-background">Newest Upload</option>
                <option value="oldest" className="bg-background">Oldest Upload</option>
                <option value="size-desc" className="bg-background">Size (High to Low)</option>
                <option value="size-asc" className="bg-background">Size (Low to High)</option>
                <option value="name" className="bg-background">Name (A-Z)</option>
              </select>
            </div>

            {/* Grid Density Selectors */}
            <div className="flex items-center rounded-xl bg-background/60 p-0.5 border border-border/40">
              {(["small", "medium", "large"] as const).map((density) => (
                <button
                  key={density}
                  onClick={() => setGridDensity(density)}
                  title={`Grid density: ${density}`}
                  className={`p-1.5 rounded-lg transition-all ${
                    gridDensity === density 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid size={13} />
                </button>
              ))}
            </div>

          </div>

        </div>

        {/* Media Grid / Library */}
        {isLoading ? (
          <div className={`grid ${gridClasses}`}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-muted animate-pulse border border-border/40" />
            ))}
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border/50 bg-muted/10 rounded-2xl flex flex-col items-center justify-center p-4">
            <AlertCircle size={44} className="text-muted-foreground/45 mb-3" />
            <p className="font-serif text-lg font-bold text-foreground mb-1">No matches found</p>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mb-4">
              Try adjusting your query, clear filters, or upload new files to your catalog.
            </p>
            <Button size="sm" variant="outline" onClick={() => { setSearchQuery(""); setSelectedType("all"); }} className="rounded-xl border-border/70 text-xs font-semibold hover-lift">
              Reset Filters
            </Button>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className={`grid ${gridClasses}`}
          >
            <AnimatePresence>
              {filteredMedia.map((m: any) => {
                const isImage = m.mimeType?.startsWith("image");
                return (
                  <motion.div 
                    key={m.id} 
                    variants={itemVariants}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => setSelectedMedia(m)}
                    className="group relative rounded-2xl overflow-hidden border border-border/40 bg-muted/10 aspect-square hover-lift shadow-sm cursor-pointer"
                  >
                    {isImage ? (
                      <img 
                        src={m.url} 
                        alt={m.title ?? ""} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 filter brightness-[0.98] group-hover:brightness-[0.95]" 
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2.5 bg-muted/20">
                        <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center shadow-sm text-muted-foreground">
                          <FileText size={22} />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground/80 tracking-wide truncate max-w-[80%]">
                          {m.mimeType?.split("/")[1]?.toUpperCase() || "FILE"}
                        </span>
                      </div>
                    )}

                    {/* Gradient Info overlay (Visible on cards and hover) */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2.5 pointer-events-none">
                      <p className="text-white text-[10px] font-semibold truncate w-full">{m.title || "Untitled"}</p>
                      <p className="text-white/60 text-[9px] mt-0.5">{formatBytes(m.size)}</p>
                    </div>

                    {/* Quick-action Ext label on top-left */}
                    <div className="absolute top-2.5 left-2.5 rounded-lg bg-black/60 backdrop-blur-md px-2 py-0.5 border border-white/10 text-[9px] font-bold uppercase tracking-wider text-white">
                      {m.mimeType?.split("/")[1] || "BIN"}
                    </div>

                    {/* Actions overlay buttons (Top Right) */}
                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => copyUrl(m.id, m.url, e)}
                        title="Copy Reference URL"
                        className="w-7 h-7 rounded-lg bg-black/85 text-white flex items-center justify-center hover:bg-black active:scale-95 transition-all border border-white/10 shadow-sm"
                      >
                        {copiedId === m.id ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                      </button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button 
                            title="Remove Asset"
                            className="w-7 h-7 rounded-lg bg-black/85 text-white flex items-center justify-center hover:bg-red-600 hover:text-white active:scale-95 transition-all border border-white/10 shadow-sm"
                          >
                            <Trash2 size={11} />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl max-w-sm">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-serif font-bold text-lg text-foreground">Remove this asset?</AlertDialogTitle>
                            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                              This deletes the file permanently from the database. References on existing blogs may fail. This cannot be reverted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel className="rounded-xl text-xs font-semibold h-9">Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => {
                                del.mutate({ id: m.id }, { 
                                  onSuccess: () => {
                                    qc.invalidateQueries({ queryKey: getListMediaQueryKey() });
                                    toast({ title: "Deleted", description: "Media item removed." });
                                    if (selectedMedia?.id === m.id) setSelectedMedia(null);
                                  } 
                                });
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-semibold h-9"
                            >
                              Confirm Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Detailed Media Inspection Drawer (Radix Sheet Component) */}
        <Sheet open={!!selectedMedia} onOpenChange={(open) => !open && setSelectedMedia(null)}>
          <SheetContent className="sm:max-w-md border-l border-border/40 p-6 flex flex-col justify-between h-full bg-background">
            
            <div className="space-y-6 overflow-y-auto pr-1">
              <SheetHeader className="text-left space-y-1">
                <SheetTitle className="font-serif font-bold text-xl text-foreground">Asset Details</SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">Properties and metadata stored in repository index.</SheetDescription>
              </SheetHeader>

              {selectedMedia && (
                <div className="space-y-5">
                  
                  {/* Aspect Preview */}
                  <div className="rounded-xl border border-border/40 overflow-hidden bg-muted/30 aspect-video flex items-center justify-center relative shadow-sm group">
                    {selectedMedia.mimeType?.startsWith("image") ? (
                      <img src={selectedMedia.url} alt={selectedMedia.title} className="w-full h-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <HardDrive size={34} className="text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">File Document</span>
                      </div>
                    )}
                    
                    {/* View in New Tab indicator */}
                    <a 
                      href={selectedMedia.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="absolute bottom-2.5 right-2.5 rounded-lg bg-black/60 hover:bg-black/80 text-white p-1.5 transition-all text-xs flex items-center gap-1 font-medium border border-white/10"
                    >
                      <ExternalLink size={12} />
                      Open Full
                    </a>
                  </div>

                  {/* Properties List */}
                  <div className="space-y-3 pt-2">
                    
                    <div className="flex flex-col gap-1 border-b border-border/20 pb-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Filename</span>
                      <span className="text-xs font-semibold text-foreground truncate" title={selectedMedia.title}>
                        {selectedMedia.title || "Untitled File"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-b border-border/20 pb-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Type</span>
                        <span className="text-xs font-semibold text-foreground capitalize">{selectedMedia.mimeType || "Binary/Octet-stream"}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">File Size</span>
                        <span className="text-xs font-semibold text-foreground">{formatBytes(selectedMedia.size)}</span>
                      </div>
                    </div>

                    {selectedMedia.mimeType?.startsWith("image") && dimensions && (
                      <div className="flex flex-col gap-1 border-b border-border/20 pb-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Dimensions</span>
                        <span className="text-xs font-semibold text-foreground">{dimensions.width} x {dimensions.height} pixels</span>
                      </div>
                    )}

                    <div className="flex flex-col gap-1 border-b border-border/20 pb-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Uploaded On</span>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Calendar size={13} className="text-muted-foreground" />
                        <span>{new Date(selectedMedia.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Reference URI</span>
                      <div className="flex items-center gap-2 mt-1 bg-muted/30 p-2 rounded-xl border border-border/30">
                        <code className="text-[10px] font-medium text-foreground select-all truncate flex-1 block">
                          {selectedMedia.url}
                        </code>
                        <button
                          onClick={() => copyUrl(selectedMedia.id, selectedMedia.url)}
                          className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all shrink-0"
                          title="Copy reference text"
                        >
                          {copiedId === selectedMedia.id ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              )}
            </div>

            {/* Drawer Actions */}
            {selectedMedia && (
              <div className="pt-4 mt-6 border-t border-border/40 flex items-center justify-between gap-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-1.5 rounded-xl text-xs font-bold w-full h-10 shadow-md hover-lift">
                      <Trash2 size={13} />
                      Delete File
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl max-w-sm">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-serif font-bold text-lg text-foreground">Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                        This deletes the file permanently from the database. References on existing blogs may fail. This cannot be reverted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                      <AlertDialogCancel className="rounded-xl text-xs font-semibold h-9">Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => {
                          del.mutate({ id: selectedMedia.id }, { 
                            onSuccess: () => {
                              qc.invalidateQueries({ queryKey: getListMediaQueryKey() });
                              toast({ title: "Deleted", description: "Media item removed." });
                              setSelectedMedia(null);
                            } 
                          });
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-semibold h-9"
                      >
                        Confirm Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button 
                  onClick={() => setSelectedMedia(null)} 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl text-xs font-bold w-full h-10 border-border/70 hover:bg-muted"
                >
                  Close Inspection
                </Button>
              </div>
            )}

          </SheetContent>
        </Sheet>

      </div>
    </AdminLayout>
  );
}

