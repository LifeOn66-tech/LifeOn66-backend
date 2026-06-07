const pdfService = require('../services/pdfGeneratorService');
const { collectAllImages } = require('../utils/imageResolver');
const { enrichReportData } = require('../utils/reportDataResolver');
const User = require('../models/User');

exports.generateReport = async (req, res) => {
  const started = Date.now();
  try {
    const { language = 'en', analysis, fullData, tier } = req.body;
    const userId = req.user.id;

    req.setTimeout(120000);
    res.setTimeout(120000);

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

    const enriched = await enrichReportData(
      userId,
      analysis,
      fullData,
      user,
      req.body?.userDetails || {}
    );

    console.log(
      `[Report] Start ${finalTier} PDF for ${user.fullName} — images: ${enriched.imageCount.before} → ${enriched.imageCount.after}`
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
        dateOfBirth: user.dateOfBirth || fullData?.astrology?.dateOfBirth || req.body?.userDetails?.dateOfBirth,
        timeOfBirth: user.timeOfBirth || fullData?.astrology?.timeOfBirth || req.body?.userDetails?.timeOfBirth,
        placeOfBirth: user.placeOfBirth || fullData?.astrology?.placeOfBirth || req.body?.userDetails?.placeOfBirth,
      }
    );

    const filenamePrefix =
      finalTier === 'premium'
        ? 'LifeOn66_Premium_Report'
        : finalTier === 'professional'
          ? 'LifeOn66_Cosmic_Master_Report'
          : 'LifeOn66_Report';

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filenamePrefix}_${Date.now()}.pdf"`,
      'Content-Length': pdfBuffer.length,
      'X-Report-Generator': 'lifeon66-backend',
      'X-Report-Tier': finalTier,
      'X-Report-Pages': finalTier === 'premium' ? '15' : finalTier === 'professional' ? '25' : undefined,
      'X-Report-Duration-Ms': String(Date.now() - started),
    });

    console.log(`[Report] Sent ${filenamePrefix} (${Math.round(pdfBuffer.length / 1024)} KB) in ${Date.now() - started}ms`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error(`[Report] PDF failed after ${Date.now() - started}ms:`, error.message);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error.message?.includes('timed out')
          ? 'PDF generation took too long. Please try again — ensure images are saved as base64 before downloading.'
          : `PDF generation failed: ${error.message}`,
        error: error.message,
      });
    }
  }
};
