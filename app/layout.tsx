import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { Toaster } from "@/components/ui/sonner"
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: '團購主管理工具',
  description: '專業團購管理助手：輕鬆管理商品進度、一鍵分享圖卡，讓您的開團操作更直覺、高效！',
  openGraph: {
    title: '團購主管理工具',
    description: '專業團購管理助手：輕鬆管理商品進度、一鍵分享圖卡，讓您的開團操作更直覺、高效！',
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
        <Toaster position="top-center" duration={1000} />
      </body>
    </html>
  )
}
