// Simple JavaScript Backend Server (CommonJS - No TypeScript, No ESM required)
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const DB_PATH = process.env.DATABASE_URL || './data.db';
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const crypto = require('crypto');

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Init DB (better-sqlite3 if available, otherwise in-memory fallback)
let db;
let usingMemoryDb = false;
let memory = null; // Make memory accessible outside catch block
try {
  const Database = require('better-sqlite3');
  db = new Database.default ? new Database.default(DB_PATH) : new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  console.log('✅ Database initialized (better-sqlite3)');
} catch (err) {
  usingMemoryDb = true;
  console.warn('⚠️ better-sqlite3 not available, using in-memory storage. Error:', err?.message || err);
  memory = {
    chat_history: [],
    sms_subscriptions: [],
    sms_logs: [],
    users: [], // Added users array
    disease_predictions: [], // Added disease_predictions array
  };
  db = {
    exec: () => {},
    pragma: () => {},
    prepare: (sql) => {
      const lower = String(sql).toLowerCase();
      return {
        run: (...args) => {
          if (lower.startsWith('insert into chat_history')) {
            const [id, user_id, bot_type, message, response] = args;
            memory.chat_history.push({ id, user_id, bot_type, message, response, created_at: new Date().toISOString() });
            return { changes: 1 };
          }
          if (lower.startsWith('insert into sms_subscriptions')) {
            const [id, phone_number, language, subscribed_services] = args;
            const existingIdx = memory.sms_subscriptions.findIndex(s => s.phone_number === phone_number);
            if (existingIdx >= 0) memory.sms_subscriptions.splice(existingIdx, 1);
            memory.sms_subscriptions.push({ id, phone_number, language, subscribed_services, is_active: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
            return { changes: 1 };
          }
          if (lower.startsWith('update sms_subscriptions')) {
            const [language, subscribed_services, phone_number] = args;
            const sub = memory.sms_subscriptions.find(s => s.phone_number === phone_number);
            if (sub) {
              sub.language = language;
              sub.subscribed_services = subscribed_services;
              sub.is_active = 1;
              sub.updated_at = new Date().toISOString();
            }
            return { changes: sub ? 1 : 0 };
          }
          if (lower.startsWith('insert into sms_logs')) {
            const [id, phone_number, message, status] = args;
            memory.sms_logs.push({ id, phone_number, message, status, sent_at: new Date().toISOString(), twilio_sid: null, error_message: null });
            return { changes: 1 };
          }
          // Added users insert support
          if (lower.startsWith('insert into users')) {
            const [id, email, password_hash] = args;
            const existing = memory.users.find(u => u.email === email);
            if (existing) {
              const e = new Error('UNIQUE constraint failed: users.email');
              e.code = 'SQLITE_CONSTRAINT';
              throw e;
            }
            memory.users.push({ id, email, password_hash, created_at: new Date().toISOString() });
            return { changes: 1 };
          }
          // Added disease_predictions insert support
          if (lower.startsWith('insert into disease_predictions')) {
            const [id, user_id, indicators, predictions, overall_risk_score, alert_level, preventive_plan] = args;
            memory.disease_predictions.push({ 
              id, user_id, indicators, predictions, overall_risk_score, alert_level, preventive_plan,
              created_at: new Date().toISOString()
            });
            return { changes: 1 };
          }
          return { changes: 0 };
        },
        get: (param) => {
          if (lower.startsWith('select * from sms_subscriptions where phone_number')) {
            return memory.sms_subscriptions.find(s => s.phone_number === param) || undefined;
          }
          // Added users select support
          if (lower.includes('select') && lower.includes('from users') && lower.includes('where email')) {
            return memory.users.find(u => u.email === param) || undefined;
          }
          return undefined;
        },
        all: (...params) => {
          if (lower.startsWith('select id, phone_number, language')) {
            const rows = memory.sms_subscriptions.filter(s => s.is_active).sort((a,b) => (b.created_at || '').localeCompare(a.created_at || ''));
            return rows.slice(0, Number(params[0]) || rows.length);
          }
          if (lower.startsWith('select * from sms_logs')) {
            const rows = [...memory.sms_logs].sort((a,b) => (b.sent_at || '').localeCompare(a.sent_at || ''));
            return rows.slice(0, Number(params[0]) || rows.length);
          }
          // Added disease_predictions query support
          if (lower.includes('from disease_predictions')) {
            // Handle high-risk query
            if (lower.includes('where alert_level in')) {
              const rows = memory.disease_predictions
                .filter(p => p.alert_level === 'high' || p.alert_level === 'critical')
                .sort((a,b) => (b.created_at || '').localeCompare(a.created_at || ''));
              return rows.slice(0, 50);
            }
            // Handle history query with userId filter
            if (lower.includes('where user_id = ?')) {
              const userId = params[0];
              const limit = params[1] || 10;
              const rows = memory.disease_predictions
                .filter(p => p.user_id === userId)
                .sort((a,b) => (b.created_at || '').localeCompare(a.created_at || ''));
              return rows.slice(0, Number(limit));
            }
            // Handle trends query
            if (lower.includes('where user_id = ?') && lower.includes('order by created_at asc')) {
              const userId = params[0];
              const rows = memory.disease_predictions
                .filter(p => p.user_id === userId)
                .sort((a,b) => (a.created_at || '').localeCompare(b.created_at || ''));
              return rows;
            }
          }
          return [];
        }
      };
    }
  };
  console.log('✅ In-memory database initialized');
}

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

// Users Table
db.exec(`
  create table if not exists users (
    id text primary key,
    email text unique not null,
    password_hash text not null,
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

// For real DB this message already printed above

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Simple password hashing using scrypt
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = crypto.scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  const check = crypto.scryptSync(password, salt, 32).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
}

function generateToken(user) {
  // Minimal JWT using HMAC-SHA256 (no external deps)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: user.id, email: user.email, iat: Math.floor(Date.now()/1000) })).toString('base64url');
  const data = `${header}.${payload}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

function verifyToken(token) {
  const [header, payload, signature] = String(token || '').split('.');
  if (!header || !payload || !signature) return null;
  const data = `${header}.${payload}`;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { return null; }
}

// Auth routes
app.post('/api/auth/signup', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const password_hash = hashPassword(password);
  try {
    if (!usingMemoryDb) {
      db.prepare('insert into users (id, email, password_hash) values (?, ?, ?)').run(id, email, password_hash);
    } else {
      const existing = db.prepare('select * from users where email = ?').get?.(email);
      if (existing) return res.status(409).json({ error: 'email already exists' });
      db.prepare('insert into users (id, email, password_hash) values (?, ?, ?)').run(id, email, password_hash);
    }
    const token = generateToken({ id, email });
    return res.json({ token, user: { id, email } });
  } catch (e) {
    const msg = (e && e.message || '').toLowerCase();
    if (msg.includes('unique') || msg.includes('constraint')) return res.status(409).json({ error: 'email already exists' });
    return res.status(500).json({ error: 'signup failed' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const row = db.prepare('select id, email, password_hash from users where email = ?').get(email);
    if (!row) return res.status(401).json({ error: 'invalid credentials' });
    const ok = verifyPassword(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = generateToken({ id: row.id, email: row.email });
    return res.json({ token, user: { id: row.id, email: row.email } });
  } catch (e) {
    return res.status(500).json({ error: 'login failed' });
  }
});

// Google OAuth endpoint
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential, email, name, picture, access_token } = req.body || {};
    
    // Method 1: Google ID Token (credential)
    if (credential) {
      try {
        // Verify Google ID token with Google's API
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (!verifyRes.ok) throw new Error('Invalid Google token');
        const userInfo = await verifyRes.json();
        const email = userInfo.email;
        if (!email) return res.status(400).json({ error: 'Email not found in Google token' });
        
        // Find or create user
        let user = db.prepare('select id, email from users where email = ?').get(email);
        if (!user) {
          const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          const password_hash = hashPassword(crypto.randomBytes(16).toString('hex')); // Random password for Google users
          try {
            if (!usingMemoryDb) {
              db.prepare('insert into users (id, email, password_hash) values (?, ?, ?)').run(id, email, password_hash);
            } else {
              // Check if user already exists in memory
              const existing = memory.users.find(u => u.email === email);
              if (existing) {
                user = { id: existing.id, email: existing.email };
              } else {
                memory.users.push({ id, email, password_hash, created_at: new Date().toISOString() });
              }
            }
            if (!user) {
              user = db.prepare('select id, email from users where email = ?').get(email) || { id, email };
            }
          } catch (e) {
            // User might have been created by another request
            user = db.prepare('select id, email from users where email = ?').get(email);
            if (!user) {
              console.error('Failed to create/find user:', e);
              throw e;
            }
          }
        }
        
        const token = generateToken({ id: user.id, email: user.email });
        return res.json({ token, user: { id: user.id, email: user.email } });
      } catch (e) {
        console.error('Google token verification error:', e);
        return res.status(401).json({ error: 'Invalid Google token' });
      }
    }
    
    // Method 2: Access token (for OAuth2 flow)
    if (access_token && email) {
      // Verify access token by fetching user info
      try {
        const userRes = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`);
        if (!userRes.ok) throw new Error('Invalid access token');
        const googleUser = await userRes.json();
        
        if (googleUser.email !== email) {
          return res.status(400).json({ error: 'Email mismatch' });
        }
        
        // Find or create user
        let user = db.prepare('select id, email from users where email = ?').get(email);
        if (!user) {
          const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          const password_hash = hashPassword(crypto.randomBytes(16).toString('hex'));
          try {
            if (!usingMemoryDb) {
              db.prepare('insert into users (id, email, password_hash) values (?, ?, ?)').run(id, email, password_hash);
            } else {
              // Check if user already exists in memory
              const existing = memory.users.find(u => u.email === email);
              if (existing) {
                user = { id: existing.id, email: existing.email };
              } else {
                memory.users.push({ id, email, password_hash, created_at: new Date().toISOString() });
              }
            }
            if (!user) {
              user = db.prepare('select id, email from users where email = ?').get(email) || { id, email };
            }
          } catch (e) {
            user = db.prepare('select id, email from users where email = ?').get(email);
            if (!user) {
              console.error('Failed to create/find user:', e);
              throw e;
            }
          }
        }
        
        const token = generateToken({ id: user.id, email: user.email });
        return res.json({ token, user: { id: user.id, email: user.email } });
      } catch (e) {
        console.error('Google OAuth verification error:', e);
        return res.status(401).json({ error: 'Invalid Google access token' });
      }
    }
    
    return res.status(400).json({ error: 'Missing credential or email' });
  } catch (e) {
    console.error('Google auth error:', e);
    return res.status(500).json({ error: 'Google authentication failed' });
  }
});

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'unauthorized' });
  req.user = payload;
  next();
}

// Chat logs
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

// Places API proxy
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

// Helper: Format phone number
const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    return `+${cleaned}`;
  }
  return phone.startsWith('+') ? phone : `+${phone}`;
};

// SMS MOCK ROUTES
console.log('📱 Using MOCK SMS routes (Twilio packages not installed)');

// POST /api/sms/subscribe
app.post('/api/sms/subscribe', (req, res) => {
  try {
    const { phoneNumber, language = 'en', services = [] } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const servicesJson = JSON.stringify(services);

    // Check if already subscribed
    const existing = db.prepare('select * from sms_subscriptions where phone_number = ?').get(formattedPhone);

    if (existing) {
      // Update existing subscription
      db.prepare(`
        update sms_subscriptions 
        set language = ?, subscribed_services = ?, is_active = 1, updated_at = datetime('now')
        where phone_number = ?
      `).run(language, servicesJson, formattedPhone);

      console.log(`✅ Updated subscription for ${formattedPhone}`);
      
      return res.json({ 
        success: true, 
        message: 'Subscription updated successfully (MOCK MODE)',
        phoneNumber: formattedPhone,
        mock: true
      });
    }

    // Create new subscription
    db.prepare(`
      insert into sms_subscriptions (id, phone_number, language, subscribed_services)
      values (?, ?, ?, ?)
    `).run(id, formattedPhone, language, servicesJson);

    // Mock SMS sending (log instead)
    const welcomeMessage = language === 'hi' 
      ? `🩺 FalconBoys में आपका स्वागत है! आपने सफलतापूर्वक स्वास्थ्य अलर्ट के लिए सदस्यता ले ली है।`
      : `🩺 Welcome to FalconBoys! You've successfully subscribed to health alerts.`;

    console.log(`📱 MOCK SMS to ${formattedPhone}:`);
    console.log(`   ${welcomeMessage}`);

    // Log to database
    const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    db.prepare(`
      insert into sms_logs (id, phone_number, message, status)
      values (?, ?, ?, ?)
    `).run(logId, formattedPhone, welcomeMessage, 'mock_sent');

    return res.json({ 
      success: true, 
      message: 'Successfully subscribed! (MOCK MODE - Install twilio for real SMS)',
      phoneNumber: formattedPhone,
      mock: true
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    return res.status(500).json({ error: error.message || 'Failed to subscribe' });
  }
});

// GET /api/sms/subscribers
app.get('/api/sms/subscribers', (req, res) => {
  try {
    const subscribers = db.prepare(`
      select id, phone_number, language, subscribed_services, created_at
      from sms_subscriptions
      where is_active = 1
      order by created_at desc
    `).all();

    return res.json({ 
      success: true, 
      count: subscribers.length,
      subscribers,
      mock: true
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to fetch subscribers' });
  }
});

// GET /api/sms/logs
app.get('/api/sms/logs', (req, res) => {
  try {
    const { limit = '50' } = req.query;
    const logs = db.prepare(`
      select * from sms_logs
      order by sent_at desc
      limit ?
    `).all(Number(limit));

    return res.json({ 
      success: true, 
      count: logs.length,
      logs,
      mock: true
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to fetch logs' });
  }
});

// GET /api/whatsapp/qr - Generate QR Code (SVG)
app.get('/api/whatsapp/qr', (req, res) => {
  try {
    const { phone = '+918527870864' } = req.query;
    const message = encodeURIComponent('Hello FalconBoys! I want to start using your health services.');
    const whatsappUrl = `https://wa.me/${String(phone).replace(/\D/g, '')}?text=${message}`;

    // Create a simple SVG QR code placeholder
    const svgQR = `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="480" viewBox="0 0 400 480">
  <rect width="400" height="480" fill="#f0f0f0"/>
  <rect x="50" y="50" width="300" height="300" fill="white" stroke="#333" stroke-width="2"/>
  
  <!-- QR Code Pattern Simulation -->
  <g fill="#000">
    <!-- Top-left finder pattern -->
    <rect x="70" y="70" width="70" height="70"/>
    <rect x="85" y="85" width="40" height="40" fill="white"/>
    <rect x="95" y="95" width="20" height="20"/>
    
    <!-- Top-right finder pattern -->
    <rect x="260" y="70" width="70" height="70"/>
    <rect x="275" y="85" width="40" height="40" fill="white"/>
    <rect x="285" y="95" width="20" height="20"/>
    
    <!-- Bottom-left finder pattern -->
    <rect x="70" y="260" width="70" height="70"/>
    <rect x="85" y="275" width="40" height="40" fill="white"/>
    <rect x="95" y="285" width="20" height="20"/>
    
    <!-- Data modules (simulated pattern) -->
    <rect x="160" y="80" width="15" height="15"/>
    <rect x="180" y="80" width="15" height="15"/>
    <rect x="160" y="100" width="15" height="15"/>
    <rect x="200" y="100" width="15" height="15"/>
    <rect x="220" y="100" width="15" height="15"/>
    <rect x="160" y="120" width="15" height="15"/>
    <rect x="180" y="140" width="15" height="15"/>
    <rect x="200" y="140" width="15" height="15"/>
    <rect x="160" y="160" width="15" height="15"/>
    <rect x="200" y="160" width="15" height="15"/>
    <rect x="220" y="160" width="15" height="15"/>
    <rect x="180" y="180" width="15" height="15"/>
    <rect x="160" y="200" width="15" height="15"/>
    <rect x="200" y="200" width="15" height="15"/>
    <rect x="180" y="220" width="15" height="15"/>
    <rect x="220" y="220" width="15" height="15"/>
  </g>
  
  <text x="200" y="380" text-anchor="middle" font-family="Arial" font-size="16" fill="#25D366" font-weight="bold">
    WhatsApp QR Code
  </text>
  <text x="200" y="405" text-anchor="middle" font-family="Arial" font-size="14" fill="#666">
    Scan to chat on WhatsApp
  </text>
  <text x="200" y="430" text-anchor="middle" font-family="Arial" font-size="12" fill="#25D366">
      +91 852 787 0864
  </text>
  <text x="200" y="450" text-anchor="middle" font-family="Arial" font-size="10" fill="#666">
    Or click "Start WhatsApp Chat" button
  </text>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache');
    return res.send(svgQR);
  } catch (error) {
    console.error('QR Code generation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate QR code' });
  }
});

// POST /api/whatsapp/send
app.post('/api/whatsapp/send', (req, res) => {
  const { phoneNumber, message } = req.body;
  console.log(`💬 MOCK WhatsApp to ${phoneNumber}: ${message}`);
  return res.json({ 
    success: true, 
    message: 'WhatsApp message logged (MOCK MODE)',
    mock: true
  });
});

// Disease Risk Predictions Table
db.exec(`
  create table if not exists disease_predictions (
    id text primary key,
    user_id text not null,
    indicators text not null,
    predictions text not null,
    overall_risk_score real not null,
    alert_level text not null,
    preventive_plan text,
    created_at text default (datetime('now'))
  );
  create index if not exists idx_user_predictions on disease_predictions(user_id, created_at desc);
  create index if not exists idx_alert_level on disease_predictions(alert_level, created_at desc);
`);

// ML Prediction Logic (included in file to avoid ES module import issues)
const predictDiseaseRisk = (indicators) => {
  const risks = [];
  let riskScore = 0;
  
  // Diabetes Risk
  if (indicators.age >= 65) riskScore += 25;
  else if (indicators.age >= 45) riskScore += 15;
  if (indicators.bmi >= 30) riskScore += 20;
  else if (indicators.bmi >= 25) riskScore += 10;
  if (indicators.glucose >= 126) riskScore += 30;
  else if (indicators.glucose >= 100) riskScore += 15;
  if (indicators.familyHistory?.diabetes) riskScore += 15;
  if (indicators.lifestyle?.exercise === 'none') riskScore += 10;
  if (indicators.lifestyle?.diet === 'poor') riskScore += 10;
  if (indicators.lifestyle?.sleepQuality === 'poor') riskScore += 8;
  if (indicators.lifestyle?.sleepHours && (indicators.lifestyle.sleepHours < 6 || indicators.lifestyle.sleepHours > 9)) riskScore += 5;
  if (indicators.lifestyle?.stressLevel === 'high') riskScore += 8;
  if (indicators.lifestyle?.dailySteps && indicators.lifestyle.dailySteps < 5000) riskScore += 5;
  if (indicators.lifestyle?.waterIntake && indicators.lifestyle.waterIntake < 1.5) riskScore += 3;
  if (indicators.lifestyle?.workSchedule === 'night' || indicators.lifestyle?.workSchedule === 'shift') riskScore += 5;
  if (indicators.insulin > 20) riskScore += 10;
  
  let riskLevel = 'low';
  if (riskScore >= 70) riskLevel = 'critical';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 30) riskLevel = 'moderate';
  
  risks.push({
    disease: 'diabetes',
    riskScore: Math.min(100, Math.round(riskScore)),
    riskLevel,
    probability: riskScore / 100,
    factors: riskScore >= 30 ? ['Multiple risk factors identified'] : [],
    recommendations: riskScore >= 30 ? ['Monitor glucose levels', 'Implement lifestyle changes', 'Schedule annual screening'] : []
  });
  
  // Heart Failure Risk
  riskScore = 0;
  if (indicators.bloodPressureSystolic >= 140 || indicators.bloodPressureDiastolic >= 90) riskScore += 25;
  else if (indicators.bloodPressureSystolic >= 120 || indicators.bloodPressureDiastolic >= 80) riskScore += 10;
  if (indicators.cholesterol >= 240) riskScore += 20;
  else if (indicators.cholesterol >= 200) riskScore += 10;
  if (indicators.age >= 65) riskScore += 15;
  if (indicators.familyHistory?.heartDisease) riskScore += 15;
  if (indicators.lifestyle?.smoking) riskScore += 20;
  if (indicators.lifestyle?.alcohol === 'heavy') riskScore += 10;
  if (indicators.lifestyle?.exercise === 'none') riskScore += 10;
  if (indicators.lifestyle?.sleepQuality === 'poor') riskScore += 8;
  if (indicators.lifestyle?.sleepHours && (indicators.lifestyle.sleepHours < 6 || indicators.lifestyle.sleepHours > 9)) riskScore += 5;
  if (indicators.lifestyle?.stressLevel === 'high') riskScore += 10;
  if (indicators.lifestyle?.dailySteps && indicators.lifestyle.dailySteps < 5000) riskScore += 7;
  if (indicators.bmi >= 30) riskScore += 10;
  
  riskLevel = 'low';
  if (riskScore >= 70) riskLevel = 'critical';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 30) riskLevel = 'moderate';
  
  risks.push({
    disease: 'heart_failure',
    riskScore: Math.min(100, Math.round(riskScore)),
    riskLevel,
    probability: riskScore / 100,
    factors: riskScore >= 30 ? ['Multiple cardiac risk factors'] : [],
    recommendations: riskScore >= 30 ? ['Monitor blood pressure', 'Cardiovascular screening', 'Lifestyle changes'] : []
  });
  
  // Cancer Risk
  riskScore = 0;
  if (indicators.age >= 65) riskScore += 20;
  else if (indicators.age >= 50) riskScore += 10;
  if (indicators.lifestyle?.smoking) riskScore += 25;
  if (indicators.lifestyle?.alcohol === 'heavy') riskScore += 15;
  if (indicators.familyHistory?.cancer) riskScore += 15;
  if (indicators.bmi >= 30) riskScore += 15;
  if (indicators.lifestyle?.exercise === 'none') riskScore += 10;
  if (indicators.lifestyle?.diet === 'poor') riskScore += 10;
  if (indicators.lifestyle?.sleepQuality === 'poor') riskScore += 6;
  if (indicators.lifestyle?.sleepHours && (indicators.lifestyle.sleepHours < 6 || indicators.lifestyle.sleepHours > 9)) riskScore += 4;
  if (indicators.lifestyle?.stressLevel === 'high') riskScore += 7;
  if (indicators.lifestyle?.dailySteps && indicators.lifestyle.dailySteps < 5000) riskScore += 5;
  if (indicators.lifestyle?.workSchedule === 'night') riskScore += 5;
  
  riskLevel = 'low';
  if (riskScore >= 70) riskLevel = 'critical';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 30) riskLevel = 'moderate';
  
  risks.push({
    disease: 'cancer',
    riskScore: Math.min(100, Math.round(riskScore)),
    riskLevel,
    probability: riskScore / 100,
    factors: riskScore >= 30 ? ['Multiple cancer risk factors'] : [],
    recommendations: riskScore >= 30 ? ['Annual cancer screening', 'Lifestyle modifications', 'Regular checkups'] : []
  });
  
  const overallRiskScore = risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length;
  let alertLevel = 'none';
  const maxRisk = Math.max(...risks.map(r => r.riskScore));
  if (maxRisk >= 80) alertLevel = 'critical';
  else if (maxRisk >= 60) alertLevel = 'high';
  else if (maxRisk >= 40) alertLevel = 'medium';
  
  return { risks, overallRiskScore, alertLevel };
};

const generatePreventivePlan = (risks, alertLevel) => {
  const immediateActions = [];
  const lifestyleChanges = [];
  const medicalCheckups = [];
  
  risks.forEach(risk => {
    if (risk.riskLevel === 'critical' || risk.riskLevel === 'high') {
      immediateActions.push(`Urgent: Consult specialist for ${risk.disease} risk`);
      medicalCheckups.push(`${risk.disease} screening within 1 month`);
    } else if (risk.riskLevel === 'moderate') {
      medicalCheckups.push(`${risk.disease} screening within 3 months`);
    }
    lifestyleChanges.push(...risk.recommendations.filter(r => !r.toLowerCase().includes('screen') && !r.toLowerCase().includes('consult')));
  });
  
  let timeline = 'Ongoing preventive care';
  if (alertLevel === 'critical') timeline = 'Immediate action required - 1 week';
  else if (alertLevel === 'high') timeline = 'High priority - 1 month';
  else if (alertLevel === 'medium') timeline = 'Medium priority - 3 months';
  
  return {
    immediateActions: [...new Set(immediateActions)],
    lifestyleChanges: [...new Set(lifestyleChanges)],
    medicalCheckups: [...new Set(medicalCheckups)],
    timeline
  };
};

// POST /api/predictions/predict
app.post('/api/predictions/predict', (req, res) => {
  try {
    const { userId, indicators } = req.body || {};
    if (!userId || !indicators) {
      console.error('Missing required fields:', { userId: !!userId, indicators: !!indicators });
      return res.status(400).json({ error: 'userId and indicators are required' });
    }
    
    console.log('Processing prediction request for user:', userId);
    
    const { risks, overallRiskScore, alertLevel } = predictDiseaseRisk(indicators);
    const preventivePlan = generatePreventivePlan(risks, alertLevel);
    
    const predictionId = `pred_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const timestamp = new Date().toISOString();
    
    const predictionResponse = {
      userId,
      predictionId,
      timestamp,
      risks,
      overallRiskScore: Math.round(overallRiskScore * 10) / 10,
      alertLevel,
      preventivePlan
    };
    
    // Store in database
    const stmt = db.prepare(`
      insert into disease_predictions (
        id, user_id, indicators, predictions, overall_risk_score, alert_level, preventive_plan
      ) values (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      predictionId,
      userId,
      JSON.stringify(indicators),
      JSON.stringify(risks),
      overallRiskScore,
      alertLevel,
      JSON.stringify(preventivePlan)
    );
    
    return res.json(predictionResponse);
  } catch (e) {
    console.error('Prediction error:', e);
    return res.status(500).json({ error: e?.message || 'Failed to generate prediction' });
  }
});

// GET /api/predictions/history/:userId
app.get('/api/predictions/history/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const stmt = db.prepare(`
      select id, user_id, indicators, predictions, overall_risk_score, alert_level, preventive_plan, created_at as timestamp
      from disease_predictions
      where user_id = ?
      order by created_at desc
      limit ?
    `);
    const records = stmt.all(userId, limit);
    
    const predictions = records.map(record => ({
      userId: record.user_id,
      predictionId: record.id,
      timestamp: record.timestamp,
      risks: JSON.parse(record.predictions),
      overallRiskScore: record.overall_risk_score,
      alertLevel: record.alert_level,
      preventivePlan: JSON.parse(record.preventive_plan || '{}')
    }));
    
    return res.json(predictions);
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to fetch history' });
  }
});

// GET /api/predictions/high-risk
app.get('/api/predictions/high-risk', (req, res) => {
  try {
    const stmt = db.prepare(`
      select distinct user_id, id, predictions, overall_risk_score, alert_level, preventive_plan, created_at as timestamp
      from disease_predictions
      where alert_level in ('high', 'critical')
      order by created_at desc
      limit 50
    `);
    const records = stmt.all();
    
    const highRiskPatients = records.map(record => ({
      userId: record.user_id,
      predictionId: record.id,
      timestamp: record.timestamp,
      risks: JSON.parse(record.predictions),
      overallRiskScore: record.overall_risk_score,
      alertLevel: record.alert_level,
      preventivePlan: JSON.parse(record.preventive_plan || '{}')
    }));
    
    return res.json(highRiskPatients);
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to fetch high-risk patients' });
  }
});

// GET /api/predictions/trends/:userId
app.get('/api/predictions/trends/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { disease } = req.query;
    
    const stmt = db.prepare(`
      select predictions, created_at
      from disease_predictions
      where user_id = ?
      order by created_at asc
    `);
    const records = stmt.all(userId);
    
    const dates = [];
    const scores = [];
    
    records.forEach(record => {
      const risks = JSON.parse(record.predictions);
      const diseaseRisk = risks.find(r => r.disease === disease);
      
      if (diseaseRisk) {
        dates.push(record.created_at);
        scores.push(diseaseRisk.riskScore);
      }
    });
    
    return res.json({ dates, scores });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to fetch trends' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('========================================');
  console.log('🚀 Backend listening on http://localhost:' + PORT);
  console.log('📊 Database: ' + DB_PATH);
  console.log('📱 SMS/WhatsApp: MOCK MODE (Real Twilio not configured)');
  console.log('🤖 Disease Prediction API: Ready');
  console.log('✅ Server ready! Open http://localhost:5173/whatsapp-sms');
  console.log('========================================');
});

