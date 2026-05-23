import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/Navbar'

export async function getServerSideProps() {
  const { data: news, error } = await supabase
    .from('news')
    .select('id, title, slug, image_url, created_at')
    .order('created_at', { ascending: false })

  return {
    props: {
      news: news || []
    }
  }
}

export default function InstaNewsIndex({ news }) {
  return (
    <>
      <Head>
        <title>Daily Instagram News - InstaSearch</title>
        <meta name="description" content="Catch up on the latest daily news and updates about your favorite Instagram celebrities." />
      </Head>

      <Navbar />

      <div style={{
        maxWidth: 600,
        margin: '0 auto',
        padding: '24px 16px',
        minHeight: '100vh',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 800,
          marginBottom: 24,
          textAlign: 'center',
          background: 'var(--gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Daily Instagram News
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {news.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40 }}>
              No news available today. Check back soon!
            </div>
          ) : (
            news.map(item => (
              <Link key={item.id} href={`/instanews/${item.slug}`}>
                <div className="card" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: 12,
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 12,
                        objectFit: 'cover',
                        background: 'var(--surface2)',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 80,
                      height: 80,
                      borderRadius: 12,
                      background: 'var(--gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 32,
                      flexShrink: 0,
                    }}>
                      📰
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <h2 style={{
                      fontSize: 16,
                      fontWeight: 700,
                      lineHeight: 1.4,
                      color: 'var(--text)',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {item.title}
                    </h2>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  )
}
