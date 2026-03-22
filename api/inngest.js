import { serve } from "inngest/node";
import { inngest } from "../src/inngest/client.js";
import { sendMail } from "../src/utils/mailer.js";

import { getNewsletterHtml } from "../src/utils/templates.js";

/**
 * The individual worker job to send a single issue to a single user.
 * This function is retried automatically by Inngest if the SMTP server fails.
 */
const sendIndividualIssue = inngest.createFunction(
  { id: "send-individual-issue", retries: 5 },
  { event: "signal/newsletter.send_single" },
  async ({ event, step }) => {
    const { subscriber, content, dateStr } = event.data;
    const appUrl = process.env.APP_URL || '';
    
    const fullHtml = getNewsletterHtml(subscriber, dateStr, content, appUrl);

    await step.run("deliver-email", async () => {
      console.log(`[DELIVERY] Attempting send to ${subscriber.email}`);
      return await sendMail(
        subscriber.email, 
        `THE SIGNAL: Intelligence Protocol for ${dateStr}`, 
        fullHtml
      );
    });

    return { success: true, user: subscriber.email };
  }
);

/**
 * Main Dispatcher: Receives a batch of subscribers and content, then fans them out.
 * This separates the generation phase from the heavy-lifting delivery phase.
 */
const newsletterDispatcher = inngest.createFunction(
  { id: "newsletter-dispatcher" },
  { event: "signal/newsletter.dispatch" },
  async ({ event, step }) => {
    const { subscribers, content, dateStr } = event.data;
    
    // We fan out the sends as separate events.
    // This allows Inngest to manage 1,000+ separate retry queues instantly.
    const events = subscribers.map(sub => ({
      name: "signal/newsletter.send_single",
      data: { 
        subscriber: sub, 
        content, 
        dateStr
      }
    }));

    // Inngest can take up to 400 events in a single send call for performance
    const batchSize = 400;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      await step.sendEvent(`dispatch-batch-${i}`, batch);
    }

    return { count: subscribers.length };
  }
);

/**
 * Handler for the /api/inngest endpoint.
 */
export default serve({
  client: inngest,
  functions: [
    newsletterDispatcher,
    sendIndividualIssue
  ],
});
