import express from 'express';
import {
  getUserDeals,
  getDealById,
  approveDeal,
  rejectDeal,
  cancelDeal,
  completeDeal
} from '../controllers/dealController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getUserDeals);
router.get('/:id', getDealById);
router.post('/:id/approve', approveDeal);
router.post('/:id/reject', rejectDeal);
router.post('/:id/cancel', cancelDeal);
router.post('/:id/complete', completeDeal);

export default router;
