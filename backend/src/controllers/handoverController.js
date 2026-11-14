import Handover from '../models/Handover.js';
import Deal from '../models/Deal.js';

// @desc    Get handover coordination details for a deal
// @route   GET /api/deals/:id/handover
// @access  Private
export const getHandover = async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal not found.' });
    }

    const isBuyer = String(deal.buyerId) === String(req.user._id);
    const isSeller = String(deal.sellerId) === String(req.user._id);
    const isAdmin = req.user.role === 'ADMIN';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    let handover = await Handover.findOne({ dealId: deal._id });
    if (!handover) {
      handover = await Handover.create({
        dealId: deal._id,
        location: '',
        timeWindow: '',
        contactNumber: ''
      });
    }

    const handoverObj = handover.toObject();

    // Mask contact number if deal is not CONFIRMED or COMPLETED (Section 12)
    if (deal.status !== 'CONFIRMED' && deal.status !== 'COMPLETED') {
      handoverObj.contactNumber = 'Unlocked only after both parties approve deal.';
    }

    res.json({
      success: true,
      handover: handoverObj
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update handover details
// @route   POST or PUT /api/deals/:id/handover
// @access  Private
export const updateHandover = async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal not found.' });
    }

    const isBuyer = String(deal.buyerId) === String(req.user._id);
    const isSeller = String(deal.sellerId) === String(req.user._id);

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (deal.status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: 'Handover coordinates can only be configured for confirmed deals.'
      });
    }

    const { location, timeWindow, contactNumber, notes, suggestedByBuyerTimeWindow } = req.body;

    let handover = await Handover.findOne({ dealId: deal._id });
    if (!handover) {
      handover = new Handover({ dealId: deal._id });
    }

    if (isSeller) {
      if (location !== undefined) handover.location = location.trim();
      if (timeWindow !== undefined) handover.timeWindow = timeWindow.trim();
      if (contactNumber !== undefined) handover.contactNumber = contactNumber.trim();
      if (notes !== undefined) handover.notes = notes.trim();
    }

    if (isBuyer) {
      if (suggestedByBuyerTimeWindow !== undefined) {
        handover.suggestedByBuyerTimeWindow = suggestedByBuyerTimeWindow.trim();
      }
    }

    await handover.save();

    res.json({
      success: true,
      message: 'Handover details updated successfully.',
      handover
    });
  } catch (error) {
    next(error);
  }
};
