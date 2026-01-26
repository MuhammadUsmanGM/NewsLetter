import 'dotenv/config';
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

async function fetchAINews() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  // Using full ISO string for more precise 24h window
  const fromDate = yesterday.toISOString();

  try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        // More specific query to find actual breakthroughs and major releases
        q: '(artificial intelligence OR AI) AND (breakthrough OR "new model" OR launch OR "announced" OR research OR "OpenAI" OR "Google AI" OR "Nvidia" OR "Anthropic" OR "LLM")',
        from: fromDate,
        sortBy: 'popularity', // Ensures we get high-impact stories
        language: 'en',
        // Target reputable tech journalistic domains for "premium" quality
        domains: 'techcrunch.com,theverge.com,wired.com,arstechnica.com,venturebeat.com,zdnet.com,engadget.com,reuters.com,nytimes.com',
        apiKey: newsApiKey,
      },
    });
    
    // Filter out articles with missing images or descriptions for better email quality
    const highQualityArticles = response.data.articles
      .filter(a => a.urlToImage && a.description && a.title)
      .slice(0, 10); 

    return highQualityArticles;
  } catch (error) {
    console.error('Error fetching news:', error.response?.data || error.message);
    return [];
  }
}

async function generateEmailContent(articles) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const articlesContext = articles.map(a => `
    Title: ${a.title}
    Description: ${a.description}
    Source: ${a.source.name}
    URL: ${a.url}
    ImageURL: ${a.urlToImage}
  `).join('\n---\n');

  const prompt = `
    You are a professional AI newsletter editor for a high-end tech publication. 
    Write a premium, insightful, and visually stunning email newsletter based on this AI news:
    
    ${articlesContext}
    
    STYLING & STRUCTURE (MANDATORY):
    1. Tone: Sophisticated, authoritative, yet engaging.
    2. Layout per article:
       - Header: <h2 style="font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 12px; line-height: 1.2;">[Article Title]</h2>
       - Image: <img src="[ImageURL]" style="width: 100%; height: auto; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
       - Body: A deep-dive paragraph explaining *why* this matters.
       - Highlights: Use a styled list for key takeaways.
       - Link: A clear, styled "Read full story" link.
    3. Closing: A thought-provoking final sentence about the future of AI.
    
    Technical:
    - Return ONLY the HTML snippets for the articles.
    - DO NOT include any personalized greeting or "Hi [Name]".
    - No markdown formatting (no \`\`\`html).
    - Use inline styles only.
  `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().replace(/```html|```/g, '').trim();
  } catch (error) {
    console.error('Error generating AI content:', error);
    return `<p>Stay ahead of the curve with today's AI insights...</p>`;
  }
}

async function sendNewsletter() {
  console.log('Starting newsletter service...');

  const articles = await fetchAINews();
  if (articles.length === 0) {
    console.log('No new articles found. Skipping.');
    return;
  }

  const { data: subscribers, error } = await supabase
    .from('newsletter_subscribers')
    .select('*');

  if (error) {
    console.error('Error fetching subscribers:', error);
    return;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  // OPTIMIZATION: Generate the AI shared content ONCE per run (not per subscriber)
  // This prevents hitting Gemini rate limits and Vercel timeouts.
  let sharedEmailBody = null;

  for (const subscriber of subscribers) {
    try {
      const userTime = new Intl.DateTimeFormat('en-US', {
        timeZone: subscriber.timezone,
        hour: 'numeric',
        hour12: false,
      }).format(now);

      if (parseInt(userTime) === 9) {
        // Only generate AI content if we have at least one subscriber to send to
        if (!sharedEmailBody) {
          console.log('Generating shared AI content...');
          sharedEmailBody = await generateEmailContent(articles);
        }

        console.log(`Sending premium newsletter to ${subscriber.email}`);
        
        const unsubscribeUrl = `${process.env.APP_URL}/?unsubscribe=true&email=${encodeURIComponent(subscriber.email)}`;
        
        const fullEmailHtml = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="utf-8">
            <style>
              @media only screen and (max-width: 600px) {
                .container { width: 100% !important; padding: 20px !important; }
              }
            </style>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                    <!-- Header/Branding -->
                    <tr>
                      <td style="padding: 40px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">AI INSIGHTS</h1>
                        <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">${dateStr}</p>
                      </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px; color: #334155; line-height: 1.6; font-size: 16px;">
                        <p style="font-size: 18px; color: #0f172a; font-weight: 600;">Hi ${subscriber.name},</p>
                        <p style="margin-bottom: 30px;">Wishing you a productive day! Here is your curated briefing on the latest AI breakthroughs.</p>
                        
                        ${sharedEmailBody}
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 40px; background-color: #f1f5f9; text-align: center;">
                        <p style="margin: 0; color: #64748b; font-size: 14px;">Stay curious, stay ahead.</p>
                        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                          <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                            Sent to ${subscriber.email}
                            <br>
                            <a href="${unsubscribeUrl}" style="color: #64748b; text-decoration: underline; margin-top: 8px; display: inline-block;">Unsubscribe</a>
                          </p>
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
          subject: `Daily AI Insights: ${dateStr}`,
          html: fullEmailHtml,
        });

        console.log(`Premium email successfully sent to ${subscriber.email}`);
      }
    } catch (err) {
      console.error(`Failed to send email to ${subscriber.email}:`, err);
    }
  }
}

// Export for use in scheduler
export { sendNewsletter };

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  sendNewsletter();
}
