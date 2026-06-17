"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface PhotoUploadProps {
  tripId: string;
  onUploadComplete: () => void;
}

type UploadStatus = "pending" | "uploading" | "done" | "error";

interface UploadFile {
  file: File;
  status: UploadStatus;
  error?: string;
}

interface MyPhoto {
  id: string;
  storagePath: string;
  publicUrl: string;
}

const localKey = (tripId: string) => `tripvault_uploads_${tripId}`;

function loadMyPhotos(tripId: string): MyPhoto[] {
  try {
    return JSON.parse(localStorage.getItem(localKey(tripId)) ?? "[]");
  } catch {
    return [];
  }
}

function saveMyPhotos(tripId: string, photos: MyPhoto[]) {
  localStorage.setItem(localKey(tripId), JSON.stringify(photos));
}

export default function PhotoUpload({
  tripId,
  onUploadComplete,
}: PhotoUploadProps) {
  const [uploaderName, setUploaderName] = useState("");
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [myPhotos, setMyPhotos] = useState<MyPhoto[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = loadMyPhotos(tripId);
    if (stored.length === 0) {
      setMyPhotos([]);
      return;
    }
    supabase
      .from("photos")
      .select("id")
      .in("id", stored.map((p) => p.id))
      .then(({ data }) => {
        const alive = new Set((data ?? []).map((p: { id: string }) => p.id));
        const valid = stored.filter((p) => alive.has(p.id));
        if (valid.length !== stored.length) saveMyPhotos(tripId, valid);
        setMyPhotos(valid);
      });
  }, [tripId]);

  const addFiles = useCallback((incoming: File[]) => {
    const images = incoming.filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [
      ...prev,
      ...images.map((file) => ({ file, status: "pending" as const })),
    ]);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const uploadAll = async () => {
    const pending = files.filter((f) => f.status === "pending");
    if (!pending.length) return;

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== "pending") continue;

      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: "uploading" } : f
        )
      );

      try {
        const file = files[i].file;
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${tripId}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;

        console.log("[PhotoUpload] Uploading:", {
          name: file.name,
          type: file.type,
          size: file.size,
          bucket: "trip-photos",
          path,
        });

        const { error: storageErr } = await supabase.storage
          .from("trip-photos")
          .upload(path, file, {
            cacheControl: "3600",
            contentType: file.type || "image/jpeg",
          });

        if (storageErr) {
          console.error("[PhotoUpload] Storage error:", storageErr);
          throw storageErr;
        }

        const { data: inserted, error: dbErr } = await supabase
          .from("photos")
          .insert({
            trip_id: tripId,
            storage_path: path,
            uploaded_by_name: uploaderName.trim() || null,
          })
          .select("id")
          .single();

        if (dbErr) {
          console.error("[PhotoUpload] DB insert error:", dbErr);
          throw dbErr;
        }

        const publicUrl = supabase.storage
          .from("trip-photos")
          .getPublicUrl(path).data.publicUrl;

        const newPhoto: MyPhoto = { id: inserted.id, storagePath: path, publicUrl };
        setMyPhotos((prev) => {
          const updated = [...prev, newPhoto];
          saveMyPhotos(tripId, updated);
          return updated;
        });

        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "done" } : f
          )
        );
      } catch (err) {
        console.error("[PhotoUpload] Upload failed for file:", files[i].file.name, err);
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "error", error: "Upload failed" } : f
          )
        );
      }
    }

    setIsUploading(false);
    setShowSuccess(true);
    onUploadComplete();
    setTimeout(() => {
      setFiles([]);
      setShowSuccess(false);
    }, 3000);
  };

  const deletePhoto = async (photo: MyPhoto) => {
    setDeletingId(photo.id);

    try {
      const { error: storageErr } = await supabase.storage
        .from("trip-photos")
        .remove([photo.storagePath]);

      if (storageErr) {
        console.error("[PhotoUpload] Storage delete error:", storageErr);
      }

      const { error: dbErr } = await supabase
        .from("photos")
        .delete()
        .eq("id", photo.id);

      if (dbErr) {
        console.error("[PhotoUpload] DB delete error:", dbErr);
      } else {
        setMyPhotos((prev) => {
          const updated = prev.filter((p) => p.id !== photo.id);
          saveMyPhotos(tripId, updated);
          return updated;
        });
      }
    } finally {
      setDeletingId(null);
      onUploadComplete();
    }
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const doneCount = files.filter((f) => f.status === "done").length;

  return (
    <div className="space-y-4">
      {/* Name field */}
      <input
        type="text"
        value={uploaderName}
        onChange={(e) => setUploaderName(e.target.value)}
        placeholder="Your name (optional)"
        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/25 focus:border-indigo-500 focus:outline-none transition-colors"
      />

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-indigo-400 bg-indigo-500/10 scale-[1.02]"
            : "border-white/15 bg-white/3 hover:bg-white/5 hover:border-white/25"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="text-4xl mb-3 select-none">
          {isDragging ? "📂" : "📷"}
        </div>
        <p className="font-semibold text-white/60">
          {isDragging ? "Drop photos here!" : "Tap to add photos"}
        </p>
        <p className="text-sm text-white/30 mt-1">
          or drag and drop · JPG, PNG, HEIC
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {files.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
            >
              <div className="text-xl shrink-0">
                {f.status === "done" ? (
                  "✅"
                ) : f.status === "error" ? (
                  "❌"
                ) : f.status === "uploading" ? (
                  <svg
                    className="animate-spin h-5 w-5 text-indigo-400"
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
                ) : (
                  "🖼️"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/60 truncate">
                  {f.file.name}
                </p>
                {f.error && (
                  <p className="text-xs text-red-400">{f.error}</p>
                )}
              </div>
              {f.status === "pending" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="text-white/25 hover:text-red-400 transition-colors text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {isUploading && files.length > 0 && (
        <div className="bg-white/10 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${(doneCount / files.length) * 100}%` }}
          />
        </div>
      )}

      {/* Success */}
      {showSuccess && (
        <div className="bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl px-4 py-3 text-center font-semibold text-sm">
          🎉 Photos uploaded! They&apos;ll be revealed on unlock day.
        </div>
      )}

      {/* Upload button */}
      {pendingCount > 0 && (
        <motion.button
          onClick={uploadAll}
          disabled={isUploading}
          whileHover={!isUploading ? { scale: 1.05 } : {}}
          whileTap={!isUploading ? { scale: 0.97 } : {}}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isUploading
            ? `Uploading ${doneCount + 1}/${files.length}…`
            : `Upload ${pendingCount} Photo${pendingCount !== 1 ? "s" : ""} 🚀`}
        </motion.button>
      )}

      {/* Your uploads */}
      {myPhotos.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2">
            Your uploads
          </p>
          <div className="grid grid-cols-4 gap-2">
            {myPhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative group aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.publicUrl}
                  alt="Your upload"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => deletePhoto(photo)}
                  disabled={deletingId === photo.id}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white/70 hover:text-white hover:bg-red-600/80 text-xs flex items-center justify-center transition-all duration-150 disabled:opacity-50"
                  aria-label="Delete photo"
                >
                  {deletingId === photo.id ? (
                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    "✕"
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
