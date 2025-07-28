import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { subdomain: string } },
) {
  try {
    console.log("GET /api/kennel-website/public/[subdomain] called");
    console.log("Subdomain:", params.subdomain);
    console.log("Full URL:", request.url);
    console.log("Headers:", Object.fromEntries(request.headers.entries()));

    const supabase = supabaseServer();

    // Get the website data directly by subdomain
    console.log("Looking for subdomain:", params.subdomain);

    const { data: websiteData, error: websiteError } = await supabase
      .from("kennel_websites")
      .select("*")
      .eq("subdomain", params.subdomain)
      .single();

    if (websiteError || !websiteData) {
      console.error("Error fetching website data by subdomain:", websiteError);
      console.error("Requested subdomain:", params.subdomain);

      // Let's also check what subdomains exist in the kennel_websites table
      const { data: allWebsites } = await supabase
        .from("kennel_websites")
        .select("subdomain");

      console.log("All subdomains in kennel_websites:", allWebsites);

      return NextResponse.json({ error: "Kennel not found" }, { status: 404 });
    }

    console.log("Found website data:", websiteData);

    if (websiteError) {
      console.error("Error fetching website data:", websiteError);
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    console.log("Website data:", websiteData);

    // Get gallery images
    const { data: images } = await supabase
      .from("kennel_website_images")
      .select("*")
      .eq("website_id", websiteData.id)
      .order("sort_order");

    // Get videos
    const { data: videos } = await supabase
      .from("kennel_website_videos")
      .select("*")
      .eq("website_id", websiteData.id)
      .order("sort_order");

    // Get testimonials
    const { data: testimonials } = await supabase
      .from("kennel_website_testimonials")
      .select("*")
      .eq("website_id", websiteData.id)
      .order("sort_order");

    // Get FAQs
    const { data: faqs } = await supabase
      .from("kennel_website_faqs")
      .select("*")
      .eq("website_id", websiteData.id)
      .order("sort_order");

    const result = {
      websiteData: websiteData || {},
      galleryImages: images || [],
      videos: videos || [],
      testimonials: testimonials || [],
      faqs: faqs || [],
    };

    console.log("Returning data:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in public kennel website API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
