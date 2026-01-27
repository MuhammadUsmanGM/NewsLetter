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

  const { name, email, timezone } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    // 1. Insert into Supabase
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .upsert({ name, email, timezone }, { onConflict: 'email' })
      .select();

    if (error) throw error;

    // 2. Send Premium Welcome Email
    const welcomeHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to AI Insights</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
          
          body {
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
            font-family: 'Inter', -apple-system, sans-serif;
            background-color: #020617;
          }

          .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #0f172a;
          }

          .header {
            background: linear-gradient(135deg, #064e3b 0%, #022c22 100%);
            padding: 60px 40px;
            text-align: center;
          }

          .badge {
            display: inline-block;
            padding: 6px 16px;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
            border-radius: 20px;
            color: #10b981;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 24px;
          }

          .title {
            color: #ffffff;
            font-size: 36px;
            font-weight: 800;
            margin: 0;
            letter-spacing: -1px;
            line-height: 1.2;
          }

          .subtitle {
            color: #94a3b8;
            font-size: 18px;
            margin-top: 12px;
            line-height: 1.5;
          }

          .content {
            padding: 48px 40px;
            color: #cbd5e1;
            line-height: 1.7;
          }

          .greeting {
            color: #ffffff;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 24px;
          }

          .feature-card {
            background: rgba(30, 41, 59, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 24px;
            margin: 32px 0;
          }

          .feature-title {
            color: #10b981;
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
          }

          .btn {
            display: inline-block;
            background: #10b981;
            color: #ffffff !important;
            padding: 16px 32px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 700;
            font-size: 16px;
            margin-top: 16px;
            box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.3);
          }

          .footer {
            padding: 40px;
            text-align: center;
            background: #020617;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }

          .footer p {
            color: #64748b;
            font-size: 14px;
            margin: 0;
          }

          .social-links {
            margin-top: 24px;
          }

          .social-links a {
            color: #94a3b8;
            text-decoration: none;
            margin: 0 12px;
            font-size: 14px;
          }

          @media screen and (max-width: 600px) {
            .header { padding: 40px 24px; }
            .content { padding: 32px 24px; }
            .title { font-size: 28px; }
          }
        </style>
      </head>
      <body>
        <table width="100%" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="background-color: #020617; padding: 40px 0;">
              <table width="600" border="0" cellpadding="0" cellspacing="0" class="container" style="border-radius: 24px; overflow: hidden; box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5);">
                <!-- Header -->
                <tr>
                  <td class="header">
                    <div style="margin-bottom: 24px;">
                      <img src="${process.env.APP_URL}/Favicon.png" alt="NewsLetter AI Logo" style="width: 80px; height: 80px; border-radius: 16px; border: 2px solid #10b981; background: rgba(16, 185, 129, 0.1);">
                    </div>
                    <div class="badge">Success Verified</div>
                    <h1 class="title">NewsLetter AI<br><span style="color: #10b981;">The Future is Here.</span></h1>
                    <p class="subtitle">Personalized technical intelligence, delivered daily.</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td class="content">
                    <div class="greeting">Hi ${name},</div>
                    <p>We're thrilled to have you here at <strong>NewsLetter AI</strong>. You've officially joined an elite group of professionals who prioritize technical depth over surface-level hype.</p>
                    
                    <div class="feature-card" style="border-left: 4px solid #10b981;">
                      <div class="feature-title">🎁 Priority Access Granted</div>
                      <p style="margin: 0;">As a founding member, you've been granted <strong>Level 1 Priority</strong>. Your daily briefings are scheduled for exactly 9:00 AM in your timezone.</p>
                    </div>

                    <p style="margin-bottom: 8px; font-weight: 600; color: #ffffff;">What to expect from NewsLetter AI:</p>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
                      <tr>
                        <td width="24" valign="top" style="padding-top: 4px; color: #10b981;">&bull;</td>
                        <td style="padding-bottom: 12px;"><strong>Research Synthesis:</strong> Complex papers broken down into technical briefs.</td>
                      </tr>
                      <tr>
                        <td width="24" valign="top" style="padding-top: 4px; color: #10b981;">&bull;</td>
                        <td style="padding-bottom: 12px;"><strong>Deployment Strategies:</strong> Deep-dives into the latest LLMs.</td>
                      </tr>
                      <tr>
                        <td width="24" valign="top" style="padding-top: 4px; color: #10b981;">&bull;</td>
                        <td style="padding-bottom: 0;"><strong>Market Signals:</strong> Moving past the noise to find real value.</td>
                      </tr>
                    </table>

                    <p>Stay ahead of the curve. Your first briefing arrives at 9:00 AM sharp.</p>
                    
                    <div style="text-align: center; margin-top: 40px;">
                      <a href="${process.env.APP_URL}/?view=dashboard" class="btn" style="background: #10b981;">Enter Your Dashboard</a>
                    </div>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td class="footer">
                    <p>&copy; ${new Date().getFullYear()} NewsLetter AI. Crafted with ❤️ for the technical elite.</p>
                    <div class="social-links">
                      <a href="https://github.com/MuhammadUsmanGM">GitHub</a>
                      <a href="https://linkedin.com/in/muhammad-usman-ai-dev">LinkedIn</a>
                    </div>
                  </td>
                </tr>
              </table>
              <table width="600" border="0" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                <tr>
                  <td align="center" style="color: #475569; font-size: 12px;">
                    If you didn't sign up for this, you can <a href="${process.env.APP_URL}/?unsubscribe=true&email=${encodeURIComponent(email)}" style="color: #64748b; text-decoration: underline;">unsubscribe here</a>.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Welcome to NewsLetter AI: Your Welcome Gift Inside 🎁',
      html: welcomeHtml,
    });

    return res.status(200).json({ success: true, message: 'Subscribed and welcome email sent.' });
  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(500).json({ error: 'Failed to subscribe. Please try again later.' });
  }
}
