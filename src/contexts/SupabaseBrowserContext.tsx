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
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      setUser(user);
      setSession(session);
      setLoading(false);
    };

    getUser();

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
              // Check if user already exists in our database
              const { data: existingUser, error: userCheckError } = await supabase
                .from('User')
                .select('id, tenantId')
                .eq('supabaseUserId', user.id)
                .maybeSingle();

              if (userCheckError) {
                console.error("❌ Error checking existing user:", userCheckError);
                return;
              }

              if (!existingUser) {
                console.log("🆕 Creating new user record for Google OAuth user...");
                
                // Create user record via our API
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
                console.log("✅ User already exists:", existingUser.id);
                
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
            }
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

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
