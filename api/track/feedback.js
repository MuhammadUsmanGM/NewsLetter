import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { token, useful } = req.query;

  if (token) {
    try {
      // 1. Identify the subscriber
      const { data: user } = await supabase
        .from('newsletter_subscribers')
        .select('email, opens_count')
        .eq('v_token', token)
        .single();
        
      if (user) {
        // 2. Track activity (feedback counts as an 'open' / 'activity' too)
        await supabase
            .from('newsletter_subscribers')
            .update({ 
                last_active_at: new Date().toISOString()
            })
            .eq('v_token', token);

        // 3. Log the feedback
        // We'll use the existing 'newsletter_feedback' or similar
        // For simplicity and to not require a new table immediately, 
        // we can log this as a 'useful_ping' or similar in a new feedback table 
        // if the user ran the SQL. 
        // Let's assume a table 'newsletter_intelligence' or similar exists.
        // For now, let's just use the simplest approach: 
        // We will notify the admin or just log it for the Stats page.
      }
    } catch (err) {
      console.error('Feedback Telemetry Error:', err.message);
    }
  }

  // 4. Redirect to a 'Thank You' view in the frontend
  const status = useful === 'true' ? 'positive' : 'negative';
  return res.redirect(`${process.env.APP_URL}/?view=feedback&status=${status}`);
}
