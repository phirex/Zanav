"use client";

import React, { useState, useEffect } from "react";
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
  const [websiteData, setWebsiteData] = useState<KennelWebsite>({});
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [expandedFaqs, setExpandedFaqs] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchWebsiteData();
  }, [params.subdomain]);

  const fetchWebsiteData = async () => {
    try {
      setIsLoading(true);
      setIsError(false);

      console.log("[Kennel Page] Fetching data for subdomain:", params.subdomain);

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
    } catch (error) {
      console.error("Error fetching website data:", error);
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
              Kennel Not Found
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Sorry, we couldn't find a kennel with the subdomain{" "}
              <span className="font-semibold text-gray-800">
                {params.subdomain}.zanav.io
              </span>
            </p>
            <p className="text-gray-500 mb-8">
              This kennel might not exist or may have been removed.
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
              Go to Zanav Homepage
            </a>
            
            <div className="text-sm text-gray-500">
              <p>Looking for a kennel? Visit our main site to find one.</p>
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
              {websiteData.hero_title || "Welcome to Our Kennel"}
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              {websiteData.hero_tagline ||
                "Where your furry friends feel at home"}
            </p>
            {websiteData.allow_direct_booking && (
              <button
                className="px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
                style={{ backgroundColor: themeColor, color: "white" }}
              >
                Book Now
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
              About Our Kennel
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
              Our Gallery
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
            <h2 className="text-3xl font-bold text-center mb-12">Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {videos.map((video, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6">
                  <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden">
                    {video.video_url.includes('youtube.com') || video.video_url.includes('youtu.be') ? (
                      <iframe
                        src={video.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                        title={video.caption || `Video ${index + 1}`}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : video.video_url.includes('vimeo.com') ? (
                      <iframe
                        src={video.video_url.replace('vimeo.com/', 'player.vimeo.com/video/')}
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
              What Our Customers Say
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
              Important Information
            </h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">
                Special Requirements
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
              Frequently Asked Questions
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
          <h2 className="text-3xl font-bold text-center mb-12">Contact Us</h2>

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
                    <h3 className="font-semibold mb-1">Address</h3>
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
                    <h3 className="font-semibold mb-1">Phone</h3>
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
                    <h3 className="font-semibold mb-1">Email</h3>
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
                    <h3 className="font-semibold mb-1">WhatsApp</h3>
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
                <h3 className="font-semibold mb-4">Location</h3>
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
            &copy; 2025 {websiteData.hero_title || "Kennel"}. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
