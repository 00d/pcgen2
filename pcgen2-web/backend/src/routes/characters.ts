import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { authMiddleware } from '../middleware/auth';
import { createApiError } from '../middleware/errorHandler';
import characterService from '../services/characterService';

const router = Router();

// Middleware: verify authentication for all routes
router.use(authMiddleware);

const createCharacterSchema = Joi.object({
  name: Joi.string().required().max(100),
  campaign: Joi.string().default('Pathfinder 1e'),
});

// GET /api/characters
router.get('/', async (req: Request, res: Response) => {
  const characters = await characterService.getUserCharacters(req.userId!);
  res.status(200).json({ characters });
});

// POST /api/characters
router.post('/', async (req: Request, res: Response) => {
  const { error, value } = createCharacterSchema.validate(req.body);

  if (error) {
    throw createApiError(error.details[0].message, 400, 'VALIDATION_ERROR');
  }

  const character = await characterService.createCharacter(req.userId!, {
    name: value.name,
    campaign: value.campaign,
  });

  res.status(201).json({ message: 'Character created', character });
});

// GET /api/characters/:id
router.get('/:id', async (req: Request, res: Response) => {
  const character = await characterService.getCharacterById(req.params.id, req.userId!);
  res.status(200).json({ character });
});

// PUT /api/characters/:id
router.put('/:id', async (req: Request, res: Response) => {
  const character = await characterService.updateCharacter(req.params.id, req.userId!, req.body);
  res.status(200).json({ message: 'Character updated', character });
});

// DELETE /api/characters/:id
router.delete('/:id', async (req: Request, res: Response) => {
  await characterService.deleteCharacter(req.params.id, req.userId!);
  res.status(200).json({ message: 'Character deleted' });
});

// POST /api/characters/:id/set-race
router.post('/:id/set-race', async (req: Request, res: Response) => {
  const { raceId } = req.body;

  if (!raceId) {
    throw createApiError('raceId is required', 400, 'MISSING_FIELD');
  }

  const character = await characterService.applyRaceToCharacter(req.params.id, req.userId!, raceId);
  res.status(200).json({ message: 'Race applied', character });
});

// POST /api/characters/:id/add-class
router.post('/:id/add-class', async (req: Request, res: Response) => {
  const { classId } = req.body;

  if (!classId) {
    throw createApiError('classId is required', 400, 'MISSING_FIELD');
  }

  const character = await characterService.addClassToCharacter(req.params.id, req.userId!, classId);
  res.status(200).json({ message: 'Class added', character });
});

export default router;
