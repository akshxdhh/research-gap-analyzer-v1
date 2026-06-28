import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative border-l border-border/50">
        <MobileHeader />
        <div className="flex-1 p-4 md:p-8">
          {children}
        </div>
        <footer className="w-full text-center py-6 text-sm text-muted-foreground border-t border-border/50 mt-auto">
          © 2026 Research Gap Analyzer. All Rights Reserved.
        </footer>
      </main>
    </div>
  );
}
