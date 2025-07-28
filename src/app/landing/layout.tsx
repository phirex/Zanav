import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

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
    <div dir="ltr" style={{ direction: "ltr" }}>
      {children}
    </div>
  );
}
