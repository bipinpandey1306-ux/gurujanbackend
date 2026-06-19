import { useEffect, useState } from "react";
import { useListAlbums, useTrackPageView } from "@workspace/api-client-react";
import type { Album } from "@workspace/api-client-react";
import PublicLayout from "@/components/public/PublicLayout";
import { X, ChevronLeft, ChevronRight, Image } from "lucide-react";

export default function GalleryPage() {
  const track = useTrackPageView();
  const { data, isLoading } = useListAlbums();
  const albums = (data ?? []) as Album[];

  const [lightbox, setLightbox] = useState<{ photos: any[]; index: number } | null>(null);

  useEffect(() => {
    track.mutate({ data: { path: "/gallery" } });
  }, []);

  const openLightbox = (photos: any[], index: number) => setLightbox({ photos, index });
  const closeLightbox = () => setLightbox(null);
  const prevPhoto = () => setLightbox((l) => l ? { ...l, index: (l.index - 1 + l.photos.length) % l.photos.length } : null);
  const nextPhoto = () => setLightbox((l) => l ? { ...l, index: (l.index + 1) % l.photos.length } : null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!lightbox) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevPhoto();
      if (e.key === "ArrowRight") nextPhoto();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox]);

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="font-serif text-4xl font-semibold text-foreground mb-3">Gallery</h1>
          <p className="text-muted-foreground">Moments captured along the way.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : albums.length === 0 ? (
          <div className="text-center py-24">
            <Image size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="font-serif text-xl text-foreground mb-2">No albums yet</p>
          </div>
        ) : (
          <div className="space-y-16">
            {albums.map((album) => (
              <div key={album.id}>
                <div className="flex items-end gap-4 mb-5">
                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-foreground">{album.name}</h2>
                    {album.description && (
                      <p className="text-muted-foreground text-sm mt-1">{album.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground mb-1">
                    {album.photoCount ?? (album.photos?.length ?? 0)} photos
                  </span>
                </div>
                {album.photos && album.photos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {album.photos.map((photo, idx) => (
                      <button
                        key={photo.id}
                        onClick={() => openLightbox(album.photos!, idx)}
                        className="aspect-square rounded-lg overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption ?? ""}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="h-32 rounded-xl bg-muted/40 border border-dashed border-border flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">No photos in this album</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={closeLightbox}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white" onClick={closeLightbox}>
            <X size={28} />
          </button>

          {lightbox.photos.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2"
                onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
              >
                <ChevronLeft size={36} />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2"
                onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
              >
                <ChevronRight size={36} />
              </button>
            </>
          )}

          <div className="max-w-4xl max-h-screen p-16 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox.photos[lightbox.index].url}
              alt={lightbox.photos[lightbox.index].caption ?? ""}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
            />
            {lightbox.photos[lightbox.index].caption && (
              <p className="text-white/70 text-sm mt-4 text-center">{lightbox.photos[lightbox.index].caption}</p>
            )}
            <p className="text-white/40 text-xs mt-2">
              {lightbox.index + 1} / {lightbox.photos.length}
            </p>
          </div>
        </div>
      )}
    </PublicLayout>
  );
}
