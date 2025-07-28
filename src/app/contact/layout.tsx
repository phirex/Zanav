import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import SupabaseProvider from "@/contexts/SupabaseBrowserContext";
import I18nProviderComponent from "@/components/I18nProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Contact Zanav.io - Pet Boarding Management",
  description: "Get in touch with our sales team to learn more about Zanav.io",
};

export default function ContactLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SupabaseProvider>
      <I18nProviderComponent>{children}</I18nProviderComponent>
    </SupabaseProvider>
  );
}
