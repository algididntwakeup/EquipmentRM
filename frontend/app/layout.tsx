import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Equipment Inventory | Reksolindo",
    template: "%s | Reksolindo",
  },
  description: "Platform manajemen keandalan dan inventaris aset industri Reksolindo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-gray-50 text-on-surface antialiased md:pl-64 pb-20 md:pb-0">
        {children}
      </body>
    </html>
  );
}
