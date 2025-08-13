import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import I18nProviderComponent from "@/components/I18nProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zanav.io - Smart Pet Boarding Management",
  description:
    "Modern pet boarding management software for kennels and catteries of all sizes",
};

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <I18nProviderComponent>
      <div>
        {children}
      </div>
    </I18nProviderComponent>
  );
}
