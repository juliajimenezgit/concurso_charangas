import { isValidCharangaId } from './_lib/charangas.js';
import { allowedArea, validateLocation } from './_lib/geo.js';
import { getRequestMeta, readJsonBody, sendJson } from './_lib/http.js';
import { buildResults } from './_lib/results.js';
import { createId, hashValue } from './_lib/security.js';
import {
  addAuditEntry,
  getDeviceVote,
  getStorageMode,
  getVotes,
  incrementVote,
  reserveDeviceVote
} from './_lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { ok: false, reason: 'method-not-allowed' });
    return;
  }

  const body = await readJsonBody(req);
  const charangaId = body.charangaId;
  const deviceId = String(body.deviceId || '');

  if (!isValidCharangaId(charangaId)) {
    sendJson(res, 400, {
      ok: false,
      reason: 'invalid-charanga',
      results: buildResults(await getVotes())
    });
    return;
  }

  if (deviceId.length < 16) {
    sendJson(res, 400, {
      ok: false,
      reason: 'device-required',
      results: buildResults(await getVotes())
    });
    return;
  }

  const locationValidation = validateLocation(body.location);
  if (!locationValidation.allowed) {
    sendJson(res, 403, {
      ok: false,
      reason: locationValidation.reason,
      allowedArea,
      location: locationValidation.location,
      results: buildResults(await getVotes())
    });
    return;
  }

  const deviceHash = hashValue(deviceId);
  const existingVote = await getDeviceVote(deviceHash);
  if (existingVote) {
    sendJson(res, 409, {
      ok: false,
      reason: 'already-voted',
      deviceVote: existingVote,
      results: buildResults(await getVotes())
    });
    return;
  }

  const votedAt = new Date().toISOString();
  const voteRecord = {
    charangaId,
    votedAt
  };
  const reserved = await reserveDeviceVote(deviceHash, voteRecord);
  if (!reserved) {
    sendJson(res, 409, {
      ok: false,
      reason: 'already-voted',
      deviceVote: await getDeviceVote(deviceHash),
      results: buildResults(await getVotes())
    });
    return;
  }

  await incrementVote(charangaId);

  const requestMeta = getRequestMeta(req);
  await addAuditEntry({
    id: createId(),
    charangaId,
    votedAt,
    ip: requestMeta.ip || 'IP no disponible',
    userAgent: requestMeta.userAgent,
    referrer: body.clientContext?.referrer || 'Directo / QR',
    language: body.clientContext?.language || '',
    platform: body.clientContext?.platform || '',
    timezone: body.clientContext?.timezone || '',
    screen: body.clientContext?.screen || '',
    viewport: body.clientContext?.viewport || '',
    locationAllowed: true,
    locationReason: locationValidation.reason,
    location: locationValidation.location,
    networkLocation: {
      country: requestMeta.country,
      region: requestMeta.region,
      city: requestMeta.city
    },
    storage: getStorageMode()
  });

  sendJson(res, 200, {
    ok: true,
    deviceVote: voteRecord,
    results: buildResults(await getVotes())
  });
}
