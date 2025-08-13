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
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const getUser = async () => {
      try {
        const { data: { user: initialUser } } = await supabase.auth.getUser();
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setUser(initialUser);
          setSession(initialSession);
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setSession(session);
          
          // Only handle Google OAuth for new users
          if (session.user.app_metadata?.provider === 'google' && !user) {
            try {
              setIsRedirecting(true);
              
              const response = await fetch('/api/auth/create-google-user', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  supabaseUserId: session.user.id,
                  email: session.user.email,
                  name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                }),
              });

              if (!response.ok) {
                setIsRedirecting(false);
                return;
              }

              const userData = await response.json();
              
              if (userData.redirectTo === '/kennel-setup') {
                window.location.replace('/kennel-setup');
                return;
              }
              
              setIsRedirecting(false);
            } catch (error) {
              setIsRedirecting(false);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setIsRedirecting(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, user]); // Only re-run if supabase client changes or user state changes

  // Do not block rendering on auth loading; only block while actively redirecting
  if (isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading…</p>
        </div>
      </div>
    );
  }

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
