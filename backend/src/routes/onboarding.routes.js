import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = Router();
router.use(authenticate);

router.get('/status', async (req, res, next) => {
  const { rows } = await query(
    `SELECT onboarding_completed, onboarding_step FROM users WHERE id=$1`,
    [req.user.id]
  );
  res.json({
    completed: !!rows[0]?.onboarding_completed,
    step: rows[0]?.onboarding_step || 0
  });
});

router.post('/complete', async (req, res, next) => {
  await query(
    `UPDATE users SET onboarding_completed=TRUE, onboarding_step=5 WHERE id=$1`,
    [req.user.id]
  );
  res.json({ completed: true });
});

export default router;
