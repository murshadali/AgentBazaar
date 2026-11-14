import express from 'express';
import {
  startNegotiation,
  getNegotiationById,
  getUserNegotiations,
  getNegotiationOffers,
  triggerTurn,
  simulateNegotiation,
  cancelNegotiation
} from '../controllers/negotiationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', startNegotiation);
router.get('/', getUserNegotiations);
router.get('/:id', getNegotiationById);
router.get('/:id/offers', getNegotiationOffers);
router.post('/:id/turn', triggerTurn);
router.post('/:id/simulate', simulateNegotiation);
router.post('/:id/cancel', cancelNegotiation);

export default router;
