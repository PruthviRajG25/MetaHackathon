import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RepeatLess AI - Household Grocery & Restocking Intelligence",
  description:
    "Autonomous AI-powered grocery inventory tracking, receipt scanning, and deterministic restocking for modern households. Built for the Meta Global AI Hackathon.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#fcfcf9] text-stone-900">
        {children}
      </body>
    </html>
  );
}
