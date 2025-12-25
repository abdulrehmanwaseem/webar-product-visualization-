"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { api } from "@/lib/api";
import { Upload, X, Loader2 } from "lucide-react";

interface UploadedFile {
  url: string;
  name: string;
}

export default function NewItemPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [glbFile, setGlbFile] = useState<UploadedFile | null>(null);
  const [usdzFile, setUsdzFile] = useState<UploadedFile | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const uploadFile = async (
    file: File,
    fileType: "glb" | "usdz" | "thumbnail"
  ) => {
    setUploadProgress(`Uploading ${file.name}...`);
    const url = await api.upload.uploadFile(file, fileType);
    setUploadProgress(null);
    return { url, name: file.name };
  };

  const onGlbDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError("GLB file must be less than 15MB");
      return;
    }

    setIsUploading(true);
    setError("");
    try {
      const uploaded = await uploadFile(file, "glb");
      setGlbFile(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const onUsdzDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError("USDZ file must be less than 15MB");
      return;
    }

    setIsUploading(true);
    setError("");
    try {
      const uploaded = await uploadFile(file, "usdz");
      setUsdzFile(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const onThumbnailDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Thumbnail must be less than 2MB");
      return;
    }

    setIsUploading(true);
    setError("");
    try {
      const uploaded = await uploadFile(file, "thumbnail");
      setThumbnailFile(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const glbDropzone = useDropzone({
    onDrop: onGlbDrop,
    accept: { "model/gltf-binary": [".glb"] },
    maxFiles: 1,
    disabled: isUploading,
  });

  const usdzDropzone = useDropzone({
    onDrop: onUsdzDrop,
    accept: { "model/vnd.usdz+zip": [".usdz"] },
    maxFiles: 1,
    disabled: isUploading,
  });

  const thumbnailDropzone = useDropzone({
    onDrop: onThumbnailDrop,
    accept: { "image/*": [".webp", ".png", ".jpg", ".jpeg"] },
    maxFiles: 1,
    disabled: isUploading,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!glbFile) {
      setError("GLB file is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await api.items.create({
        name,
        description: description || undefined,
        modelUrl: glbFile.url,
        usdzUrl: usdzFile?.url,
        thumbnailUrl: thumbnailFile?.url,
      });
      router.push("/dashboard/items");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create item");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">Create New Item</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {uploadProgress && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          {uploadProgress}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Item Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Delicious Burger"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Optional description..."
          />
        </div>

        {/* GLB File */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            3D Model (GLB) *{" "}
            <span className="text-gray-500 font-normal">Max 15MB</span>
          </label>
          {glbFile ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <span className="flex-1 truncate">{glbFile.name}</span>
              <button
                type="button"
                onClick={() => setGlbFile(null)}
                className="p-1 hover:bg-green-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              {...glbDropzone.getRootProps()}
              className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition ${
                glbDropzone.isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...glbDropzone.getInputProps()} />
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">
                Drop GLB file here or click to browse
              </p>
            </div>
          )}
        </div>

        {/* USDZ File */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            iOS Model (USDZ){" "}
            <span className="text-gray-500 font-normal">
              Optional - Required for iOS AR
            </span>
          </label>
          {usdzFile ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <span className="flex-1 truncate">{usdzFile.name}</span>
              <button
                type="button"
                onClick={() => setUsdzFile(null)}
                className="p-1 hover:bg-green-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              {...usdzDropzone.getRootProps()}
              className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition ${
                usdzDropzone.isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...usdzDropzone.getInputProps()} />
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">
                Drop USDZ file here or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Without USDZ, iOS users will only see 3D view (no AR)
              </p>
            </div>
          )}
        </div>

        {/* Thumbnail */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Thumbnail{" "}
            <span className="text-gray-500 font-normal">
              Optional - Max 2MB
            </span>
          </label>
          {thumbnailFile ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <span className="flex-1 truncate">{thumbnailFile.name}</span>
              <button
                type="button"
                onClick={() => setThumbnailFile(null)}
                className="p-1 hover:bg-green-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              {...thumbnailDropzone.getRootProps()}
              className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition ${
                thumbnailDropzone.isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...thumbnailDropzone.getInputProps()} />
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">
                Drop image here or click to browse
              </p>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting || isUploading || !glbFile}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Create Item"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
