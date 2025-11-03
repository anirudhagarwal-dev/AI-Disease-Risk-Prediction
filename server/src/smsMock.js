// Mock SMS Routes (Fallback when Twilio packages aren't installed)
import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';

export function createMockSMSRoutes(db: Database.Database) {
  const router = Router();

  console.log('📱 Using MOCK SMS routes (install twilio & qrcode packages for real functionality)');

  // Helper: Format phone number
  const formatPhoneNumber = (phone: string): string => {
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

  // POST /api/sms/subscribe
  router.post('/subscribe', async (req: Request, res: Response) => {
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
          message: 'Subscription updated successfully (MOCK MODE - Install twilio package for real SMS)',
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
        message: 'Successfully subscribed! (MOCK MODE - Install twilio package for real SMS delivery)',
        phoneNumber: formattedPhone,
        mock: true
      });
    } catch (error: any) {
      console.error('Subscribe error:', error);
      return res.status(500).json({ error: error.message || 'Failed to subscribe' });
    }
  });

  // POST /api/sms/unsubscribe
  router.post('/unsubscribe', async (req: Request, res: Response) => {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required' });
      }

      const formattedPhone = formatPhoneNumber(phoneNumber);

      db.prepare(`
        update sms_subscriptions 
        set is_active = 0, updated_at = datetime('now')
        where phone_number = ?
      `).run(formattedPhone);

      return res.json({ 
        success: true, 
        message: 'Successfully unsubscribed from SMS notifications (MOCK MODE)',
        mock: true
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to unsubscribe' });
    }
  });

  // POST /api/sms/send
  router.post('/send', async (req: Request, res: Response) => {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({ error: 'Phone number and message are required' });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    console.log(`📱 MOCK SMS to ${formattedPhone}:`);
    console.log(`   ${message}`);

    // Log to database
    const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    db.prepare(`
      insert into sms_logs (id, phone_number, message, status)
      values (?, ?, ?, ?)
    `).run(logId, formattedPhone, message, 'mock_sent');

    return res.json({ 
      success: true, 
      message: 'SMS logged (MOCK MODE - Install twilio for real delivery)',
      mock: true
    });
  });

  // GET /api/sms/subscribers
  router.get('/subscribers', (_req: Request, res: Response) => {
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
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to fetch subscribers' });
    }
  });

  // POST /api/whatsapp/send
  router.post('/whatsapp/send', async (req: Request, res: Response) => {
    const { phoneNumber, message } = req.body;

    console.log(`💬 MOCK WhatsApp to ${phoneNumber}:`);
    console.log(`   ${message}`);

    return res.json({ 
      success: true, 
      message: 'WhatsApp message logged (MOCK MODE - Install twilio for real delivery)',
      mock: true
    });
  });

  // GET /api/whatsapp/qr
  router.get('/whatsapp/qr', async (req: Request, res: Response) => {
    try {
      const { phone = '+918527870864' } = req.query;
      const message = encodeURIComponent(
        'Hello FalconBoys! I want to start using your health services.'
      );
      
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
    
    <!-- Data modules (simulated) -->
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
  
  <text x="200" y="380" text-anchor="middle" font-family="Arial" font-size="16" fill="#666">
    MOCK QR CODE
  </text>
  <text x="200" y="405" text-anchor="middle" font-family="Arial" font-size="14" fill="#999">
    Install 'qrcode' package for real QR
  </text>
  <text x="200" y="430" text-anchor="middle" font-family="Arial" font-size="12" fill="#4CAF50">
    WhatsApp: ${phone}
  </text>
  <text x="200" y="450" text-anchor="middle" font-family="Arial" font-size="10" fill="#666">
    Click "Start WhatsApp Chat" button instead
  </text>
</svg>`;

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'no-cache');
      return res.send(svgQR);
    } catch (error: any) {
      console.error('QR Code generation error:', error);
      return res.status(500).json({ error: error.message || 'Failed to generate QR code' });
    }
  });

  // GET /api/sms/logs
  router.get('/logs', (req: Request, res: Response) => {
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
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to fetch logs' });
    }
  });

  return router;
}

