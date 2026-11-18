import Deal from '../models/Deal.js';
import Product from '../models/Product.js';
import Negotiation from '../models/Negotiation.js';
import User from '../models/User.js';
import Handover from '../models/Handover.js';
import Review from '../models/Review.js';
import { emitToNegotiation } from '../services/socketService.js';

// Mask private contact details if deal is not CONFIRMED or COMPLETED (NFR7)
const maskDealPrivacy = (dealDoc, userId) => {
  const deal = dealDoc.toObject ? dealDoc.toObject() : { ...dealDoc };
  const isConfirmedOrCompleted = deal.status === 'CONFIRMED' || deal.status === 'COMPLETED';

  // Populate backward compatibility fields
  deal.buyer = deal.buyerId;
  deal.seller = deal.sellerId;
  deal.product = deal.productId;
  deal.negotiation = deal.negotiationId;

  if (!isConfirmedOrCompleted) {
    if (deal.seller && deal.seller.phone) {
      deal.seller.phone = 'Unlocked only after both parties confirm deal';
    }
    if (deal.buyer && deal.buyer.phone) {
      deal.buyer.phone = 'Unlocked only after both parties confirm deal';
    }
  }

  // Compatibility flags
  deal.buyerApproved = deal.buyerApproval?.status === 'APPROVED';
  deal.sellerApproved = deal.sellerApproval?.status === 'APPROVED';

  return deal;
};

// @desc    Get user's deals
// @route   GET /api/deals
// @access  Private
export const getUserDeals = async (req, res, next) => {
  try {
    const deals = await Deal.find({
      $or: [{ buyerId: req.user._id }, { sellerId: req.user._id }]
    })
      .populate('productId', 'title price images condition location status')
      .populate('buyerId', 'name email phone city photo reputation')
      .populate('sellerId', 'name email phone city photo reputation')
      .sort({ updatedAt: -1 });

    const masked = deals.map((d) => maskDealPrivacy(d, req.user._id));

    // Attach handover details and hasUserReviewed flag to each deal
    const dealIds = deals.map((d) => d._id);
    const [userReviews, handovers] = await Promise.all([
      Review.find({ dealId: { $in: dealIds }, reviewerId: req.user._id }).select('dealId'),
      Handover.find({ dealId: { $in: dealIds } })
    ]);

    const reviewedDealIds = new Set(userReviews.map((r) => String(r.dealId)));
    const handoverMap = {};
    handovers.forEach((h) => {
      handoverMap[String(h.dealId)] = h;
    });

    const dealsWithDetails = masked.map((d) => {
      const dealHandover = handoverMap[String(d._id)] || null;
      return {
        ...d,
        handover: dealHandover,
        hasUserReviewed: reviewedDealIds.has(String(d._id))
      };
    });

    res.json({
      success: true,
      count: dealsWithDetails.length,
      deals: dealsWithDetails
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single deal by ID
// @route   GET /api/deals/:id
// @access  Private
export const getDealById = async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate('productId')
      .populate('buyerId', 'name email phone city photo reputation bio')
      .populate('sellerId', 'name email phone city photo reputation bio')
      .populate('negotiationId');

    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal proposal not found.' });
    }

    const isBuyer = String(deal.buyerId._id) === String(req.user._id);
    const isSeller = String(deal.sellerId._id) === String(req.user._id);
    const isAdmin = req.user.role === 'ADMIN';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this deal.' });
    }

    // Expiry check
    if (deal.status === 'PENDING_APPROVAL' && new Date() > new Date(deal.expiresAt)) {
      deal.status = 'EXPIRED';
      await deal.save();
      // Release product back to ACTIVE
      await Product.findByIdAndUpdate(deal.productId, { status: 'ACTIVE' });
    }

    // Load handover details if deal is confirmed
    let handover = null;
    if (deal.status === 'CONFIRMED' || deal.status === 'COMPLETED') {
      handover = await Handover.findOne({ dealId: deal._id });
    }

    const masked = maskDealPrivacy(deal, req.user._id);
    masked.handover = handover;

    res.json({
      success: true,
      deal: masked,
      userRole: isBuyer ? 'buyer' : 'seller'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a deal proposal (Dual Human Approval FR8)
// @route   POST /api/deals/:id/approve
// @access  Private
export const approveDeal = async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal not found.' });
    }

    if (deal.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({
        success: false,
        message: `Deal cannot be approved because its current status is ${deal.status}.`
      });
    }

    // Check expiry
    if (new Date() > new Date(deal.expiresAt)) {
      deal.status = 'EXPIRED';
      await deal.save();
      await Product.findByIdAndUpdate(deal.productId, { status: 'ACTIVE' });
      return res.status(400).json({
        success: false,
        message: 'The 48-hour deal approval window has expired. The product listing has returned to active.'
      });
    }

    const isBuyer = String(deal.buyerId) === String(req.user._id);
    const isSeller = String(deal.sellerId) === String(req.user._id);

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ success: false, message: 'Not authorized to approve this deal.' });
    }

    if (isBuyer) {
      deal.buyerApproval.status = 'APPROVED';
      deal.buyerApproval.approvedAt = new Date();
    }

    if (isSeller) {
      deal.sellerApproval.status = 'APPROVED';
      deal.sellerApproval.approvedAt = new Date();
    }

    let justConfirmed = false;

    // Both parties must click approve to confirm the deal
    if (deal.buyerApproval.status === 'APPROVED' && deal.sellerApproval.status === 'APPROVED') {
      deal.status = 'CONFIRMED';
      deal.confirmedAt = new Date();
      justConfirmed = true;

      // Ensure Product remains RESERVED
      await Product.findByIdAndUpdate(deal.productId, { status: 'RESERVED' });

      // Cancel any other running negotiations on this same product listing! (Section 11)
      await Negotiation.updateMany(
        {
          productId: deal.productId,
          _id: { $ne: deal.negotiationId },
          status: { $in: ['INITIATED', 'IN_PROGRESS'] }
        },
        {
          status: 'CANCELLED',
          endedAt: new Date(),
          endReason: 'Listing was confirmed in another accepted deal.'
        }
      );

      // Initialize Handover record if not exists
      const existingHandover = await Handover.findOne({ dealId: deal._id });
      if (!existingHandover) {
        const product = await Product.findById(deal.productId);
        const seller = await User.findById(deal.sellerId);
        await Handover.create({
          dealId: deal._id,
          location: product?.location || '',
          timeWindow: 'Flexible',
          contactNumber: seller?.phone || ''
        });
      }
    }

    await deal.save();

    const populated = await Deal.findById(deal._id)
      .populate('productId')
      .populate('buyerId', 'name email phone city photo reputation')
      .populate('sellerId', 'name email phone city photo reputation');

    emitToNegotiation(deal.negotiationId, 'deal:update', {
      dealId: deal._id,
      status: deal.status,
      buyerApproved: deal.buyerApproval.status === 'APPROVED',
      sellerApproved: deal.sellerApproval.status === 'APPROVED',
      justConfirmed
    });

    res.json({
      success: true,
      message: justConfirmed
        ? 'Deal confirmed! Both parties have approved. Handover contact details are now unlocked.'
        : 'Your approval is recorded. Awaiting counterparty approval.',
      deal: maskDealPrivacy(populated, req.user._id)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a deal proposal
// @route   POST /api/deals/:id/reject
// @access  Private
export const rejectDeal = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const deal = await Deal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal not found.' });
    }

    const isBuyer = String(deal.buyerId) === String(req.user._id);
    const isSeller = String(deal.sellerId) === String(req.user._id);

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    deal.status = 'REJECTED';
    if (isBuyer) {
      deal.buyerApproval.status = 'REJECTED';
      deal.buyerApproval.rejectedAt = new Date();
      deal.buyerApproval.rejectionReason = reason || 'Declined during review.';
    } else {
      deal.sellerApproval.status = 'REJECTED';
      deal.sellerApproval.rejectedAt = new Date();
      deal.sellerApproval.rejectionReason = reason || 'Declined during review.';
    }

    await deal.save();

    // Release product back to ACTIVE (Section 11)
    await Product.findByIdAndUpdate(deal.productId, { status: 'ACTIVE' });

    emitToNegotiation(deal.negotiationId, 'deal:update', {
      dealId: deal._id,
      status: 'REJECTED',
      reason: reason || 'Declined by participant.'
    });

    res.json({
      success: true,
      message: 'Deal proposal declined. The product listing has been restored to active.',
      deal
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a confirmed deal before completion (Section 12)
// @route   POST /api/deals/:id/cancel
// @access  Private
export const cancelDeal = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const deal = await Deal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal not found.' });
    }

    if (deal.status !== 'CONFIRMED' && deal.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ success: false, message: `Cannot cancel deal with status ${deal.status}.` });
    }

    const isBuyer = String(deal.buyerId) === String(req.user._id);
    const isSeller = String(deal.sellerId) === String(req.user._id);

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    deal.status = 'CANCELLED';
    deal.cancellationReason = reason || `Cancelled by ${isBuyer ? 'buyer' : 'seller'} before completion.`;
    await deal.save();

    // Restore product back to ACTIVE
    await Product.findByIdAndUpdate(deal.productId, { status: 'ACTIVE' });

    emitToNegotiation(deal.negotiationId, 'deal:update', {
      dealId: deal._id,
      status: 'CANCELLED',
      reason: deal.cancellationReason
    });

    res.json({
      success: true,
      message: 'Deal cancelled. Product listing is active again.',
      deal
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark deal as completed / handed over (Section 13)
// @route   POST /api/deals/:id/complete
// @access  Private
export const completeDeal = async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal not found.' });
    }

    if (deal.status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: 'Only confirmed deals can be marked as completed.'
      });
    }

    const isBuyer = String(deal.buyerId) === String(req.user._id);
    const isSeller = String(deal.sellerId) === String(req.user._id);

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    deal.status = 'COMPLETED';
    deal.completedAt = new Date();
    deal.completedBy = req.user._id;
    await deal.save();

    // Mark product as SOLD (Section 13)
    await Product.findByIdAndUpdate(deal.productId, { status: 'SOLD' });

    // Increment completed deals counter for both users
    await User.findByIdAndUpdate(deal.buyerId, { $inc: { 'reputation.completedDeals': 1 } });
    await User.findByIdAndUpdate(deal.sellerId, { $inc: { 'reputation.completedDeals': 1 } });

    emitToNegotiation(deal.negotiationId, 'deal:update', {
      dealId: deal._id,
      status: 'COMPLETED',
      completedAt: deal.completedAt
    });

    res.json({
      success: true,
      message: 'Deal marked as completed! You can now leave a rating and review.',
      deal
    });
  } catch (error) {
    next(error);
  }
};
