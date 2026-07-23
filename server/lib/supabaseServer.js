import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = !!(supabaseUrl && supabaseAnonKey);
const supabase = isConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

/**
 * Best-effort fallback write so an order doesn't get stuck "Pending" forever if the
 * payer's browser never makes it back to the SPA to run the client-side finalize path.
 * Only updates the payment-related columns — stock decrement and affiliate commission
 * allocation live in AppContext.finalizeOrderPaymentResult() (browser-side business logic,
 * not duplicated here). If this fallback is the only thing that ever resolves an order,
 * it correctly stops the order looking stuck Pending, but stock/commission for that one
 * order will need a manual admin reconciliation pass — same manual-reconciliation pattern
 * this app already relies on for its advanced inventory ledger vs Product.stock.
 */
export async function finalizeOrderInSupabase({ refId, paymentStatus, gatewayBillId }) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        gateway_bill_id: gatewayBillId || null,
        payment_confirmed_at: new Date().toISOString(),
      })
      .eq('id', refId)
      .eq('payment_status', 'Pending'); // don't clobber an already-finalized order
    return !error;
  } catch {
    return false;
  }
}

export const isSupabaseServerConfigured = isConfigured;
