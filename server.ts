import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory analytics (for demo purposes)
  const analytics = {
    generations: 0,
    schedulings: 0,
    downloads: 0,
    events: [] as { type: string; timestamp: string; topic?: string }[],
  };

  // API routes
  app.post("/api/analytics/track", (req, res) => {
    const { type, topic } = req.body;
    const timestamp = new Date().toISOString();

    if (type === "generation") analytics.generations++;
    if (type === "scheduling") analytics.schedulings++;
    if (type === "download") analytics.downloads++;

    analytics.events.push({ type, timestamp, topic });
    
    // Keep only last 100 events
    if (analytics.events.length > 100) analytics.events.shift();

    console.log(`[Analytics] ${type} tracked at ${timestamp}`);
    res.json({ success: true });
  });

  app.get("/api/analytics/stats", (req, res) => {
    res.json(analytics);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
