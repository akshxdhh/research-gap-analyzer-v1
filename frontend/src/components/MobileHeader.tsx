"use client";

import { useState } from "react";
import { Menu, X, Brain } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

export default function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Upload", href: "/upload" },
    { name: "Library", href: "/library" },
    { name: "Analysis", href: "/analysis" },
    { name: "Research Gaps", href: "/gaps" },
    { name: "Reports", href: "/reports" },
    { name: "Settings", href: "/settings" },
  ];

  return (
    <>
      <div className="md:hidden sticky top-0 z-40 glass border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg">Gap Analyzer</span>
        </div>
        
        <button onClick={() => setIsOpen(true)} className="p-2 -mr-2 text-muted-foreground hover:text-foreground">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            />
            
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="md:hidden fixed inset-y-0 right-0 w-3/4 max-w-sm glass border-l border-border/50 shadow-2xl z-50 flex flex-col"
            >
              <div className="p-4 flex justify-end">
                <button onClick={() => setIsOpen(false)} className="p-2 text-muted-foreground hover:text-foreground bg-muted rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <nav className="flex-1 px-6 py-4 flex flex-col gap-4 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link 
                      key={item.name} 
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`text-lg font-medium p-3 rounded-xl transition-colors ${
                        isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
