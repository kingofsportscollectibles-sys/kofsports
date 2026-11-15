import { JsonLd } from "@/components/marketing/JsonLd";
import { founderIdentity } from "@/lib/marketing/owner-content";
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
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": "https://www.kofsports.com/#organization",
          name: "KofSports",
          url: "https://www.kofsports.com",
          logo: "https://www.kofsports.com/brand/kofsports-logo.svg",
          foundingDate: "2015",
          email: "kof@kofsports.com",
          ...(founderIdentity.profiles.length
            ? { sameAs: founderIdentity.profiles.map((p) => p.href) }
            : {}),
        }}
      />
      <SiteHeader />

      <main>{children}</main>

      <SiteFooter />

      <Clarity />
    </>
  );
}
