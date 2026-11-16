import express from 'express';
import { createReview, getUserReviews, flagReview } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET reviews received by a user (supports both /api/reviews/user/:id and /api/users/:id/reviews)
router.get('/user/:id', getUserReviews);

// POST a review for a completed deal
router.post('/:id/reviews', protect, createReview);
router.post('/:id', protect, createReview);

// POST flag a review for administrator moderation
router.post('/:id/flag', protect, flagReview);

export default router;
