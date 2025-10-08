import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { createApiError } from '../middleware/errorHandler';
import { GameRule } from '../models/GameRule';
import { validateFeatPrerequisites } from '../services/gameData3cService';

const router = Router();

// Middleware: verify authentication for routes that need it
router.use(authMiddleware);

// GET /api/feats/:id/prerequisites
// Validate if a character can select a feat based on prerequisites
router.get('/:featId/validate', async (req: Request, res: Response) => {
  try {
    const { bab, abilityScores, selectedFeats } = req.body;

    if (!bab || !abilityScores) {
      throw createApiError('BAB and ability scores required', 400, 'MISSING_FIELD');
    }

    const result = validateFeatPrerequisites(
      req.params.featId,
      bab,
      abilityScores,
      selectedFeats || []
    );

    res.status(200).json({
      valid: result.valid,
      unmetPrerequisites: result.unmet,
    });
  } catch (error) {
    if (error instanceof Error && (error as any).status) {
      throw error;
    }
    throw createApiError('Failed to validate feat prerequisites', 500);
  }
});

// GET /api/feats/:id/details
// Get detailed information about a feat including prerequisites
router.get('/:featId/details', async (req: Request, res: Response) => {
  try {
    const feat = await GameRule.findOne({ type: 'feat', id: req.params.featId });

    if (!feat) {
      throw createApiError('Feat not found', 404, 'FEAT_NOT_FOUND');
    }

    res.status(200).json({ feat });
  } catch (error) {
    if (error instanceof Error && (error as any).status) {
      throw error;
    }
    throw createApiError('Failed to fetch feat details', 500);
  }
});

export default router;
