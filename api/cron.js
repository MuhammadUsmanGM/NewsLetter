import { sendNewsletter } from '../scripts/newsletter.mjs';

export default async function handler(req, res) {
  console.log('--- HEARTBEAT: CRON ENDPOINT HIT ---');
  console.log('Time:', new Date().toISOString());
  
  // Optional: Add basic security check using Vercel's internal header
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('--- AUTH FAILURE: INVALID SECRET ---');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('--- AUTH SUCCESS: PROCESSING NEWSLETTER ---');

  try {
    await sendNewsletter();
    return res.status(200).json({ success: true, message: 'Newsletter process completed' });
  } catch (error) {
    console.error('Newsletter cron error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
