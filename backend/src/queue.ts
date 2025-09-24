import { Queue } from "bullmq";

// Validate environment variables
if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is required");
}

const redisUrl = new URL(process.env.REDIS_URL);

const bookmarkQueue = new Queue("bookmark-processing", {
  connection: {
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port) || 6379,
    username: redisUrl.username || undefined,
    password: redisUrl.password || undefined,
  },
});

export default bookmarkQueue;
