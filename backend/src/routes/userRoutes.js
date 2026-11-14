import express from 'express';
import { getUserProfile, getUserDashboard } from '../controllers/userController.js';
import { getUserReviews } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, getUserDashboard);
router.get('/:id/reviews', getUserReviews);
router.get('/:id', getUserProfile);

export default router;
