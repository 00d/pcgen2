import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { createApiError } from '../middleware/errorHandler';
import { Campaign } from '../models/Campaign';
import { Character } from '../models/Character';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/campaigns - List all campaigns for the user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const campaigns = await Campaign.find({ userId })
      .populate('characters', 'name attributes.race attributes.classes')
      .sort({ createdAt: -1 });

    res.status(200).json({
      campaigns,
      count: campaigns.length,
    });
  } catch (error) {
    logger.error('Error fetching campaigns:', error);
    throw createApiError('Failed to fetch campaigns', 500);
  }
});

// GET /api/campaigns/:id - Get campaign details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const campaign = await Campaign.findOne({ _id: id, userId }).populate('characters');

    if (!campaign) {
      throw createApiError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
    }

    res.status(200).json({ campaign });
  } catch (error) {
    if (error instanceof Error && (error as any).status) {
      throw error;
    }
    logger.error('Error fetching campaign:', error);
    throw createApiError('Failed to fetch campaign', 500);
  }
});

// POST /api/campaigns - Create new campaign
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name, description, setting, dungeon_master, notes } = req.body;

    if (!name || name.trim() === '') {
      throw createApiError('Campaign name is required', 400, 'MISSING_FIELD');
    }

    const campaign = new Campaign({
      userId,
      name,
      description: description || '',
      setting: setting || 'Pathfinder 1e',
      dungeon_master: dungeon_master || '',
      characters: [],
      notes: notes || '',
    });

    await campaign.save();

    logger.info(`Campaign created: ${campaign._id}`);

    res.status(201).json({
      campaign,
      message: 'Campaign created successfully',
    });
  } catch (error) {
    if (error instanceof Error && (error as any).status) {
      throw error;
    }
    logger.error('Error creating campaign:', error);
    throw createApiError('Failed to create campaign', 500);
  }
});

// PUT /api/campaigns/:id - Update campaign
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { name, description, setting, dungeon_master, notes } = req.body;

    const campaign = await Campaign.findOne({ _id: id, userId });

    if (!campaign) {
      throw createApiError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
    }

    // Update fields
    if (name !== undefined) campaign.name = name;
    if (description !== undefined) campaign.description = description;
    if (setting !== undefined) campaign.setting = setting;
    if (dungeon_master !== undefined) campaign.dungeon_master = dungeon_master;
    if (notes !== undefined) campaign.notes = notes;

    await campaign.save();

    logger.info(`Campaign updated: ${campaign._id}`);

    res.status(200).json({
      campaign,
      message: 'Campaign updated successfully',
    });
  } catch (error) {
    if (error instanceof Error && (error as any).status) {
      throw error;
    }
    logger.error('Error updating campaign:', error);
    throw createApiError('Failed to update campaign', 500);
  }
});

// DELETE /api/campaigns/:id - Delete campaign
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const campaign = await Campaign.findOneAndDelete({ _id: id, userId });

    if (!campaign) {
      throw createApiError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
    }

    logger.info(`Campaign deleted: ${id}`);

    res.status(200).json({
      message: 'Campaign deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error && (error as any).status) {
      throw error;
    }
    logger.error('Error deleting campaign:', error);
    throw createApiError('Failed to delete campaign', 500);
  }
});

// POST /api/campaigns/:id/characters - Add character to campaign
router.post('/:id/characters', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { characterId } = req.body;

    if (!characterId) {
      throw createApiError('Character ID is required', 400, 'MISSING_FIELD');
    }

    // Verify campaign exists and belongs to user
    const campaign = await Campaign.findOne({ _id: id, userId });
    if (!campaign) {
      throw createApiError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
    }

    // Verify character exists and belongs to user
    const character = await Character.findOne({ _id: characterId, userId });
    if (!character) {
      throw createApiError('Character not found', 404, 'CHARACTER_NOT_FOUND');
    }

    // Check if character already in campaign
    if (campaign.characters.includes(character._id)) {
      throw createApiError('Character already in campaign', 400, 'ALREADY_ADDED');
    }

    // Add character to campaign
    campaign.characters.push(character._id);
    await campaign.save();

    logger.info(`Character ${characterId} added to campaign ${id}`);

    res.status(200).json({
      campaign,
      message: 'Character added to campaign',
    });
  } catch (error) {
    if (error instanceof Error && (error as any).status) {
      throw error;
    }
    logger.error('Error adding character to campaign:', error);
    throw createApiError('Failed to add character to campaign', 500);
  }
});

// DELETE /api/campaigns/:id/characters/:characterId - Remove character from campaign
router.delete('/:id/characters/:characterId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id, characterId } = req.params;

    const campaign = await Campaign.findOne({ _id: id, userId });

    if (!campaign) {
      throw createApiError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
    }

    // Remove character from campaign
    campaign.characters = campaign.characters.filter((cId) => cId.toString() !== characterId);
    await campaign.save();

    logger.info(`Character ${characterId} removed from campaign ${id}`);

    res.status(200).json({
      campaign,
      message: 'Character removed from campaign',
    });
  } catch (error) {
    if (error instanceof Error && (error as any).status) {
      throw error;
    }
    logger.error('Error removing character from campaign:', error);
    throw createApiError('Failed to remove character from campaign', 500);
  }
});

// GET /api/campaigns/:id/characters - Get all characters in a campaign
router.get('/:id/characters', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const campaign = await Campaign.findOne({ _id: id, userId }).populate('characters');

    if (!campaign) {
      throw createApiError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
    }

    res.status(200).json({
      characters: campaign.characters,
      count: campaign.characters.length,
    });
  } catch (error) {
    if (error instanceof Error && (error as any).status) {
      throw error;
    }
    logger.error('Error fetching campaign characters:', error);
    throw createApiError('Failed to fetch campaign characters', 500);
  }
});

export default router;
