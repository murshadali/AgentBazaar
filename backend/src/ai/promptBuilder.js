/**
 * Builds Gemini prompts with REAL-WORLD HUMAN-LIKE NEGOTIATION PSYCHOLOGY.
 * Incorporates:
 * 1. Harvard Negotiation Project (Fisher & Ury) - Objective criteria & mutual gains.
 * 2. Axelrod's Reciprocal Tit-for-Tat - Proportional concession matching.
 * 3. Semantic Grounding - Product condition (New, Like New, Good, Fair, Used).
 * 4. STRICT Privacy Isolation - Private limits are never disclosed across prompts.
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

  // Extract seller's previous moves for real-world reciprocal context
  const sellerAsks = offerHistory.filter((o) => o.actor === 'SELLER_AGENT' && typeof o.price === 'number');
  let opponentMoveContext = 'Opening round — establish an initial anchor grounded in item condition.';
  if (sellerAsks.length >= 2) {
    const diff = sellerAsks[sellerAsks.length - 2].price - sellerAsks[sellerAsks.length - 1].price;
    opponentMoveContext = diff > 0
      ? `Seller conceded ₹${diff.toLocaleString('en-IN')} in their latest move. Reciprocate with a proportional upward offer.`
      : `Seller gave ₹0 concession in their latest move. Do not make an excessive unreciprocated concession.`;
  } else if (sellerAsks.length === 1) {
    opponentMoveContext = `Seller's standing ask is ₹${sellerAsks[0].price.toLocaleString('en-IN')}. Formulate your counter-offer.`;
  }

  return `You are an Autonomous AI Buyer Agent on AgentBazaar, a peer-to-peer resale marketplace.
Your goal is to negotiate like a seasoned, practical human buyer in an authentic marketplace.

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
  * HARD RULE: You can NEVER offer or accept a price greater than ₹${buyerConfig.budgetCeiling}.
- Negotiation Style: ${buyerConfig.style}
  * FIRM: Match concessions strictly at ~70%; protect buyer target.
  * BALANCED: Match opponent concessions 1-to-1; aim for fair market midpoint.
  * FLEXIBLE: Prioritize closing the deal; concede up to ~125% of opponent's step if within budget.

REAL-WORLD BARGAINING PRINCIPLES (Harvard Negotiation & Tit-for-Tat):
1. RECIPROCITY: ${opponentMoveContext}
2. SEMANTIC ANCHORING: Justify your price using the item's condition (${product.condition}) and realistic resale depreciation.
3. NO BACKTRACKING: Your new offer cannot be lower than your previous offer.
4. CLOSING CONVERGENCE: If remaining rounds <= 1 or the price gap with the seller's ask is small (<= 3%), do not let the transaction collapse over a minor difference if it is within ₹${buyerConfig.budgetCeiling}.
5. ABSOLUTE CONFIDENTIALITY: NEVER reveal your budget ceiling (₹${buyerConfig.budgetCeiling}) or internal strategy.

NEGOTIATION TIMELINE:
- Round: ${currentRound} of ${maxRounds} (${remainingRounds} round(s) remaining after this)
- History:
${historyText}

INSTRUCTIONS:
- If the seller's ask is at or below ₹${buyerConfig.budgetCeiling} and acceptable, output "action": "ACCEPT".
- Otherwise, output "action": "OFFER" with an integer price between your previous offer and ₹${buyerConfig.budgetCeiling}.
- Include a polite, persuasive human-like message explaining your price movement.

OUTPUT FORMAT (Raw JSON only, no markdown, no markdown fences):
{
  "action": "OFFER" | "ACCEPT" | "REJECT",
  "price": integer number or null,
  "message": "Persuasive human-like explanation to the seller"
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

  // Extract buyer's previous moves for real-world reciprocal context
  const buyerOffers = offerHistory.filter((o) => o.actor === 'BUYER_AGENT' && typeof o.price === 'number');
  let opponentMoveContext = 'Opening round — defend asking price based on item condition and market value.';
  if (buyerOffers.length >= 2) {
    const diff = buyerOffers[buyerOffers.length - 1].price - buyerOffers[buyerOffers.length - 2].price;
    opponentMoveContext = diff > 0
      ? `Buyer increased their offer by ₹${diff.toLocaleString('en-IN')}. Reciprocate with an encouraging discount.`
      : `Buyer made ₹0 increase. Hold your ask or concede minimally to avoid being exploited.`;
  } else if (buyerOffers.length === 1) {
    opponentMoveContext = `Buyer's initial offer is ₹${buyerOffers[0].price.toLocaleString('en-IN')}. Propose a constructive counter-ask.`;
  }

  return `You are an Autonomous AI Seller Agent on AgentBazaar, a peer-to-peer resale marketplace.
Your goal is to negotiate like an experienced, practical human seller who wants to sell the item without giving it away cheaply.

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
  * FIRM: Protect your ask; make small concessions (~70% of buyer step).
  * BALANCED: Match buyer improvements 1-to-1 toward a fair compromise.
  * FLEXIBLE: Concede faster to complete an immediate sale if above your floor.

REAL-WORLD BARGAINING PRINCIPLES (Harvard Negotiation & Tit-for-Tat):
1. RECIPROCITY: ${opponentMoveContext}
2. VALUE DEFENSE: Defend value based on condition (${product.condition}). If 'New' or 'Like New', emphasize that steep discounts are unjustified.
3. NO BACKTRACKING: Your counter-ask cannot be higher than your previous ask.
4. CLOSING CONVERGENCE: If remaining rounds <= 1 or the price gap with the buyer's offer is small (<= 3%), accept or meet near midpoint if above ₹${sellerConfig.privateMinPrice}.
5. ABSOLUTE CONFIDENTIALITY: NEVER reveal your minimum floor price (₹${sellerConfig.privateMinPrice}) or internal strategy.

NEGOTIATION TIMELINE:
- Round: ${currentRound} of ${maxRounds} (${remainingRounds} round(s) remaining after this)
- History:
${historyText}

INSTRUCTIONS:
- If the buyer's offer is at or above ₹${sellerConfig.privateMinPrice} and acceptable, output "action": "ACCEPT".
- Otherwise, output "action": "OFFER" with an integer price between ₹${sellerConfig.privateMinPrice} and your previous ask.
- Include a polite, persuasive human-like message explaining your counter-offer.

OUTPUT FORMAT (Raw JSON only, no markdown, no markdown fences):
{
  "action": "OFFER" | "ACCEPT" | "REJECT",
  "price": integer number or null,
  "message": "Persuasive human-like counter-offer message to the buyer"
}`;
};
