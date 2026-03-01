import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import * as ctrl        from '../controllers/environment.controller.js';

const router = Router();
router.use(rateLimit({ windowMs: 60_000, max: 60 }));
router.use(authenticate);

router.get('/:agentId',    ctrl.getEnvironment);
router.put('/:agentId',    ctrl.updateEnvironment);
router.post('/:agentId/furniture', ctrl.addFurniture);
router.delete('/:agentId/furniture/:furnitureId', ctrl.removeFurniture);

export default router;
