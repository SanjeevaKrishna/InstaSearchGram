export default function handler(req, res) {
  res.status(404).json({ error: 'Deprecated. Use /api/refresh_live_followers instead.' })
}
