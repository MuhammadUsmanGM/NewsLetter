import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 1x1 Transparent GIF pixel (Base64)
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

export default async function handler(req, res) {
  const { token } = req.query;

  if (token) {
    try {
      // 1. Record the Open in the database (background/async-ish)
      // For simplicity, we just increment the subscriber's global opens_count 
      // In a more complex SaaS, we would log this in a 'newsletter_opens' table with issueId
      const { data: user } = await supabase
        .from('newsletter_subscribers')
        .select('opens_count')
        .eq('v_token', token)
        .single();
        
      if (user) {
        await supabase
            .from('newsletter_subscribers')
            .update({ 
                opens_count: (user.opens_count || 0) + 1,
                last_active_at: new Date().toISOString()
            })
            .eq('v_token', token);
      }
    } catch (err) {
      console.error('Telemetry Log Error:', err.message);
    }
  }

  // 2. Return the 1x1 invisible pixel immediately
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.send(PIXEL);
}
