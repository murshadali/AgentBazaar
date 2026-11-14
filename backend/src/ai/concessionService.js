import { CONCESSION_CONSTANTS } from './concessionConfig.js';

/**
 * Deterministic Concession Service
 * Calculates mathematical concession prices based on configured negotiation style.
 */
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
  const concessionFactor = Math.pow(t, beta);

  // Latest counter offer from opponent
  const lastOffer = offerHistory.length > 0 ? offerHistory[offerHistory.length - 1] : null;

  if (actor === 'BUYER_AGENT') {
    const P_min = Math.round(Number(privateConfig.targetPrice));
    const P_max = Math.round(Number(privateConfig.budgetCeiling));

    // Special handling for 1-round negotiation: offer budget ceiling to maximize chance
    let computedPrice = maxRounds <= 1 ? P_max : P_min + (P_max - P_min) * concessionFactor;
    computedPrice = Math.min(P_max, Math.max(P_min, Math.round(computedPrice)));

    // Crossing / Acceptance check: If seller's standing ask is already within our ceiling
    if (lastOffer && lastOffer.actor === 'SELLER_AGENT' && typeof lastOffer.price === 'number') {
      const sellerAsk = Math.round(lastOffer.price);

      // If seller's ask is at or below our budget ceiling
      if (sellerAsk <= P_max) {
        // If it is at or below what we would offer, or we reached max rounds, ACCEPT!
        if (sellerAsk <= computedPrice || currentRound >= maxRounds) {
          return {
            action: 'ACCEPT',
            price: sellerAsk,
            message: `We accept your price of ₹${sellerAsk.toLocaleString('en-IN')}. Looking forward to confirming the deal proposal.`,
            rationale: `Seller ask ₹${sellerAsk} is within buyer ceiling ₹${P_max} and meets our threshold (round ${currentRound}/${maxRounds}).`
          };
        }
      }
    }

    // Direction check on buyer's own history: never offer less than our previous offer
    const myPreviousOffers = offerHistory.filter((o) => o.actor === 'BUYER_AGENT' && typeof o.price === 'number');
    if (myPreviousOffers.length > 0) {
      const highestMyOffer = Math.max(...myPreviousOffers.map((o) => o.price));
      if (computedPrice < highestMyOffer) {
        computedPrice = highestMyOffer;
      }
    }

    const messages = [
      `Taking into account the ${product.condition} condition of the ${product.title}, we offer ₹${computedPrice.toLocaleString('en-IN')}.`,
      `We appreciate your counter-offer. Based on prevailing market rates, our revised offer is ₹${computedPrice.toLocaleString('en-IN')}.`,
      `We are keen on concluding this deal. In round ${currentRound}, our revised proposal is ₹${computedPrice.toLocaleString('en-IN')}.`,
      `This is our strong cash-ready offer of ₹${computedPrice.toLocaleString('en-IN')} for your ${product.title}.`
    ];

    return {
      action: 'OFFER',
      price: computedPrice,
      message: messages[(currentRound - 1) % messages.length],
      rationale: `Applied ${normStyle} concession curve (beta=${beta}, round ${currentRound}/${maxRounds}). Price set to ₹${computedPrice} within ceiling ₹${P_max}.`
    };
  } else {
    // SELLER_AGENT
    const P_opening = Math.round(Number(privateConfig.openingAsk || product.price));
    const P_floor = Math.round(Number(privateConfig.privateMinPrice));

    let computedPrice = maxRounds <= 1 ? P_floor : P_opening - (P_opening - P_floor) * concessionFactor;
    computedPrice = Math.max(P_floor, Math.min(P_opening, Math.round(computedPrice)));

    // Crossing / Acceptance check: If buyer's standing offer is at or above our floor
    if (lastOffer && lastOffer.actor === 'BUYER_AGENT' && typeof lastOffer.price === 'number') {
      const buyerOffer = Math.round(lastOffer.price);

      if (buyerOffer >= P_floor) {
        if (buyerOffer >= computedPrice || currentRound >= maxRounds) {
          return {
            action: 'ACCEPT',
            price: buyerOffer,
            message: `Your offer of ₹${buyerOffer.toLocaleString('en-IN')} is acceptable. We are pleased to agree on this price.`,
            rationale: `Buyer offer ₹${buyerOffer} meets or exceeds seller floor ₹${P_floor} and our threshold (round ${currentRound}/${maxRounds}).`
          };
        }
      }
    }

    // Direction check on seller's own history: never ask for more than our previous ask
    const myPreviousAsks = offerHistory.filter((o) => o.actor === 'SELLER_AGENT' && typeof o.price === 'number');
    if (myPreviousAsks.length > 0) {
      const lowestMyAsk = Math.min(...myPreviousAsks.map((o) => o.price));
      if (computedPrice > lowestMyAsk) {
        computedPrice = lowestMyAsk;
      }
    }

    const messages = [
      `Thank you for your interest in the ${product.title}. In ${product.condition} condition, my counter-offer is ₹${computedPrice.toLocaleString('en-IN')}.`,
      `Considering the quality and local demand in ${product.location}, my best counter-offer for this round is ₹${computedPrice.toLocaleString('en-IN')}.`,
      `I want to reach a fair agreement. I have adjusted my counter-offer to ₹${computedPrice.toLocaleString('en-IN')}.`,
      `Final round proposal: I can let this go at ₹${computedPrice.toLocaleString('en-IN')}. This is very close to our acceptable minimum.`
    ];

    return {
      action: 'OFFER',
      price: computedPrice,
      message: messages[(currentRound - 1) % messages.length],
      rationale: `Applied ${normStyle} concession curve (beta=${beta}, round ${currentRound}/${maxRounds}). Price reduced to ₹${computedPrice} above floor ₹${P_floor}.`
    };
  }
};
