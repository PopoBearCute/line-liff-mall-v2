import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { Toaster } from "@/components/ui/sonner"
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: '中油PAY行動商城',
  description: '📊 專屬揪團中！點擊進入查看本波熱門商品與集單進度，快來進來湊個單！',
  openGraph: {
    title: '中油PAY行動商城',
    description: '📊 專屬揪團中！點擊進入查看本波熱門商品與集單進度，快來進來湊個單！',
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
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
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
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
