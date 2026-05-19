export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { code } = req.body

  // Secret code is stored ONLY in environment variable - never visible in frontend
  const SECRET = process.env.ADMIN_SECRET_CODE

  if (!SECRET) {
    return res.status(500).json({ error: 'Admin not configured' })
  }

  if (code === SECRET) {
    return res.status(200).json({ success: true, token: Buffer.from(SECRET + ':admin').toString('base64') })
  }

  return res.status(401).json({ error: 'Wrong code' })
}
