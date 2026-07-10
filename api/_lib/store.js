import { emptyVoteMap } from './charangas.js';

const VOTES_KEY = 'charangas:votes:v2';
const AUDIT_KEY = 'charangas:audit:v2';
const DEVICES_KEY = 'charangas:devices:v2';
const DEVICE_KEY_PREFIX = 'charangas:device:v2:';
const MAX_AUDIT_ENTRIES = 500;

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const hasRedis = Boolean(redisUrl && redisToken);

const getMemoryStore = () => {
  globalThis.__charangasMemoryStore ||= {
    votes: emptyVoteMap(),
    auditEntries: [],
    deviceVotes: new Map()
  };

  return globalThis.__charangasMemoryStore;
};

const redisCommand = async (...command) => {
  const response = await fetch(redisUrl, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${redisToken}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(command)
  });

  if (!response.ok) {
    throw new Error(`Redis command failed: ${response.status}`);
  }

  const data = await response.json();
  return data.result;
};

const parseJson = (value, fallback = null) => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const hashArrayToObject = (hash) => {
  if (!Array.isArray(hash)) {
    return hash || {};
  }

  const object = {};
  for (let index = 0; index < hash.length; index += 2) {
    object[hash[index]] = Number(hash[index + 1]) || 0;
  }

  return object;
};

export const getStorageMode = () => (hasRedis ? 'upstash-redis' : 'memory');

export const getVotes = async () => {
  if (!hasRedis) {
    return {
      ...emptyVoteMap(),
      ...getMemoryStore().votes
    };
  }

  return {
    ...emptyVoteMap(),
    ...hashArrayToObject(await redisCommand('HGETALL', VOTES_KEY))
  };
};

export const incrementVote = async (charangaId) => {
  if (!hasRedis) {
    const store = getMemoryStore();
    store.votes[charangaId] = (store.votes[charangaId] || 0) + 1;
    return store.votes[charangaId];
  }

  return redisCommand('HINCRBY', VOTES_KEY, charangaId, 1);
};

export const reserveDeviceVote = async (deviceHash, voteRecord) => {
  const key = `${DEVICE_KEY_PREFIX}${deviceHash}`;
  const value = JSON.stringify(voteRecord);

  if (!hasRedis) {
    const store = getMemoryStore();
    if (store.deviceVotes.has(deviceHash)) {
      return false;
    }

    store.deviceVotes.set(deviceHash, voteRecord);
    return true;
  }

  const result = await redisCommand('SET', key, value, 'NX');
  if (result === 'OK') {
    await redisCommand('SADD', DEVICES_KEY, deviceHash);
    return true;
  }

  return false;
};

export const getDeviceVote = async (deviceHash) => {
  if (!hasRedis) {
    return getMemoryStore().deviceVotes.get(deviceHash) || null;
  }

  return parseJson(await redisCommand('GET', `${DEVICE_KEY_PREFIX}${deviceHash}`));
};

export const addAuditEntry = async (entry) => {
  if (!hasRedis) {
    const store = getMemoryStore();
    store.auditEntries = [entry, ...store.auditEntries].slice(0, MAX_AUDIT_ENTRIES);
    return;
  }

  await redisCommand('LPUSH', AUDIT_KEY, JSON.stringify(entry));
  await redisCommand('LTRIM', AUDIT_KEY, 0, MAX_AUDIT_ENTRIES - 1);
};

export const getAuditEntries = async () => {
  if (!hasRedis) {
    return getMemoryStore().auditEntries;
  }

  const entries = await redisCommand('LRANGE', AUDIT_KEY, 0, MAX_AUDIT_ENTRIES - 1);
  return Array.isArray(entries) ? entries.map((entry) => parseJson(entry)).filter(Boolean) : [];
};

export const resetStore = async () => {
  if (!hasRedis) {
    globalThis.__charangasMemoryStore = {
      votes: emptyVoteMap(),
      auditEntries: [],
      deviceVotes: new Map()
    };
    return;
  }

  const deviceHashes = await redisCommand('SMEMBERS', DEVICES_KEY);
  const deviceKeys = Array.isArray(deviceHashes)
    ? deviceHashes.map((deviceHash) => `${DEVICE_KEY_PREFIX}${deviceHash}`)
    : [];

  await redisCommand('DEL', VOTES_KEY, AUDIT_KEY, DEVICES_KEY, ...deviceKeys);
};
