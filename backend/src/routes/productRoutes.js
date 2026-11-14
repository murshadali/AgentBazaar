import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyListings
} from '../controllers/productController.js';
import {
  createOrUpdateAgentConfig,
  getAgentConfig
} from '../controllers/sellerAgentConfigController.js';
import { protect } from '../middleware/authMiddleware.js';

// Optional auth helper so getProductById knows if the viewer is the owner
const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'agentbazaar_super_secret_jwt_key_2026_amu');
      req.user = await User.findById(decoded.id).select('-password');
    } catch {
      // Ignore token failure for public access
    }
  }
  next();
};

const router = express.Router();

router.get('/', getProducts);
router.get('/my-listings', protect, getMyListings);
router.get('/:id', optionalAuth, getProductById);
router.post('/', protect, createProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

// Seller Agent Configuration routes (Owner only)
router.post('/:id/agent-config', protect, createOrUpdateAgentConfig);
router.get('/:id/agent-config', protect, getAgentConfig);
router.put('/:id/agent-config', protect, createOrUpdateAgentConfig);

export default router;
