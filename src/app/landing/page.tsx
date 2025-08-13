"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronRight,
  Check,
  Star,
  Calendar,
  Users,
  CreditCard,
  BarChart2,
} from "lucide-react";
import Image from "next/image";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const isHebrew = typeof i18n?.language === "string" && i18n.language.startsWith("he");
  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      {/* Navigation */}
      <nav className="border-b border-gray-100" suppressHydrationWarning>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Image
                src="/images/logo.svg"
                alt="Zanav.io"
                width={40}
                height={40}
                className="h-10 w-auto"
              />
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="#features"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                {t("features", "Features")}
              </Link>
              <Link
                href="#pricing"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                {t("pricing", "Pricing")}
              </Link>
              <Link
                href="#faq"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                {t("faq", "FAQ")}
              </Link>
              <Link
                href="/login"
                className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-md text-sm font-medium"
              >
                {t("signIn", "Sign in")}
              </Link>
              <div className="ml-4">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-white w-full">
        <div className="max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center justify-between px-4 sm:px-6 lg:px-8 pt-8 pb-12 lg:pt-16 lg:pb-20">
          {/* Left: Hero Text */}
          <div className="w-full lg:w-1/2 flex flex-col items-start lg:pr-8">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl" style={isHebrew ? { letterSpacing: "0.5px" } : undefined}>
              <span className="block">{t("boardingManagement")}</span>
              <span className="block text-blue-600">{t("makesTailsWag")}</span>
            </h1>
            <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl md:mt-5 md:text-xl">
              {t("heroDescription")}
            </p>
            <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                href="/signup"
                className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
              >
                {t("startFreeTrial")}
              </Link>
              <Link
                href="#pricing"
                className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10"
              >
                {t("seePricing")}
              </Link>
            </div>
          </div>
          {/* Right: Dashboard Screenshot */}
          <div className="w-full lg:w-1/2 flex justify-center items-center mb-8 lg:mb-0">
            <div
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-full"
              style={{ width: "100%", maxWidth: 520 }}
            >
              {/* Browser bar */}
              <div className="flex items-center h-8 px-4 border-b border-gray-100 rounded-t-2xl bg-gray-50">
                <span className="w-3 h-3 bg-red-400 rounded-full mr-2"></span>
                <span className="w-3 h-3 bg-yellow-300 rounded-full mr-2"></span>
                <span className="w-3 h-3 bg-green-400 rounded-full"></span>
              </div>
              <div className="p-2 sm:p-4">
                <Image
                  src="/images/dashboard.png"
                  alt="Dashboard screenshot"
                  width={900}
                  height={600}
                  className="rounded-lg shadow border border-gray-100 max-w-full h-auto object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof section */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-base font-semibold uppercase text-gray-600 tracking-wider">
            {t("trustedBy")}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-10 md:grid-cols-4 items-center">
            <div className="col-span-1 flex justify-center md:col-span-1">
              <Image src="/images/logos/pawsco.svg" alt="PawsCo" width={240} height={72} className="h-16 w-auto opacity-80" />
            </div>
            <div className="col-span-1 flex justify-center md:col-span-1">
              <Image src="/images/logos/furify.svg" alt="Furify" width={240} height={72} className="h-16 w-auto opacity-80" />
            </div>
            <div className="col-span-1 flex justify-center md:col-span-1">
              <Image src="/images/logos/tailwind-kennels.svg" alt="Tailwind Kennels" width={240} height={72} className="h-16 w-auto opacity-80" />
            </div>
            <div className="col-span-1 flex justify-center md:col-span-1">
              <Image src="/images/logos/puppalabs.svg" alt="PuppaLabs" width={240} height={72} className="h-16 w-auto opacity-80" />
            </div>
          </div>
          <p className="mt-8 text-center text-lg text-gray-600">
            {t("managingOver")}
          </p>
        </div>
      </div>

      {/* Feature section */}
      <div className="py-12 bg-white" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">
              {t("features")}
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              {t("everythingYouNeed")}
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              {t("scalesWithBusiness")}
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              {/* Feature 1 */}
              <div className="relative">
                <div className="bg-blue-100 rounded-lg p-3 absolute -left-3 -top-3">
                  <Calendar
                    className="h-6 w-6 text-blue-600"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-2 ml-16">
                  <h3 className="text-lg font-medium text-gray-900">
                    {t("smartBooking")}
                  </h3>
                  <p className="mt-2 text-base text-gray-500">
                    {t("smartBookingDesc")}
                  </p>
                </div>
                <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <div className="w-full h-64 sm:h-72 md:h-80 lg:h-72 xl:h-80 relative">
                    <Image
                      src="/images/calendar.png"
                      alt="Calendar view"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain p-2"
                    />
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="relative">
                <div className="bg-purple-100 rounded-lg p-3 absolute -left-3 -top-3">
                  <Users
                    className="h-6 w-6 text-purple-600"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-2 ml-16">
                  <h3 className="text-lg font-medium text-gray-900">
                    {t("customerPetCRM")}
                  </h3>
                  <p className="mt-2 text-base text-gray-500">
                    {t("customerPetCRMDesc")}
                  </p>
                </div>
                <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <div className="w-full h-64 sm:h-72 md:h-80 lg:h-72 xl:h-80 relative">
                    <Image
                      src="/images/client.png"
                      alt="Client profile"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain p-2"
                    />
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="relative">
                <div className="bg-pink-100 rounded-lg p-3 absolute -left-3 -top-3">
                  <CreditCard
                    className="h-6 w-6 text-pink-600"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-2 ml-16">
                  <h3 className="text-lg font-medium text-gray-900">
                    {t("paymentsInvoicing")}
                  </h3>
                  <p className="mt-2 text-base text-gray-500">
                    {t("paymentsInvoicingDesc")}
                  </p>
                </div>
                <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <div className="w-full h-64 sm:h-72 md:h-80 lg:h-72 xl:h-80 relative">
                    <Image
                      src="/images/payments.png"
                      alt="Payments view"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain p-2"
                    />
                  </div>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="relative">
                <div className="bg-yellow-100 rounded-lg p-3 absolute -left-3 -top-3">
                  <BarChart2
                    className="h-6 w-6 text-yellow-600"
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-2 ml-16">
                  <h3 className="text-lg font-medium text-gray-900">
                    {t("financialInsights")}
                  </h3>
                  <p className="mt-2 text-base text-gray-500">
                    {t("financialInsightsDesc")}
                  </p>
                </div>
                <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <div className="w-full h-64 sm:h-72 md:h-80 lg:h-72 xl:h-80 relative">
                    <Image
                      src="/images/financial.png"
                      alt="Financial report"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain p-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* For small and large businesses section */}
      <div className="py-16 bg-blue-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">
              {t("forAllSizes")}
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t("scalesWithBoarding")}
            </p>
          </div>

          <div className="mt-12 bg-white shadow rounded-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* For small businesses */}
              <div className="p-8 border-b md:border-b-0 md:border-r border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {t("perfectForSmall")}
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check
                        className="h-5 w-5 text-green-500"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="ml-3 text-base text-gray-500">
                      {t("quickSetup")}
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check
                        className="h-5 w-5 text-green-500"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="ml-3 text-base text-gray-500">{t("noIT")}</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check
                        className="h-5 w-5 text-green-500"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="ml-3 text-base text-gray-500">
                      {t("affordablePricing")}
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check
                        className="h-5 w-5 text-green-500"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="ml-3 text-base text-gray-500">
                      {t("manageUpTo")}
                    </p>
                  </li>
                </ul>
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Image src="/images/testimonials/sarah-johnson.jpg" alt="Sarah Johnson" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                    </div>
                    <div className="ml-4">
                      <p className="text-gray-700 italic">
                        {t("smallTestimonial")}
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        Sarah Johnson, Happy Tails Kennel
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* For large businesses */}
              <div className="p-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {t("builtForLarge")}
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check
                        className="h-5 w-5 text-green-500"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="ml-3 text-base text-gray-500">
                      {t("multiLocationDash")}
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check
                        className="h-5 w-5 text-green-500"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="ml-3 text-base text-gray-500">
                      {t("roleBasedAccess")}
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check
                        className="h-5 w-5 text-green-500"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="ml-3 text-base text-gray-500">
                      {t("unlimitedCapacity")}
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0">
                      <Check
                        className="h-5 w-5 text-green-500"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="ml-3 text-base text-gray-500">
                      {t("advancedReporting")}
                    </p>
                  </li>
                </ul>
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Image src="/images/testimonials/michael-torres.jpg" alt="Michael Torres" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                    </div>
                    <div className="ml-4">
                      <p className="text-gray-700 italic">
                        {t("largeTestimonial")}
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        Michael Torres, PetResort Group
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kennel Website section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">
              {t("kennelWebsiteSection")}
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t("kennelWebsiteHeadline")}
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              {t("kennelWebsiteSubhead")}
            </p>
          </div>

          <div className="mt-12 border border-gray-200 rounded-xl overflow-hidden shadow-lg">
            <Image
              src="/images/website.png"
              alt="Kennel Website"
              width={1200}
              height={800}
              className="w-full"
            />
            <div className="p-6 bg-gray-50">
              <p className="text-lg font-medium text-gray-900">
                {t("kennelWebsiteCaptionTitle")}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {t("kennelWebsiteCaptionDesc")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">
              {t("testimonials")}
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t("lovedBy")}
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <Image src="/images/testimonials/alex-brown.jpg" alt="Alex Brown" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Alex Brown
                  </h3>
                  <p className="text-sm text-gray-500">Paws & Relax Boarding</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-2">
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
              </div>
              <p className="text-gray-600">{t("calendarSaved")}</p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <Image src="/images/testimonials/sarah-johnson.jpg" alt="Sarah Johnson" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Sarah Johnson
                  </h3>
                  <p className="text-sm text-gray-500">Happy Tails Retreat</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-2">
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
              </div>
              <p className="text-gray-600">{t("reducedNoShows")}</p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <Image src="/images/testimonials/michael-torres.jpg" alt="Michael Torres" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Michael Torres
                  </h3>
                  <p className="text-sm text-gray-500">Elite Pet Resorts</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-2">
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
              </div>
              <p className="text-gray-600">{t("financialReportingHelped")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing section */}
      <div className="py-16 bg-white" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">
              {t("pricing")}
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t("simplePricing")}
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              {t("noHiddenFees")}
            </p>
          </div>

          <div className="mt-12 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-8">
            {/* Standard tier */}
            <div className="border border-gray-200 rounded-lg shadow-sm p-8 lg:p-10">
              <h3 className="text-xl font-medium text-gray-900">
                {t("standard")}
              </h3>
              <p className="mt-4 text-sm text-gray-500">
                {t("perfectForSmallKennels")}
              </p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900">
                  $20
                </span>
                <span className="text-base font-medium text-gray-500">/mo</span>
              </p>
              <p className="mt-4 text-sm text-gray-500">{t("upTo20Pets")}</p>

              <ul className="mt-8 space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <Check
                      className="h-5 w-5 text-green-500"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="ml-3 text-sm text-gray-700">
                    {t("allCoreFeatures")}
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <Check
                      className="h-5 w-5 text-green-500"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="ml-3 text-sm text-gray-700">
                    {t("calendarManagement")}
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <Check
                      className="h-5 w-5 text-green-500"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="ml-3 text-sm text-gray-700">
                    {t("clientPetProfiles")}
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <Check
                      className="h-5 w-5 text-green-500"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="ml-3 text-sm text-gray-700">
                    {t("paymentTracking")}
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <Check
                      className="h-5 w-5 text-green-500"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="ml-3 text-sm text-gray-700">
                    {t("basicReporting")}
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <Check
                      className="h-5 w-5 text-green-500"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="ml-3 text-sm text-gray-700">
                    {t("emailSupport")}
                  </p>
                </li>
              </ul>

              <div className="mt-10">
                <Link
                  href="/signup?plan=standard"
                  className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {t("startFreeTrialLower")}
                </Link>
              </div>
            </div>

            {/* Premium tier */}
            <div className="border border-blue-200 rounded-lg shadow-sm p-8 lg:p-10 bg-blue-50">
              <h3 className="text-xl font-medium text-gray-900">
                {t("premium")}
              </h3>
              <p className="mt-4 text-sm text-gray-500">
                {t("forGrowingFacilities")}
              </p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900">
                  $100
                </span>
                <span className="text-base font-medium text-gray-500">/mo</span>
              </p>
              <p className="mt-4 text-sm text-gray-500">{t("unlimitedPets")}</p>

              <ul className="mt-8 space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <Check
                      className="h-5 w-5 text-green-500"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="ml-3 text-sm text-gray-700">
                    {t("everythingInStandard")}
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <Check
                      className="h-5 w-5 text-green-500"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="ml-3 text-sm text-gray-700">
                    {t("multiLocationSupport")}
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <Check
                      className="h-5 w-5 text-green-500"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="ml-3 text-sm text-gray-700">
                    {t("advancedReporting")}
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <Check
                      className="h-5 w-5 text-green-500"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="ml-3 text-sm text-gray-700">
                    {t("staffManagement")}
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <Check
                      className="h-5 w-5 text-green-500"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="ml-3 text-sm text-gray-700">
                    {t("prioritySupport")}
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <Check
                      className="h-5 w-5 text-green-500"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="ml-3 text-sm text-gray-700">
                    {t("dedicatedManager")}
                  </p>
                </li>
              </ul>

              <div className="mt-10">
                <Link
                  href="/signup?plan=premium"
                  className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {t("startFreeTrialLower")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ section */}
      <div className="py-16 bg-gray-50" id="faq">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">
              {t("faq")}
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t("frequentlyAsked")}
            </p>
          </div>

          <div className="mt-12 max-w-3xl mx-auto">
            <dl className="space-y-8">
              <div>
                <dt className="text-lg font-medium text-gray-900">
                  {t("howLongTrial")}
                </dt>
                <dd className="mt-2 text-base text-gray-500">
                  {t("howLongTrialA")}
                </dd>
              </div>

              <div>
                <dt className="text-lg font-medium text-gray-900">
                  {t("canExportData")}
                </dt>
                <dd className="mt-2 text-base text-gray-500">
                  {t("canExportDataA")}
                </dd>
              </div>

              <div>
                <dt className="text-lg font-medium text-gray-900">
                  {t("staffLimit")}
                </dt>
                <dd className="mt-2 text-base text-gray-500">
                  {t("staffLimitA")}
                </dd>
              </div>

              <div>
                <dt className="text-lg font-medium text-gray-900">
                  {t("howLongSetup")}
                </dt>
                <dd className="mt-2 text-base text-gray-500">
                  {t("howLongSetupA")}
                </dd>
              </div>

              <div>
                <dt className="text-lg font-medium text-gray-900">
                  {t("customerSupport")}
                </dt>
                <dd className="mt-2 text-base text-gray-500">
                  {t("customerSupportA")}
                </dd>
              </div>

              <div>
                <dt className="text-lg font-medium text-gray-900">
                  {t("dataSecure")}
                </dt>
                <dd className="mt-2 text-base text-gray-500">
                  {t("dataSecureA")}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Final CTA section */}
      <div className="bg-blue-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">{t("readyToGetStarted")}</span>
            <span className="block text-blue-200">
              {t("startYourFreeTrial")}
            </span>
          </h2>
          <div className="mt-8 flex gap-3 lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent rounded-md text-blue-600 bg-white hover:bg-blue-50"
              >
                {t("startFreeTrialLower")}
              </Link>
            </div>
            <div className="inline-flex rounded-md shadow">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500"
              >
                {t("contactSales")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:order-2">
              <Link href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Facebook</span>
                {/* Facebook icon would go here */}
              </Link>
              <Link href="#" className="ml-6 text-gray-400 hover:text-gray-500">
                <span className="sr-only">Instagram</span>
                {/* Instagram icon would go here */}
              </Link>
              <Link href="#" className="ml-6 text-gray-400 hover:text-gray-500">
                <span className="sr-only">Twitter</span>
                {/* Twitter icon would go here */}
              </Link>
            </div>
            <div className="mt-8 md:mt-0 md:order-1">
              <p className="text-center text-base text-gray-400">
                {t("copyright", { year: new Date().getFullYear() })}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
