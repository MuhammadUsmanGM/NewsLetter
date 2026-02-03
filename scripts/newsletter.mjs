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

  console.log(`Found ${articles.length} potential signal sources.`);
  return articles.slice(0, 15);
}

async function generateWeeklyIntelligence(articles) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite.5-flas-lite" });

  const articlesContext = articles.map(a => `
    Title: ${a.title}
    Description: ${a.description}
    Source: ${a.source.name}
    URL: ${a.url}
    ImageURL: ${a.urlToImage}
  `).join('\n---\n');

  const prompt = `
    You are the Lead Editor of "THE SIGNAL", a high-end intelligence protocol for technical founders and AI engineers.
    
    Based on these sources:
    ${articlesContext}
    
    Create a premium weekly briefing following the exact **3-2-1 Structure**:
    
    1. **3 MAJOR NEW STORIES**: Select the 3 most impactful AI breakthroughs of the week. For each:
       - Strategic Headline
       - High-quality analysis of why this shift matters (The "Signal")
       - Use this HTML for stories:
         <div style="margin-bottom: 40px;">
           <img src="[ImageURL]" style="width: 100%; height: auto; border-radius: 16px; margin-bottom: 20px;">
           <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 12px;">[Headline]</h2>
           <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">[Analysis]</p>
           <a href="[URL]" style="color: #10b981; font-weight: 700; text-decoration: none;">Read Technical Analysis →</a>
         </div>

    2. **2 NEW TOOLS TO TRY**: Pick 2 emerging AI tools, frameworks, or agents. For each:
       - Tool Name
       - Quick value prop (How it optimizes workflows)
       - Link
       - Use this HTML for tools:
         <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
           <strong style="color: #10b981; font-size: 18px;">[Tool Name]</strong>
           <p style="color: #cbd5e1; margin: 8px 0;">[Value Prop]</p>
         </div>

    3. **1 ACTIONABLE INSIGHT/PROMPT**: Provide one high-level strategic insight or a complex, multi-step LLM prompt that saves hours of work.
       - Use this HTML for the insight:
         <div style="border-left: 4px solid #10b981; padding: 24px; background: rgba(16, 185, 129, 0.05); border-radius: 0 16px 16px 0;">
           <h3 style="color: #ffffff; margin-top: 0;">This Week's Actionable Insight</h3>
           <p style="color: #cbd5e1; font-style: italic;">[Insight/Prompt Content]</p>
         </div>
    
    Technical:
    - Return ONLY the HTML content.
    - No markdown formatting.
    - Use inline styles only.
    - Ensure all colors match the brand (White #ffffff, Primary #10b981, Muted #94a3b8, Dark Background #0f172a).
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

  const articles = await fetchAIIntelligence();
  if (articles.length === 0) {
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
          sharedEmailBody = await generateWeeklyIntelligence(articles);
          
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
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&display=swap');
            </style>
          </head>
          <body style="margin: 0; padding: 0; background-color: #020617; font-family: 'Outfit', sans-serif; color: #94a3b8;">
            <!-- View in Browser Link -->
            <div style="text-align: center; padding: 10px; background-color: #020617;">
              <a href="${process.env.APP_URL}/?view=latest" style="color: #475569; font-size: 11px; text-decoration: none; letter-spacing: 0.5px;">
                View this signal in your neural interface
              </a>
            </div>
            
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #020617; padding: 20px 0 40px 0;">
              <tr>
                <td align="center">
                  <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #0f172a; border-radius: 32px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.08);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 60px 48px; background: linear-gradient(135deg, #064e3b 0%, #022c22 100%); text-align: center;">
                        <div style="display: inline-block; padding: 8px 16px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 20px; color: #10b981; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 24px;">
                          Weekly Protocol Release
                        </div>
                        <h1 style="color: #ffffff; margin: 0; font-size: 36px; font-weight: 800; letter-spacing: -1.5px;">THE <span style="color: #10b981;">SIGNAL.</span></h1>
                        <p style="color: #94a3b8; margin: 12px 0 0 0; font-size: 16px; letter-spacing: 0.05em;">${dateStr}</p>
                      </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                      <td style="padding: 48px; color: #cbd5e1; line-height: 1.7; font-size: 16px;">
                        <div style="color: #ffffff; font-size: 24px; font-weight: 700; margin-bottom: 24px;">Greetings, ${subscriber.name}.</div>
                        <p style="margin-bottom: 40px;">Your weekly intelligence harvest has completed. Below is the curated signal extracted from this week's neural network shifts.</p>
                        
                        ${sharedEmailBody}
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 48px; background-color: #020617; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
                        <p style="margin: 0; color: #475569; font-size: 14px;">Forged for the technical elite.</p>
                        <div style="margin-top: 24px;">
                          <table align="center" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding: 0 10px;">
                                <a href="${process.env.APP_URL}/?view=feedback&email=${encodeURIComponent(subscriber.email)}&name=${encodeURIComponent(subscriber.name)}" style="color: #10b981; text-decoration: none; font-size: 12px; font-weight: 700;">Transmit Feedback</a>
                              </td>
                              <td style="padding: 0 10px; color: #334155;">|</td>
                              <td style="padding: 0 10px;">
                                <a href="${unsubscribeUrl}" style="color: #64748b; text-decoration: underline; font-size: 12px;">Protocol Deactivation</a>
                              </td>
                            </tr>
                          </table>
                        </div>
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
