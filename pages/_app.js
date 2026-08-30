import { useEffect } from 'react'
import Link from 'next/link'
import '../styles/globals.css'
import Head from 'next/head'
import Script from 'next/script'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'
import Footer from '../components/Footer'

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const isAdmin = router.pathname.startsWith('/admin')

  useEffect(() => {
    // Record page visit on load/path change, excluding admin and API paths
    if (!router.pathname.startsWith('/admin') && !router.pathname.startsWith('/api')) {
      fetch('/api/visit', { method: 'POST' }).catch(() => {})
    }
  }, [router.pathname])

  // Calculate canonical URL dynamically without query parameters
  const canonicalPath = router.asPath.split('?')[0].replace(/\/+$/, '')
  const canonicalUrl = `https://spialr.com${canonicalPath === '' ? '' : canonicalPath}`

  return (
    <>
      <Script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3089879645930958"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <Head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        
        {/* Canonical Link */}
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Primary Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Spialr" />
        <meta property="og:image" content="https://spialr.com/og-image.jpg" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={canonicalUrl} />
        <meta property="twitter:image" content="https://spialr.com/og-image.jpg" />

        {/* Schema.org WebSite JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "name": "Spialr",
                  "url": "https://spialr.com/",
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://spialr.com/results?q={search_term_string}",
                    "query-input": "required name=search_term_string"
                  }
                },
                {
                  "@type": "Organization",
                  "name": "Spialr Analytics",
                  "url": "https://spialr.com/",
                  "logo": "https://spialr.com/favicon.png",
                  "description": "Curating, indexing, and analyzing top social media creators to provide instant search and insights."
                }
              ]
            })
          }}
        />
      </Head>
      {!isAdmin && <Navbar />}
      <Component {...pageProps} />
      {!isAdmin && <Footer />}
      {!isAdmin && <BottomNav />}
      {!isAdmin && ['/', '/all', '/trending'].includes(router.pathname) && !(router.pathname === '/all' && router.query.compare) && (
        <Link href="/converter">
          <button className="dotart-fab" title="Image to Dot Art Converter">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <path d="M8 8 L12 12 L16 8 M8 16 L12 12 L16 16" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="12" cy="8" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="16" cy="8" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="8" cy="12" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="16" cy="12" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="8" cy="16" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none" />
            </svg>
          </button>
        </Link>
      )}
    </>
  )
}
