"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Dog {
  name: string;
  breed: string;
  specialNeeds?: string | null;
}

export default function NewClientPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [dogs, setDogs] = useState<Dog[]>([{ name: "", breed: "" }]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/owners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          dogs,
        }),
      });

      if (response.ok) {
        router.push("/clients");
      } else {
        alert(t("errorSavingClient"));
      }
    } catch (error) {
      console.error("Error creating client:", error);
      alert(t("errorSavingClient"));
    } finally {
      setLoading(false);
    }
  };

  const addDog = () => {
    setDogs([...dogs, { name: "", breed: "" }]);
  };

  const removeDog = (index: number) => {
    if (dogs.length === 1) return;
    setDogs(dogs.filter((_, i) => i !== index));
  };

  const updateDog = (index: number, field: keyof Dog, value: string) => {
    const newDogs = [...dogs];
    newDogs[index] = { ...newDogs[index], [field]: value };
    setDogs(newDogs);
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">{t("createNewClient")}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
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
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">{t("dogs")}</h2>
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
                <h3 className="font-medium">
                  {t("dogNumber", { number: index + 1 })}
                </h3>
                {dogs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDog(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("dogName", "Name")}
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
                    onChange={(e) => updateDog(index, "breed", e.target.value)}
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

        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-600 hover:text-gray-700"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? t("saving") : t("save")}
          </button>
        </div>
      </form>
    </div>
  );
}
