import { Router, Request, Response } from 'express';
import gameDataService from '../services/gameDataService';

const router = Router();

// GET /api/game-rules/races
router.get('/races', async (req: Request, res: Response) => {
  const races = await gameDataService.getRaces();
  res.status(200).json({ races });
});

// GET /api/game-rules/races/:id
router.get('/races/:id', async (req: Request, res: Response) => {
  const race = await gameDataService.getRaceById(req.params.id);
  res.status(200).json({ race });
});

// GET /api/game-rules/classes
router.get('/classes', async (req: Request, res: Response) => {
  const classes = await gameDataService.getClasses();
  res.status(200).json({ classes });
});

// GET /api/game-rules/classes/:id
router.get('/classes/:id', async (req: Request, res: Response) => {
  const pClass = await gameDataService.getClassById(req.params.id);
  res.status(200).json({ class: pClass });
});

// GET /api/game-rules/feats
router.get('/feats', async (req: Request, res: Response) => {
  const feats = await gameDataService.getFeats();
  res.status(200).json({ feats });
});

// GET /api/game-rules/feats/:id
router.get('/feats/:id', async (req: Request, res: Response) => {
  const feat = await gameDataService.getFeatById(req.params.id);
  res.status(200).json({ feat });
});

// GET /api/game-rules/spells
router.get('/spells', async (req: Request, res: Response) => {
  const spells = await gameDataService.getSpells();
  res.status(200).json({ spells });
});

// GET /api/game-rules/equipment
router.get('/equipment', async (req: Request, res: Response) => {
  const equipment = await gameDataService.getEquipment();
  res.status(200).json({ equipment });
});

// GET /api/game-rules/skills
router.get('/skills', async (req: Request, res: Response) => {
  const skills = await gameDataService.getSkills();
  res.status(200).json({ skills });
});

// POST /api/game-rules/seed (development only)
if (process.env.NODE_ENV === 'development') {
  router.post('/seed', async (req: Request, res: Response) => {
    await gameDataService.seedPathfinderData();
    res.status(200).json({ message: 'Game data seeded successfully' });
  });
}

export default router;
