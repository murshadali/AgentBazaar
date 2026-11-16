import express from 'express';
import {
  getAdminDashboard,
  getAdminUsers,
  updateUserStatus,
  getAdminProducts,
  removeAdminProduct,
  getAdminDeals,
  getFlaggedReviews,
  dismissReviewFlag,
  deleteAdminReview
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get('/dashboard', getAdminDashboard);
router.get('/users', getAdminUsers);
router.patch('/users/:id/status', updateUserStatus);
router.get('/products', getAdminProducts);
router.delete('/products/:id', removeAdminProduct);
router.get('/deals', getAdminDeals);
router.get('/reviews/flagged', getFlaggedReviews);
router.patch('/reviews/:id/dismiss', dismissReviewFlag);
router.delete('/reviews/:id', deleteAdminReview);

export default router;
