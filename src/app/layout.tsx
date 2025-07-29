import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./components/ClientLayout";
import SupabaseProvider from "@/contexts/SupabaseBrowserContext";
import I18nProviderComponent from "@/components/I18nProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zanav.io - Pet Boarding Management",
  description: "Pet boarding management system",
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SupabaseProvider>
          <I18nProviderComponent>{children}</I18nProviderComponent>
        </SupabaseProvider>
      </body>
    </html>
  );
}
