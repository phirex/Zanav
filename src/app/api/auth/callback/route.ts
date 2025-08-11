import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { supabaseAdmin } from "@/lib/supabase/server";

// Follow the same pattern as regular signup - create user record first, then handle session
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  console.log("[Auth Callback] Starting callback with code:", !!code, "next:", next);

  if (!code) {
    console.log("[Auth Callback] No code provided, redirecting to login");
    const errorUrl = new URL("/login", origin);
    errorUrl.searchParams.set("error", "Authentication code missing");
    return NextResponse.redirect(errorUrl);
  }

  try {
    // Use admin client to create user records (bypasses RLS)
    const adminSupabase = supabaseAdmin();
    
    // Exchange the code for a session to get user info
    const { data, error } = await adminSupabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[Auth Callback] Error exchanging code:", error.message);
      throw error;
    }

    if (!data.user) {
      console.error("[Auth Callback] No user data after code exchange");
      throw new Error("No user data received");
    }

    console.log("[Auth Callback] Code exchange successful for user:", data.user.email);

    // Check if user already exists in our User table
    const { data: existingUser, error: userCheckError } = await adminSupabase
      .from('User')
      .select('id, tenantId, supabaseUserId')
      .eq('supabaseUserId', data.user.id)
      .maybeSingle();

    if (userCheckError) {
      console.error("[Auth Callback] Error checking existing user:", userCheckError);
      throw userCheckError;
    }

    let redirectPath = next;

    if (!existingUser) {
      console.log("[Auth Callback] User doesn't exist, creating new user record");
      
      // Also check if user exists by email (in case they signed up before with different method)
      let existingUserByEmail = null;
      if (data.user.email) {
        const { data: emailUser, error: emailError } = await adminSupabase
          .from('User')
          .select('id, tenantId, supabaseUserId')
          .eq('email', data.user.email)
          .maybeSingle();

        if (emailError) {
          console.error("[Auth Callback] Error checking user by email:", emailError);
        } else if (emailUser) {
          existingUserByEmail = emailUser;
          console.log("[Auth Callback] Found existing user by email:", emailUser.id);
        }
      }

      if (existingUserByEmail) {
        // Update existing user with supabaseUserId
        console.log("[Auth Callback] Updating existing user with supabaseUserId");
        const { error: updateError } = await adminSupabase
          .from('User')
          .update({ supabaseUserId: data.user.id })
          .eq('id', existingUserByEmail.id);

        if (updateError) {
          console.error("[Auth Callback] Error updating user with supabaseUserId:", updateError);
          throw updateError;
        }

        // Check if user has completed kennel setup
        if (existingUserByEmail.tenantId) {
          const { data: roomCount, error: roomError } = await adminSupabase
            .from('Room')
            .select('id', { count: 'exact' })
            .eq('tenantId', existingUserByEmail.tenantId);

          if (roomError) {
            console.error("[Auth Callback] Error checking rooms:", roomError);
          } else if (!roomCount || roomCount.length === 0) {
            console.log("[Auth Callback] User has no rooms, redirecting to kennel setup");
            redirectPath = '/kennel-setup';
          }
        } else {
          console.log("[Auth Callback] User has no tenant, redirecting to kennel setup");
          redirectPath = '/kennel-setup';
        }
      } else {
        // Create new user record (following same pattern as regular signup)
        console.log("[Auth Callback] Creating new user record for:", data.user.email);
        
        // Create a new tenant for the user
        const { data: newTenant, error: tenantError } = await adminSupabase
          .from('Tenant')
          .insert({
            name: `${data.user.user_metadata?.full_name || data.user.email}'s Kennel`,
            subdomain: null, // Will be set during kennel setup
            createdAt: new Date().toISOString(),
          })
          .select()
          .single();

        if (tenantError) {
          console.error("[Auth Callback] Error creating tenant:", tenantError);
          throw tenantError;
        }

        console.log("[Auth Callback] Created new tenant:", newTenant.id);

        // Create the user record (same structure as regular signup)
        const { data: newUser, error: createError } = await adminSupabase
          .from('User')
          .insert({
            supabaseUserId: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.full_name || (data.user.email ? data.user.email.split('@')[0] : 'User'),
            firstName: data.user.user_metadata?.full_name?.split(' ')[0] || (data.user.email ? data.user.email.split('@')[0] : 'User'),
            lastName: data.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            tenantId: newTenant.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error("[Auth Callback] Error creating user:", createError);
          throw createError;
        }

        console.log("[Auth Callback] User record created successfully:", newUser.id);

        // Create UserTenant link with admin role
        const { error: userTenantError } = await adminSupabase
          .from('UserTenant')
          .insert({
            user_id: newUser.id,
            tenant_id: newTenant.id,
            role: 'admin'
          });

        if (userTenantError) {
          console.error("[Auth Callback] Error creating user-tenant link:", userTenantError);
          // Don't throw - user is still created
        } else {
          console.log("[Auth Callback] UserTenant link created successfully");
        }

        // Redirect first-time users to kennel setup
        redirectPath = '/kennel-setup';
      }
    } else {
      console.log("[Auth Callback] User already exists with tenant:", existingUser.tenantId);
      
      // Check if user has completed kennel setup
      if (existingUser.tenantId) {
        const { data: roomCount, error: roomError } = await adminSupabase
          .from('Room')
          .select('id', { count: 'exact' })
          .eq('tenantId', existingUser.tenantId);

        if (roomError) {
          console.error("[Auth Callback] Error checking rooms:", roomError);
        } else if (!roomCount || roomCount.length === 0) {
          console.log("[Auth Callback] User has no rooms, redirecting to kennel setup");
          redirectPath = '/kennel-setup';
        }
      } else {
        console.log("[Auth Callback] User has no tenant, redirecting to kennel setup");
        redirectPath = '/kennel-setup';
      }
    }

    // Now let Supabase handle the session by redirecting to the callback URL
    // This ensures the session is properly established
    const callbackUrl = `${origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`;
    
    console.log("[Auth Callback] Redirecting to callback URL:", callbackUrl);
    
    // Redirect to Supabase's callback handling
    return NextResponse.redirect(callbackUrl);

  } catch (error) {
    console.error("[Auth Callback] Exception during user creation:", error);
    
    // Redirect to login with error
    const errorUrl = new URL("/login", origin);
    errorUrl.searchParams.set("error", "Failed to create user account. Please try again.");
    return NextResponse.redirect(errorUrl);
  }
} 