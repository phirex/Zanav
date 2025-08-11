import { createHandler } from "@/lib/apiHandler";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log("🔐 Auth callback started");
  
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log("📋 Auth callback params:", { code: !!code, error, errorDescription });

    if (error) {
      console.error("❌ OAuth error:", error, errorDescription);
      return NextResponse.redirect(new URL('/login?error=' + encodeURIComponent(error), request.url));
    }

    if (!code) {
      console.error("❌ No code provided");
      return NextResponse.redirect(new URL('/login?error=no_code', request.url));
    }

    // Exchange code for session
    const supabase = supabaseAdmin();
    console.log("🔄 Exchanging code for session...");
    
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error("❌ Code exchange failed:", exchangeError);
      return NextResponse.redirect(new URL('/login?error=exchange_failed', request.url));
    }

    if (!data.session || !data.user) {
      console.error("❌ No session or user in exchange response");
      return NextResponse.redirect(new URL('/login?error=no_session', request.url));
    }

    console.log("✅ Session created for user:", data.user.email);
    console.log("🆔 Supabase User ID:", data.user.id);

    // Check if user already exists in our database
    const adminSupabase = supabaseAdmin();
    
    console.log("🔍 Checking if user exists in database...");
    const { data: existingUser, error: userLookupError } = await adminSupabase
      .from("User")
      .select("*")
      .eq("supabaseUserId", data.user.id)
      .maybeSingle();

    if (userLookupError) {
      console.error("❌ User lookup error:", userLookupError);
      return NextResponse.redirect(new URL('/login?error=user_lookup_failed', request.url));
    }

    let userId: string;
    let tenantId: string | null = null;

    if (existingUser) {
      console.log("✅ Existing user found:", existingUser.id);
      userId = existingUser.id;
      tenantId = existingUser.tenantId;
    } else {
      console.log("🆕 Creating new user...");
      
      // Check if user exists by email (for users who signed up before Google OAuth)
      const { data: existingUserByEmail, error: emailLookupError } = await adminSupabase
        .from("User")
        .select("*")
        .eq("email", data.user.email || '')
        .maybeSingle();

      if (emailLookupError) {
        console.error("❌ Email lookup error:", emailLookupError);
        return NextResponse.redirect(new URL('/login?error=email_lookup_failed', request.url));
      }

      if (existingUserByEmail) {
        console.log("🔄 User exists by email, updating supabaseUserId...");
        
        const { error: updateError } = await adminSupabase
          .from("User")
          .update({ supabaseUserId: data.user.id })
          .eq("id", existingUserByEmail.id);

        if (updateError) {
          console.error("❌ Failed to update supabaseUserId:", updateError);
          return NextResponse.redirect(new URL('/login?error=update_failed', request.url));
        }

        userId = existingUserByEmail.id;
        tenantId = existingUserByEmail.tenantId;
        console.log("✅ Updated existing user with supabaseUserId");
      } else {
        console.log("🆕 Creating completely new user and tenant...");
        
        // Create new tenant
        const { data: newTenant, error: tenantError } = await adminSupabase
          .from("Tenant")
          .insert({
            name: `Kennel for ${data.user.email || 'User'}`,
            subdomain: null
          })
          .select()
          .single();

        if (tenantError) {
          console.error("❌ Failed to create tenant:", tenantError);
          return NextResponse.redirect(new URL('/login?error=tenant_creation_failed', request.url));
        }

        console.log("✅ Created new tenant:", newTenant.id);

        // Create new user
        const { data: newUser, error: userError } = await adminSupabase
          .from("User")
          .insert({
            email: data.user.email || '',
            name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
            supabaseUserId: data.user.id,
            tenantId: newTenant.id
          })
          .select()
          .single();

        if (userError) {
          console.error("❌ Failed to create user:", userError);
          return NextResponse.redirect(new URL('/login?error=user_creation_failed', request.url));
        }

        console.log("✅ Created new user:", newUser.id);

        // Create UserTenant link
        const { error: linkError } = await adminSupabase
          .from("UserTenant")
          .insert({
            user_id: newUser.id,
            tenant_id: newTenant.id,
            role: 'admin'
          });

        if (linkError) {
          console.error("❌ Failed to create UserTenant link:", linkError);
          return NextResponse.redirect(new URL('/login?error=link_creation_failed', request.url));
        }

        console.log("✅ Created UserTenant link");

        userId = newUser.id;
        tenantId = newTenant.id;
      }
    }

    // Check if user has rooms (to determine redirect)
    let redirectPath = '/dashboard';
    
    if (tenantId) {
      console.log("🔍 Checking if tenant has rooms...");
      const { data: rooms, error: roomsError } = await adminSupabase
        .from("Room")
        .select("id")
        .eq("tenantId", tenantId);

      if (roomsError) {
        console.error("❌ Rooms lookup error:", roomsError);
      } else if (!rooms || rooms.length === 0) {
        console.log("🏗️ No rooms found, redirecting to kennel setup");
        redirectPath = '/kennel-setup';
      } else {
        console.log(`✅ Found ${rooms.length} rooms, redirecting to dashboard`);
      }
    } else {
      console.log("⚠️ No tenant ID, redirecting to kennel setup");
      redirectPath = '/kennel-setup';
    }

    console.log("🎯 Final redirect path:", redirectPath);

    // Set the session cookie and redirect
    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    
    // Copy the session cookie from Supabase
    const setCookieHeader = data.session.access_token;
    if (setCookieHeader) {
      response.cookies.set('sb-access-token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
      
      response.cookies.set('sb-refresh-token', data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
    }

    console.log("✅ Auth callback completed successfully");
    return response;

  } catch (error) {
    console.error("💥 Auth callback exception:", error);
    return NextResponse.redirect(new URL('/login?error=callback_exception', request.url));
  }
} 