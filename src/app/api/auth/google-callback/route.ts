import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(`${origin}/login?error=OAuth failed: ${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=No authorization code received`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: 'https://zanav.io/api/auth/google-callback',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      return NextResponse.redirect(`${origin}/login?error=Token exchange failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.redirect(`${origin}/login?error=Failed to get user info`);
    }

    const userData = await userResponse.json();
    console.log("Google user data:", userData);

    // Create or get user in Supabase
    const adminSupabase = supabaseAdmin();
    
    // Check if user exists
    const { data: existingUser, error: userError } = await adminSupabase
      .from("User")
      .select("id, supabaseUserId")
      .eq("email", userData.email)
      .maybeSingle();

    let supabaseUserId: string;

    if (existingUser && existingUser.supabaseUserId) {
      // User exists, get their Supabase auth user
      supabaseUserId = existingUser.supabaseUserId;
    } else {
      // Create new user in Supabase Auth
      const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
        email: userData.email,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          picture: userData.picture,
        },
      });

      if (authError || !authData.user) {
        console.error("Error creating auth user:", authError);
        return NextResponse.redirect(`${origin}/login?error=Failed to create user`);
      }

      supabaseUserId = authData.user.id;

      // Create User record
      const { error: userRecordError } = await adminSupabase
        .from("User")
        .insert({
          supabaseUserId,
          email: userData.email,
          name: userData.name,
          firstName: userData.given_name || userData.name,
          lastName: userData.family_name || "",
        });

      if (userRecordError) {
        console.error("Error creating user record:", userRecordError);
        return NextResponse.redirect(`${origin}/login?error=Failed to create user record`);
      }
    }

    // For now, just redirect to dashboard - we'll handle session management separately
    return NextResponse.redirect(`${origin}/?google_auth_success=true`);

  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(`${origin}/login?error=OAuth callback failed`);
  }
} 