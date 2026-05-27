import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "../components/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "CareerOS Resume Intelligence",
  description: "Parse PDF resumes into structured career profiles with AI-powered analysis.",
  keywords: ["resume", "career", "profile", "AI", "analysis"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`antialiased ${inter.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
