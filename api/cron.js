import { sendNewsletter } from '../scripts/newsletter.mjs';

export default async function handler(req, res) {
  console.log('--- HEARTBEAT: CRON ENDPOINT HIT ---');
  console.log('Time:', new Date().toISOString());
  console.log('Method:', req.method);
  
  // Optional: Add basic security check using Vercel's internal header
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('--- AUTH FAILURE: INVALID SECRET ---');
    console.warn('Expected:', `Bearer ${process.env.CRON_SECRET ? '[SECRET SET]' : '[NO SECRET]'}`);
    console.warn('Received:', authHeader ? '[HEADER PRESENT]' : '[NO HEADER]');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('--- AUTH SUCCESS: PROCESSING NEWSLETTER ---');

  try {
    // Check if required env vars are present
    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'GEMINI_API_KEY',
      'NEWS_API_KEY',
      'SMTP_HOST',
      'SMTP_USER',
      'SMTP_PASS'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.error('Missing environment variables:', missingVars);
      return res.status(500).json({ 
        success: false, 
        error: 'Server configuration error',
        details: `Missing: ${missingVars.join(', ')}`
      });
    }

    await sendNewsletter();
    console.log('--- NEWSLETTER PROCESS COMPLETED SUCCESSFULLY ---');
    return res.status(200).json({ success: true, message: 'Newsletter process completed' });
  } catch (error) {
    console.error('Newsletter cron error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
