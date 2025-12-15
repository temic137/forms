import Pusher from "pusher";

// Ensure we have the required environment variables
const appId = process.env.PUSHER_APP_ID;
const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

// Using a global variable to prevent multiple instances in development
const globalForPusher = global as unknown as { pusher: Pusher };

export const pusherServer =
  globalForPusher.pusher ||
  (appId && key && secret && cluster
    ? new Pusher({
        appId,
        key,
        secret,
        cluster,
        useTLS: true,
      })
    : null);

if (process.env.NODE_ENV !== "production" && pusherServer) {
  globalForPusher.pusher = pusherServer;
}





