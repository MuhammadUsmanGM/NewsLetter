import { sendNewsletter } from '../scripts/newsletter.mjs';

export default async function handler(req, res) {
  // Optional: Add basic security check using Vercel's internal header
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Note: If you don't set CRON_SECRET, you can disable this check for testing
    // but it is highly recommended for production.
    // return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Cron job triggered:', new Date().toISOString());
    await sendNewsletter();
    return res.status(200).json({ success: true, message: 'Newsletter process completed' });
  } catch (error) {
    console.error('Newsletter cron error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
