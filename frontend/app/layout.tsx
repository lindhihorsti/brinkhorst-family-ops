import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./premium.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Family Ops",
  description: "Wochenplanung, Aktivitäten & Haushaltsorganisation für die Familie",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Family Ops",
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Family Ops" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var d=document.documentElement;var t=localStorage.getItem('theme');if(t==='dark'||t==='light')d.setAttribute('data-theme',t);var hl=localStorage.getItem('home_layout');d.setAttribute('data-home-layout',hl==='tiles'?'tiles':'standard');var dm=localStorage.getItem('display_mode');d.setAttribute('data-display-mode',dm==='ipad'||dm==='web'?dm:'iphone');var bg=localStorage.getItem('light_bg_color');if(/^#[0-9a-fA-F]{6}$/.test(bg||'')){d.style.setProperty('--user-light-bg',bg.toLowerCase());}var ux=localStorage.getItem('ux_version');if(ux==='premium')d.setAttribute('data-ux','premium');}catch(e){}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
