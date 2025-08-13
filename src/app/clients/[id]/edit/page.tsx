"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import ClientLayout from "@/app/components/ClientLayout";
import { useTranslation } from "react-i18next";

interface DogForm {
  id?: number;
  name: string;
  breed: string;
  specialNeeds?: string | null;
}

interface OwnerResponse {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  dogs: Array<{
    id: number;
    name: string;
    breed: string;
    specialNeeds?: string | null;
  }>;
}

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [dogs, setDogs] = useState<DogForm[]>([]);

  // Load owner details
  useEffect(() => {
    const idParam = Number(params?.id);
    if (!idParam || Number.isNaN(idParam)) return;
    let isMounted = true;

    async function loadOwner() {
      try {
        setLoading(true);
        const res = await fetch(`/api/owners/${idParam}`);
        if (!res.ok) throw new Error("Failed to fetch owner");
        const data: OwnerResponse = await res.json();
        if (!isMounted) return;
        setOwnerId(data.id);
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
        });
        setDogs(
          (data.dogs || []).map((d) => ({
            id: d.id,
            name: d.name || "",
            breed: d.breed || "",
            specialNeeds: d.specialNeeds ?? null,
          })),
        );
      } catch (e) {
        console.error("Failed to load owner", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadOwner();
    return () => {
      isMounted = false;
    };
  }, [params?.id]);

  // If addDog=true is present and there is no empty dog entry, add one
  useEffect(() => {
    const addDog = searchParams?.get("addDog");
    if (addDog && dogs.length && !dogs.some((d) => !d.name && !d.breed)) {
      setDogs((prev) => [...prev, { name: "", breed: "" }]);
    }
    if (addDog && dogs.length === 0) {
      setDogs([{ name: "", breed: "" }]);
    }
  }, [searchParams, dogs.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerId) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/owners`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ownerId,
          ...formData,
          dogs,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const msg = payload?.error?.message || payload?.error || response.statusText;
        throw new Error(msg || "Failed to update owner");
      }
      router.push(`/clients/${ownerId}`);
    } catch (error) {
      console.error("Error updating client", error);
      alert(t("errorSavingClient", "Error saving client"));
    } finally {
      setSaving(false);
    }
  };

  const addDog = () => setDogs((prev) => [...prev, { name: "", breed: "" }]);
  const removeDog = (index: number) => setDogs((prev) => prev.filter((_, i) => i !== index));
  const updateDog = (index: number, field: keyof DogForm, value: string) => {
    setDogs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value } as DogForm;
      return next;
    });
  };

  return (
    <ClientLayout>
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">{t("editClient", "Edit Client")}</h1>
        {loading ? (
          <div className="text-gray-600">{t("loading", "Loading...")}</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("fullName", "Full Name")}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("phone", "Phone")}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("email", "Email")}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("address", "Address")}
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">{t("dogs", "Dogs")}</h2>
                <button type="button" onClick={addDog} className="text-blue-600 hover:text-blue-700">
                  {t("addDog", "Add Dog")}
                </button>
              </div>
              {dogs.map((dog, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{t("dogNumber", { number: index + 1 })}</h3>
                    <button type="button" onClick={() => removeDog(index)} className="text-red-600 hover:text-red-700">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("dogName", "Name")}</label>
                      <input
                        type="text"
                        value={dog.name}
                        onChange={(e) => updateDog(index, "name", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("breed", "Breed")}</label>
                      <input
                        type="text"
                        value={dog.breed}
                        onChange={(e) => updateDog(index, "breed", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("specialNeeds", "Special Needs")}</label>
                      <textarea
                        value={dog.specialNeeds || ""}
                        onChange={(e) => updateDog(index, "specialNeeds", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-4">
              <button type="button" onClick={() => router.back()} className="px-4 py-2 text-gray-600 hover:text-gray-700">
                {t("cancel", "Cancel")}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? t("saving", "Saving...") : t("save", "Save")}
              </button>
            </div>
          </form>
        )}
      </div>
    </ClientLayout>
  );
}


