/**
 * Thin client for the Fintrixpay (Techarm Resources) Payment Gateway API v3.
 * Holds and uses TECHARM_CLIENT_SECRET — must only ever run server-side.
 */

const BASE_URL = process.env.TECHARM_BASE_URL || 'https://dev.fintrixpay.com';
const CLIENT_ID = process.env.TECHARM_CLIENT_ID;
const CLIENT_SECRET = process.env.TECHARM_CLIENT_SECRET;

let cachedToken = null; // { token, merchant, expiresAt }

async function fetchToken() {
  const res = await fetch(`${BASE_URL}/api/v1.0/authenticated/payment/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET }),
  });
  if (!res.ok) {
    throw new Error(`Techarm auth failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  cachedToken = {
    token: json.token,
    merchant: json.merchant,
    // expires_In is in milliseconds; refresh 30s early to avoid edge-of-expiry races
    expiresAt: Date.now() + json.expires_In - 30_000,
  };
  return cachedToken.token;
}

async function getValidToken() {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }
  return fetchToken();
}

async function authedRequest(path, body, { retryOn401 = true } = {}) {
  const token = await getValidToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401 && retryOn401) {
    cachedToken = null;
    return authedRequest(path, body, { retryOn401: false });
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Techarm request to ${path} failed: ${res.status} ${JSON.stringify(json)}`);
  }
  return json;
}

/**
 * @param {{refId: string, amount: string, channel: string, fullName: string, mobile: string, email: string, description?: string, callbackUrl: string}} params
 */
async function initPayment(params) {
  return authedRequest('/api/v1.0/authenticated/payment/init', {
    client_id: CLIENT_ID,
    callback_url: params.callbackUrl,
    ref_id: params.refId,
    amount: params.amount,
    channel: params.channel,
    type: 'standard',
    full_name: params.fullName,
    mobile: params.mobile,
    email: params.email,
    description: params.description || '',
    ref_1_label: null,
    ref_1: null,
    ref_2_label: 'Service Charge',
    ref_2: 'false',
    ref_3_label: null,
    ref_3: null,
  });
}

/**
 * @param {{refId: string, billId: string}} params
 */
async function checkStatus(params) {
  return authedRequest('/api/v1.0/authenticated/payment/status', {
    ref_id: params.refId,
    bill_id: params.billId,
  });
}

export { getValidToken, initPayment, checkStatus };
