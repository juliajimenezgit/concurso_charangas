import { buildResults } from './_lib/results.js';
import { getVotes, getStorageMode } from './_lib/store.js';
import { sendJson } from './_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendJson(res, 405, { ok: false, reason: 'method-not-allowed' });
    return;
  }

  const results = buildResults(await getVotes());
  sendJson(res, 200, {
    ok: true,
    storage: getStorageMode(),
    results
  });
}
