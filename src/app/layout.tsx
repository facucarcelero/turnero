import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { prisma } from "@/lib/prisma";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const clinic = await prisma.clinic.findFirst().catch(() => null);
  const name = clinic?.name ?? "Turnero";
  return {
    title: { default: name, template: `%s · ${name}` },
    description: clinic?.welcomeMessage ?? "Sistema de turnos online",
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0d9488",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const clinic = await prisma.clinic.findFirst().catch(() => null);
  const brand = clinic?.primaryColor ?? "#0d9488";

  return (
    <html
      lang="es"
      className={`${inter.variable} h-full antialiased`}
      style={{ "--brand": brand } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
