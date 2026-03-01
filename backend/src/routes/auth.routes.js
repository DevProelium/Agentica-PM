import { Router } from 'express';
import { z } from 'zod';
import { validate }    from '../middleware/validate.js';
import { rateLimit }   from '../middleware/rate-limit.js';
import * as ctrl       from '../controllers/auth.controller.js';

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email:    z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

const authLimit = rateLimit({ windowMs: 15 * 60_000, max: 10 });

router.post('/register', authLimit, validate({ body: registerSchema }), ctrl.register);
router.post('/login',    authLimit, validate({ body: loginSchema }),    ctrl.login);
router.post('/refresh',  rateLimit({ windowMs: 15 * 60_000, max: 30 }), validate({ body: refreshSchema }), ctrl.refresh);
router.post('/logout',   authLimit, ctrl.logout);

export default router;
