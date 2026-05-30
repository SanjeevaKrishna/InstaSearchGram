import Head from 'next/head'
import { useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

export async function getServerSideProps(context) {
  const { slug } = context.params

  const { data: newsItem, error } = await supabase
    .from('news')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !newsItem) {
    return { notFound: true }
  }

  return {
    props: {
      news: newsItem
    }
  }
}

export default function NewsDetail({ news }) {
  // Increment view count on mount
  useEffect(() => {
    if (news && news.slug) {
      fetch('/api/news/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: news.slug })
      }).catch(err => console.error('Failed to update view count:', err))
    }
  }, [news])

  if (!news) return null

  // Ensure content renders cleanly (basic text to HTML if needed, though sketch just says matter)
  const renderContent = () => {
    if (!news.content) return null;
    return news.content.split('\n').map((paragraph, idx) => (
      <p key={idx} style={{ marginBottom: '1em', lineHeight: 1.6 }}>
        {paragraph}
      </p>
    ));
  }

  return (
    <>
      <Head>
        {/* SEO Tags */}
        <title>{news.title} - InstaNews</title>
        <meta name="description" content={news.content ? news.content.substring(0, 150) + '...' : news.title} />
        
        {/* Open Graph Tags for Social Media Sharing */}
        <meta property="og:title" content={news.title} />
        <meta property="og:description" content={news.content ? news.content.substring(0, 150) + '...' : news.title} />
        <meta property="og:type" content="article" />
        {news.image_url && <meta property="og:image" content={news.image_url} />}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={news.title} />
        <meta name="twitter:description" content={news.content ? news.content.substring(0, 150) + '...' : news.title} />
        {news.image_url && <meta name="twitter:image" content={news.image_url} />}
      </Head>

      <Navbar />

      <article style={{
        maxWidth: 600,
        margin: '0 auto',
        padding: '0',
        minHeight: '100vh',
        background: 'var(--surface)',
      }}>
        {/* Large Image Header */}
        {news.image_url ? (
          <img 
            src={news.image_url} 
            alt={news.title}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '400px',
              objectFit: 'cover',
              borderBottomLeftRadius: 24,
              borderBottomRightRadius: 24,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '250px',
            background: 'var(--gradient)',
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
          }}>
            📰
          </div>
        )}

        <div style={{ padding: '24px' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            fontWeight: 800,
            lineHeight: 1.3,
            marginBottom: 12,
            color: 'var(--text)',
          }}>
            {news.title}
          </h1>

          <div style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span>📅 {news.published_date ? new Date(news.published_date).toLocaleDateString() : new Date(news.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>InstaNews</span>
          </div>

          <div style={{
            fontSize: 16,
            color: 'var(--text-dim)',
            whiteSpace: 'pre-wrap', // respects newline characters in content
          }}>
            {renderContent()}
          </div>
        </div>
      </article>
    </>
  )
}
