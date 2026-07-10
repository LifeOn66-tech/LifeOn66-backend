const pdfService = require('../services/pdfGeneratorService');
const {
  enrichReportData,
  collectBodyUserDetails,
  ensureReportReady,
} = require('../utils/reportDataResolver');
const { getReadingCompletionStatus } = require('../utils/readingCompletion');
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

    const bodyUserDetails = collectBodyUserDetails(req.body);

    let enriched = await enrichReportData(
      userId,
      analysis,
      fullData,
      user,
      bodyUserDetails
    );

    console.log(
      `[Report] Start ${finalTier} PDF for ${user.fullName} — images: ${enriched.imageCount.before} → ${enriched.imageCount.after}`
    );
    console.log('[Report] Birth details:', enriched.userDetails);

    const validation = await ensureReportReady(enriched, {
      user,
      astrologyDoc: enriched.astrologyDoc,
      bodyUserDetails,
    });
    enriched = validation.enriched;

    if (!validation.ok) {
      return res.status(400).json({
        success: false,
        message:
          'Your birth chart is missing required details. Please regenerate your chart with date, time, place, and gender.',
        missing: validation.missing,
        hint: 'Open Vedic Astrology, enter birth details, generate your chart, and save the reading — then try again.',
        code: 'BIRTH_CHART_INCOMPLETE',
      });
    }

    if (enriched.imageCount.after === 0) {
      console.warn('[Report] No images found in request or database. PDF will show placeholders.');
    }

    const pdfBuffer = await pdfService.generatePDF(
      enriched.analysis,
      language,
      enriched.fullData,
      finalTier,
      user.fullName,
      enriched.userDetails
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

exports.getReportReadiness = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const readings = await getReadingCompletionStatus(userId);
    const bodyUserDetails = collectBodyUserDetails(req.query);

    let enriched = await enrichReportData(userId, {}, {}, user, bodyUserDetails);
    const report = await ensureReportReady(enriched, {
      user,
      astrologyDoc: enriched.astrologyDoc,
      bodyUserDetails,
    });

    return res.status(200).json({
      success: true,
      ready: readings.complete && report.ok,
      readings,
      report: {
        ok: report.ok,
        missing: report.missing,
        hasChart: Boolean(
          report.enriched.fullData?.astrology?.planets?.length ||
          report.enriched.fullData?.astrology?.birthChartData?.planets?.length
        ),
        birthDetails: report.enriched.userDetails,
      },
    });
  } catch (error) {
    console.error('[Report] readiness check failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Could not verify report readiness',
      error: error.message,
    });
  }
};
