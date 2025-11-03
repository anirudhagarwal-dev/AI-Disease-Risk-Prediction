import { Router, Request, Response } from 'express';
import type { Twilio } from 'twilio';
import type Database from 'better-sqlite3';
import QRCode from 'qrcode';

export function createSMSRoutes(
  db: Database.Database,
  twilioClient: ReturnType<typeof import('twilio')> | null,
  twilioPhoneNumber: string | undefined
) {
  const router = Router();

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

  // POST /api/sms/subscribe - Subscribe to SMS notifications
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

        return res.json({ 
          success: true, 
          message: 'Subscription updated successfully',
          phoneNumber: formattedPhone 
        });
      }

      // Create new subscription
      db.prepare(`
        insert into sms_subscriptions (id, phone_number, language, subscribed_services)
        values (?, ?, ?, ?)
      `).run(id, formattedPhone, language, servicesJson);

      // Send welcome SMS
      if (twilioClient && twilioPhoneNumber) {
        try {
          const welcomeMessage = language === 'hi' 
            ? `🩺 FalconBoys में आपका स्वागत है! आपने सफलतापूर्वक स्वास्थ्य अलर्ट के लिए सदस्यता ले ली है। हम आपको महत्वपूर्ण स्वास्थ्य जानकारी भेजेंगे।`
            : `🩺 Welcome to FalconBoys! You've successfully subscribed to health alerts. We'll send you important health information and reminders.`;

          const message = await twilioClient.messages.create({
            body: welcomeMessage,
            from: twilioPhoneNumber,
            to: formattedPhone,
          });

          // Log SMS
          const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          db.prepare(`
            insert into sms_logs (id, phone_number, message, status, twilio_sid)
            values (?, ?, ?, ?, ?)
          `).run(logId, formattedPhone, welcomeMessage, 'sent', message.sid);

          console.log(`✅ Welcome SMS sent to ${formattedPhone}`);
        } catch (smsError: any) {
          console.error('Failed to send welcome SMS:', smsError.message);
          // Don't fail the subscription if SMS fails
        }
      }

      return res.json({ 
        success: true, 
        message: 'Successfully subscribed! Check your phone for confirmation.',
        phoneNumber: formattedPhone 
      });
    } catch (error: any) {
      console.error('Subscribe error:', error);
      return res.status(500).json({ error: error.message || 'Failed to subscribe' });
    }
  });

  // POST /api/sms/unsubscribe - Unsubscribe from SMS
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
        message: 'Successfully unsubscribed from SMS notifications' 
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to unsubscribe' });
    }
  });

  // POST /api/sms/send - Send SMS (for testing/admin use)
  router.post('/send', async (req: Request, res: Response) => {
    try {
      if (!twilioClient || !twilioPhoneNumber) {
        return res.status(503).json({ error: 'SMS service not configured' });
      }

      const { phoneNumber, message } = req.body;

      if (!phoneNumber || !message) {
        return res.status(400).json({ error: 'Phone number and message are required' });
      }

      const formattedPhone = formatPhoneNumber(phoneNumber);

      const sms = await twilioClient.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: formattedPhone,
      });

      // Log SMS
      const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      db.prepare(`
        insert into sms_logs (id, phone_number, message, status, twilio_sid)
        values (?, ?, ?, ?, ?)
      `).run(logId, formattedPhone, message, 'sent', sms.sid);

      return res.json({ 
        success: true, 
        messageSid: sms.sid,
        status: sms.status 
      });
    } catch (error: any) {
      const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      db.prepare(`
        insert into sms_logs (id, phone_number, message, status, error_message)
        values (?, ?, ?, ?, ?)
      `).run(logId, req.body.phoneNumber, req.body.message, 'failed', error.message);

      return res.status(500).json({ error: error.message || 'Failed to send SMS' });
    }
  });

  // GET /api/sms/subscribers - Get all active subscribers
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
        subscribers 
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to fetch subscribers' });
    }
  });

  // POST /api/whatsapp/send - Send WhatsApp message
  router.post('/send', async (req: Request, res: Response) => {
    try {
      if (!twilioClient || !twilioPhoneNumber) {
        return res.status(503).json({ error: 'WhatsApp service not configured' });
      }

      const { phoneNumber, message } = req.body;

      if (!phoneNumber || !message) {
        return res.status(400).json({ error: 'Phone number and message are required' });
      }

      const formattedPhone = formatPhoneNumber(phoneNumber);

      const whatsappMessage = await twilioClient.messages.create({
        body: message,
        from: `whatsapp:${twilioPhoneNumber}`,
        to: `whatsapp:${formattedPhone}`,
      });

      return res.json({ 
        success: true, 
        messageSid: whatsappMessage.sid,
        status: whatsappMessage.status 
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to send WhatsApp message' });
    }
  });

  // GET /api/whatsapp/qr - Generate WhatsApp QR Code
  router.get('/qr', async (req: Request, res: Response) => {
    try {
      const { phone = '+16182681153' } = req.query; // Default to your Twilio number
      const message = encodeURIComponent(
        'Hello FalconBoys! I want to start using your health services. Please help me with:\n\n' +
        '1. General health guidance\n' +
        '2. Mental health support\n' +
        '3. Medical image analysis\n' +
        '4. Vaccination reminders\n' +
        '5. Health alerts\n\n' +
        'Thank you!'
      );
      
      const whatsappUrl = `https://wa.me/${String(phone).replace(/\D/g, '')}?text=${message}`;

      // Generate QR code as PNG buffer
      const qrBuffer = await QRCode.toBuffer(whatsappUrl, {
        errorCorrectionLevel: 'H',
        type: 'png',
        width: 400,
        margin: 2,
      });

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(qrBuffer);
    } catch (error: any) {
      console.error('QR Code generation error:', error);
      return res.status(500).json({ error: error.message || 'Failed to generate QR code' });
    }
  });

  // GET /api/sms/logs - Get SMS logs
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
        logs 
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to fetch logs' });
    }
  });

  return router;
}

