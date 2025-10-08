/**
 * Phase 5: Character Export API Routes
 * Endpoints for exporting character sheets to JSON and HTML formats
 */

import express, { Router, Request, Response } from 'express';
import { Character } from '../models/Character';
import { authMiddleware } from '../middleware/auth';
import exportService from '../services/exportService';

const router: Router = express.Router();

/**
 * GET /api/characters/:id/export/json
 * Export character as JSON
 */
router.get('/characters/:id/json', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const includeEquipment = req.query.equipment !== 'false';
    const includeSpells = req.query.spells !== 'false';

    // Get character
    const character = await Character.findOne({
      _id: id,
      userId,
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Validate character can be exported
    const validation = exportService.validateCharacterForExport(character);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Export to JSON
    const json = exportService.exportAsJSON(character, {
      includeEquipment,
      includeSpells,
    });

    // Generate filename
    const filename = exportService.generateFilename(character, 'json');

    // Set response headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return res.status(200).send(json);
  } catch (error) {
    console.error('Export to JSON error:', error);
    return res.status(500).json({ error: 'Failed to export character' });
  }
});

/**
 * GET /api/characters/:id/export/html
 * Export character as HTML
 */
router.get('/characters/:id/html', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const includeEquipment = req.query.equipment !== 'false';
    const includeSpells = req.query.spells !== 'false';

    // Get character
    const character = await Character.findOne({
      _id: id,
      userId,
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Validate character can be exported
    const validation = exportService.validateCharacterForExport(character);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Export to HTML
    const html = exportService.exportAsHTML(character, {
      includeEquipment,
      includeSpells,
    });

    // Generate filename
    const filename = exportService.generateFilename(character, 'html');

    // Set response headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return res.status(200).send(html);
  } catch (error) {
    console.error('Export to HTML error:', error);
    return res.status(500).json({ error: 'Failed to export character' });
  }
});

/**
 * POST /api/characters/:id/export/preview
 * Get preview of exported character (JSON format)
 */
router.post('/characters/:id/preview', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const { includeEquipment = true, includeSpells = true } = req.body;

    // Get character
    const character = await Character.findOne({
      _id: id,
      userId,
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Validate character can be exported
    const validation = exportService.validateCharacterForExport(character);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Format for preview
    const preview = exportService.formatCharacterForExport(character, {
      includeEquipment,
      includeSpells,
    });

    return res.status(200).json({ preview });
  } catch (error) {
    console.error('Export preview error:', error);
    return res.status(500).json({ error: 'Failed to generate export preview' });
  }
});

/**
 * POST /api/characters/batch-export/json
 * Export multiple characters as JSON array
 */
router.post('/batch-json', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { characterIds = [], includeEquipment = true, includeSpells = true } = req.body;

    // Validate input
    if (!Array.isArray(characterIds) || characterIds.length === 0) {
      return res.status(400).json({ error: 'Character IDs array required' });
    }

    if (characterIds.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 characters per batch export' });
    }

    // Get characters
    const characters = await Character.find({
      _id: { $in: characterIds },
      userId,
    });

    if (characters.length === 0) {
      return res.status(404).json({ error: 'No characters found' });
    }

    // Export all characters
    const exports = characters.map((character) => {
      const validation = exportService.validateCharacterForExport(character);
      if (!validation.valid) {
        return {
          id: character._id,
          error: validation.error,
        };
      }

      return exportService.formatCharacterForExport(character, {
        includeEquipment,
        includeSpells,
      });
    });

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `characters-batch-${timestamp}.json`;

    // Set response headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return res.status(200).json({
      count: exports.length,
      timestamp: new Date().toISOString(),
      exports,
    });
  } catch (error) {
    console.error('Batch export error:', error);
    return res.status(500).json({ error: 'Failed to export characters' });
  }
});

/**
 * GET /api/characters/:id/export/validation
 * Validate character can be exported
 */
router.get('/characters/:id/validation', authMiddleware, async (req: Request, res: Response) => {
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

    // Validate character
    const validation = exportService.validateCharacterForExport(character);

    return res.status(200).json({ validation });
  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({ error: 'Failed to validate character' });
  }
});

export default router;
