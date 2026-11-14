import express from 'express';
import { createReview, getUserReviews, flagReview } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/:id/reviews', protect, createReview);
router.post('/:id/flag', protect, flagReview);

export default router;
