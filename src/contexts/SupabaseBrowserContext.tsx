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
    const getUser = async () => {
      try {
        const { data: { user: initialUser } } = await supabase.auth.getUser();
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        setUser(initialUser);
        setSession(initialSession);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setSession(session);
          
          if (session.user.app_metadata?.provider === 'google') {
            try {
              // Set redirecting state to prevent dashboard rendering
              setIsRedirecting(true);
              
              // Create user record via our API (it will handle checking if user exists)
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
                const errorData = await response.json();
                setIsRedirecting(false);
                return;
              }

              const userData = await response.json();
              
              // Redirect based on API response
              if (userData.redirectTo === '/kennel-setup') {
                window.location.replace('/kennel-setup');
                return; // Exit early to prevent further processing
              }
              
              // If we get here, user should stay on current page
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
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Show loading or prevent rendering while redirecting
  if (loading || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your account...</p>
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
