// 🚀 Viral Growth & Social Routes

import { Router } from 'express';
import { authMiddleware as auth, AuthRequest } from '../middleware/auth.middleware';
import { ViralGrowthService } from '../services/viral-growth.service';

const router = Router();
const viralService = new ViralGrowthService();

/**
 * Generate referral code
 * POST /api/viral/referral/generate
 */
router.post('/referral/generate', auth, async (req: AuthRequest, res) => {
  try {
    const studentId = req.user!.id.toString();
    const { maxUses = 10 } = req.body;

    const code = await viralService.generateReferralCode(studentId, maxUses);

    res.json({
      success: true,
      data: {
        referralCode: code,
        shareUrl: `${process.env.API_URL_PUBLIC}/signup?ref=${code}`,
        message: 'Share this code to earn 500 XP per referral!'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Apply referral code (called during signup)
 * POST /api/viral/referral/apply
 */
router.post('/referral/apply', auth, async (req: AuthRequest, res) => {
  try {
    const studentId = req.user!.id.toString();
    const { referralCode } = req.body;

    const result = await viralService.applyReferralCode(studentId, referralCode);

    res.json({
      success: result.success,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Generate shareable rank-up card
 * GET /api/viral/share/rank-up
 */
router.get('/share/rank-up', auth, async (req: AuthRequest, res) => {
  try {
    const studentId = req.user!.id.toString();
    const card = await viralService.generateRankUpCard(studentId);

    res.json({
      success: true,
      data: card
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Generate shareable achievement card
 * GET /api/viral/share/achievement/:name
 */
router.get('/share/achievement/:name', auth, async (req: AuthRequest, res) => {
  try {
    const studentId = req.user!.id.toString();
    const { name } = req.params;

    const card = await viralService.generateAchievementCard(studentId, name);

    res.json({
      success: true,
      data: card
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get global leaderboard
 * GET /api/viral/leaderboard?metric=xp&limit=100
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const metric = (req.query.metric as 'xp' | 'level' | 'streak') || 'xp';
    const limit = parseInt(req.query.limit as string) || 100;

    const leaderboard = await viralService.getGlobalLeaderboard(metric, limit);

    res.json({
      success: true,
      data: {
        leaderboard,
        metric,
        updatedAt: new Date()
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get student's leaderboard position
 * GET /api/viral/leaderboard/position?metric=xp
 */
router.get('/leaderboard/position', auth, async (req: AuthRequest, res) => {
  try {
    const studentId = req.user!.id.toString();
    const metric = (req.query.metric as 'xp' | 'level') || 'xp';

    const position = await viralService.getStudentLeaderboardPosition(studentId, metric);

    res.json({
      success: true,
      data: position
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Track social share (awards XP bonus)
 * POST /api/viral/track-share
 */
router.post('/track-share', auth, async (req: AuthRequest, res) => {
  try {
    const studentId = req.user!.id.toString();
    const { type, platform } = req.body;

    await viralService.trackShare(studentId, type, platform);

    res.json({
      success: true,
      data: {
        message: '+10 XP for sharing!',
        xpAwarded: 10
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Generate share text for social media
 * POST /api/viral/share-text
 */
router.post('/share-text', auth, async (req: AuthRequest, res) => {
  try {
    const { type, data } = req.body;
    const shareText = viralService.generateShareText(type, data);

    res.json({
      success: true,
      data: {
        shareText,
        platforms: [
          { name: 'Twitter', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}` },
          { name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.shareUrl)}` },
          { name: 'WhatsApp', url: `https://wa.me/?text=${encodeURIComponent(shareText)}` }
        ]
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get viral growth metrics (admin only)
 * GET /api/viral/metrics
 */
router.get('/metrics', auth, async (req: AuthRequest, res) => {
  try {
    // Check if user is admin/super-admin
    if (req.user!.role !== 'admin' && req.user!.role !== 'super-admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const start = req.query.start ? new Date(req.query.start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = req.query.end ? new Date(req.query.end as string) : new Date();

    const metrics = await viralService.getViralMetrics({ start, end });

    res.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
