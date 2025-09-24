import { MeiliSearch } from "meilisearch";

// Validate environment variables
if (!process.env.MEILI_HOST) {
  throw new Error("MEILI_HOST environment variable is required");
}

if (!process.env.MEILI_MASTER_KEY) {
  throw new Error("MEILI_MASTER_KEY environment variable is required");
}

const client = new MeiliSearch({
  host: process.env.MEILI_HOST,
  apiKey: process.env.MEILI_MASTER_KEY,
});

export default client;
