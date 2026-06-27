import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Research Gap Analyzer",
  description: "AI-driven literature synthesis and gap inference.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground selection:bg-primary selection:text-primary-foreground`}>
        <div className="flex h-screen w-full overflow-hidden">
          <Sidebar />
          <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-background/95 relative border-l border-border/50">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
