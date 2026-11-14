import Review from '../models/Review.js';
import Deal from '../models/Deal.js';
import User from '../models/User.js';

// @desc    Submit a review for a completed deal (Section 13)
// @route   POST /api/deals/:id/reviews
// @access  Private
export const createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const dealId = req.params.id;

    if (!rating) {
      return res.status(400).json({ success: false, message: 'Please provide a star rating from 1 to 5.' });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5 stars.' });
    }

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal not found.' });
    }

    if (deal.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be submitted after the deal has been marked as COMPLETED.'
      });
    }

    const isBuyer = String(deal.buyerId) === String(req.user._id);
    const isSeller = String(deal.sellerId) === String(req.user._id);

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ success: false, message: 'Only participants of this deal can submit a review.' });
    }

    const revieweeId = isBuyer ? deal.sellerId : deal.buyerId;

    // A user cannot review themselves
    if (String(req.user._id) === String(revieweeId)) {
      return res.status(400).json({ success: false, message: 'You cannot review yourself.' });
    }

    // Check if user already reviewed this deal
    const existing = await Review.findOne({ dealId: deal._id, reviewerId: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already submitted a review for this transaction.' });
    }

    const review = await Review.create({
      dealId: deal._id,
      reviewerId: req.user._id,
      revieweeId,
      rating: numRating,
      comment: comment ? comment.trim() : ''
    });

    // Dynamically recalculate average rating for reviewee
    const allReviews = await Review.find({ revieweeId, flagged: false });
    const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = Number((sum / allReviews.length).toFixed(1));

    await User.findByIdAndUpdate(revieweeId, {
      'reputation.averageRating': avg,
      'reputation.totalReviews': allReviews.length
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully. Reputation score updated!',
      review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews received by a user
// @route   GET /api/users/:id/reviews
// @access  Public
export const getUserReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ revieweeId: req.params.id })
      .populate('reviewerId', 'name city photo reputation')
      .populate('dealId', 'agreedPrice status')
      .sort({ createdAt: -1 });

    const formatted = reviews.map((r) => {
      const obj = r.toObject();
      obj.reviewer = obj.reviewerId;
      obj.reviewee = obj.revieweeId;
      obj.deal = obj.dealId;
      return obj;
    });

    res.json({
      success: true,
      count: formatted.length,
      reviews: formatted
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Flag an inappropriate review
// @route   POST /api/reviews/:id/flag
// @access  Private
export const flagReview = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    review.flagged = true;
    review.flagReason = reason || 'Flagged by user for administrative review.';
    await review.save();

    res.json({
      success: true,
      message: 'Review flagged for administrator review.',
      review
    });
  } catch (error) {
    next(error);
  }
};
