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

export async function analyzeFoodImage(
  imageFile: File,
): Promise<FoodAnalysisResult | null> {
  if (!genAI) {
    console.warn('Gemini API not configured. Set VITE_GEMINI_API_KEY.');
    return getMockAnalysis();
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
    return JSON.parse(jsonStr) as FoodAnalysisResult;
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
