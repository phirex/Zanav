import { createHandler } from "@/lib/apiHandler";
import { supabaseAdmin } from "@/lib/supabase/server";

export const POST = createHandler(async ({ client, tenantId }) => {
  console.log("[RESTORE_WEBSITE_CONTENT] Starting website content restoration...");
  
  const adminSupabase = supabaseAdmin();
  
  try {
    // First, check if kennel_websites record exists
    const { data: existingWebsite, error: websiteError } = await adminSupabase
      .from("kennel_websites")
      .select("*")
      .eq("tenant_id", tenantId || "")
      .single();
    
    if (websiteError && websiteError.code !== 'PGRST116') {
      console.error("[RESTORE_WEBSITE_CONTENT] Error checking website:", websiteError);
      return { error: websiteError.message };
    }
    
    let websiteId;
    
    if (!existingWebsite) {
      // Create kennel_websites record
      const { data: newWebsite, error: createError } = await adminSupabase
        .from("kennel_websites")
        .insert({
          tenant_id: tenantId || "",
          cover_photo_url: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&h=600&fit=crop",
          hero_title: "Happy Paws Kennel",
          hero_tagline: "Professional Pet Boarding Services",
          contact_email: "info@happypawskennel.com",
          contact_phone: "+1-555-0123",
          address: "123 Pet Street, Happy City, HC 12345",
          special_restrictions: "All pets must be up to date on vaccinations. Aggressive pets may require special arrangements.",
          theme_color: "modern",
          seo_title: "Happy Paws Kennel - Professional Pet Boarding Services",
          seo_description: "Professional pet boarding services with 24/7 care. Book your pet's stay today!",
          allow_direct_booking: true,
          subdomain: "happypaws"
        })
        .select()
        .single();
      
      if (createError) {
        console.error("[RESTORE_WEBSITE_CONTENT] Error creating website:", createError);
        return { error: createError.message };
      }
      
      websiteId = newWebsite.id;
      console.log("[RESTORE_WEBSITE_CONTENT] Created website record with ID:", websiteId);
    } else {
      websiteId = existingWebsite.id;
      console.log("[RESTORE_WEBSITE_CONTENT] Using existing website record with ID:", websiteId);
    }
    
    // Create testimonials
    console.log("[RESTORE_WEBSITE_CONTENT] Creating testimonials...");
    const testimonialsData = [
      {
        website_id: websiteId,
        author_name: "Sarah Johnson",
        text: "Amazing service! My dog Max had the best time. The staff is incredibly caring and professional.",
        author_photo: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
      },
      {
        website_id: websiteId,
        author_name: "Michael Chen",
        text: "We've been bringing our cats here for years. The facilities are clean and the care is exceptional.",
        author_photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
      },
      {
        website_id: websiteId,
        author_name: "Emma Rodriguez",
        text: "The best pet boarding service in town! My dog Bella was so happy when I picked her up.",
        author_photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
      }
    ];
    
    const { data: testimonials, error: testimonialsError } = await adminSupabase
      .from("kennel_website_testimonials")
      .insert(testimonialsData)
      .select();
    
    if (testimonialsError) {
      console.error("[RESTORE_WEBSITE_CONTENT] Error creating testimonials:", testimonialsError);
      return { error: testimonialsError.message };
    }
    
    console.log("[RESTORE_WEBSITE_CONTENT] Created testimonials:", testimonials?.length || 0);
    
    // Create FAQ
    console.log("[RESTORE_WEBSITE_CONTENT] Creating FAQ...");
    const faqData = [
      {
        website_id: websiteId,
        question: "What vaccinations are required?",
        answer: "All pets must be up to date on rabies, distemper, and bordetella vaccinations. Please bring vaccination records."
      },
      {
        website_id: websiteId,
        question: "Can I bring my pet's own food?",
        answer: "Yes, absolutely! We encourage bringing your pet's regular food to maintain their diet and avoid stomach upset."
      },
      {
        website_id: websiteId,
        question: "Do you provide 24/7 care?",
        answer: "Yes, we have staff on-site 24/7 to ensure your pets are never alone and receive constant care and attention."
      },
      {
        website_id: websiteId,
        question: "What if my pet has special needs?",
        answer: "We can accommodate pets with special needs, including medication administration, special diets, and mobility assistance."
      }
    ];
    
    const { data: faqs, error: faqError } = await adminSupabase
      .from("kennel_website_faqs")
      .insert(faqData)
      .select();
    
    if (faqError) {
      console.error("[RESTORE_WEBSITE_CONTENT] Error creating FAQ:", faqError);
      return { error: faqError.message };
    }
    
    console.log("[RESTORE_WEBSITE_CONTENT] Created FAQ items:", faqs?.length || 0);
    
    // Create gallery images
    console.log("[RESTORE_WEBSITE_CONTENT] Creating gallery images...");
    const galleryData = [
      {
        website_id: websiteId,
        image_url: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&h=600&fit=crop",
        caption: "Comfortable Kennels - Spacious and clean kennels for your pets"
      },
      {
        website_id: websiteId,
        image_url: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop",
        caption: "Play Area - Large outdoor play area for exercise and fun"
      },
      {
        website_id: websiteId,
        image_url: "https://images.unsplash.com/photo-1587764379873-97837921fd44?w=800&h=600&fit=crop",
        caption: "Professional Staff - Our caring and experienced team"
      },
      {
        website_id: websiteId,
        image_url: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&h=600&fit=crop",
        caption: "Clean Facilities - Hygienic and well-maintained facilities"
      }
    ];
    
    const { data: gallery, error: galleryError } = await adminSupabase
      .from("kennel_website_images")
      .insert(galleryData)
      .select();
    
    if (galleryError) {
      console.error("[RESTORE_WEBSITE_CONTENT] Error creating gallery:", galleryError);
      return { error: galleryError.message };
    }
    
    console.log("[RESTORE_WEBSITE_CONTENT] Created gallery images:", gallery?.length || 0);
    
    return {
      success: true,
      message: `Website content restored successfully! Created ${testimonials?.length || 0} testimonials, ${faqs?.length || 0} FAQ items, and ${gallery?.length || 0} gallery images.`,
      summary: {
        testimonials: testimonials?.length || 0,
        faqs: faqs?.length || 0,
        gallery: gallery?.length || 0
      }
    };
    
  } catch (error) {
    console.error("[RESTORE_WEBSITE_CONTENT] Error:", error);
    throw error;
  }
}); 