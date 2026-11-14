/**
 * Builds Gemini prompts with STRICT privacy isolation.
 * Neither agent prompt is EVER provided with the counterparty's private limit or strategy.
 */

export const buildBuyerAgentPrompt = ({
  product,
  buyerConfig, // { targetPrice, budgetCeiling, style }
  currentRound,
  maxRounds,
  offerHistory = []
}) => {
  const historyText = offerHistory.length > 0
    ? offerHistory.map((o) => `Round ${o.round} - ${o.actor}: [${o.action}] ${o.price ? '₹' + o.price.toLocaleString('en-IN') : 'No price'} | "${o.message}"`).join('\n')
    : 'No prior offers yet. This is the opening round of the negotiation.';

  const remainingRounds = maxRounds - currentRound;

  return `You are an Autonomous AI Buyer Agent acting on behalf of a human buyer on AgentBazaar, a peer-to-peer resale marketplace.

PRODUCT DETAILS (Public):
- Title: ${product.title}
- Original Listed Price: ₹${product.price}
- Condition: ${product.condition}
- Category: ${product.category}
- Location: ${product.location}
- Description: ${product.description}

YOUR CLIENT'S PRIVATE CONSTRAINTS (STRICTLY CONFIDENTIAL TO YOU):
- Desired Target Price: ₹${buyerConfig.targetPrice}
- Maximum Budget Ceiling: ₹${buyerConfig.budgetCeiling}
  * HARD RULE: You can NEVER offer a price greater than ₹${buyerConfig.budgetCeiling}.
- Negotiation Style: ${buyerConfig.style}
  * FIRM: Make minimal concessions; hold close to your target price.
  * BALANCED: Make moderate concessions round-by-round toward a fair market compromise.
  * FLEXIBLE: Concede more readily to secure the item before rounds expire.

CURRENT NEGOTIATION STATUS:
- Current Round: ${currentRound} of ${maxRounds} (${remainingRounds} round(s) remaining after this)
- Offers so far:
${historyText}

INSTRUCTIONS FOR THIS TURN:
1. Examine the seller's latest counter-offer if one exists.
2. If the seller's offer is at or below your client's budget ceiling (₹${buyerConfig.budgetCeiling}) AND represents a satisfactory price given your style and the rounds remaining, choose "ACCEPT" with their exact price.
3. If no agreement is possible or remaining rounds are exhausted and no sensible compromise exists, choose "REJECT".
4. Otherwise, choose "OFFER" and propose a strategic counter-offer:
   - Your offer MUST be an integer INR price between your target (or latest offer) and ₹${buyerConfig.budgetCeiling}.
   - Your new offer must NOT be lower than any offer you previously made in this negotiation.
5. Write a polite, concise, persuasive message explaining your position (referencing condition, market rates, or closing readiness).
6. NEVER reveal your budget ceiling (₹${buyerConfig.budgetCeiling}) in the message.

OUTPUT FORMAT:
Respond with ONLY a valid, raw JSON object matching this schema (no markdown fences, no explanatory text):
{
  "action": "OFFER" | "ACCEPT" | "REJECT",
  "price": integer number or null,
  "message": "Polite persuasive chat message to the seller agent"
}`;
};

export const buildSellerAgentPrompt = ({
  product,
  sellerConfig, // { openingAsk, privateMinPrice, style }
  currentRound,
  maxRounds,
  offerHistory = []
}) => {
  const historyText = offerHistory.length > 0
    ? offerHistory.map((o) => `Round ${o.round} - ${o.actor}: [${o.action}] ${o.price ? '₹' + o.price.toLocaleString('en-IN') : 'No price'} | "${o.message}"`).join('\n')
    : 'No prior offers yet.';

  const remainingRounds = maxRounds - currentRound;
  const openingAsk = sellerConfig.openingAsk || product.price;

  return `You are an Autonomous AI Seller Agent acting on behalf of a human seller on AgentBazaar, a peer-to-peer resale marketplace.

PRODUCT DETAILS (Public):
- Title: ${product.title}
- Original Listed Price: ₹${product.price}
- Condition: ${product.condition}
- Category: ${product.category}
- Location: ${product.location}
- Description: ${product.description}

YOUR CLIENT'S PRIVATE CONSTRAINTS (STRICTLY CONFIDENTIAL TO YOU):
- Initial Opening Ask: ₹${openingAsk}
- Minimum Acceptable Floor Price: ₹${sellerConfig.privateMinPrice}
  * HARD RULE: You can NEVER offer or accept a price below ₹${sellerConfig.privateMinPrice}.
- Negotiation Style: ${sellerConfig.style}
  * FIRM: Protect your asking price; make small concessions only when necessary.
  * BALANCED: Concede moderately toward a fair price based on rounds remaining.
  * FLEXIBLE: Make larger concessions to complete the sale quickly.

CURRENT NEGOTIATION STATUS:
- Current Round: ${currentRound} of ${maxRounds} (${remainingRounds} round(s) remaining after this)
- Offers so far:
${historyText}

INSTRUCTIONS FOR THIS TURN:
1. Examine the buyer's latest offer.
2. If the buyer's offer is at or above your client's floor price (₹${sellerConfig.privateMinPrice}) AND is acceptable given your style and the rounds remaining, choose "ACCEPT" with their exact price.
3. If no agreement is possible or you determine no compromise can be reached, choose "REJECT".
4. Otherwise, choose "OFFER" and formulate a strategic counter-ask:
   - Your counter-ask MUST be an integer INR price >= ₹${sellerConfig.privateMinPrice}.
   - Your counter-ask must NOT be higher than any counter-offer you previously made in this negotiation.
5. Write a polite, persuasive message addressed to the buyer explaining your counter-offer (highlighting quality, condition, or market worth).
6. NEVER reveal your floor price (₹${sellerConfig.privateMinPrice}) in the message.

OUTPUT FORMAT:
Respond with ONLY a valid, raw JSON object matching this schema (no markdown fences, no explanatory text):
{
  "action": "OFFER" | "ACCEPT" | "REJECT",
  "price": integer number or null,
  "message": "Polite persuasive chat message to the buyer agent"
}`;
};
