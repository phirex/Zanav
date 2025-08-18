"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Star,
  Play,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
  caption?: string;
  sort_order: number;
}

interface Testimonial {
  id?: string;
  author_name: string;
  author_photo?: string;
  text: string;
  sort_order: number;
}

interface FAQ {
  id?: string;
  question: string;
  answer: string;
  sort_order: number;
}

export default function KennelWebsitePage({
  params,
}: {
  params: { subdomain: string };
}) {
  const { t } = useTranslation();
  // CRITICAL: Ensure this is only loaded for kennel websites
  useEffect(() => {
    // Clear any console logs that might indicate dashboard loading
    console.clear();
    console.log("[KENNEL] Loading kennel website for:", params.subdomain);
    console.log("[KENNEL] Current URL:", window.location.href);
    console.log("[KENNEL] Component loaded successfully");

    // Prevent any dashboard initialization
    if (typeof window !== "undefined") {
      // Override any global dashboard functions
      (window as any).initializeDashboard = () => {
        console.log(
          "[KENNEL] Dashboard initialization blocked on kennel website",
        );
        return false;
      };

      // Block any fetch calls to /api/bookings
      const originalFetch = window.fetch;
      window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
        const url = typeof input === "string" ? input : input.toString();
        if (url.includes("/api/bookings")) {
          console.log(
            "[KENNEL] Blocked fetch to /api/bookings on kennel website",
          );
          return Promise.reject(
            new Error("Bookings API blocked on kennel website"),
          );
        }
        return originalFetch.call(this, input, init);
      };
    }
  }, [params.subdomain]);

  const [websiteData, setWebsiteData] = useState<KennelWebsite>({});
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [expandedFaqs, setExpandedFaqs] = useState<Set<number>>(new Set());
  const [showBooking, setShowBooking] = useState(false);
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [note, setNote] = useState("");
  const [dogs, setDogs] = useState<Array<{ name: string; breed: string }>>([
    { name: "", breed: "" },
  ]);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [pricing, setPricing] = useState<{
    defaultPricePerDay: number;
    defaultCurrency: string;
  } | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const days = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const minCheckoutStr = useMemo(() => {
    if (!checkIn) return "";
    const d = new Date(checkIn);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, [checkIn]);

  const handleCheckInChange = (value: string) => {
    setCheckIn(value);
    if (value) {
      const d = new Date(value);
      d.setDate(d.getDate() + 1);
      const minStr = d.toISOString().split("T")[0];
      if (checkOut && checkOut < minStr) setCheckOut(minStr);
    } else {
      setCheckOut("");
    }
  };

  const total = useMemo(() => {
    if (!pricing) return 0;
    return pricing.defaultPricePerDay * days * dogs.length;
  }, [pricing, days, dogs.length]);
  const currency = (pricing?.defaultCurrency || "usd").toUpperCase();

  const addDog = () => setDogs((d) => [...d, { name: "", breed: "" }]);
  const updateDog = (idx: number, key: "name" | "breed", value: string) => {
    setDogs((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, [key]: value } : d)),
    );
  };

  const resetForm = () => {
    setCheckIn("");
    setCheckOut("");
    setOwnerName("");
    setOwnerEmail("");
    setOwnerPhone("");
    setDogs([{ name: "", breed: "" }]);
    setSubmitSuccess(false);
    setNote("");
  };

  const submitBooking = async () => {
    if (!tenantId)
      return alert(t("publicSite.unableToBook", "Unable to book right now"));
    if (
      !checkIn ||
      !checkOut ||
      !ownerName ||
      !ownerPhone ||
      dogs.some((d) => !d.name)
    ) {
      return alert(
        t(
          "publicSite.completeForm",
          "Please fill dates, your details, and all dog names",
        ),
      );
    }
    // Ensure at least one night between check-in and check-out
    if (days < 1) {
      return alert(
        t(
          "publicSite.invalidDates",
          "Please choose a check-out date at least one day after check-in",
        ),
      );
    }
    setBookingSubmitting(true);
    try {
      const res = await fetch(`/api/public/bookings/${params.subdomain}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          startDate: checkIn,
          endDate: checkOut,
          ownerName,
          ownerEmail,
          ownerPhone,
          dogs,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to submit booking");
      setSubmitSuccess(true);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBookingSubmitting(false);
    }
  };

  useEffect(() => {
    fetchWebsiteData();
  }, [params.subdomain]);

  const fetchWebsiteData = async () => {
    try {
      setIsLoading(true);
      setIsError(false);

      console.log("[KENNEL] Fetching data for subdomain:", params.subdomain);

      // Fetch the website data using the public API
      const response = await fetch(
        `${window.location.origin}/api/kennel-website/public/${params.subdomain}`,
      );

      if (!response.ok) {
        if (response.status === 404) {
          setIsError(true);
          return;
        }
        throw new Error("Failed to load website data");
      }

      const data = await response.json();
      setWebsiteData(data.websiteData || {});
      setGalleryImages(data.galleryImages || []);
      setVideos(data.videos || []);
      setTestimonials(data.testimonials || []);
      setFaqs(data.faqs || []);
      setPricing(data.pricing || null);
      setTenantId(data.tenantId || null);
    } catch (error) {
      console.error("[KENNEL] Error fetching website data:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFaq = (index: number) => {
    const newExpanded = new Set(expandedFaqs);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFaqs(newExpanded);
  };

  const themeColor = websiteData.theme_color || "#3B82F6";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200"></div>
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-4">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {t("publicSite.kennelNotFound", "Kennel Not Found")}
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              {t("publicSite.subdomainNotFound", {
                defaultValue:
                  "Sorry, we couldn't find a kennel with the subdomain {{subdomain}}.zanav.io",
                subdomain: params.subdomain,
              })}
            </p>
            <p className="text-gray-500 mb-8">
              {t(
                "publicSite.kennelMissing",
                "This kennel might not exist or may have been removed.",
              )}
            </p>
          </div>

          <div className="space-y-4">
            <a
              href="https://zanav.io"
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              {t("publicSite.goHome", "Go to Zanav Homepage")}
            </a>

            <div className="text-sm text-gray-500">
              <p>
                {t(
                  "publicSite.findKennel",
                  "Looking for a kennel? Visit our main site to find one.",
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-screen">
        {websiteData.cover_photo_url && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${websiteData.cover_photo_url})` }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          </div>
        )}

        <div className="relative z-10 flex items-center justify-center h-full text-center text-white">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              {websiteData.hero_title ||
                t("publicSite.heroTitle", "Welcome to Our Kennel")}
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              {websiteData.hero_tagline ||
                t(
                  "publicSite.heroTagline",
                  "Where your furry friends feel at home",
                )}
            </p>
            {websiteData.allow_direct_booking && (
              <button
                className="px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
                style={{ backgroundColor: themeColor, color: "white" }}
                onClick={() => setShowBooking(true)}
              >
                {t("publicSite.bookNow", "Book Now")}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* About Our Kennel Section */}
      {websiteData.about_story && (
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">
              {t("publicSite.aboutTitle", "About Our Kennel")}
            </h2>
            <div className="prose prose-lg mx-auto text-gray-700 leading-relaxed">
              <div className="whitespace-pre-wrap text-center">
                {websiteData.about_story}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {galleryImages.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              {t("publicSite.galleryTitle", "Our Gallery")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryImages.map((image, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-lg shadow-lg"
                >
                  <img
                    src={image.image_url}
                    alt={image.caption || `Gallery image ${index + 1}`}
                    className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {image.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
                      <p className="text-sm">{image.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Videos Section */}
      {videos.length > 0 && (
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              {t("publicSite.videosTitle", "Videos")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {videos.map((video, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6">
                  <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden">
                    {video.video_url.includes("youtube.com") ||
                    video.video_url.includes("youtu.be") ? (
                      <iframe
                        src={video.video_url
                          .replace("watch?v=", "embed/")
                          .replace("youtu.be/", "youtube.com/embed/")}
                        title={video.caption || `Video ${index + 1}`}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : video.video_url.includes("vimeo.com") ? (
                      <iframe
                        src={video.video_url.replace(
                          "vimeo.com/",
                          "player.vimeo.com/video/",
                        )}
                        title={video.caption || `Video ${index + 1}`}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={video.video_url}
                        controls
                        className="w-full h-full object-cover"
                        poster={video.caption ? undefined : undefined}
                      >
                        <source src={video.video_url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                  {video.caption && (
                    <h3 className="text-xl font-semibold mb-2">
                      {video.caption}
                    </h3>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              {t("publicSite.testimonialsTitle", "What Our Customers Say")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white rounded-lg p-6 shadow-lg">
                  <div className="flex items-center mb-4">
                    {testimonial.author_photo && (
                      <img
                        src={testimonial.author_photo}
                        alt={testimonial.author_name}
                        className="w-12 h-12 rounded-full mr-4"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold">
                        {testimonial.author_name}
                      </h3>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 text-yellow-400 fill-current"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 italic">"{testimonial.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Special Restrictions Section */}
      {websiteData.special_restrictions && (
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">
              {t("publicSite.importantInfo", "Important Information")}
            </h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">
                {t("publicSite.specialRequirements", "Special Requirements")}
              </h3>
              <p className="text-yellow-700 whitespace-pre-wrap">
                {websiteData.special_restrictions}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              {t("publicSite.faqTitle", "Frequently Asked Questions")}
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="font-semibold text-lg">{faq.question}</h3>
                    {expandedFaqs.has(index) ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                  {expandedFaqs.has(index) && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t("publicSite.contactUs", "Contact Us")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-6">
              {websiteData.address && (
                <div className="flex items-start">
                  <MapPin
                    className="h-6 w-6 mr-3 mt-1"
                    style={{ color: themeColor }}
                  />
                  <div>
                    <h3 className="font-semibold mb-1">
                      {t("publicSite.address", "Address")}
                    </h3>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {websiteData.address}
                    </p>
                  </div>
                </div>
              )}

              {websiteData.contact_phone && (
                <div className="flex items-center">
                  <Phone
                    className="h-6 w-6 mr-3"
                    style={{ color: themeColor }}
                  />
                  <div>
                    <h3 className="font-semibold mb-1">
                      {t("publicSite.phone", "Phone")}
                    </h3>
                    <a
                      href={`tel:${websiteData.contact_phone}`}
                      className="text-gray-600 hover:underline"
                    >
                      {websiteData.contact_phone}
                    </a>
                  </div>
                </div>
              )}

              {websiteData.contact_email && (
                <div className="flex items-center">
                  <Mail
                    className="h-6 w-6 mr-3"
                    style={{ color: themeColor }}
                  />
                  <div>
                    <h3 className="font-semibold mb-1">
                      {t("publicSite.email", "Email")}
                    </h3>
                    <a
                      href={`mailto:${websiteData.contact_email}`}
                      className="text-gray-600 hover:underline"
                    >
                      {websiteData.contact_email}
                    </a>
                  </div>
                </div>
              )}

              {websiteData.contact_whatsapp && (
                <div className="flex items-center">
                  <MessageCircle
                    className="h-6 w-6 mr-3"
                    style={{ color: themeColor }}
                  />
                  <div>
                    <h3 className="font-semibold mb-1">
                      {t("publicSite.whatsapp", "WhatsApp")}
                    </h3>
                    <a
                      href={`https://wa.me/${websiteData.contact_whatsapp.replace(/\D/g, "")}`}
                      className="text-gray-600 hover:underline"
                    >
                      {websiteData.contact_whatsapp}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Map */}
            {websiteData.map_embed_url && (
              <div>
                <h3 className="font-semibold mb-4">
                  {t("publicSite.location", "Location")}
                </h3>
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={websiteData.map_embed_url}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>
            &copy; 2025{" "}
            {websiteData.hero_title || t("publicSite.kennel", "Kennel")}{" "}
            {t("publicSite.allRights", "All rights reserved.")}
          </p>
        </div>
      </footer>

      {showBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl p-6 sm:p-6 max-h-[90vh] overflow-y-auto">
            {!submitSuccess ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">
                    {t("publicSite.requestBooking", "Request a Booking")}
                  </h3>
                  <button
                    onClick={() => {
                      setShowBooking(false);
                      resetForm();
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">
                      {t("publicSite.checkIn", "Check-in")}
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded-lg px-3 py-2"
                      min={todayStr}
                      value={checkIn}
                      onChange={(e) => handleCheckInChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">
                      {t("publicSite.checkOut", "Check-out")}
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded-lg px-3 py-2"
                      min={minCheckoutStr}
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">
                      {t("publicSite.yourName", "Your Name")}
                    </label>
                    <input
                      className="w-full border rounded-lg px-3 py-2"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder={t("publicSite.fullName", "Full name")}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">
                      {t("publicSite.emailOptional", "Email (optional)")}
                    </label>
                    <input
                      type="email"
                      className="w-full border rounded-lg px-3 py-2"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">
                      {t("publicSite.phone", "Phone")}
                    </label>
                    <input
                      className="w-full border rounded-lg px-3 py-2"
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      placeholder="+1 555 555 5555"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="text-sm text-gray-600">
                    {t("publicSite.notesOptional", "Notes (optional)")}
                  </label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 min-h-[90px]"
                    placeholder={t(
                      "publicSite.notesPlaceholder",
                      "Anything we should know about your dog(s)?",
                    )}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">
                      {t("publicSite.dogs", "Dogs")}
                    </h4>
                    <button
                      onClick={addDog}
                      className="text-sm px-3 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {t("publicSite.addDog", "Add Dog")}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {dogs.map((d, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                      >
                        <input
                          className="border rounded-lg px-3 py-2"
                          placeholder={t("publicSite.dogName", "Dog name")}
                          value={d.name}
                          onChange={(e) => updateDog(i, "name", e.target.value)}
                        />
                        <input
                          className="border rounded-lg px-3 py-2"
                          placeholder={t("publicSite.breed", "Breed")}
                          value={d.breed}
                          onChange={(e) =>
                            updateDog(i, "breed", e.target.value)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="text-gray-700 text-sm">
                    {pricing ? (
                      <>
                        <div>
                          {t("publicSite.pricePerDay", "Price per day:")}{" "}
                          {pricing.defaultPricePerDay} {currency}
                        </div>
                        <div>
                          {t("publicSite.daysDogs", "Days:")} {days} ·{" "}
                          {t("publicSite.dogsLabel", "Dogs:")} {dogs.length}
                        </div>
                      </>
                    ) : (
                      <div>
                        {t("publicSite.pricingNA", "Pricing not available")}
                      </div>
                    )}
                  </div>
                  <div className="text-xl font-semibold">
                    {t("publicSite.total", "Total:")} {total.toFixed(2)}{" "}
                    {currency}
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowBooking(false);
                      resetForm();
                    }}
                    className="px-4 py-2 rounded-lg border w-full sm:w-auto"
                  >
                    {t("cancel", "Cancel")}
                  </button>
                  <button
                    onClick={submitBooking}
                    disabled={bookingSubmitting}
                    className="px-5 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 w-full sm:w-auto"
                  >
                    {bookingSubmitting
                      ? t("publicSite.submitting", "Submitting…")
                      : t("publicSite.submitRequest", "Submit Request")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">
                    {t("publicSite.allSet", "All set! 🐾")}
                  </h3>
                  <button
                    onClick={() => {
                      setShowBooking(false);
                      resetForm();
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-gray-700">
                  {t(
                    "publicSite.thankYouPending",
                    "Thank you! Your request was received and is pending confirmation. We’ll be in touch soon.",
                  )}
                </p>
                <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 text-green-800">
                  <div className="font-medium">
                    {t("publicSite.summary", "Summary")}
                  </div>
                  <div className="text-sm mt-1">
                    {t("publicSite.dates", "Dates:")} {checkIn} → {checkOut}
                  </div>
                  <div className="text-sm">
                    {t("publicSite.dogsLabel", "Dogs:")}{" "}
                    {dogs.map((d) => d.name).join(", ")}
                  </div>
                  <div className="text-sm">
                    {t("publicSite.estimatedTotal", "Estimated total:")}{" "}
                    {total.toFixed(2)} {currency}
                  </div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowBooking(false);
                      resetForm();
                    }}
                    className="px-5 py-2 rounded-lg bg-blue-600 text-white"
                  >
                    {t("publicSite.close", "Close")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
