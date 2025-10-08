/**
 * Phase 5: Character Leveling API Routes
 * Endpoints for character advancement and experience management
 */

import express, { Router, Request, Response } from 'express';
import { Character } from '../models/Character';
import { authMiddleware } from '../middleware/auth';
import levelingService from '../services/levelingService';

const router: Router = express.Router();

/**
 * POST /api/characters/:id/level-up
 * Advance character one level with automatic stat calculation
 */
router.post(
  '/:id/level-up',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      // Get character
      const character = await Character.findOne({
        _id: id,
        userId,
      });

      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      const currentLevel = character.derivedStats.totalLevel || 1;
      const nextLevel = currentLevel + 1;

      // Validate level
      if (nextLevel > 20) {
        return res
          .status(400)
          .json({ error: 'Character is already at maximum level (20)' });
      }

      // Get advancement options
      const advancement = levelingService.getAdvancementOptions(
        character as any,
        nextLevel
      );

      // Calculate HP gain for all classes
      let totalHPGain = 0;
      const conModifier =
        Math.floor((character.attributes.abilityScores.con.total - 10) / 2);

      const classes = character.attributes.classes as any[];
      if (classes && Array.isArray(classes)) {
        for (const charClass of classes) {
          const hpGain = levelingService.calculateHPGain(
            charClass.hitDie,
            conModifier
          );
          totalHPGain += hpGain;
        }
      }

      // Calculate skill points gain
      const intModifier =
        Math.floor((character.attributes.abilityScores.int.total - 10) / 2);
      let totalSkillPointsGain = 0;
      if (classes && Array.isArray(classes)) {
        for (const charClass of classes) {
          // Simplified: base 2 skill points, +INT modifier
          const skillGain = levelingService.calculateSkillPointsGain(2, intModifier);
          totalSkillPointsGain += skillGain;
        }
      }

      // Update character
      character.derivedStats.totalLevel = nextLevel;
      character.derivedStats.hitPoints.current += totalHPGain;
      character.derivedStats.hitPoints.max += totalHPGain;
      character.derivedStats.skillPoints.remaining += totalSkillPointsGain;

      // Add advancement record
      const advancementRecord = levelingService.createAdvancementRecord(
        nextLevel,
        totalHPGain,
        totalSkillPointsGain
      );
      character.levelHistory = character.levelHistory || [];
      character.levelHistory.push(advancementRecord as any);

      // Apply ability score improvements if applicable
      if (advancement.abilityScoreImprovement) {
        // Don't automatically apply; let user choose in frontend
      }

      // Save character
      await character.save();

      return res.status(200).json({
        character,
        advancement: {
          newLevel: nextLevel,
          hitPointsGained: totalHPGain,
          skillPointsGained: totalSkillPointsGain,
          bonusFeats: advancement.bonusFeats,
          abilityScoreImprovement: advancement.abilityScoreImprovement,
        },
      });
    } catch (error) {
      console.error('Level up error:', error);
      return res.status(500).json({ error: 'Failed to level up character' });
    }
  }
);

/**
 * POST /api/characters/:id/set-level/:level
 * Set character to specific level
 */
router.post(
  '/:id/set-level/:level',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { id, level } = req.params;
      const userId = (req as any).userId;
      const targetLevel = parseInt(level);

      // Validate level
      const validation = levelingService.validateLevel(targetLevel);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      // Get character
      const character = await Character.findOne({
        _id: id,
        userId,
      });

      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      // Validate leveling request
      const levelValidation = levelingService.validateLevelingRequest(
        character as any,
        targetLevel
      );
      if (!levelValidation.valid) {
        return res.status(400).json({ error: levelValidation.error });
      }

      const currentLevel = character.derivedStats.totalLevel || 1;
      const levelDiff = targetLevel - currentLevel;
      const conModifier =
        Math.floor((character.attributes.abilityScores.con.total - 10) / 2);

      // Calculate total stats change
      let totalHPGain = 0;
      let totalSkillPointsGain = 0;

      const classes = character.attributes.classes as any[];
      const intModifier =
        Math.floor((character.attributes.abilityScores.int.total - 10) / 2);

      for (let i = 0; i < levelDiff; i++) {
        if (classes && Array.isArray(classes)) {
          for (const charClass of classes) {
            const hpGain = levelingService.calculateHPGain(
              charClass.hitDie,
              conModifier
            );
            totalHPGain += hpGain;

            const skillGain = levelingService.calculateSkillPointsGain(
              2,
              intModifier
            );
            totalSkillPointsGain += skillGain;
          }
        }
      }

      // Update character
      character.derivedStats.totalLevel = targetLevel;
      character.derivedStats.hitPoints.current += totalHPGain;
      character.derivedStats.hitPoints.max += totalHPGain;
      character.derivedStats.skillPoints.remaining += totalSkillPointsGain;

      // Add advancement records
      for (let i = currentLevel + 1; i <= targetLevel; i++) {
        const record = levelingService.createAdvancementRecord(i, 0, 0);
        character.levelHistory = character.levelHistory || [];
        character.levelHistory.push(record as any);
      }

      // Save character
      await character.save();

      return res.status(200).json({
        character,
        summary: {
          previousLevel: currentLevel,
          newLevel: targetLevel,
          totalHPGain,
          totalSkillPointsGain,
        },
      });
    } catch (error) {
      console.error('Set level error:', error);
      return res.status(500).json({ error: 'Failed to set character level' });
    }
  }
);

/**
 * GET /api/characters/:id/advancement
 * Get advancement options for next level
 */
router.get('/:id/advancement', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    // Get character
    const character = await Character.findOne({
      _id: id,
      userId,
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const currentLevel = character.derivedStats.totalLevel || 1;
    const nextLevel = currentLevel + 1;

    if (nextLevel > 20) {
      return res.status(400).json({
        error: 'Character is already at maximum level',
        level: currentLevel,
      });
    }

    const advancement = levelingService.getAdvancementOptions(
      character as any,
      nextLevel
    );

    return res.status(200).json({
      currentLevel,
      nextLevel,
      advancement,
      experienceTable: {
        currentLevelExp: levelingService.getExperienceForLevel(currentLevel),
        nextLevelExp: levelingService.getExperienceForLevel(nextLevel),
      },
    });
  } catch (error) {
    console.error('Get advancement error:', error);
    return res
      .status(500)
      .json({ error: 'Failed to get advancement options' });
  }
});

/**
 * POST /api/characters/:id/ability-improvement
 * Apply ability score improvement at level up
 */
router.post(
  '/:id/ability-improvement',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { level, ability } = req.body;
      const userId = (req as any).userId;

      // Validate input
      if (!level || !ability) {
        return res
          .status(400)
          .json({ error: 'Level and ability are required' });
      }

      const validAbilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
      if (!validAbilities.includes(ability)) {
        return res.status(400).json({ error: 'Invalid ability' });
      }

      // Get character
      const character = await Character.findOne({
        _id: id,
        userId,
      });

      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      // Apply improvement
      const applied = levelingService.applyAbilityScoreImprovement(
        character as any,
        level,
        ability
      );

      if (!applied) {
        return res.status(400).json({
          error: `No ability score improvement available at level ${level}`,
        });
      }

      // Track improvement
      character.abilityScoreImprovements = character.abilityScoreImprovements || [];
      character.abilityScoreImprovements.push({
        level,
        ability,
        appliedAt: new Date(),
      });

      // Save character
      await character.save();

      return res.status(200).json({
        character,
        improvement: {
          level,
          ability,
          newScore: (character.attributes.abilityScores as any)[ability].total,
        },
      });
    } catch (error) {
      console.error('Ability improvement error:', error);
      return res
        .status(500)
        .json({ error: 'Failed to apply ability improvement' });
    }
  }
);

/**
 * GET /api/characters/:id/level-history
 * Get character level history and advancement log
 */
router.get('/:id/level-history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    // Get character
    const character = await Character.findOne({
      _id: id,
      userId,
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    return res.status(200).json({
      currentLevel: character.derivedStats.totalLevel || 1,
      experience: character.experience || 0,
      levelHistory: character.levelHistory || [],
      abilityScoreImprovements: character.abilityScoreImprovements || [],
    });
  } catch (error) {
    console.error('Get level history error:', error);
    return res.status(500).json({ error: 'Failed to get level history' });
  }
});

export default router;
