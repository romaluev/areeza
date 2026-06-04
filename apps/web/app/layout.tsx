import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Providers } from "@/lib/providers";
import "./globals.css";

/** Inter variable — required for FF font-weight animation on nav/controls. */
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * EB Garamond (OFL) — court-document serif for UI + @react-pdf/renderer.
 * Downloaded from google/fonts `ofl/ebgaramond/EBGaramond[wght].ttf` (Unicode Latin + Cyrillic).
 */
const legalSerif = localFont({
  src: "../public/fonts/EBGaramond-Variable.ttf",
  variable: "--font-legal",
  display: "swap",
  weight: "400 700",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Areeza — yuridik hujjat tayyorlash platformasi",
  description:
    "O'zbekiston fuqarolari uchun sud uchun tayyor ariza tayyorlash, tekshirish va topshirish yo'riqnomasi.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${legalSerif.variable} ${jetbrains.variable} min-h-dvh font-sans`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
