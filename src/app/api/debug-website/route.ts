import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer();
    
    // Get tenant ID from headers
    const tenantId = request.headers.get("x-tenant-id");
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    console.log("Debug website data for tenant:", tenantId);

    // Check tenant data
    const { data: tenantData, error: tenantError } = await supabase
      .from("Tenant")
      .select("*")
      .eq("id", tenantId)
      .single();

    if (tenantError) {
      console.error("Error fetching tenant:", tenantError);
      return NextResponse.json({ error: "Failed to fetch tenant" }, { status: 500 });
    }

    // Check website data
    const { data: websiteData, error: websiteError } = await supabase
      .from("kennel_websites")
      .select("*")
      .eq("tenant_id", tenantId)
      .single();

    // Check gallery images
    const { data: galleryImages, error: galleryError } = await supabase
      .from("kennel_website_images")
      .select("*")
      .eq("website_id", websiteData?.id || "none")
      .order("sort_order");

    // Check testimonials
    const { data: testimonials, error: testimonialsError } = await supabase
      .from("kennel_website_testimonials")
      .select("*")
      .eq("website_id", websiteData?.id || "none")
      .order("sort_order");

    // Check FAQs
    const { data: faqs, error: faqsError } = await supabase
      .from("kennel_website_faqs")
      .select("*")
      .eq("website_id", websiteData?.id || "none")
      .order("sort_order");

    return NextResponse.json({
      tenant: tenantData,
      website: websiteData,
      galleryImages: galleryImages || [],
      testimonials: testimonials || [],
      faqs: faqs || [],
      errors: {
        tenant: tenantError,
        website: websiteError,
        gallery: galleryError,
        testimonials: testimonialsError,
        faqs: faqsError
      }
    });

  } catch (error) {
    console.error("Debug website error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 