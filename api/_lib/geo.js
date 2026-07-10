const DEFAULT_ALLOWED_LAT = 39.345652;
const DEFAULT_ALLOWED_LON = -1.928126;
const DEFAULT_ALLOWED_RADIUS_METERS = 6000;
const DEFAULT_MAX_ACCURACY_METERS = 3000;

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const roundCoordinate = (value) => Math.round(value * 100000) / 100000;

const getEnvNumber = (name, fallback) => {
  const value = toNumber(process.env[name]);
  return value === null ? fallback : value;
};

export const allowedArea = {
  city: process.env.VOTE_ALLOWED_CITY || 'Quintanar del Rey',
  postalCode: process.env.VOTE_ALLOWED_POSTAL_CODE || '16220',
  country: process.env.VOTE_ALLOWED_COUNTRY || 'ES',
  latitude: getEnvNumber('VOTE_ALLOWED_LAT', DEFAULT_ALLOWED_LAT),
  longitude: getEnvNumber('VOTE_ALLOWED_LON', DEFAULT_ALLOWED_LON),
  radiusMeters: getEnvNumber('VOTE_ALLOWED_RADIUS_METERS', DEFAULT_ALLOWED_RADIUS_METERS),
  maxAccuracyMeters: getEnvNumber('VOTE_MAX_ACCURACY_METERS', DEFAULT_MAX_ACCURACY_METERS)
};

export const getDistanceMeters = (from, to) => {
  const earthRadiusMeters = 6371000;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const validateLocation = (clientLocation) => {
  const latitude = toNumber(clientLocation?.latitude);
  const longitude = toNumber(clientLocation?.longitude);
  const accuracy = toNumber(clientLocation?.accuracy);

  if (
    latitude === null ||
    longitude === null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return {
      allowed: false,
      reason: 'location-required',
      location: null
    };
  }

  const distanceMeters = Math.round(
    getDistanceMeters(
      { latitude, longitude },
      { latitude: allowedArea.latitude, longitude: allowedArea.longitude }
    )
  );
  const roundedAccuracy = accuracy === null ? null : Math.round(accuracy);
  const insideRadius = distanceMeters <= allowedArea.radiusMeters;
  const accurateEnough =
    roundedAccuracy === null || roundedAccuracy <= allowedArea.maxAccuracyMeters;

  return {
    allowed: insideRadius && accurateEnough,
    reason: !insideRadius
      ? 'outside-allowed-area'
      : accurateEnough
        ? 'inside-allowed-area'
        : 'location-accuracy-too-low',
    location: {
      latitude: roundCoordinate(latitude),
      longitude: roundCoordinate(longitude),
      accuracy: roundedAccuracy,
      distanceMeters,
      capturedAt: clientLocation?.capturedAt || new Date().toISOString()
    }
  };
};
