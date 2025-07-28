"use client";

import Link from "next/link";
import Image from "next/image";
import { Building, Users, Settings } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import LogoutButton from "./LogoutButton";
import { useTranslation } from "react-i18next";

// TODO: Add mobile menu toggle functionality similar to ClientLayout if needed

export default function GlobalAdminSidebar() {
  const { t } = useTranslation();
  return (
    <div className="fixed lg:relative lg:w-64 bg-white border-l border-gray-200 p-6 h-full z-40">
      {/* Logo */}
      <div className="flex flex-col items-center mb-6">
        <Link href="/admin">
          <Image
            src="/images/logo.svg"
            alt="Zanav.io"
            width={48}
            height={48}
            className="h-12 w-auto"
          />
        </Link>
      </div>

      {/* TODO: Adjust mobile positioning/toggle */}
      <div className="mb-8 mt-4 lg:mt-0">{/* Content removed */}</div>
      <div className="space-y-2">
        {/* Global Admin Navigation Links */}
        <Link
          href="/admin/tenants"
          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-xl transition-all duration-200 group"
        >
          <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
            <Building className="h-5 w-5 text-blue-600" />
          </div>
          <span className="font-medium">{t("manageTenantsLink")}</span>
        </Link>
        <Link
          href="/admin/users"
          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-purple-50 rounded-xl transition-all duration-200 group"
        >
          <div className="bg-purple-100 p-2 rounded-lg group-hover:bg-purple-200 transition-colors">
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <span className="font-medium">{t("manageUsersLink")}</span>
        </Link>
        {/* Add other global admin links as needed */}
        <Link
          href="/admin/settings"
          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 group mt-4"
        >
          <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-gray-200 transition-colors">
            <Settings className="h-5 w-5 text-gray-600" />
          </div>
          <span className="font-medium">{t("globalSettingsLink")}</span>
        </Link>

        {/* Language Switcher */}
        <div className="mt-auto pt-6 border-t border-gray-200">
          <LanguageSwitcher />
        </div>

        {/* Logout Button */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
