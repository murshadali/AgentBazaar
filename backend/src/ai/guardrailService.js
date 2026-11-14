import { calculateConcessionMove } from './concessionService.js';

/**
 * Guardrail Validation Service
 * Every AI-suggested move must strictly pass programmatic verification before storage.
 */
export const validateAndGuardrailAction = ({
  rawAction, // { action: 'OFFER'|'ACCEPT'|'REJECT', price: number|null, message: string }
  actor, // 'BUYER_AGENT' | 'SELLER_AGENT'
  product,
  privateConfig, // Buyer: { targetPrice, budgetCeiling, style }, Seller: { openingAsk, privateMinPrice, style }
  currentRound,
  maxRounds,
  offerHistory = []
}) => {
  let action = rawAction?.action ? String(rawAction.action).toUpperCase().trim() : null;
  let price = rawAction?.price !== undefined && rawAction?.price !== null ? Math.round(Number(rawAction.price)) : null;
  let message = rawAction?.message ? String(rawAction.message).trim() : '';
  let guardrailCorrected = false;
  let notes = [];

  // Helper to fallback if unrecoverable
  const fallbackToRuleBased = (reason) => {
    guardrailCorrected = true;
    notes.push(reason);
    const fallback = calculateConcessionMove({
      actor,
      product,
      privateConfig,
      currentRound,
      maxRounds,
      offerHistory
    });
    return {
      action: fallback.action,
      price: fallback.price,
      message: fallback.message,
      guardrailCorrected: true,
      guardrailNote: notes.join(' | ')
    };
  };

  // 1. Action type validation: Only OFFER, ACCEPT, REJECT are permitted
  if (!['OFFER', 'ACCEPT', 'REJECT'].includes(action)) {
    return fallbackToRuleBased(`Invalid action type: '${action}'. Discarded and substituted rule-based move.`);
  }

  // 2. Round limit check
  if (currentRound > maxRounds) {
    return {
      action: 'REJECT',
      price: null,
      message: 'Maximum allowed negotiation rounds have been reached.',
      guardrailCorrected: true,
      guardrailNote: 'Terminated due to max rounds exceeded.'
    };
  }

  const lastOpponentOffer = offerHistory.length > 0 ? offerHistory[offerHistory.length - 1] : null;

  // 3. Opening turn check: BUYER_AGENT must make an OFFER or REJECT, cannot ACCEPT on turn 1
  if (offerHistory.length === 0) {
    if (actor !== 'BUYER_AGENT') {
      return fallbackToRuleBased('Protocol violation: Opening turn must be BUYER_AGENT.');
    }
    if (action === 'ACCEPT') {
      return fallbackToRuleBased('Buyer Agent cannot ACCEPT on opening turn without prior seller offer.');
    }
  }

  // 4. Verification for ACCEPT action
  if (action === 'ACCEPT') {
    if (!lastOpponentOffer || typeof lastOpponentOffer.price !== 'number') {
      return fallbackToRuleBased('Cannot ACCEPT without a standing opponent offer.');
    }

    const standingPrice = Math.round(lastOpponentOffer.price);

    // Limit check for acceptance
    if (actor === 'BUYER_AGENT') {
      if (standingPrice > privateConfig.budgetCeiling) {
        return fallbackToRuleBased(`Buyer Agent cannot ACCEPT price (₹${standingPrice}) exceeding budget ceiling (₹${privateConfig.budgetCeiling}).`);
      }
    } else {
      // SELLER_AGENT
      if (standingPrice < privateConfig.privateMinPrice) {
        return fallbackToRuleBased(`Seller Agent cannot ACCEPT price (₹${standingPrice}) below floor price (₹${privateConfig.privateMinPrice}).`);
      }
    }

    // Set exact agreed price to the standing opponent offer
    price = standingPrice;
  }

  // 5. Verification for REJECT action
  if (action === 'REJECT') {
    price = null;
    if (!message) {
      message = 'We are unable to accept the current terms and are concluding negotiations.';
    }
  }

  // 6. Verification for OFFER action
  if (action === 'OFFER') {
    if (price === null || isNaN(price) || price <= 0) {
      return fallbackToRuleBased('Offer price was missing, non-numeric, or non-positive.');
    }

    if (actor === 'BUYER_AGENT') {
      const budgetCeiling = Math.round(Number(privateConfig.budgetCeiling));

      // Limit Check: Buyer cannot offer above budget ceiling
      if (price > budgetCeiling) {
        guardrailCorrected = true;
        notes.push(`Buyer offer ₹${price} exceeded ceiling ₹${budgetCeiling}. Clamped to ₹${budgetCeiling}.`);
        price = budgetCeiling;
      }

      // Crossing Check: If buyer offer reaches or exceeds standing seller ask, convert to ACCEPT
      if (lastOpponentOffer && lastOpponentOffer.actor === 'SELLER_AGENT' && typeof lastOpponentOffer.price === 'number') {
        const standingAsk = Math.round(lastOpponentOffer.price);
        if (price >= standingAsk && standingAsk <= budgetCeiling) {
          guardrailCorrected = true;
          notes.push(`Buyer offer ₹${price} crossed standing seller ask ₹${standingAsk}. Converted to ACCEPT.`);
          return {
            action: 'ACCEPT',
            price: standingAsk,
            message: `Your counter-offer of ₹${standingAsk.toLocaleString('en-IN')} is acceptable. We accept this price!`,
            guardrailCorrected: true,
            guardrailNote: notes.join(' | ')
          };
        }
      }

      // Direction Check: Buyer successive offers must not decrease
      const myPreviousOffers = offerHistory.filter((o) => o.actor === 'BUYER_AGENT' && typeof o.price === 'number');
      if (myPreviousOffers.length > 0) {
        const highestPastOffer = Math.max(...myPreviousOffers.map((o) => o.price));
        if (price < highestPastOffer) {
          guardrailCorrected = true;
          notes.push(`Buyer offer ₹${price} moved backward against previous high ₹${highestPastOffer}. Corrected to ₹${highestPastOffer}.`);
          price = highestPastOffer;
        }
      }
    } else {
      // SELLER_AGENT
      const floorPrice = Math.round(Number(privateConfig.privateMinPrice));

      // Limit Check: Seller cannot offer below private floor
      if (price < floorPrice) {
        guardrailCorrected = true;
        notes.push(`Seller ask ₹${price} dropped below minimum floor ₹${floorPrice}. Clamped to ₹${floorPrice}.`);
        price = floorPrice;
      }

      // Crossing Check: If seller counter-offer drops to or below standing buyer offer, convert to ACCEPT
      if (lastOpponentOffer && lastOpponentOffer.actor === 'BUYER_AGENT' && typeof lastOpponentOffer.price === 'number') {
        const standingOffer = Math.round(lastOpponentOffer.price);
        if (price <= standingOffer && standingOffer >= floorPrice) {
          guardrailCorrected = true;
          notes.push(`Seller ask ₹${price} met standing buyer offer ₹${standingOffer}. Converted to ACCEPT.`);
          return {
            action: 'ACCEPT',
            price: standingOffer,
            message: `Your offer of ₹${standingOffer.toLocaleString('en-IN')} meets our requirements. We accept this price!`,
            guardrailCorrected: true,
            guardrailNote: notes.join(' | ')
          };
        }
      }

      // Direction Check: Seller successive asks must not increase
      const myPreviousAsks = offerHistory.filter((o) => o.actor === 'SELLER_AGENT' && typeof o.price === 'number');
      if (myPreviousAsks.length > 0) {
        const lowestPastAsk = Math.min(...myPreviousAsks.map((o) => o.price));
        if (price > lowestPastAsk) {
          guardrailCorrected = true;
          notes.push(`Seller ask ₹${price} moved upward against previous low ₹${lowestPastAsk}. Corrected to ₹${lowestPastAsk}.`);
          price = lowestPastAsk;
        }
      }
    }
  }

  // 7. Message Privacy & Cleanliness Check
  // Ensure message does NOT leak private limit numbers
  const privateNum = actor === 'BUYER_AGENT' ? privateConfig.budgetCeiling : privateConfig.privateMinPrice;
  if (privateNum && message.includes(String(privateNum))) {
    guardrailCorrected = true;
    notes.push('Redacted message containing private price limit.');
    message = actor === 'BUYER_AGENT'
      ? `Our strategic proposal for this round is ₹${price ? price.toLocaleString('en-IN') : ''}.`
      : `Considering market value and condition, our counter-offer is ₹${price ? price.toLocaleString('en-IN') : ''}.`;
  }

  if (!message) {
    message = action === 'ACCEPT'
      ? `Agreed on ₹${price ? price.toLocaleString('en-IN') : ''}.`
      : `Offer of ₹${price ? price.toLocaleString('en-IN') : ''} for round ${currentRound}.`;
  }

  return {
    action,
    price,
    message,
    guardrailCorrected,
    guardrailNote: notes.join(' | ')
  };
};
