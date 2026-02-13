import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { Toaster } from "@/components/ui/sonner"
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: '行動商城團購網',
  description: '行動商城團購網：輕鬆揪團、一鍵下單，享受最優惠的團購體驗！',
  openGraph: {
    title: '行動商城團購網',
    description: '行動商城團購網：輕鬆揪團、一鍵下單，享受最優惠的團購體驗！',
    images: [
      {
        url: 'https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_1_cafe.png', // Temporary placeholder for reliable display
        width: 1200,
        height: 630,
        alt: '中油PAY行動商城團購',
      },
    ],
  },
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/mall-icon.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/mall-icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
    apple: '/mall-icon.png',
    shortcut: '/mall-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW">
      <head>
        <Script
          src="https://static.line-scdn.net/liff/edge/2/sdk.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={`font-sans antialiased`}>
        {children}
        <Toaster position="top-center" duration={1000} />
      </body>
    </html>
  )
}
