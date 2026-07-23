const FAILURE_STATUSES = new Set(['failed', 'fail', 'declined', 'decline', 'cancelled', 'canceled', 'cancel', 'expired', 'rejected', 'reject']);

/**
 * Maps Techarm's transaction status strings to this app's Order.paymentStatus values.
 *
 * Verified against the real UAT gateway: an untouched/incomplete bill's Check Payment
 * Status response comes back with `status: null` (not the literal string "pending") —
 * so anything that isn't explicitly "success" or a recognized failure keyword is treated
 * as still Pending, rather than defaulting to Failed. This avoids prematurely marking an
 * order Failed just because the payer hasn't finished the FPX flow yet.
 */
export function mapTecharmStatus(techarmStatus) {
  const normalized = String(techarmStatus || '').toLowerCase().trim();
  if (normalized === 'success') return 'Paid';
  if (FAILURE_STATUSES.has(normalized)) return 'Failed';
  return 'Pending';
}
