import User from '../models/User.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Negotiation from '../models/Negotiation.js';
import Deal from '../models/Deal.js';
import Offer from '../models/Offer.js';

// @desc    Get user dashboard stats and activity
// @route   GET /api/users/dashboard
// @access  Private
export const getUserDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [
      totalListings,
      activeListings,
      runningNegotiations,
      pendingDealApprovals,
      confirmedDeals,
      completedDeals,
      recentListings,
      recentNegotiations,
      pendingApprovals
    ] = await Promise.all([
      Product.countDocuments({ sellerId: userId }),
      Product.countDocuments({ sellerId: userId, status: 'ACTIVE' }),
      Negotiation.countDocuments({
        $or: [{ buyerId: userId }, { sellerId: userId }],
        status: { $in: ['INITIATED', 'IN_PROGRESS'] }
      }),
      Deal.countDocuments({
        $or: [{ buyerId: userId }, { sellerId: userId }],
        status: 'PENDING_APPROVAL'
      }),
      Deal.countDocuments({
        $or: [{ buyerId: userId }, { sellerId: userId }],
        status: 'CONFIRMED'
      }),
      Deal.countDocuments({
        $or: [{ buyerId: userId }, { sellerId: userId }],
        status: 'COMPLETED'
      }),
      Product.find({ sellerId: userId }).sort({ createdAt: -1 }).limit(5),
      Negotiation.find({
        $or: [{ buyerId: userId }, { sellerId: userId }]
      })
        .populate('productId', 'title price images')
        .populate('buyerId', 'name photo')
        .populate('sellerId', 'name photo')
        .sort({ updatedAt: -1 })
        .limit(5),
      Deal.find({
        $or: [{ buyerId: userId }, { sellerId: userId }],
        status: 'PENDING_APPROVAL'
      })
        .populate('productId', 'title price images')
        .populate('buyerId', 'name')
        .populate('sellerId', 'name')
        .limit(5)
    ]);

    res.json({
      success: true,
      stats: {
        totalListings,
        activeListings,
        runningNegotiations,
        pendingDealApprovals,
        confirmedDeals,
        completedDeals
      },
      recentListings,
      recentNegotiations,
      pendingApprovals
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public user profile with reputation and listings
// @route   GET /api/users/:id
// @access  Public
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const products = await Product.find({ sellerId: user._id, status: 'ACTIVE' });
    const reviews = await Review.find({ revieweeId: user._id, flagged: false })
      .populate('reviewerId', 'name photo city')
      .sort({ createdAt: -1 });

    const formattedReviews = reviews.map((r) => {
      const obj = r.toObject();
      obj.reviewer = obj.reviewerId;
      return obj;
    });

    res.json({
      success: true,
      user,
      products,
      reviews: formattedReviews
    });
  } catch (error) {
    next(error);
  }
};
