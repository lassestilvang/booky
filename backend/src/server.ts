import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import collectionsRoutes from "./routes/collections";
import bookmarksRoutes from "./routes/bookmarks";
import highlightsRoutes from "./routes/highlights";
import searchRoutes from "./routes/search";
import tagsRoutes from "./routes/tags";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use("/v1/auth", authRoutes);
app.use("/v1/collections", collectionsRoutes);
app.use("/v1/bookmarks", bookmarksRoutes);
app.use("/v1/highlights", highlightsRoutes);
app.use("/v1/search", searchRoutes);
app.use("/v1/tags", tagsRoutes);

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res
      .status(500)
      .json({ error: "Internal Server Error", message: err.message });
  }
);

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: "Not Found" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
