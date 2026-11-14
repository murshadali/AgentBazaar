import Negotiation from '../models/Negotiation.js';
import Offer from '../models/Offer.js';
import Deal from '../models/Deal.js';
import Product from '../models/Product.js';
import { generateAgentDecision } from '../ai/geminiClient.js';
import { emitToNegotiation } from './socketService.js';
import { SYSTEM_LIMITS } from '../ai/concessionConfig.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes a single turn of an autonomous negotiation session.
 */
export const executeNextTurn = async (negotiationId) => {
  const negotiation = await Negotiation.findById(negotiationId)
    .populate('productId')
    .populate('buyerId', 'name email phone city role')
    .populate('sellerId', 'name email phone city role');

  if (!negotiation) {
    throw new Error('Negotiation session not found');
  }

  if (negotiation.status !== 'INITIATED' && negotiation.status !== 'IN_PROGRESS') {
    return { negotiation, ended: true, reason: `Negotiation is ${negotiation.status}` };
  }

  // Load immutable offer history
  const existingOffers = await Offer.find({ negotiationId }).sort({ round: 1, createdAt: 1 });

  let nextActor = 'BUYER_AGENT';
  let nextRound = negotiation.currentRound || 1;

  if (existingOffers.length > 0) {
    const lastOffer = existingOffers[existingOffers.length - 1];
    if (lastOffer.actor === 'BUYER_AGENT') {
      nextActor = 'SELLER_AGENT';
      nextRound = lastOffer.round;
    } else {
      nextActor = 'BUYER_AGENT';
      nextRound = lastOffer.round + 1;
    }
  }

  // Check if round limit has been reached
  if (nextRound > negotiation.maxRounds) {
    negotiation.status = 'FAILED';
    negotiation.endedAt = new Date();
    negotiation.endReason = 'Maximum negotiation rounds reached without price convergence.';
    await negotiation.save();

    emitToNegotiation(negotiationId, 'negotiation:status', {
      negotiationId,
      status: 'FAILED',
      reason: negotiation.endReason
    });

    return { negotiation, ended: true, reason: negotiation.endReason };
  }

  negotiation.status = 'IN_PROGRESS';
  negotiation.currentRound = nextRound;
  await negotiation.save();

  // Emit agent thinking indicator over Socket.IO
  emitToNegotiation(negotiationId, 'agent_thinking', {
    actor: nextActor,
    round: nextRound,
    message: `${nextActor === 'BUYER_AGENT' ? 'Buyer Agent' : 'Seller Agent'} is formulating next move for Round ${nextRound}...`
  });

  // Short pause for realistic UX and rate limit respect
  await delay(800);

  // Determine private configuration snapshot for the acting agent
  const privateConfig = nextActor === 'BUYER_AGENT'
    ? negotiation.buyerConfigCopy
    : negotiation.sellerConfigCopy;

  const decision = await generateAgentDecision({
    actor: nextActor,
    product: negotiation.productId,
    privateConfig,
    currentRound: nextRound,
    maxRounds: negotiation.maxRounds,
    offerHistory: existingOffers
  });

  // Store offer record (with unique compound index handling)
  let savedOffer;
  try {
    savedOffer = await Offer.create({
      negotiationId: negotiation._id,
      round: nextRound,
      actor: nextActor,
      action: decision.action,
      price: decision.price,
      message: decision.message,
      guardrailCorrected: decision.guardrailCorrected || false,
      guardrailNote: decision.guardrailNote || ''
    });
  } catch (err) {
    if (err.code === 11000) {
      console.warn(`[Orchestrator] Duplicate offer prevented by unique index for round ${nextRound} ${nextActor}`);
      savedOffer = await Offer.findOne({ negotiationId: negotiation._id, round: nextRound, actor: nextActor });
    } else {
      throw err;
    }
  }

  // Emit new offer event over Socket.IO (Section 10)
  emitToNegotiation(negotiationId, 'negotiation:offer', {
    negotiationId,
    offer: savedOffer,
    round: nextRound,
    actor: nextActor
  });

  // Check terminal conditions
  // Terminal 1: Explicit REJECT action
  if (decision.action === 'REJECT') {
    negotiation.status = 'FAILED';
    negotiation.endedAt = new Date();
    negotiation.endReason = `${nextActor === 'BUYER_AGENT' ? 'Buyer Agent' : 'Seller Agent'} rejected offer terms.`;
    await negotiation.save();

    emitToNegotiation(negotiationId, 'negotiation:status', {
      negotiationId,
      status: 'FAILED',
      reason: negotiation.endReason
    });

    return { negotiation, ended: true, reason: negotiation.endReason };
  }

  // Terminal 2: Explicit ACCEPT action or Price Convergence
  const updatedOffers = await Offer.find({ negotiationId }).sort({ round: 1, createdAt: 1 });
  let isAgreed = decision.action === 'ACCEPT';
  let agreedPrice = decision.price;

  if (!isAgreed && updatedOffers.length >= 2) {
    const last = updatedOffers[updatedOffers.length - 1];
    const prev = updatedOffers[updatedOffers.length - 2];

    if (last.price && prev.price) {
      if (last.actor === 'SELLER_AGENT' && last.price <= prev.price) {
        isAgreed = true;
        agreedPrice = last.price;
      } else if (last.actor === 'BUYER_AGENT' && last.price >= prev.price) {
        isAgreed = true;
        agreedPrice = prev.price;
      } else if (last.price === prev.price) {
        isAgreed = true;
        agreedPrice = last.price;
      }
    }
  }

  if (isAgreed && agreedPrice) {
    // Attempt atomic product reservation (Section 11)
    const reservedProduct = await Product.findOneAndUpdate(
      { _id: negotiation.productId._id, status: 'ACTIVE' },
      { status: 'RESERVED' },
      { new: true }
    );

    if (!reservedProduct) {
      // Could not reserve product (already reserved or sold to another deal)
      negotiation.status = 'FAILED';
      negotiation.endedAt = new Date();
      negotiation.endReason = 'Item is no longer available or was reserved by another buyer.';
      await negotiation.save();

      emitToNegotiation(negotiationId, 'negotiation:status', {
        negotiationId,
        status: 'FAILED',
        reason: negotiation.endReason
      });

      return { negotiation, ended: true, reason: negotiation.endReason };
    }

    // Create formal Deal Proposal (Section 11)
    const expiryDate = new Date(Date.now() + SYSTEM_LIMITS.APPROVAL_EXPIRY_HOURS * 60 * 60 * 1000);

    const deal = await Deal.create({
      negotiationId: negotiation._id,
      productId: negotiation.productId._id,
      buyerId: negotiation.buyerId._id,
      sellerId: negotiation.sellerId._id,
      agreedPrice,
      status: 'PENDING_APPROVAL',
      expiresAt: expiryDate,
      buyerApproval: { status: 'PENDING' },
      sellerApproval: { status: 'PENDING' }
    });

    negotiation.status = 'AGREED';
    negotiation.agreedPrice = agreedPrice;
    negotiation.dealId = deal._id;
    negotiation.endedAt = new Date();
    await negotiation.save();

    emitToNegotiation(negotiationId, 'negotiation:status', {
      negotiationId,
      status: 'AGREED',
      agreedPrice,
      dealId: deal._id
    });

    emitToNegotiation(negotiationId, 'deal:update', {
      dealId: deal._id,
      agreedPrice,
      status: 'PENDING_APPROVAL'
    });

    return { negotiation, deal, ended: true, reason: 'Price agreement reached' };
  }

  // Check if both parties have made offers in the final round without convergence
  if (nextRound === negotiation.maxRounds && nextActor === 'SELLER_AGENT') {
    negotiation.status = 'FAILED';
    negotiation.endedAt = new Date();
    negotiation.endReason = `Negotiation completed round ${negotiation.maxRounds} without price convergence.`;
    await negotiation.save();

    emitToNegotiation(negotiationId, 'negotiation:status', {
      negotiationId,
      status: 'FAILED',
      reason: negotiation.endReason
    });

    return { negotiation, ended: true, reason: negotiation.endReason };
  }

  return { negotiation, ended: false };
};

/**
 * Runs the autonomous negotiation loop continuously until a terminal condition is reached.
 */
export const runAutonomousSimulation = async (negotiationId, delayBetweenTurnsMs = 1800) => {
  let isFinished = false;
  let safetyCounter = 0;
  const maxTurns = 24;

  while (!isFinished && safetyCounter < maxTurns) {
    safetyCounter++;
    try {
      const turnResult = await executeNextTurn(negotiationId);
      if (turnResult.ended) {
        isFinished = true;
        break;
      }
      await delay(delayBetweenTurnsMs);
    } catch (err) {
      console.error(`[AutonomousSimulation] Turn execution error: ${err.message}`);
      await Negotiation.findByIdAndUpdate(negotiationId, {
        status: 'PAUSED',
        endReason: `Negotiation paused due to error: ${err.message}`
      });
      emitToNegotiation(negotiationId, 'negotiation:status', {
        negotiationId,
        status: 'PAUSED',
        reason: err.message
      });
      isFinished = true;
      break;
    }
  }
};
