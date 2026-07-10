import crypto from 'node:crypto';

const hashSalt = process.env.VOTE_HASH_SALT || process.env.VOTE_ADMIN_PASSWORD || 'charangas';

export const createId = () => crypto.randomUUID();

export const hashValue = (value) =>
  crypto.createHash('sha256').update(`${hashSalt}:${value || ''}`).digest('hex');
