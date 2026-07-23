import { Router } from 'express';
import paymentInitHandler from '../handlers/paymentInit.js';
import paymentStatusHandler from '../handlers/paymentStatus.js';

const router = Router();

router.post('/init', paymentInitHandler);
router.post('/status', paymentStatusHandler);

export default router;
