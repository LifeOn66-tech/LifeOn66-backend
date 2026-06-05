const {
  collectAllImages,
  prepareReportImages,
  isUsableImageSrc,
  normalizeToDataUrl,
} = require('../src/utils/imageResolver');

const TINY_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function main() {
  const base64DataUrl = `data:image/png;base64,${TINY_PNG}`;
  const rawBase64 = TINY_PNG;

  console.log('--- Validation ---');
  console.log('data URL usable:', isUsableImageSrc(base64DataUrl));
  console.log('raw base64 usable:', isUsableImageSrc(rawBase64));
  console.log('blob rejected:', !isUsableImageSrc('blob:http://localhost/abc'));
  console.log('empty rejected:', !isUsableImageSrc(''));

  const fullData = {
    palmistry: {
      images: {
        right: base64DataUrl,
        left: rawBase64,
      },
    },
    face: {
      images: {
        center: base64DataUrl,
        left: rawBase64,
        right: base64DataUrl,
      },
    },
  };

  const collected = collectAllImages(fullData);
  console.log('\n--- Collected ---');
  console.log('palmRight:', Boolean(collected.palmRight));
  console.log('palmLeft:', Boolean(collected.palmLeft));
  console.log('faceCenter:', Boolean(collected.faceCenter));
  console.log('faceLeft:', Boolean(collected.faceLeft));
  console.log('faceRight:', Boolean(collected.faceRight));

  const { images, stats } = await prepareReportImages(fullData);
  console.log('\n--- Resolved ---');
  console.log('stats:', stats);
  console.log('all inlined:', stats.collected === stats.resolved);
  console.log('palmRight starts with data:', images.palmRight.startsWith('data:image/'));
  console.log('palmLeft starts with data:', images.palmLeft.startsWith('data:image/'));

  const remote = {
    palmistry: { images: { right: 'https://picsum.photos/seed/palm/400/300' } },
    face: { images: { center: 'https://picsum.photos/seed/face/300/400' } },
  };
  const remoteResult = await prepareReportImages(remote);
  console.log('\n--- Remote fetch ---');
  console.log('remote stats:', remoteResult.stats);
  console.log('remote inlined:', remoteResult.stats.resolved >= 2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
