/**
 * Guardrail Service (NFR2: Reliability)
 * Enforces hard mathematical bounds on every AI-generated offer before recording.
 * Buyer Agent cannot exceed budget ceiling; Seller Agent cannot drop below floor price.
 */

export const validateAndEnforceGuardrails = ({
  role,
  rawOfferPrice,
  rawMessage,
  rawRationale,
  buyerLimits,
  sellerLimits,
  currentRound,
  maxRounds
}) => {
  let offerPrice = Math.round(Number(rawOfferPrice));
  let message = rawMessage ? String(rawMessage).trim() : '';
  let rationale = rawRationale ? String(rawRationale).trim() : '';
  let guardrailTriggered = false;
  let guardrailNote = '';

  if (isNaN(offerPrice) || offerPrice <= 0) {
    guardrailTriggered = true;
    if (role === 'buyer_agent') {
      offerPrice = Math.round(buyerLimits.targetPrice);
      guardrailNote = 'Recovered invalid offer price to buyer target price.';
    } else {
      offerPrice = Math.round(sellerLimits.targetPrice);
      guardrailNote = 'Recovered invalid offer price to seller listing price.';
    }
  }

  if (role === 'buyer_agent') {
    // Buyer Agent Constraint: Must never exceed budget ceiling
    if (offerPrice > buyerLimits.budgetCeiling) {
      guardrailTriggered = true;
      guardrailNote = `AI offer of ₹${offerPrice} exceeded buyer ceiling ₹${buyerLimits.budgetCeiling}. Clamped to ceiling.`;
      offerPrice = buyerLimits.budgetCeiling;
    }
    // Buyer Agent Constraint: Should not start lower than 40% of target price (sanity floor)
    const minSensibleBuyerOffer = Math.max(1, Math.round(buyerLimits.targetPrice * 0.7));
    if (offerPrice < minSensibleBuyerOffer) {
      guardrailTriggered = true;
      guardrailNote = `AI offer of ₹${offerPrice} was unreasonably low. Raised to ₹${minSensibleBuyerOffer}.`;
      offerPrice = minSensibleBuyerOffer;
    }
  } else if (role === 'seller_agent') {
    // Seller Agent Constraint: Must never drop below minimum floor price
    if (offerPrice < sellerLimits.floorPrice) {
      guardrailTriggered = true;
      guardrailNote = `AI offer of ₹${offerPrice} was below seller floor ₹${sellerLimits.floorPrice}. Clamped to floor.`;
      offerPrice = sellerLimits.floorPrice;
    }
    // Seller Agent Constraint: Should not exceed initial listing target price
    if (offerPrice > sellerLimits.targetPrice) {
      guardrailTriggered = true;
      guardrailNote = `AI offer of ₹${offerPrice} exceeded listing price ₹${sellerLimits.targetPrice}. Clamped to listing price.`;
      offerPrice = sellerLimits.targetPrice;
    }
  }

  // Ensure default polite message if empty
  if (!message) {
    if (role === 'buyer_agent') {
      message = `Based on the product details and our budget, we propose an offer of ₹${offerPrice.toLocaleString('en-IN')}.`;
    } else {
      message = `Considering the product's condition and fair market value, my counter-offer is ₹${offerPrice.toLocaleString('en-IN')}.`;
    }
  }

  if (guardrailTriggered && guardrailNote) {
    rationale = rationale
      ? `${rationale} [Guardrail Safety: ${guardrailNote}]`
      : `[Guardrail Safety: ${guardrailNote}]`;
  }

  return {
    offerPrice,
    message,
    rationale,
    guardrailTriggered,
    guardrailNote
  };
};
