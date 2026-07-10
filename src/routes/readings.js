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
  repairAstrologyReading,
  resolveBirthPlace,
  searchBirthPlaces,
} = require('../controllers/readingController');

const router = express.Router();

router.get('/search-places', searchBirthPlaces);
router.post('/resolve-place', resolveBirthPlace);
router.post('/astrology-generate', generateAstrologyData);

const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getReadings);
router.post('/astrology', saveAstrologyReading);
router.post('/astrology/repair', repairAstrologyReading);
router.post('/palmistry-analyze', analyzePalmistry);
router.post('/palmistry', savePalmistryReading);
router.post('/face-analyze', analyzeFace);
router.post('/face', saveFaceReading);
router.post('/insight', saveCareerInsight);
router.get('/insight', getCareerInsight);

module.exports = router;
