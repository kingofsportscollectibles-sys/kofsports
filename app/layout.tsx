import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import GrowthTracker from "@/components/growth/GrowthTracker";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
});

export const metadata: Metadata = {
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
  const clarityProjectId =
    process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_ID;

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        {clarityProjectId ? (
          <Script
            id="microsoft-clarity"
            strategy="afterInteractive"
          >
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
      </body>
    </html>
  );
}
