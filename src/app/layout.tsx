import type { Metadata, Viewport } from 'next'

import Navbar from '@/components/Navbar'

import './globals.css'

export const metadata: Metadata = {
  title: 'Miniature Paint Color Wheel',
  description: 'Interactive color wheel for miniature paint hobbyists',
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' data-theme='nord'>
      <body className='flex h-screen w-screen flex-col overflow-hidden'>
        <Navbar />
        {children}
      </body>
    </html>
  )
}
