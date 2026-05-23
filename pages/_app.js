import '../styles/globals.css'
import Head from 'next/head'
import Script from 'next/script'
import { useRouter } from 'next/router'
import BottomNav from '../components/BottomNav'

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const isAdmin = router.pathname.startsWith('/admin')

  return (
    <>
      <Script 
        async 
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-0000000000000000" 
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <Head>
        <link rel="icon" href="/favicon.jpg" />
        <link rel="shortcut icon" href="/favicon.jpg" />
        <link rel="apple-touch-icon" href="/favicon.jpg" />
        
        {/* Primary Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://instasearch.com/" />
        <meta property="og:site_name" content="InstaSearch" />
        <meta property="og:image" content="https://instasearch.com/og-image.jpg" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://instasearch.com/" />
        <meta property="twitter:image" content="https://instasearch.com/og-image.jpg" />

        {/* Google Search Console Verification */}
        {/* Replace content value with your actual verification code */}
        <meta name="google-site-verification" content="google-search-console-verification-placeholder" />

        {/* Schema.org WebSite JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "InstaSearch",
              "url": "https://instasearch.com/",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://instasearch.com/results?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </Head>
      <Component {...pageProps} />
      {!isAdmin && <BottomNav />}
    </>
  )
}
