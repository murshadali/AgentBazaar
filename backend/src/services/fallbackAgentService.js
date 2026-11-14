/**
 * Fallback Agent Service (NFR5: High Availability)
 * Implements deterministic mathematical concession curves (Boulware / Linear / Conceder)
 * Ensures negotiations work seamlessly even if the Gemini API key is unset, offline, or rate-limited.
 */

export const generateFallbackOffer = ({
  role,
  product,
  buyerLimits,
  sellerLimits,
  currentRound,
  maxRounds,
  offerHistory = []
}) => {
  const t = Math.min(1, Math.max(0, (currentRound - 1) / Math.max(1, maxRounds - 1)));
  const lastCounterOffer = offerHistory.length > 0 ? offerHistory[offerHistory.length - 1] : null;

  if (role === 'buyer_agent') {
    const P_min = buyerLimits.targetPrice;
    const P_max = buyerLimits.budgetCeiling;
    const style = buyerLimits.style || 'moderate';

    // Polynomial concession factor beta:
    // aggressive: beta = 2.5 (Boulware, concedes slowly)
    // moderate: beta = 1.0 (Linear)
    // conservative: beta = 0.4 (Conceder, concedes faster)
    let beta = 1.0;
    if (style === 'aggressive') beta = 2.5;
    else if (style === 'conservative') beta = 0.4;

    const concessionFactor = Math.pow(t, beta);
    let computedPrice = P_min + (P_max - P_min) * concessionFactor;

    // Check if the seller's last offer is already within or below our budget!
    if (lastCounterOffer && lastCounterOffer.offerPrice <= P_max) {
      if (lastCounterOffer.offerPrice <= computedPrice || currentRound >= maxRounds) {
        // Accept the seller's offer!
        computedPrice = lastCounterOffer.offerPrice;
        return {
          offerPrice: Math.round(computedPrice),
          message: `Your counter-offer of ₹${computedPrice.toLocaleString('en-IN')} meets my buyer's budget criteria. We accept this price!`,
          rationale: `Seller offered ₹${computedPrice}, which is within our budget ceiling of ₹${P_max}. Accepting to secure the deal.`
        };
      }
    }

    const price = Math.round(computedPrice);
    const messages = [
      `Taking into account the ${product.condition} condition of the ${product.title} and current resale market rates, my buyer can offer ₹${price.toLocaleString('en-IN')}.`,
      `We appreciate your counter-offer. Based on our evaluation of similar ${product.category} listings, we can step up our offer to ₹${price.toLocaleString('en-IN')}.`,
      `We are keen on concluding this deal quickly. In round ${currentRound}, our revised proposal is ₹${price.toLocaleString('en-IN')}.`,
      `This is a strong cash-ready offer of ₹${price.toLocaleString('en-IN')} for your ${product.title}. We hope we can reach an agreement.`
    ];

    const message = messages[(currentRound - 1) % messages.length];
    const rationale = `Applied ${style} buyer concession curve (round ${currentRound}/${maxRounds}). Offer raised to ₹${price} within ceiling ₹${P_max}.`;

    return {
      offerPrice: price,
      message,
      rationale
    };
  } else {
    // Seller Agent
    const P_max = sellerLimits.targetPrice;
    const P_min = sellerLimits.floorPrice;
    const style = sellerLimits.style || 'balanced';

    // beta factor:
    // firm: beta = 2.5 (Boulware, drops slowly)
    // balanced: beta = 1.0 (Linear)
    // flexible: beta = 0.4 (Drops faster towards floor)
    let beta = 1.0;
    if (style === 'firm') beta = 2.5;
    else if (style === 'flexible') beta = 0.4;

    const concessionFactor = Math.pow(t, beta);
    let computedPrice = P_max - (P_max - P_min) * concessionFactor;

    // Check if buyer's last offer already meets or exceeds our floor
    if (lastCounterOffer && lastCounterOffer.offerPrice >= P_min) {
      if (lastCounterOffer.offerPrice >= computedPrice || currentRound >= maxRounds) {
        computedPrice = lastCounterOffer.offerPrice;
        return {
          offerPrice: Math.round(computedPrice),
          message: `Your offer of ₹${computedPrice.toLocaleString('en-IN')} is acceptable. We are pleased to agree on this price.`,
          rationale: `Buyer offered ₹${computedPrice}, which satisfies the seller's minimum floor of ₹${P_min}. Agreeing to deal.`
        };
      }
    }

    const price = Math.round(computedPrice);
    const messages = [
      `Thank you for your interest in the ${product.title}. Given its pristine ${product.condition} condition, I can offer a reduced price of ₹${price.toLocaleString('en-IN')}.`,
      `I understand your perspective, but considering the quality and demand in ${product.location}, my best counter-offer for this round is ₹${price.toLocaleString('en-IN')}.`,
      `I want to make this work for both of us. I have adjusted my price down to ₹${price.toLocaleString('en-IN')}.`,
      `Final round considerations: I can let this go at ₹${price.toLocaleString('en-IN')}. This is very close to our rock-bottom floor.`
    ];

    const message = messages[(currentRound - 1) % messages.length];
    const rationale = `Applied ${style} seller concession curve (round ${currentRound}/${maxRounds}). Price reduced to ₹${price} above floor ₹${P_min}.`;

    return {
      offerPrice: price,
      message,
      rationale
    };
  }
};
