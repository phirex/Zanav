import { NextRequest, NextResponse } from "next/server";
import {
  supabaseStorageServer,
  KENNEL_WEBSITE_BUCKET,
} from "@/lib/supabase/storage";

export async function GET(request: NextRequest) {
  try {
    console.log("Testing storage connection...");

    const supabase = supabaseStorageServer();

    // List all buckets
    const { data: buckets, error: bucketError } =
      await supabase.storage.listBuckets();

    if (bucketError) {
      console.error("Error listing buckets:", bucketError);
      return NextResponse.json(
        {
          error: "Failed to list buckets",
          details: bucketError,
        },
        { status: 500 },
      );
    }

    console.log(
      "Available buckets:",
      buckets?.map((b) => b.name),
    );

    // Check if our bucket exists
    const bucketExists = buckets?.some((b) => b.name === KENNEL_WEBSITE_BUCKET);

    if (!bucketExists) {
      console.log("Bucket does not exist, creating it...");

      // Try to create the bucket
      const { data: createData, error: createError } =
        await supabase.storage.createBucket(KENNEL_WEBSITE_BUCKET, {
          public: true,
          allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
          fileSizeLimit: 10485760, // 10MB
        });

      if (createError) {
        console.error("Error creating bucket:", createError);
        return NextResponse.json(
          {
            error: "Failed to create bucket",
            details: createError,
          },
          { status: 500 },
        );
      }

      console.log("Bucket created successfully:", createData);
    }

    return NextResponse.json({
      success: true,
      buckets: buckets?.map((b) => b.name),
      targetBucket: KENNEL_WEBSITE_BUCKET,
      bucketExists: bucketExists || true,
    });
  } catch (error) {
    console.error("Storage test error:", error);
    return NextResponse.json(
      {
        error: "Storage test failed",
        details: error,
      },
      { status: 500 },
    );
  }
}
