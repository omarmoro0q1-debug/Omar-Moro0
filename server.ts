import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      throw new Error('GEMINI_API_KEY is not configured. Please add it via the Secrets panel.');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON
  app.use(express.json());

  // API endpoint for Gemini proxying
  app.post('/api/gemini', async (req, res) => {
    try {
      const { prompt, history, model, thinking, grounding } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const client = getGeminiClient();

      // Model mapping with robust defaults
      let selectedModel = model || 'gemini-2.5-flash';
      
      // Let's map user-requested models to official Google GenAI model names
      if (selectedModel === 'gemini-3.5-flash') {
        selectedModel = 'gemini-2.5-flash'; // Google GenAI SDK current stable model
      } else if (selectedModel === 'gemini-3.1-pro-preview') {
        selectedModel = 'gemini-2.5-pro'; // Current premium pro model
      } else if (selectedModel === 'gemini-3.1-flash-lite') {
        selectedModel = 'gemini-2.5-flash'; // Fallback to stable fast model
      }

      // Structure contents (including optional history for multi-turn conversations)
      let contents: any[] = [];
      if (history && Array.isArray(history)) {
        contents = history.map((msg: any) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.text }],
        }));
      }
      
      // Add the final user prompt
      contents.push({
        role: 'user',
        parts: [{ text: prompt }],
      });

      // Build config objects safely
      const config: any = {
        // Safe temperature and bounds
        temperature: thinking ? 0.7 : 0.4,
      };

      // Add system instruction to give the chatbot its expert OS role
      config.systemInstruction = "You are 'Gemi', the premium core AI Copilot integrated directly into Gemileith OS Optimum. You are highly intellectual, precise, conversational, and helpful in both English and Arabic. Provide elegant responses. Adhere to your expert engineer, doctor, and advisor persona.";

      // Support search grounding
      if (grounding) {
        config.tools = [{ googleSearch: {} }];
      }

      // Support high thinking config if pro model is selected or thinking is manually toggled
      if (thinking) {
        config.thinkingConfig = {
          thinkingBudget: 2048,
        };
      }

      console.log(`Sending request to model ${selectedModel} (thinking: ${!!thinking}, grounding: ${!!grounding})`);

      const response = await client.models.generateContent({
        model: selectedModel,
        contents,
        config,
      });

      // Extract text, thoughts, sources safely
      let thoughtText = '';
      let replyText = '';
      let searchSources: any[] = [];

      const candidate = response.candidates?.[0];
      if (candidate) {
        // Extract parts
        if (candidate.content?.parts) {
          for (const part of candidate.content.parts) {
            // Check for thoughts inside part
            if (part.thought === true || 'thought' in part) {
              thoughtText += part.text || '';
            } else {
              replyText += part.text || '';
            }
          }
        }

        // If no text was separated, fall back to candidate text
        if (!replyText && candidate.content?.parts?.[0]?.text) {
          replyText = candidate.content.parts[0].text;
        }

        // Extract search grounding metadata
        if (candidate.groundingMetadata) {
          const metadata = candidate.groundingMetadata;
          if (metadata.groundingChunks) {
            searchSources = metadata.groundingChunks.map((chunk: any) => ({
              title: chunk.web?.title || 'Grounding Source',
              uri: chunk.web?.uri || '',
            })).filter((src: any) => src.uri);
          }
        }
      }

      if (!replyText && response.text) {
        replyText = response.text;
      }

      res.json({
        text: replyText,
        thought: thoughtText || null,
        sources: searchSources.length > 0 ? searchSources : null,
      });
    } catch (error: any) {
      console.error('Error in Gemini call:', error);
      res.status(500).json({ 
        error: error.message || 'Error occurred while calling the Gemini API' 
      });
    }
  });

  // Serve static files and mount Vite dev server
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gemileith OS Optimum server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
