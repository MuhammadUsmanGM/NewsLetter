import { createClient } from '@supabase/supabase-js';
import { sendMail } from '../src/utils/mailer.js';
import { getWelcomeEmailHtml } from '../src/utils/templates.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.redirect(`${process.env.APP_URL}/?verified=failed&error=missing_token`);
  }

  try {
    // 1. Find user with this token
    const { data: user, error: fetchError } = await supabase
      .from('newsletter_subscribers')
      .select('email, name, is_verified, referred_by')
      .eq('v_token', token)
      .maybeSingle();

    if (fetchError || !user) {
      console.error('Verification lookup error:', fetchError);
      return res.redirect(`${process.env.APP_URL}/?verified=failed&error=invalid_token`);
    }

    if (user.is_verified) {
      return res.redirect(`${process.env.APP_URL}/?verified=true&reauth=true`);
    }

    // 2. Activate the neural link
    const { error: updateError } = await supabase
      .from('newsletter_subscribers')
      .update({ is_verified: true })
      .eq('v_token', token);

    if (updateError) throw updateError;

    // 2.5. Credit the Referrer (if applicable)
    if (user.referred_by) {
      try {
        await supabase.rpc('increment_referral_count', { referrer_token: user.referred_by });
        // Alternative if RPC not available:
        // await supabase.from('newsletter_subscribers').update({ referral_count: supabase.sql`referral_count + 1` }).eq('v_token', user.referred_by);
        // But for simplicity in JS/Supa:
        const { data: refUser } = await supabase.from('newsletter_subscribers').select('referral_count').eq('v_token', user.referred_by).single();
        if (refUser) {
            await supabase.from('newsletter_subscribers').update({ referral_count: (refUser.referral_count || 0) + 1 }).eq('v_token', user.referred_by);
        }
      } catch (refErr) {
        console.warn('Failed to credit referrer:', refErr);
      }
    }

    // 3. Trigger Premium Welcome Email (Double Opt-in Complete)
    try {
      const welcomeHtml = getWelcomeEmailHtml(user.name, user.email, process.env.APP_URL);
      await sendMail(user.email, 'THE SIGNAL: Intelligence Protocol Activated 📡', welcomeHtml);
    } catch (mailErr) {
      console.error('Failed to send welcome email after verification:', mailErr);
      // We don't fail the verification just because the welcome email failed, 
      // but we log it.
    }

    // 4. Success: Redirect back to the UI
    return res.redirect(`${process.env.APP_URL}/?verified=true`);

  } catch (error) {
    console.error('Internal verification error:', error);
    return res.redirect(`${process.env.APP_URL}/?verified=failed&error=internal_error`);
  }
}
