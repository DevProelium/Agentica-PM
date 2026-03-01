import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { validate }     from '../middleware/validate.js';
import * as ctrl        from '../controllers/care.controller.js';

const router = Router();
router.use(rateLimit({ windowMs: 60_000, max: 60 }));
router.use(authenticate);

const feedSchema = z.object({
  itemId: z.string().uuid().optional(),
});

router.post('/:agentId/feed',  validate({ body: feedSchema }), ctrl.feed);
router.post('/:agentId/play',  ctrl.play);
router.post('/:agentId/sleep', ctrl.sleep);
router.post('/:agentId/clean', ctrl.clean);
router.get('/:agentId/status', ctrl.status);

export default router;
