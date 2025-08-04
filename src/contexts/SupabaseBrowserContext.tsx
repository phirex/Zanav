"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type SupabaseContextType = {
  supabase: SupabaseClient<Database>;
  user: User | null;
  isLoading: boolean;
  error: Error | null;
};

const SupabaseContext = createContext<SupabaseContextType | undefined>(
  undefined,
);

export default function SupabaseProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize the client only once
  const [supabase] = useState(() => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase environment variables");
      }

      return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
    } catch (err) {
      console.error("Error initializing Supabase client:", err);
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to initialize Supabase client"),
      );
      return null;
    }
  });

  // Handle auth state changes
  useEffect(() => {
    if (!supabase) return;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting initial session:", error);
          setError(error);
        } else {
          setUser(session?.user ?? null);
          
          // If this is an OAuth user, ensure they have a User record
          if (session?.user && session.user.app_metadata?.provider === 'google') {
            await handleOAuthUser(session.user);
          }
        }
      } catch (err) {
        console.error("Error in getInitialSession:", err);
        setError(err instanceof Error ? err : new Error("Failed to get session"));
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        setUser(session?.user ?? null);
        
        // Handle OAuth user creation for new sign-ins
        if (event === 'SIGNED_IN' && session?.user && session.user.app_metadata?.provider === 'google') {
          await handleOAuthUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Handle OAuth user creation
  const handleOAuthUser = async (user: User) => {
    try {
      console.log("Handling OAuth user:", user.email);
      
      // Call our API to ensure user record exists
      const response = await fetch('/api/auth/oauth-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user }),
      });

      if (!response.ok) {
        console.error("Failed to create OAuth user record:", await response.text());
      } else {
        console.log("OAuth user record created/verified successfully");
      }
    } catch (err) {
      console.error("Error handling OAuth user:", err);
    }
  };

  // Show error state only
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center text-red-600">
          <p>Error: {error.message}</p>
          <p className="mt-2 text-sm">
            Please refresh the page or contact support if the problem persists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SupabaseContext.Provider value={{ supabase: supabase!, user, isLoading, error }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context.supabase;
};

export const useAuth = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a SupabaseProvider");
  }
  return { user: context.user, isLoading: context.isLoading };
};
