import { Inngest } from "inngest";

// Handle environmental isolation (Development vs Production)
export const inngest = new Inngest({ 
  id: "the-signal",
  eventKey: process.env.INNGEST_EVENT_KEY 
});
