import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy endpoint for AI Analysis (Groq/Grok)
  app.post("/api/analyze", async (req, res) => {
    try {
      const apiKey = process.env.GROK_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "API key not configured" });
      }
      // The key prefix 'gsk_' indicates this is a Groq API key, not xAI Grok.
      const isGroq = apiKey.startsWith('gsk_');
      const endpoint = isGroq 
        ? "https://api.groq.com/openai/v1/chat/completions" 
        : "https://api.x.ai/v1/chat/completions";
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || (isGroq ? "llama-3.3-70b-versatile" : "grok-beta"),
          messages: [
            { role: "system", content: "You are a medical AI assistant. Return only valid JSON." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        return res.status(response.status).json({ 
          error: errorData.error?.message || response.statusText || 'Unknown API Error' 
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Proxy Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
