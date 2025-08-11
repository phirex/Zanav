"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building, Globe, ArrowRight, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface Tenant {
  id: string;
  name: string;
  subdomain: string | null;
  createdAt: string;
  ownerEmail: string | null;
}

export default function SelectTenantPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchUserTenants();
  }, []);

  const fetchUserTenants = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the current user's tenants
      const response = await fetch('/api/admin/user-tenants');
      
      if (!response.ok) {
        throw new Error('Failed to fetch user tenants');
      }

      const data = await response.json();
      setTenants(data.tenants || []);
      
      // Auto-select if only one tenant
      if (data.tenants && data.tenants.length === 1) {
        setSelectedTenantId(data.tenants[0].id);
      }
    } catch (err) {
      console.error('Error fetching user tenants:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleTenantSelect = (tenantId: string) => {
    setSelectedTenantId(tenantId);
  };

  const handleConnectToTenant = async () => {
    if (!selectedTenantId) {
      toast({
        title: "No Tenant Selected",
        description: "Please select a kennel to continue",
        variant: "destructive",
      });
      return;
    }

    try {
      setConnecting(true);
      
      // Use the regular user connect endpoint, not the admin one
      const response = await fetch(`/api/tenants/${selectedTenantId}/connect`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to connect to tenant');
      }

      toast({
        title: "Success",
        description: "Connected to kennel successfully",
      });

      // Redirect to dashboard
      router.push('/');
      
    } catch (err) {
      console.error('Error connecting to tenant:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to connect to kennel',
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your kennels...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Building className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Kennels</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchUserTenants}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <Building className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Kennels Found</h2>
          <p className="text-gray-600 mb-4">You don't have access to any kennels yet.</p>
          <Button onClick={() => router.push('/kennel-setup')}>Set Up Your First Kennel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building className="h-12 w-12 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Select Your Kennel</h1>
          </div>
          <p className="text-gray-600 text-lg">
            You have access to {tenants.length} kennel{tenants.length !== 1 ? 's' : ''}. 
            Choose which one you'd like to access.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <Card 
              key={tenant.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedTenantId === tenant.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:bg-white'
              }`}
              onClick={() => handleTenantSelect(tenant.id)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="h-5 w-5 text-blue-600" />
                  {tenant.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tenant.subdomain && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Globe className="h-4 w-4" />
                    <a 
                      href={`https://${tenant.subdomain}.zanav.io`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {tenant.subdomain}.zanav.io
                    </a>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{tenant.ownerEmail || 'No owner'}</span>
                </div>
                
                <div className="text-sm text-gray-500">
                  Created: {formatDate(tenant.createdAt)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedTenantId && (
          <div className="mt-8 text-center">
            <Button 
              onClick={handleConnectToTenant}
              disabled={connecting}
              size="lg"
              className="px-8 py-3"
            >
              {connecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </>
              ) : (
                <>
                  Continue to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 