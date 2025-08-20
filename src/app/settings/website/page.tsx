"use client";

import React, { useState, useEffect } from "react";
import ImageUpload from "@/components/ui/image-upload";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  Trash2,
  Star,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  User,
  Upload,
} from "lucide-react";
import ClientLayout from "@/app/components/ClientLayout";
import { useTranslation } from "react-i18next";

interface KennelWebsite {
  id?: string;
  cover_photo_url?: string | null;
  hero_title?: string | null;
  hero_tagline?: string | null;
  about_story?: string | null;
  subdomain?: string;
  allow_direct_booking?: boolean;
  theme_color?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_image_url?: string | null;
  address?: string | null;
  map_embed_url?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  contact_whatsapp?: string | null;
  contact_social?: any;
  special_restrictions?: string | null;
}

interface GalleryImage {
  id?: string;
  image_url: string;
  caption?: string;
  sort_order: number;
}

interface Video {
  id?: string;
  video_url: string;
  title?: string;
  description?: string;
  sort_order: number;
}

interface Testimonial {
  id?: string;
  customer_name: string;
  customer_photo_url?: string;
  rating: number;
  testimonial_text: string;
  sort_order: number;
}

interface FAQ {
  id?: string;
  question: string;
  answer: string;
  sort_order: number;
}

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export default function WebsiteSettingsPage() {
  const { t } = useTranslation();
  const [planInfo, setPlanInfo] = useState<any | null>(null);
  const [websiteData, setWebsiteData] = useState<KennelWebsite>({});
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Fetch current website data
  useEffect(() => {
    fetch("/api/plan")
      .then((r) => r.json())
      .then(setPlanInfo)
      .catch(() => {});
    console.log("useEffect triggered - fetching website data");
    fetchWebsiteData();
  }, []);

  const resolveTenantId = async (): Promise<string | null> => {
    try {
      // Always prefer server truth to avoid stale localStorage
      const res = await fetch("/api/tenants/current");
      if (res.ok) {
        const data = await res.json();
        const current = data?.id || null;
        if (current && current !== DEFAULT_TENANT_ID && current.length === 36) {
          const stored = localStorage.getItem("tenantId");
          if (stored !== current) {
            console.log("Updating localStorage tenantId to current:", current);
            localStorage.setItem("tenantId", current);
          }
          return current;
        }
      } else {
        console.warn("/api/tenants/current request failed:", res.status);
      }
      // Fallback to localStorage only if server lookup failed
      const fallback = localStorage.getItem("tenantId");
      if (
        fallback &&
        fallback !== DEFAULT_TENANT_ID &&
        fallback.length === 36
      ) {
        return fallback;
      }
      return null;
    } catch (e) {
      console.error("resolveTenantId error:", e);
      const fallback = localStorage.getItem("tenantId");
      return fallback &&
        fallback !== DEFAULT_TENANT_ID &&
        fallback.length === 36
        ? fallback
        : null;
    }
  };

  const fetchWebsiteData = async () => {
    try {
      setIsLoading(true);
      // Resolve tenant first
      const tenantId = await resolveTenantId();
      console.log("Fetching website data with resolved tenantId:", tenantId);
      if (!tenantId) {
        toast({
          title: t("toastErrorTitle", "Error"),
          description: t("website.noTenantId", "No tenant ID found"),
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Request with resolved tenant header (authoritative), API will also fall back to auth if missing
      const response = await fetch("/api/kennel-website", {
        headers: { "x-tenant-id": tenantId },
      });

      console.log("Fetch response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Fetch result:", result);

        if (result.data) {
          setWebsiteData(result.data);
        } else {
          console.log("No website data found for tenant");
          setWebsiteData({});
        }

        if (result.galleryImages) setGalleryImages(result.galleryImages);
        if (result.videos) {
          const mappedVideos = result.videos.map((video: any) => ({
            id: video.id,
            video_url: video.video_url || "",
            title: video.caption || "",
            description: "",
            sort_order: video.sort_order || 0,
          }));
          setVideos(mappedVideos);
        }
        if (result.testimonials) {
          const mappedTestimonials = result.testimonials.map((t: any) => ({
            id: t.id,
            customer_name: t.author_name || "",
            customer_photo_url: t.author_photo || "",
            rating: 5,
            testimonial_text: t.text || "",
            sort_order: t.sort_order || 0,
          }));
          setTestimonials(mappedTestimonials);
        }
        if (result.faqs) setFaqs(result.faqs);
      } else {
        console.error("Fetch failed with status:", response.status);
      }
    } catch (error) {
      console.error("Error fetching website data:", error);
      toast({
        title: t("toastErrorTitle", "Error"),
        description: t("website.loadFailed", "Failed to load website data"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveWebsiteData = async (data: Partial<KennelWebsite>) => {
    try {
      setIsSaving(true);

      // Get tenant ID from context or localStorage
      let tenantId = localStorage.getItem("tenantId");

      // If not in localStorage, try to get from current tenant context
      if (!tenantId) {
        try {
          const response = await fetch("/api/tenants/current");
          if (response.ok) {
            const tenantData = await response.json();
            tenantId = tenantData.id; // API returns 'id', not 'tenant_id'
          }
        } catch (error) {
          console.error("Failed to get current tenant:", error);
        }
      }

      console.log("Saving website data...", { tenantId, data });

      if (!tenantId) {
        toast({
          title: t("toastErrorTitle", "Error"),
          description: t(
            "website.noTenantId",
            "No tenant ID found. Please refresh the page.",
          ),
          variant: "destructive",
        });
        return;
      }

      // Prepare all data to send
      const allData = {
        ...data,
        galleryImages,
        videos,
        testimonials,
        faqs,
      };

      console.log("Sending data to API:", allData);

      const response = await fetch("/api/kennel-website", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify(allData),
      });

      console.log("API response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("API response data:", result);
        setWebsiteData(result.data);
        toast({
          title: t("toastSuccessTitle", "Success"),
          description: t(
            "website.saveSuccess",
            "Website settings saved successfully",
          ),
        });
      } else {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`Failed to save: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error("Error saving website data:", error);
      toast({
        title: t("toastErrorTitle", "Error"),
        description: `${t("website.saveFailed", "Failed to save website settings")}: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCoverPhotoUpload = (url: string) => {
    const updatedData = { ...websiteData, cover_photo_url: url };
    setWebsiteData(updatedData);
    // Don't auto-save on upload - only on manual save button
  };

  const handleCoverPhotoError = (error: string) => {
    toast({
      title: t("toastErrorTitle", "Upload Error"),
      description: error,
      variant: "destructive",
    });
  };

  const handleHeroTextChange = (
    field: "hero_title" | "hero_tagline",
    value: string,
  ) => {
    const updatedData = { ...websiteData, [field]: value };
    setWebsiteData(updatedData);
    // Don't auto-save on every field change - only on manual save button
  };

  const handleFieldChange = (field: keyof KennelWebsite, value: any) => {
    const updatedData = { ...websiteData, [field]: value };
    setWebsiteData(updatedData);

    // Don't auto-save on every field change - only on manual save button
  };

  const updateSubdomain = async (newSubdomain: string) => {
    try {
      // Get tenant ID from localStorage
      const tenantId = localStorage.getItem("tenantId");
      if (!tenantId) {
        toast({
          title: t("toastErrorTitle", "Error"),
          description: t("website.noTenantId", "No tenant ID found"),
          variant: "destructive",
        });
        return;
      }

      // Validate subdomain format
      if (!newSubdomain || newSubdomain.trim() === "") {
        toast({
          title: t("toastErrorTitle", "Error"),
          description: t("website.subdomainEmpty", "Subdomain cannot be empty"),
          variant: "destructive",
        });
        return;
      }

      // Check for valid characters (letters, numbers, hyphens only)
      if (!/^[a-z0-9-]+$/.test(newSubdomain)) {
        toast({
          title: t("toastErrorTitle", "Error"),
          description: t(
            "website.subdomainChars",
            "Subdomain can only contain lowercase letters, numbers, and hyphens",
          ),
          variant: "destructive",
        });
        return;
      }

      // Check length
      if (newSubdomain.length < 3 || newSubdomain.length > 63) {
        toast({
          title: t("toastErrorTitle", "Error"),
          description: t(
            "website.subdomainLength",
            "Subdomain must be between 3 and 63 characters",
          ),
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/tenants/update-subdomain", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({ subdomain: newSubdomain }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: t("toastErrorTitle", "Error"),
          description:
            error.error ||
            t("website.subdomainUpdateFailed", "Failed to update subdomain"),
          variant: "destructive",
        });
        // Revert the change
        setWebsiteData((prev) => ({ ...prev, subdomain: prev.subdomain }));
      } else {
        // Update the local state to reflect the change
        setWebsiteData((prev) => ({ ...prev, subdomain: newSubdomain }));
        toast({
          title: t("toastSuccessTitle", "Success"),
          description: t(
            "website.subdomainUpdated",
            "Subdomain updated successfully",
          ),
        });
        // Refresh the website data to ensure consistency
        fetchWebsiteData();
      }
    } catch (error) {
      console.error("Error updating subdomain:", error);
      toast({
        title: t("toastErrorTitle", "Error"),
        description: t(
          "website.subdomainUpdateFailed",
          "Failed to update subdomain",
        ),
        variant: "destructive",
      });
      // Revert the change
      setWebsiteData((prev) => ({ ...prev, subdomain: prev.subdomain }));
    }
  };

  // Gallery Functions
  const addGalleryImage = (imageUrl: string) => {
    console.log("addGalleryImage called with:", imageUrl);
    const newImage: GalleryImage = {
      image_url: imageUrl,
      caption: "",
      sort_order: galleryImages.length,
    };
    setGalleryImages([...galleryImages, newImage]);
    console.log("Gallery image added:", imageUrl);
  };

  const handleGalleryUploadError = (error: string) => {
    console.log("Gallery upload error:", error);
    toast({
      title: t("toastErrorTitle", "Upload Error"),
      description: error,
      variant: "destructive",
    });
  };

  const handleGalleryFileUpload = async (file: File) => {
    try {
      console.log("Handling gallery file upload:", file.name);

      // Validate file
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        handleGalleryUploadError(
          t("website.fileSizeError", "File size must be less than 5MB"),
        );
        return;
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        handleGalleryUploadError(
          t(
            "website.fileTypeError",
            "Only JPEG, PNG, and WebP files are allowed",
          ),
        );
        return;
      }

      // Upload file
      const formData = new FormData();
      formData.append("file", file);

      // Generate unique filename for gallery
      const fileExt = file.name.split(".").pop();
      const fileName = `gallery/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      formData.append("path", fileName);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || t("website.uploadFailed", "Upload failed"),
        );
      }

      const result = await response.json();
      const publicUrl = result.url;

      console.log("Gallery upload successful:", publicUrl);

      // Add to gallery
      addGalleryImage(publicUrl);
    } catch (error) {
      console.error("Gallery upload error:", error);
      handleGalleryUploadError(
        error instanceof Error
          ? error.message
          : t("website.uploadFailed", "Upload failed"),
      );
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== index));
  };

  const updateGalleryImage = (
    index: number,
    field: keyof GalleryImage,
    value: any,
  ) => {
    const updated = [...galleryImages];
    updated[index] = { ...updated[index], [field]: value };
    setGalleryImages(updated);
  };

  // Video Functions
  const addVideo = () => {
    const newVideo: Video = {
      video_url: "",
      title: "",
      description: "",
      sort_order: videos.length,
    };
    setVideos([...videos, newVideo]);
  };

  const removeVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
  };

  const updateVideo = (index: number, field: keyof Video, value: any) => {
    const updated = [...videos];
    updated[index] = { ...updated[index], [field]: value };
    setVideos(updated);
  };

  // Testimonial Functions
  const addTestimonial = () => {
    const newTestimonial: Testimonial = {
      customer_name: "",
      customer_photo_url: "",
      rating: 5,
      testimonial_text: "",
      sort_order: testimonials.length,
    };
    setTestimonials([...testimonials, newTestimonial]);
  };

  const removeTestimonial = (index: number) => {
    setTestimonials(testimonials.filter((_, i) => i !== index));
  };

  const updateTestimonial = (
    index: number,
    field: keyof Testimonial,
    value: any,
  ) => {
    const updated = [...testimonials];
    updated[index] = { ...updated[index], [field]: value };
    setTestimonials(updated);
  };

  const handleTestimonialPhotoUpload = async (file: File, index: number) => {
    try {
      console.log("Handling testimonial photo upload:", file.name);

      // Validate file
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast({
          title: t("toastErrorTitle", "Upload Error"),
          description: t(
            "website.testimonialFileSizeError",
            "File size must be less than 5MB",
          ),
          variant: "destructive",
        });
        return;
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: t("toastErrorTitle", "Upload Error"),
          description: t(
            "website.testimonialFileTypeError",
            "Only JPEG, PNG, and WebP files are allowed",
          ),
          variant: "destructive",
        });
        return;
      }

      // Upload file
      const formData = new FormData();
      formData.append("file", file);

      // Generate unique filename for testimonial photos
      const fileExt = file.name.split(".").pop();
      const fileName = `testimonials/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      formData.append("path", fileName);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: t("toastErrorTitle", "Upload Error"),
          description:
            error.error ||
            t("website.testimonialUploadFailed", "Failed to upload image"),
          variant: "destructive",
        });
        return;
      }

      const result = await response.json();
      console.log("Testimonial photo uploaded:", result.url);

      // Update the testimonial with the new photo URL
      updateTestimonial(index, "customer_photo_url", result.url);

      toast({
        title: t("toastSuccessTitle", "Success"),
        description: t(
          "website.testimonialPhotoUploadSuccess",
          "Photo uploaded successfully",
        ),
      });
    } catch (error) {
      console.error("Error uploading testimonial photo:", error);
      toast({
        title: t("toastErrorTitle", "Upload Error"),
        description: t(
          "website.testimonialUploadFailed",
          "Failed to upload photo",
        ),
        variant: "destructive",
      });
    }
  };

  // FAQ Functions
  const addFAQ = () => {
    const newFAQ: FAQ = {
      question: "",
      answer: "",
      sort_order: faqs.length,
    };
    setFaqs([...faqs, newFAQ]);
  };

  const removeFAQ = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const updateFAQ = (index: number, field: keyof FAQ, value: any) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], [field]: value };
    setFaqs(updated);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="space-y-8">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ClientLayout>
      <div className="max-w-3xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-8">
          {t("website.settingsTitle", "Website Settings")}
        </h1>

        <div className="space-y-8">
          {/* Website URL Section */}
          <section className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">
              {t("website.urlSection", "Website URL")}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("website.yourWebsiteUrl", "Your Website URL")}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={websiteData.subdomain || ""}
                    onChange={(e) =>
                      handleFieldChange("subdomain", e.target.value)
                    }
                    placeholder="your-kennel-name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-gray-500">.zanav.io</span>
                  <button
                    onClick={() => updateSubdomain(websiteData.subdomain || "")}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {t("save", "Save")}
                  </button>
                </div>
                {planInfo &&
                  planInfo.effectiveTier !== "trial" &&
                  !planInfo.limits?.features?.customDomain && (
                    <div className="mt-3 p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-sm">
                      {t(
                        "website.customDomainUpgrade",
                        "Custom domain is a Pro feature. Upgrade to connect your own domain.",
                      )}
                    </div>
                  )}
                <p className="text-sm text-gray-500 mt-1">
                  {t(
                    "website.urlHelp",
                    "This is your unique subdomain. Your website will be available at",
                  )}
                  <span className="font-mono text-blue-600">
                    {websiteData.subdomain || "your-subdomain"}.zanav.io
                  </span>
                </p>
                {websiteData.subdomain && (
                  <div className="mt-2">
                    <a
                      href={`https://${websiteData.subdomain}.zanav.io`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      🌐 {t("website.viewWebsite", "View Your Website")}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Cover Photo & Hero Section */}
          <section className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">
              {t("website.coverHero", "Cover Photo & Hero")}
            </h2>

            <div className="space-y-6">
              {/* Cover Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("website.coverPhoto", "Cover Photo")}
                </label>
                <p className="text-sm text-gray-500 mb-4">
                  {t(
                    "website.coverHelp",
                    "This will be the main image displayed at the top of your website. Recommended size: 1920x1080px.",
                  )}
                </p>
                <ImageUpload
                  onUploadComplete={handleCoverPhotoUpload}
                  onUploadError={handleCoverPhotoError}
                  currentImageUrl={websiteData.cover_photo_url || undefined}
                  folder="cover-photos"
                  maxSize={10}
                  className="max-w-md"
                />
              </div>

              {/* Hero Title */}
              <div>
                <label
                  htmlFor="hero_title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("website.heroTitle", "Hero Title")}
                </label>
                <input
                  type="text"
                  id="hero_title"
                  value={websiteData.hero_title || ""}
                  onChange={(e) =>
                    handleHeroTextChange("hero_title", e.target.value)
                  }
                  placeholder={
                    t(
                      "website.heroTitlePH",
                      "Welcome to [Your Kennel Name]",
                    ) as string
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {t(
                    "website.heroTitleHelp",
                    "This will appear as the main heading on your website.",
                  )}
                </p>
              </div>

              {/* Hero Tagline */}
              <div>
                <label
                  htmlFor="hero_tagline"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("website.heroTagline", "Hero Tagline")}
                </label>
                <input
                  type="text"
                  id="hero_tagline"
                  value={websiteData.hero_tagline || ""}
                  onChange={(e) =>
                    handleHeroTextChange("hero_tagline", e.target.value)
                  }
                  placeholder={
                    t(
                      "website.heroTaglinePH",
                      "Where your furry friends feel at home",
                    ) as string
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {t(
                    "website.heroTaglineHelp",
                    "A short, catchy description that appears below the title.",
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* Kennel Story Section */}
          <section className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">
              {t("website.aboutTitle", "About Our Kennel")}
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                {t(
                  "website.aboutHelp",
                  "Tell your kennel's story and introduce yourself to potential customers. This will appear right after the main image on your website.",
                )}
              </p>
              <div>
                <label
                  htmlFor="about_story"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t("website.aboutLabel", "Kennel Story & Introduction")}
                </label>
                <textarea
                  id="about_story"
                  value={websiteData.about_story || ""}
                  onChange={(e) =>
                    handleFieldChange("about_story", e.target.value)
                  }
                  placeholder={
                    t(
                      "website.aboutPH",
                      "Share your kennel's story, your experience, what makes you special, and why pet owners should trust you with their beloved pets...",
                    ) as string
                  }
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {t(
                    "website.aboutHelp2",
                    "This is your chance to build trust and connect with potential customers. Share your passion, experience, and what makes your kennel unique.",
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* Image Gallery Section */}
          <section className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">
              {t("website.galleryTitle", "Image Gallery")}
            </h2>

            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                {t(
                  "website.galleryHelp",
                  "Upload images to showcase your kennel facilities and happy dogs.",
                )}
              </p>

              {/* Gallery Images Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {galleryImages.map((image, index) => (
                  <div
                    key={index}
                    className="border rounded-lg overflow-hidden bg-gray-50"
                  >
                    <div className="relative">
                      <img
                        src={image.image_url}
                        alt={`Gallery image ${index + 1}`}
                        className="w-full h-48 object-cover"
                        onLoad={() =>
                          console.log("Gallery image loaded:", image.image_url)
                        }
                        onError={(e) =>
                          console.error(
                            "Gallery image failed to load:",
                            image.image_url,
                            e,
                          )
                        }
                      />
                      <button
                        onClick={() => removeGalleryImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="p-3">
                      <input
                        type="text"
                        placeholder={
                          t(
                            "website.imageCaptionPH",
                            "Image caption (optional)",
                          ) as string
                        }
                        value={image.caption || ""}
                        onChange={(e) =>
                          updateGalleryImage(index, "caption", e.target.value)
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                ))}

                {/* Gallery Upload Preview Boxes */}
                {Array.from(
                  { length: 6 - galleryImages.length },
                  (_, index) => (
                    <div
                      key={`upload-${index}`}
                      className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center h-48"
                    >
                      <div className="text-center">
                        <div className="mb-2">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <div className="text-sm text-gray-600">
                          <label
                            htmlFor={`gallery-upload-${index}`}
                            className="cursor-pointer"
                          >
                            <span className="font-medium text-blue-600 hover:text-blue-500">
                              {t(
                                "website.upload.clickOrDrag",
                                "Click to upload or drag and drop",
                              )}
                            </span>
                            <span className="text-gray-500">
                              {" "}
                              {t("website.orDrag", "or drag and drop")}
                            </span>
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            {t(
                              "website.pngJpgWebp",
                              "PNG, JPG, WEBP up to 5MB",
                            )}
                          </p>
                        </div>
                        <input
                          id={`gallery-upload-${index}`}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              console.log("Gallery file selected:", file.name);
                              handleGalleryFileUpload(file);
                            }
                          }}
                          className="hidden"
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </section>

          {/* Video Gallery Section */}
          <section className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">
              {t("website.videoTitle", "Video Gallery")}
            </h2>

            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                {t(
                  "website.videoHelp",
                  "Add YouTube or Vimeo video links to showcase your kennel in action.",
                )}
              </p>

              {/* Videos */}
              <div className="space-y-4">
                {videos.map((video, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">
                        {
                          t("website.videoItem", {
                            defaultValue: "Video {{num}}",
                            num: index + 1,
                          }) as unknown as string
                        }
                      </h4>
                      <button
                        onClick={() => removeVideo(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    <input
                      type="url"
                      placeholder={
                        t(
                          "website.videoUrlPH",
                          "Video URL (YouTube/Vimeo)",
                        ) as string
                      }
                      value={video.video_url}
                      onChange={(e) =>
                        updateVideo(index, "video_url", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    <input
                      type="text"
                      placeholder={
                        t(
                          "website.videoTitlePH",
                          "Video title (optional)",
                        ) as string
                      }
                      value={video.title || ""}
                      onChange={(e) =>
                        updateVideo(index, "title", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    <textarea
                      placeholder={
                        t(
                          "website.videoDescPH",
                          "Video description (optional)",
                        ) as string
                      }
                      value={video.description || ""}
                      onChange={(e) =>
                        updateVideo(index, "description", e.target.value)
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>

              {/* Add Video Button */}
              <button
                onClick={addVideo}
                className="flex items-center justify-center w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                {t("website.addVideo", "Add Video")}
              </button>
            </div>
          </section>

          {/* Testimonials Section */}
          <section className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">
              {t("website.testimonialsTitle", "Testimonials")}
            </h2>

            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                {t(
                  "website.testimonialsHelp",
                  "Add customer testimonials to build trust with potential clients.",
                )}
              </p>

              {/* Testimonials */}
              <div className="space-y-4">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">
                        {
                          t("website.testimonialItem", {
                            defaultValue: "Testimonial {{num}}",
                            num: index + 1,
                          }) as unknown as string
                        }
                      </h4>
                      <button
                        onClick={() => removeTestimonial(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder={
                        t("website.customerNamePH", "Customer name") as string
                      }
                      value={testimonial.customer_name}
                      onChange={(e) =>
                        updateTestimonial(
                          index,
                          "customer_name",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    {/* Customer Photo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("website.customerPhoto", "Customer Photo")}
                      </label>
                      <div className="flex items-center space-x-4">
                        {testimonial.customer_photo_url ? (
                          <div className="relative">
                            <img
                              src={testimonial.customer_photo_url}
                              alt="Customer photo"
                              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                            />
                            <button
                              onClick={() =>
                                updateTestimonial(
                                  index,
                                  "customer_photo_url",
                                  "",
                                )
                              }
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="h-8 w-8 text-gray-400" />
                          </div>
                        )}

                        <div className="flex-1">
                          <label
                            htmlFor={`testimonial-photo-upload-${index}`}
                            className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {testimonial.customer_photo_url
                              ? t("website.changePhoto", "Change Photo")
                              : t("website.uploadPhoto", "Upload Photo")}
                          </label>
                          <input
                            id={`testimonial-photo-upload-${index}`}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleTestimonialPhotoUpload(file, index);
                              }
                            }}
                            className="hidden"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {t(
                              "website.pngJpgWebp",
                              "PNG, JPG, WEBP up to 5MB",
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("website.rating", "Rating")}
                      </label>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() =>
                              updateTestimonial(index, "rating", star)
                            }
                            className={`text-2xl ${star <= testimonial.rating ? "text-yellow-400" : "text-gray-300"}`}
                          >
                            <Star className="h-6 w-6 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      placeholder={
                        t(
                          "website.customerTestimonialPH",
                          "Customer testimonial",
                        ) as string
                      }
                      value={testimonial.testimonial_text}
                      onChange={(e) =>
                        updateTestimonial(
                          index,
                          "testimonial_text",
                          e.target.value,
                        )
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>

              {/* Add Testimonial Button */}
              <button
                onClick={addTestimonial}
                className="flex items-center justify-center w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                {t("website.addTestimonial", "Add Testimonial")}
              </button>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">
              {t("website.faqTitle", "Frequently Asked Questions")}
            </h2>

            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                {t(
                  "website.faqHelp",
                  "Add common questions and answers to help potential customers.",
                )}
              </p>

              {/* FAQs */}
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">
                        {
                          t("website.faqItem", {
                            defaultValue: "FAQ {{num}}",
                            num: index + 1,
                          }) as unknown as string
                        }
                      </h4>
                      <button
                        onClick={() => removeFAQ(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder={
                        t("website.questionPH", "Question") as string
                      }
                      value={faq.question}
                      onChange={(e) =>
                        updateFAQ(index, "question", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    <textarea
                      placeholder={t("website.answerPH", "Answer") as string}
                      value={faq.answer}
                      onChange={(e) =>
                        updateFAQ(index, "answer", e.target.value)
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>

              {/* Add FAQ Button */}
              <button
                onClick={addFAQ}
                className="flex items-center justify-center w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                {t("website.addFaq", "Add FAQ")}
              </button>
            </div>
          </section>

          {/* Contact Info & Address Section */}
          <section className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">
              {t("website.contactTitle", "Contact Info & Address")}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  {t("website.address", "Address")}
                </label>
                <textarea
                  value={websiteData.address || ""}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  placeholder={
                    t(
                      "website.addressPH",
                      "Enter your kennel's full address",
                    ) as string
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="h-4 w-4 inline mr-1" />
                  {t("website.phone", "Phone Number")}
                </label>
                <input
                  type="tel"
                  value={websiteData.contact_phone || ""}
                  onChange={(e) =>
                    handleFieldChange("contact_phone", e.target.value)
                  }
                  placeholder={
                    t("website.phonePH", "+1 (555) 123-4567") as string
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-4 w-4 inline mr-1" />
                  {t("website.email", "Email Address")}
                </label>
                <input
                  type="email"
                  value={websiteData.contact_email || ""}
                  onChange={(e) =>
                    handleFieldChange("contact_email", e.target.value)
                  }
                  placeholder={
                    t("website.emailPH", "info@yourkennel.com") as string
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageCircle className="h-4 w-4 inline mr-1" />
                  {t("website.whatsapp", "WhatsApp Number")}
                </label>
                <input
                  type="tel"
                  value={websiteData.contact_whatsapp || ""}
                  onChange={(e) =>
                    handleFieldChange("contact_whatsapp", e.target.value)
                  }
                  placeholder={
                    t("website.whatsappPH", "+1 (555) 123-4567") as string
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("website.mapsUrl", "Google Maps Embed URL")}
                </label>
                <input
                  type="url"
                  value={websiteData.map_embed_url || ""}
                  onChange={(e) =>
                    handleFieldChange("map_embed_url", e.target.value)
                  }
                  placeholder={
                    t(
                      "website.mapsUrlPH",
                      "https://www.google.com/maps/embed?pb=...",
                    ) as string
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {t(
                    "website.mapsHelp",
                    "Get this from Google Maps → Share → Embed a map",
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* Special Restrictions Section */}
          <section className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">
              {t("website.specialRestrictions", "Special Restrictions")}
            </h2>

            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                {t(
                  "website.specialHelp",
                  "List any special requirements or restrictions for your kennel.",
                )}
              </p>

              <textarea
                value={websiteData.special_restrictions || ""}
                onChange={(e) =>
                  handleFieldChange("special_restrictions", e.target.value)
                }
                placeholder={
                  t(
                    "website.specialPH",
                    "e.g., Only small dogs under 20kg, Must be vaccinated, No aggressive breeds, etc.",
                  ) as string
                }
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </section>

          {/* Theme & Appearance Section */}
          <section className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">
              {t("website.themeTitle", "Theme & Appearance")}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("website.themeColor", "Theme Color")}
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="color"
                    value={websiteData.theme_color || "#3B82F6"}
                    onChange={(e) =>
                      handleFieldChange("theme_color", e.target.value)
                    }
                    className="w-12 h-12 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={websiteData.theme_color || "#3B82F6"}
                    onChange={(e) =>
                      handleFieldChange("theme_color", e.target.value)
                    }
                    placeholder="#3B82F6"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {t(
                    "website.themeHelp",
                    "This color will be used for buttons, links, and accents on your website.",
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("website.seoTitle", "SEO Title")}
                </label>
                <input
                  type="text"
                  value={websiteData.seo_title || ""}
                  onChange={(e) =>
                    handleFieldChange("seo_title", e.target.value)
                  }
                  placeholder={
                    t(
                      "website.seoTitlePH",
                      "Your Kennel Name - Professional Dog Boarding",
                    ) as string
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {t(
                    "website.seoTitleHelp",
                    "This appears in search engine results and browser tabs.",
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("website.seoDesc", "SEO Description")}
                </label>
                <textarea
                  value={websiteData.seo_description || ""}
                  onChange={(e) =>
                    handleFieldChange("seo_description", e.target.value)
                  }
                  placeholder={
                    t(
                      "website.seoDescPH",
                      "Professional dog boarding services in [Your City]. Safe, comfortable, and loving care for your furry friends.",
                    ) as string
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {t(
                    "website.seoDescHelp",
                    "This description appears in search engine results.",
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* Direct Booking Section */}
          <section className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">
              {t("website.directBooking", "Direct Booking")}
            </h2>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="allow_direct_booking"
                  checked={websiteData.allow_direct_booking || false}
                  onChange={(e) =>
                    handleFieldChange("allow_direct_booking", e.target.checked)
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="allow_direct_booking"
                  className="text-sm font-medium text-gray-700"
                >
                  {t(
                    "website.enableDirect",
                    "Enable direct booking on website",
                  )}
                </label>
              </div>

              <p className="text-sm text-gray-500">
                {t(
                  "website.directHelp",
                  "When enabled, customers can book stays directly from your website. Payment processing and calendar integration will be added in a future update.",
                )}
              </p>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={() => saveWebsiteData(websiteData)}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving
                ? t("saving", "Saving...")
                : t("website.saveAll", "Save All Changes")}
            </button>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
