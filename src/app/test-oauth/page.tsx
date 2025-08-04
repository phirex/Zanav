"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function TestOAuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const testOAuth = async () => {
    setLoading(true);
    setError(null);
    setUrl(null);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(`OAuth Error: ${error.message}`);
        console.error("OAuth error:", error);
      } else {
        setUrl(data.url);
        console.log("OAuth URL generated:", data.url);
      }
    } catch (err) {
      setError(`Exception: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error("Exception:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            OAuth Test
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Test Google OAuth Configuration
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={testOAuth}
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {loading ? "Testing..." : "Test Google OAuth"}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {url && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
              <p className="font-medium">OAuth URL Generated Successfully!</p>
              <p className="text-sm mt-1">URL: {url.substring(0, 100)}...</p>
              <button
                onClick={() => window.open(url, '_blank')}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Open OAuth URL
              </button>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500">
          <p>This test will help identify if the issue is with:</p>
          <ul className="list-disc list-inside mt-1">
            <li>Google OAuth configuration</li>
            <li>Supabase OAuth setup</li>
            <li>Redirect URI configuration</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 