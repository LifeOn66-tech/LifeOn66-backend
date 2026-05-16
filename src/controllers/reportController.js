const pdfService = require('../services/pdfGeneratorService');
const User = require('../models/User');

exports.generateReport = async (req, res) => {
  try {
    const { language = 'en', analysis, fullData, tier } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Determine the actual tier allowed for this user based on their database record
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
      console.warn(`[SECURITY ALERT] Unauthorized PDF request! User: ${user.email} tried to get ${tier} but is only ${userTier}`);
      return res.status(402).json({ 
        success: false, 
        message: `Payment Required: You have not purchased the ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan yet.` 
      });
    }

    console.log(`[PDF] Generating authorized ${finalTier} report for user: ${user.fullName}`);

    const pdfBuffer = await pdfService.generatePDF(
      analysis, 
      language, 
      fullData, 
      finalTier, 
      user.fullName
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=LifeOn66_Report_${Date.now()}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error in generateReport controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate report',
      error: error.message 
    });
  }
};
