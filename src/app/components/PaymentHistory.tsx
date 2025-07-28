import { Payment, PaymentMethod } from "@/lib/supabase/types";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PaymentHistoryProps {
  payments: Payment[];
  showEditButton?: boolean;
  onEditPayment?: (paymentId: number) => void;
}

export default function PaymentHistory({
  payments,
  showEditButton = false,
  onEditPayment,
}: PaymentHistoryProps) {
  const { t, i18n } = useTranslation();

  const paymentMethodLabels: Record<PaymentMethod, string> = {
    CASH: t("cash"),
    CREDIT_CARD: t("creditCard"),
    BANK_TRANSFER: t("bankTransfer"),
    BIT: t("bit"),
  };

  if (!payments || payments.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        {t("noPaymentsToShow")}
      </div>
    );
  }

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {t("date")}
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {t("amount")}
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {t("paymentMethod")}
              </th>
              {showEditButton && (
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {t("actions")}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm text-gray-900">
                  {format(new Date(payment.createdAt), "dd/MM/yyyy")}
                </td>
                <td className="px-4 py-2 text-sm font-medium text-gray-900">
                  {formatCurrency(payment.amount, i18n.language)}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900">
                  {paymentMethodLabels[payment.method]}
                </td>
                {showEditButton && (
                  <td className="px-4 py-2 text-sm text-gray-900">
                    <button
                      onClick={() => onEditPayment && onEditPayment(payment.id)}
                      className="text-blue-600 hover:text-blue-800"
                      aria-label={t("edit")}
                    >
                      <Pencil size={16} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {t("total")}
              </td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {formatCurrency(totalPaid, i18n.language)}
              </td>
              <td colSpan={showEditButton ? 2 : 1}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
