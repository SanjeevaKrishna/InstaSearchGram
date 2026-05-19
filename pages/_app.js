import '../styles/globals.css'
import Head from 'next/head'
import { useRouter } from 'next/router'
import BottomNav from '../components/BottomNav'

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const isAdmin = router.pathname.startsWith('/admin')

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.jpg" />
        <link rel="shortcut icon" href="/favicon.jpg" />
        <link rel="apple-touch-icon" href="/favicon.jpg" />
      </Head>
      <Component {...pageProps} />
      {!isAdmin && <BottomNav />}
    </>
  )
}
