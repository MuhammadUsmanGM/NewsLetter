import cron from 'node-cron';
import { sendNewsletter } from './newsletter.mjs';

// Schedule to run every hour at the top of the hour
console.log('Newsletter scheduler started. Running every hour...');

cron.schedule('0 * * * *', () => {
  console.log(`[${new Date().toISOString()}] Running scheduled newsletter check...`);
  sendNewsletter();
});

// Run once immediately if needed for testing (uncomment if desired)
// sendNewsletter();
