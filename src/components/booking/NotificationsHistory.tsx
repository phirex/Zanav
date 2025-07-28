"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { he } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, CheckCircle, AlertCircle, Send } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface NotificationInfo {
  id: string;
  templateName: string;
  templateTrigger: string;
  recipient: string;
  scheduledFor: string;
  sent: boolean;
  sentAt: string | null;
  attempts: number;
  lastError: string | null;
  variables: Record<string, string>;
  templateBody?: string;
}

interface NotificationsHistoryProps {
  bookingId: number;
}

export default function NotificationsHistory({
  bookingId,
}: NotificationsHistoryProps) {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationInfo[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/bookings/${bookingId}/notifications`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch notifications");
        }

        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast({
          title: "Error",
          description: "Failed to load notification history",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, [bookingId, refreshKey]);

  const handleForceSend = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/send`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to send notification");
      }

      toast({
        title: "הצלחה",
        description: "ההודעה נשלחה בהצלחה",
      });

      // Refresh the list
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({
        title: "שגיאה",
        description: "שליחת ההודעה נכשלה",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        לא נמצאו הודעות מתוזמנות להזמנה זו
      </div>
    );
  }

  // Sort notifications: pending first (by scheduledFor), then sent (by sentAt)
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (!a.sent && !b.sent) {
      return (
        new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
      );
    }

    if (a.sent && b.sent) {
      return new Date(b.sentAt!).getTime() - new Date(a.sentAt!).getTime();
    }

    return a.sent ? 1 : -1;
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">היסטוריית הודעות</h3>

      <div className="space-y-3">
        {sortedNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`border rounded-lg p-4 ${notification.sent ? "bg-gray-50" : "bg-white border-blue-200"}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {notification.templateName}
                  </span>
                  <Badge variant={getBadgeVariant(notification)}>
                    {notification.sent ? "נשלח" : "מתוזמן"}
                  </Badge>
                </div>

                <div className="text-sm text-gray-500 mt-1">
                  {notification.templateTrigger.replace(/_/g, " ")}
                </div>

                <div className="text-sm mt-2">אל: {notification.recipient}</div>

                <div className="flex items-center text-sm mt-2">
                  {notification.sent ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500 ml-1" />
                      <span>
                        נשלח{" "}
                        {notification.sentAt &&
                          formatDateTimeHebrew(new Date(notification.sentAt))}
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 text-blue-500 ml-1" />
                      <span>
                        מתוזמן ל-
                        {formatDateTimeHebrew(
                          new Date(notification.scheduledFor),
                        )}
                        (
                        {formatRelativeTimeHebrew(
                          new Date(notification.scheduledFor),
                        )}
                        )
                      </span>
                    </>
                  )}
                </div>

                {notification.lastError && (
                  <div className="flex items-center text-sm mt-2 text-red-500">
                    <AlertCircle className="h-4 w-4 ml-1" />
                    {notification.lastError}
                  </div>
                )}
              </div>

              {!notification.sent && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleForceSend(notification.id)}
                  className="flex items-center gap-1"
                >
                  <Send className="h-3 w-3" />
                  שלח עכשיו
                </Button>
              )}
            </div>

            {/* WhatsApp Preview */}
            <div className="mt-3 bg-[#e5f7ee] p-3 rounded-lg border border-[#dcf8c6] max-w-xs">
              <div className="text-xs text-gray-500 mb-1">תצוגה מקדימה:</div>
              <div className="text-sm whitespace-pre-line">
                {renderMessagePreview(
                  notification.variables,
                  notification.templateBody,
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to format date and time in Hebrew
function formatDateTimeHebrew(date: Date): string {
  // Adjust for Israel timezone (UTC+3)
  const israelDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  return format(israelDate, "dd/MM/yyyy HH:mm", { locale: he });
}

// Helper function to format relative time in Hebrew
function formatRelativeTimeHebrew(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: he });
}

function getBadgeVariant(notification: NotificationInfo) {
  if (notification.sent) {
    return "default";
  }

  const now = new Date();
  const scheduledFor = new Date(notification.scheduledFor);

  if (scheduledFor < now) {
    return "destructive";
  }

  if (scheduledFor.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
    return "secondary";
  }

  return "outline";
}

function renderMessagePreview(
  variables: Record<string, string>,
  templateBody?: string,
) {
  if (!templateBody) {
    // Fallback if no template body is provided
    if (variables.petName && variables.checkInDate) {
      return `Hi ${variables.firstName},\n\nYour booking for ${variables.petName} is confirmed for the dates ${variables.checkInDate} to ${variables.checkOutDate}.\n\nThank you!`;
    }
    return `Hi ${variables.firstName || "[Name]"},\n\nYour booking is confirmed.\n\nThank you!`;
  }

  // Replace variables in the template body
  let processedBody = templateBody;
  for (const [key, value] of Object.entries(variables)) {
    processedBody = processedBody.replace(
      new RegExp(`\\{${key}\\}`, "g"),
      value || "",
    );
  }

  return processedBody;
}
