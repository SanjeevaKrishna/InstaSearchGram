import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowLeft, Clock, Calendar, User, Share2, Tag, ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react'
import { getAllPosts, getPostBySlug, getRelatedPosts } from '../../data/blogs'

export default function BlogPostPage({ post, relatedPosts = [] }) {
  const router = useRouter()

  if (router.isFallback || !post) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
        Loading article...
      </div>
    )
  }

  const canonicalUrl = `https://spialr.com/blog/${post.slug}`

  return (
    <>
      <Head>
        <title>{post.title} — Spialr Blog</title>
        <meta name="description" content={post.description} />
        <link rel="canonical" href={canonicalUrl} key="canonical" />

        {/* OpenGraph */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} key="og:url" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:site_name" content="Spialr" />
        <meta property="article:published_time" content={post.publishedAt} />
        <meta property="article:author" content={post.author.name} />
        <meta property="article:section" content={post.category} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.description} />

        {/* Schema.org BlogPosting JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': canonicalUrl
              },
              headline: post.title,
              description: post.description,
              datePublished: post.publishedAt,
              dateModified: post.publishedAt,
              author: {
                '@type': 'Person',
                name: post.author.name,
                jobTitle: post.author.role,
                url: 'https://spialr.com/about'
              },
              publisher: {
                '@type': 'Organization',
                name: 'Spialr Analytics',
                url: 'https://spialr.com/',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://spialr.com/favicon.png'
                }
              }
            })
          }}
        />

        <style>{`
          .article-prose {
            color: var(--text);
            font-size: 16.5px;
            line-height: 1.8;
            font-family: var(--font-body);
          }
          .article-prose p {
            margin-bottom: 22px;
            color: var(--text-dim);
          }
          .article-prose h2 {
            font-family: var(--font-display);
            font-size: clamp(22px, 3vw, 26px);
            font-weight: 800;
            color: var(--text);
            margin-top: 42px;
            margin-bottom: 16px;
            letter-spacing: -0.02em;
            line-height: 1.3;
          }
          .article-prose h3 {
            font-family: var(--font-display);
            font-size: 19px;
            font-weight: 700;
            color: var(--text);
            margin-top: 28px;
            margin-bottom: 12px;
            line-height: 1.35;
          }
          .article-prose ul, .article-prose ol {
            margin-bottom: 24px;
            padding-left: 24px;
            color: var(--text-dim);
          }
          .article-prose li {
            margin-bottom: 10px;
            line-height: 1.7;
          }
          .article-prose blockquote {
            margin: 28px 0;
            padding: 18px 24px;
            border-left: 4px solid var(--accent);
            background: var(--surface2);
            border-radius: 0 12px 12px 0;
            font-size: 16px;
            color: var(--text);
            line-height: 1.65;
          }
          .article-prose code {
            background: var(--surface2);
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 14px;
            border: 1px solid var(--border);
            color: var(--accent);
          }
          .article-prose table {
            width: 100%;
            border-collapse: collapse;
            margin: 28px 0;
            font-size: 14.5px;
            overflow-x: auto;
            display: block;
          }
          .article-prose th, .article-prose td {
            padding: 12px 16px;
            border: 1px solid var(--border);
            text-align: left;
          }
          .article-prose th {
            background: var(--surface2);
            font-weight: 700;
            color: var(--text);
          }
          .article-prose td {
            color: var(--text-dim);
          }
        `}</style>
      </Head>

      <main style={{ maxWidth: 840, margin: '0 auto', padding: '40px 20px 100px' }}>
        {/* Navigation Breadcrumbs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          color: 'var(--text-muted)',
          marginBottom: 32,
          flexWrap: 'wrap'
        }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            Home
          </Link>
          <span>/</span>
          <Link href="/blog" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            Blog
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{post.category}</span>
        </div>

        {/* Back Link */}
        <Link href="/blog" style={{ textDecoration: 'none' }}>
          <span style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 24,
            cursor: 'pointer',
            fontWeight: 600
          }}>
            <ArrowLeft size={14} /> Back to all articles
          </span>
        </Link>

        {/* Article Header */}
        <header style={{ marginBottom: 36, borderBottom: '1px solid var(--border)', paddingBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(225, 48, 108, 0.1)',
              color: 'var(--accent)'
            }}>
              {post.category}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Clock size={13} /> {post.readTime}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={13} /> Published {post.publishedAt}
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4.5vw, 42px)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            color: 'var(--text)',
            lineHeight: 1.2,
            marginBottom: 20
          }}>
            {post.title}
          </h1>

          <p style={{
            fontSize: 18,
            color: 'var(--text-dim)',
            lineHeight: 1.6,
            marginBottom: 24
          }}>
            {post.description}
          </p>

          {/* Author Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '16px 20px',
            background: 'var(--surface2)',
            borderRadius: 14,
            border: '1px solid var(--border)'
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 16,
              flexShrink: 0
            }}>
              SK
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                {post.author.name}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                {post.author.role}
              </div>
            </div>
          </div>
        </header>

        {/* Article Body Content */}
        <article className="article-prose" dangerouslySetInnerHTML={{ __html: post.content }} />

        {/* Tags Row */}
        {post.tags && post.tags.length > 0 && (
          <div style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap'
          }}>
            <Tag size={15} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginRight: 4 }}>Topics:</span>
            {post.tags.map(t => (
              <span key={t} style={{
                fontSize: 12,
                padding: '4px 10px',
                borderRadius: 100,
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                color: 'var(--text-dim)'
              }}>
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Author Bio Box */}
        <div style={{
          marginTop: 40,
          padding: '24px 28px',
          borderRadius: 16,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)' }}>
            About the Author
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
            {post.author.name}
          </div>
          <p style={{ fontSize: 13.5, color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>
            Lead curator and data analyst at Spialr. Sanjeeva monitors verified social leaderboards, algorithmic recommendation shifts, and creator growth velocity, compiling transparent benchmarks for public discovery and marketing analytics.
          </p>
        </div>

        {/* Related Articles Section */}
        {relatedPosts.length > 0 && (
          <div style={{ marginTop: 60 }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--text)',
              marginBottom: 20
            }}>
              Related Analytics &amp; Guides
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 16
            }}>
              {relatedPosts.map(rel => (
                <Link key={rel.slug} href={`/blog/${rel.slug}`} style={{ textDecoration: 'none' }}>
                  <div
                    className="card"
                    style={{
                      height: '100%',
                      padding: 20,
                      borderRadius: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 12
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
                        {rel.category}
                      </span>
                      <h3 style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: 'var(--text)',
                        lineHeight: 1.35,
                        marginTop: 6,
                        marginBottom: 6
                      }}>
                        {rel.title}
                      </h3>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {rel.readTime} · {rel.publishedAt}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA to Live Rankings */}
        <div style={{
          marginTop: 64,
          padding: '32px 28px',
          borderRadius: 16,
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14
        }}>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 800,
            color: 'var(--text)',
            margin: 0
          }}>
            Check Live Follower Growth on Spialr
          </h3>
          <p style={{
            fontSize: 14,
            color: 'var(--text-dim)',
            maxWidth: 500,
            lineHeight: 1.6,
            margin: 0
          }}>
            Explore real-time daily growth, follower trends, and trending Instagram Reels across India and global creators.
          </p>
          <Link href="/live">
            <button className="btn btn-primary" style={{ padding: '10px 22px', fontSize: 14 }}>
              Open Live Standings
            </button>
          </Link>
        </div>
      </main>
    </>
  )
}

export async function getStaticPaths() {
  const posts = getAllPosts()
  const paths = posts.map(p => ({
    params: { slug: p.slug }
  }))

  return {
    paths,
    fallback: false
  }
}

export async function getStaticProps({ params }) {
  const post = getPostBySlug(params.slug)

  if (!post) {
    return {
      notFound: true
    }
  }

  const relatedPosts = getRelatedPosts(params.slug, 3)

  return {
    props: {
      post,
      relatedPosts
    }
  }
}
