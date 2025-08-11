"use client";

import { useSupabase } from "@/contexts/SupabaseBrowserContext";
import { useEffect, useState } from "react";

export default function DebugContextPage() {
  const { supabase, user, session, loading } = useSupabase();
  const [testResult, setTestResult] = useState<string>("");

  useEffect(() => {
    console.log("🔍 DebugContextPage: Context state:", { 
      user: user?.email, 
      session: !!session, 
      loading,
      supabase: !!supabase 
    });
  }, [user, session, loading, supabase]);

  const testAuthStateChange = async () => {
    try {
      setTestResult("Testing onAuthStateChange...");
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event: string, session: any) => {
          console.log("🔐 Test onAuthStateChange fired:", event, session?.user?.email);
          setTestResult(`✅ onAuthStateChange fired: ${event} - ${session?.user?.email || 'no user'}`);
        }
      );

      // Test if we can get the current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log("🔍 Current session:", currentSession?.user?.email);
      
      setTestResult(prev => prev + ` | Current session: ${currentSession?.user?.email || 'none'}`);

      // Cleanup subscription after 5 seconds
      setTimeout(() => {
        subscription.unsubscribe();
        console.log("🔧 Test subscription cleaned up");
      }, 5000);

    } catch (error) {
      console.error("❌ Test error:", error);
      setTestResult(`❌ Error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase Context Debug</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Context State</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {loading ? "Yes" : "No"}</p>
            <p><strong>User:</strong> {user?.email || "None"}</p>
            <p><strong>Session:</strong> {session ? "Active" : "None"}</p>
            <p><strong>Supabase Client:</strong> {supabase ? "Available" : "None"}</p>
            <p><strong>User ID:</strong> {user?.id || "None"}</p>
            <p><strong>Provider:</strong> {user?.app_metadata?.provider || "None"}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test onAuthStateChange</h2>
          <button
            onClick={testAuthStateChange}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test onAuthStateChange
          </button>
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <strong>Result:</strong> {testResult || "Click button to test"}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Console Logs</h2>
          <p className="text-gray-600">
            Check the browser console for detailed debugging information.
            Look for logs starting with 🔧, 🔍, and 🔐.
          </p>
        </div>
      </div>
    </div>
  );
} 