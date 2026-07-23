import { checkStatus } from '../lib/techarmClient.js';
import { mapTecharmStatus } from '../lib/statusMap.js';

/** POST /api/payment/status — shared by the Express server and the Vercel function. */
export default async function paymentStatusHandler(req, res) {
  const { refId, billId } = req.body || {};
  if (!refId || !billId) {
    return res.status(400).json({ success: false, error: 'refId and billId are required.' });
  }

  try {
    const result = await checkStatus({ refId, billId });
    if (result.statusCode !== 200) {
      return res.status(502).json({ success: false, error: result.statusMessage || 'Status check failed.' });
    }
    return res.json({
      success: true,
      status: mapTecharmStatus(result.data?.status),
      raw: result.data,
    });
  } catch (err) {
    console.error('[payment/status]', err);
    return res.status(502).json({ success: false, error: 'Unable to reach payment gateway.' });
  }
}
