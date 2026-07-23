import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
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
    "Transparent sports betting picks, analysis, historical results, and VIP selections from KofSports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} ${oswald.variable} min-h-screen bg-black text-white antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
