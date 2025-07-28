import { NextRequest, NextResponse } from "next/server";
import {
  supabaseStorageServer,
  KENNEL_WEBSITE_BUCKET,
} from "@/lib/supabase/storage";

export async function POST(request: NextRequest) {
  try {
    console.log("Upload API called");
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const path = formData.get("path") as string;

    console.log("Upload request:", {
      path,
      fileSize: file?.size,
      fileType: file?.type,
    });

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!path) {
      return NextResponse.json({ error: "No path provided" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log("File converted to buffer, size:", buffer.length);

    // Upload to remote storage using server client
    const supabase = supabaseStorageServer();

    console.log(
      "Supabase client created, attempting upload to bucket:",
      KENNEL_WEBSITE_BUCKET,
    );

    // First, check if bucket exists
    const { data: buckets, error: bucketError } =
      await supabase.storage.listBuckets();
    console.log(
      "Available buckets:",
      buckets?.map((b) => b.name),
    );

    if (bucketError) {
      console.error("Error listing buckets:", bucketError);
    }

    const { data, error } = await supabase.storage
      .from(KENNEL_WEBSITE_BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 },
      );
    }

    console.log("Upload successful:", data);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(KENNEL_WEBSITE_BUCKET)
      .getPublicUrl(path);

    console.log("Public URL generated:", urlData.publicUrl);

    return NextResponse.json({
      url: urlData.publicUrl,
      path: data.path,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
