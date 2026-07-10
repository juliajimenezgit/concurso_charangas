import { requireAdmin, sendJson } from './_lib/http.js';
import { getAuditEntries, getStorageMode } from './_lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendJson(res, 405, { ok: false, reason: 'method-not-allowed' });
    return;
  }

  if (!requireAdmin(req, res)) {
    return;
  }

  sendJson(res, 200, {
    ok: true,
    storage: getStorageMode(),
    auditEntries: await getAuditEntries()
  });
}
