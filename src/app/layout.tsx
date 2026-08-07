import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import { Footer } from '@/components/footer'
import { Navbar } from '@/components/navbar'
import { cn } from '@/lib/utils'
import { siteUrl } from '@/modules/seo/utils/site-url'
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

/*
 * next/font exposes each family under a `*-face` variable, which the
 * `@theme inline` block in globals.css then wraps into the `--font-display`
 * / `--font-sans` / `--font-mono` theme tokens along with its fallback stack.
 * The names must differ — `--font-sans: var(--font-sans)` is a reference
 * cycle and resolves to nothing.
 */

/** Display face — headings and the brand wordmark. */
const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display-face',
})

/** Body face — default for all prose and UI text. */
const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans-face',
})

/** Mono face — micro-labels, data chips, ΔE values, prices. Tabular numerals. */
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono-face',
})

const description =
  'Search Citadel, Vallejo, Army Painter, Scale75 and 10+ other brands in one place. Build palettes, track your shelf, and share painting recipes — free to browse, no account needed.'

/**
 * Default site metadata. Page-level `metadata` exports and `generateMetadata`
 * functions may override individual fields (title, description, openGraph)
 * per route.
 *
 * Favicons live in `src/app/` (icon.svg, apple-icon.png, favicon.ico) and are
 * picked up automatically by Next.js's file conventions. The supplementary
 * Android/PWA icon set lives in `public/branding/` and is referenced via the
 * web manifest.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: 'Grimify',
    template: '%s · Grimify',
  },
  description,
  applicationName: 'Grimify',
  keywords: [
    'miniature painting',
    'Citadel paints',
    'Vallejo paints',
    'Army Painter',
    'Scale75',
    'Reaper paints',
    'cross-brand paint search',
    'paint collection tracker',
    'paint comparison',
    'color palette',
    'tabletop hobby',
    'Warhammer paints',
    'miniature paint database',
  ],
  authors: [{ name: 'Nathan Healea' }],
  manifest: '/branding/site.webmanifest',
  openGraph: {
    type: 'website',
    siteName: 'Grimify',
    locale: 'en_US',
    title: 'Grimify — Find any miniature paint',
    description,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Grimify — Find any miniature paint across every brand' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grimify — Find any miniature paint',
    description,
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: [
    // Matches --color-surface / --color-ink in src/styles/variables.css
    { media: '(prefers-color-scheme: light)', color: '#f4f5f7' },
    { media: '(prefers-color-scheme: dark)', color: '#0e1013' },
  ],
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Grimify',
  url: 'https://grimify.app',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://grimify.app/paints?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn('font-sans', display.variable, sans.variable, mono.variable)}
    >
      <body className="flex min-h-dvh flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Navbar />
        {children}
        <Footer />
        <Toaster position="bottom-right" richColors closeButton theme="system" />
      </body>
    </html>
  )
}
