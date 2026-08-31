import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduHamuy",
  description:
    "Plataforma educativa digital para Ciencias de la Educación y Humanidades.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
