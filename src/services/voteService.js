import { charangas } from '../data/charangas.js';

const VOTES_STORAGE_KEY = 'charangas:votes:v1';
const DEVICE_VOTE_KEY = 'charangas:deviceVote:v1';
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

const getAuditSnapshot = (charangaId) => {
  /*
    Browser-only mock audit data.
    Public IP is not available reliably from the client. In production, record it
    in your backend/API request handler and store it with the vote server-side.
  */
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    charangaId,
    votedAt: new Date().toISOString(),
    ip: 'Pendiente de backend',
    userAgent: window.navigator.userAgent,
    language: window.navigator.language,
    platform: window.navigator.platform,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    referrer: document.referrer || 'Directo / QR',
    testMode: TEST_MODE
  };
};

const addAuditEntry = (entry) => {
  const entries = readJson(AUDIT_STORAGE_KEY, []);
  writeJson(AUDIT_STORAGE_KEY, [entry, ...entries]);
};

export const voteService = {
  /*
    Data access layer prepared for a real backend.
    Replace the localStorage reads/writes below with Supabase/Firebase calls:
    - vote(charangaId): insert one vote after validating server-side rules
    - getResults(): fetch aggregated results
    - resetVotes(): protected admin action
    Keep the component API stable so pages do not need to change.
  */
  isTestMode() {
    return TEST_MODE;
  },

  hasDeviceVoted() {
    if (TEST_MODE) {
      return false;
    }

    return Boolean(readJson(DEVICE_VOTE_KEY, null));
  },

  getDeviceVote() {
    if (TEST_MODE) {
      return null;
    }

    return readJson(DEVICE_VOTE_KEY, null);
  },

  vote(charangaId) {
    if (!TEST_MODE && this.hasDeviceVoted()) {
      return {
        ok: false,
        reason: 'already-voted',
        results: this.getResults()
      };
    }

    const validCharanga = charangas.some((charanga) => charanga.id === charangaId);
    if (!validCharanga) {
      return {
        ok: false,
        reason: 'invalid-charanga',
        results: this.getResults()
      };
    }

    const votes = normalizeVoteMap(readJson(VOTES_STORAGE_KEY, emptyVoteMap()));
    votes[charangaId] += 1;
    writeJson(VOTES_STORAGE_KEY, votes);
    addAuditEntry(getAuditSnapshot(charangaId));

    if (!TEST_MODE) {
      writeJson(DEVICE_VOTE_KEY, {
        charangaId,
        votedAt: new Date().toISOString()
      });
    }

    return {
      ok: true,
      results: buildResults(votes)
    };
  },

  getResults() {
    return buildResults(readJson(VOTES_STORAGE_KEY, emptyVoteMap()));
  },

  getAuditEntries() {
    return readJson(AUDIT_STORAGE_KEY, []);
  },

  resetVotes() {
    writeJson(VOTES_STORAGE_KEY, emptyVoteMap());
    writeJson(AUDIT_STORAGE_KEY, []);
    window.localStorage.removeItem(DEVICE_VOTE_KEY);
    return this.getResults();
  }
};
