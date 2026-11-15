import mongoose from 'mongoose';
import Product from '../models/Product.js';
import SellerAgentConfig from '../models/SellerAgentConfig.js';

// @desc    Get all active products with filters, search, and pagination
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const { keyword, category, condition, minPrice, maxPrice, location, sort, page = 1, limit = 12 } = req.query;

    const query = { status: 'ACTIVE' };

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword.trim(), $options: 'i' } },
        { description: { $regex: keyword.trim(), $options: 'i' } }
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (condition && condition !== 'All') {
      query.condition = condition;
    }

    if (location) {
      query.location = { $regex: location.trim(), $options: 'i' };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('sellerId', 'name email city photo reputation')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    // Check which products have Seller Agent Config configured
    const productIds = products.map((p) => p._id);
    const configs = await SellerAgentConfig.find({ productId: { $in: productIds } }).select('productId openingAsk style maxRounds');
    const configuredSet = new Set(configs.map((c) => String(c.productId)));

    const enhancedProducts = products.map((p) => {
      const obj = p.toObject();
      obj.hasSellerConfig = configuredSet.has(String(p._id));
      obj.seller = obj.sellerId; // backward compatibility
      return obj;
    });

    res.json({
      success: true,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      count: enhancedProducts.length,
      products: enhancedProducts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('sellerId', 'name email city phone photo reputation bio');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const isOwner = req.user && String(req.user._id) === String(product.sellerId._id);
    const productObj = product.toObject();
    productObj.seller = productObj.sellerId;

    // Fetch SellerAgentConfig
    let agentConfig = null;
    if (isOwner) {
      // Owner gets full config including privateMinPrice
      agentConfig = await SellerAgentConfig.findOne({ productId: product._id }).select('+privateMinPrice');
    } else {
      // Non-owners get public config (openingAsk, style, maxRounds) with privateMinPrice omitted
      agentConfig = await SellerAgentConfig.findOne({ productId: product._id });
    }

    productObj.hasSellerConfig = !!agentConfig;
    productObj.sellerAgentConfig = agentConfig;

    res.json({
      success: true,
      product: productObj,
      isOwner: !!isOwner
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new product listing
// @route   POST /api/products
// @access  Private
export const createProduct = async (req, res, next) => {
  try {
    const {
      title,
      description,
      price,
      condition,
      category,
      location,
      images,
      openingAsk,
      privateMinPrice,
      style,
      maxRounds
    } = req.body;

    if (!title || !description || !price || !condition || !category || !location) {
      return res.status(400).json({ success: false, message: 'Please provide all required product fields.' });
    }

    const numericPrice = Number(price);
    if (numericPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Listing price must be greater than zero.' });
    }

    const product = await Product.create({
      title: title.trim(),
      description: description.trim(),
      price: numericPrice,
      condition,
      category,
      location: location.trim(),
      images: Array.isArray(images) && images.length ? images : ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'],
      sellerId: req.user._id,
      status: 'ACTIVE'
    });

    // Automatically configure Seller Agent if values provided
    let config = null;
    if (privateMinPrice) {
      const ask = openingAsk ? Number(openingAsk) : numericPrice;
      const floor = Number(privateMinPrice);

      if (floor <= 0 || floor > ask || ask > numericPrice) {
        // Log warning but don't fail product creation
        console.warn('[CreateProduct] Invalid seller agent bounds provided, skipping config creation');
      } else {
        config = await SellerAgentConfig.create({
          productId: product._id,
          openingAsk: ask,
          privateMinPrice: floor,
          style: (style || 'BALANCED').toUpperCase(),
          maxRounds: Number(maxRounds) || 5
        });
      }
    }

    res.status(201).json({
      success: true,
      product,
      sellerAgentConfig: config
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product listing
// @route   PUT /api/products/:id
// @access  Private (Owner only)
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (String(product.sellerId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this listing' });
    }

    const { title, description, price, condition, category, location, images, status } = req.body;

    if (title) product.title = title.trim();
    if (description) product.description = description.trim();
    if (price) product.price = Number(price);
    if (condition) product.condition = condition;
    if (category) product.category = category;
    if (location) product.location = location.trim();
    if (images) product.images = images;
    if (status && ['ACTIVE', 'RESERVED', 'SOLD', 'REMOVED'].includes(status)) {
      product.status = status;
    }

    await product.save();

    res.json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Remove product listing
// @route   DELETE /api/products/:id
// @access  Private (Owner or Admin)
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const isOwner = String(product.sellerId) === String(req.user._id);
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this listing' });
    }

    // Clean up associated seller agent config
    await SellerAgentConfig.deleteMany({ productId: product._id });

    // Check if there are confirmed or completed deals on this product
    const dealCount = await mongoose.model('Deal').countDocuments({
      productId: product._id,
      status: { $in: ['CONFIRMED', 'COMPLETED'] }
    });

    if (dealCount > 0) {
      // Retain for deal audit records, but marked as REMOVED
      product.status = 'REMOVED';
      await product.save();
    } else {
      // Completely remove product and its unfinalized negotiations
      await Product.findByIdAndDelete(product._id);
      await mongoose.model('Negotiation').deleteMany({ productId: product._id });
    }

    res.json({
      success: true,
      message: 'Product listing removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's listings
// @route   GET /api/products/my-listings
// @access  Private
export const getMyListings = async (req, res, next) => {
  try {
    // Only return listings that are not REMOVED
    const products = await Product.find({
      sellerId: req.user._id,
      status: { $ne: 'REMOVED' }
    }).sort({ createdAt: -1 });

    const productIds = products.map((p) => p._id);
    const configs = await SellerAgentConfig.find({ productId: { $in: productIds } }).select('+privateMinPrice');
    const configMap = {};
    configs.forEach((c) => { configMap[String(c.productId)] = c; });

    const enhanced = products.map((p) => {
      const obj = p.toObject();
      obj.sellerAgentConfig = configMap[String(p._id)] || null;
      obj.hasSellerConfig = !!configMap[String(p._id)];
      return obj;
    });

    res.json({
      success: true,
      count: enhanced.length,
      products: enhanced
    });
  } catch (error) {
    next(error);
  }
};
