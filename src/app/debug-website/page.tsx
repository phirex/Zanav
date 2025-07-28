"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

export default function DebugWebsitePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkWebsiteData = async () => {
    setLoading(true);
    try {
      // Get tenant ID from localStorage
      const tenantId = localStorage.getItem("tenantId");
      if (!tenantId) {
        toast({
          title: "Error",
          description: "No tenant ID found in localStorage",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/debug-website", {
        headers: {
          "x-tenant-id": tenantId,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
        console.log("Debug data:", result);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch debug data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to check website data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDemoData = async () => {
    setLoading(true);
    try {
      const tenantId = localStorage.getItem("tenantId");
      if (!tenantId) {
        toast({
          title: "Error",
          description: "No tenant ID found",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/generate-demo-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: "Demo data generated successfully",
        });
        console.log("Demo data result:", result);
        // Refresh the debug data
        await checkWebsiteData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to generate demo data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to generate demo data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Website Data Debug</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={checkWebsiteData}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Check Website Data"}
        </button>
        
        <button
          onClick={generateDemoData}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 ml-2"
        >
          {loading ? "Generating..." : "Generate Demo Data"}
        </button>
      </div>

      {data && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded border">
            <h2 className="text-lg font-semibold mb-2">Tenant Data</h2>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(data.tenant, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-4 rounded border">
            <h2 className="text-lg font-semibold mb-2">Website Data</h2>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(data.website, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-4 rounded border">
            <h2 className="text-lg font-semibold mb-2">Gallery Images ({data.galleryImages?.length || 0})</h2>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(data.galleryImages, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-4 rounded border">
            <h2 className="text-lg font-semibold mb-2">Testimonials ({data.testimonials?.length || 0})</h2>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(data.testimonials, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-4 rounded border">
            <h2 className="text-lg font-semibold mb-2">FAQs ({data.faqs?.length || 0})</h2>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(data.faqs, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-4 rounded border">
            <h2 className="text-lg font-semibold mb-2">Errors</h2>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(data.errors, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 