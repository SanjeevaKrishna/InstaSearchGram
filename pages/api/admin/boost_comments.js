import { getAdminClient } from '../../../lib/supabase';
import { triggerDailyLikesBoost } from '../../../lib/commentBoost';

function verifyAdmin(req) {
  const auth = req.headers['x-admin-token'];
  if (!auth) return false;
  try {
    const decoded = Buffer.from(auth, 'base64').toString('utf8');
    return decoded === process.env.ADMIN_SECRET_CODE + ':admin';
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    if (!verifyAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = getAdminClient();
    const { force = true, target_slug = null, target_type = null } = req.body || {};

    const result = await triggerDailyLikesBoost(supabase, {
      force,
      targetSlug: target_slug,
      targetType: target_type
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('Boost comments error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
