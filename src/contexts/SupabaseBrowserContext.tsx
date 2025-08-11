"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { User, Session } from "@supabase/supabase-js";

interface SupabaseContextType {
  supabase: ReturnType<typeof createBrowserClient>;
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseBrowserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("🔧 SupabaseBrowserProvider: Initializing...");
  
  const [supabase] = useState(() => {
    console.log("🔧 Creating Supabase browser client...");
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  });

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🔧 SupabaseBrowserProvider: useEffect started");
    
    const getUser = async () => {
      console.log("🔧 Getting initial user and session...");
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: { session } } = await supabase.auth.getSession();
        console.log("🔧 Initial user:", user?.email, "Initial session:", !!session);
        setUser(user);
        setSession(session);
        setLoading(false);
      } catch (error) {
        console.error("🔧 Error getting initial user/session:", error);
        setLoading(false);
      }
    };

    getUser();

    console.log("🔧 Setting up onAuthStateChange listener...");
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔐 Auth state change:", event, session?.user?.email);
        
        setUser(session?.user ?? null);
        setSession(session);
        setLoading(false);

        // Handle Google OAuth user creation
        if (event === 'SIGNED_IN' && session?.user) {
          const user = session.user;
          console.log("🆕 User signed in:", user.email, "Provider:", user.app_metadata?.provider);
          
          // Only handle Google OAuth users
          if (user.app_metadata?.provider === 'google') {
            console.log("🔄 Processing Google OAuth user creation...");
            
            try {
              console.log("🔍 Step 1: Checking if user exists in database...");
              console.log("🔍 User ID to search for:", user.id);
              console.log("🔍 User email:", user.email);
              
              // Check if user already exists in our database
              const { data: existingUser, error: userCheckError } = await supabase
                .from('User')
                .select('id, tenantId')
                .eq('supabaseUserId', user.id)
                .maybeSingle();

              console.log("🔍 Database query result:", { existingUser, userCheckError });

              if (userCheckError) {
                console.error("❌ Error checking existing user:", userCheckError);
                return;
              }

              console.log("🔍 Step 2: User check result:", existingUser ? `Found user ${existingUser.id}` : "No existing user");

              if (!existingUser) {
                console.log("🆕 Step 3: Creating new user record for Google OAuth user...");
                
                // Create user record via our API
                console.log("🔍 Step 4: Calling /api/auth/create-google-user...");
                const response = await fetch('/api/auth/create-google-user', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    supabaseUserId: user.id,
                    email: user.email,
                    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                  }),
                });

                console.log("🔍 Step 5: API response status:", response.status);

                if (!response.ok) {
                  const errorData = await response.json();
                  console.error("❌ Failed to create user record:", errorData);
                  return;
                }

                const userData = await response.json();
                console.log("✅ User record created successfully:", userData);
                
                // Redirect to kennel setup if this is a new user
                if (userData.redirectTo === '/kennel-setup') {
                  console.log("🏗️ Redirecting new user to kennel setup");
                  window.location.href = '/kennel-setup';
                }
              } else {
                console.log("✅ Step 3: User already exists:", existingUser.id);
                
                // Check if user has rooms (to determine redirect)
                if (existingUser.tenantId) {
                  const { data: rooms, error: roomsError } = await supabase
                    .from('Room')
                    .select('id')
                    .eq('tenantId', existingUser.tenantId);

                  if (!roomsError && rooms && rooms.length > 0) {
                    console.log(`✅ User has ${rooms.length} rooms, staying on dashboard`);
                  } else {
                    console.log("🏗️ User has no rooms, redirecting to kennel setup");
                    window.location.href = '/kennel-setup';
                  }
                } else {
                  console.log("🏗️ User has no tenant, redirecting to kennel setup");
                  window.location.href = '/kennel-setup';
                }
              }
            } catch (error) {
              console.error("💥 Error in Google OAuth user creation:", error);
              if (error instanceof Error) {
                console.error("💥 Error details:", {
                  message: error.message,
                  stack: error.stack,
                  name: error.name
                });
              } else {
                console.error("💥 Unknown error type:", typeof error, error);
              }
            }
          }
        }
      }
    );

    console.log("🔧 onAuthStateChange listener set up successfully");

    return () => {
      console.log("🔧 Cleaning up onAuthStateChange subscription");
      subscription.unsubscribe();
    };
  }, [supabase]);

  console.log("🔧 SupabaseBrowserProvider: Rendering with user:", user?.email, "loading:", loading);

  return (
    <SupabaseContext.Provider value={{ supabase, user, session, loading }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseBrowserProvider");
  }
  return context;
}
