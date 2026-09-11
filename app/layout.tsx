import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEC Dashboard | Solid Engineering Consultancy",
  description: "Project and finance dashboard for Solid Engineering Consultancy",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
