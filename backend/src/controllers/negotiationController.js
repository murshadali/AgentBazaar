import Negotiation from '../models/Negotiation.js';
import Product from '../models/Product.js';
import SellerAgentConfig from '../models/SellerAgentConfig.js';
import Offer from '../models/Offer.js';
import { executeNextTurn, runAutonomousSimulation } from '../services/negotiationOrchestrator.js';
import { SYSTEM_LIMITS } from '../ai/concessionConfig.js';

// Helper to strictly mask private negotiation boundaries according to the user's role (NFR1)
const maskNegotiationForUser = (negotiationDoc, userId) => {
  const obj = negotiationDoc.toObject ? negotiationDoc.toObject() : { ...negotiationDoc };
  const isBuyer = String(obj.buyerId?._id || obj.buyerId || obj.buyer?._id || obj.buyer) === String(userId);
  const isSeller = String(obj.sellerId?._id || obj.sellerId || obj.seller?._id || obj.seller) === String(userId);

  if (isBuyer && !isSeller) {
    // Hide seller's floor price from the buyer!
    if (obj.sellerConfigCopy) {
      delete obj.sellerConfigCopy.privateMinPrice;
    }
  } else if (isSeller && !isBuyer) {
    // Hide buyer's budget ceiling from the seller!
    if (obj.buyerConfigCopy) {
      delete obj.buyerConfigCopy.budgetCeiling;
    }
  }

  // Populate backward compatibility fields
  obj.product = obj.productId;
  obj.buyer = obj.buyerId;
  obj.seller = obj.sellerId;
  obj.deal = obj.dealId;

  return obj;
};

// @desc    Initiate a new AI negotiation
// @route   POST /api/negotiations
// @access  Private
export const startNegotiation = async (req, res, next) => {
  try {
    const { productId, targetPrice, budgetCeiling, style, maxRounds, autoRun = true } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // 1. Verify that the buyer is not the product owner
    if (String(product.sellerId) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot negotiate on your own product listing.'
      });
    }

    // 2. Verify that the product is ACTIVE
    if (product.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `This product is currently not available for negotiation (Status: ${product.status}).`
      });
    }

    // 3. Verify that the seller has configured a Seller Agent
    const sellerConfig = await SellerAgentConfig.findOne({ productId: product._id }).select('+privateMinPrice');
    if (!sellerConfig) {
      return res.status(400).json({
        success: false,
        message: 'The seller has not yet configured an AI Seller Agent for this listing. Negotiation is unavailable.'
      });
    }

    // 4. Verify that the buyer does not already have a running negotiation on the same listing
    const existingActive = await Negotiation.findOne({
      productId: product._id,
      buyerId: req.user._id,
      status: { $in: ['INITIATED', 'IN_PROGRESS'] }
    });

    if (existingActive) {
      const masked = maskNegotiationForUser(existingActive, req.user._id);
      return res.json({
        success: true,
        message: 'Active negotiation resumed.',
        negotiation: masked
      });
    }

    // 5. Limit each buyer to five active negotiations
    const activeCount = await Negotiation.countDocuments({
      buyerId: req.user._id,
      status: { $in: ['INITIATED', 'IN_PROGRESS'] }
    });

    if (activeCount >= SYSTEM_LIMITS.MAX_ACTIVE_NEGOTIATIONS_PER_BUYER) {
      return res.status(400).json({
        success: false,
        message: `You have reached the maximum limit of ${SYSTEM_LIMITS.MAX_ACTIVE_NEGOTIATIONS_PER_BUYER} concurrent active negotiations.`
      });
    }

    // 6. Validate buyer's settings
    const numTarget = Number(targetPrice);
    const numBudget = Number(budgetCeiling);

    if (isNaN(numTarget) || numTarget <= 0) {
      return res.status(400).json({ success: false, message: 'Target price must be greater than zero.' });
    }

    if (isNaN(numBudget) || numBudget < numTarget) {
      return res.status(400).json({ success: false, message: 'Maximum budget ceiling cannot be lower than your target price.' });
    }

    if (numBudget > product.price) {
      return res.status(400).json({
        success: false,
        message: `Budget ceiling (₹${numBudget}) cannot exceed the listed asking price (₹${product.price}).`
      });
    }

    const buyerStyle = (style || req.user.defaultStyle || 'BALANCED').toUpperCase();
    const buyerRounds = Math.min(
      Math.min(10, Math.max(1, Number(maxRounds) || 5)),
      sellerConfig.maxRounds || 5
    );

    // 7. Copy configurations into snapshot
    const negotiation = await Negotiation.create({
      productId: product._id,
      buyerId: req.user._id,
      sellerId: product.sellerId,
      status: 'INITIATED',
      currentRound: 1,
      maxRounds: buyerRounds,
      buyerConfigCopy: {
        targetPrice: numTarget,
        budgetCeiling: numBudget,
        style: buyerStyle,
        maxRounds: buyerRounds
      },
      sellerConfigCopy: {
        openingAsk: sellerConfig.openingAsk,
        privateMinPrice: sellerConfig.privateMinPrice,
        style: sellerConfig.style,
        maxRounds: sellerConfig.maxRounds
      }
    });

    // 8. Execute opening turn by Buyer Agent
    await executeNextTurn(negotiation._id);

    // 9. Fetch populated fresh state
    const fresh = await Negotiation.findById(negotiation._id)
      .populate('productId')
      .populate('buyerId', 'name email phone city photo reputation')
      .populate('sellerId', 'name email phone city photo reputation')
      .populate('dealId');

    // 10. Start autonomous loop asynchronously if requested
    if (autoRun) {
      runAutonomousSimulation(fresh._id).catch((err) =>
        console.error('[AutonomousSimulation] Error:', err.message)
      );
    }

    res.status(201).json({
      success: true,
      negotiation: maskNegotiationForUser(fresh, req.user._id)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single negotiation details with role-based private limit protection
// @route   GET /api/negotiations/:id
// @access  Private
export const getNegotiationById = async (req, res, next) => {
  try {
    const negotiation = await Negotiation.findById(req.params.id)
      .populate('productId')
      .populate('buyerId', 'name email phone city photo reputation')
      .populate('sellerId', 'name email phone city photo reputation')
      .populate('dealId');

    if (!negotiation) {
      return res.status(404).json({ success: false, message: 'Negotiation session not found.' });
    }

    const isBuyer = String(negotiation.buyerId._id) === String(req.user._id);
    const isSeller = String(negotiation.sellerId._id) === String(req.user._id);
    const isAdmin = req.user.role === 'ADMIN';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this negotiation.' });
    }

    // Attach immutable offers list
    const offers = await Offer.find({ negotiationId: negotiation._id }).sort({ round: 1, createdAt: 1 });
    const masked = maskNegotiationForUser(negotiation, req.user._id);
    masked.offers = offers;

    res.json({
      success: true,
      negotiation: masked,
      userRole: isBuyer ? 'buyer' : 'seller'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's negotiations (both as buyer and seller)
// @route   GET /api/negotiations
// @access  Private
export const getUserNegotiations = async (req, res, next) => {
  try {
    const negotiations = await Negotiation.find({
      $or: [{ buyerId: req.user._id }, { sellerId: req.user._id }]
    })
      .populate('productId', 'title price images condition location status')
      .populate('buyerId', 'name email city photo reputation')
      .populate('sellerId', 'name email city photo reputation')
      .populate('dealId')
      .sort({ updatedAt: -1 });

    const maskedList = await Promise.all(
      negotiations.map(async (n) => {
        const masked = maskNegotiationForUser(n, req.user._id);
        const latestOffer = await Offer.findOne({ negotiationId: n._id }).sort({ round: -1, createdAt: -1 });
        masked.latestOffer = latestOffer;
        return masked;
      })
    );

    res.json({
      success: true,
      count: maskedList.length,
      negotiations: maskedList
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get immutable offer history for a negotiation
// @route   GET /api/negotiations/:id/offers
// @access  Private
export const getNegotiationOffers = async (req, res, next) => {
  try {
    const negotiation = await Negotiation.findById(req.params.id);
    if (!negotiation) {
      return res.status(404).json({ success: false, message: 'Negotiation not found.' });
    }

    const isBuyer = String(negotiation.buyerId) === String(req.user._id);
    const isSeller = String(negotiation.sellerId) === String(req.user._id);
    const isAdmin = req.user.role === 'ADMIN';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view offers.' });
    }

    const offers = await Offer.find({ negotiationId: negotiation._id }).sort({ round: 1, createdAt: 1 });

    res.json({
      success: true,
      count: offers.length,
      offers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger single turn in negotiation
// @route   POST /api/negotiations/:id/turn
// @access  Private
export const triggerTurn = async (req, res, next) => {
  try {
    const negotiation = await Negotiation.findById(req.params.id);
    if (!negotiation) {
      return res.status(404).json({ success: false, message: 'Negotiation not found.' });
    }

    const isBuyer = String(negotiation.buyerId) === String(req.user._id);
    const isSeller = String(negotiation.sellerId) === String(req.user._id);

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const result = await executeNextTurn(negotiation._id);
    const updated = await Negotiation.findById(negotiation._id)
      .populate('productId')
      .populate('buyerId', 'name email city photo reputation')
      .populate('sellerId', 'name email city photo reputation')
      .populate('dealId');

    const offers = await Offer.find({ negotiationId: negotiation._id }).sort({ round: 1, createdAt: 1 });
    const masked = maskNegotiationForUser(updated, req.user._id);
    masked.offers = offers;

    res.json({
      success: true,
      turnResult: result,
      negotiation: masked
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Run full autonomous simulation
// @route   POST /api/negotiations/:id/simulate
// @access  Private
export const simulateNegotiation = async (req, res, next) => {
  try {
    const negotiation = await Negotiation.findById(req.params.id);
    if (!negotiation) {
      return res.status(404).json({ success: false, message: 'Negotiation not found.' });
    }

    runAutonomousSimulation(negotiation._id).catch((err) =>
      console.error('[SimulateRoute] Error:', err.message)
    );

    res.json({
      success: true,
      message: 'Autonomous negotiation simulation started.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an ongoing negotiation
// @route   POST /api/negotiations/:id/cancel
// @access  Private
export const cancelNegotiation = async (req, res, next) => {
  try {
    const negotiation = await Negotiation.findById(req.params.id);
    if (!negotiation) {
      return res.status(404).json({ success: false, message: 'Negotiation not found.' });
    }

    const isBuyer = String(negotiation.buyerId) === String(req.user._id);
    const isSeller = String(negotiation.sellerId) === String(req.user._id);

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this negotiation.' });
    }

    negotiation.status = 'CANCELLED';
    negotiation.endedAt = new Date();
    negotiation.endReason = `Negotiation cancelled by ${isBuyer ? 'buyer' : 'seller'}.`;
    await negotiation.save();

    res.json({
      success: true,
      message: 'Negotiation cancelled successfully.',
      negotiation: maskNegotiationForUser(negotiation, req.user._id)
    });
  } catch (error) {
    next(error);
  }
};
