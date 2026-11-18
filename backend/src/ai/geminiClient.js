import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildBuyerAgentPrompt, buildSellerAgentPrompt } from './promptBuilder.js';
import { parseGeminiResponse } from './responseParser.js';
import { validateAndGuardrailAction } from './guardrailService.js';
import { calculateConcessionMove } from './concessionService.js';
import { generateMockDecision } from './mockProvider.js';

let genAIInstance = null;

const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_GEMINI_API_KEY') || apiKey.includes('your_gemini_api_key')) {
    return null;
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(apiKey.trim());
  }
  return genAIInstance;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Main AI decision engine entry point.
 * Orchestrates prompt generation, model invocation, retries, parsing, and guardrail verification.
 */
export const generateAgentDecision = async ({
  actor, // 'BUYER_AGENT' | 'SELLER_AGENT'
  product,
  privateConfig, // Buyer: { targetPrice, budgetCeiling, style }, Seller: { openingAsk, privateMinPrice, style }
  currentRound,
  maxRounds,
  offerHistory = []
}) => {
  const aiMode = (process.env.AI_MODE || 'gemini').toLowerCase();
  const client = getGenAIClient();

  // If configured for mock mode or no Gemini API key is present, use mock provider
  if (aiMode === 'mock' || !client) {
    if (aiMode !== 'mock') {
      console.log(`[AI Engine] Gemini API key not configured. Using deterministic fallback engine for ${actor}.`);
    }
    const mockDecision = await generateMockDecision({
      actor,
      product,
      privateConfig,
      currentRound,
      maxRounds,
      offerHistory
    });

    return validateAndGuardrailAction({
      rawAction: mockDecision,
      actor,
      product,
      privateConfig,
      currentRound,
      maxRounds,
      offerHistory
    });
  }

  // Build actor-specific isolated prompt
  const prompt = actor === 'BUYER_AGENT'
    ? buildBuyerAgentPrompt({ product, buyerConfig: privateConfig, currentRound, maxRounds, offerHistory })
    : buildSellerAgentPrompt({ product, sellerConfig: privateConfig, currentRound, maxRounds, offerHistory });

  const modelName = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
  const maxRetries = 2;
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[AI Engine] Retry attempt ${attempt} for ${actor} in round ${currentRound}...`);
        await delay(attempt * 1000); // Backoff delay
      }

      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const result = await model.generateContent(prompt);
      const text = result?.response?.text();
      console.log(`[AI Engine] Successfully generated real Gemini API response for ${actor} in round ${currentRound}`);
      const parsedAction = parseGeminiResponse(text);

      // Programmatic Guardrail Verification
      return validateAndGuardrailAction({
        rawAction: parsedAction,
        actor,
        product,
        privateConfig,
        currentRound,
        maxRounds,
        offerHistory
      });
    } catch (err) {
      lastError = err;
      console.warn(`[AI Engine] Gemini attempt ${attempt} failed (${err.message})`);
    }
  }

  // If all retries failed, fallback to rule-based concession move
  console.warn(`[AI Engine] All retries exhausted. Using deterministic fallback move (${lastError?.message})`);
  const fallbackMove = calculateConcessionMove({
    actor,
    product,
    privateConfig,
    currentRound,
    maxRounds,
    offerHistory
  });

  return validateAndGuardrailAction({
    rawAction: fallbackMove,
    actor,
    product,
    privateConfig,
    currentRound,
    maxRounds,
    offerHistory
  });
};
