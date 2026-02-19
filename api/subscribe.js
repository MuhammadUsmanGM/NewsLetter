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
      <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="x-apple-disable-message-reformatting">
        <title>Intelligence Protocol Activated</title>
        <!--[if mso]>
        <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
        <![endif]-->
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Outfit:wght@400;600;700;800&display=swap');

          /* ── RESET ─────────────────────────────── */
          * { box-sizing: border-box; }
          body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
          table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
          img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
          body { margin: 0 !important; padding: 0 !important; background-color: #020617 !important; }

          /* ── BASE TYPOGRAPHY ───────────────────── */
          body, p, h1, h2, h3, td { font-family: 'Outfit', Arial, sans-serif; }
          .mono { font-family: 'Share Tech Mono', 'Courier New', monospace !important; }

          /* ── LAYOUT ────────────────────────────── */
          .email-wrapper { width: 100%; background-color: #020617; }
          .email-body    { width: 100%; max-width: 600px; margin: 0 auto; }

          /* ── SECTION PADDING ───────────────────── */
          .pad    { padding: 40px !important; }
          .pad-t  { padding: 36px 40px 0 !important; }

          /* ── CARD STYLES ───────────────────────── */
          .card-vip {
            background: linear-gradient(135deg, #0d2a1f 0%, #0a1628 100%);
            border: 1px solid #10b981;
            border-radius: 12px;
            width: 100%;
          }
          .card-preview {
            background: #0a1628;
            border: 1px solid #1e293b;
            border-left: 3px solid #10b981;
            border-radius: 12px;
            width: 100%;
          }
          .card-note {
            background: #0a1628;
            border: 1px solid #1e293b;
            border-radius: 12px;
            width: 100%;
          }
          .card-pad { padding: 28px 30px; }

          /* ── PRIVILEGE GRID ────────────────────── */
          .priv-cell-l { width: 50%; vertical-align: top; padding: 0 10px 16px 0; }
          .priv-cell-r { width: 50%; vertical-align: top; padding: 0 0 16px 10px; }
          .priv-last   { padding-bottom: 0 !important; }

          /* ── BRIEF ROWS ────────────────────────── */
          .brief-num  { width: 34px; vertical-align: top; padding: 2px 0 14px; font-family: 'Share Tech Mono','Courier New',monospace; font-size: 13px; color: #10b981; }
          .brief-text { vertical-align: top; padding: 0 0 14px 8px; font-size: 14px; color: #94a3b8; line-height: 1.65; }
          .brief-last { padding-bottom: 0 !important; }

          /* ── CTA ───────────────────────────────── */
          .cta-btn {
            display: inline-block;
            background-color: #10b981;
            color: #020617 !important;
            font-family: 'Outfit', Arial, sans-serif;
            font-size: 15px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            padding: 18px 44px;
            border-radius: 8px;
            text-decoration: none !important;
          }

          /* ── BADGE ─────────────────────────────── */
          .badge {
            display: inline-block;
            background: #10b981;
            color: #020617;
            font-family: 'Share Tech Mono','Courier New',monospace;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 2px;
            padding: 5px 12px;
            border-radius: 4px;
            text-transform: uppercase;
          }

          /* ── DIVIDER ───────────────────────────── */
          .divider { width: 100%; border: 0; border-top: 1px solid #1e293b; margin: 0; }

          /* ════════════════════════════════════════
            RESPONSIVE  ≤ 600px
          ════════════════════════════════════════ */
          @media screen and (max-width: 620px) {

            /* fluid body */
            .email-body { width: 100% !important; }

            /* tighter padding on mobile */
            .pad   { padding: 28px 18px !important; }
            .pad-t { padding: 28px 18px 0 !important; }
            .card-pad { padding: 22px 16px !important; }

            /* header h1 */
            h1 { font-size: 36px !important; letter-spacing: -1px !important; }
            h2 { font-size: 22px !important; }

            /* hide checkmark box so badge row doesn't break */
            .check-wrap { display: none !important; width: 0 !important; overflow: hidden !important; }

            /* stack privilege grid vertically */
            .priv-grid,
            .priv-row  { display: block !important; width: 100% !important; }
            .priv-cell-l,
            .priv-cell-r { display: block !important; width: 100% !important; padding: 0 0 16px 0 !important; }

            /* full-width CTA */
            .cta-btn {
              display: block !important;
              width: 100% !important;
              text-align: center !important;
              padding: 18px 10px !important;
            }
            .cta-wrap { width: 100% !important; }

            /* sub ID font */
            .sub-id { font-size: 18px !important; }

            /* footer stack */
            .footer-copy  { display: block !important; width: 100% !important; text-align: center !important; }
            .footer-icons { display: block !important; width: 100% !important; text-align: center !important; padding-top: 18px !important; }
            .footer-icons a { margin: 0 10px !important; }
          }
        </style>
      </head>
      <body style="margin:0;padding:0;background-color:#020617;">

      <div class="email-wrapper">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
      <td align="center" style="background-color:#020617;padding:0;">

        <table role="presentation" class="email-body" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;">


          <!-- ═══════════════════════════════
              HEADER
          ════════════════════════════════ -->
          <tr>
            <td class="pad" style="background:linear-gradient(160deg,#061a12 0%,#020617 100%);border-bottom:2px solid #10b981;text-align:center;">
              <img src="${process.env.APP_URL}/Favicon.png" alt="Signal" width="64" height="64"
                  style="display:block;margin:0 auto 22px auto;border:1px solid #10b981;border-radius:14px;width:64px;height:64px;">

              <p class="mono" style="margin:0 0 14px 0;font-size:11px;color:#10b981;letter-spacing:4px;text-transform:uppercase;">
                // SIGNAL_RELAY :: CONNECTION_STABLE
              </p>

              <h1 style="margin:0;font-size:52px;font-weight:800;color:#ffffff;letter-spacing:-2px;line-height:1;">
                THE <span style="color:#10b981;">SIGNAL.</span>
              </h1>

              <p class="mono" style="margin:14px 0 0 0;font-size:11px;color:#334155;letter-spacing:2px;">
                WEEKLY INTELLIGENCE BRIEF &nbsp;|&nbsp; EST. 2024
              </p>
            </td>
          </tr>


          <!-- ═══════════════════════════════
              GREETING
          ════════════════════════════════ -->
          <tr>
            <td class="pad-t">
              <p class="mono" style="margin:0 0 10px 0;font-size:11px;color:#10b981;letter-spacing:3px;text-transform:uppercase;">
                // INCOMING_TRANSMISSION
              </p>
              <h2 style="margin:0 0 16px 0;font-size:26px;font-weight:700;color:#f1f5f9;line-height:1.2;">
                Access granted, ${name}.
              </h2>
              <p style="margin:0 0 14px 0;font-size:16px;line-height:1.75;color:#94a3b8;">
                You've just joined a tight circle of engineers, founders, and researchers who don't settle for surface-level takes.
                Every <strong style="color:#e2e8f0;">Monday at 09:00 AM</strong>, a precision-crafted brief lands in your inbox —
                zero fluff, maximum signal.
              </p>
              <p style="margin:0;font-size:16px;line-height:1.75;color:#94a3b8;">
                Here's everything you've unlocked right now.
              </p>
            </td>
          </tr>

          <!-- thin rule -->
          <tr>
            <td class="pad-t">
              <hr class="divider">
            </td>
          </tr>


          <!-- ═══════════════════════════════
              VIP CLEARANCE CARD
          ════════════════════════════════ -->
          <tr>
            <td class="pad-t">
              <p class="mono" style="margin:0 0 14px 0;font-size:11px;color:#10b981;letter-spacing:3px;text-transform:uppercase;">
                // YOUR_ACCESS_PACKAGE
              </p>

              <table role="presentation" class="card-vip" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td class="card-pad">

                    <!-- Badge + ID row -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="vertical-align:top;">
                          <span class="badge">● CLEARANCE LEVEL: ALPHA</span>
                          <p class="mono sub-id" style="margin:12px 0 2px 0;font-size:22px;color:#ffffff;letter-spacing:2px;">
                            USR-${Math.random().toString(36).substring(2,10).toUpperCase()}
                          </p>
                          <p class="mono" style="margin:0;font-size:11px;color:#475569;letter-spacing:1px;">
                            SUBSCRIBER ID &nbsp;|&nbsp; DO NOT SHARE
                          </p>
                        </td>
                        <!-- hide on mobile via .check-wrap class -->
                        <td class="check-wrap" width="56" style="vertical-align:top;text-align:right;">
                          <div style="width:48px;height:48px;border:2px solid #10b981;border-radius:8px;text-align:center;line-height:48px;font-family:'Share Tech Mono','Courier New',monospace;font-size:22px;color:#10b981;">&#x2714;</div>
                        </td>
                      </tr>
                    </table>

                    <!-- inner divider -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:22px 0 20px 0;">
                      <tr><td style="border-top:1px solid rgba(16,185,129,0.25);font-size:0;line-height:0;">&nbsp;</td></tr>
                    </table>

                    <!-- Privileges label -->
                    <p class="mono" style="margin:0 0 16px 0;font-size:10px;color:#10b981;letter-spacing:3px;text-transform:uppercase;">
                      PRIVILEGES_ACTIVATED &nbsp;[ 4 / 4 ]
                    </p>

                    <!-- Privilege 2-col grid (stacks on mobile) -->
                    <table role="presentation" class="priv-grid" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr class="priv-row">
                        <td class="priv-cell-l">
                          <p style="margin:0 0 4px 0;font-size:13px;color:#10b981;font-weight:700;">⬡ &nbsp;WEEKLY BRIEF</p>
                          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.55;">3-3-2-2-1 format — breakthrough stories, gadgets, tools, and repos. Every Monday.</p>
                        </td>
                        <td class="priv-cell-r">
                          <p style="margin:0 0 4px 0;font-size:13px;color:#10b981;font-weight:700;">⬡ &nbsp;ALPHA DROPS</p>
                          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.55;">Subscriber-only resources before the public ever sees them.</p>
                        </td>
                      </tr>
                      <tr class="priv-row">
                        <td class="priv-cell-l priv-last">
                          <p style="margin:0 0 4px 0;font-size:13px;color:#10b981;font-weight:700;">⬡ &nbsp;SIGNAL ARCHIVE</p>
                          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.55;">Full access to every past issue in the vault.</p>
                        </td>
                        <td class="priv-cell-r priv-last">
                          <p style="margin:0 0 4px 0;font-size:13px;color:#10b981;font-weight:700;">⬡ &nbsp;COMMUNITY NODE</p>
                          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.55;">Direct line to the network. Reply anytime — I read every one.</p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>


          <!-- ═══════════════════════════════
              NEXT TRANSMISSION PREVIEW
          ════════════════════════════════ -->
          <tr>
            <td class="pad-t">
              <p class="mono" style="margin:0 0 14px 0;font-size:11px;color:#10b981;letter-spacing:3px;text-transform:uppercase;">
                // PREVIEW :: NEXT_TRANSMISSION
              </p>

              <table role="presentation" class="card-preview" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td class="card-pad">

                    <p class="mono" style="margin:0 0 20px 0;font-size:10px;color:#475569;letter-spacing:2px;">
                      BRIEF_#001 &nbsp;|&nbsp; MONDAY_09:00_UTC
                    </p>

                    <!-- 3-3-2-2-1 rows -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td class="brief-num">3x</td>
                        <td class="brief-text">Precision-picked breakthrough stories from the neural core.</td>
                      </tr>
                      <tr>
                        <td class="brief-num">3x</td>
                        <td class="brief-text">Top AI Gadgets: Hardware releases that actually matter.</td>
                      </tr>
                      <tr>
                        <td class="brief-num">2x</td>
                        <td class="brief-text">Elite Software Tools: Frameworks and nodes for your stack.</td>
                      </tr>
                      <tr>
                        <td class="brief-num">2x</td>
                        <td class="brief-text">Trending Repos: Open-source power to clone and build.</td>
                      </tr>
                      <tr>
                        <td class="brief-num brief-last">1x</td>
                        <td class="brief-text brief-last">Actionable Insight: The one idea to execute this week.</td>
                      </tr>
                    </table>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:20px;">
                      <tr><td style="border-top:1px solid #1e293b;font-size:0;line-height:0;padding-bottom:16px;">&nbsp;</td></tr>
                    </table>

                    <p class="mono" style="margin:0;font-size:11px;color:#334155;text-align:center;letter-spacing:2px;">
                      ■ ■ ■ &nbsp; CONTENT LOCKED UNTIL MONDAY &nbsp; ■ ■ ■
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>


          <!-- ═══════════════════════════════
              CTA BUTTON
          ════════════════════════════════ -->
          <tr>
            <td class="pad-t">
              <!-- VML fallback for Outlook -->
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
                href="${process.env.APP_URL}/?view=dashboard&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}"
                style="height:56px;v-text-anchor:middle;width:240px;" arcsize="8%" strokecolor="#10b981" fillcolor="#10b981">
                <w:anchorlock/>
                <center style="color:#020617;font-family:Arial,sans-serif;font-size:15px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;">
                  Initialize Dashboard &rarr;
                </center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-->
              <table role="presentation" class="cta-wrap" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius:8px;" bgcolor="#10b981">
                    <a href="${process.env.APP_URL}/?view=dashboard&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}"
                      class="cta-btn">
                      Initialize Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <!--<![endif]-->
              <p style="margin:14px 0 0 0;font-size:13px;color:#334155;">
                Your subscriber hub, archive, and preferences — all in one place.
              </p>
            </td>
          </tr>


          <!-- ═══════════════════════════════
              PERSONAL NOTE
          ════════════════════════════════ -->
          <tr>
            <td class="pad-t">
              <table role="presentation" class="card-note" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td class="card-pad">
                    <p class="mono" style="margin:0 0 10px 0;font-size:10px;color:#475569;letter-spacing:2px;">FROM_THE_OPERATOR</p>
                    <p style="margin:0 0 20px 0;font-size:15px;line-height:1.75;color:#94a3b8;">
                      Hey ${name} — really glad you made it here. I write THE SIGNAL every week because I believe good signal is rare and worth protecting. If anything ever resonates, challenges you, or misses the mark — reply and tell me. I'm always listening.
                      <br><br>
                      See you Monday morning.<br>
                      <strong style="color:#e2e8f0;">— Muhammad Usman</strong>
                    </p>

                    <!-- inner divider -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:20px;">
                      <tr><td style="border-top:1px solid rgba(255,255,255,0.06);font-size:0;line-height:0;">&nbsp;</td></tr>
                    </table>

                    <!-- feedback row -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="vertical-align:middle;">
                          <p class="mono" style="margin:0;font-size:10px;color:#475569;letter-spacing:2px;">AND I MEAN IT.</p>
                        </td>
                        <td style="vertical-align:middle;text-align:right;">
                          <a href="${process.env.APP_URL}/?view=feedback&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}"
                             style="display:inline-block;background:transparent;color:#10b981 !important;font-family:'Outfit',Arial,sans-serif;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;padding:10px 22px;border-radius:6px;border:1px solid #10b981;text-decoration:none;">
                            Tell Me Something →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>


          <!-- ═══════════════════════════════
              FOOTER
          ════════════════════════════════ -->
          <tr>
            <td class="pad">

              <!-- top rule -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
                <tr><td style="border-top:1px solid #1e293b;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>

              <!-- footer row: copy left, icons right -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="footer-copy" style="vertical-align:middle;">
                    <p class="mono" style="margin:0 0 4px 0;font-size:11px;color:#475569;letter-spacing:2px;">
                      THE SIGNAL &nbsp;|&nbsp; NEURAL RELAY ACTIVE
                    </p>
                    <p style="margin:0;font-size:12px;color:#334155;">
                      © ${new Date().getFullYear()} THE SIGNAL. Built for the technical elite.
                    </p>
                  </td>
                  <td class="footer-icons" width="80" style="vertical-align:middle;text-align:right;">
                    <a href="https://github.com/MuhammadUsmanGM" style="display:inline-block;margin-left:14px;">
                      <img src="https://img.icons8.com/ios-filled/50/10b981/github.png" width="20" height="20" alt="GitHub"
                          style="display:block;width:20px;height:20px;">
                    </a>
                    <a href="https://linkedin.com/in/muhammad-usman-ai-dev" style="display:inline-block;margin-left:14px;">
                      <img src="https://img.icons8.com/ios-filled/50/10b981/linkedin.png" width="20" height="20" alt="LinkedIn"
                          style="display:block;width:20px;height:20px;">
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0 0;font-size:11px;color:#334155;text-align:center;">
                <a href="${process.env.APP_URL}/?unsubscribe=true&email=${encodeURIComponent(email)}"
                  style="color:#334155;text-decoration:underline;">
                  Deactivate neural link
                </a>
              </p>

            </td>
          </tr>


        </table><!-- /email-body -->
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
