import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import * as ctrl        from '../controllers/inventory.controller.js';

const router = Router();
router.use(rateLimit({ windowMs: 60_000, max: 60 }));
router.use(authenticate);

router.get('/',              ctrl.list);
router.post('/equip',        ctrl.equip);

export default router;
