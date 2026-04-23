import { GoogleGenerativeAI } from '@google/generative-ai';
import type { FoodItem } from '@/types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const isGeminiConfigured = (): boolean => Boolean(API_KEY);

let genAI: GoogleGenerativeAI | null = null;
if (isGeminiConfigured()) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

export interface FoodAnalysisResult {
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  confidence: 'high' | 'medium' | 'low';
}

const ANALYSIS_PROMPT = `Analyze this food image and estimate the nutritional content.
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
): Promise<FoodAnalysisResult | null> {
  if (!genAI) {
    console.warn('Gemini API not configured. Set VITE_GEMINI_API_KEY.');
    return getMockAnalysis();
  }
  if (!imageFile || !imageFile.type.startsWith('image/')) {
    console.warn('analyzeFoodImage called with a non-image file.');
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const imageData = await fileToBase64(imageFile);
    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType: imageFile.type,
      },
    };

    const result = await model.generateContent([ANALYSIS_PROMPT, imagePart]);
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

function getMockAnalysis(): FoodAnalysisResult {
  return {
    items: [
      { name: 'Sample Food', quantity: '1 serving', calories: 350, protein: 25, carbs: 40, fat: 10 },
    ],
    totalCalories: 350,
    totalProtein: 25,
    totalCarbs: 40,
    totalFat: 10,
    confidence: 'low',
  };
}

export { isGeminiConfigured };
