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
<!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>THE SIGNAL: Intelligence Protocol</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&display=swap');
              
              /* Reset */
              body { margin: 0; padding: 0; background-color: #020617; font-family: 'Outfit', sans-serif; color: #94a3b8; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
              table { border-spacing: 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
              img { border: 0; -ms-interpolation-mode: bicubic; }
              
              /* Wrapper */
              .wrapper { width: 100%; table-layout: fixed; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #020617; }
              .webkit { max-width: 600px; margin: 0 auto; }
              
              /* Mobile Styles */
              @media screen and (max-width: 600px) {
                .outer { width: 100% !important; margin: 0 auto !important; }
                .inner { width: 100% !important; margin: 0 auto !important; padding: 0 16px !important; }
                .content-padding { padding: 30px 20px !important; }
                .header-padding { padding: 40px 20px !important; }
                .mobile-full { width: 100% !important; display: block !important; }
                .mobile-center { text-align: center !important; }
                h1 { font-size: 28px !important; }
                p { font-size: 16px !important; }
              }
            </style>
          </head>
          <body style="margin: 0; padding: 0; background-color: #020617; font-family: 'Outfit', sans-serif; color: #94a3b8;">
            <center class="wrapper" style="width: 100%; table-layout: fixed; background-color: #020617; padding-bottom: 40px;">
              <div class="webkit" style="max-width: 600px; margin: 0 auto;">
                
                <!-- View in Browser Link -->
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; padding: 0 10px;">
                   <tr>
                      <td align="center" style="padding: 10px 0; color: #475569; font-size: 11px;">
                        <a href="${process.env.APP_URL}/?view=latest" style="color: #475569; text-decoration: none; letter-spacing: 0.5px;">View this signal in your neural interface</a>
                      </td>
                   </tr>
                </table>

                <!-- Main Email Card -->
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f172a; max-width: 600px; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5);">
                  
                  <!-- Header -->
                  <tr>
                    <td class="header-padding" style="padding: 50px 40px; background: linear-gradient(135deg, #064e3b 0%, #022c22 100%); text-align: center;">
                      <div style="display: inline-block; padding: 6px 14px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 20px; color: #10b981; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px;">
                        Weekly Protocol Release
                      </div>
                      <h1 style="color: #ffffff; margin: 0; font-size: 36px; font-weight: 800; letter-spacing: -1px; line-height: 1.1;">THE <span style="color: #10b981;">SIGNAL.</span></h1>
                      <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 15px; letter-spacing: 0.05em;">${dateStr}</p>
                    </td>
                  </tr>

                  <!-- Content Body -->
                  <tr>
                    <td class="content-padding" style="padding: 40px; background-color: #0f172a;">
                      <div style="color: #ffffff; font-size: 22px; font-weight: 700; margin-bottom: 20px;">Greetings, ${subscriber.name}.</div>
                      <p style="margin-bottom: 30px; font-size: 16px; line-height: 1.6; color: #cbd5e1;">Your weekly intelligence harvest has completed. Below is the curated signal extracted from this week's neural network shifts.</p>
                      
                      <!-- AI Generated Content Injection Point -->
                      <div style="width: 100%;">
                        ${sharedEmailBody}
                      </div>

                      <div style="margin-top: 40px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 30px;">
                         <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
                           <tr>
                             <td align="center">
                               <!-- Determine stacking on mobile via specific widths or allow wrapping -->
                                <a href="${process.env.APP_URL}/?view=latest" style="display: inline-block; padding: 12px 20px; margin: 5px; background-color: transparent; border: 1px solid #10b981; color: #10b981; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px;">Check on Web</a>
                                <a href="${process.env.APP_URL}/?view=latest" style="display: inline-block; padding: 12px 20px; margin: 5px; background-color: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px;">🎙️ Listen to Relay</a>
                                <a href="${process.env.APP_URL}/?view=dashboard&name=${encodeURIComponent(subscriber.name)}&email=${encodeURIComponent(subscriber.email)}" style="display: inline-block; padding: 12px 20px; margin: 5px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px;">Neural Dashboard</a>
                             </td>
                           </tr>
                         </table>
                      </div>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td class="content-padding" style="padding: 30px 40px; background-color: #020617; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
                      <p style="margin: 0; color: #475569; font-size: 13px;">Forged for the technical elite.</p>
                      <div style="margin-top: 20px;">
                        <table align="center" border="0" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 0 10px;">
                              <a href="${process.env.APP_URL}/?view=feedback&email=${encodeURIComponent(subscriber.email)}&name=${encodeURIComponent(subscriber.name)}" style="color: #10b981; text-decoration: none; font-size: 11px; font-weight: 700;">Transmit Feedback</a>
                            </td>
                            <td style="padding: 0 10px; color: #334155;">|</td>
                            <td style="padding: 0 10px;">
                              <a href="${unsubscribeUrl}" style="color: #64748b; text-decoration: underline; font-size: 11px;">Protocol Deactivation</a>
                            </td>
                          </tr>
                        </table>
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
