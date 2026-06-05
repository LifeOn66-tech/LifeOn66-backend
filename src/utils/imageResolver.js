const https = require('https');
const http = require('http');

const IMAGE_KEYS = ['right', 'left', 'both', 'center', 'front', 'face', 'palm'];

function isUsableImageSrc(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length < 20) return false;
  return (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') === false
  );
}

function pick(obj, paths) {
  for (const path of paths) {
    const value = path.split('.').reduce((acc, key) => acc?.[key], obj);
    if (isUsableImageSrc(value)) return value.trim();
  }
  return '';
}

function normalizeImageMap(source = {}) {
  if (typeof source !== 'object' || source === null) return {};
  const nested = source.images && typeof source.images === 'object' ? source.images : source;
  return {
    right: pick(source, ['images.right', 'right', 'rightPalm', 'palmRight', 'active', 'image', 'imageUrl', 'url']),
    left: pick(source, ['images.left', 'left', 'leftPalm', 'palmLeft', 'passive']),
    both: pick(source, ['images.both', 'both', 'bothPalms']),
    center: pick(source, ['images.center', 'center', 'front', 'faceCenter', 'face', 'image', 'imageUrl']),
    front: pick(source, ['images.center', 'center', 'front', 'faceCenter']),
  };
}

function collectAllImages(fullData = {}) {
  const palm = normalizeImageMap(fullData.palmistry || fullData.palm || {});
  const face = normalizeImageMap(fullData.face || fullData.faceReading || {});

  const images = {
    palmRight: palm.right || pick(fullData, ['palmRight', 'rightPalm', 'images.palmRight']),
    palmLeft: palm.left || pick(fullData, ['palmLeft', 'leftPalm', 'images.palmLeft']),
    palmBoth: palm.both || pick(fullData, ['palmBoth', 'bothPalms', 'images.palmBoth']),
    faceCenter: face.center || face.front || pick(fullData, ['faceCenter', 'frontFace', 'images.faceCenter']),
    faceLeft: face.left || pick(fullData, ['faceLeft', 'leftProfile', 'images.faceLeft']),
    faceRight: face.right || pick(fullData, ['faceRight', 'rightProfile', 'images.faceRight']),
    extra: [],
  };

  const pushExtra = (url, label) => {
    if (!isUsableImageSrc(url)) return;
    const trimmed = url.trim();
    if (Object.values(images).includes(trimmed)) return;
    if (images.extra.some((e) => e.url === trimmed)) return;
    images.extra.push({ url: trimmed, label: label || 'Uploaded Image' });
  };

  if (Array.isArray(fullData.extraImages)) {
    fullData.extraImages.forEach((img, i) => {
      if (typeof img === 'string') pushExtra(img, `Additional Image ${i + 1}`);
      else if (img?.url) pushExtra(img.url, img.label || `Additional Image ${i + 1}`);
    });
  }

  const astroImages = fullData.astrology?.images;
  if (astroImages && typeof astroImages === 'object') {
    Object.entries(astroImages).forEach(([key, url]) => pushExtra(url, key));
  }

  // Deep scan for any data:image or http image strings in fullData
  const walk = (node, label = 'Image') => {
    if (!node || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === 'string' && isUsableImageSrc(value) && IMAGE_KEYS.some((k) => key.toLowerCase().includes(k))) {
        pushExtra(value, key);
      } else if (typeof value === 'object') {
        walk(value, key);
      }
    }
  };
  walk(fullData);

  return images;
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client
      .get(url, { timeout: 30000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchBuffer(res.headers.location).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({ buffer: Buffer.concat(chunks), mime: res.headers['content-type'] || 'image/jpeg' }));
      })
      .on('error', reject);
  });
}

async function resolveImageSrc(src) {
  if (!isUsableImageSrc(src)) return '';
  const trimmed = src.trim();
  if (trimmed.startsWith('data:image/')) return trimmed;

  try {
    const { buffer, mime } = await fetchBuffer(trimmed);
    return `data:${mime.split(';')[0]};base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.warn('[PDF] Could not inline image, using original URL:', err.message);
    return trimmed;
  }
}

async function resolveAllImages(imageMap) {
  const entries = Object.entries(imageMap);
  const resolved = { ...imageMap, extra: [] };

  for (const [key, value] of entries) {
    if (key === 'extra') continue;
    resolved[key] = await resolveImageSrc(value);
  }

  if (Array.isArray(imageMap.extra)) {
    resolved.extra = await Promise.all(
      imageMap.extra.map(async (item) => ({
        label: item.label,
        url: await resolveImageSrc(item.url),
      }))
    );
  }

  return resolved;
}

async function prepareReportImages(fullData = {}) {
  const collected = collectAllImages(fullData);
  return resolveAllImages(collected);
}

module.exports = {
  collectAllImages,
  prepareReportImages,
  isUsableImageSrc,
};
