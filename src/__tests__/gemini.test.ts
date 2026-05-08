import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Stub the Google Generative AI SDK so the analyzer never makes a real
 * network call from inside vitest. The mock captures the prompt + image
 * arguments so we can assert the description was actually forwarded.
 */
const generateContent = vi.fn();
vi.mock('@google/generative-ai', () => ({
  // Use a real `function` so `new GoogleGenerativeAI(API_KEY)` is valid.
  GoogleGenerativeAI: function () {
    return { getGenerativeModel: () => ({ generateContent }) };
  },
}));

import { analyzeFoodImage, buildAnalysisPrompt } from '@/services/gemini';

describe('buildAnalysisPrompt', () => {
  it('returns the base prompt unchanged when no description is supplied', () => {
    const prompt = buildAnalysisPrompt();
    expect(prompt).toContain('Analyze this food image');
    expect(prompt).not.toContain('Additional context');
  });

  it('returns the base prompt unchanged for an empty / whitespace description', () => {
    const prompt = buildAnalysisPrompt('   \n  ');
    expect(prompt).not.toContain('Additional context');
  });

  it('appends a context block with the user description', () => {
    const prompt = buildAnalysisPrompt('200g grilled chicken with 1 tbsp olive oil');
    expect(prompt).toContain('Additional context from the user');
    expect(prompt).toContain('200g grilled chicken with 1 tbsp olive oil');
  });

  it('caps very long descriptions at 600 chars', () => {
    const giant = 'x'.repeat(1200);
    const prompt = buildAnalysisPrompt(giant);
    expect(prompt).toContain('x'.repeat(600));
    expect(prompt).not.toContain('x'.repeat(601));
  });
});

describe('analyzeFoodImage', () => {
  const makeImageFile = () =>
    new File([new Uint8Array([1, 2, 3, 4])], 'meal.png', { type: 'image/png' });

  const validJsonPayload = JSON.stringify({
    items: [
      { name: 'Grilled chicken', quantity: '200g', calories: 320, protein: 60, carbs: 0, fat: 8 },
    ],
    totalCalories: 320,
    totalProtein: 60,
    totalCarbs: 0,
    totalFat: 8,
    confidence: 'medium',
  });

  beforeEach(() => {
    generateContent.mockReset();
    generateContent.mockResolvedValue({
      response: { text: () => validJsonPayload },
    });
  });

  it('returns parsed analysis from the model when only an image is provided', async () => {
    const result = await analyzeFoodImage(makeImageFile());
    expect(result).not.toBeNull();
    expect(result!.items[0].name).toBe('Grilled chicken');
    expect(result!.totalCalories).toBe(320);

    // The prompt sent to the model must be the BASE one (no description block).
    const [promptArg] = generateContent.mock.calls[0][0];
    expect(promptArg).toContain('Analyze this food image');
    expect(promptArg).not.toContain('Additional context');
  });

  it('forwards the user description into the prompt when supplied', async () => {
    await analyzeFoodImage(makeImageFile(), 'pan-fried in olive oil, 200g chicken');
    const [promptArg] = generateContent.mock.calls[0][0];
    expect(promptArg).toContain('Additional context from the user');
    expect(promptArg).toContain('pan-fried in olive oil, 200g chicken');
  });

  it('strips whitespace-only descriptions before composing the prompt', async () => {
    await analyzeFoodImage(makeImageFile(), '   \n  ');
    const [promptArg] = generateContent.mock.calls[0][0];
    expect(promptArg).not.toContain('Additional context');
  });

  it('rejects non-image files with null', async () => {
    const text = new File([new Uint8Array([1, 2])], 'notes.txt', { type: 'text/plain' });
    const result = await analyzeFoodImage(text);
    expect(result).toBeNull();
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('returns null gracefully when the model emits non-JSON output', async () => {
    generateContent.mockResolvedValueOnce({
      response: { text: () => 'sorry I cannot help with that' },
    });
    const consoleErr = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await analyzeFoodImage(makeImageFile(), 'context');
    expect(result).toBeNull();
    consoleErr.mockRestore();
  });
});
