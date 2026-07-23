import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import Clarity from "@/components/analytics/clarity";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SiteHeader />

      <main>{children}</main>

      <SiteFooter />

      <Clarity />
    </>
  );
}