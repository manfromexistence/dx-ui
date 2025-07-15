import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Dx } from "@/components/dx";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dx Ui",
  description: "Make your component library!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Dx>
          {children}
        </Dx>
      </body>
    </html>
  );
}
