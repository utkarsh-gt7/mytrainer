import { GoogleGenerativeAI } from '@google/generative-ai';
import type { FoodItem } from '@/types';

/**
 * Read the API key lazily on every check so test environments can
 * stub it via `vi.stubEnv` even though the module was already imported.
 * (`import.meta.env` values are immutable at module-load time otherwise.)
 */
function readApiKey(): string {
  return (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ?? '';
}

const isGeminiConfigured = (): boolean => Boolean(readApiKey());

/**
 * Construct the Gemini client on demand. Memoised against the key so a
 * production caller still gets a single instance, but a test-time env
 * change forces a fresh client.
 */
let cachedClient: { key: string; client: GoogleGenerativeAI } | null = null;
function getClient(): GoogleGenerativeAI | null {
  const key = readApiKey();
  if (!key) return null;
  if (cachedClient && cachedClient.key === key) return cachedClient.client;
  cachedClient = { key, client: new GoogleGenerativeAI(key) };
  return cachedClient.client;
}

export interface FoodAnalysisResult {
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  confidence: 'high' | 'medium' | 'low';
}

const BASE_ANALYSIS_PROMPT = `Analyze this food image and estimate the nutritional content.
Return a JSON object with this exact structure (no markdown, just pure JSON):
{
  "items": [
    {
      "name": "food item name",
      "quantity": "estimated quantity (e.g., '1 cup', '200g')",
      "calories": number,
      "protein": number (grams),
      "carbs": number (grams),
      "fat": number (grams)
    }
  ],
  "totalCalories": number,
  "totalProtein": number,
  "totalCarbs": number,
  "totalFat": number,
  "confidence": "high" | "medium" | "low"
}
Be as accurate as possible with portions visible in the image. If uncertain, lean toward average serving sizes.`;

/**
 * Compose the full prompt: when the user supplies a free-text description
 * (e.g. cooking method, missing brand, hidden sauces), append it so the
 * model can correct its visual estimates with that context.
 */
export function buildAnalysisPrompt(description?: string | null): string {
  const trimmed = description?.trim();
  if (!trimmed) return BASE_ANALYSIS_PROMPT;
  // Cap the description so a stray paste can't blow out the token budget.
  const safeDesc = trimmed.slice(0, 600);
  return `${BASE_ANALYSIS_PROMPT}

Additional context from the user (use this to refine quantities, ingredients, cooking methods, hidden oils/sugars, brands, or anything not visible from the picture alone):
"""
${safeDesc}
"""`;
}

function sanitizeAnalysis(raw: unknown): FoodAnalysisResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Partial<FoodAnalysisResult>;
  if (!Array.isArray(candidate.items)) return null;
  const items: FoodItem[] = candidate.items
    .filter((it): it is FoodItem => !!it && typeof it === 'object' && typeof (it as FoodItem).name === 'string')
    .map((it) => ({
      name: String(it.name || 'Unknown').slice(0, 120),
      quantity: String(it.quantity || '1 serving').slice(0, 60),
      calories: Math.max(0, Math.round(Number(it.calories) || 0)),
      protein: Math.max(0, Math.round(Number(it.protein) || 0)),
      carbs: Math.max(0, Math.round(Number(it.carbs) || 0)),
      fat: Math.max(0, Math.round(Number(it.fat) || 0)),
    }));
  if (items.length === 0) return null;
  return {
    items,
    totalCalories: items.reduce((s, i) => s + i.calories, 0),
    totalProtein: items.reduce((s, i) => s + i.protein, 0),
    totalCarbs: items.reduce((s, i) => s + i.carbs, 0),
    totalFat: items.reduce((s, i) => s + i.fat, 0),
    confidence: candidate.confidence === 'high' || candidate.confidence === 'medium' || candidate.confidence === 'low'
      ? candidate.confidence
      : 'low',
  };
}

export async function analyzeFoodImage(
  imageFile: File,
  description?: string,
): Promise<FoodAnalysisResult | null> {
  // Validate the file shape first so a stray non-image upload short-circuits
  // regardless of whether a Gemini key is configured. This mirrors what the
  // UI guards already enforce and avoids leaking mock data for bad inputs.
  if (!imageFile || !imageFile.type.startsWith('image/')) {
    console.warn('analyzeFoodImage called with a non-image file.');
    return null;
  }

  const client = getClient();
  if (!client) {
    console.warn('Gemini API not configured. Set VITE_GEMINI_API_KEY.');
    return getMockAnalysis(description);
  }

  try {
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const imageData = await fileToBase64(imageFile);
    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType: imageFile.type,
      },
    };

    const prompt = buildAnalysisPrompt(description);
    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();

    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('Gemini returned non-JSON payload:', parseErr);
      return null;
    }
    return sanitizeAnalysis(parsed);
  } catch (error) {
    console.error('Food analysis failed:', error);
    return null;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getMockAnalysis(description?: string): FoodAnalysisResult {
  // The description is reflected in the mock item name so dev-mode users
  // can verify their description actually reached the function.
  const trimmed = description?.trim();
  const sampleName = trimmed ? `Sample Food (${trimmed.slice(0, 40)})` : 'Sample Food';
  return {
    items: [
      { name: sampleName, quantity: '1 serving', calories: 350, protein: 25, carbs: 40, fat: 10 },
    ],
    totalCalories: 350,
    totalProtein: 25,
    totalCarbs: 40,
    totalFat: 10,
    confidence: 'low',
  };
}

export { isGeminiConfigured };
