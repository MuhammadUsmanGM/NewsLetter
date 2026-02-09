
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.redirect('/');
  }

  try {
    const { data: issue, error } = await supabase
      .from('newsletter_archive')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !issue) {
      return res.redirect('/');
    }

    // Extract first headline for the description
    const headlineMatches = issue.content_html.match(/<h2[^>]*>(.*?)<\/h2>/g) || [];
    const headlines = headlineMatches.map(h => h.replace(/<[^>]*>/g, '').trim());
    const description = headlines.length > 0 ? `Featuring: ${headlines.join(', ')}` : 'Weekly AI Intelligence Protocol';

    const ogImageUrl = `${process.env.APP_URL}/api/og?id=${id}`;
    const issueUrl = `${process.env.APP_URL}/?view=issue&id=${id}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <title>THE SIGNAL | ${issue.week_date}</title>
  <meta name="description" content="${description}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${issueUrl}">
  <meta property="og:title" content="THE SIGNAL | ${issue.week_date}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${ogImageUrl}">

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${issueUrl}">
  <meta property="twitter:title" content="THE SIGNAL | ${issue.week_date}">
  <meta property="twitter:description" content="${description}">
  <meta property="twitter:image" content="${ogImageUrl}">

  <!-- Redirect to the actual app -->
  <script>
    window.location.href = "${issueUrl}";
  </script>
</head>
<body style="background-color: #020617; color: #ffffff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
  <div style="text-align: center;">
    <h1 style="color: #10b981;">THE SIGNAL</h1>
    <p>Decrypting Protocol Record #${id}...</p>
    <div style="width: 40px; height: 40px; border: 3px solid rgba(16, 185, 129, 0.1); border-top-color: #10b981; border-radius: 50%; animation: spin 1s linear infinite; margin: 20px auto;"></div>
  </div>
  <style>
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</body>
</html>
    `.trim();

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Share page error:', error);
    return res.redirect('/');
  }
}
