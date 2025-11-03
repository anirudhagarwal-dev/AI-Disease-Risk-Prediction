import { API_BASE } from './config';

export async function logChat(params: { user_id: string; bot_type: string; message: string; response: string }) {
  try {
    const r = await fetch(`${API_BASE}/api/chatlogs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err?.error || `Chat log failed: ${r.status}`);
    }
    return await r.json();
  } catch (e) {
    console.warn('logChat error', e);
  }
}

export async function nearbyPlaces(params: { lat: number; lng: number; radius?: number; type?: string; keyword?: string }) {
  const qs = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    ...(params.radius ? { radius: String(params.radius) } : {}),
    ...(params.type ? { type: params.type } : {}),
    ...(params.keyword ? { keyword: params.keyword } : {}),
  });
  const r = await fetch(`${API_BASE}/api/places/nearby?${qs.toString()}`);
  if (!r.ok) throw new Error(`Places failed: ${r.status}`);
  return r.json();
}


