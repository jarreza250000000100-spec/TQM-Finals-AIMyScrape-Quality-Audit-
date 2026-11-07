import { GoogleGenAI } from '@google/genai';

// Gemini Model Fallback Ladder per Section 6 Directives
const FALLBACK_MODEL_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash'
];

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

export interface GenerationResult {
  text: string;
  modelUsed: string;
  attemptCount: number;
}

/**
 * Executes Gemini content generation using the resilient fallback ladder.
 * Catches 503, 429, 404, 500 status codes and tries the next model in sequence.
 */
export async function generateContentWithFallback(
  prompt: string,
  systemInstruction?: string
): Promise<GenerationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    // If running in development without a secret, return a structured fallback response
    return {
      text: `[Monetaria Collections Assistant Mode]:\nBased on case record review, debtor entity status and balance obligations are noted. All communications must remain strictly compliant with FDCPA and court pre-pleading rules.\n\nSummary details:\n${prompt.slice(0, 300)}...`,
      modelUsed: 'mock-safe-mode',
      attemptCount: 1
    };
  }

  const ai = getAiClient();
  let lastError: unknown = null;

  for (let i = 0; i < FALLBACK_MODEL_LADDER.length; i++) {
    const model = FALLBACK_MODEL_LADDER[i];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: systemInstruction
          ? {
              systemInstruction
            }
          : undefined
      });

      const text = response.text || '';
      return {
        text,
        modelUsed: model,
        attemptCount: i + 1
      };
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.statusCode || 0;
      const msg = err?.message || '';

      // Recoverable errors: 503, 429, 404, 500, or network timeouts
      const isRecoverable =
        status === 503 ||
        status === 429 ||
        status === 404 ||
        status === 500 ||
        msg.includes('503') ||
        msg.includes('429') ||
        msg.includes('404') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('NOT_FOUND');

      if (isRecoverable && i < FALLBACK_MODEL_LADDER.length - 1) {
        console.warn(`[Gemini Fallback] Model ${model} failed (${msg}). Falling back to ${FALLBACK_MODEL_LADDER[i + 1]}...`);
        continue;
      } else {
        // If it's another error or we reached the end of the ladder, try next or throw
        if (i < FALLBACK_MODEL_LADDER.length - 1) {
          continue;
        }
      }
    }
  }

  throw new Error(`All models in Gemini fallback ladder failed: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}
