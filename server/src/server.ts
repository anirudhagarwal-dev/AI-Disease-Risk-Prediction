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
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed to save log' });
  }
});

// Optional: Places Nearby proxy
app.get('/api/places/nearby', async (req, res) => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY not configured' });
    }
    const { lat, lng, radius = '5000', type = 'doctor', keyword } = req.query as Record<string, string>;
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
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Places proxy failed' });
  }
});

// SMS and WhatsApp Routes - Initialize asynchronously
(async () => {
  let smsRouter;
  try {
    // Try loading Twilio
    const twilioModule = await import('twilio');
    const twilio = twilioModule.default;
    
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

    let twilioClient: any = null;
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
      twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      console.log('✅ Twilio initialized successfully');
    }

    // Try loading real SMS routes
    const smsModule = await import('./smsRoutes.js');
    smsRouter = smsModule.createSMSRoutes(db, twilioClient, TWILIO_PHONE_NUMBER);
    console.log('✅ Using REAL SMS routes with Twilio');
  } catch (error) {
    // Fallback to mock routes
    console.warn('⚠️  Twilio packages not installed, using MOCK SMS routes');
    console.warn('   Run: npm install twilio qrcode @types/qrcode');
    
    const mockModule = await import('./smsMock.js');
    smsRouter = mockModule.createMockSMSRoutes(db);
  }

  app.use('/api/sms', smsRouter);
  app.use('/api/whatsapp', smsRouter); // WhatsApp routes are also in smsRouter

  // Disease Prediction Routes
  const { predictDiseaseRisk, generatePreventivePlan } = await import('./predictionService.js');

  // Type definition for database records
  interface PredictionRecord {
    id: string;
    user_id: string;
    indicators: string;
    predictions: string;
    overall_risk_score: number;
    alert_level: string;
    created_at: string;
    preventive_plan?: string;
  }

  // POST /api/predictions/predict - Generate disease risk prediction
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

      const predictionResponse: any = {
        userId,
        predictionId,
        timestamp,
        risks,
        overallRiskScore: Math.round(overallRiskScore * 10) / 10,
        alertLevel,
        preventivePlan,
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
    } catch (e: any) {
      console.error('Prediction error:', e);
      return res.status(500).json({ error: e?.message || 'Failed to generate prediction' });
    }
  });

  // GET /api/predictions/history/:userId - Get prediction history for a user
  app.get('/api/predictions/history/:userId', (req, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      const stmt = db.prepare(`
        select id, user_id, indicators, predictions, overall_risk_score, alert_level, preventive_plan, created_at as timestamp
        from disease_predictions
        where user_id = ?
        order by created_at desc
        limit ?
      `);
      const records = stmt.all(userId, limit) as PredictionRecord[];

      const predictions = records.map(record => ({
        userId: record.user_id,
        predictionId: record.id,
        timestamp: record.timestamp,
        risks: JSON.parse(record.predictions),
        overallRiskScore: record.overall_risk_score,
        alertLevel: record.alert_level,
        preventivePlan: JSON.parse(record.preventive_plan || '{}'),
      }));

      return res.json(predictions);
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Failed to fetch history' });
    }
  });

  // GET /api/predictions/high-risk - Get all high-risk patients (for clinicians)
  app.get('/api/predictions/high-risk', (req, res) => {
    try {
      const stmt = db.prepare(`
        select distinct user_id, id, predictions, overall_risk_score, alert_level, preventive_plan, created_at as timestamp
        from disease_predictions
        where alert_level in ('high', 'critical')
        order by created_at desc
        limit 50
      `);
      const records = stmt.all() as (PredictionRecord & { user_id: string })[];

      const highRiskPatients = records.map(record => ({
        userId: record.user_id,
        predictionId: record.id,
        timestamp: record.timestamp,
        risks: JSON.parse(record.predictions),
        overallRiskScore: record.overall_risk_score,
        alertLevel: record.alert_level,
        preventivePlan: JSON.parse(record.preventive_plan || '{}'),
      }));

      return res.json(highRiskPatients);
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Failed to fetch high-risk patients' });
    }
  });

  // GET /api/predictions/trends/:userId - Get risk trends for a disease
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
      const records = stmt.all(userId) as { predictions: string; created_at: string }[];

      const dates: string[] = [];
      const scores: number[] = [];

      records.forEach(record => {
        const risks = JSON.parse(record.predictions);
        const diseaseRisk = risks.find((r: any) => r.disease === disease || 
          (disease === 'diabetes' && r.disease === 'diabetes') ||
          (disease === 'heart_failure' && r.disease === 'heart_failure') ||
          (disease === 'cancer' && r.disease === 'cancer'));
        
        if (diseaseRisk) {
          dates.push(record.created_at);
          scores.push(diseaseRisk.riskScore);
        }
      });

      return res.json({ dates, scores });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Failed to fetch trends' });
    }
  });

  app.listen(PORT, () => {
    console.log(`🚀 Backend listening on http://localhost:${PORT}`);
    console.log(`📊 Database: ${DB_PATH}`);
    console.log(`📱 SMS/WhatsApp: Check logs above for status`);
    console.log(`🤖 Disease Prediction API: Ready`);
  });
})();


