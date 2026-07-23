import { Router } from 'express';
import checkoutCallbackHandler from '../handlers/checkoutCallback.js';

const router = Router();

router.get('/checkout/callback', checkoutCallbackHandler);

export default router;
