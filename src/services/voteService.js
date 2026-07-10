import { charangas } from '../data/charangas.js';

const VOTES_STORAGE_KEY = 'charangas:votes:v1';
const DEVICE_VOTE_KEY = 'charangas:deviceVote:v1';
const DEVICE_ID_KEY = 'charangas:deviceId:v1';
const AUDIT_STORAGE_KEY = 'charangas:audit:v1';
const TEST_MODE = import.meta.env.VITE_TEST_MODE === 'true';

const emptyVoteMap = () =>
  charangas.reduce((votes, charanga) => {
    votes[charanga.id] = 0;
    return votes;
  }, {});

const readJson = (key, fallback) => {
  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

const normalizeVoteMap = (storedVotes) => ({
  ...emptyVoteMap(),
  ...(storedVotes || {})
});

const buildResults = (votes) => {
  const normalizedVotes = normalizeVoteMap(votes);
  const totalVotes = Object.values(normalizedVotes).reduce((sum, count) => sum + count, 0);
  const ranking = charangas
    .map((charanga) => {
      const voteCount = normalizedVotes[charanga.id] || 0;
      return {
        ...charanga,
        votes: voteCount,
        percentage: totalVotes > 0 ? Math.round((voteCount / totalVotes) * 1000) / 10 : 0
      };
    })
    .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));

  return {
    totalVotes,
    votes: normalizedVotes,
    ranking,
    provisionalWinner: totalVotes > 0 ? ranking[0] : null
  };
};

const getAuditSnapshot = (charangaId, locationAccess) => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  charangaId,
  votedAt: new Date().toISOString(),
  ip: 'Modo test local',
  userAgent: window.navigator.userAgent,
  language: window.navigator.language,
  platform: window.navigator.platform,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  screen: `${window.screen.width}x${window.screen.height}`,
  viewport: `${window.innerWidth}x${window.innerHeight}`,
  referrer: document.referrer || 'Directo / QR',
  locationAllowed: Boolean(locationAccess?.allowed),
  locationReason: locationAccess?.reason || 'test-mode',
  location: locationAccess?.location || null,
  testMode: TEST_MODE
});

const addAuditEntry = (entry) => {
  const entries = readJson(AUDIT_STORAGE_KEY, []);
  writeJson(AUDIT_STORAGE_KEY, [entry, ...entries]);
};

const getInitialResults = () => buildResults(emptyVoteMap());

const getDeviceId = () => {
  const storedDeviceId = window.localStorage.getItem(DEVICE_ID_KEY);
  if (storedDeviceId) {
    return storedDeviceId;
  }

  const nextDeviceId =
    window.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(DEVICE_ID_KEY, nextDeviceId);
  return nextDeviceId;
};

const getClientContext = () => ({
  userAgent: window.navigator.userAgent,
  language: window.navigator.language,
  platform: window.navigator.platform,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  screen: `${window.screen.width}x${window.screen.height}`,
  viewport: `${window.innerWidth}x${window.innerHeight}`,
  referrer: document.referrer || 'Directo / QR'
});

const apiRequest = async (path, options = {}) => {
  const response = await fetch(path, {
    ...options,
    headers: {
      accept: 'application/json',
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok && payload.reason) {
    return payload;
  }

  return payload;
};

const requestBrowserLocation = () =>
  new Promise((resolve) => {
    if (!window.navigator.geolocation) {
      resolve({
        ok: false,
        reason: 'location-unsupported'
      });
      return;
    }

    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          ok: true,
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            capturedAt: new Date().toISOString()
          }
        });
      },
      (error) => {
        const reason =
          error.code === error.PERMISSION_DENIED
            ? 'location-permission-denied'
            : error.code === error.TIMEOUT
              ? 'location-timeout'
              : 'location-unavailable';

        resolve({
          ok: false,
          reason
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000
      }
    );
  });

const localVote = (charangaId, locationAccess) => {
  const validCharanga = charangas.some((charanga) => charanga.id === charangaId);
  if (!validCharanga) {
    return {
      ok: false,
      reason: 'invalid-charanga',
      results: buildResults(readJson(VOTES_STORAGE_KEY, emptyVoteMap()))
    };
  }

  const votes = normalizeVoteMap(readJson(VOTES_STORAGE_KEY, emptyVoteMap()));
  votes[charangaId] += 1;
  writeJson(VOTES_STORAGE_KEY, votes);
  addAuditEntry(getAuditSnapshot(charangaId, locationAccess));

  return {
    ok: true,
    results: buildResults(votes)
  };
};

export const voteService = {
  isTestMode() {
    return TEST_MODE;
  },

  getInitialResults,

  async getVotingAccess() {
    if (TEST_MODE) {
      return {
        allowed: true,
        reason: 'test-mode',
        allowedArea: {
          city: 'Quintanar del Rey',
          postalCode: '16220',
          country: 'ES'
        },
        location: null
      };
    }

    const browserLocation = await requestBrowserLocation();
    if (!browserLocation.ok) {
      return {
        allowed: false,
        reason: browserLocation.reason,
        location: null
      };
    }

    try {
      return apiRequest('/api/location-check', {
        method: 'POST',
        body: JSON.stringify({
          location: browserLocation.location
        })
      });
    } catch {
      return {
        allowed: false,
        reason: 'location-check-failed',
        location: browserLocation.location
      };
    }
  },

  async getDeviceVote() {
    if (TEST_MODE) {
      return null;
    }

    try {
      const response = await apiRequest(`/api/my-vote?deviceId=${encodeURIComponent(getDeviceId())}`);
      return response.deviceVote || readJson(DEVICE_VOTE_KEY, null);
    } catch {
      return readJson(DEVICE_VOTE_KEY, null);
    }
  },

  async vote(charangaId, locationAccess) {
    if (TEST_MODE) {
      return localVote(charangaId, locationAccess);
    }

    if (!locationAccess?.allowed || !locationAccess?.location) {
      return {
        ok: false,
        reason: 'outside-allowed-area',
        results: await this.getResults()
      };
    }

    try {
      const response = await apiRequest('/api/vote', {
        method: 'POST',
        body: JSON.stringify({
          charangaId,
          deviceId: getDeviceId(),
          location: locationAccess.location,
          clientContext: getClientContext()
        })
      });

      if (response.ok && response.deviceVote) {
        writeJson(DEVICE_VOTE_KEY, response.deviceVote);
      }

      if (response.reason === 'already-voted' && response.deviceVote) {
        writeJson(DEVICE_VOTE_KEY, response.deviceVote);
      }

      return response;
    } catch {
      return {
        ok: false,
        reason: 'vote-service-unavailable',
        results: await this.getResults()
      };
    }
  },

  async getResults() {
    if (TEST_MODE) {
      return buildResults(readJson(VOTES_STORAGE_KEY, emptyVoteMap()));
    }

    try {
      const response = await apiRequest('/api/results');
      return response.results || getInitialResults();
    } catch {
      return getInitialResults();
    }
  },

  async getAuditEntries(adminPassword) {
    if (TEST_MODE) {
      return readJson(AUDIT_STORAGE_KEY, []);
    }

    try {
      const response = await apiRequest('/api/audit', {
        headers: {
          'x-admin-password': adminPassword || ''
        }
      });
      return response.auditEntries || [];
    } catch {
      return [];
    }
  },

  async verifyAdminPassword(adminPassword) {
    if (TEST_MODE) {
      return true;
    }

    try {
      const response = await apiRequest('/api/audit', {
        headers: {
          'x-admin-password': adminPassword || ''
        }
      });

      return Boolean(response.ok);
    } catch {
      return false;
    }
  },

  async resetVotes(adminPassword) {
    if (TEST_MODE) {
      writeJson(VOTES_STORAGE_KEY, emptyVoteMap());
      writeJson(AUDIT_STORAGE_KEY, []);
      window.localStorage.removeItem(DEVICE_VOTE_KEY);
      return this.getResults();
    }

    const response = await apiRequest('/api/reset', {
      method: 'POST',
      headers: {
        'x-admin-password': adminPassword || ''
      }
    });

    window.localStorage.removeItem(DEVICE_VOTE_KEY);
    return response.results || getInitialResults();
  }
};
