import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ServiceWorkerRegister from "./ServiceWorkerRegister";
import AuthGate from "./components/AuthGate";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const company =
  process.env.NEXT_PUBLIC_COMPANY?.toLowerCase() || "estrella";

const companyIcon =
  company === "pegasso"
    ? "/icon-pegasso.png"
    : "/icon-estrella.png";

export const metadata: Metadata = {
  title: "Portal HSEQ IA",
  description: "Portal inteligente para gestión HSEQ",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: companyIcon,
    apple: companyIcon,
  },
};

export const viewport: Viewport = {
  themeColor: "#111827",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegister />

        <AuthGate>
          {children}
        </AuthGate>
      </body>
    </html>
  );
}