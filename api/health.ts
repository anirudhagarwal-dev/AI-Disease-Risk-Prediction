import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ 
    ok: true, 
    time: new Date().toISOString(),
    platform: 'Vercel Serverless'
  });
}

