"use client";

import { Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { fetchWithTenant, createTenantHeaders } from "@/lib/client-tenant";
import { useTranslation } from "react-i18next";
import ClientLayout from "../components/ClientLayout";

interface Dog {
  id?: number;
  name: string;
  breed: string;
  specialNeeds?: string | null;
}

interface Owner {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  dogs: Dog[];
  bookings: {
    id: number;
  }[];
}

interface EditModalProps {
  owner: Owner | null;
  onClose: () => void;
  onSave: (owner: Owner, dogs: Dog[]) => void;
}

function EditModal({ owner, onClose, onSave }: EditModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: owner?.name || "",
    email: owner?.email || "",
    phone: owner?.phone || "",
    address: owner?.address || "",
  });
  const [dogs, setDogs] = useState<Dog[]>(owner?.dogs || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...owner!, ...formData }, dogs);
  };

  const addDog = () => {
    setDogs([...dogs, { name: "", breed: "" }]);
  };

  const removeDog = (index: number) => {
    setDogs(dogs.filter((_, i) => i !== index));
  };

  const updateDog = (index: number, field: keyof Dog, value: string) => {
    const newDogs = [...dogs];
    newDogs[index] = { ...newDogs[index], [field]: value };
    setDogs(newDogs);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">{t("editClient")}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("fullName")}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                required
                placeholder={t("fullName")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("phone")}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                required
                placeholder={t("phone")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("email")}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                placeholder={t("email")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("address")}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                placeholder={t("address")}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{t("dogs")}</h3>
              <button
                type="button"
                onClick={addDog}
                className="text-blue-600 hover:text-blue-700"
              >
                {t("addDog")}
              </button>
            </div>
            {dogs.map((dog, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    {t("dogNumber", { number: index + 1 })}
                  </h4>
                  <button
                    type="button"
                    onClick={() => removeDog(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("tableHeaderName")}
                    </label>
                    <input
                      type="text"
                      value={dog.name}
                      onChange={(e) => updateDog(index, "name", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("breed")}
                    </label>
                    <input
                      type="text"
                      value={dog.breed}
                      onChange={(e) =>
                        updateDog(index, "breed", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("specialNeeds")}
                    </label>
                    <textarea
                      value={dog.specialNeeds || ""}
                      onChange={(e) =>
                        updateDog(index, "specialNeeds", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-700"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            >
              {t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ClientsContent() {
  const { t } = useTranslation();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);

  const fetchOwners = async () => {
    try {
      setLoading(true);

      // Use the fetchWithTenant utility
      const data = await fetchWithTenant<Owner[]>("/api/owners");

      if (Array.isArray(data)) {
        setOwners(data);
      } else {
        console.error("Invalid owners data format:", data);
        setOwners([]);
      }
    } catch (error) {
      console.error("Error fetching owners:", error);
      setOwners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const handleEdit = (owner: Owner) => {
    setEditingOwner(owner);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("confirmDeleteClient"))) {
      return;
    }

    try {
      const headers = createTenantHeaders();

      const response = await fetch(`/api/owners?id=${id}`, {
        method: "DELETE",
        headers,
      });

      if (response.ok) {
        await fetchOwners();
      } else {
        alert(t("errorDeletingClient"));
      }
    } catch (error) {
      console.error("Error deleting owner:", error);
      alert(t("errorDeletingClient"));
    }
  };

  const handleSave = async (owner: Owner, dogs: Dog[]) => {
    try {
      const headers = createTenantHeaders({
        "Content-Type": "application/json",
      });

      const response = await fetch("/api/owners", {
        method: "PUT",
        headers,
        body: JSON.stringify({ ...owner, dogs }),
      });

      if (response.ok) {
        setEditingOwner(null);
        await fetchOwners();
      } else {
        alert(t("errorSavingClient"));
      }
    } catch (error) {
      console.error("Error saving owner:", error);
      alert(t("errorSavingClient"));
    }
  };

  const filteredOwners =
    owners && Array.isArray(owners)
      ? owners.filter(
          (owner) =>
            owner.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            owner.phone?.includes(searchQuery) ||
            (owner.email?.toLowerCase() || "").includes(
              searchQuery.toLowerCase(),
            ) ||
            (owner.dogs &&
              Array.isArray(owner.dogs) &&
              owner.dogs.some(
                (dog) =>
                  dog?.name
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                  dog?.breed?.toLowerCase().includes(searchQuery.toLowerCase()),
              )),
        )
      : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("clientsTitle")}
          </h1>
          <p className="text-gray-500 mt-1">{t("clientsSubtitle")}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t("searchClients")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 pr-10 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
          <Link
            href="/clients/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            {t("newClient")}
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6">
          {loading ? (
            <div className="text-center py-4">{t("loading")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-700">
                <thead className="bg-gray-50 text-gray-600 uppercase tracking-wide text-xs">
                  <tr>
                    <th className="py-3 px-4 text-left font-semibold">
                      {t("fullName")}
                    </th>
                    <th className="py-3 px-4 text-left font-semibold">
                      {t("phone")}
                    </th>
                    <th className="py-3 px-4 text-left font-semibold">
                      {t("email")}
                    </th>
                    <th className="py-3 px-4 text-left font-semibold">
                      {t("dogs")}
                    </th>
                    <th className="py-3 px-4 text-left font-semibold">
                      {t("visits")}
                    </th>
                    <th className="py-3 px-4 text-left font-semibold">
                      {t("tableHeaderActions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOwners.map((owner) => (
                    <tr
                      key={owner.id}
                      className="hover:bg-gray-50 odd:bg-white even:bg-gray-50"
                    >
                      <td className="py-4 px-4 whitespace-nowrap font-medium text-blue-600 hover:text-blue-700">
                        <Link href={`/clients/${owner.id}`}>{owner.name}</Link>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        {owner.phone}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        {owner.email || "-"}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        {Array.isArray(owner.dogs)
                          ? owner.dogs
                              .map((dog) => dog?.name)
                              .filter(Boolean)
                              .join(", ")
                          : "-"}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        {Array.isArray(owner.bookings)
                          ? owner.bookings.length
                          : 0}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(owner)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {t("edit")}
                          </button>
                          <button
                            onClick={() => handleDelete(owner.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            {t("delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editingOwner && (
        <EditModal
          owner={editingOwner}
          onClose={() => setEditingOwner(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default function ClientsPage() {
  return (
    <ClientLayout>
      <ClientsContent />
    </ClientLayout>
  );
}
