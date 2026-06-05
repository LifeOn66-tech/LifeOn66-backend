const { createHTMLContent } = require('../src/services/astrologyReportBuilder');
const { prepareReportImages } = require('../src/utils/imageResolver');

async function main() {
  const fullData = {
    palmistry: { images: { right: 'https://picsum.photos/seed/palmright/600/400', left: 'https://picsum.photos/seed/palmleft/600/400' } },
    face: { images: { center: 'https://picsum.photos/seed/face/600/800', left: 'https://picsum.photos/seed/fl/600/800', right: 'https://picsum.photos/seed/fr/600/800' } },
  };

  const images = await prepareReportImages(fullData);

  for (const tier of ['free', 'premium', 'professional']) {
    const html = createHTMLContent({ confidenceScore: 92 }, 'en', fullData, tier, 'Test User', {}, images);
    const count = html.split('class="page"').length - 1;
    const imgTags = (html.match(/<img /g) || []).length;
    console.log(`${tier}: ${count} pages, ${imgTags} img tags`);
  }
}

main();
