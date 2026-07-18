import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

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
    "Sports betting picks, analytics, and transparent results from KofSports. Established in 2015.",
  keywords: [
    "sports betting picks",
    "sports handicapping",
    "NFL picks",
    "MLB picks",
    "NBA picks",
    "NHL picks",
    "college football picks",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${oswald.variable}`}>
        <div className="flex min-h-screen flex-col">
          <SiteHeader />

          <main className="flex-1">{children}</main>

          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
