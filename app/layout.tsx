import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Earth Science Lab",
  description: "Learn soil, earth, and life science through games and 3D exploration.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
