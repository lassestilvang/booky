import { Queue } from "bullmq";

const bookmarkQueue = new Queue("bookmark-processing", {
  connection: {
    host:
      process.env.REDIS_URL?.replace("redis://", "").split(":")[0] ||
      "localhost",
    port: parseInt(process.env.REDIS_URL?.split(":")[2] || "6379"),
  },
});

export default bookmarkQueue;
