"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, MessageSquare, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { WhatsAppLivePreview } from "@/components/WhatsAppPreview";
import { Badge } from "@/components/ui/badge";

enum TriggerType {
  BOOKING_CONFIRMATION = "BOOKING_CONFIRMATION",
  BOOKING_REMINDER = "BOOKING_REMINDER",
  CHECK_IN_REMINDER = "CHECK_IN_REMINDER",
  CHECK_OUT_REMINDER = "CHECK_OUT_REMINDER",
  PAYMENT_REMINDER = "PAYMENT_REMINDER",
  CUSTOM = "CUSTOM",
}

const triggerLabels: Record<TriggerType, string> = {
  [TriggerType.BOOKING_CONFIRMATION]: "אישור הזמנה",
  [TriggerType.BOOKING_REMINDER]: "תזכורת הזמנה",
  [TriggerType.CHECK_IN_REMINDER]: "תזכורת צ'ק אין",
  [TriggerType.CHECK_OUT_REMINDER]: "תזכורת צ'ק אאוט",
  [TriggerType.PAYMENT_REMINDER]: "תזכורת תשלום",
  [TriggerType.CUSTOM]: "מותאם אישית",
};

interface Template {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  trigger: TriggerType;
  delayHours: number;
  active: boolean;
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

export default function EditTemplatePage() {
  const params = useParams();
  const templateId = params.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<Template>({
    id: "",
    name: "",
    description: "",
    subject: "",
    body: "",
    trigger: TriggerType.BOOKING_CONFIRMATION,
    delayHours: 0,
    active: true,
  });

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoadingTemplate(true);
        const response = await fetch(
          `/api/notification-templates/${templateId}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch template");
        }

        const data = await response.json();
        setFormData(data);
      } catch (err) {
        console.error("Error fetching template:", err);
        setError(err instanceof Error ? err.message : "שגיאה בטעינת התבנית");
      } finally {
        setLoadingTemplate(false);
      }
    };

    fetchTemplate();
  }, [templateId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    if (name === "delayHours") {
      setFormData({
        ...formData,
        [name]: parseInt(value) || 0,
      });
    } else if (name === "active" && type === "checkbox") {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const { id, ...templateData } = formData;

      const response = await fetch(
        `/api/notification-templates/${templateId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(templateData),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update template");
      }

      router.push("/settings/templates");
    } catch (err) {
      console.error("Error updating template:", err);
      setError(err instanceof Error ? err.message : "שגיאה בעדכון התבנית");
    } finally {
      setLoading(false);
    }
  };

  const variablesList = [
    { name: "{firstName}", description: "שם פרטי של הלקוח" },
    { name: "{lastName}", description: "שם משפחה של הלקוח" },
    { name: "{petName}", description: "שם החיה" },
    { name: "{checkInDate}", description: "תאריך הגעה" },
    { name: "{checkOutDate}", description: "תאריך יציאה" },
    { name: "{dueAmount}", description: "סכום לתשלום" },
    { name: "{bookingId}", description: "מספר הזמנה" },
  ];

  if (loadingTemplate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-600">טוען תבנית...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">עריכת תבנית</h1>
          <p className="text-gray-500 mt-1">עדכון תבנית קיימת להודעות ווטסאפ</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-2 text-gray-700 mb-6">
            <MessageSquare className="h-5 w-5" />
            <h2 className="text-xl font-bold">פרטי התבנית</h2>
            <Badge
              variant={getTriggerBadgeVariant(formData.trigger)}
              className="mr-3"
            >
              {triggerLabels[formData.trigger as TriggerType]}
            </Badge>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  שם התבנית
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="הזן שם לתבנית"
                />
              </div>

              <div>
                <label
                  htmlFor="trigger"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  אירוע להפעלה
                </label>
                <select
                  id="trigger"
                  name="trigger"
                  required
                  value={formData.trigger}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(triggerLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  תיאור (אופציונלי)
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="תיאור קצר עבור התבנית"
                />
              </div>

              <div>
                <label
                  htmlFor="delayHours"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  השהייה (שעות)
                </label>
                <input
                  type="number"
                  id="delayHours"
                  name="delayHours"
                  min="0"
                  value={formData.delayHours}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  כותרת
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="כותרת ההודעה"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="body"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  גוף ההודעה
                </label>
                <textarea
                  id="body"
                  name="body"
                  required
                  rows={6}
                  value={formData.body}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-y"
                  placeholder="תוכן ההודעה"
                  dir="rtl"
                />

                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-2">משתנים זמינים:</p>
                  <div className="flex flex-wrap gap-2">
                    {variablesList.map((variable) => (
                      <div
                        key={variable.name}
                        className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-lg text-xs"
                        title={variable.description}
                      >
                        {variable.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* WhatsApp Preview */}
              <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-700 mb-3">
                  תצוגה מקדימה:
                </h3>
                <WhatsAppLivePreview body={formData.body} />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    name="active"
                    checked={formData.active}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="active"
                    className="mr-2 block text-sm text-gray-700"
                  >
                    הפעל תבנית זו
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Link
                href="/settings/templates"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 ml-1" />
                חזרה לרשימת תבניות
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    שומר...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    שמור שינויים
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
