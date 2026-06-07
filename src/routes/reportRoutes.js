const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.post('/generate', protect, reportController.generateReport);

/** Frontend career-blueprint download should use this — not client-side PDF generation */
router.post('/career-blueprint', protect, (req, res, next) => {
  req.body.tier = req.body.tier || 'premium';
  return reportController.generateReport(req, res, next);
});

/** $10 Cosmic Master tier — 25-page exhaustive report */
router.post('/cosmic-master', protect, (req, res, next) => {
  req.body.tier = 'professional';
  return reportController.generateReport(req, res, next);
});

module.exports = router;
