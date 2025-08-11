"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Crown, User, Building } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSupabase } from "@/contexts/SupabaseBrowserContext";

type GlobalAdmin = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string | null;
  supabaseUserId: string;
};

type UserWithTenants = {
  id: string;
  email: string | null;
  name: string | null;
  createdAt: string;
  tenantId: string | null;
  tenantName?: string;
  role?: string;
};

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const [globalAdmins, setGlobalAdmins] = useState<GlobalAdmin[]>([]);
  const [regularUsers, setRegularUsers] = useState<UserWithTenants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'admins' | 'users'>('admins');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No access token available');
        setError('No access token available');
        return;
      }

      // Fetch global admins with proper authorization
      const adminsResponse = await fetch('/api/admin/global-admins', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (adminsResponse.ok) {
        const adminsData = await adminsResponse.json();
        setGlobalAdmins(adminsData.admins || []);
      } else {
        console.error('Failed to fetch admins:', adminsResponse.status, adminsResponse.statusText);
      }

      // Fetch regular users with proper authorization
      const usersResponse = await fetch('/api/admin/all-users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setRegularUsers(usersData.users || []);
      } else {
        console.error('Failed to fetch users:', usersResponse.status, usersResponse.statusText);
      }

    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. " + err.message);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from global admin status?`)) {
      return;
    }

    try {
      // Get the current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: "Error",
          description: "No access token available",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/admin/remove-admin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ adminId })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `${email} removed from global admin`,
        });
        fetchUsers(); // Refresh the list
      } else {
        throw new Error('Failed to remove admin');
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to remove admin",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return "Invalid Date";
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Global Users</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        <button
          onClick={() => setActiveTab('admins')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'admins'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Crown className="h-4 w-4" />
          Global Admins ({globalAdmins.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'users'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <User className="h-4 w-4" />
          All Users ({regularUsers.length})
        </button>
      </div>

      {/* Global Admins Tab */}
      {activeTab === 'admins' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Global Administrators
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : globalAdmins.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Crown className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No global administrators found</p>
                <p className="text-sm mt-1">Use the "Promote to Admin" button in the sidebar to add one</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {globalAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        {admin.name || 'Unnamed User'}
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{formatDate(admin.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove Admin
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Users Tab */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              All Platform Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : regularUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No users found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regularUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name || 'Unnamed User'}
                      </TableCell>
                      <TableCell>{user.email || 'No email'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          {user.tenantName || 'No tenant'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.role || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
