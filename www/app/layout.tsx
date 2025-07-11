import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <div id="adsterra-banner"></div>
        <Script
          id="adsterra-script"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              atOptions = {
                'key': '54fc0baad0c1d63cb1b7262fcd99297a',
                'format': 'iframe',
                'height': 500,
                'width': 1200,
                'params': {}
              };
            `,
          }}
        />

        <Script
          src="//www.highperformanceformat.com/54fc0baad0c1d63cb1b7262fcd99297a/invoke.js"
          strategy="lazyOnload"
        />

        {/*
         <Script
          src="//pl27138998.profitableratecpm.com/9a/e7/22/9ae722a01b8721b1c353ee84e001e9d6.js"
          strategy="lazyOnload"
        />
        
        <Script
          src="https://js.onclckmn.com/static/onclicka.js"
          strategy="lazyOnload"
        /> */}
      </body>
    </html>
  );
}
