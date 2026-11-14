import SellerAgentConfig from '../models/SellerAgentConfig.js';
import Product from '../models/Product.js';

// @desc    Configure Seller Agent for a product
// @route   POST /api/products/:id/agent-config
// @access  Private (Owner only)
export const createOrUpdateAgentConfig = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (String(product.sellerId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only the product owner can configure the Seller Agent.' });
    }

    const { openingAsk, privateMinPrice, style, maxRounds } = req.body;

    const askNum = Number(openingAsk);
    const minNum = Number(privateMinPrice);

    if (isNaN(minNum) || minNum <= 0) {
      return res.status(400).json({ success: false, message: 'Private minimum price must be greater than zero.' });
    }

    if (isNaN(askNum) || askNum <= 0) {
      return res.status(400).json({ success: false, message: 'Opening ask price must be greater than zero.' });
    }

    if (minNum > askNum) {
      return res.status(400).json({ success: false, message: 'Private minimum acceptable price cannot exceed opening ask.' });
    }

    if (askNum > product.price) {
      return res.status(400).json({ success: false, message: `Opening ask (₹${askNum}) cannot exceed the public listing price (₹${product.price}).` });
    }

    const rounds = Math.min(10, Math.max(1, Number(maxRounds) || 5));
    const normalizedStyle = (style || 'BALANCED').toUpperCase();

    let config = await SellerAgentConfig.findOne({ productId: product._id }).select('+privateMinPrice');

    if (config) {
      config.openingAsk = askNum;
      config.privateMinPrice = minNum;
      config.style = normalizedStyle;
      config.maxRounds = rounds;
      config.updatedAt = new Date();
      await config.save();
    } else {
      config = await SellerAgentConfig.create({
        productId: product._id,
        openingAsk: askNum,
        privateMinPrice: minNum,
        style: normalizedStyle,
        maxRounds: rounds
      });
    }

    res.json({
      success: true,
      message: 'Seller Agent configuration saved successfully.',
      config
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Seller Agent configuration for a product
// @route   GET /api/products/:id/agent-config
// @access  Private (Owner only)
export const getAgentConfig = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const isOwner = String(product.sellerId) === String(req.user._id);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Private agent configuration can only be viewed by the listing owner.' });
    }

    const config = await SellerAgentConfig.findOne({ productId: product._id }).select('+privateMinPrice');

    res.json({
      success: true,
      config
    });
  } catch (error) {
    next(error);
  }
};
