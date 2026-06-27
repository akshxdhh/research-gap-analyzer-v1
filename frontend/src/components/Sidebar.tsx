"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Upload, 
  BarChart, 
  FileText, 
  Search,
  BookOpen,
  LayoutDashboard,
  FolderKanban,
  GitCompareArrows,
  Settings
} from "lucide-react";
import clsx from "clsx";

const topNavItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Upload", href: "/upload", icon: Upload },
  { name: "Library", href: "/library", icon: BookOpen },
];

const analysisItems = [
  { name: "Analysis", href: "/analysis", icon: Search },
  { name: "Research Gaps", href: "/gaps", icon: BarChart },
  { name: "Comparison", href: "/comparison", icon: GitCompareArrows },
  { name: "Reports", href: "/reports", icon: FileText },
];

const bottomNavItems = [
  { name: "Settings", href: "/settings", icon: Settings },
];

function NavGroup({ title, items, pathname }: { title?: string, items: any[], pathname: string }) {
  return (
    <div className="mb-6">
      {title && <h4 className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">{title}</h4>}
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.name}>
              <Link
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Icon className={clsx("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-background text-foreground flex flex-col h-full flex-shrink-0 border-r border-border">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Search className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">GapAnalyzer</h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
        <NavGroup items={topNavItems} pathname={pathname} />
        <NavGroup title="Intelligence" items={analysisItems} pathname={pathname} />
      </nav>
      
      <div className="p-3">
        <NavGroup items={bottomNavItems} pathname={pathname} />
        <div className="mt-4 px-4 py-3 rounded-lg bg-card border border-border/50 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">System Online</span>
        </div>
      </div>
    </div>
  );
}
