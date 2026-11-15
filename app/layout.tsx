import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import GrowthTracker from "@/components/growth/GrowthTracker";
import ActivityTracker from "@/components/auth/ActivityTracker";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.kofsports.com"),
  openGraph: {
    siteName: "KofSports",
    type: "website",
    title: "KofSports | Sports Betting Picks & Analysis",
    description:
      "Official picks, public results and NFL prop research in one place.",
    images: [
      {
        url: "/brand/social-preview.png",
        width: 1200,
        height: 630,
        alt: "KofSports NFL betting picks and research tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/brand/social-preview.png"],
  },
  title: {
    default: "KofSports | Sports Betting Picks & Analysis",
    template: "%s | KofSports",
  },
  description:
    "Transparent sports betting picks, analysis, historical results, and VIP selections from KofSports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clarityProjectId = process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_ID;

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        {clarityProjectId ? (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){
                  (c[a].q=c[a].q||[]).push(arguments)
                };
                t=l.createElement(r);
                t.async=1;
                t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];
                y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${clarityProjectId}");
            `}
          </Script>
        ) : null}
      </head>

      <body
        className={`${inter.variable} ${oswald.variable} min-h-screen bg-black text-white antialiased`}
      >
        {children}
        <GrowthTracker />
        <ActivityTracker />
        <Analytics />
      </body>
    </html>
  );
}
