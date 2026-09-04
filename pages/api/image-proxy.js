// pages/api/image-proxy.js
export default async function handler(req, res) {
  const { url } = req.query
  if (!url || typeof url !== 'string') {
    return res.status(400).send('Missing url parameter')
  }

  try {
    let decoded = decodeURIComponent(url)
    if (decoded.includes('cloudinary.com') && decoded.includes('/upload/') && !decoded.includes('w_200')) {
      decoded = decoded.replace('/upload/', '/upload/w_200,h_200,c_fill,g_face,q_auto,f_auto/')
    }
    const response = await fetch(decoded, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch image')
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    res.setHeader('Access-Control-Allow-Origin', '*')

    if (req.query.format === 'base64') {
      const dataUrl = `data:${contentType};base64,${buffer.toString('base64')}`
      return res.status(200).json({ dataUrl })
    }

    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
    return res.send(buffer)
  } catch (err) {
    return res.status(500).send(err.message)
  }
}
