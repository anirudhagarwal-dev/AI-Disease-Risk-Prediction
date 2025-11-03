import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Note: Without a database, we return empty array
    // To enable high-risk patient tracking, use Vercel KV, Supabase, or MongoDB Atlas
    
    return res.status(200).json([]);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to fetch high-risk patients' });
  }
}

