import express from 'express';
import { getHandover, updateHandover } from '../controllers/handoverController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);

router.get('/:id/handover', getHandover);
router.post('/:id/handover', updateHandover);
router.put('/:id/handover', updateHandover);

export default router;
