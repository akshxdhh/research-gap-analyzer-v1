"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  UploadCloud, 
  BookOpen, 
  Sparkles, 
  Target, 
  FileDown, 
  Settings,
  Brain,
  Home as HomeIcon
} from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { name: "Home", href: "/", icon: HomeIcon },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Upload", href: "/upload", icon: UploadCloud },
  { name: "Library", href: "/library", icon: BookOpen },
  { name: "Analysis", href: "/analysis", icon: Sparkles },
  { name: "Research Gaps", href: "/gaps", icon: Target },
  { name: "Reports", href: "/reports", icon: FileDown },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex flex-col w-64 h-screen border-r border-border/50 glass z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Brain className="w-6 h-6 text-primary" />
        </div>
        <span className="font-bold text-lg tracking-tight">Gap Analyzer</span>
      </div>

      <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
          Menu
        </div>
        
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20 glow-primary"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon className={`w-5 h-5 relative z-10 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary transition-colors"}`} />
              <span className="font-medium relative z-10">{item.name}</span>
            </Link>
          );
        })}

        <div className="mt-auto pt-6 border-t border-border/50">
          <Link 
            href="/settings"
            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${
              pathname === "/settings" ? "bg-primary/10 text-primary border border-primary/20 glow-primary" : "text-muted-foreground hover:bg-card-hover hover:text-foreground"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
