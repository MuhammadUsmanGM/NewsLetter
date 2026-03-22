import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../src/utils/mailer.js';

// Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, token, reasons } = req.body;

  if (!email && !token) {
    return res.status(400).json({ error: 'Identification required' });
  }

  try {
    // 1. Identify the user
    let userToDelete = null;
    if (token) {
      const { data } = await supabase.from('newsletter_subscribers').select('email').eq('v_token', token).maybeSingle();
      userToDelete = data?.email;
    } else {
      userToDelete = email; // Fallback
    }

    if (!userToDelete) {
        return res.status(200).json({ success: true, message: 'Node already disconnected.' });
    }

    // 2. Delete from newsletter_subscribers
    const { error } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('email', userToDelete);

    if (error) throw error;

    // 3. Send Notification Email to Admin about the Unsubscribe
    const reasonsList = reasons && reasons.length > 0 
      ? reasons.map(r => `<li>${r}</li>`).join('') 
      : '<li>No reason provided</li>';

    const unsubscribeHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: sans-serif; background-color: #fff1f2; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; border: 1px solid #fecaca; }
          .header { font-size: 20px; font-weight: bold; color: #991b1b; margin-bottom: 20px; border-bottom: 2px solid #ef4444; padding-bottom: 10px; }
          .field { margin-bottom: 15px; }
          .label { font-size: 12px; font-weight: bold; color: #7f1d1d; text-transform: uppercase; margin-bottom: 4px; }
          .value { font-size: 16px; color: #450a0a; line-height: 1.5; }
          .reason-box { background: #fff5f5; padding: 15px; border-radius: 8px; border: 1px solid #fee2e2; }
          ul { padding-left: 20px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Signal Lost: Unsubscribe Event 🛑</div>
          
          <div class="field">
            <div class="label">User Email</div>
            <div class="value">${userToDelete}</div>
          </div>

          <div class="field">
            <div class="label">Reasons for Leaving</div>
            <div class="value reason-box">
              <ul>${reasonsList}</ul>
            </div>
          </div>
          
          <div class="field">
            <div class="label">Timestamp</div>
            <div class="value">${new Date().toLocaleString()}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to the admin/relay
    await sendMail(process.env.SMTP_USER, `[UNSUBSCRIBE] User left: ${userToDelete}`, unsubscribeHtml);

    return res.status(200).json({ success: true, message: 'Protocol deactivated. Connection closed.' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return res.status(500).json({ error: 'Failed to deactivate protocol. Please try again later.' });
  }
}
