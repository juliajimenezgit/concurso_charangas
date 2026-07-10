import { allowedArea, validateLocation } from './_lib/geo.js';
import { readJsonBody, sendJson } from './_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { allowed: false, reason: 'method-not-allowed', allowedArea });
    return;
  }

  const body = await readJsonBody(req);
  const validation = validateLocation(body.location);

  sendJson(res, 200, {
    ...validation,
    allowedArea
  });
}
