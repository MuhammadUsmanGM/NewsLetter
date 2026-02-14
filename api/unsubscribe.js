import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('email', email);

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Protocol deactivated. Connection closed.' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return res.status(500).json({ error: 'Failed to deactivate protocol. Please try again later.' });
  }
}
