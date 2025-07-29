"use client";

import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from "chart.js";
import { useTranslation } from "react-i18next";
import { format, parse } from "date-fns";
import { enUS, he } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import ClientLayout from "../components/ClientLayout";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

interface MonthlyData {
  month: string;
  projectedTotal: number;
  actualTotal: number;
  rawDate?: Date; // Added to store the actual date object
}

function FinancialReportContent() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2025); // Default to 2025 for demo data

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/financial-report?year=${selectedYear}`,
        );
        const monthlyData = await response.json();

        // Process the data to include raw date objects
        const processedData = monthlyData.map((item: any) => {
          try {
            // The API returns month names in Hebrew, we need to parse them
            // to get the actual month number
            const monthIndex = [
              "ינואר",
              "פברואר",
              "מרץ",
              "אפריל",
              "מאי",
              "יוני",
              "יולי",
              "אוגוסט",
              "ספטמבר",
              "אוקטובר",
              "נובמבר",
              "דצמבר",
            ].findIndex((m) => item.month.includes(m));

            // Create a date object for the first of the month in the selected year
            const rawDate = new Date(selectedYear, monthIndex, 1);

            return {
              ...item,
              rawDate,
            };
          } catch (e) {
            console.error("Error parsing month:", e);
            return item;
          }
        });

        setData(processedData);
      } catch (error) {
        console.error("Error fetching financial report:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear]);

  // Function to get localized month names based on current language
  const getLocalizedMonthName = (date: Date | undefined) => {
    if (!date) return "";

    const locale = i18n.language === "he" ? he : enUS;
    return format(date, "MMMM", { locale });
  };

  const chartData: ChartData<"line"> = {
    labels: data.map((item) =>
      item.rawDate ? getLocalizedMonthName(item.rawDate) : item.month,
    ),
    datasets: [
      {
        label: t("projectedIncome"),
        data: data.map((item) => item.projectedTotal),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        tension: 0.4,
      },
      {
        label: t("actualIncome"),
        data: data.map((item) => item.actualTotal),
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.5)",
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        rtl: true,
        labels: {
          usePointStyle: true,
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        rtl: true,
        titleAlign: "right" as const,
        bodyAlign: "right" as const,
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y, i18n.language)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return formatCurrency(value, i18n.language);
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">{t("loading")}</p>
        </div>
      </div>
    );
  }

  const yearTotal = {
    projected: data.reduce((sum, month) => sum + month.projectedTotal, 0),
    actual: data.reduce((sum, month) => sum + month.actualTotal, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("financialReportTitle")}
        </h1>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label={t("selectionYear")}
        >
          {[2025, 2024, 2023, 2022, 2021].map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">
            {t("annualProjectedIncome")}
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatCurrency(yearTotal.projected, i18n.language)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">
            {t("annualActualIncome")}
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatCurrency(yearTotal.actual, i18n.language)}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <Line data={chartData} options={chartOptions} />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t("monthlyBreakdown")}</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 border-b border-gray-200">
                {t("month")}
              </th>
              <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700 border-b border-gray-200">
                {t("projectedIncome")}
              </th>
              <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700 border-b border-gray-200">
                {t("actualIncome")}
              </th>
              <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700 border-b border-gray-200">
                {t("gap")}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((month) => (
              <tr key={month.month} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6 font-medium text-gray-900">
                  {month.rawDate
                    ? getLocalizedMonthName(month.rawDate)
                    : month.month}
                </td>
                <td className="py-4 px-6 text-gray-700">
                  {formatCurrency(month.projectedTotal, i18n.language)}
                </td>
                <td className="py-4 px-6 text-gray-700">
                  {formatCurrency(month.actualTotal, i18n.language)}
                </td>
                <td className="py-4 px-6">
                  <span
                    className={`font-semibold ${
                      month.projectedTotal > month.actualTotal
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {formatCurrency(
                      Math.abs(month.projectedTotal - month.actualTotal),
                      i18n.language,
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200 bg-gray-50 font-medium">
              <td className="py-4 px-4">{t("total")}</td>
              <td className="py-4 px-4">
                {formatCurrency(yearTotal.projected, i18n.language)}
              </td>
              <td className="py-4 px-4">
                {formatCurrency(yearTotal.actual, i18n.language)}
              </td>
              <td className="py-4 px-4">
                <span
                  className={
                    yearTotal.projected > yearTotal.actual
                      ? "text-red-600"
                      : "text-green-600"
                  }
                >
                  {formatCurrency(
                    Math.abs(yearTotal.projected - yearTotal.actual),
                    i18n.language,
                  )}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default function FinancialReportPage() {
  return (
    <ClientLayout>
      <FinancialReportContent />
    </ClientLayout>
  );
}
