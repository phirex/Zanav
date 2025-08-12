"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Dog, User, DollarSign } from "lucide-react";
import { useTranslation } from "react-i18next";
import ClientLayout from "@/app/components/ClientLayout";

interface Owner {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  dogs: Dog[];
}

interface Dog {
  id: number;
  name: string;
  breed: string;
  specialNeeds?: string;
}

interface Room {
  id: number;
  name: string;
  displayName: string;
  capacity: number;
  maxCapacity: number;
}

interface DogWithRoom {
  id?: number;
  name: string;
  breed: string;
  specialNeeds?: string;
  roomId?: number;
}

export default function NewBookingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [selectedDogs, setSelectedDogs] = useState<DogWithRoom[]>([]);
  const [isNewClient, setIsNewClient] = useState(false);
  const [isNewDog, setIsNewDog] = useState(false);
  const [priceType, setPriceType] = useState<"DAILY" | "FIXED">("DAILY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pricePerDay, setPricePerDay] = useState(150);
  const [totalPrice, setTotalPrice] = useState(0);
  const [newDogs, setNewDogs] = useState<DogWithRoom[]>([
    { name: "", breed: "", specialNeeds: "", roomId: undefined },
  ]);
  const [exemptLastDay, setExemptLastDay] = useState(false);

  useEffect(() => {
    // Fetch owners and rooms
    const fetchData = async () => {
      try {
        const [ownersRes, roomsRes] = await Promise.all([
          fetch("/api/owners"),
          fetch("/api/rooms"),
        ]);
        const ownersData = await ownersRes.json();
        const roomsData = await roomsRes.json();
        setOwners(ownersData);
        setRooms(roomsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleOwnerSelect = (ownerId: string) => {
    if (ownerId === "new") {
      setIsNewClient(true);
      setSelectedOwner(null);
      setSelectedDogs([]);
    } else {
      const owner = owners.find((o) => o.id === parseInt(ownerId));
      setIsNewClient(false);
      setSelectedOwner(owner || null);
      setSelectedDogs([]);
    }
  };

  const handleDogToggle = (dog: Dog) => {
    setSelectedDogs((prev) => {
      const isSelected = prev.some((d) => d.id === dog.id);
      if (isSelected) {
        return prev.filter((d) => d.id !== dog.id);
      } else {
        return [
          ...prev,
          {
            id: dog.id,
            name: dog.name,
            breed: dog.breed,
            specialNeeds: dog.specialNeeds || "",
            roomId: undefined,
          },
        ];
      }
    });
  };

  const handleDogRoomSelect = (dogId: number | undefined, roomId: number) => {
    if (isNewClient) {
      setNewDogs((prev) =>
        prev.map((dog) =>
          dog === newDogs.find((d, idx) => dogId === idx)
            ? { ...dog, roomId }
            : dog,
        ),
      );
    } else {
      setSelectedDogs((prev) =>
        prev.map((dog) => (dog.id === dogId ? { ...dog, roomId } : dog)),
      );
    }
  };

  const addNewDog = () => {
    setNewDogs((prev) => [
      ...prev,
      { name: "", breed: "", specialNeeds: "", roomId: undefined },
    ]);
  };

  const removeNewDog = (index: number) => {
    setNewDogs((prev) => prev.filter((_, i) => i !== index));
  };

  const updateNewDog = (
    index: number,
    field: keyof (typeof newDogs)[0],
    value: string,
  ) => {
    setNewDogs((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const startDay = start.getDate();
    const startMonth = start.getMonth();
    const startYear = start.getFullYear();

    const endDay = end.getDate();
    const endMonth = end.getMonth();
    const endYear = end.getFullYear();

    // Calculate diff in days and add 1 to include both start and end dates
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const startDateOnly = new Date(startYear, startMonth, startDay).getTime();
    const endDateOnly = new Date(endYear, endMonth, endDay).getTime();
    const days =
      Math.round((endDateOnly - startDateOnly) / millisecondsPerDay) + 1;

    // If exemptLastDay is true, subtract 1 day
    return exemptLastDay ? days - 1 : days;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate dates
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      if (endDateObj < startDateObj) {
        throw new Error(t("invalidDates"));
      }

      // Validate that all dogs have rooms assigned
      const dogsToCheck = isNewClient ? newDogs : selectedDogs;
      const unassignedDogs = dogsToCheck.filter((dog) => !dog.roomId);

      if (unassignedDogs.length > 0) {
        throw new Error(t("selectDogRoom"));
      }

      if (!isNewClient && selectedDogs.length === 0) {
        throw new Error(t("selectDog"));
      }

      const formData = new FormData(e.currentTarget);
      const bookingData = {
        startDate: formData.get("startDate"),
        endDate: formData.get("endDate"),
        priceType: formData.get("priceType"),
        pricePerDay:
          priceType === "DAILY"
            ? parseFloat(formData.get("pricePerDay") as string)
            : null,
        totalPrice:
          priceType === "FIXED"
            ? parseFloat(formData.get("totalPrice") as string)
            : null,
        paymentMethod: formData.get("paymentMethod"),
        exemptLastDay,

        // For existing client
        ...(!isNewClient && {
          ownerId: selectedOwner?.id,
          dogs: selectedDogs.map((dog) => ({
            id: dog.id,
            roomId: dog.roomId,
          })),
        }),

        // For new client
        isNewClient,
        ...(isNewClient && {
          ownerName:
            `${formData.get("firstName")} ${formData.get("lastName")}`.trim(),
          ownerEmail: formData.get("ownerEmail"),
          ownerPhone: formData.get("ownerPhone"),
          ownerAddress: formData.get("ownerAddress"),
          newDogs: newDogs.map((dog) => ({
            name: dog.name,
            breed: dog.breed,
            specialNeeds: dog.specialNeeds,
            roomId: dog.roomId,
          })),
        }),
      };

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create booking");
      }

      router.push("/bookings");
    } catch (error) {
      console.error("Error creating booking:", error);
      alert(
        error instanceof Error ? error.message : "Failed to create booking",
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate total price for all dogs
  const calculateTotalPrice = () => {
    const numDogs = isNewClient ? newDogs.length : selectedDogs.length;
    if (numDogs === 0) return 0;

    if (priceType === "DAILY") {
      const days = calculateDays();
      return days * pricePerDay * numDogs;
    } else {
      return totalPrice;
    }
  };

  return (
    <ClientLayout>
      <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("newBookingTitle")}</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Booking Details Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">{t("bookingDetails")}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("entryDate")}
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("exitDate")}
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                required
              />
            </div>
          </div>
        </div>

        {/* Owner Selection Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">{t("selectOwner")}</h2>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                onChange={(e) => handleOwnerSelect(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>
                  -- {t("selectOwner")} --
                </option>
                <option value="new">{t("selectNewOwner")}</option>
                {Array.isArray(owners)
                  ? owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name} ({owner.dogs.length} {t("dogs")})
                      </option>
                    ))
                  : null}
              </select>
            </div>
          </div>
        </div>

        {/* New Client Form */}
        {isNewClient && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">
              {t("clientInformation")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("firstName")}
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("lastName")}
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="ownerEmail"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("ownerEmail")}
                </label>
                <input
                  type="email"
                  id="ownerEmail"
                  name="ownerEmail"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label
                  htmlFor="ownerPhone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("ownerPhone")}
                </label>
                <input
                  type="tel"
                  id="ownerPhone"
                  name="ownerPhone"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="ownerAddress"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("ownerAddress")}
                </label>
                <input
                  type="text"
                  id="ownerAddress"
                  name="ownerAddress"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
            </div>
          </div>
        )}

        {/* Dog Selection Section */}
        {!isNewClient && selectedOwner && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">{t("selectDogs")}</h2>

            {selectedOwner.dogs.length === 0 ? (
              <p className="text-gray-500">{t("noDogs")}</p>
            ) : (
              <div className="space-y-4">
                {selectedOwner.dogs.map((dog) => (
                  <div
                    key={dog.id}
                    className="flex items-center justify-between border p-4 rounded-lg"
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`dog-${dog.id}`}
                        className="h-5 w-5 text-blue-600 rounded"
                        checked={selectedDogs.some((d) => d.id === dog.id)}
                        onChange={() => handleDogToggle(dog)}
                      />
                      <label
                        htmlFor={`dog-${dog.id}`}
                        className="ms-3 block text-sm font-medium text-gray-700"
                      >
                        {dog.name} ({dog.breed})
                      </label>
                    </div>

                    {selectedDogs.some((d) => d.id === dog.id) && (
                      <div className="ml-auto w-48">
                        <select
                          className="rounded-lg border border-gray-300 px-3 py-2 w-full"
                          value={
                            selectedDogs.find((d) => d.id === dog.id)?.roomId ||
                            ""
                          }
                          onChange={(e) =>
                            handleDogRoomSelect(
                              dog.id,
                              parseInt(e.target.value),
                            )
                          }
                        >
                          <option value="" disabled>
                            -- {t("selectRoom")} --
                          </option>
                          {rooms.map((room) => (
                            <option key={room.id} value={room.id}>
                              {room.displayName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* New Dog Forms (for new clients) */}
        {isNewClient && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">
              {t("dogInformation")}
            </h2>

            {newDogs.map((dog, index) => (
              <div key={index} className="p-4 border rounded-lg mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">
                    {t("dogNumber", { number: index + 1 })}
                  </h3>
                  {newDogs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeNewDog(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      {t("removeDog")}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("newDogName")}
                    </label>
                    <input
                      type="text"
                      value={dog.name}
                      onChange={(e) =>
                        updateNewDog(index, "name", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("newDogBreed")}
                    </label>
                    <input
                      type="text"
                      value={dog.breed}
                      onChange={(e) =>
                        updateNewDog(index, "breed", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("specialNeeds")}
                    </label>
                    <textarea
                      value={dog.specialNeeds}
                      onChange={(e) =>
                        updateNewDog(index, "specialNeeds", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      rows={2}
                      placeholder={t("specialNeedsPlaceholder")}
                    ></textarea>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("selectRoomForDog", {
                        name: dog.name || `#${index + 1}`,
                      })}
                    </label>
                    <select
                      value={dog.roomId || ""}
                      onChange={(e) =>
                        handleDogRoomSelect(index, parseInt(e.target.value))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      required
                    >
                      <option value="" disabled>
                        -- {t("selectRoom")} --
                      </option>
                      {rooms.length > 0 ? (
                        rooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.displayName}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          {t("noRoomsAvailable")}
                        </option>
                      )}
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addNewDog}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
            >
              {t("addAnotherDog")}
            </button>
          </div>
        )}

        {/* Price Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">
            {t("priceInformation")}
          </h2>

          <div className="space-y-6">
            <div>
              <div className="flex space-x-4 mb-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="priceType"
                    value="DAILY"
                    checked={priceType === "DAILY"}
                    onChange={() => setPriceType("DAILY")}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">{t("dailyRate")}</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="priceType"
                    value="FIXED"
                    checked={priceType === "FIXED"}
                    onChange={() => setPriceType("FIXED")}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">{t("fixedPrice")}</span>
                </label>
              </div>

              {priceType === "DAILY" ? (
                <div>
                  <label
                    htmlFor="pricePerDay"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t("priceDailyRate")}
                  </label>
                  <input
                    type="number"
                    id="pricePerDay"
                    name="pricePerDay"
                    value={pricePerDay}
                    onChange={(e) =>
                      setPricePerDay(parseFloat(e.target.value) || 0)
                    }
                    className="w-full md:w-1/3 rounded-lg border border-gray-300 px-3 py-2"
                    min="0"
                    step="10"
                    required={priceType === "DAILY"}
                  />
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="totalPrice"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t("totalPriceFixed")}
                  </label>
                  <input
                    type="number"
                    id="totalPrice"
                    name="totalPrice"
                    value={totalPrice}
                    onChange={(e) =>
                      setTotalPrice(parseFloat(e.target.value) || 0)
                    }
                    className="w-full md:w-1/3 rounded-lg border border-gray-300 px-3 py-2"
                    min="0"
                    step="10"
                    required={priceType === "FIXED"}
                  />
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="exemptLastDay"
                  checked={exemptLastDay}
                  onChange={() => setExemptLastDay(!exemptLastDay)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label
                  htmlFor="exemptLastDay"
                  className="ml-2 block text-sm text-gray-700"
                >
                  {t("exemptLastDay")}
                </label>
              </div>

              <button
                type="button"
                onClick={calculateTotalPrice}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                {t("calculateTotal")}
              </button>

              <div className="text-sm text-gray-700 mt-3 space-y-1">
                <p>
                  {t("totalDays")} {calculateDays()}
                </p>
                <p>
                  {t("numberOfDogs")}{" "}
                  {(isNewClient ? newDogs.length : selectedDogs.length) || 0}
                </p>
                {priceType === "DAILY" && (
                  <p className="font-semibold">
                    {t("total")}: ₪
                    {pricePerDay *
                      calculateDays() *
                      (isNewClient ? newDogs.length : selectedDogs.length) || 0}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">{t("paymentDetails")}</h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="paymentMethod"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("paymentMethod")}
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                className="w-full md:w-1/3 rounded-lg border border-gray-300 px-3 py-2"
                required
              >
                <option value="CASH">{t("cash")}</option>
                <option value="CREDIT_CARD">{t("creditCard")}</option>
                <option value="BANK_TRANSFER">{t("bankTransfer")}</option>
                <option value="BIT">{t("bit")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 flex items-center"
          >
            {loading ? (
              <>
                <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                {t("submittingBooking")}
              </>
            ) : (
              t("submitBooking")
            )}
          </button>
        </div>
      </form>
      </div>
    </ClientLayout>
  );
}
