import { Router } from 'express';
import multer       from 'multer';
import { authenticate } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rate-limit.js';
import * as ctrl        from '../controllers/assets.controller.js';

const router = Router();
router.use(rateLimit({ windowMs: 60_000, max: 60 }));
router.use(authenticate);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/upload',    upload.single('file'), ctrl.upload);
router.get('/signed-url', ctrl.signedUrl);
router.delete('/:key',    ctrl.deleteAsset);

export default router;
