import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import * as ctrl        from '../controllers/metaverse.controller.js';

const router = Router();
router.use(rateLimit({ windowMs: 60_000, max: 60 }));
router.use(authenticate);

router.get('/rooms',          ctrl.listRooms);
router.post('/rooms',         ctrl.createRoom);
router.get('/rooms/:id',      ctrl.getRoom);
router.get('/rooms/:id/agents', ctrl.getRoomAgents);

export default router;
