/**
 * Phase 5: Equipment Management API Routes
 * Endpoints for character equipment management and encumbrance tracking
 */

import express, { Router, Request, Response } from 'express';
import { Character } from '../models/Character';
import { authMiddleware } from '../middleware/auth';
import equipmentService from '../services/equipmentService';

const router: Router = express.Router();

/**
 * GET /api/equipment
 * Get all available equipment
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;

    let equipment;
    if (category) {
      equipment = equipmentService.getEquipmentByCategory(category);
    } else {
      equipment = equipmentService.getAllEquipment();
    }

    return res.status(200).json({ equipment });
  } catch (error) {
    console.error('Get equipment error:', error);
    return res.status(500).json({ error: 'Failed to get equipment' });
  }
});

/**
 * GET /api/equipment/:id
 * Get specific equipment by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const equipment = equipmentService.getEquipmentById(id);

    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    return res.status(200).json({ equipment });
  } catch (error) {
    console.error('Get equipment error:', error);
    return res.status(500).json({ error: 'Failed to get equipment' });
  }
});

/**
 * POST /api/equipment/search
 * Search equipment by name or description
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query required' });
    }

    const results = equipmentService.searchEquipment(query);

    return res.status(200).json({
      query,
      count: results.length,
      equipment: results,
    });
  } catch (error) {
    console.error('Search equipment error:', error);
    return res.status(500).json({ error: 'Failed to search equipment' });
  }
});

/**
 * POST /api/characters/:id/equipment
 * Add equipment to character
 */
router.post('/characters/:id/add', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { equipmentId, quantity = 1, equipped = false } = req.body;
    const userId = (req as any).userId;

    // Validate input
    if (!equipmentId) {
      return res.status(400).json({ error: 'Equipment ID required' });
    }

    // Get equipment
    const equipment = equipmentService.getEquipmentById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    // Get character
    const character = await Character.findOne({
      _id: id,
      userId,
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Add equipment to character
    const characterEquipment = character.equipment || [];

    // Check if already have this equipment
    const existingIndex = characterEquipment.findIndex(
      (eq: any) => eq.id === equipmentId
    );

    if (existingIndex >= 0) {
      // Increase quantity
      (characterEquipment[existingIndex] as any).quantity += quantity;
    } else {
      // Add new equipment
      characterEquipment.push({
        id: equipmentId,
        name: equipment.name,
        type: equipment.type,
        cost: equipment.cost,
        weight: equipment.weight,
        equipped,
        quantity,
        description: equipment.description,
      } as any);
    }

    character.equipment = characterEquipment;

    // Save character
    await character.save();

    return res.status(200).json({
      character,
      equipment: characterEquipment,
    });
  } catch (error) {
    console.error('Add equipment error:', error);
    return res.status(500).json({ error: 'Failed to add equipment' });
  }
});

/**
 * DELETE /api/characters/:id/equipment/:equipmentId
 * Remove equipment from character
 */
router.delete(
  '/characters/:id/equipment/:equipmentId',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { id, equipmentId } = req.params;
      const userId = (req as any).userId;

      // Get character
      const character = await Character.findOne({
        _id: id,
        userId,
      });

      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      // Remove equipment
      const characterEquipment = character.equipment || [];
      const filteredEquipment = characterEquipment.filter(
        (eq: any) => eq.id !== equipmentId
      );

      if (filteredEquipment.length === characterEquipment.length) {
        return res.status(404).json({ error: 'Equipment not found on character' });
      }

      character.equipment = filteredEquipment;

      // Save character
      await character.save();

      return res.status(200).json({
        character,
        equipment: filteredEquipment,
      });
    } catch (error) {
      console.error('Remove equipment error:', error);
      return res.status(500).json({ error: 'Failed to remove equipment' });
    }
  }
);

/**
 * PUT /api/characters/:id/equipment/:equipmentId
 * Equip/unequip equipment
 */
router.put(
  '/characters/:id/equipment/:equipmentId',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { id, equipmentId } = req.params;
      const { equipped, quantity } = req.body;
      const userId = (req as any).userId;

      // Get character
      const character = await Character.findOne({
        _id: id,
        userId,
      });

      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      // Update equipment
      const characterEquipment = character.equipment || [];
      const equipmentIndex = characterEquipment.findIndex(
        (eq: any) => eq.id === equipmentId
      );

      if (equipmentIndex === -1) {
        return res.status(404).json({ error: 'Equipment not found on character' });
      }

      if (equipped !== undefined) {
        (characterEquipment[equipmentIndex] as any).equipped = equipped;
      }

      if (quantity !== undefined && quantity > 0) {
        (characterEquipment[equipmentIndex] as any).quantity = quantity;
      }

      character.equipment = characterEquipment;

      // Validate equipment configuration
      const validation = equipmentService.validateEquipment(
        characterEquipment as any
      );
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      // Save character
      await character.save();

      return res.status(200).json({
        character,
        equipment: characterEquipment,
      });
    } catch (error) {
      console.error('Update equipment error:', error);
      return res.status(500).json({ error: 'Failed to update equipment' });
    }
  }
);

/**
 * GET /api/characters/:id/equipment-summary
 * Get character equipment summary (weight, AC, encumbrance)
 */
router.get(
  '/characters/:id/summary',
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

      const equipment = character.equipment || [];

      // Get equipment summary
      const summary = equipmentService.getEquipmentSummary(
        equipment as any,
        character as any
      );

      const loadStatus = equipmentService.getLoadStatus(
        summary.totalWeight,
        (character.attributes.abilityScores.str as any)?.total || 10
      );

      return res.status(200).json({
        equipment: summary,
        loadStatus,
      });
    } catch (error) {
      console.error('Get equipment summary error:', error);
      return res.status(500).json({ error: 'Failed to get equipment summary' });
    }
  }
);

/**
 * GET /api/characters/:id/equipment
 * Get character equipment list
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

    const equipment = character.equipment || [];

    return res.status(200).json({
      equipment,
      count: equipment.length,
      totalWeight: equipmentService.calculateTotalWeight(equipment as any),
    });
  } catch (error) {
    console.error('Get character equipment error:', error);
    return res.status(500).json({ error: 'Failed to get character equipment' });
  }
});

export default router;
