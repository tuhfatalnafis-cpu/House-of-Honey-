import { initPayment } from '../lib/techarmClient.js';

/**
 * POST /api/payment/init — shared by the local Express server (server/index.js) and the
 * Vercel serverless function (api/payment/init.js). Vercel's Node.js runtime provides the
 * same req.body / res.status().json() surface as Express, so this handler works unmodified
 * in both environments.
 */
export default async function paymentInitHandler(req, res) {
  const { refId, amount, fullName, mobile, email, description } = req.body || {};
  if (!refId || !amount || !fullName || !mobile || !email) {
    return res.status(400).json({ success: false, error: 'Missing required payment fields.' });
  }

  try {
    const result = await initPayment({
      refId,
      amount,
      channel: 'FPX',
      fullName,
      mobile,
      email,
      description,
      callbackUrl: process.env.TECHARM_CALLBACK_URL,
    });

    if (result.statusCode !== 200 || !result.data?.url) {
      return res.status(502).json({ success: false, error: result.statusMessage || 'Gateway init failed.' });
    }

    return res.json({
      success: true,
      redirectUrl: result.data.url,
      refId: result.data.ref_id,
      billId: result.data.bill_id,
    });
  } catch (err) {
    console.error('[payment/init]', err);
    return res.status(502).json({ success: false, error: 'Unable to reach payment gateway.' });
  }
}
