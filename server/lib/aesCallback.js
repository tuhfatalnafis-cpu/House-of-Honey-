import { createDecipheriv } from 'node:crypto';

// Techarm's IV is the literal 16-character ASCII string "0000000000000000", not raw zero bytes
// (confirmed by both the PHP and Java samples in their API spec, which pass this literal string).
const IV = Buffer.from('0000000000000000', 'utf8');

function algoForKeyLength(len) {
  if (len === 16) return 'aes-128-cbc';
  if (len === 24) return 'aes-192-cbc';
  if (len === 32) return 'aes-256-cbc';
  throw new Error(`Unsupported Techarm client_key length: ${len} bytes (expected 16/24/32).`);
}

/**
 * Decrypts a Fintrixpay callback `payload` query param.
 * Plaintext shape (per the API spec): "ref_id$bill_id$amount$status".
 *
 * Key handling: Techarm's own PHP (`mcrypt_encrypt(MCRYPT_RIJNDAEL_128, $client_key, ...)`)
 * and Java (`new SecretKeySpec(clientKey.getBytes("UTF-8"), "AES")`) samples both use the raw
 * UTF-8 bytes of the client_key string directly as the AES key — they do NOT base64-decode it
 * first, despite the string looking base64-encoded. Our real client_key is 24 ASCII characters,
 * which as raw bytes makes this AES-192-CBC. Note this could NOT be byte-verified against the
 * PDF's own worked example (its documented ciphertext output doesn't reproduce under any
 * key/IV interpretation tried, most likely a transcription artifact from PDF text extraction) —
 * but this exact implementation (key bytes + AES-192-CBC + literal-zero-string IV + the
 * space-for-plus query fix below) WAS verified end-to-end against a real callback captured
 * from a live UAT transaction and correctly decrypted to "ref_id$bill_id$amount$status".
 *
 * @param {string} payloadRaw - the raw `payload` query string value (as received by Express)
 * @param {string} clientKeyString - the merchant's client_key string, used as raw key bytes
 * @returns {{refId: string, billId: string, amount: string, status: string}}
 */
export function decryptCallbackPayload(payloadRaw, clientKeyString) {
  const key = Buffer.from(clientKeyString, 'utf8');
  const algo = algoForKeyLength(key.length);

  // Standard query-string parsing (Express's default `qs` parser, and URLSearchParams) treats
  // '+' as an encoded space per application/x-www-form-urlencoded rules. Base64 payloads often
  // contain literal '+' characters, so undo that conversion before decoding.
  const normalized = String(payloadRaw).replace(/ /g, '+');
  const encrypted = Buffer.from(normalized, 'base64');

  const decipher = createDecipheriv(algo, key, IV);
  const plain = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');

  const [refId, billId, amount, status] = plain.split('$');
  return { refId, billId, amount, status };
}
