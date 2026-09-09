import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";

import { createClient } from "@/lib/supabase/server";

type MemberLayoutProps = {
  children: ReactNode;
};

export default async function MemberLayout({
  children,
}: MemberLayoutProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
{children}
    </div>
  );
}