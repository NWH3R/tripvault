import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import ParticleBackground from "@/components/ParticleBackground";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TripVault — Capture now. Reveal together.",
  description:
    "A shared photo vault for your group trip. Upload now, reveal together on your chosen date.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geist.className}>
      <body className="min-h-screen bg-[#0a0a0a] text-white">
        <ParticleBackground />
        {children}
      </body>
    </html>
  );
}
