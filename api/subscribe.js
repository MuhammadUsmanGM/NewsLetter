import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import axios from 'axios';

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

  const { name, email, timezone, turnstileToken } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  // Verify Turnstile Token
  if (!turnstileToken) {
    return res.status(400).json({ error: 'Security verification failed. Please refresh and try again.' });
  }

  try {
    const verifyResp = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
      })
    );

    if (!verifyResp.data.success) {
      return res.status(400).json({ error: 'Failed security verification. Bot activity detected.' });
    }
  } catch (err) {
    console.error('Turnstile verification error:', err);
    // Continue if it's just a network error to avoid blocking real users, but log it
  }

  try {
    // 1. Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('newsletter_subscribers')
      .select('email, name, created_at, preferred_theme_index')
      .eq('email', email)
      .single();

    if (existingUser) {
      // If the name provided is different from the stored name, update it
      if (name && existingUser.name !== name) {
        await supabase
          .from('newsletter_subscribers')
          .update({ name })
          .eq('email', email);
      }

      return res.status(200).json({ 
        success: true, 
        alreadySubscribed: true, 
        name: name || existingUser.name,
        joinDate: existingUser.created_at,
        preferredThemeIndex: existingUser.preferred_theme_index,
        message: 'Welcome back! Your neural link is already active.' 
      });
    }

    // 2. Insert into Supabase (New Subscriber)
    const { data: newUser, error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert([{ name, email, timezone }])
      .select('created_at')
      .single();

    if (insertError) throw insertError;

    const joinDate = newUser?.created_at || new Date().toISOString();

    // 3. Send Premium Welcome Email (Only for NEW subscribers)
    const welcomeHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Intelligence Protocol Activated</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&display=swap');
          
          body { margin: 0 !important; padding: 0 !important; background-color: #020617 !important; font-family: 'Outfit', sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
          table { border-spacing: 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; }
          img { border: 0; -ms-interpolation-mode: bicubic; }
          .wrapper { width: 100%; background-color: #020617; }
          .content-table { max-width: 600px; margin: 0 auto; width: 100%; }
          
          @media screen and (max-width: 600px) {
            .header-padding { padding: 40px 20px !important; }
            .content-padding { padding: 30px 20px !important; }
            h1 { font-size: 34px !important; }
            .btn { width: 100% !important; text-align: center !important; display: block !important; box-sizing: border-box !important; }
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <!-- Full Width Header -->
          <table border="0" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #064e3b 0%, #020617 100%);">
            <tr>
              <td align="center">
                <!--[if mso | IE]>
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="600"><tr><td>
                <![endif]-->
                <table class="content-table" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td class="header-padding" align="center" style="padding: 80px 40px 60px 40px;">
                      <img src="${process.env.APP_URL}/Favicon.png" alt="Logo" width="80" height="80" style="width: 80px; height: 80px; border: 2px solid #10b981; border-radius: 16px;">
                      <div style="margin: 24px 0 12px 0; color: #34d399; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px;">Neural Link Validated</div>
                      <h1 style="color: #ffffff; font-size: 48px; font-weight: 800; margin: 0; letter-spacing: -2px; line-height: 1;">THE <span style="color: #34d399;">SIGNAL.</span></h1>
                    </td>
                  </tr>
                </table>
                <!--[if mso | IE]>
                </td></tr></table>
                <![endif]-->
              </td>
            </tr>
          </table>

          <!-- Content Section -->
          <table border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <!--[if mso | IE]>
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="600"><tr><td>
                <![endif]-->
                <table class="content-table" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td class="content-padding" style="padding: 60px 40px;">
                      <h2 style="color: #ffffff; font-size: 26px; font-weight: 700; margin: 0 0 20px 0;">Welcome, ${name}</h2>
                      <p style="font-size: 17px; line-height: 1.6; color: #94a3b8; margin: 0 0 40px 0;">Your connection to the intelligence relay is now stable. You have priority access to weekly 3-2-2-1 breakthroughs, technical repositories, and strategic AI insights.</p>
                      
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-left: 2px solid #10b981; background: rgba(16, 185, 129, 0.05); margin: 40px 0;">
                        <tr>
                          <td style="padding: 25px 30px;">
                            <div style="color: #34d399; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">Access Identification</div>
                            <div style="font-family: monospace; color: #ffffff; font-size: 24px; font-weight: 700;">USR-${Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 40px 0; font-size: 16px; color: #94a3b8; line-height: 1.6;">The first briefing arrives this <strong>Monday at 09:00 AM sharp</strong>.</p>
                      
                      <div align="left">
                        <a href="${process.env.APP_URL}/?view=dashboard&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}" class="btn" style="display: inline-block; background: #10b981; color: #ffffff; padding: 20px 45px; border-radius: 8px; text-decoration: none; font-weight: 800; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Initialize Dashboard</a>
                      </div>
                    </td>
                  </tr>
                </table>
                <!--[if mso | IE]>
                </td></tr></table>
                <![endif]-->
              </td>
            </tr>
          </table>

          <!-- Seamless Footer -->
          <table border="0" cellpadding="0" cellspacing="0" style="border-top: 1px solid rgba(255,255,255,0.05);">
            <tr>
              <td align="center" style="padding: 80px 40px;">
                <!--[if mso | IE]>
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="600"><tr><td>
                <![endif]-->
                <table class="content-table" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <div style="margin-bottom: 40px;">
                        <table align="center" border="0" cellpadding="0" cellspacing="0" style="width: auto;">
                          <tr>
                            <td style="padding: 0 15px;">
                              <a href="https://github.com/MuhammadUsmanGM"><img src="https://img.icons8.com/ios-filled/50/ffffff/github.png" width="24" height="24" style="opacity: 0.5;"></a>
                            </td>
                            <td style="padding: 0 15px;">
                              <a href="https://linkedin.com/in/muhammad-usman-ai-dev"><img src="https://img.icons8.com/ios-filled/50/ffffff/linkedin.png" width="24" height="24" style="opacity: 0.5;"></a>
                            </td>
                          </tr>
                        </table>
                      </div>
                      <p style="color: #475569; font-size: 13px; margin: 0 0 12px 0;">&copy; ${new Date().getFullYear()} THE SIGNAL. Forged for the technical elite.</p>
                      <a href="${process.env.APP_URL}/?unsubscribe=true&email=${encodeURIComponent(email)}" style="color: #475569; font-size: 11px; text-decoration: underline;">Deactivate Neural Link</a>
                    </td>
                  </tr>
                </table>
                <!--[if mso | IE]>
                </td></tr></table>
                <![endif]-->
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'THE SIGNAL: Your Intelligence Protocol has been Activated 📡',
      html: welcomeHtml,
    });

    return res.status(200).json({ 
      success: true, 
      joinDate: joinDate,
      message: 'Subscribed to THE SIGNAL. Your protocol has been initiated.' 
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(500).json({ error: 'Failed to subscribe. Please try again later.' });
  }
}
