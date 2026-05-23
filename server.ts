import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize GoogleGenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json());

// API: Evaluate Ramen Recipe
app.post("/api/evaluate-ramen", async (req, res) => {
  try {
    const { soup, noodle, richness, toppings } = req.body;

    const toppingList = toppings && toppings.length > 0 
      ? toppings.map((t: any) => `${t.name} (x${t.count || 1})`).join(", ")
      : "トッピングなし";

    const prompt = `Evaluate our custom ramen recipe:
- Soup Broth Base: ${soup}
- Noodle Thickness & Form: ${noodle}
- Soup Richness Profile: ${richness}
- Placed Toppings: ${toppingList}

Please provide an extremely professional, energetic, and poetic gourmet ramen evaluation in Japanese. Write a review that celebrates or strictly critiques the ingredient combination.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are a legendary, highly creative, and brutally honest Michelin Star Japanese Ramen Critic (ラーメン評論の神様). 
Your persona is incredibly passionate, expressive, and slightly dramatic (expressing supreme ecstasy or deep disappointment at raw harmonies).
You analyze:
1. "湯と麺の調和" (Harmony between noodle texture/thickness and broth base. E.g., Tonkotsu pairs perfectly with ultra-thin straight noddles. Miso matches thick wavy noodles. Shio is sublime with thin whole-wheat or medium noodles).
2. "具材の色彩と黄金比" (Visual layout, flavor contrast, and balance of toppings. e.g. heavy garlic & backfat needs refreshing green onions; chashu needs depth).
3. "真髄・旨味の深化" (Umami depth, richness balance, temperature synergy).

Provide your evaluation in a strictly formatted JSON representation in Japanese. Do not use standard markdown formatting symbols or outer blocks.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gourmetName: { 
              type: Type.STRING, 
              description: "A gorgeous, grand, and dramatic name in Japanese Kanji/Kata for this specific bowl (e.g., 『極・背脂焦がしニンニク漆黒豚骨拉麺』, 『黄金清湯・極細鴨塩かけそばプレミアム』)" 
            },
            overallScore: { 
              type: Type.INTEGER, 
              description: "Overall quality rating score from 0 to 100 based on overall ingredients compatibility, style harmony, and balance." 
            },
            soupNoodleHarmony: { 
              type: Type.INTEGER, 
              description: "Broth and noodle compatibility score (0 to 100)." 
            },
            visualHarmony: { 
              type: Type.INTEGER, 
              description: "Toppings design and visual contrast harmony score (0 to 100)." 
            },
            umamiDepth: { 
              type: Type.INTEGER, 
              description: "Richness of flavor, base quality, and depth of umami score (0 to 100)." 
            },
            priceEstimation: { 
              type: Type.INTEGER, 
              description: "Estimated pricing in Japanese Yen (G) if sold at a specialty gourmet shop (e.g. 850 to 2500)." 
            },
            criticReview: { 
              type: Type.STRING, 
              description: "The critic's review statement in Japanese (2-3 sentences). Use highly cinematic, sensory, dramatic, and expressive language. (Must be Japanese. Never use English)." 
            },
            flavorProfile: {
              type: Type.OBJECT,
              properties: {
                richness: { type: Type.INTEGER, description: "Richness rating scale (1 = clean/light, 5 = ultra heavy back-fat/rich)" },
                spiciness: { type: Type.INTEGER, description: "Spiciness rating scale (0 = not spicy, 5 = scorching pepper)" },
                originality: { type: Type.INTEGER, description: "Ingredient uniqueness and original composition scale (1 = conventional classic, 5 = revolutionary avant-garde)" }
              },
              required: ["richness", "spiciness", "originality"]
            }
          },
          required: ["gourmetName", "overallScore", "soupNoodleHarmony", "visualHarmony", "umamiDepth", "priceEstimation", "criticReview", "flavorProfile"]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("No text output received from Gemini API.");
    }

    const evaluation = JSON.parse(textOutput.trim());
    res.json({ success: true, evaluation });
  } catch (error: any) {
    console.error("Gemini Ramen Evaluation Error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to connect to the Ramen AI critic." });
  }
});

// Setup Vite Dev server or Serve static files
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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
    console.log(`Server starting on port ${PORT}`);
  });
}

setupServer();
