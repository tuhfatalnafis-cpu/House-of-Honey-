import { decryptCallbackPayload } from '../lib/aesCallback.js';
import { checkStatus } from '../lib/techarmClient.js';
import { mapTecharmStatus } from '../lib/statusMap.js';
import { finalizeOrderInSupabase } from '../lib/supabaseServer.js';

/**
 * GET /checkout/callback (local dev, via server/index.js) or /api/checkout/callback (Vercel,
 * via api/checkout/callback.js — the URL registered as TECHARM_CALLBACK_URL differs per
 * environment, see .env.example). Shared by both.
 */
export default async function checkoutCallbackHandler(req, res) {
  const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
  const payload = req.query.payload;
  if (!payload) {
    return res.redirect(302, `${FRONTEND_ORIGIN}/?checkout_result=failed`);
  }

  let refId;
  let billId;
  try {
    const clientKey = process.env.TECHARM_CLIENT_KEY;
    const decrypted = decryptCallbackPayload(String(payload), clientKey);
    refId = decrypted.refId;
    billId = decrypted.billId;
  } catch (err) {
    console.error('[checkout/callback] decrypt failed', err);
    return res.redirect(302, `${FRONTEND_ORIGIN}/?checkout_result=failed`);
  }

  // Never trust the decrypted payload's status alone — corroborate server-to-server.
  // A failed/unreachable status check means "unknown", not "Failed" — we must not
  // mark a possibly-successful payment as failed just because of a network hiccup.
  let finalStatus = null;
  try {
    const statusResult = await checkStatus({ refId, billId });
    finalStatus = mapTecharmStatus(statusResult.data?.status);
  } catch (err) {
    console.error('[checkout/callback] status re-check failed', err);
  }

  // Only write a resolved outcome. If still Pending/unknown, leave the order as-is —
  // the frontend's own re-verify (POST /api/payment/status) or a later callback retry
  // will resolve it; nothing to overwrite yet.
  if (finalStatus === 'Paid' || finalStatus === 'Failed') {
    await finalizeOrderInSupabase({ refId, paymentStatus: finalStatus, gatewayBillId: billId });
  }

  const resultParam = finalStatus === 'Paid' ? 'success' : finalStatus === 'Failed' ? 'failed' : 'pending';
  const redirectUrl = `${FRONTEND_ORIGIN}/?checkout_result=${resultParam}&ref_id=${encodeURIComponent(refId || '')}&bill_id=${encodeURIComponent(billId || '')}`;
  return res.redirect(302, redirectUrl);
}
