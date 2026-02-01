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
        <title>Intelligence Protocol Activated</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=JetBrains+Mono:wght@500&display=swap');
          
          body {
            margin: 0;
            padding: 0;
            background-color: #020617;
            font-family: 'Outfit', -apple-system, system-ui, sans-serif;
            color: #94a3b8;
          }

          .container {
            width: 100%;
            max-width: 600px;
            margin: 40px auto;
            background-color: #0f172a;
            border-radius: 32px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 50px 100px -20px rgba(0,0,0,0.7);
          }

          .header {
            background: linear-gradient(135deg, #064e3b 0%, #022c22 100%);
            padding: 70px 48px;
            text-align: center;
            position: relative;
          }

          .header-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: radial-gradient(rgba(16, 185, 129, 0.15) 1px, transparent 1px);
            background-size: 20px 20px;
            opacity: 0.3;
          }

          .brand-logo {
            width: 84px;
            height: 84px;
            border-radius: 20px;
            border: 2px solid #10b981;
            background: rgba(16, 185, 129, 0.1);
            margin-bottom: 28px;
            position: relative;
            z-index: 10;
          }

          .badge {
            display: inline-flex;
            align-items: center;
            padding: 8px 20px;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 30px;
            color: #10b981;
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 24px;
            position: relative;
            z-index: 10;
          }

          .main-title {
            color: #ffffff;
            font-size: 42px;
            font-weight: 800;
            margin: 0;
            letter-spacing: -1.5px;
            line-height: 1.1;
            position: relative;
            z-index: 10;
          }

          .main-title span {
            color: #10b981;
          }

          .content-body {
            padding: 60px 48px;
            background-color: #0f172a;
          }

          .greeting-text {
            color: #ffffff;
            font-size: 26px;
            font-weight: 700;
            margin-bottom: 28px;
            letter-spacing: -0.5px;
          }

          .intro-p {
            font-size: 18px;
            line-height: 1.7;
            color: #cbd5e1;
            margin-bottom: 40px;
          }

          .access-key-card {
            background: linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 24px;
            padding: 32px;
            margin: 40px 0;
          }

          .card-header {
            color: #10b981;
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 16px;
          }

          .key-value {
            font-family: 'JetBrains Mono', monospace;
            color: #ffffff;
            font-size: 22px;
            letter-spacing: 2px;
            margin-bottom: 8px;
          }

          .key-meta {
            font-size: 14px;
            color: #64748b;
          }

          .feature-list {
            margin: 48px 0;
            padding: 0;
            list-style: none;
          }

          .feature-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 24px;
          }

          .feature-icon {
            color: #10b981;
            font-size: 18px;
            margin-right: 16px;
            line-height: 1;
            padding-top: 4px;
          }

          .feature-text strong {
            display: block;
            color: #ffffff;
            font-size: 16px;
            margin-bottom: 4px;
          }

          .feature-text span {
            font-size: 15px;
            color: #94a3b8;
          }

          .cta-wrap {
            text-align: center;
            margin: 50px 0 20px;
          }

          .action-btn {
            display: inline-block;
            background: #10b981;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #ffffff !important;
            padding: 20px 48px;
            border-radius: 16px;
            text-decoration: none;
            font-weight: 700;
            font-size: 18px;
            box-shadow: 0 15px 30px -10px rgba(16, 185, 129, 0.4);
            transition: transform 0.2s ease;
          }

          .footer-section {
            padding: 48px;
            background-color: #020617;
            text-align: center;
          }

          .footer-text {
            color: #475569;
            font-size: 14px;
            line-height: 1.6;
          }

          .social-grid {
            margin-top: 28px;
          }

          .social-link {
            color: #94a3b8 !important;
            text-decoration: none;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 1px;
          }

          .unsub {
            margin-top: 32px;
            font-size: 12px;
            color: #334155;
          }

          @media screen and (max-width: 600px) {
            .container { margin: 0; border-radius: 0; }
            .header { padding: 50px 24px; }
            .content-body { padding: 40px 24px; }
            .main-title { font-size: 32px; }
          }
        </style>
      </head>
      <body>
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #020617;">
          <tr>
            <td align="center" style="padding: 20px;">
              <div class="container">
                <!-- Header -->
                <div class="header">
                  <div class="header-overlay"></div>
                  <img src="${process.env.APP_URL}/Favicon.png" alt="THE SIGNAL Logo" class="brand-logo">
                  <div class="badge">Connection Established</div>
                  <h1 class="main-title">THE <span>SIGNAL.</span></h1>
                </div>

                <!-- Body -->
                <div class="content-body">
                  <div class="greeting-text">Protocol Initiated, ${name}.</div>
                  <p class="intro-p">Welcome to the inner circle. Your subscription is active, and your access to exclusive AI technical intelligence has been granted.</p>
                  
                  <div class="access-key-card">
                    <div class="card-header">Membership Access Key</div>
                    <div class="key-value">USR-${Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
                    <div class="key-meta">Priority Level: Founding Member • Monday 9:00 AM Sync</div>
                  </div>

                  <div class="feature-list">
                    <div class="feature-item">
                      <div class="feature-icon">📰</div>
                      <div class="feature-text">
                        <strong>3 Major Stories</strong>
                        <span>The critical breakthroughs you can't afford to miss, synthesized for depth.</span>
                      </div>
                    </div>
                    <div class="feature-item">
                      <div class="feature-icon">🛠️</div>
                      <div class="feature-text">
                        <strong>2 Tools to Try</strong>
                        <span>Hand-picked AI agents, frameworks, or tools to optimize your workflow.</span>
                      </div>
                    </div>
                    <div class="feature-item">
                      <div class="feature-icon">💡</div>
                      <div class="feature-text">
                        <strong>1 Actionable Insight</strong>
                        <span>A powerful prompt or strategic insight you can implement immediately.</span>
                      </div>
                    </div>
                  </div>

                  <p class="intro-p" style="margin-bottom: 20px;">Your first intelligence drop arrives this <strong>Monday at 9:00 AM sharp</strong> in your local timezone.</p>
                  
                  <div class="cta-wrap">
                    <a href="${process.env.APP_URL}/?view=dashboard&name=${encodeURIComponent(name)}" class="action-btn">Enter Neural Dashboard</a>
                  </div>
                </div>

                <!-- Footer -->
                <div class="footer-section">
                  <p class="footer-text">&copy; ${new Date().getFullYear()} THE SIGNAL.<br>Forged for the technical elite and technical founders.</p>
                  <!-- Social Links -->
                  <div class="social-grid">
                    <table align="center" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 0 15px;">
                          <a href="https://github.com/MuhammadUsmanGM" class="social-link">GITHUB</a>
                        </td>
                        <td style="padding: 0 15px;">
                          <a href="https://linkedin.com/in/muhammad-usman-ai-dev" class="social-link">LINKEDIN</a>
                        </td>
                        <td style="padding: 0 15px;">
                          <a href="${process.env.APP_URL}/?view=feedback&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}" class="social-link" style="color: #10b981 !important;">FEEDBACK</a>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Unsubscribe -->
                  <div class="unsub">
                    <p style="margin: 0 0 16px 0;">If you did not subscribe to this protocol, you can deactivate below:</p>
                    <table align="center" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="border: 1px solid #334155; border-radius: 6px; padding: 8px 16px;">
                          <a href="${process.env.APP_URL}/?unsubscribe=true&email=${encodeURIComponent(email)}" style="color: #475569; text-decoration: none; font-size: 11px; font-weight: 700; letter-spacing: 1px;">UNSUBSCRIBE</a>
                        </td>
                      </tr>
                    </table>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'THE SIGNAL: Your Intelligence Protocol has been Activated 📡',
      html: welcomeHtml,
    });

    return res.status(200).json({ success: true, message: 'Subscribed to THE SIGNAL. Your protocol has been initiated.' });
  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(500).json({ error: 'Failed to subscribe. Please try again later.' });
  }
}
