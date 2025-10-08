/**
 * Phase 5: Spell Management API Routes
 * Endpoints for spell management, preparation, and casting
 */

import express, { Router, Request, Response } from 'express';
import { Character } from '../models/Character';
import { authMiddleware } from '../middleware/auth';
import spellService from '../services/spellService';

const router: Router = express.Router();

/**
 * GET /api/spells
 * Get all available spells
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const level = req.query.level as string | undefined;
    const school = req.query.school as string | undefined;
    const className = req.query.class as string | undefined;

    let spells;
    if (level) {
      spells = spellService.getSpellsByLevel(parseInt(level));
    } else if (school) {
      spells = spellService.getSpellsBySchool(school);
    } else if (className) {
      spells = spellService.getSpellsByClass(className);
    } else {
      spells = spellService.getAllSpells();
    }

    return res.status(200).json({ spells });
  } catch (error) {
    console.error('Get spells error:', error);
    return res.status(500).json({ error: 'Failed to get spells' });
  }
});

/**
 * GET /api/spells/:id
 * Get specific spell by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const spell = spellService.getSpellById(id);

    if (!spell) {
      return res.status(404).json({ error: 'Spell not found' });
    }

    return res.status(200).json({ spell });
  } catch (error) {
    console.error('Get spell error:', error);
    return res.status(500).json({ error: 'Failed to get spell' });
  }
});

/**
 * GET /api/spells/schools
 * Get all spell schools
 */
router.get('/schools', async (req: Request, res: Response) => {
  try {
    const schools = spellService.getSchools();
    return res.status(200).json({ schools });
  } catch (error) {
    console.error('Get schools error:', error);
    return res.status(500).json({ error: 'Failed to get schools' });
  }
});

/**
 * POST /api/spells/search
 * Search spells by name, description, or school
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query required' });
    }

    const results = spellService.searchSpells(query);

    return res.status(200).json({
      query,
      count: results.length,
      spells: results,
    });
  } catch (error) {
    console.error('Search spells error:', error);
    return res.status(500).json({ error: 'Failed to search spells' });
  }
});

/**
 * GET /api/characters/:id/spells
 * Get character's spells (known/prepared)
 */
router.get('/characters/:id', authMiddleware, async (req: Request, res: Response) => {
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

    const spells = (character as any).spells || {
      known: [],
      prepared: [],
      slots: [],
    };

    return res.status(200).json({ spells });
  } catch (error) {
    console.error('Get character spells error:', error);
    return res.status(500).json({ error: 'Failed to get character spells' });
  }
});

/**
 * POST /api/characters/:id/spells/known
 * Add spell to known spells (Sorcerer/Bard)
 */
router.post('/characters/:id/known', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { spellId } = req.body;
    const userId = (req as any).userId;

    // Validate input
    if (!spellId) {
      return res.status(400).json({ error: 'Spell ID required' });
    }

    // Get character
    const character = await Character.findOne({
      _id: id,
      userId,
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Add known spell
    const success = spellService.addKnownSpell(character as any, spellId);
    if (!success) {
      return res.status(400).json({ error: 'Failed to add spell or spell already known' });
    }

    // Save character
    await character.save();

    return res.status(200).json({
      character,
      spells: (character as any).spells,
    });
  } catch (error) {
    console.error('Add known spell error:', error);
    return res.status(500).json({ error: 'Failed to add spell' });
  }
});

/**
 * POST /api/characters/:id/spells/prepared
 * Prepare a spell (Cleric/Wizard)
 */
router.post('/characters/:id/prepared', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { spellId } = req.body;
    const userId = (req as any).userId;

    // Validate input
    if (!spellId) {
      return res.status(400).json({ error: 'Spell ID required' });
    }

    // Get character
    const character = await Character.findOne({
      _id: id,
      userId,
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Prepare spell
    const success = spellService.prepareSpell(character as any, spellId);
    if (!success) {
      return res.status(400).json({ error: 'Failed to prepare spell or spell already prepared' });
    }

    // Save character
    await character.save();

    return res.status(200).json({
      character,
      spells: (character as any).spells,
    });
  } catch (error) {
    console.error('Prepare spell error:', error);
    return res.status(500).json({ error: 'Failed to prepare spell' });
  }
});

/**
 * DELETE /api/characters/:id/spells/prepared/:spellId
 * Unprepare a spell
 */
router.delete(
  '/characters/:id/prepared/:spellId',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { id, spellId } = req.params;
      const userId = (req as any).userId;

      // Get character
      const character = await Character.findOne({
        _id: id,
        userId,
      });

      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      // Unprepare spell
      const success = spellService.unprepareSpell(character as any, spellId);
      if (!success) {
        return res.status(404).json({ error: 'Spell not prepared on character' });
      }

      // Save character
      await character.save();

      return res.status(200).json({
        character,
        spells: (character as any).spells,
      });
    } catch (error) {
      console.error('Unprepare spell error:', error);
      return res.status(500).json({ error: 'Failed to unprepare spell' });
    }
  }
);

/**
 * GET /api/characters/:id/spell-slots
 * Get character's spell slots
 */
router.get('/characters/:id/slots', authMiddleware, async (req: Request, res: Response) => {
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

    const spellSlots = ((character as any).spells?.slots || []) as any[];
    const classInfo = (character as any).attributes?.classes || [];

    return res.status(200).json({
      spellSlots,
      classes: classInfo,
    });
  } catch (error) {
    console.error('Get spell slots error:', error);
    return res.status(500).json({ error: 'Failed to get spell slots' });
  }
});

/**
 * POST /api/characters/:id/cast-spell
 * Cast a spell (use a spell slot)
 */
router.post('/characters/:id/cast', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { spellLevel } = req.body;
    const userId = (req as any).userId;

    // Validate input
    if (spellLevel === undefined || typeof spellLevel !== 'number') {
      return res.status(400).json({ error: 'Spell level required' });
    }

    // Get character
    const character = await Character.findOne({
      _id: id,
      userId,
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Cast spell
    const success = spellService.castSpell(character as any, spellLevel);
    if (!success) {
      return res.status(400).json({ error: 'No spell slots available' });
    }

    // Save character
    await character.save();

    return res.status(200).json({
      character,
      spells: (character as any).spells,
    });
  } catch (error) {
    console.error('Cast spell error:', error);
    return res.status(500).json({ error: 'Failed to cast spell' });
  }
});

/**
 * POST /api/characters/:id/rest
 * Rest and regain spell slots
 */
router.post('/characters/:id/rest', authMiddleware, async (req: Request, res: Response) => {
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

    // Rest and regain slots
    spellService.restAndRegainSlots(character as any);

    // Save character
    await character.save();

    return res.status(200).json({
      character,
      spells: (character as any).spells,
    });
  } catch (error) {
    console.error('Rest error:', error);
    return res.status(500).json({ error: 'Failed to rest' });
  }
});

export default router;
