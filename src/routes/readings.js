const express = require('express');
const {
  saveAstrologyReading,
  savePalmistryReading,
  saveFaceReading,
  saveCareerInsight,
  getReadings,
  generateAstrologyData
} = require('../controllers/readingController');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getReadings);
router.post('/astrology', saveAstrologyReading);
router.post('/palmistry', savePalmistryReading);
router.post('/face', saveFaceReading);
router.post('/insight', saveCareerInsight);
router.post('/astrology-generate', generateAstrologyData);

module.exports = router;
