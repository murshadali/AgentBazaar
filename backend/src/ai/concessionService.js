import { CONCESSION_CONSTANTS } from './concessionConfig.js';

/**
 * Real-World Human-Like Negotiation Service
 * Based on Harvard Negotiation Project (Fisher & Ury) & Axelrod's Reciprocal Tit-for-Tat.
 *
 * Core Real-World Mechanisms:
 * 1. Reciprocal Concession Matching: If opponent gives a discount, we reciprocate with a fair raise.
 * 2. Unilateral Stubbornness Defense: If opponent gives ₹0 concession, we freeze or minimize our move.
 * 3. Semantic Condition Weighting: Product condition (New, Like New, Good, Fair, Used) anchors justification.
 * 4. Closing Convergence: In final rounds or small gaps (<= 3%), meets near midpoint to close the deal.
 * 5. Strict Limit Invariance: Private limits (Buyer ceiling, Seller floor) are mathematically guaranteed.
 */

// Condition multiplier adjusts concession elasticity
const CONDITION_DISCOUNT_FACTOR = {
  'New': 0.80,        // Minimal wear; sellers defend price strongly
  'Like New': 0.90,   // High retention; small concessions
  'Good': 1.00,       // Standard market resale
  'Fair': 1.15,       // Noticeable wear; buyers expect discounts
  'Used': 1.25        // Heavy use/no warranty; higher discount flexibility
};

export const calculateConcessionMove = ({
  actor, // 'BUYER_AGENT' | 'SELLER_AGENT'
  product,
  privateConfig, // Buyer: { targetPrice, budgetCeiling, style }, Seller: { openingAsk, privateMinPrice, style }
  currentRound,
  maxRounds,
  offerHistory = []
}) => {
  const normStyle = (privateConfig.style || 'BALANCED').toUpperCase();
  const config = CONCESSION_CONSTANTS[normStyle] || CONCESSION_CONSTANTS.BALANCED;
  const beta = config.beta;

  // Normalized time parameter t in [0, 1]
  const t = maxRounds <= 1 ? 1 : Math.min(1, Math.max(0, (currentRound - 1) / (maxRounds - 1)));
  const polynomialFactor = Math.pow(t, beta);

  const conditionFactor = CONDITION_DISCOUNT_FACTOR[product?.condition] || 1.0;
  const lastOffer = offerHistory.length > 0 ? offerHistory[offerHistory.length - 1] : null;

  // -------------------------------------------------------------
  // 1. BUYER AGENT LOGIC (Real-world Buyer Haggling)
  // -------------------------------------------------------------
  if (actor === 'BUYER_AGENT') {
    const P_min = Math.round(Number(privateConfig.targetPrice));
    const P_max = Math.round(Number(privateConfig.budgetCeiling));

    // Calculate baseline polynomial target
    let baselinePrice = maxRounds <= 1 ? P_max : P_min + (P_max - P_min) * polynomialFactor;
    baselinePrice = Math.min(P_max, Math.max(P_min, Math.round(baselinePrice)));

    // Reciprocal Tit-for-Tat check: Did the seller concede in the last round?
    const sellerAsks = offerHistory.filter((o) => o.actor === 'SELLER_AGENT' && typeof o.price === 'number');
    let reciprocalAdjustment = 0;
    let opponentConcession = 0;

    if (sellerAsks.length >= 2) {
      const prevAsk = sellerAsks[sellerAsks.length - 2].price;
      const latestAsk = sellerAsks[sellerAsks.length - 1].price;
      opponentConcession = Math.max(0, prevAsk - latestAsk);
    } else if (sellerAsks.length === 1) {
      const opening = Number(product.price);
      opponentConcession = Math.max(0, opening - sellerAsks[0].price);
    }

    if (sellerAsks.length > 0) {
      if (opponentConcession > 0) {
        // Opponent showed good faith: match proportionally based on style
        const matchMultiplier = normStyle === 'FIRM' ? 0.70 : normStyle === 'BALANCED' ? 1.00 : 1.25;
        reciprocalAdjustment = Math.round(opponentConcession * matchMultiplier * 0.5);
      } else if (currentRound > 1 && currentRound < maxRounds) {
        // Opponent was stubborn: hold ground (discount freeze)
        reciprocalAdjustment = -Math.round((P_max - P_min) * 0.1);
      }
    }

    let computedPrice = Math.min(P_max, Math.max(P_min, Math.round(baselinePrice + reciprocalAdjustment)));

    // Crossing / Acceptance check
    if (lastOffer && lastOffer.actor === 'SELLER_AGENT' && typeof lastOffer.price === 'number') {
      const sellerAsk = Math.round(lastOffer.price);

      // If seller's ask is within buyer budget ceiling
      if (sellerAsk <= P_max) {
        // Direct convergence or close gap (within 3% or ₹800)
        const gap = sellerAsk - computedPrice;
        if (sellerAsk <= computedPrice || currentRound >= maxRounds || gap <= Math.max(800, sellerAsk * 0.03)) {
          return {
            action: 'ACCEPT',
            price: sellerAsk,
            message: `We accept your price of ₹${sellerAsk.toLocaleString('en-IN')}. Considering the ${product.condition} condition and your willingness to compromise, this is a fair mutual agreement.`,
            rationale: `Real-world convergence: Seller ask ₹${sellerAsk} is within buyer ceiling ₹${P_max}. Gap closed successfully in round ${currentRound}/${maxRounds}.`
          };
        }
      }
    }

    // Direction check: Never offer less than previous offer (no backtracking)
    const myPreviousOffers = offerHistory.filter((o) => o.actor === 'BUYER_AGENT' && typeof o.price === 'number');
    if (myPreviousOffers.length > 0) {
      const highestMyOffer = Math.max(...myPreviousOffers.map((o) => o.price));
      if (computedPrice < highestMyOffer) {
        computedPrice = highestMyOffer;
      }
    }

    // Build real-world persuasive messages referencing condition & reciprocity
    let contextualMessage = '';
    if (opponentConcession > 0) {
      contextualMessage = `We appreciate your price adjustment. In return, we are raising our offer to ₹${computedPrice.toLocaleString('en-IN')} for your ${product.title}.`;
    } else if (product.condition === 'Used' || product.condition === 'Fair') {
      contextualMessage = `Taking into account the ${product.condition} condition and market depreciation, our fair cash offer is ₹${computedPrice.toLocaleString('en-IN')}.`;
    } else if (currentRound >= maxRounds) {
      contextualMessage = `This is our final closing offer of ₹${computedPrice.toLocaleString('en-IN')}. We are cash-ready for immediate handover.`;
    } else {
      contextualMessage = `Our revised proposal is ₹${computedPrice.toLocaleString('en-IN')} for the ${product.title}. Looking forward to reaching a mutually fair deal.`;
    }

    return {
      action: 'OFFER',
      price: computedPrice,
      message: contextualMessage,
      rationale: `Applied Tit-for-Tat reciprocal curve (${normStyle}, opponentConcession=₹${opponentConcession}, round ${currentRound}/${maxRounds}). Price set to ₹${computedPrice}.`
    };
  }

  // -------------------------------------------------------------
  // 2. SELLER AGENT LOGIC (Real-world Seller Defending Value)
  // -------------------------------------------------------------
  else {
    const P_opening = Math.round(Number(privateConfig.openingAsk || product.price));
    const P_floor = Math.round(Number(privateConfig.privateMinPrice));

    let baselinePrice = maxRounds <= 1 ? P_floor : P_opening - (P_opening - P_floor) * polynomialFactor;
    baselinePrice = Math.max(P_floor, Math.min(P_opening, Math.round(baselinePrice)));

    // Reciprocal Tit-for-Tat check: How much did the buyer raise their offer?
    const buyerOffers = offerHistory.filter((o) => o.actor === 'BUYER_AGENT' && typeof o.price === 'number');
    let reciprocalDiscount = 0;
    let buyerRaise = 0;

    if (buyerOffers.length >= 2) {
      const prevOffer = buyerOffers[buyerOffers.length - 2].price;
      const latestOffer = buyerOffers[buyerOffers.length - 1].price;
      buyerRaise = Math.max(0, latestOffer - prevOffer);
    } else if (buyerOffers.length === 1) {
      buyerRaise = Math.max(0, buyerOffers[0].price - (privateConfig.targetPrice || buyerOffers[0].price));
    }

    if (buyerOffers.length > 0) {
      if (buyerRaise > 0) {
        // Buyer stepped up: reward with reciprocal discount
        const matchMultiplier = normStyle === 'FIRM' ? 0.70 : normStyle === 'BALANCED' ? 1.00 : 1.25;
        reciprocalDiscount = Math.round(buyerRaise * matchMultiplier * 0.5);
      } else if (currentRound > 1 && currentRound < maxRounds) {
        // Buyer refused to budge: seller slows down concession
        reciprocalDiscount = -Math.round((P_opening - P_floor) * 0.08);
      }
    }

    // Apply product condition defense: 'New' or 'Like New' protects seller ask
    if (product.condition === 'New' || product.condition === 'Like New') {
      reciprocalDiscount = Math.round(reciprocalDiscount * 0.85);
    }

    let computedPrice = Math.max(P_floor, Math.min(P_opening, Math.round(baselinePrice - reciprocalDiscount)));

    // Crossing / Acceptance check
    if (lastOffer && lastOffer.actor === 'BUYER_AGENT' && typeof lastOffer.price === 'number') {
      const buyerOffer = Math.round(lastOffer.price);

      if (buyerOffer >= P_floor) {
        const gap = computedPrice - buyerOffer;
        if (buyerOffer >= computedPrice || currentRound >= maxRounds || gap <= Math.max(800, buyerOffer * 0.03)) {
          return {
            action: 'ACCEPT',
            price: buyerOffer,
            message: `Your offer of ₹${buyerOffer.toLocaleString('en-IN')} is acceptable. We are glad to reach an agreement for the ${product.title}.`,
            rationale: `Real-world convergence: Buyer offer ₹${buyerOffer} meets or exceeds seller floor ₹${P_floor}. Gap resolved in round ${currentRound}/${maxRounds}.`
          };
        }
      }
    }

    // Direction check: Never ask for more than previous ask
    const myPreviousAsks = offerHistory.filter((o) => o.actor === 'SELLER_AGENT' && typeof o.price === 'number');
    if (myPreviousAsks.length > 0) {
      const lowestMyAsk = Math.min(...myPreviousAsks.map((o) => o.price));
      if (computedPrice > lowestMyAsk) {
        computedPrice = lowestMyAsk;
      }
    }

    let contextualMessage = '';
    if (buyerRaise > 0) {
      contextualMessage = `Thank you for improving your offer. In the spirit of a fair deal, I am reducing my asking price to ₹${computedPrice.toLocaleString('en-IN')}.`;
    } else if (product.condition === 'New' || product.condition === 'Like New') {
      contextualMessage = `This item is in ${product.condition} condition with complete accessories. My best counter-offer is ₹${computedPrice.toLocaleString('en-IN')}.`;
    } else if (currentRound >= maxRounds) {
      contextualMessage = `This is my final bottom-line counter-offer of ₹${computedPrice.toLocaleString('en-IN')}. I cannot discount further.`;
    } else {
      contextualMessage = `I can adjust my price to ₹${computedPrice.toLocaleString('en-IN')} for an in-person handover in ${product.location}.`;
    }

    return {
      action: 'OFFER',
      price: computedPrice,
      message: contextualMessage,
      rationale: `Applied Tit-for-Tat reciprocal curve (${normStyle}, buyerRaise=₹${buyerRaise}, round ${currentRound}/${maxRounds}). Price reduced to ₹${computedPrice}.`
    };
  }
};
