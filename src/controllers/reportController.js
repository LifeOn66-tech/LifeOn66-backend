const pdfService = require('../services/pdfGeneratorService');
const { collectAllImages } = require('../utils/imageResolver');
const { enrichReportData } = require('../utils/reportDataResolver');
const User = require('../models/User');

exports.generateReport = async (req, res) => {
  try {
    const { language = 'en', analysis, fullData, tier } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userTier = user.subscriptionTier || 'free';

    let finalTier = 'free';
    let isAuthorized = false;

    if (tier === 'free') {
      finalTier = 'free';
      isAuthorized = true;
    } else if (tier === 'premium') {
      if (userTier === 'premium' || userTier === 'professional') {
        finalTier = 'premium';
        isAuthorized = true;
      }
    } else if (tier === 'professional') {
      if (userTier === 'professional') {
        finalTier = 'professional';
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(402).json({
        success: false,
        message: `Payment Required: You have not purchased the ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan yet.`,
      });
    }

    const enriched = await enrichReportData(userId, analysis, fullData);

    console.log(
      `[Report] Generating ${finalTier} PDF for ${user.fullName} — images in request: ${enriched.imageCount.before}, after DB merge: ${enriched.imageCount.after}`,
      enriched.sources
    );

    if (enriched.imageCount.after === 0) {
      console.warn('[Report] No images found in request or database. PDF will show placeholders.');
    }

    const pdfBuffer = await pdfService.generatePDF(
      enriched.analysis,
      language,
      enriched.fullData,
      finalTier,
      user.fullName,
      {
        dateOfBirth: user.dateOfBirth,
        timeOfBirth: user.timeOfBirth,
        placeOfBirth: user.placeOfBirth,
      }
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=LifeOn66_Report_${Date.now()}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error('[Report] PDF generation failed:', error);
    res.status(500).json({
      success: false,
      message: `PDF Generation Failed: ${error.message}. Please check backend logs.`,
      error: error.message,
    });
  }
};
