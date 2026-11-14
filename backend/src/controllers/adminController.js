import User from '../models/User.js';
import Product from '../models/Product.js';
import Negotiation from '../models/Negotiation.js';
import Deal from '../models/Deal.js';
import Review from '../models/Review.js';

// @desc    Get Admin Dashboard Stats (real MongoDB data)
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
export const getAdminDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalProducts,
      activeListings,
      runningNegotiations,
      pendingDealApprovals,
      confirmedDeals,
      completedDeals,
      flaggedReviewsCount
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Product.countDocuments({ status: 'ACTIVE' }),
      Negotiation.countDocuments({ status: { $in: ['INITIATED', 'IN_PROGRESS'] } }),
      Deal.countDocuments({ status: 'PENDING_APPROVAL' }),
      Deal.countDocuments({ status: 'CONFIRMED' }),
      Deal.countDocuments({ status: 'COMPLETED' }),
      Review.countDocuments({ flagged: true })
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        activeListings,
        runningNegotiations,
        pendingDealApprovals,
        confirmedDeals,
        completedDeals,
        flaggedReviewsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
export const getAdminUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle/Update user status
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin only)
export const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Administrators cannot deactivate their own account.' });
    }

    const newStatus = status ? status.toUpperCase() : (user.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE');
    if (!['ACTIVE', 'DEACTIVATED'].includes(newStatus)) {
      return res.status(400).json({ success: false, message: 'Status must be ACTIVE or DEACTIVATED.' });
    }

    user.status = newStatus;
    await user.save();

    res.json({
      success: true,
      message: `User status changed to ${newStatus}.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all listings
// @route   GET /api/admin/products
// @access  Private (Admin only)
export const getAdminProducts = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate('sellerId', 'name email city')
      .sort({ createdAt: -1 });

    const formatted = products.map((p) => {
      const obj = p.toObject();
      obj.seller = obj.sellerId;
      return obj;
    });

    res.json({
      success: true,
      count: formatted.length,
      products: formatted
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove an inappropriate listing
// @route   DELETE /api/admin/products/:id
// @access  Private (Admin only)
export const removeAdminProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.status = 'REMOVED';
    await product.save();

    res.json({
      success: true,
      message: 'Product removed by administrator.',
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all deals
// @route   GET /api/admin/deals
// @access  Private (Admin only)
export const getAdminDeals = async (req, res, next) => {
  try {
    const deals = await Deal.find()
      .populate('productId', 'title price')
      .populate('buyerId', 'name email city')
      .populate('sellerId', 'name email city')
      .sort({ createdAt: -1 });

    const formatted = deals.map((d) => {
      const obj = d.toObject();
      obj.product = obj.productId;
      obj.buyer = obj.buyerId;
      obj.seller = obj.sellerId;
      return obj;
    });

    res.json({
      success: true,
      count: formatted.length,
      deals: formatted
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get flagged reviews
// @route   GET /api/admin/reviews/flagged
// @access  Private (Admin only)
export const getFlaggedReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ flagged: true })
      .populate('reviewerId', 'name email')
      .populate('revieweeId', 'name email')
      .populate('dealId')
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
