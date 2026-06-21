const express = require('express');
const {
  saveAstrologyReading,
  savePalmistryReading,
  saveFaceReading,
  saveCareerInsight,
  getCareerInsight,
  getReadings,
  generateAstrologyData,
  analyzePalmistry,
  analyzeFace,
} = require('../controllers/readingController');

const router = express.Router();

router.post('/astrology-generate', generateAstrologyData);

const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getReadings);
router.post('/astrology', saveAstrologyReading);
router.post('/palmistry-analyze', analyzePalmistry);
router.post('/palmistry', savePalmistryReading);
router.post('/face-analyze', analyzeFace);
router.post('/face', saveFaceReading);
router.post('/insight', saveCareerInsight);
router.get('/insight', getCareerInsight);

module.exports = router;
