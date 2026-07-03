import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Omnio",
  description: "Build a real AI agency, from your first idea to your first $1,000.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        {/* General Sans — 07_VISUAL_DESIGN_SYSTEM.md §3. Not on next/font/google,
            loaded directly from Fontshare. */}
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-text-primary font-sans">
        {children}
      </body>
    </html>
  );
}
