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
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .btn { background: #0f172a; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; margin-top: 20px; }
        </style>
      </head>
      <body style="font-family: 'Inter', sans-serif; background-color: #f8fafc; padding: 40px 0; margin: 0;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <table width="600" style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 60px 40px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 32px; letter-spacing: -1px;">Welcome to AI Insights</h1>
                    <p style="color: #94a3b8; font-size: 16px; margin-top: 10px;">Your technical journey begins here.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px; color: #334155; line-height: 1.8;">
                    <h2 style="color: #0f172a; font-size: 24px;">Hi ${name},</h2>
                    <p>We're thrilled to have you join our inner circle of AI professionals and enthusiasts.</p>
                    
                    <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; margin: 30px 0;">
                      <h3 style="margin-top: 0; color: #0f172a;">🎁 Your Welcome Gift</h3>
                      <p style="margin-bottom: 0;">As a thank you for joining, you've been granted <strong>Priority Access</strong> to our daily AI breakthroughs. While others wait, you'll receive the most important technical updates at exactly 9:00 AM in your timezone.</p>
                    </div>

                    <p>What to expect from us:</p>
                    <ul style="padding-left: 20px;">
                      <li><strong>Daily Synthesis:</strong> The most important papers and releases simplified into 5-minute reads.</li>
                      <li><strong>Technical Deep-Dives:</strong> Understanding the "how" behind the latest LLMs and tools.</li>
                      <li><strong>Premium Visuals:</strong> Data and news presented in a clean, distraction-free format.</li>
                    </ul>

                    <p>Stay tuned! Your first briefing will arrive tomorrow at 9:00 AM sharp.</p>
                    
                    <a href="${process.env.APP_URL}" class="btn">Visit Our Dashboard</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px; background: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 14px; margin: 0;">&copy; ${new Date().getFullYear()} AI NewsLetter. All rights reserved.</p>
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
      subject: 'Welcome to AI Insights: Your Welcome Gift Inside 🎁',
      html: welcomeHtml,
    });

    return res.status(200).json({ success: true, message: 'Subscribed and welcome email sent.' });
  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(500).json({ error: 'Failed to subscribe. Please try again later.' });
  }
}
