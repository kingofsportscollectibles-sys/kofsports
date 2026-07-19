import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/auth/require-admin";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({
  children,
}: AdminLayoutProps) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Keep your existing admin header/navigation here. */}

      {children}
    </div>
  );
}