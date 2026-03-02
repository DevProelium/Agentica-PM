import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { validate }     from '../middleware/validate.js';
import * as ctrl        from '../controllers/knowledge.controller.js';

const router = Router();
router.use(rateLimit({ windowMs: 60_000, max: 60 }));
router.use(authenticate);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const addSchema = z.object({
  title:     z.string().min(1).max(200),
  content:   z.string().min(1).optional(),
  sourceUrl: z.string().url().optional(),
});

router.get('/:agentId',       ctrl.list);
router.post('/:agentId',      upload.single('file'), ctrl.add);
router.delete('/:agentId/:id', ctrl.remove);
router.post('/:agentId/search', validate({ body: z.object({ query: z.string() }) }), ctrl.search);

export default router;
