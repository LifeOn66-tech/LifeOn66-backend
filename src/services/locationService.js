const { find: findTimezone } = require('geo-tz');
const { DateTime, IANAZone } = require('luxon');
const tzLookup = require('tz-lookup');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const PHOTON_URL = 'https://photon.komoot.io/api/';
const OPEN_METEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const GEOCODE_USER_AGENT = process.env.GEOCODE_USER_AGENT || 'LifeOn66-Backend/1.0 (global-astrology)';
const GEOCODE_CACHE_TTL_MS = Number(process.env.GEOCODE_CACHE_TTL_MS || 6 * 60 * 60 * 1000);
const GEOCODE_CACHE_MAX = Number(process.env.GEOCODE_CACHE_MAX || 500);

const geocodeCache = new Map();

function parseCoord(value) {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeCountryCode(value) {
  if (value == null || value === '') return null;
  const code = String(value).trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

function isValidLatLon(lat, lon) {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

function cacheKey(query, countryCode) {
  return `${countryCode || '*'}::${query.trim().toLowerCase()}`;
}

function readCache(key) {
  const entry = geocodeCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > GEOCODE_CACHE_TTL_MS) {
    geocodeCache.delete(key);
    return null;
  }
  return entry.value;
}

function writeCache(key, value) {
  if (geocodeCache.size >= GEOCODE_CACHE_MAX) {
    const oldestKey = geocodeCache.keys().next().value;
    geocodeCache.delete(oldestKey);
  }
  geocodeCache.set(key, { ts: Date.now(), value });
}

function buildGeocodeQuery(input = {}) {
  const place = input.place || input.placeOfBirth || input.birthPlace || null;
  if (place) {
    return {
      query: String(place).trim(),
      countryCode: normalizeCountryCode(input.countryCode || input.country_code || input.country),
    };
  }

  const city = input.city || input.town || input.locality || null;
  const state = input.state || input.region || input.province || null;
  const country = input.country || input.countryName || null;
  const countryCode = normalizeCountryCode(input.countryCode || input.country_code);

  const parts = [city, state, country].map((v) => (v ? String(v).trim() : '')).filter(Boolean);
  if (!parts.length) {
    return { query: null, countryCode };
  }

  return { query: parts.join(', '), countryCode };
}

function formatGeocodeResult(result) {
  return {
    lat: result.lat,
    lon: result.lon,
    displayName: result.displayName,
    city: result.city || null,
    state: result.state || null,
    country: result.country || null,
    countryCode: result.countryCode || null,
    source: result.source,
  };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

async function geocodeWithGoogle(query, countryCode) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', query);
  if (countryCode) url.searchParams.set('components', `country:${countryCode}`);
  url.searchParams.set('key', apiKey);

  const data = await fetchJson(url);
  const result = data.results?.[0];
  if (!result?.geometry?.location) return null;

  const components = Object.fromEntries(
    (result.address_components || []).flatMap((c) =>
      (c.types || []).map((type) => [type, c.long_name])
    )
  );
  const countryComp = (result.address_components || []).find((c) => c.types?.includes('country'));

  return formatGeocodeResult({
    lat: result.geometry.location.lat,
    lon: result.geometry.location.lng,
    displayName: result.formatted_address || query,
    city: components.locality || components.postal_town || components.administrative_area_level_2 || null,
    state: components.administrative_area_level_1 || null,
    country: components.country || null,
    countryCode: countryComp?.short_name?.toUpperCase() || countryCode || null,
    source: 'google',
  });
}

async function geocodeWithNominatim(query, countryCode) {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '1');
  if (countryCode) url.searchParams.set('countrycodes', countryCode.toLowerCase());

  const results = await fetchJson(url, {
    headers: {
      'User-Agent': GEOCODE_USER_AGENT,
      Accept: 'application/json',
    },
  });

  const hit = results?.[0];
  if (!hit) return null;

  const addr = hit.address || {};
  return formatGeocodeResult({
    lat: Number(hit.lat),
    lon: Number(hit.lon),
    displayName: hit.display_name || query,
    city: addr.city || addr.town || addr.village || addr.municipality || addr.county || null,
    state: addr.state || addr.region || null,
    country: addr.country || null,
    countryCode: normalizeCountryCode(addr.country_code) || countryCode || null,
    source: 'nominatim',
  });
}

async function geocodeWithPhoton(query, countryCode) {
  const url = new URL(PHOTON_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '1');
  url.searchParams.set('lang', 'en');

  const data = await fetchJson(url, { headers: { Accept: 'application/json' } });
  const feature = data.features?.[0];
  if (!feature?.geometry?.coordinates) return null;

  const props = feature.properties || {};
  const [lon, lat] = feature.geometry.coordinates;
  const resultCountryCode = normalizeCountryCode(props.countrycode) || countryCode || null;
  if (countryCode && resultCountryCode && resultCountryCode !== countryCode) return null;

  const labelParts = [props.name, props.state, props.country].filter(Boolean);
  return formatGeocodeResult({
    lat,
    lon,
    displayName: labelParts.join(', ') || query,
    city: props.name || props.city || null,
    state: props.state || null,
    country: props.country || null,
    countryCode: resultCountryCode,
    source: 'photon',
  });
}

async function geocodeWithOpenMeteo(query, countryCode) {
  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set('name', query);
  url.searchParams.set('count', '5');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');
  if (countryCode) url.searchParams.set('country', countryCode);

  const data = await fetchJson(url);
  const results = data.results || [];
  const hit = countryCode
    ? results.find((r) => normalizeCountryCode(r.country_code) === countryCode) || results[0]
    : results[0];
  if (!hit) return null;

  const labelParts = [hit.name, hit.admin1, hit.country].filter(Boolean);
  return formatGeocodeResult({
    lat: hit.latitude,
    lon: hit.longitude,
    displayName: labelParts.join(', ') || query,
    city: hit.name || null,
    state: hit.admin1 || null,
    country: hit.country || null,
    countryCode: normalizeCountryCode(hit.country_code) || countryCode || null,
    source: 'open-meteo',
  });
}

async function geocodePlace(input = {}) {
  const { query, countryCode } = buildGeocodeQuery(input);
  if (!query) {
    throw new Error('Birth place is required. Enter city and country (e.g. "Paris, France").');
  }

  const key = cacheKey(query, countryCode);
  const cached = readCache(key);
  if (cached) return { ...cached, source: `${cached.source}+cache` };

  const providers = [
    () => geocodeWithGoogle(query, countryCode),
    () => geocodeWithOpenMeteo(query, countryCode),
    () => geocodeWithNominatim(query, countryCode),
    () => geocodeWithPhoton(query, countryCode),
  ];

  let lastError = null;
  for (const provider of providers) {
    try {
      const result = await provider();
      if (result && isValidLatLon(result.lat, result.lon)) {
        writeCache(key, result);
        return result;
      }
    } catch (err) {
      lastError = err;
      console.warn('[Location] Geocoder failed:', err.message);
    }
  }

  const suffix = countryCode ? ` in country ${countryCode}` : '';
  throw new Error(
    lastError
      ? `Could not find "${query}"${suffix}. ${lastError.message}`
      : `Could not find coordinates for "${query}"${suffix}. Use "City, Country" format.`
  );
}

async function searchPlaces(input = {}) {
  const q = String(input.q || input.query || input.place || '').trim();
  if (q.length < 2) {
    throw new Error('Search query must be at least 2 characters.');
  }

  const countryCode = normalizeCountryCode(input.countryCode || input.country);
  const limit = Math.min(Math.max(Number(input.limit) || 8, 1), 20);
  const results = [];
  const seen = new Set();

  const addResult = (item) => {
    if (!item || !isValidLatLon(item.lat, item.lon)) return;
    const dedupeKey = `${item.lat.toFixed(4)}:${item.lon.toFixed(4)}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    results.push(item);
  };

  try {
    const url = new URL(OPEN_METEO_URL);
    url.searchParams.set('name', q);
    url.searchParams.set('count', String(limit));
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');
    if (countryCode) url.searchParams.set('country', countryCode);

    const data = await fetchJson(url);
    for (const hit of data.results || []) {
      const item = formatGeocodeResult({
        lat: hit.latitude,
        lon: hit.longitude,
        displayName: [hit.name, hit.admin1, hit.country].filter(Boolean).join(', '),
        city: hit.name,
        state: hit.admin1,
        country: hit.country,
        countryCode: normalizeCountryCode(hit.country_code),
        source: 'open-meteo',
      });
      if (!matchesCountryFilter(item, countryCode)) continue;
      addResult(item);
    }
  } catch (err) {
    console.warn('[Location] Place search (open-meteo) failed:', err.message);
  }

  if (results.length < limit) {
    try {
      const url = new URL(PHOTON_URL);
      url.searchParams.set('q', q);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('lang', 'en');

      const data = await fetchJson(url);
      for (const feature of data.features || []) {
        if (results.length >= limit) break;
        const props = feature.properties || {};
        const resultCountryCode = normalizeCountryCode(props.countrycode);
        const [lon, lat] = feature.geometry?.coordinates || [];
        if (lat == null || lon == null) continue;
        const item = formatGeocodeResult({
          lat,
          lon,
          displayName: [props.name, props.state, props.country].filter(Boolean).join(', '),
          city: props.name,
          state: props.state,
          country: props.country,
          countryCode: resultCountryCode,
          source: 'photon',
        });
        if (!matchesCountryFilter(item, countryCode)) continue;
        addResult(item);
      }
    } catch (err) {
      console.warn('[Location] Place search (photon) failed:', err.message);
    }
  }

  return results.slice(0, limit).map((place) => ({
    ...place,
    timezoneId: getTimezoneIdFromGeoTz(place.lat, place.lon),
  }));
}

function matchesCountryFilter(place, countryCode) {
  if (!countryCode) return true;
  return place.countryCode === countryCode;
}

function isValidTimezoneId(timezoneId) {
  return Boolean(timezoneId && IANAZone.isValidZone(timezoneId));
}

async function getTimezoneIdFromGoogle(lat, lon, timestampSec) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  const url = new URL('https://maps.googleapis.com/maps/api/timezone/json');
  url.searchParams.set('location', `${lat},${lon}`);
  url.searchParams.set('timestamp', String(timestampSec || Math.floor(Date.now() / 1000)));
  url.searchParams.set('key', apiKey);

  const data = await fetchJson(url);
  if (data.status !== 'OK' || !data.timeZoneId) return null;
  return isValidTimezoneId(data.timeZoneId) ? data.timeZoneId : null;
}

function getTimezoneIdFromGeoTz(lat, lon) {
  try {
    const tz = tzLookup(lat, lon);
    if (isValidTimezoneId(tz)) return tz;
  } catch (_) {
    // tz-lookup throws for invalid coordinates; fall through to geo-tz
  }

  const zones = findTimezone(lat, lon);
  if (!zones?.length) return null;
  return zones.find((zone) => isValidTimezoneId(zone)) || zones[0];
}

async function resolveTimezoneId(lat, lon, birthUtc) {
  const timestampSec = birthUtc ? Math.floor(birthUtc.getTime() / 1000) : Math.floor(Date.now() / 1000);

  try {
    const googleTz = await getTimezoneIdFromGoogle(lat, lon, timestampSec);
    if (googleTz) return googleTz;
  } catch (err) {
    console.warn('[Location] Google timezone lookup failed:', err.message);
  }

  return getTimezoneIdFromGeoTz(lat, lon);
}

function getTimezoneId(lat, lon) {
  return getTimezoneIdFromGeoTz(lat, lon);
}

function localBirthToUtc({ year, month, day, hour, minute, timezoneId }) {
  if (!isValidTimezoneId(timezoneId)) {
    throw new Error(`Invalid timezone: ${timezoneId}`);
  }

  const dt = DateTime.fromObject(
    { year, month, day, hour, minute, second: 0, millisecond: 0 },
    { zone: timezoneId }
  );

  if (!dt.isValid) {
    throw new Error(`Invalid birth time for timezone ${timezoneId}: ${dt.invalidReason || 'unknown error'}`);
  }

  return dt.toUTC().toJSDate();
}

/**
 * Resolves worldwide birth location for any country: coordinates, IANA timezone, UTC instant.
 */
async function resolveBirthLocation(input = {}) {
  let lat = parseCoord(input.lat ?? input.latitude);
  let lon = parseCoord(input.lon ?? input.longitude);
  let resolvedPlace = null;
  let geocodeSource = null;
  let city = input.city || null;
  let state = input.state || input.region || null;
  let country = input.country || input.countryName || null;
  let countryCode = normalizeCountryCode(input.countryCode || input.country_code);

  const { query } = buildGeocodeQuery(input);
  resolvedPlace = query;

  if ((lat == null || lon == null) && query) {
    const geocoded = await geocodePlace(input);
    lat = geocoded.lat;
    lon = geocoded.lon;
    resolvedPlace = geocoded.displayName;
    geocodeSource = geocoded.source;
    city = geocoded.city || city;
    state = geocoded.state || state;
    country = geocoded.country || country;
    countryCode = geocoded.countryCode || countryCode;
  }

  if (lat == null || lon == null) {
    throw new Error(
      'Birth place or coordinates are required. Send city + country, or latitude/longitude from place search.'
    );
  }

  if (!isValidLatLon(lat, lon)) {
    throw new Error('Invalid coordinates. Latitude -90..90, longitude -180..180.');
  }

  let timezoneId = input.timezoneId || input.timezone || input.birthTimezone || null;
  const day = Number(input.day);
  const month = Number(input.month);
  const year = Number(input.year);
  const hour = Number(input.hour ?? input.hours ?? 12);
  const minute = Number(input.minute ?? input.min ?? input.minutes ?? 0);

  let approximateUtc = null;
  if (day && month && year) {
    approximateUtc = new Date(Date.UTC(year, month - 1, day, hour, minute));
  }

  if (!isValidTimezoneId(timezoneId)) {
    timezoneId = await resolveTimezoneId(lat, lon, approximateUtc);
  }
  if (!isValidTimezoneId(timezoneId)) {
    throw new Error('Could not determine a valid timezone for this birth location.');
  }

  let birthUtc = null;
  let utcOffsetMinutes = null;

  if (day && month && year) {
    birthUtc = localBirthToUtc({ year, month, day, hour, minute, timezoneId });
    const localDt = DateTime.fromObject({ year, month, day, hour, minute }, { zone: timezoneId });
    utcOffsetMinutes = localDt.isValid ? localDt.offset : null;
  }

  return {
    lat,
    lon,
    timezoneId,
    place: resolvedPlace || `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
    city,
    state,
    country,
    countryCode,
    birthUtc,
    utcOffsetMinutes,
    geocodeSource,
  };
}

module.exports = {
  resolveBirthLocation,
  geocodePlace,
  searchPlaces,
  localBirthToUtc,
  resolveTimezoneId,
  getTimezoneId,
  buildGeocodeQuery,
};
