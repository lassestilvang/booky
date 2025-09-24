import { createClient } from "redis";

// Validate environment variables
if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is required");
}

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

// Connect to Redis
redisClient.connect().catch((err) => {
  console.error("Failed to connect to Redis:", err);
  process.exit(1); // Exit if cannot connect to Redis
});

export default redisClient;
