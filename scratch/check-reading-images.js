require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const PalmistryReading = require('../src/models/PalmistryReading');
  const FaceReading = require('../src/models/FaceReading');
  const User = require('../src/models/User');
  const { isUsableImageSrc } = require('../src/utils/imageResolver');

  const users = await User.find().sort({ createdAt: -1 }).limit(10).lean();
  for (const u of users) {
    const palm = await PalmistryReading.findOne({ user: u._id }).sort({ createdAt: -1 }).lean();
    const face = await FaceReading.findOne({ user: u._id }).sort({ createdAt: -1 }).lean();
    const palmKeys = palm?.images ? Object.keys(palm.images) : [];
    const faceKeys = face?.images ? Object.keys(face.images) : [];
    const palmValid = palm?.images
      ? Object.entries(palm.images).filter(([, v]) => isUsableImageSrc(v)).map(([k]) => k)
      : [];
    const faceValid = face?.images
      ? Object.entries(face.images).filter(([, v]) => isUsableImageSrc(v)).map(([k]) => k)
      : [];
    console.log(`\n${u.fullName || u.email} (${u._id})`);
    console.log('  palm keys:', palmKeys, 'valid:', palmValid);
    console.log('  face keys:', faceKeys, 'valid:', faceValid);
    if (palm?.images?.right) {
      const s = String(palm.images.right);
      console.log('  palm.right prefix:', s.slice(0, 40), 'len:', s.length);
    }
  }
  await mongoose.disconnect();
}

main().catch(console.error);
