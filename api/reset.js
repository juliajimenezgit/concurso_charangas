import { requireAdmin, sendJson } from './_lib/http.js';
import { buildResults } from './_lib/results.js';
import { getVotes, resetStore } from './_lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { ok: false, reason: 'method-not-allowed' });
    return;
  }

  if (!requireAdmin(req, res)) {
    return;
  }

  await resetStore();
  sendJson(res, 200, {
    ok: true,
    results: buildResults(await getVotes())
  });
}
