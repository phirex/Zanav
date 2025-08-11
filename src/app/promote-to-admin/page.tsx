"use client";

import React, { useState } from "react";
import { Crown, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function PromoteToAdminPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [message, setMessage] = useState("");

  const handlePromoteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setPromoting(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/promote-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage(`✅ ${result.message}`);
        setEmail("");
        setName("");
      } else {
        setMessage(`❌ ${result.error}`);
      }
    } catch (error) {
      setMessage("❌ Failed to promote user. Please try again.");
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-3 rounded-full">
            <Crown className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Promote to Global Admin</h1>
            <p className="text-gray-600 mt-1">
              Promote a user to global administrator status
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Promote User to Global Admin
          </h2>
          <p className="text-gray-600">
            This will give the user access to all system-wide functions including tenant management, 
            user management, and global settings. Use this carefully.
          </p>
        </div>
        
        <form onSubmit={handlePromoteUser} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              User Email *
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="user@example.com"
              required
            />
          </div>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Display Name (Optional)
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="User's display name"
            />
          </div>
          
          <button
            type="submit"
            disabled={promoting || !email.trim()}
            className="w-full bg-purple-600 text-white px-4 py-3 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {promoting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Promoting User...
              </>
            ) : (
              <>
                <Crown className="h-4 w-4" />
                Promote to Global Admin
              </>
            )}
          </button>
        </form>

        {message && (
          <div className={`mt-6 p-4 rounded-md ${
            message.startsWith("✅") ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• The user will be added to the GlobalAdmin table</li>
          <li>• They'll gain access to the /admin dashboard</li>
          <li>• They can manage tenants, users, and system settings</li>
          <li>• They'll see the Global Admin sidebar when accessing admin functions</li>
        </ul>
      </div>
    </div>
  );
} 