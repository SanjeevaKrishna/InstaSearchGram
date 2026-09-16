import { getAdminClient } from '../../../lib/supabase';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = req.headers['x-admin-token'];
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = Buffer.from(auth, 'base64').toString('utf8');
    if (decoded !== process.env.ADMIN_SECRET_CODE + ':admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    let buffer;
    let contentType = 'image/jpeg';
    let ext = 'jpg';

    if (typeof image === 'string' && image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        contentType = match[1];
        if (contentType.includes('png')) ext = 'png';
        else if (contentType.includes('webp')) ext = 'webp';
        else if (contentType.includes('gif')) ext = 'gif';
        buffer = Buffer.from(match[2], 'base64');
      } else {
        return res.status(400).json({ error: 'Invalid data URL format' });
      }
    } else if (typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://'))) {
      const resp = await fetch(image);
      if (!resp.ok) throw new Error(`Failed to fetch image from URL: ${resp.status}`);
      contentType = resp.headers.get('content-type') || 'image/jpeg';
      if (contentType.includes('png')) ext = 'png';
      else if (contentType.includes('webp')) ext = 'webp';
      const arr = await resp.arrayBuffer();
      buffer = Buffer.from(arr);
    } else {
      return res.status(400).json({ error: 'Unsupported image format' });
    }

    const fileName = `insta_search_celebrities/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const supabase = getAdminClient();

    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(fileName, buffer, {
        contentType,
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(fileName);

    return res.status(200).json({ url: publicUrl });
  } catch (error) {
    console.error('Storage upload error:', error);
    return res.status(500).json({ error: 'Failed to upload image: ' + (error.message || error) });
  }
}
