import { Router } from 'express';
import { z } from 'zod';
import { authenticate }  from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { validate }      from '../middleware/validate.js';
import * as ctrl         from '../controllers/agents.controller.js';

const router = Router();
router.use(rateLimit({ windowMs: 60_000, max: 60 }));
router.use(authenticate);

const createSchema = z.object({
  name:          z.string().min(1).max(50),
  personality:   z.string().optional(),
  modelProvider: z.enum(['openai','anthropic','ollama','lmstudio']).optional(),
  modelName:     z.string().optional(),
  apiKey:        z.string().optional(),
  systemPrompt:  z.string().optional(),
});

const updateSchema = createSchema.partial();

router.get('/',        ctrl.list);
router.post('/',       validate({ body: createSchema }), ctrl.create);
router.get('/:id',     ctrl.getOne);
router.put('/:id',     validate({ body: updateSchema }), ctrl.update);
router.delete('/:id',  ctrl.remove);

export default router;
