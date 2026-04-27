import type { Metadata, Viewport } from "next"; // Importamos Viewport para cores de interface
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

// Configuração de Metadados para PWA
export const metadata: Metadata = {
  title: "Divisa Tornearia - Sistema OS",
  description: "Sistema de Gestão de Ordens de Serviço",
  manifest: "/manifest.json", // Vincula o arquivo que você criou na pasta public
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Divisa OS",
  },
  formatDetection: {
    telephone: false,
  },
};

// Configuração da cor da barra do navegador (estilo app nativo)
export const viewport: Viewport = {
  themeColor: "#07111f", // Cor azul escura que você usa no sistema
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
      lang="pt-br" // Ajustado para português brasileiro
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Link extra de segurança para ícones em dispositivos Apple */}
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className="min-h-full flex flex-col bg-[#07111f]"> 
        {children}
      </body>
    </html>
  );
}