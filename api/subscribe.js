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
        <!--[if mso]>
        <style type="text/css">
        body, table, td, a {font-family: Arial, Helvetica, sans-serif !important;}
        </style>
        <![endif]-->
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800&family=JetBrains+Mono:wght@500&display=swap');
          
          /* Reset */
          body { margin: 0; padding: 0; background-color: #020617; font-family: 'Outfit', Helvetica, Arial, sans-serif; color: #94a3b8; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
          table { border-spacing: 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
          img { border: 0; -ms-interpolation-mode: bicubic; display: block; }
          a { text-decoration: none; color: #10b981; }
          
          /* Wrapper */
          .wrapper { width: 100%; table-layout: fixed; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #020617; }
          .webkit { max-width: 600px; margin: 0 auto; }
          
          /* Mobile Styles */
          @media screen and (max-width: 600px) {
            .outer { width: 100% !important; margin: 0 auto !important; }
            .inner { width: 100% !important; margin: 0 auto !important; padding: 0 20px !important; }
            .content-padding { padding: 30px 20px !important; }
            .header-padding { padding: 40px 24px !important; }
            .mobile-full { width: 100% !important; display: block !important; }
            .mobile-center { text-align: center !important; }
            h1 { font-size: 32px !important; line-height: 1.1 !important; }
            p { font-size: 16px !important; line-height: 1.6 !important; }
            .access-key-card { padding: 24px !important; margin: 24px 0 !important; }
            .key-value { font-size: 20px !important; word-break: break-all; }
            .feature-item { margin-bottom: 20px !important; }
            .feature-icon { margin-bottom: 0 !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #020617; font-family: 'Outfit', Helvetica, Arial, sans-serif; color: #94a3b8;">
        <center class="wrapper" style="width: 100%; table-layout: fixed; background-color: #020617; padding-bottom: 40px;">
          <div class="webkit" style="max-width: 600px; margin: 0 auto;">
            
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="padding: 20px 0 0 0;">
              <tr>
                <td align="center">
                  
                  <div class="container" style="background-color: #0f172a; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 0 60px -15px rgba(16, 185, 129, 0.2); max-width: 600px; width: 100%;">
                    
                    <!-- Header -->
                    <div class="header" style="background: linear-gradient(135deg, #064e3b 0%, #022c22 100%); padding: 50px 40px; text-align: center; position: relative;">
                      <!-- Grid Overlay -->
                      <div class="header-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: radial-gradient(rgba(16, 185, 129, 0.15) 1px, transparent 1px); background-size: 24px 24px; opacity: 0.4;"></div>
                      
                      <!-- Logo -->
                      <table border="0" cellpadding="0" cellspacing="0" align="center" style="position: relative; z-index: 10; margin-bottom: 24px;">
                        <tr>
                          <td align="center">
                            <img src="${process.env.APP_URL}/Favicon.png" alt="Logo" width="70" height="70" style="display: block; width: 70px; height: 70px; border-radius: 16px; border: 2px solid #10b981; background-color: rgba(6, 78, 59, 0.8);">
                          </td>
                        </tr>
                      </table>

                      <!-- Badge -->
                      <div style="position: relative; z-index: 10; margin-bottom: 16px;">
                         <span style="display: inline-block; padding: 6px 16px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 100px; color: #34d399; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">Protocol Initiated</span>
                      </div>

                      <!-- Main Title -->
                      <h1 style="color: #ffffff; font-size: 40px; font-weight: 800; margin: 0; letter-spacing: -0.03em; line-height: 1.1; position: relative; z-index: 10; text-shadow: 0 4px 20px rgba(0,0,0,0.5);">THE <span style="color: #34d399;">SIGNAL.</span></h1>
                    </div>

                    <!-- Body -->
                    <div class="content-body" style="padding: 40px 40px 50px 40px; background-color: #0f172a;">
                      <!-- Personal Greeting -->
                      <div style="text-align: left; margin-bottom: 24px;">
                        <h2 style="color: #f8fafc; font-size: 22px; font-weight: 700; margin: 0 0 12px 0;">Welcome, ${name}</h2>
                        <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1; margin: 0;">You have successfully connected to the intelligence network. Your access privileges have been granted.</p>
                      </div>
                      
                      <!-- Access Card -->
                      <div class="access-key-card" style="background: linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 24px; margin: 32px 0; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02);">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <td valign="top">
                              <div style="color: #34d399; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Access Key</div>
                              <div style="font-family: 'JetBrains Mono', 'Courier New', monospace; color: #ffffff; font-size: 20px; letter-spacing: 1px; font-weight: 500;">USR-${Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-top: 16px;">
                               <div style="font-size: 13px; color: #64748b; font-weight: 500;">Priority: Alpha Node • Monday 09:00 Sync</div>
                            </td>
                          </tr>
                        </table>
                      </div>

                      <!-- Features Grid -->
                      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td style="padding-bottom: 24px;">
                             <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                   <td width="30" valign="top" style="padding-top: 2px;"><span style="font-size: 20px;">📰</span></td>
                                   <td style="padding-left: 15px;">
                                      <div style="color: #f1f5f9; font-weight: 700; font-size: 15px; margin-bottom: 4px;">3 Major Stories</div>
                                      <div style="color: #94a3b8; font-size: 14px; line-height: 1.5;">Critical AI breakthroughs synthesized for depth and clarity.</div>
                                   </td>
                                </tr>
                             </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom: 24px;">
                             <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                   <td width="30" valign="top" style="padding-top: 2px;"><span style="font-size: 20px;">🛠️</span></td>
                                   <td style="padding-left: 15px;">
                                      <div style="color: #f1f5f9; font-weight: 700; font-size: 15px; margin-bottom: 4px;">2 Tools & 2 Repos</div>
                                      <div style="color: #94a3b8; font-size: 14px; line-height: 1.5;">Hand-picked emerging tools and the week's most explosive GitHub repositories.</div>
                                   </td>
                                </tr>
                             </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom: 0;">
                             <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                   <td width="30" valign="top" style="padding-top: 2px;"><span style="font-size: 20px;">💡</span></td>
                                   <td style="padding-left: 15px;">
                                      <div style="color: #f1f5f9; font-weight: 700; font-size: 15px; margin-bottom: 4px;">1 Actionable Insight</div>
                                      <div style="color: #94a3b8; font-size: 14px; line-height: 1.5;">Strategic prompts or insights you can implement immediately.</div>
                                   </td>
                                </tr>
                             </table>
                          </td>
                        </tr>
                      </table>

                      <div style="height: 1px; background-color: rgba(255,255,255,0.08); width: 100%; margin: 30px 0;"></div>

                      <p style="margin: 0 0 30px 0; font-size: 15px; color: #cbd5e1; line-height: 1.6; text-align: center;">Your first briefing arrives this <strong>Monday at 9:00 AM sharp</strong>.</p>
                      
                      <!-- CTA -->
                      <div class="cta-wrap" style="text-align: center;">
                        <a href="${process.env.APP_URL}/?view=dashboard&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}" style="display: inline-block; background: #10b981; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 16px 36px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4); border: 1px solid rgba(255,255,255,0.1);">Enter Neural Dashboard</a>
                      </div>
                    </div>

                    <!-- Footer -->
                    <div class="footer-section" style="padding: 30px 40px; background-color: #020617; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
                      <!-- Feedback Node -->
                      <div style="margin: 20px 0; padding: 20px; background: rgba(16, 185, 129, 0.03); border: 1px dashed rgba(16, 185, 129, 0.2); border-radius: 12px; text-align: center;">
                        <p style="color: #cbd5e1; font-size: 13px; margin-bottom: 15px;">Have suggestions for our intelligence protocol?</p>
                        <a href="${process.env.APP_URL}/?view=feedback" style="display: inline-block; padding: 8px 20px; background: transparent; border: 1px solid #10b981; color: #10b981; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Transmit Feedback</a>
                      </div>

                      <p class="footer-text" style="color: #475569; font-size: 13px; line-height: 1.6; margin: 0 0 20px 0;">&copy; ${new Date().getFullYear()} THE SIGNAL.<br>Forged for the technical elite.</p>
                      
                      <!-- Social Links -->
                      <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 0 15px;">
                            <a href="https://github.com/MuhammadUsmanGM" style="text-decoration: none;">
                              <img src="https://img.icons8.com/ios-filled/50/ffffff/github.png" alt="GitHub" width="22" height="22" style="display: block; width: 22px; height: 22px; opacity: 0.6;">
                            </a>
                          </td>
                          <td style="padding: 0 15px;">
                            <a href="https://linkedin.com/in/muhammad-usman-ai-dev" style="text-decoration: none;">
                              <img src="https://img.icons8.com/ios-filled/50/ffffff/linkedin.png" alt="LinkedIn" width="22" height="22" style="display: block; width: 22px; height: 22px; opacity: 0.6;">
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Unsubscribe -->
                      <p style="margin: 0; font-size: 11px; color: #334155;">
                        <a href="${process.env.APP_URL}/?unsubscribe=true&email=${encodeURIComponent(email)}" style="color: #475569; text-decoration: none;">Protocol Deactivation</a>
                      </p>
                    </div>
                  </div>

                </td>
              </tr>
            </table>

          </div>
        </center>
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
