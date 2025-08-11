"use client";

import React, { useState, useEffect } from "react";
import { useSupabase } from "@/contexts/SupabaseBrowserContext"; // Use context
import Link from "next/link";

type User = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  // Add other relevant user properties if needed
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { supabase } = useSupabase(); // Use context

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        setError(null);

        // Note: Directly listing Supabase Auth users client-side might require specific setup or be better handled via a server-side API route.
        // This example assumes direct access is possible/intended for simplicity here.
        // If this fails, create an API route for fetching users.
        const { data, error: listError } =
          await supabase.auth.admin.listUsers();

        if (listError) {
          throw listError;
        }

        setUsers(data.users as User[]);
      } catch (err: any) {
        console.error("Error fetching users:", err);
        setError("Failed to load users. " + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [supabase]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Global Users</h1>
        {/* Add button for inviting/creating global admin if needed */}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6">Global Administrators</h2>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : users.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No global admin users found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-right text-sm font-medium text-gray-500 border-b">
                    <th className="pb-3 pl-4">Email</th>
                    <th className="pb-3 pl-4">Created At</th>
                    <th className="pb-3 pl-4">Last Sign In</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100">
                      <td className="py-4 pl-4 font-medium">{user.email}</td>
                      <td className="py-4 pl-4">
                        {new Date(user.created_at).toLocaleString()}
                      </td>
                      <td className="py-4 pl-4">
                        {user.last_sign_in_at
                          ? new Date(user.last_sign_in_at).toLocaleString()
                          : "Never"}
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          {/* Add actions like Remove Admin status if needed */}
                          <button
                            className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 transition-colors text-sm disabled:opacity-50"
                            disabled
                          >
                            Remove (Not Impl.)
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
