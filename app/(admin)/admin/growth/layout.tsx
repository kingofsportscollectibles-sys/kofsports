import type { ReactNode } from "react";

import GrowthSidebar from "@/components/admin/growth/GrowthSidebar";

type GrowthLayoutProps = {
  children: ReactNode;
};

export default function GrowthLayout({
  children,
}: GrowthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-100">
      <GrowthSidebar />

      <main className="min-w-0 lg:pl-64">
        {children}
      </main>
    </div>
  );
}
