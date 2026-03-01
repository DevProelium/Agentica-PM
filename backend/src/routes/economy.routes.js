import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import * as ctrl        from '../controllers/economy.controller.js';

const router = Router();
router.use(rateLimit({ windowMs: 60_000, max: 60 }));
router.use(authenticate);

router.get('/balance',        ctrl.balance);
router.get('/transactions',   ctrl.transactions);
router.post('/daily-reward',  ctrl.dailyReward);

export default router;
