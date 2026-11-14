import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateFallbackOffer } from './fallbackAgentService.js';
import { validateAndEnforceGuardrails } from './guardrailService.js';

let genAI = null;

const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_gemini_api_key')) {
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

/**
 * Generates an autonomous negotiation offer using Gemini or the deterministic fallback.
 * Validates and clamps all output through guardrailService.
 */
export const generateAgentOffer = async ({
  role, // 'buyer_agent' | 'seller_agent'
  product,
  buyerLimits,
  sellerLimits,
  currentRound,
  maxRounds,
  offerHistory = []
}) => {
  const client = getGenAIClient();

  if (!client) {
    console.log(`[GeminiAgentService] No API key configured. Utilizing mathematical concession engine for ${role}.`);
    const fallback = generateFallbackOffer({
      role,
      product,
      buyerLimits,
      sellerLimits,
      currentRound,
      maxRounds,
      offerHistory
    });

    return validateAndEnforceGuardrails({
      role,
      rawOfferPrice: fallback.offerPrice,
      rawMessage: fallback.message,
      rawRationale: fallback.rationale,
      buyerLimits,
      sellerLimits,
      currentRound,
      maxRounds
    });
  }

  try {
    const model = client.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3
      }
    });

    const isBuyer = role === 'buyer_agent';
    const myLimits = isBuyer ? buyerLimits : sellerLimits;
    const historyText = offerHistory.length
      ? offerHistory
          .map(
            (o) =>
              `Round ${o.round} - ${o.senderRole}: ₹${o.offerPrice} ("${o.message}")`
          )
          .join('\n')
      : 'No prior offers yet. This is the opening offer.';

    const systemPrompt = `You are an Autonomous AI Negotiation Agent acting on behalf of a ${
      isBuyer ? 'Buyer' : 'Seller'
    } on AgentBazaar, a peer-to-peer resale marketplace.
Product Details:
- Title: ${product.title}
- Original Listed Price: ₹${product.price}
- Condition: ${product.condition}
- Category: ${product.category}
- Location: ${product.location}
- Description: ${product.description}

Your Client's Private Constraints (STRICT CONFIDENTIAL):
${
  isBuyer
    ? `- Buyer Target Desired Price: ₹${buyerLimits.targetPrice}
- Buyer Maximum Budget Ceiling: ₹${buyerLimits.budgetCeiling} (ABSOLUTE RULE: You CANNOT offer higher than ₹${buyerLimits.budgetCeiling})
- Negotiation Style: ${buyerLimits.style} (aggressive = hold tough, moderate = balanced concessions, conservative = concede faster to win item)`
    : `- Seller Target Asking Price: ₹${sellerLimits.targetPrice}
- Seller Minimum Floor Price: ₹${sellerLimits.floorPrice} (ABSOLUTE RULE: You CANNOT offer lower than ₹${sellerLimits.floorPrice})
- Negotiation Style: ${sellerLimits.style} (firm = hold high, balanced = fair concessions, flexible = lower price faster to sell)`
}

Current Negotiation Status:
- Current Round: ${currentRound} of ${maxRounds}
- Offer History:
${historyText}

Rules for this turn:
1. If the counterparty's latest offer already satisfies your client's limits (for Buyer: offer <= budgetCeiling; for Seller: offer >= floorPrice) and is deemed a fair deal, you can accept their exact offer price to close the deal.
2. Otherwise, formulate a strategic counter-offer that moves incrementally towards an agreement based on your style and the round number.
3. Buyer offers MUST be <= ₹${buyerLimits.budgetCeiling}.
4. Seller offers MUST be >= ₹${sellerLimits.floorPrice}.
5. Write a polite, persuasive, conversational message addressed to the counterparty explaining your offer (mentioning product condition, market value, or readiness to close).
6. Explain your internal strategic rationale concisely.

You MUST respond strictly with this JSON structure:
{
  "offerPrice": number (integer INR amount),
  "message": "Polite persuasive chat message to counterparty",
  "rationale": "Internal strategic reasoning explaining why this price was chosen"
}`;

    const result = await model.generateContent(systemPrompt);
    const textResponse = result.response.text();
    const parsed = JSON.parse(textResponse);

    return validateAndEnforceGuardrails({
      role,
      rawOfferPrice: parsed.offerPrice,
      rawMessage: parsed.message,
      rawRationale: parsed.rationale,
      buyerLimits,
      sellerLimits,
      currentRound,
      maxRounds
    });
  } catch (error) {
    console.warn(`[GeminiAgentService] Gemini invocation failed (${error.message}). Falling back to concession engine.`);
    const fallback = generateFallbackOffer({
      role,
      product,
      buyerLimits,
      sellerLimits,
      currentRound,
      maxRounds,
      offerHistory
    });

    return validateAndEnforceGuardrails({
      role,
      rawOfferPrice: fallback.offerPrice,
      rawMessage: fallback.message,
      rawRationale: `${fallback.rationale} [Fallback active: ${error.message}]`,
      buyerLimits,
      sellerLimits,
      currentRound,
      maxRounds
    });
  }
};
