
// Compiled JavaScript version of server.ts for easy startup without tsx
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const DB_PATH = process.env.DATABASE_URL || './data.db';
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Init DB
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Chat History Table
db.exec(`
  create table if not exists chat_history (
    id text primary key,
    user_id text not null,
    bot_type text not null,
    message text not null,
    response text not null,
    created_at text default (datetime('now'))
  );
`);

// SMS Subscriptions Table
db.exec(`
  create table if not exists sms_subscriptions (
    id text primary key,
    phone_number text unique not null,
    language text default 'en',
    subscribed_services text,
    is_active integer default 1,
    created_at text default (datetime('now')),
    updated_at text default (datetime('now'))
  );
`);

// SMS Logs Table
db.exec(`
  create table if not exists sms_logs (
    id text primary key,
    phone_number text not null,
    message text not null,
    status text,
    sent_at text default (datetime('now')),
    twilio_sid text,
    error_message text
  );
`);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.post('/api/chatlogs', (req, res) => {
  try {
    const { user_id, bot_type, message, response } = req.body || {};
    if (!user_id || !bot_type || !message || !response) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const id = `log_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const stmt = db.prepare(
      'insert into chat_history (id, user_id, bot_type, message, response) values (?, ?, ?, ?, ?)'
    );
    stmt.run(id, user_id, bot_type, message, response);
    return res.json({ id });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to save log' });
  }
});

// Optional: Places Nearby proxy
app.get('/api/places/nearby', async (req, res) => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY not configured' });
    }
    const { lat, lng, radius = '5000', type = 'doctor', keyword } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat,lng required' });
    const qs = new URLSearchParams({
      location: `${lat},${lng}`,
      radius: String(radius),
      type: String(type),
      key: GOOGLE_MAPS_API_KEY,
    });
    if (keyword) qs.set('keyword', keyword);
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${qs.toString()}`;
    const r = await fetch(url);
    const data = await r.json();
    if (data?.status && data.status !== 'OK') {
      console.warn('Places API status:', data.status, data.error_message);
    }
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Places proxy failed' });
  }
});

// SMS and WhatsApp Routes - Load mock routes directly
import('./smsMock.js').then(mockModule => {
  const smsRouter = mockModule.createMockSMSRoutes(db);
  app.use('/api/sms', smsRouter);
  app.use('/api/whatsapp', smsRouter);
  
  console.log('📱 Using MOCK SMS routes (install twilio & qrcode packages for real functionality)');
  
  app.listen(PORT, () => {
    console.log(`🚀 Backend listening on http://localhost:${PORT}`);
    console.log(`📊 Database: ${DB_PATH}`);
    console.log(`📱 SMS/WhatsApp: MOCK mode enabled`);
    console.log('');
    console.log('✅ Server is ready!');
    console.log(`   Frontend can now connect to: http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to load SMS routes:', err);
  process.exit(1);
});

