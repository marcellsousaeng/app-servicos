import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

<<<<<<< HEAD
// Pega o nome da empresa configurado na Vercel. Se não encontrar, usa "Sistema OS" como padrão.
=======
// Pega o nome da empresa da Vercel. Se não existir, usa um nome padrão.
>>>>>>> 0ce2ac6ff885aac2d0817d5745d69082cc283183
const nomeEmpresa = process.env.NEXT_PUBLIC_NOME_EMPRESA || "Sistema OS";

// Configuração de Metadados Dinâmicos
export const metadata: Metadata = {
  title: `${nomeEmpresa} - Sistema OS`,
  description: "Sistema de Gestão de Ordens de Serviço",
<<<<<<< HEAD
  manifest: "/manifest.json", 
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: nomeEmpresa, // Nome dinâmico para o atalho no iPhone
=======
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: nomeEmpresa,
>>>>>>> 0ce2ac6ff885aac2d0817d5745d69082cc283183
  },
  formatDetection: {
    telephone: false,
  },
};

// Configuração da cor da barra do navegador (estilo app nativo)
export const viewport: Viewport = {
  themeColor: "#07111f", 
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-br"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className="min-h-full flex flex-col bg-[#07111f]"> 
        {children}
      </body>
    </html>
  );
}