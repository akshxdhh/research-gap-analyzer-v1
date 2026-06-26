"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Upload, 
  BarChart, 
  FileText, 
  Search,
  BookOpen
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { name: "Upload", href: "/upload", icon: Upload },
  { name: "Library", href: "/library", icon: BookOpen },
  { name: "Analysis", href: "/analysis", icon: Search },
  { name: "Gap Dashboard", href: "/gaps", icon: BarChart },
  { name: "Reports", href: "/reports", icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-slate-950 text-slate-300 flex flex-col h-screen fixed">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Search className="w-6 h-6 text-blue-500" />
          GapAnalyzer
        </h1>
      </div>
      <nav className="flex-1 mt-6">
        <ul className="space-y-2 px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-md transition-colors",
                    isActive
                      ? "bg-blue-600 text-white font-medium"
                      : "hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-800 text-sm text-slate-500">
        <p>System Status: <span className="text-emerald-500">Online</span></p>
      </div>
    </div>
  );
}
