import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id, bot_type, message, response } = req.body || {};
    
    if (!user_id || !bot_type || !message || !response) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = `log_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // Note: Without a database, we just return success
    // To enable chat log storage, use Vercel KV, Supabase, or MongoDB Atlas
    
    return res.status(200).json({ id });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to save log' });
  }
}

