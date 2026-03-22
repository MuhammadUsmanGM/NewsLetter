// Note: dotenv is not needed in Vercel - env vars are automatically available
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { inngest } from '../src/inngest/client.js';
import { getNewsletterBodyHtml } from '../src/utils/templates.js';

// Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const newsApiKey = process.env.NEWS_API_KEY;

async function fetchTrendingRepos() {
  try {
    console.log('Fetching trending AI repositories from GitHub...');
    // Search for repos with AI-related topics, sort by stars, within the last week
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const dateQuery = lastWeek.toISOString().split('T')[0];
    
    const resp = await axios.get('https://api.github.com/search/repositories', {
      params: {
        q: `AI OR LLM OR "Machine Learning" OR "Generative AI" OR "Artificial Intelligence" pushed:>${dateQuery} stars:>50`,
        sort: 'stars',
        order: 'desc',
        per_page: 8
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

  const reposContext = repos.length > 0 
    ? repos.map(r => `
        Repo: ${r.name}
        Description: ${r.description || 'No description provided.'}
        Stars: ${r.stars || 0}
        Language: ${r.language || 'Multiple/Other'}
        URL: ${r.url}
      `).join('\n---\n')
    : "NO GITHUB REPOSITORIES FOUND. SKIP SECTION 4.";

  const prompt = `
    You are the Lead Editor of "THE SIGNAL", a high-end intelligence protocol for technical founders and AI engineers.
    
    SOURCES:
    STORIES: ${articlesContext}
    GADGETS: ${gadgetsContext}
    REPOS: ${reposContext}
    
    Create a premium weekly briefing following the **3-3-2-2-1 Structure**.
    
    STRICT SOURCE MAPPING RULES:
    - Section 1 (STORIES) MUST only use items from the STORIES list.
    - Section 2 (GADGETS) MUST only use items from the GADGETS list.
    - Section 3 (TOOLS) can use items from STORIES or GADGETS that represent software/frameworks.
    - Section 4 (REPOS) MUST EXCLUSIVELY use items from the REPOS list. 
    - CRITICAL: Every URL in the REPOS section MUST start with 'https://github.com/'. DO NOT use news article links (gizmodo, npr, etc.) in the REPOS section.

    INSTRUCTIONS:
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

    4. **2 TRENDING REPOS**: 
       - IF "NO GITHUB REPOSITORIES FOUND" is provided in the REPOS source, output: <div style="color: #94a3b8; padding: 20px; text-align: center; border: 1px dashed #1e293b; border-radius: 12px;">GitHub Node scanning for signals... Check back next week.</div>
       - OTHERWISE, pick exactly 2 GitHub repos from the REPOS list.
       - Use this HTML:
         <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
           <div style="color: #8b5cf6; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">GITHUB NODE</div>
           <strong style="color: #ffffff; font-size: 18px;">[Repo Name]</strong>
           <p style="color: #cbd5e1; margin: 8px 0; font-size: 14px;">[Description]</p>
           <div style="color: #8b5cf6; font-size: 13px; font-weight: 700; margin-bottom: 12px;">★ [Stars] Stars • [Language]</div>
           <a href="[URL]" style="color: #8b5cf6; font-size: 13px; text-decoration: none; font-weight: 600;">View Repository →</a>
         </div>

    5. **1 ACTIONABLE INSIGHT**: Provide one high-level insight based on the week's trends.
       - Use a quote-style block with #10b981 left border.
    
    Technical: Return ONLY the HTML content. No markdown. Inline styles only.
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

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const forceSend = process.argv && Array.isArray(process.argv) ? process.argv.includes('--force') : false;

  // 1. Check if we already have a generated briefing for this week in the vault
  let sharedEmailBody = null;
  try {
    const { data: cachedArchive, error: checkError } = await supabase
      .from('newsletter_archive')
      .select('content_html')
      .eq('week_date', dateStr)
      .maybeSingle();

    if (cachedArchive) {
      console.log('--- CACHE HIT: REUSING ARCHIVED NEURAL BRIEFING ---');
      sharedEmailBody = cachedArchive.content_html;
    }
  } catch (err) {
    console.warn('Cache check failed, will proceed with generation if needed:', err.message);
  }

  // 2. Fetch all VERIFIED subscribers
  const { data: subscribers, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .eq('is_verified', true);

  if (error) {
    console.error('Database connection failure:', error);
    return;
  }

  // 3. Identify who needs the transmission in their specific window (Monday 9AM+)
  const qualifyingSubscribers = subscribers.filter(subscriber => {
    const localeOptions = { timeZone: subscriber.timezone, hour12: false };
    const userFullDate = new Intl.DateTimeFormat('en-CA', { ...localeOptions, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    const userDay = new Intl.DateTimeFormat('en-US', { ...localeOptions, weekday: 'long' }).format(now);
    const userHour = parseInt(new Intl.DateTimeFormat('en-US', { ...localeOptions, hour: 'numeric' }).format(now));
    
    const isMonday = userDay === 'Monday';
    const is9AMOrLater = userHour >= 9;
    const alreadySent = subscriber.last_sent_date === userFullDate;

    console.log(`[TARGET] ${subscriber.email} | Target: ${userDay} 09:00 | Current: ${userHour}:00 | Sent: ${alreadySent}`);
    return (isMonday && is9AMOrLater && !alreadySent) || forceSend;
  });

  if (qualifyingSubscribers.length === 0) {
    console.log('No qualifying subscribers at this time. Skipping send cycle.');
    return;
  }

  // 4. Generate content ONLY if it doesn't already exist for this week
  if (!sharedEmailBody) {
    console.log('--- CACHE MISS: GENERATING NEW NEURAL BRIEFING (singleton) ---');
    const intelligenceData = await fetchAIIntelligence();
    
    if (intelligenceData.articles.length === 0) {
      console.log('Insufficient signal found. Aborting protocol to prevent low-quality briefing.');
      return;
    }

    const contentHtml = await generateWeeklyIntelligence(intelligenceData);
    sharedEmailBody = getNewsletterBodyHtml(null, dateStr, contentHtml); 

    try {
      console.log('--- ARCHIVING SIGNAL FOR WEB VIEW & FUTURE TIMEZONES ---');
      const { error: archiveError } = await supabase
        .from('newsletter_archive')
        .insert([{ 
          week_date: dateStr, 
          content_html: sharedEmailBody, 
          raw_content: contentHtml, 
          repositories: intelligenceData.repos.map(repo => repo.name) 
        }]);

      if (archiveError) {
        console.error('Failed to archive freshly generated newsletter:', archiveError);
      } else {
        console.log('Signal archived successfully.');
      }
    } catch (archiveErr) {
      console.error('Archive storage exception:', archiveErr);
    }
  } else {
    console.log('--- UTILIZING SINGLETON BRIEFING FOR CURRENT BATCH ---');
  }

  // 4. Dispatch to Inngest for Background Fan-Out
  console.log(`--- DISPATCHING TO INNGEST BACKGROUND WORKER (${qualifyingSubscribers.length} TARGETS) ---`);
  
  try {
    await inngest.send({
      name: "signal/newsletter.dispatch",
      data: {
        subscribers: qualifyingSubscribers,
        content: sharedEmailBody,
        dateStr: dateStr
      }
    });
    console.log('[SUCCESS] Transmission dispatched to background worker.');
  } catch (dispatchErr) {
    console.error('[CRITICAL] Inngest Dispatch Failed:', dispatchErr);
    // Fallback: If Inngest is down, we could potentially log this for a manual retry later.
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
