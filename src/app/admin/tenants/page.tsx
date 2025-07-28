"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { PlusCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

type Tenant = {
  id: string;
  name: string;
  createdAt: string;
  ownerEmail: string | null;
};

export default function TenantsPage() {
  const { t } = useTranslation();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTenantName, setNewTenantName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/tenants");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("errorFailedToFetchTenants"));
      }

      const data = await response.json();
      setTenants(data.tenants || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching tenants:", err);
      setError(
        err instanceof Error ? err.message : t("errorFailedToFetchTenants"),
      );
      toast({
        title: t("toastErrorTitle"),
        description:
          err instanceof Error ? err.message : t("errorFailedToFetchTenants"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTenantName.trim()) {
      toast({
        title: t("toastErrorTitle"),
        description: t("errorRequiredTenantName"),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newTenantName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("errorFailedToCreateTenant"));
      }

      const data = await response.json();
      toast({
        title: t("toastSuccessTitle"),
        description: t("successTenantCreated", { name: newTenantName }),
      });

      setNewTenantName("");
      fetchTenants();
    } catch (err) {
      console.error("Error creating tenant:", err);
      toast({
        title: t("toastErrorTitle"),
        description:
          err instanceof Error ? err.message : t("errorFailedToCreateTenant"),
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleConnectToTenant = async (
    tenantId: string,
    tenantName: string,
  ) => {
    try {
      setIsConnecting(true);
      const response = await fetch(`/api/admin/tenants/${tenantId}/connect`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("errorFailedToConnect"));
      }

      toast({
        title: t("toastConnectedTitle"),
        description: t("successConnectedToTenant", { name: tenantName }),
      });

      router.push("/dashboard");
    } catch (err) {
      console.error("Error connecting to tenant:", err);
      toast({
        title: t("toastErrorTitle"),
        description:
          err instanceof Error ? err.message : t("errorFailedToConnect"),
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) {
      return t("formatDateNA");
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return t("formatDateInvalid");
      }
      return date.toLocaleString();
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return t("formatDateError");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">{t("tenantManagement")}</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("createNewTenant")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTenant} className="flex gap-4">
            <Input
              placeholder={t("tenantNamePlaceholder")}
              value={newTenantName}
              onChange={(e) => setNewTenantName(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isCreating}>
              {isCreating ? t("creatingTenantButton") : t("createTenantButton")}
              <PlusCircle className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("allTenants")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">{t("loadingTenants")}</div>
          ) : error ? (
            <div className="text-center text-red-500 py-4">{error}</div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-4">{t("noTenantsFound")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">
                    {t("tableHeaderName")}
                  </TableHead>
                  <TableHead className="text-left">
                    {t("tableHeaderCreated")}
                  </TableHead>
                  <TableHead className="text-left">
                    {t("tableHeaderOwner")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("tableHeaderActions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium table-cell">
                      {tenant.name}
                    </TableCell>
                    <TableCell className="table-cell">
                      {formatDate(tenant.createdAt)}
                    </TableCell>
                    <TableCell className="table-cell">
                      {tenant.ownerEmail || "N/A"}
                    </TableCell>
                    <TableCell className="text-right table-cell">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleConnectToTenant(tenant.id, tenant.name)
                        }
                        disabled={isConnecting}
                      >
                        {isConnecting
                          ? t("connectingButton")
                          : t("connectButton")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
