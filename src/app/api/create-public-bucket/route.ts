import { NextRequest, NextResponse } from "next/server";
import {
  supabaseStorageServer,
  KENNEL_WEBSITE_BUCKET,
} from "@/lib/supabase/storage";

export async function POST(request: NextRequest) {
  try {
    console.log("Creating public bucket...");

    const supabase = supabaseStorageServer();

    // First, check if bucket exists
    const { data: buckets, error: bucketError } =
      await supabase.storage.listBuckets();

    if (bucketError) {
      console.error("Error listing buckets:", bucketError);
      return NextResponse.json(
        { error: "Failed to list buckets" },
        { status: 500 },
      );
    }

    const bucketExists = buckets?.some((b) => b.name === KENNEL_WEBSITE_BUCKET);

    if (bucketExists) {
      console.log("Bucket already exists, updating to public...");

      // Update existing bucket to be public
      const { data: updateData, error: updateError } =
        await supabase.storage.updateBucket(KENNEL_WEBSITE_BUCKET, {
          public: true,
        });

      if (updateError) {
        console.error("Error updating bucket:", updateError);
        return NextResponse.json(
          { error: "Failed to update bucket" },
          { status: 500 },
        );
      }

      console.log("Bucket updated successfully:", updateData);
    } else {
      console.log("Creating new public bucket...");

      // Create new public bucket
      const { data: createData, error: createError } =
        await supabase.storage.createBucket(KENNEL_WEBSITE_BUCKET, {
          public: true,
          allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
          fileSizeLimit: 10485760, // 10MB
        });

      if (createError) {
        console.error("Error creating bucket:", createError);
        return NextResponse.json(
          { error: "Failed to create bucket" },
          { status: 500 },
        );
      }

      console.log("Bucket created successfully:", createData);
    }

    return NextResponse.json({
      success: true,
      message: "Bucket is now public",
      bucket: KENNEL_WEBSITE_BUCKET,
    });
  } catch (error) {
    console.error("Create bucket error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
