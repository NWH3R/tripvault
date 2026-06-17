"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { Photo } from "@/lib/types";

interface PhotoGalleryProps {
  tripId: string;
}

interface PhotoWithUrl extends Photo {
  publicUrl: string;
}

export default function PhotoGallery({ tripId }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<PhotoWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<PhotoWithUrl | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("photos")
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: true });

      if (data) {
        setPhotos(
          data.map((p) => ({
            ...p,
            publicUrl: supabase.storage
              .from("trip-photos")
              .getPublicUrl(p.storage_path).data.publicUrl,
          }))
        );
      }
      setLoading(false);
    }
    load();
  }, [tripId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <svg
          className="animate-spin h-8 w-8 text-indigo-400"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  if (!photos.length) {
    return (
      <div className="text-center py-16 text-white/30">
        <div className="text-5xl mb-3">📭</div>
        <p className="font-medium">No photos were uploaded for this trip.</p>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-white/35 mb-4 font-medium">
        {photos.length} {photos.length === 1 ? "photo" : "photos"} from this
        trip
      </p>

      <motion.div
        className="columns-2 sm:columns-3 gap-3 space-y-3"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.07 } },
        }}
      >
        {photos.map((photo) => (
          <motion.div
            key={photo.id}
            variants={{
              hidden: { opacity: 0, y: 20, scale: 0.95 },
              visible: { opacity: 1, y: 0, scale: 1 },
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            whileHover={{ scale: 1.02 }}
            className="break-inside-avoid rounded-2xl overflow-hidden cursor-pointer bg-white/5 border border-white/10"
            onClick={() => setLightbox(photo)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.publicUrl}
              alt={`Photo by ${photo.uploaded_by_name ?? "Anonymous"}`}
              className="w-full h-auto object-cover"
              loading="lazy"
            />
            {photo.uploaded_by_name && (
              <div className="px-3 py-2">
                <p className="text-xs font-medium text-white/35">
                  📸 {photo.uploaded_by_name}
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-2xl w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightbox.publicUrl}
                alt=""
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
              {lightbox.uploaded_by_name && (
                <p className="text-white/50 text-center mt-3 font-medium">
                  📸 {lightbox.uploaded_by_name}
                </p>
              )}
            </motion.div>
            <button
              onClick={() => setLightbox(null)}
              className="fixed top-5 right-5 text-white/50 hover:text-white text-3xl leading-none transition-colors"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
