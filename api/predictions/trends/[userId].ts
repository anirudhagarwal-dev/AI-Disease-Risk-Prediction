import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, disease } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Note: Without a database, we return empty data
    // To enable trends, use Vercel KV, Supabase, or MongoDB Atlas
    
    return res.status(200).json({ dates: [], scores: [] });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to fetch trends' });
  }
}

