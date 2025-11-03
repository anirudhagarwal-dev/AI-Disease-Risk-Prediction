const ANON_USER_ID_STORAGE_KEY = 'anon_user_id';

export function getOrCreateAnonUserId(): string {
  try {
    const existing = localStorage.getItem(ANON_USER_ID_STORAGE_KEY);
    if (existing) return existing;

    const newId = `anon_${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`;
    localStorage.setItem(ANON_USER_ID_STORAGE_KEY, newId);
    return newId;
  } catch {
    return 'anon_fallback';
  }
}


