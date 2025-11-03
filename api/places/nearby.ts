import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY not configured' });
    }

    const { lat, lng, radius = '5000', type = 'doctor', keyword } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat,lng required' });
    }

    const qs = new URLSearchParams({
      location: `${lat},${lng}`,
      radius: String(radius),
      type: String(type),
      key: GOOGLE_MAPS_API_KEY,
    });
    
    if (keyword) {
      qs.set('keyword', String(keyword));
    }

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${qs.toString()}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data?.status && data.status !== 'OK') {
      console.warn('Places API status:', data.status, data.error_message);
    }
    
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Places proxy failed' });
  }
}

