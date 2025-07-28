"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface WhatsAppPreviewProps {
  body: string;
  variables?: Record<string, string>;
}

export default function WhatsAppPreview({
  body,
  variables = {},
}: WhatsAppPreviewProps) {
  const [preview, setPreview] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update the preview when body or variables change
  useEffect(() => {
    let result = body;

    // Replace each variable in the message body
    for (const [key, value] of Object.entries(variables)) {
      // Replace {variableName} with the actual value
      const regex = new RegExp(`\\{${key}\\}`, "g");
      result = result.replace(regex, value);
    }

    // Replace any remaining variables with placeholders
    result = result.replace(/\{(\w+)\}/g, "[...]");

    setPreview(result);
  }, [body, variables]);

  // Update the current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Sample demo values for any missing variables
  const demoVariables = {
    firstName: "ישראל",
    lastName: "ישראלי",
    petName: "רקסי",
    checkInDate: "01/01/2023",
    checkOutDate: "05/01/2023",
    dueAmount: "₪500",
    bookingId: "12345",
    ...variables,
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden max-w-sm mx-auto">
      {/* WhatsApp header */}
      <div className="bg-[#128C7E] text-white p-3 flex items-center">
        <div className="flex-1">
          <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center mr-3 float-right">
            <span className="text-[#128C7E] text-xs font-bold">🐶</span>
          </div>
          <div>
            <p className="font-semibold text-right">פנסיון לכלבים</p>
            <p className="text-xs text-right opacity-80">מקוון כעת</p>
          </div>
        </div>
      </div>

      {/* Chat body */}
      <div className="bg-[#ECE5DD] p-3 min-h-[200px]">
        {/* System message */}
        <div className="bg-[#FFEFB3] text-center py-1 px-3 rounded-lg text-xs text-[#333] mx-auto my-2 max-w-[80%]">
          ההודעות מוגנות בהצפנה מקצה לקצה
        </div>

        {/* Message bubble */}
        <div className="flex flex-col items-end mt-4">
          <div className="bg-[#DCF8C6] rounded-lg p-3 max-w-[80%] shadow-sm">
            <div className="text-sm whitespace-pre-line dir-rtl">
              {preview || "הודעה ריקה"}
            </div>
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="text-[10px] text-gray-500">
                {format(currentTime, "HH:mm")}
              </span>
              <CheckCircle2 className="h-3 w-3 text-[#34B7F1] fill-[#34B7F1]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Function to generate a live preview with user-provided values
export function WhatsAppLivePreview({
  body,
  onChange,
  showVariables = true,
}: {
  body: string;
  onChange?: (variables: Record<string, string>) => void;
  showVariables?: boolean;
}) {
  const [variables, setVariables] = useState<Record<string, string>>({
    firstName: "ישראל",
    lastName: "ישראלי",
    petName: "רקסי",
    checkInDate: "01/01/2023",
    checkOutDate: "05/01/2023",
    dueAmount: "₪500",
    bookingId: "12345",
  });

  // Extract variable names from the body
  const [extractedVars, setExtractedVars] = useState<string[]>([]);

  useEffect(() => {
    // Find all variables in the format {variableName}
    const found = Array.from(body.matchAll(/\{(\w+)\}/g), (m) => m[1]);
    const uniqueVars = [...new Set(found)];
    setExtractedVars(uniqueVars);

    // Update the onChange handler with current variables
    if (onChange) {
      onChange(variables);
    }
  }, [body, variables, onChange]);

  const handleVariableChange = (key: string, value: string) => {
    const newVariables = { ...variables, [key]: value };
    setVariables(newVariables);

    if (onChange) {
      onChange(newVariables);
    }
  };

  return (
    <div className="space-y-4">
      <WhatsAppPreview body={body} variables={variables} />

      {showVariables && extractedVars.length > 0 && (
        <div className="border rounded-lg p-3 bg-gray-50">
          <p className="text-sm font-medium mb-2">ערכי משתנים להדגמה:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {extractedVars.map((key) => (
              <div key={key} className="flex items-center">
                <label className="text-xs text-gray-500 w-28">{key}:</label>
                <input
                  type="text"
                  value={variables[key] || ""}
                  onChange={(e) => handleVariableChange(key, e.target.value)}
                  className="text-sm border rounded px-2 py-1 flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
