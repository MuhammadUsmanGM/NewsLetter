import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // 1. Authorization Check (Brute force protection would be better, but utilizing user's provided logic for now)
  const authHeader = req.headers.authorization;
  const password = process.env.VITE_COPY_PAGE_PASSWORD || "admin123";

  if (authHeader !== `Bearer ${password}`) {
    return res.status(401).json({ error: 'Unauthorized: Protocol Access Denied' });
  }

  try {
    // 2. Fetch Aggregated Intelligence
    
    // Total & Verification Statuses
    const { data: subscribers, error: subError } = await supabase
      .from('newsletter_subscribers')
      .select('email, is_verified, created_at, timezone');

    if (subError) throw subError;

    const total = subscribers.length;
    const verified = subscribers.filter(s => s.is_verified).length;
    const unverified = total - verified;

    // Growth Metrics (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newGrowth = subscribers.filter(s => new Date(s.created_at) >= sevenDaysAgo).length;

    // Timezone Distribution
    const timezones = subscribers.reduce((acc, s) => {
        acc[s.timezone] = (acc[s.timezone] || 0) + 1;
        return acc;
    }, {});

    // Latest Archive Status
    const { data: latestArchive } = await supabase
      .from('newsletter_archive')
      .select('week_date, id')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    // 3. Construct the Payload
    return res.status(200).json({
      success: true,
      stats: {
        totalSubscribers: total,
        verifiedNodes: verified,
        pendingNodes: unverified,
        growthLast7Days: newGrowth,
        latestIssue: latestArchive?.week_date || 'N/A',
        timezoneDistribution: Object.entries(timezones)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tz, count]) => ({ tz, count }))
      },
      rawNodes: subscribers.slice(0, 50) // Return first 50 for the list view
    });

  } catch (error) {
    console.error('Commander Stats Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve orbital intelligence.' });
  }
}
