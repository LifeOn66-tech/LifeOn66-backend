const https = require('https');
const http = require('http');

const IMAGE_KEY_PATTERN = /(right|left|both|center|front|face|palm|profile|image|photo|upload)/i;

function extractImageString(value) {
  if (typeof value === 'string') return value.trim();
  if (Buffer.isBuffer(value)) {
    return `data:${detectMimeFromBase64(value.toString('base64'))};base64,${value.toString('base64')}`;
  }
  if (!value || typeof value !== 'object') return '';
  if (value.buffer && Buffer.isBuffer(value.buffer)) {
    return `data:image/jpeg;base64,${value.buffer.toString('base64')}`;
  }
  return String(value.data || value.url || value.src || value.base64 || value.image || '').trim();
}

function extractImagesFromReadingDoc(doc) {
  if (!doc) return {};
  const found = {};
  const slotMap = {
    right: 'right',
    left: 'left',
    both: 'both',
    center: 'center',
    front: 'center',
    rightpalm: 'right',
    leftpalm: 'left',
    facecenter: 'center',
    faceleft: 'left',
    faceright: 'right',
  };

  if (doc.images && typeof doc.images === 'object') {
    for (const [key, value] of Object.entries(doc.images)) {
      const normalized = normalizeToDataUrl(value);
      if (isUsableImageSrc(normalized)) {
        const slot = slotMap[key.toLowerCase()] || key;
        found[slot] = normalized;
      }
    }
  }

  for (const [key, value] of Object.entries(doc)) {
    if (['_id', 'user', 'createdAt', '__v', 'images'].includes(key)) continue;
    const str = extractImageString(value);
    if (isUsableImageSrc(str) && IMAGE_KEY_PATTERN.test(key)) {
      const slot = slotMap[key.toLowerCase()] || key;
      found[slot] = normalizeToDataUrl(str);
    }
  }

  return found;
}

function isRawBase64(value) {
  if (typeof value !== 'string') return false;
  const sample = value.replace(/\s/g, '').slice(0, 120);
  if (sample.length < 80) return false;
  return /^[A-Za-z0-9+/=]+$/.test(sample);
}

function detectMimeFromBase64(b64) {
  const head = Buffer.from(b64.replace(/\s/g, '').slice(0, 32), 'base64');
  if (head[0] === 0xff && head[1] === 0xd8) return 'image/jpeg';
  if (head[0] === 0x89 && head[1] === 0x50) return 'image/png';
  if (head[0] === 0x47 && head[1] === 0x49) return 'image/gif';
  if (head.toString('ascii', 0, 4) === 'RIFF') return 'image/webp';
  return 'image/jpeg';
}

function normalizeToDataUrl(src) {
  const raw = extractImageString(src);
  if (!raw) return '';

  if (raw.startsWith('data:image/')) {
    const comma = raw.indexOf(',');
    if (comma === -1) return '';
    const header = raw.slice(0, comma);
    const payload = raw.slice(comma + 1).replace(/\s/g, '');
    if (!payload || payload.length < 80) return '';
    return `${header},${payload}`;
  }

  if (isRawBase64(raw)) {
    const payload = raw.replace(/\s/g, '');
    return `data:${detectMimeFromBase64(payload)};base64,${payload}`;
  }

  return raw;
}

function isUsableImageSrc(value) {
  const normalized = normalizeToDataUrl(value);
  if (!normalized) return false;
  if (normalized.startsWith('blob:')) return false;

  if (normalized.startsWith('data:image/')) {
    const payload = normalized.includes(',') ? normalized.split(',')[1] : '';
    return payload.replace(/\s/g, '').length >= 80;
  }

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized.length >= 12;
  }

  return false;
}

function firstUsable(...candidates) {
  for (const candidate of candidates) {
    const value = extractImageString(candidate);
    if (isUsableImageSrc(value)) return normalizeToDataUrl(value);
  }
  return '';
}

function normalizePalmImages(source = {}) {
  const nested = source.images && typeof source.images === 'object' ? source.images : {};
  return {
    right: firstUsable(nested.right, source.right, source.rightPalm, source.palmRight, source.active),
    left: firstUsable(nested.left, source.left, source.leftPalm, source.palmLeft, source.passive),
    both: firstUsable(nested.both, source.both, source.bothPalms, source.palmBoth),
  };
}

function normalizeFaceImages(source = {}) {
  const nested = source.images && typeof source.images === 'object' ? source.images : {};
  return {
    center: firstUsable(nested.center, nested.front, source.center, source.front, source.faceCenter, source.face),
    left: firstUsable(nested.left, source.left, source.faceLeft, source.leftProfile),
    right: firstUsable(nested.right, source.right, source.faceRight, source.rightProfile),
  };
}

function collectAllImages(fullData = {}) {
  const palm = normalizePalmImages(fullData.palmistry || fullData.palm || {});
  const face = normalizeFaceImages(fullData.face || fullData.faceReading || {});

  const images = {
    palmRight: palm.right || firstUsable(fullData.palmRight, fullData.rightPalm),
    palmLeft: palm.left || firstUsable(fullData.palmLeft, fullData.leftPalm),
    palmBoth: palm.both || firstUsable(fullData.palmBoth, fullData.bothPalms),
    faceCenter: face.center || firstUsable(fullData.faceCenter, fullData.frontFace),
    faceLeft: face.left || firstUsable(fullData.faceLeft, fullData.leftProfile),
    faceRight: face.right || firstUsable(fullData.faceRight, fullData.rightProfile),
    extra: [],
  };

  const knownUrls = new Set(
    [
      images.palmRight,
      images.palmLeft,
      images.palmBoth,
      images.faceCenter,
      images.faceLeft,
      images.faceRight,
    ].filter(Boolean)
  );

  const pushExtra = (url, label) => {
    const normalized = normalizeToDataUrl(url);
    if (!isUsableImageSrc(normalized)) return;
    if (knownUrls.has(normalized)) return;
    if (images.extra.some((e) => e.url === normalized)) return;
    knownUrls.add(normalized);
    images.extra.push({ url: normalized, label: label || 'Uploaded Image' });
  };

  if (Array.isArray(fullData.extraImages)) {
    fullData.extraImages.forEach((img, i) => {
      if (typeof img === 'string') pushExtra(img, `Additional Image ${i + 1}`);
      else pushExtra(extractImageString(img), img?.label || `Additional Image ${i + 1}`);
    });
  }

  const astroImages = fullData.astrology?.images;
  if (astroImages && typeof astroImages === 'object') {
    Object.entries(astroImages).forEach(([key, url]) => pushExtra(url, key));
  }

  const walk = (node, depth = 0) => {
    if (!node || typeof node !== 'object' || depth > 8) return;
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === 'string' || (value && typeof value === 'object')) {
        const str = extractImageString(value);
        const keyLower = key.toLowerCase();
        if (isUsableImageSrc(str) && IMAGE_KEY_PATTERN.test(keyLower)) {
          pushExtra(str, key);
        }
      }
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        walk(value, depth + 1);
      }
    }
  };
  walk(fullData);

  return images;
}

function fetchBuffer(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) {
      reject(new Error('Too many redirects'));
      return;
    }

    const client = url.startsWith('https') ? https : http;
    const request = client.get(
      url,
      {
        timeout: 12000,
        headers: {
          'User-Agent': 'LifeOn66-PDF-Generator/1.0',
          Accept: 'image/*,*/*',
        },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith('http')
            ? res.headers.location
            : new URL(res.headers.location, url).href;
          fetchBuffer(next, redirects + 1).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url.slice(0, 80)}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          let mime = (res.headers['content-type'] || '').split(';')[0].trim();
          if (!mime.startsWith('image/')) {
            mime = detectMimeFromBase64(buffer.toString('base64'));
          }
          resolve({ buffer, mime });
        });
      }
    );
    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error(`Timeout fetching ${url.slice(0, 80)}`));
    });
  });
}

async function resolveImageSrc(src) {
  const normalized = normalizeToDataUrl(src);
  if (!isUsableImageSrc(normalized)) return '';

  if (normalized.startsWith('data:image/')) {
    return normalized;
  }

  try {
    const { buffer, mime } = await fetchBuffer(normalized);
    if (!buffer.length) return normalized;
    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.warn('[PDF] Could not inline remote image, using URL in PDF:', err.message);
    return normalized;
  }
}

async function resolveAllImages(imageMap) {
  const slots = ['palmRight', 'palmLeft', 'palmBoth', 'faceCenter', 'faceLeft', 'faceRight'];
  const resolved = { ...imageMap, extra: [] };

  const slotResults = await Promise.all(
    slots.map(async (key) => [key, await resolveImageSrc(imageMap[key])])
  );
  slotResults.forEach(([key, value]) => {
    resolved[key] = value;
  });

  if (Array.isArray(imageMap.extra)) {
    resolved.extra = (
      await Promise.all(
        imageMap.extra.map(async (item) => {
          const url = await resolveImageSrc(item.url);
          return url ? { label: item.label, url } : null;
        })
      )
    ).filter(Boolean);
  }

  return resolved;
}

function isInlinedDataUrl(src) {
  return typeof src === 'string' && src.startsWith('data:image/');
}

function countResolvedImages(imageMap) {
  return [
    imageMap.palmRight,
    imageMap.palmLeft,
    imageMap.palmBoth,
    imageMap.faceCenter,
    imageMap.faceLeft,
    imageMap.faceRight,
    ...(imageMap.extra || []).map((e) => e.url),
  ].filter(Boolean).length;
}

function summarizeImages(collected, resolved) {
  const slots = [
    ['palmRight', 'Right Palm'],
    ['palmLeft', 'Left Palm'],
    ['palmBoth', 'Both Palms'],
    ['faceCenter', 'Front Face'],
    ['faceLeft', 'Left Profile'],
    ['faceRight', 'Right Profile'],
  ];

  return slots.map(([key, label]) => ({
    slot: key,
    label,
    found: Boolean(collected[key]),
    inlined: isInlinedDataUrl(resolved[key]) || Boolean(resolved[key]),
  }));
}

async function prepareReportImages(fullData = {}) {
  const collected = collectAllImages(fullData);
  const resolved = await resolveAllImages(collected);
  const stats = {
    collected: countResolvedImages(collected),
    resolved: countResolvedImages(resolved),
    slots: summarizeImages(collected, resolved),
  };
  return { images: resolved, stats };
}

function normalizeReadingImages(images = {}) {
  if (!images || typeof images !== 'object') return {};
  const out = {};
  for (const [key, value] of Object.entries(images)) {
    const normalized = normalizeToDataUrl(value);
    if (isUsableImageSrc(normalized)) out[key] = normalized;
  }
  return out;
}

module.exports = {
  collectAllImages,
  prepareReportImages,
  isUsableImageSrc,
  normalizeToDataUrl,
  extractImageString,
  extractImagesFromReadingDoc,
  normalizeReadingImages,
  firstUsable,
};
