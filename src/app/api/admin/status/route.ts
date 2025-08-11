import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isGlobalAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header from the request
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 });
    }
    
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    // Verify the token using Supabase admin client
    const { data: { user }, error: authError } = await supabaseAdmin().auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    
    // Check if user is a global admin
    const adminStatus = await isGlobalAdmin();
    
    return NextResponse.json({ isAdmin: adminStatus });
  } catch (error) {
    console.error("Error in admin status check:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
