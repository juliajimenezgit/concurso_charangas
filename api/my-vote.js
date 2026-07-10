import { getQueryParam, sendJson } from './_lib/http.js';
import { hashValue } from './_lib/security.js';
import { getDeviceVote } from './_lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendJson(res, 405, { ok: false, reason: 'method-not-allowed' });
    return;
  }

  const deviceId = getQueryParam(req, 'deviceId');
  if (!deviceId) {
    sendJson(res, 400, { ok: false, reason: 'device-required', deviceVote: null });
    return;
  }

  const deviceVote = await getDeviceVote(hashValue(deviceId));
  sendJson(res, 200, {
    ok: true,
    deviceVote
  });
}
