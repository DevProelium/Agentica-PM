import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { validate }     from '../middleware/validate.js';
import * as ctrl        from '../controllers/chat.controller.js';

const router = Router();
router.use(rateLimit({ windowMs: 60_000, max: 60 }));
router.use(authenticate);

const messageSchema = z.object({
  content: z.string().min(1).max(4000),
});

router.post('/:agentId/message',  validate({ body: messageSchema }), ctrl.sendMessage);
router.get('/:agentId/history',   ctrl.history);
router.delete('/:agentId/history', ctrl.clearHistory);

export default router;
