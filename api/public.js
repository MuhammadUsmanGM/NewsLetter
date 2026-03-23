import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { channel } = req.query;

  // 1. LIVE SIGNAL FEED (News Ticker)
  if (channel === 'ticker') {
    const NEWS_API_KEY = process.env.NEWS_API_KEY;
    const fallbackTitles = ["SYNCHRONIZING GLOBAL NEWS FEEDS...", "ESTABLISHING NEURAL LINK...", "FETCHING REAL-TIME AI BREAKTHROUGHS...", "PROTOCOL ACTIVE"];
    
    if (!NEWS_API_KEY) {
        return res.status(200).json({ titles: ["// [ALERT] SECURITY CLEARANCE REQUIRED for External News Feed", ...fallbackTitles] });
    }

    try {
      const response = await fetch(
        `https://newsapi.org/v2/top-headlines?category=technology&language=en&pageSize=15&apiKey=${NEWS_API_KEY}`
      );
      const data = await response.json();
      
      if (!response.ok || !data.articles) {
          throw new Error(data.message || 'Failed to fetch news');
      }
      
      const titles = data.articles.map(article => article.title);
      res.setHeader('Cache-Control', 's-maxage=300');
      return res.status(200).json({ titles });
    } catch (err) {
      console.warn('Ticker Warning:', err.message);
      return res.status(200).json({ titles: ["// [REDUX] OFFLINE NEWS MODE ACTIVATED", ...fallbackTitles] });
    }
  }

  // 2. RSS FEED (Protocol Stream)
  if (channel === 'rss') {
    try {
      const { data: archives } = await supabase
        .from('newsletter_archive')
        .select('week_date, content_html, created_at')
        .order('id', { ascending: false })
        .limit(10);

      const items = archives.map(a => `
        <item>
          <title>THE SIGNAL: ${a.week_date}</title>
          <link>${process.env.APP_URL}</link>
          <pubDate>${new Date(a.created_at).toUTCString()}</pubDate>
          <description>Weekly Intelligence Briefing</description>
        </item>`).join('');

      const rss = `<?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
          <channel>
            <title>THE SIGNAL Intelligence Protocol</title>
            <link>${process.env.APP_URL}</link>
            <description>3-3-2-2-1 AI Insights</description>
            ${items}
          </channel>
        </rss>`;

      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send(rss);
    } catch (err) { return res.status(500).send('RSS Error'); }
  }

  // 3. PLAYGROUND Logic
  if (channel === 'playground') {
      return res.status(200).json({ status: 'active', gateway: 'authorized' });
  }

  return res.status(404).json({ error: 'Public channel not found' });
}
