"use client";

import React, { useState, useEffect } from "react";
import { useSupabase } from "@/contexts/SupabaseBrowserContext"; // Use context
import { Role } from "@/lib/auth";
import Link from "next/link";
import ClientLayout from "../components/ClientLayout";

type UserWithRole = {
  userId: string;
  role: Role;
  user: {
    id: string;
    email: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
  };
};

function UsersContent() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { supabase } = useSupabase(); // Use context
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>(Role.VIEWER);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [supabase]); // Re-fetch if supabase instance changes (shouldn't with context)

  async function fetchUsers() {
    try {
      setLoading(true);
      setError(null);

      // Fetch users for the current tenant via API
      const response = await fetch("/api/users");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update role");
      }

      // Refresh user list on success
      fetchUsers();
      alert("Role updated successfully!");
    } catch (error: any) {
      console.error("Error updating role:", error);
      alert("Failed to update role: " + error.message);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (confirm("Are you sure you want to remove this user?")) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to remove user");
        }

        // Refresh user list on success
        fetchUsers();
        alert("User removed successfully!");
      } catch (error: any) {
        console.error("Error removing user:", error);
        alert("Failed to remove user: " + error.message);
      }
    }
  };

  async function handleInviteUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      setInviteLoading(true);
      setInviteError(null);
      setInviteSuccess(null);

      // Validate the input
      if (!inviteEmail) {
        setInviteError("Email is required");
        return;
      }

      // Create payload for API
      const payload = {
        email: inviteEmail,
        name: inviteName || `${inviteFirstName} ${inviteLastName}`.trim(), // Fall back to combined first/last if name not provided
        firstName: inviteFirstName,
        lastName: inviteLastName,
        role: inviteRole,
        createWithPassword: false, // Invitations don't set passwords initially
      };

      // Send API request
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to invite user");
      }

      // Success - clear form & show message
      setInviteSuccess(`User ${inviteEmail} has been invited successfully`);
      setInviteEmail("");
      setInviteName("");
      setInviteFirstName("");
      setInviteLastName("");
      setInviteRole(Role.VIEWER);

      // Refresh the user list
      fetchUsers();
    } catch (err: any) {
      console.error("Error inviting user:", err);
      setInviteError(err.message || "Failed to invite user");
    } finally {
      setInviteLoading(false);
    }
  }

  function getRoleBadgeColor(role: Role) {
    // Implement the logic to determine the color based on the role
    // This is a placeholder and should be replaced with the actual implementation
    return "bg-gray-200 text-gray-800";
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Users</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6">Invite New User</h2>

          {inviteError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
              {inviteError}
            </div>
          )}

          {inviteSuccess && (
            <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6">
              {inviteSuccess}
            </div>
          )}

          <form onSubmit={handleInviteUser}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Role
                </label>
                <select
                  id="role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={Role.OWNER}>Owner</option>
                  <option value={Role.ADMIN}>Admin</option>
                  <option value={Role.STAFF}>Staff</option>
                  <option value={Role.VIEWER}>Viewer</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={inviteFirstName}
                  onChange={(e) => setInviteFirstName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="First name"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={inviteLastName}
                  onChange={(e) => setInviteLastName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={inviteLoading || !inviteEmail}
              >
                {inviteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Inviting User...</span>
                  </>
                ) : (
                  <span>Invite User</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6">Current Users</h2>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : users.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No users found for this tenant.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-right text-sm font-medium text-gray-500 border-b">
                    <th className="pb-3 pl-4">Email</th>
                    <th className="pb-3 pl-4">Name</th>
                    <th className="pb-3 pl-4">Role</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userRole) => (
                    <tr
                      key={userRole.userId}
                      className="border-b border-gray-100"
                    >
                      <td className="py-3 pl-4 text-gray-900">
                        {userRole.user.email}
                      </td>
                      <td className="py-3 pl-4 text-gray-900">
                        {userRole.user.firstName && userRole.user.lastName
                          ? `${userRole.user.firstName} ${userRole.user.lastName}`
                          : userRole.user.name || "-"}
                      </td>
                      <td className="py-3 pl-4">
                        <span
                          className={`inline-block py-1 px-2 rounded-full text-xs ${getRoleBadgeColor(userRole.role)}`}
                        >
                          {userRole.role}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleRemoveUser(userRole.userId)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
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

export default function UsersPage() {
  return (
    <ClientLayout>
      <UsersContent />
    </ClientLayout>
  );
}
