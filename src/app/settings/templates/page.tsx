"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Plus, Edit, Trash, Save } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// Define types for notification templates
interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  trigger: string;
  delayHours: number;
  active: boolean;
}

enum TriggerType {
  BOOKING_CONFIRMATION = "BOOKING_CONFIRMATION",
  BOOKING_REMINDER = "BOOKING_REMINDER",
  CHECK_IN_REMINDER = "CHECK_IN_REMINDER",
  CHECK_OUT_REMINDER = "CHECK_OUT_REMINDER",
  PAYMENT_REMINDER = "PAYMENT_REMINDER",
  CUSTOM = "CUSTOM",
}

// Helper function to get badge variant based on trigger type
const getTriggerBadgeVariant = (trigger: string) => {
  switch (trigger) {
    case TriggerType.BOOKING_CONFIRMATION:
      return "default"; // Primary color
    case TriggerType.CHECK_IN_REMINDER:
      return "secondary"; // Secondary color
    case TriggerType.CHECK_OUT_REMINDER:
      return "outline"; // Outline style
    case TriggerType.PAYMENT_REMINDER:
      return "destructive"; // Destructive/red color
    default:
      return "outline"; // Default fallback
  }
};

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [editingTemplate, setEditingTemplate] =
    useState<NotificationTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notification-templates");
      if (!response.ok) throw new Error("Failed to fetch templates");

      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
      setMessage({ type: "error", text: "שגיאה בטעינת התבניות" });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (template: NotificationTemplate) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/notification-templates/${template.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...template,
            active: !template.active,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to update template status");

      // Update local state
      setTemplates(
        templates.map((t) =>
          t.id === template.id ? { ...t, active: !t.active } : t,
        ),
      );

      setMessage({ type: "success", text: "סטטוס התבנית עודכן בהצלחה" });
    } catch (error) {
      console.error("Error updating template status:", error);
      setMessage({ type: "error", text: "שגיאה בעדכון סטטוס התבנית" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק תבנית זו?")) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/notification-templates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete template");

      // Update local state
      setTemplates(templates.filter((t) => t.id !== id));
      setMessage({ type: "success", text: "התבנית נמחקה בהצלחה" });
    } catch (error) {
      console.error("Error deleting template:", error);
      setMessage({ type: "error", text: "שגיאה במחיקת התבנית" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">תבניות הודעות</h1>
          <p className="text-gray-500 mt-1">ניהול תבניות להודעות ווטסאפ</p>
        </div>
        <Link
          href="/settings/templates/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>תבנית חדשה</span>
        </Link>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-2 text-gray-700 mb-6">
            <MessageSquare className="h-5 w-5" />
            <h2 className="text-xl font-bold">תבניות הודעות</h2>
          </div>

          {loading && <p className="text-center py-4">טוען...</p>}

          {!loading && templates.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>אין תבניות הודעות.</p>
              <p className="mt-2">
                <Link
                  href="/settings/templates/new"
                  className="text-blue-600 hover:underline"
                >
                  לחץ כאן ליצירת תבנית חדשה
                </Link>
              </p>
            </div>
          )}

          {!loading && templates.length > 0 && (
            <div className="divide-y divide-gray-200">
              {templates.map((template) => (
                <div key={template.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {template.name}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {template.description || "אין תיאור"}
                      </p>
                      <div className="mt-1 text-xs text-gray-500 flex gap-2 flex-wrap">
                        <Badge
                          variant={getTriggerBadgeVariant(template.trigger)}
                          className="font-normal"
                        >
                          {template.trigger}
                        </Badge>
                        {template.delayHours > 0 && (
                          <Badge variant="outline" className="font-normal">
                            השהייה: {template.delayHours} שעות
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStatusToggle(template)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          template.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {template.active ? "פעיל" : "לא פעיל"}
                      </button>
                      <Link
                        href={`/settings/templates/${template.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Link href="/settings" className="text-blue-600 hover:underline">
          &larr; חזרה להגדרות
        </Link>
      </div>
    </div>
  );
}
