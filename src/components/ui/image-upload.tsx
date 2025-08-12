"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { supabaseStorage, KENNEL_WEBSITE_BUCKET } from "@/lib/supabase/storage";
import { useTranslation } from "react-i18next";

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  onUploadError: (error: string) => void;
  currentImageUrl?: string;
  bucket?: string;
  folder?: string;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
  showPreview?: boolean;
}

export default function ImageUpload({
  onUploadComplete,
  onUploadError,
  currentImageUrl,
  bucket = KENNEL_WEBSITE_BUCKET,
  folder = "general",
  maxSize = 5,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp"],
  className = "",
  showPreview = true,
}: ImageUploadProps) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (showPreview && currentImageUrl) setPreviewUrl(currentImageUrl);
    else if (!showPreview) setPreviewUrl(null);
  }, [currentImageUrl, showPreview]);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return t("upload.unsupportedType", "File type not supported. Please upload: {{types}}", { types: acceptedTypes.join(", ") }) as string;
    }
    if (file.size > maxSize * 1024 * 1024) {
      return t("upload.maxSize", "File size must be less than {{mb}}MB", { mb: maxSize }) as string;
    }
    return null;
  };

  const uploadFile = useCallback(
    async (file: File) => {
      try {
        setIsUploading(true);
        const fileExt = file.name.split(".").pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("path", fileName);
        const response = await fetch("/api/upload-image", { method: "POST", body: formData });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`${t("upload.failed", "Upload failed")}: ${response.status} - ${errorText}`);
        }
        const result = await response.json();
        const publicUrl = result.url;
        onUploadComplete(publicUrl);
        if (showPreview) setPreviewUrl(publicUrl);
      } catch (error) {
        console.error("Upload error:", error);
        onUploadError(error instanceof Error ? error.message : (t("upload.failed", "Upload failed") as string));
      } finally {
        setIsUploading(false);
      }
    },
    [folder, onUploadComplete, onUploadError, showPreview, t],
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) { onUploadError(validationError); return; }
      if (showPreview) {
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target?.result as string);
        reader.readAsDataURL(file);
      }
      uploadFile(file);
    },
    [onUploadError, showPreview, uploadFile],
  );

  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragActive(false); const files = Array.from(e.dataTransfer.files); if (files.length > 0) handleFileSelect(files[0]); }, [handleFileSelect]);
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragActive(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragActive(false); }, []);
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { const files = Array.from(e.target.files || []); if (files.length > 0) handleFileSelect(files[0]); }, [handleFileSelect]);

  const removeImage = () => { setPreviewUrl(null); onUploadComplete(""); };

  return (
    <div className={`space-y-4 ${className}`}>
      {showPreview && previewUrl && (
        <div className="relative">
          <img src={previewUrl} alt={t("upload.preview", "Preview")} className="w-full h-48 object-cover rounded-lg border" />
          <button onClick={removeImage} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"} ${isUploading ? "opacity-50 pointer-events-none" : ""}`} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
        <input type="file" accept={acceptedTypes.join(",")} onChange={handleFileInput} className="hidden" id="image-upload" disabled={isUploading} />
        <label htmlFor="image-upload" className="cursor-pointer">
          <div className="flex flex-col items-center space-y-2">
            {isUploading ? (<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>) : (<Upload className="h-8 w-8 text-gray-400" />)}
            <div>
              <p className="text-sm font-medium text-gray-700">{isUploading ? t("upload.uploading", "Uploading...") : t("upload.clickOrDrag", "Click to upload or drag and drop")}</p>
              <p className="text-xs text-gray-500 mt-1">{acceptedTypes.join(", ")} {t("upload.upTo", "up to")} {maxSize}MB</p>
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
