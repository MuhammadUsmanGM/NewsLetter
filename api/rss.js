import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use Anon key by default, fallback to Role key if they prefer
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data: issues, error } = await supabase
      .from('newsletter_archive')
      .select('id, week_date, created_at, content_html')
      .order('id', { ascending: false })
      .limit(20);

    if (error) throw error;

    const baseUrl = process.env.APP_URL || 'https://yourdomain.com';

    // Build the XML structure manually to avoid extra dependencies
    const rssTemplate = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>THE SIGNAL.</title>
    <link>${baseUrl}</link>
    <description>Weekly Intelligence Brief for the technical elite.</description>
    <language>en-us</language>
    <atom:link href="${baseUrl}/api/rss" rel="self" type="application/rss+xml"/>
${issues.map(issue => {
      const pubDate = new Date(issue.created_at).toUTCString();
      const issueUrl = `${baseUrl}/?view=issue&amp;id=${issue.id}`;
      // Basic stripping for standard description, the full HTML goes into <content:encoded>
      const cleanDesc = (issue.content_html || '')
          .replace(/<[^>]*>?/gm, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 200) + '...';

      return `    <item>
      <title><![CDATA[${issue.week_date || `Protocol Record #${issue.id}`}]]></title>
      <link>${issueUrl}</link>
      <guid isPermaLink="true">${issueUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${cleanDesc}]]></description>
      <content:encoded><![CDATA[${issue.content_html}]]></content:encoded>
    </item>`;
    }).join('\n')}
  </channel>
</rss>`.trim();

    // The key here is proper headers so RSS readers can parse it
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    // Cache heavily at the Edge since historical issues don't change often
    // and new ones come once a week. 
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    
    return res.status(200).send(rssTemplate);
    
  } catch (err) {
    console.error('RSS generation error:', err);
    return res.status(500).json({ error: 'System failure: Cannot generate RSS protocol' });
  }
}
