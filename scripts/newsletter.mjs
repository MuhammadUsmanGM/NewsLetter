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

  // Broad search for high-quality AI breakthroughs over the week
  let articles = await fetchWithParams({
    q: 'artificial intelligence OR "machine learning" OR "generative AI" OR "AI agents" OR "LLM breakthroughs"',
    from: fromDate,
    sortBy: 'popularity'
  });

  const repos = await fetchTrendingRepos();

  console.log(`Found ${articles.length} signal sources and ${repos.length} potential technical nodes.`);
  return { articles: articles.slice(0, 15), repos };
}

async function generateWeeklyIntelligence(intelligenceData) {
  const { articles, repos } = intelligenceData;
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const articlesContext = articles.map(a => `
    Title: ${a.title}
    Description: ${a.description}
    Source: ${a.source.name}
    URL: ${a.url}
    ImageURL: ${a.urlToImage}
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
    
    Based on these news sources:
    ${articlesContext}
    
    And these trending GitHub repositories:
    ${reposContext}
    
    Create a premium weekly briefing following the exact **3-2-1 Structure**, but enhanced for hardcore developers:
    
    1. **3 MAJOR NEW STORIES**: Select the 3 most impactful AI breakthroughs.
       - Use this HTML:
         <div style="margin-bottom: 40px;">
           <img src="[ImageURL]" style="width: 100%; height: auto; border-radius: 16px; margin-bottom: 20px;">
           <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 12px;">[Headline]</h2>
           <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">[Analysis]</p>
           <a href="[URL]" style="color: #10b981; font-weight: 700; text-decoration: none;">Read Technical Analysis →</a>
         </div>

    2. **2 ELITE TOOLS**: Pick 2 emerging AI tools OR frameworks.
       - Use this HTML:
         <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
           <div style="color: #10b981; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">TOOL NODE</div>
           <strong style="color: #ffffff; font-size: 18px;">[Tool Name]</strong>
           <p style="color: #cbd5e1; margin: 8px 0; font-size: 14px;">[Value Prop / Technical Use-case]</p>
           <a href="[URL]" style="color: #10b981; font-size: 13px; text-decoration: none; font-weight: 600;">Access Node →</a>
         </div>

    3. **2 TRENDING REPOS**: Pick the 2 most significant GitHub repositories.
       - Use this HTML:
         <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
           <div style="color: #8b5cf6; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">GITHUB NODE</div>
           <strong style="color: #ffffff; font-size: 18px;">[Repo Name]</strong>
           <p style="color: #cbd5e1; margin: 8px 0; font-size: 14px;">[GitHub Data (Stars, primary utility)]</p>
           <a href="[URL]" style="color: #8b5cf6; font-size: 13px; text-decoration: none; font-weight: 600;">Explore Repository →</a>
         </div>

    4. **1 ACTIONABLE INSIGHT/PROMPT**: Provide one high-level strategic insight or a complex LLM prompt.
       - Use this HTML:
         <div style="border-left: 4px solid #10b981; padding: 24px; background: rgba(16, 185, 129, 0.05); border-radius: 0 16px 16px 0;">
           <h3 style="color: #ffffff; margin-top: 0;">This Week's Actionable Insight</h3>
           <p style="color: #cbd5e1; font-style: italic; margin-bottom: 20px;">[Insight/Prompt Content]</p>
           <a href="https://chatgpt.com/?q=[Insight/Prompt Content]" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">⚡ Execute Protocol</a>
         </div>
    
    Technical:
    - Return ONLY the HTML content.
    - No markdown formatting.
    - Use inline styles only.
    - Colors: White #ffffff, Primary #10b981, Muted #94a3b8, Dark Background #0f172a.
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
          <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>THE SIGNAL: Intelligence Protocol</title>
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
                .cta-btn { width: 100% !important; text-align: center !important; display: block !important; box-sizing: border-box !important; }
              }
            </style>
          </head>
          <body>
            <div class="wrapper">

              <!-- Fluid Header Section -->
              <table border="0" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #064e3b 0%, #020617 100%);">
                <tr>
                  <td align="center">
                    <!--[if mso | IE]>
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600"><tr><td>
                    <![endif]-->
                    <table class="content-table" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="header-padding" align="center" style="padding: 60px 40px;">
                          <img src="${process.env.APP_URL}/Favicon.png" alt="Signal Logo" width="70" height="70" style="width: 70px; height: 70px; margin-bottom: 24px; border: 2px solid #10b981; border-radius: 14px;">
                          <div style="display: inline-block; padding: 6px 14px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 20px; color: #10b981; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 20px;">
                            Weekly Protocol Release
                          </div>
                          <h1 style="color: #ffffff; margin: 0; font-size: 40px; font-weight: 800; letter-spacing: -1.5px; line-height: 1.1;">THE <span style="color: #10b981;">SIGNAL.</span></h1>
                          <p style="color: #94a3b8; margin: 12px 0 0 0; font-size: 15px; letter-spacing: 0.05em;">${dateStr}</p>
                        </td>
                      </tr>
                    </table>
                    <!--[if mso | IE]>
                    </td></tr></table>
                    <![endif]-->
                  </td>
                </tr>
              </table>

              <!-- Main Content Area -->
              <table border="0" cellpadding="0" cellspacing="0" style="background-color: #020617;">
                <tr>
                  <td align="center">
                    <!--[if mso | IE]>
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600"><tr><td>
                    <![endif]-->
                    <table class="content-table" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="content-padding" style="padding: 60px 40px;">
                          <h2 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 20px 0;">Greetings, ${subscriber.name}.</h2>
                          <p style="margin-bottom: 40px; font-size: 17px; line-height: 1.6; color: #94a3b8;">Your weekly intelligence harvest has completed. Curated signals extracted from the neural core follow below.</p>
                          
                          <div style="color: #cbd5e1;">
                            ${sharedEmailBody}
                          </div>

                          <div style="margin-top: 50px; padding-top: 40px; border-top: 1px solid rgba(255,255,255,0.05); text-align: left;">
                             <a href="${process.env.APP_URL}/?view=latest" class="cta-btn" style="display: inline-block; padding: 15px 25px; margin-right: 15px; margin-bottom: 6px; background-color: transparent; border: 1px solid #10b981; color: #10b981; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">Explore on Web</a>
                             <a href="${process.env.APP_URL}/?view=dashboard&name=${encodeURIComponent(subscriber.name)}&email=${encodeURIComponent(subscriber.email)}" class="cta-btn" style="display: inline-block; padding: 15px 25px; margin-bottom: 6px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">Neural Dashboard</a>
                          </div>

                          <!-- Feedback Node -->
                          <div style="margin: 50px 0; padding: 35px; border: 1px dashed rgba(16, 185, 129, 0.3); border-radius: 4px; text-align: center;">
                            <div style="color: #10b981; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;">Protocol Optimization</div>
                            <p style="color: #cbd5e1; font-size: 15px; margin-bottom: 25px;">Was this intelligence harvest valuable to your current mission?</p>
                            <a href="${process.env.APP_URL}/?view=feedback&email=${encodeURIComponent(subscriber.email)}&name=${encodeURIComponent(subscriber.name)}" 
                               style="display: inline-block; color: #10b981; text-decoration: none; font-weight: 700; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #10b981;">Transmit Feedback →</a>
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

              <!-- Seamless Footer Section -->
              <table border="0" cellpadding="0" cellspacing="0" style="background-color: #020617; border-top: 1px solid rgba(255,255,255,0.05);">
                <tr>
                  <td align="center" style="padding: 60px 40px;">
                    <!--[if mso | IE]>
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600"><tr><td>
                    <![endif]-->
                    <table class="content-table" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <div style="margin-bottom: 30px;">
                            <table align="center" border="0" cellpadding="0" cellspacing="0" style="width: auto;">
                              <tr>
                                <td style="padding: 0 15px;">
                                  <a href="https://github.com/MuhammadUsmanGM"><img src="https://img.icons8.com/ios-filled/50/10b981/github.png" width="22" height="22" style="display: block;"></a>
                                </td>
                                <td style="padding: 0 15px;">
                                  <a href="https://linkedin.com/in/muhammad-usman-ai-dev"><img src="https://img.icons8.com/ios-filled/50/10b981/linkedin.png" width="22" height="22" style="display: block;"></a>
                                </td>
                              </tr>
                            </table>
                          </div>
                          <p style="margin: 0 0 15px 0; color: #475569; font-size: 12px;">Forged for the technical elite AI practitioners.</p>
                          <a href="${unsubscribeUrl}" style="color: #475569; text-decoration: underline; font-size: 11px;">Deactivate Neural Link</a>
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
