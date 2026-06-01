import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SupportAI Hub",
  description: "Central interna de suporte técnico com IA e base de conhecimento própria."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
