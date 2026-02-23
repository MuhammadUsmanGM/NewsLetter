// Note: dotenv is not needed in Vercel - env vars are automatically available
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import nodemailer from 'nodemailer';

// Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for backend
const supabase = createClient(supabaseUrl, supabaseKey);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const newsApiKey = process.env.NEWS_API_KEY;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function fetchTrendingRepos() {
  try {
    console.log('Fetching trending AI repositories from GitHub...');
    // Search for repos with AI-related topics, sort by stars, within the last week
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const dateQuery = lastWeek.toISOString().split('T')[0];
    
    const resp = await axios.get('https://api.github.com/search/repositories', {
      params: {
        q: `topic:ai OR topic:llm OR topic:machine-learning created:>${dateQuery}`,
        sort: 'stars',
        order: 'desc',
        per_page: 5
      },
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'TheSignal-Newsletter-Node'
      }
    });
    
    return (resp.data.items || []).map(repo => ({
      name: repo.full_name,
      description: repo.description,
      stars: repo.stargazers_count,
      url: repo.html_url,
      language: repo.language
    }));
  } catch (e) {
    console.error('GitHub fetch error:', e.message);
    return [];
  }
}

async function fetchAIIntelligence() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fromDate = sevenDaysAgo.toISOString();

  const fetchWithParams = async (params) => {
    try {
      console.log(`Fetching intelligence for query: ${params.q}...`);
      const resp = await axios.get('https://newsapi.org/v2/everything', { 
        params: { 
          ...params, 
          apiKey: newsApiKey, 
          language: 'en',
          pageSize: 30 
        } 
      });
      return (resp.data.articles || []).filter(a => a.urlToImage && a.description && a.title);
    } catch (e) {
      console.error('Fetch error:', e.response?.data?.message || e.message);
      return [];
    }
  };

  // 1. Broad search for high-quality AI breakthroughs
  let articles = await fetchWithParams({
    q: 'artificial intelligence OR "machine learning" OR "generative AI" OR "AI agents" OR "LLM breakthroughs"',
    from: fromDate,
    sortBy: 'popularity'
  });

  // 2. Focused search for AI Gadgets/Hardware
  let gadgets = await fetchWithParams({
    q: '"AI hardware" OR "AI gadget" OR "AI wearable" OR "AI glasses" OR "AI pin" OR "smart glasses"',
    from: fromDate,
    sortBy: 'relevancy'
  });

  const repos = await fetchTrendingRepos();

  console.log(`Found ${articles.length} signals, ${gadgets.length} gadgets, and ${repos.length} repos.`);
  return { articles: articles.slice(0, 15), gadgets: gadgets.slice(0, 8), repos };
}

async function generateWeeklyIntelligence(intelligenceData) {
  const { articles, gadgets, repos } = intelligenceData;
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const articlesContext = articles.map(a => `
    Title: ${a.title}
    Description: ${a.description}
    Source: ${a.source.name}
    URL: ${a.url}
    ImageURL: ${a.urlToImage}
  `).join('\n---\n');

  const gadgetsContext = gadgets.map(g => `
    Gadget/Device: ${g.title}
    Details: ${g.description}
    URL: ${g.url}
    ImageURL: ${g.urlToImage}
  `).join('\n---\n');

  const reposContext = repos.map(r => `
    Repo: ${r.name}
    Description: ${r.description}
    Stars: ${r.stars}
    Language: ${r.language}
    URL: ${r.url}
  `).join('\n---\n');

  const prompt = `
    You are the Lead Editor of "THE SIGNAL", a high-end intelligence protocol for technical founders and AI engineers.
    
    Based on these sources:
    STORIES: ${articlesContext}
    GADGETS: ${gadgetsContext}
    REPOS: ${reposContext}
    
    Create a premium weekly briefing following the **3-3-2-2-1 Structure**.
    CRITICAL INSTRUCTION: You MUST REPLACE all bracketed placeholders (like [Headline], [URL], [Repo Name], [Value Prop]) with real content from the provided sources. DO NOT output the literal placeholders.
    
    1. **3 MAJOR NEW STORIES**: Select the 3 most impactful breakthroughs from STORIES.
       - Use this HTML:
         <div style="margin-bottom: 40px;">
           <img src="[ImageURL]" style="width: 100%; height: auto; border-radius: 16px; margin-bottom: 20px;">
           <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 12px;">[Headline]</h2>
           <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">[Analysis]</p>
           <a href="[URL]" style="color: #10b981; font-weight: 700; text-decoration: none;">Read Technical Analysis →</a>
         </div>

    2. **3 TOP AI GADGETS**: Pick the 3 most innovative hardware releases or updates from GADGETS.
       - Use this HTML:
         <div style="background: linear-gradient(to right, #0d2a1f, #0a1628); border: 1px solid rgba(16,185,129,0.2); border-radius: 12px; padding: 22px; margin-bottom: 16px;">
           <div style="color: #10b981; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">GADGET PROTOCOL</div>
           <strong style="color: #ffffff; font-size: 18px; display: block; margin-bottom: 6px;">[Gadget Name]</strong>
           <p style="color: #94a3b8; margin: 0; font-size: 14px; line-height: 1.5;">[Why it matters / Hardware specs]</p>
           <a href="[URL]" style="display: inline-block; margin-top: 12px; color: #10b981; font-size: 12px; font-weight: 700; text-decoration: none; text-transform: uppercase;">View Hardware →</a>
         </div>

    3. **2 ELITE TOOLS**: Pick 2 emerging software AI tools.
       - Use this HTML:
         <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
           <div style="color: #10b981; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">TOOL NODE</div>
           <strong style="color: #ffffff; font-size: 18px;">[Tool Name]</strong>
           <p style="color: #cbd5e1; margin: 8px 0; font-size: 14px;">[Value Prop]</p>
           <a href="[URL]" style="color: #10b981; font-size: 13px; text-decoration: none; font-weight: 600;">Access Node →</a>
         </div>

    4. **2 TRENDING REPOS**: Pick 2 significant GitHub repos from REPOS.
       - Use this HTML:
         <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
           <div style="color: #8b5cf6; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">GITHUB NODE</div>
           <strong style="color: #ffffff; font-size: 18px;">[Repo Name]</strong>
           <p style="color: #cbd5e1; margin: 8px 0; font-size: 14px;">[Description] (Stars: [Stars], Language: [Language])</p>
           <a href="[URL]" style="color: #8b5cf6; font-size: 13px; text-decoration: none; font-weight: 600;">View Repository →</a>
         </div>

    5. **1 ACTIONABLE INSIGHT**: Provide one high-level insight.
       - Use a quote-style block with #10b981 border.
    
    Technical: Return ONLY the HTML content. No markdown. Inline styles only. White #ffffff, Primary #10b981, Muted #94a3b8.
  `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().replace(/```html|```/g, '').trim();
  } catch (error) {
    console.error('Error generating AI content:', error);
    return `<p style="color: #ffffff;">Neural processing error. Access dashboard for manual briefing.</p>`;
  }
}

async function sendNewsletter() {
  console.log('--- STARTING 3-2-1 WEEKLY INTELLIGENCE PROTOCOL ---');

  const intelligenceData = await fetchAIIntelligence();
  if (intelligenceData.articles.length === 0) {
    console.log('Insufficient signal found. Aborting protocol.');
    return;
  }

  const { data: subscribers, error } = await supabase
    .from('newsletter_subscribers')
    .select('*');

  if (error) {
    console.error('Database connection failure:', error);
    return;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  let sharedEmailBody = null;

  for (const subscriber of subscribers) {
    try {
      const localeOptions = { timeZone: subscriber.timezone, hour12: false };
      const userFullDate = new Intl.DateTimeFormat('en-CA', { ...localeOptions, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
      const userDay = new Intl.DateTimeFormat('en-US', { ...localeOptions, weekday: 'long' }).format(now);
      const userHour = parseInt(new Intl.DateTimeFormat('en-US', { ...localeOptions, hour: 'numeric' }).format(now));

      const isMonday = userDay === 'Monday';
      const is9AMOrLater = userHour >= 9;
      const alreadySent = subscriber.last_sent_date === userFullDate;
      const forceSend = process.argv && Array.isArray(process.argv) ? process.argv.includes('--force') : false;

      console.log(`[TARGET] ${subscriber.email} | Day: ${userDay} | Hour: ${userHour} | Sent: ${alreadySent}`);

      if ((isMonday && is9AMOrLater && !alreadySent) || forceSend) {
        if (!sharedEmailBody) {
          console.log('--- GENERATING NEURAL BRIEFING (3-2-1 STRUCTURE) ---');
          sharedEmailBody = await generateWeeklyIntelligence(intelligenceData);
          
          // ARCHIVE THE ISSUE: Save to Supabase for the web view
          try {
            console.log('--- ARCHIVING SIGNAL FOR WEB VIEW ---');
            const { error: archiveError } = await supabase
              .from('newsletter_archive')
              .insert([
                { 
                  week_date: dateStr, 
                  content_html: sharedEmailBody 
                }
              ]);
            
            if (archiveError) {
              console.error('Failed to archive newsletter:', archiveError);
            } else {
              console.log('Signal archived successfully for web view.');
            }
          } catch (archiveErr) {
            console.error('Archive error:', archiveErr);
          }
        }

        const unsubscribeUrl = `${process.env.APP_URL}/?unsubscribe=true&email=${encodeURIComponent(subscriber.email)}`;
        
        const premiumEmailHtml = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>THE SIGNAL: Intelligence Protocol</title>
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

    /* ── TYPOGRAPHY ────────────────────────── */
    body, p, h1, h2, h3, td, a { font-family: 'Outfit', Arial, sans-serif; }
    .mono { font-family: 'Share Tech Mono', 'Courier New', monospace !important; }

    /* ── LAYOUT ────────────────────────────── */
    .email-body { width: 100%; max-width: 600px; margin: 0 auto; }

    /* ── PADDING ───────────────────────────── */
    .pad   { padding: 40px !important; }
    .pad-t { padding: 36px 40px 0 !important; }

    /* ── ISSUE NUMBER STAMP ────────────────── */
    .issue-pill {
      display: inline-block;
      padding: 6px 16px;
      background: rgba(16,185,129,0.08);
      border: 1px solid rgba(16,185,129,0.3);
      border-radius: 20px;
      color: #10b981;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 3px;
    }

    /* ── SECTION LABEL ─────────────────────── */
    .section-label {
      font-family: 'Share Tech Mono','Courier New',monospace;
      font-size: 10px;
      color: #10b981;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin: 0 0 14px 0;
    }

    /* ── CONTENT BLOCK (each 3-2-2-1 item) ── */
    .content-block {
      background: #0a1628;
      border: 1px solid #1e293b;
      border-left: 3px solid #10b981;
      border-radius: 10px;
      width: 100%;
      margin-bottom: 16px;
    }
    .content-block-pad { padding: 24px 26px; }

    .block-tag {
      font-family: 'Share Tech Mono','Courier New',monospace;
      font-size: 9px;
      color: #10b981;
      letter-spacing: 3px;
      text-transform: uppercase;
      display: inline-block;
      background: rgba(16,185,129,0.08);
      border: 1px solid rgba(16,185,129,0.2);
      border-radius: 4px;
      padding: 3px 8px;
      margin-bottom: 10px;
    }
    .block-title {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 700;
      color: #f1f5f9;
      line-height: 1.3;
    }
    .block-body {
      margin: 0;
      font-size: 14px;
      line-height: 1.75;
      color: #94a3b8;
    }
    .block-link {
      display: inline-block;
      margin-top: 12px;
      font-size: 12px;
      font-weight: 700;
      color: #10b981 !important;
      text-decoration: none;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    /* ── DIVIDER ───────────────────────────── */
    .divider { border: 0; border-top: 1px solid #1e293b; margin: 0; width: 100%; }

    /* ── CTA BUTTONS ───────────────────────── */
    .btn-outline {
      display: inline-block;
      padding: 14px 28px;
      background: transparent;
      border: 1px solid #10b981;
      border-radius: 8px;
      color: #10b981 !important;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-decoration: none;
    }
    .btn-solid {
      display: inline-block;
      padding: 14px 28px;
      background: #10b981;
      border: 1px solid #10b981;
      border-radius: 8px;
      color: #020617 !important;
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-decoration: none;
    }

    /* ── FEEDBACK CARD ─────────────────────── */
    .feedback-card {
      background: linear-gradient(135deg, #0d2a1f 0%, #0a1628 100%);
      border: 1px solid rgba(16,185,129,0.25);
      border-radius: 12px;
      width: 100%;
    }

    /* ── STAT ROW ──────────────────────────── */
    .stat-cell { width: 33.33%; text-align: center; vertical-align: top; padding: 0 10px; }

    /* ═══════════════════════════════════════
       RESPONSIVE ≤ 620px
    ═══════════════════════════════════════ */
    @media screen and (max-width: 620px) {
      .email-body { width: 100% !important; }
      .pad   { padding: 24px 18px !important; }
      .pad-t { padding: 24px 18px 0 !important; }
      .content-block-pad { padding: 18px 16px !important; }

      h1 { font-size: 36px !important; letter-spacing: -1px !important; }
      h2 { font-size: 20px !important; }

      /* stack CTA buttons */
      .btn-outline,
      .btn-solid {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
        margin-bottom: 10px !important;
        margin-right: 0 !important;
        padding: 16px 10px !important;
      }
      .btn-gap { display: none !important; }

      /* stat row stacks */
      .stat-row  { display: block !important; }
      .stat-cell { display: block !important; width: 100% !important; padding: 10px 0 !important; border-right: none !important; border-bottom: 1px solid #1e293b !important; }
      .stat-cell:last-child { border-bottom: none !important; }

      /* footer stack */
      .footer-copy  { display: block !important; width: 100% !important; text-align: center !important; }
      .footer-icons { display: block !important; width: 100% !important; text-align: center !important; padding-top: 18px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#020617;">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#020617;">
<tr>
<td align="center">

  <table role="presentation" class="email-body" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;">


    <!-- ═══════════════════════════════
         HEADER
    ════════════════════════════════ -->
    <tr>
      <td class="pad" style="background:linear-gradient(160deg,#061a12 0%,#020617 100%);border-bottom:2px solid #10b981;text-align:center;">
        <img src="${process.env.APP_URL}/Favicon.png" alt="Signal" width="64" height="64"
             style="display:block;margin:0 auto 20px auto;border:1px solid #10b981;border-radius:14px;width:64px;height:64px;">

        <div class="issue-pill">Weekly Protocol Release</div>

        <h1 style="margin:18px 0 0 0;font-size:50px;font-weight:800;color:#ffffff;letter-spacing:-2px;line-height:1;">
          THE <span style="color:#10b981;">SIGNAL.</span>
        </h1>

        <p class="mono" style="margin:14px 0 0 0;font-size:12px;color:#475569;letter-spacing:2px;">
          ${dateStr}
        </p>
      </td>
    </tr>


    <!-- ═══════════════════════════════
         GREETING
    ════════════════════════════════ -->
    <tr>
      <td class="pad-t">
        <p class="mono section-label">// TRANSMISSION_BEGINS</p>
        <h2 style="margin:0 0 14px 0;font-size:24px;font-weight:700;color:#f1f5f9;line-height:1.2;">
          Greetings, ${subscriber.name}.
        </h2>
        <p style="margin:0;font-size:16px;line-height:1.75;color:#94a3b8;">
          Your weekly intelligence harvest is ready. Every item below was hand-picked from the noise — read deliberately, act precisely.
        </p>
      </td>
    </tr>

    <!-- rule -->
    <tr>
      <td class="pad-t"><hr class="divider"></td>
    </tr>


    <!-- ═══════════════════════════════
         ISSUE STATS BAR
    ════════════════════════════════ -->
    <tr>
      <td class="pad-t">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
               style="background:#0a1628;border:1px solid #1e293b;border-radius:10px;">
          <tr class="stat-row">
            <td class="stat-cell" style="padding:15px 5px;border-right:1px solid #1e293b;width:25%;">
              <p class="mono" style="margin:0 0 2px 0;font-size:20px;color:#10b981;">3</p>
              <p class="mono" style="margin:0;font-size:8px;color:#475569;letter-spacing:1px;">SIGNALS</p>
            </td>
            <td class="stat-cell" style="padding:15px 5px;border-right:1px solid #1e293b;width:25%;">
              <p class="mono" style="margin:0 0 2px 0;font-size:20px;color:#10b981;">3</p>
              <p class="mono" style="margin:0;font-size:8px;color:#475569;letter-spacing:1px;">GADGETS</p>
            </td>
            <td class="stat-cell" style="padding:15px 5px;border-right:1px solid #1e293b;width:25%;">
              <p class="mono" style="margin:0 0 2px 0;font-size:20px;color:#10b981;">2+2</p>
              <p class="mono" style="margin:0;font-size:8px;color:#475569;letter-spacing:1px;">NODES</p>
            </td>
            <td class="stat-cell" style="padding:15px 5px;width:25%;">
              <p class="mono" style="margin:0 0 2px 0;font-size:20px;color:#10b981;">1</p>
              <p class="mono" style="margin:0;font-size:8px;color:#475569;letter-spacing:1px;">INSIGHT</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>


    <!-- ═══════════════════════════════
         MAIN CONTENT (sharedEmailBody)
         The ${sharedEmailBody} variable renders
         your actual issue content here.
         Wrap each item in .content-block
         divs on the sending side for best
         results, or let it render as-is.
    ════════════════════════════════ -->
    <tr>
      <td class="pad-t">
        <p class="mono section-label">// THIS_WEEKS_SIGNALS</p>

        <!-- content block wrapper -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="color:#cbd5e1;font-size:15px;line-height:1.8;">
              ${sharedEmailBody}
            </td>
          </tr>
        </table>
      </td>
    </tr>


    <!-- ═══════════════════════════════
         CTA BUTTONS
    ════════════════════════════════ -->
    <tr>
      <td class="pad-t">
        <hr class="divider" style="margin-bottom:28px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td>
              <a href="${process.env.APP_URL}/?view=latest" class="btn-outline">
                Explore on Web
              </a>
            </td>
            <td class="btn-gap" width="12">&nbsp;</td>
            <td>
              <a href="${process.env.APP_URL}/?view=dashboard&name=${encodeURIComponent(subscriber.name)}&email=${encodeURIComponent(subscriber.email)}"
                 class="btn-solid">
                Neural Dashboard →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>


    <!-- ═══════════════════════════════
         FEEDBACK CARD
    ════════════════════════════════ -->
    <tr>
      <td class="pad-t">
        <table role="presentation" class="feedback-card" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding:32px 30px;">

              <!-- top row: label + link -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <p class="mono" style="margin:0 0 6px 0;font-size:10px;color:#10b981;letter-spacing:3px;">
                      // PROTOCOL_OPTIMIZATION
                    </p>
                    <p style="margin:0;font-size:16px;font-weight:700;color:#f1f5f9;line-height:1.3;">
                      Was this brief worth your time?
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:12px 0 24px 0;font-size:14px;line-height:1.7;color:#64748b;">
                Every reply, every rating shapes the next issue. I read all of it — I'm always listening.
              </p>

              <!-- inner divider -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:22px;">
                <tr><td style="border-top:1px solid rgba(16,185,129,0.15);font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>

              <!-- bottom row: label + btn -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <p class="mono" style="margin:0;font-size:10px;color:#475569;letter-spacing:2px;">AND I MEAN IT.</p>
                  </td>
                  <td style="vertical-align:middle;text-align:right;">
                    <a href="${process.env.APP_URL}/?view=feedback&email=${encodeURIComponent(subscriber.email)}&name=${encodeURIComponent(subscriber.name)}"
                       style="display:inline-block;background:transparent;color:#10b981 !important;font-family:'Outfit',Arial,sans-serif;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;padding:10px 20px;border-radius:6px;border:1px solid #10b981;text-decoration:none;">
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

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
          <tr><td style="border-top:1px solid #1e293b;font-size:0;line-height:0;">&nbsp;</td></tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td class="footer-copy" style="vertical-align:middle;">
              <p class="mono" style="margin:0 0 4px 0;font-size:11px;color:#475569;letter-spacing:2px;">
                THE SIGNAL &nbsp;|&nbsp; NEURAL RELAY ACTIVE
              </p>
              <p style="margin:0;font-size:12px;color:#334155;">
                © ${new Date().getFullYear()} THE SIGNAL. Forged for the technical elite.
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
          <a href="${unsubscribeUrl}" style="color:#334155;text-decoration:underline;">
            Deactivate Neural Link
          </a>
        </p>

      </td>
    </tr>


  </table><!-- /email-body -->
</td>
</tr>
</table>

</body>
</html>
`;

        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: subscriber.email,
          subject: `THE SIGNAL: Intelligence Protocol for ${dateStr}`,
          html: premiumEmailHtml,
        });

        console.log(`[SUCCESS] Intelligence delivered to ${subscriber.email}`);
        
        await supabase
          .from('newsletter_subscribers')
          .update({ last_sent_date: userFullDate })
          .eq('email', subscriber.email);
      }
    } catch (err) {
      console.error(`[ERROR] Protocol failed for ${subscriber.email}:`, err);
    }
  }
}

// Export for use in API handler
export { sendNewsletter };

// Only run if called directly (CLI mode), not when imported
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running newsletter script directly...');
  sendNewsletter().catch(err => {
    console.error('Direct execution failed:', err);
    process.exit(1);
  });
}
