import { NextRequest, NextResponse } from "next/server";
import { createBrowserClient } from "@supabase/ssr";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Test with minimal OAuth parameters
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${request.nextUrl.origin}/auth/callback`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      console.error("OAuth error details:", {
        message: error.message,
        status: error.status,
        name: error.name,
        stack: error.stack
      });
      
      return NextResponse.json({
        success: false,
        error: error.message,
        errorDetails: {
          status: error.status,
          name: error.name
        }
      });
    }

    return NextResponse.json({
      success: true,
      url: data.url,
      provider: data.provider
    });

  } catch (error) {
    console.error("OAuth test exception:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      type: "exception"
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { provider } = await request.json();
    
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Test different OAuth providers
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider || 'google',
      options: {
        redirectTo: `${request.nextUrl.origin}/auth/callback`,
      },
    });

    if (error) {
      return NextResponse.json({
        success: false,
        provider,
        error: error.message,
        errorDetails: {
          status: error.status,
          name: error.name
        }
      });
    }

    return NextResponse.json({
      success: true,
      provider,
      url: data.url
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      type: "exception"
    });
  }
} 