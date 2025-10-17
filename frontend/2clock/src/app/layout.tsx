import type { Metadata } from "next";
import "./globals.css";
import { TeamProvider } from "@/contexts/TeamContext";

export const metadata: Metadata = {
  title: "2Clock - Time Management",
  description: "Employee time tracking and management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased">
        <TeamProvider>
          {children}
        </TeamProvider>
      </body>
    </html>
  );
}