import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ error: 'Email and message are required' });
  }

  try {
    // 1. Send Feedback Email to Admin
    const feedbackHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: sans-serif; background-color: #f4f4f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; }
          .header { font-size: 20px; font-weight: bold; color: #0f172a; margin-bottom: 20px; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
          .field { margin-bottom: 15px; }
          .label { font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
          .value { font-size: 16px; color: #334155; line-height: 1.5; }
          .message-box { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Incoming Signal (Feedback) 📡</div>
          
          <div class="field">
            <div class="label">Sender</div>
            <div class="value">${name || 'Anonymous'} &lt;${email}&gt;</div>
          </div>

          <div class="field">
            <div class="label">Message Content</div>
            <div class="value message-box">${message.replace(/\n/g, '<br>')}</div>
          </div>
          
          <div class="field">
            <div class="label">Timestamp</div>
            <div class="value">${new Date().toLocaleString()}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to the admin (using the SMTP_USER as the recipient)
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_USER, // Send to the authenticated email account (Admin)
      replyTo: email,
      subject: `[FEEDBACK] Signal from ${name || 'User'}`,
      html: feedbackHtml,
    });

    // 2. Optionally insert into Supabase if a table exists
    // We'll wrap this in a try-catch so it doesn't fail the whole request if the table is missing
    try {
      await supabase
        .from('newsletter_feedback')
        .insert({ name, email, message, created_at: new Date() });
    } catch (dbError) {
      console.warn('Database insert failed (table might be missing), but email was sent:', dbError);
    }

    return res.status(200).json({ success: true, message: 'Feedback transmitted successfully.' });
  } catch (error) {
    console.error('Feedback error:', error);
    return res.status(500).json({ error: 'Failed to transmit feedback. Please try again later.' });
  }
}
