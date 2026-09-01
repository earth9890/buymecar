import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "buymecar.lol — Put your brand on my G-Wagon",
  description:
    "A 3D Mercedes-AMG G63 with 19 sponsor panels. Buy one, your brand goes on the car and every click goes to your link. Anyone can outbid you for 20% more. When it's funded, I buy the real car.",
  openGraph: {
    title: "buymecar.lol",
    description: "Buy a panel on my future G-Wagon. Highest payer keeps it.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
