import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Research Gap Analyzer",
  description: "AI-driven literature synthesis and gap inference.",
};

import CustomCursor from "@/components/interactions/CustomCursor";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <CustomCursor />
        {children}
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
