import { NextRequest, NextResponse } from "next/server";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/auth";

export const dynamic = 'force-dynamic';

const INVALID_TENANT = "00000000-0000-0000-0000-000000000000";

export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/kennel-website called");
    const supabase = supabaseServer();

    // Resolve tenant ID (header/cookie -> user lookup fallback)
    let tenantId = request.headers.get("x-tenant-id");
    const cookieTenant = request.cookies.get("tenantId")?.value || null;
    console.log("GET - Incoming tenantId header:", tenantId, "cookie:", cookieTenant);

    if (!tenantId || tenantId === INVALID_TENANT) {
      tenantId = cookieTenant || tenantId || null;
    }

    if (!tenantId || tenantId === INVALID_TENANT) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          // Find user record and derive tenant
          const { data: userRecord } = await supabase
            .from("User")
            .select("id, tenantId")
            .eq("supabaseUserId", user.id)
            .maybeSingle();
          if (userRecord?.tenantId) tenantId = userRecord.tenantId as any;
        }
      } catch {}
    }

    console.log("GET - Resolved tenantId:", tenantId);

    if (!tenantId || tenantId === INVALID_TENANT) {
      return NextResponse.json(
        { error: "Tenant ID required" },
        { status: 400 },
      );
    }

    // Use admin client for data reads/writes to avoid RLS issues
    const admin = supabaseAdmin();

    // Fetch tenant data to get subdomain; if header points to a non-existent tenant, fallback to user's tenant
    let { data: tenantData, error: tenantError } = await admin
      .from("Tenant")
      .select("subdomain")
      .eq("id", tenantId as string)
      .maybeSingle();

    console.log("Fetched tenant data:", { tenantId, tenantData, tenantError });

    if ((!tenantData || tenantError?.code === "PGRST116") && !cookieTenant) {
      try {
        const serverClient = await createServerSupabaseClient();
        const { data: { user } } = await serverClient.auth.getUser();
        if (user?.id) {
          const { data: userRecord } = await supabase
            .from("User")
            .select("id, tenantId")
            .eq("supabaseUserId", user.id)
            .maybeSingle();
          if (userRecord?.tenantId) {
            tenantId = userRecord.tenantId as any;
            const res = await admin
              .from("Tenant")
              .select("subdomain")
              .eq("id", tenantId as string)
              .single();
            tenantData = res.data as any;
            tenantError = res.error as any;
          }
        }
      } catch {}
    }

    if (!tenantData || tenantError) {
      console.error("Error fetching tenant data:", tenantError);
      return NextResponse.json(
        { error: "Failed to fetch tenant data" },
        { status: 500 },
      );
    }

    // Fetch kennel website data
    const { data: websiteData, error: websiteError } = await admin
      .from("kennel_websites")
      .select("*")
      .eq("tenant_id", tenantId as string)
      .single();

    console.log("GET - Website data query result:", {
      websiteData,
      websiteError,
      tenantData,
    });

    if (websiteError && websiteError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error fetching kennel website:", websiteError);
      return NextResponse.json(
        { error: "Failed to fetch website data" },
        { status: 500 },
      );
    }

    // Merge tenant subdomain with website data; allow null websiteData
    const mergedWebsiteData = websiteData
      ? { ...websiteData, subdomain: tenantData.subdomain }
      : { subdomain: tenantData.subdomain } as any;

    // If website exists, fetch related data
    let galleryImages: any[] = [];
    let videos: any[] = [];
    let testimonials: any[] = [];
    let faqs: any[] = [];

    if (websiteData) {
      // Fetch gallery images
        const { data: images } = await admin
        .from("kennel_website_images")
        .select("*")
        .eq("website_id", websiteData.id)
        .order("sort_order");

      // Fetch videos
        const { data: videoData } = await admin
        .from("kennel_website_videos")
        .select("*")
        .eq("website_id", websiteData.id)
        .order("sort_order");

      // Fetch testimonials
        const { data: testimonialData } = await admin
        .from("kennel_website_testimonials")
        .select("*")
        .eq("website_id", websiteData.id)
        .order("sort_order");

      // Fetch FAQs
        const { data: faqData } = await admin
        .from("kennel_website_faqs")
        .select("*")
        .eq("website_id", websiteData.id)
        .order("sort_order");

      galleryImages = images || [];
      videos = videoData || [];
      testimonials = testimonialData || [];
      faqs = faqData || [];
    }

    return NextResponse.json({
      data: mergedWebsiteData || null,
      galleryImages,
      videos,
      testimonials,
      faqs,
    });
  } catch (error) {
    console.error("GET /api/kennel-website error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/kennel-website called");
    const admin = supabaseAdmin();
    const body = await request.json();
    console.log("Request body:", body);

    // Resolve tenant ID header → cookie → authenticated user fallback
    let tenantId = request.headers.get("x-tenant-id");
    const cookieTenant = request.cookies.get("tenantId")?.value || null;
    if (!tenantId || tenantId === INVALID_TENANT) tenantId = cookieTenant || tenantId || null;
    if (!tenantId || tenantId === INVALID_TENANT) {
      try {
        const serverClient = await createServerSupabaseClient();
        const { data: { user } } = await serverClient.auth.getUser();
        if (user?.id) {
          const { data: userRecord } = await admin
            .from("User")
            .select("tenantId")
            .eq("supabaseUserId", user.id)
            .maybeSingle();
          if (userRecord?.tenantId) tenantId = userRecord.tenantId as any;
        }
      } catch {}
    }

    console.log("Tenant ID:", tenantId);
    if (!tenantId || tenantId === INVALID_TENANT) {
      return NextResponse.json(
        { error: "Tenant ID required" },
        { status: 400 },
      );
    }

    // Extract main website data and related data
    const {
      galleryImages = [],
      videos = [],
      testimonials = [],
      faqs = [],
      ...websiteData
    } = body;

    // Check if website record exists
    const { data: existing } = await admin
      .from("kennel_websites")
      .select("id")
      .eq("tenant_id", tenantId)
      .single();

    console.log("Existing website record:", existing);

    let websiteId: string;

    if (existing) {
      console.log("Updating existing website record");
      // Update existing record
      const { data, error } = await admin
        .from("kennel_websites")
        .update({
          ...websiteData,
          updated_at: new Date().toISOString(),
        })
        .eq("tenant_id", tenantId)
        .select()
        .single();

      if (error) {
        console.error("Error updating kennel website:", error);
        return NextResponse.json(
          { error: "Failed to update website data" },
          { status: 500 },
        );
      }
      websiteId = data.id;
      console.log("Updated website ID:", websiteId);
    } else {
      console.log("Creating new website record");

      // Get the subdomain from the tenant record
      const { data: tenantData, error: tenantError } = await admin
        .from("Tenant")
        .select("subdomain")
        .eq("id", tenantId)
        .single();

      if (tenantError) {
        console.error("Error fetching tenant subdomain:", tenantError);
        return NextResponse.json(
          { error: "Failed to get tenant subdomain" },
          { status: 500 },
        );
      }

      console.log("Using subdomain from tenant:", tenantData.subdomain);

      // Create new record
      const { data, error } = await admin
        .from("kennel_websites")
        .insert({
          ...websiteData,
          subdomain: tenantData.subdomain,
          tenant_id: tenantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating kennel website:", error);
        return NextResponse.json(
          { error: "Failed to create website data" },
          { status: 500 },
        );
      }
      websiteId = data.id;
      console.log("Created website ID:", websiteId);
    }

    // Save gallery images
    if (galleryImages.length > 0) {
      // Delete existing images
      await admin
        .from("kennel_website_images")
        .delete()
        .eq("website_id", websiteId);

      // Insert new images
      const imagesToInsert = galleryImages.map((img: any, index: number) => ({
        website_id: websiteId,
        image_url: img.image_url,
        caption: img.caption || null,
        sort_order: index,
        created_at: new Date().toISOString(),
      }));

      const { error: imagesError } = await admin
        .from("kennel_website_images")
        .insert(imagesToInsert);

      if (imagesError) {
        console.error("Error saving gallery images:", imagesError);
      }
    }

    // Save videos
    if (videos.length > 0) {
      // Delete existing videos
      await admin
        .from("kennel_website_videos")
        .delete()
        .eq("website_id", websiteId);

      // Insert new videos
      const videosToInsert = videos.map((video: any, index: number) => ({
        website_id: websiteId,
        video_url: video.video_url,
        caption: video.title || null,
        sort_order: index,
        created_at: new Date().toISOString(),
      }));

      const { error: videosError } = await admin
        .from("kennel_website_videos")
        .insert(videosToInsert);

      if (videosError) {
        console.error("Error saving videos:", videosError);
      }
    }

    // Save testimonials
    if (testimonials.length > 0) {
      // Delete existing testimonials
      await admin
        .from("kennel_website_testimonials")
        .delete()
        .eq("website_id", websiteId);

      // Insert new testimonials
      const testimonialsToInsert = testimonials.map(
        (testimonial: any, index: number) => ({
          website_id: websiteId,
          author_name: testimonial.customer_name,
          author_photo: testimonial.customer_photo_url || null,
          text: testimonial.testimonial_text,
          sort_order: index,
          created_at: new Date().toISOString(),
        }),
      );

      const { error: testimonialsError } = await admin
        .from("kennel_website_testimonials")
        .insert(testimonialsToInsert);

      if (testimonialsError) {
        console.error("Error saving testimonials:", testimonialsError);
      }
    }

    // Save FAQs
    if (faqs.length > 0) {
      // Delete existing FAQs
      await admin
        .from("kennel_website_faqs")
        .delete()
        .eq("website_id", websiteId);

      // Insert new FAQs
      const faqsToInsert = faqs.map((faq: any, index: number) => ({
        website_id: websiteId,
        question: faq.question,
        answer: faq.answer,
        sort_order: index,
        created_at: new Date().toISOString(),
      }));

      const { error: faqsError } = await admin
        .from("kennel_website_faqs")
        .insert(faqsToInsert);

      if (faqsError) {
        console.error("Error saving FAQs:", faqsError);
      }
    }

    // Fetch updated data to return
    const { data: updatedWebsite } = await admin
      .from("kennel_websites")
      .select("*")
      .eq("id", websiteId)
      .single();

    return NextResponse.json({
      data: updatedWebsite,
      message: "Website data saved successfully",
    });
  } catch (error) {
    console.error("POST /api/kennel-website error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
