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

// GET /api/characters/:id/export (JSON)
router.get('/:id/export/json', async (req: Request, res: Response) => {
  const character = await characterService.getCharacterById(req.params.id, req.userId!);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${character.name.replace(/\s+/g, '_')}_character.json"`);
  res.status(200).json(character);
});

// GET /api/characters/:id/export (Markdown)
router.get('/:id/export/markdown', async (req: Request, res: Response) => {
  const character = await characterService.getCharacterById(req.params.id, req.userId!);
  const char = character as any;

  const raceName = typeof char.attributes?.race === 'object'
    ? char.attributes.race.name
    : 'No Race';

  const className = char.attributes?.classes?.[0]?.name || 'No Class';
  const classLevel = char.attributes?.classes?.[0]?.level || 1;

  const abilities = char.attributes?.abilityScores || {};
  const getModifier = (ability: string) => {
    const score = abilities[ability as keyof typeof abilities]?.total || 10;
    return Math.floor((score - 10) / 2);
  };

  const hp = char.derivedStats?.hitPoints?.max || 0;
  const ac = char.derivedStats?.armorClass?.total || 10;
  const bab = char.derivedStats?.baseAttackBonus || 0;
  const initiative = char.derivedStats?.initiative || 0;

  const savingThrows = char.derivedStats?.savingThrows || {};

  const markdown = `# ${character.name}

## Character Information
- **Race:** ${raceName}
- **Class:** ${className} (Level ${classLevel})
- **Campaign:** ${character.campaign || 'No Campaign'}
- **Created:** ${new Date(character.createdAt || new Date()).toLocaleDateString()}

---

## Ability Scores
| Ability | Score | Modifier |
|---------|-------|----------|
| Strength (STR) | ${abilities.str?.total || 10} | ${getModifier('str') >= 0 ? '+' : ''}${getModifier('str')} |
| Dexterity (DEX) | ${abilities.dex?.total || 10} | ${getModifier('dex') >= 0 ? '+' : ''}${getModifier('dex')} |
| Constitution (CON) | ${abilities.con?.total || 10} | ${getModifier('con') >= 0 ? '+' : ''}${getModifier('con')} |
| Intelligence (INT) | ${abilities.int?.total || 10} | ${getModifier('int') >= 0 ? '+' : ''}${getModifier('int')} |
| Wisdom (WIS) | ${abilities.wis?.total || 10} | ${getModifier('wis') >= 0 ? '+' : ''}${getModifier('wis')} |
| Charisma (CHA) | ${abilities.cha?.total || 10} | ${getModifier('cha') >= 0 ? '+' : ''}${getModifier('cha')} |

---

## Combat Statistics
- **Hit Points:** ${hp}
- **Armor Class:** ${ac}
- **Base Attack Bonus:** ${bab >= 0 ? '+' : ''}${bab}
- **Initiative:** ${initiative >= 0 ? '+' : ''}${initiative}

### Saving Throws
- **Fortitude:** ${(savingThrows.fortitude || 0) >= 0 ? '+' : ''}${savingThrows.fortitude || 0}
- **Reflex:** ${(savingThrows.reflex || 0) >= 0 ? '+' : ''}${savingThrows.reflex || 0}
- **Will:** ${(savingThrows.will || 0) >= 0 ? '+' : ''}${savingThrows.will || 0}

---

## Skills
${
  char.skills && char.skills.length > 0
    ? `| Skill | Ability | Ranks | Modifier | Total |
|-------|---------|-------|----------|-------|
${char.skills
  .map(
    (skill: any) =>
      `| ${skill.skillName} | ${skill.abilityModifier} | ${skill.ranks} | ${skill.abilityModifier >= 0 ? '+' : ''}${skill.abilityModifier} ${skill.isClassSkill ? '+3' : ''} | ${skill.total || 0} |`
  )
  .join('\n')}`
    : 'No skills allocated'
}

---

## Feats
${
  char.feats && char.feats.length > 0
    ? char.feats.map((feat: any) => `- **${feat.name}** (${feat.type}): ${feat.benefit}`).join('\n')
    : 'No feats selected'
}

---

## Equipment
${
  char.equipment && char.equipment.length > 0
    ? char.equipment
        .map((item: any) => `- ${item.name} (${item.quantity}x @ ${item.weight} lb${item.weight !== 1 ? 's' : ''})`)
        .join('\n')
    : 'No equipment'
}

---

## Spells
${
  char.spells?.spellsKnown && char.spells.spellsKnown.length > 0
    ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        .map((level) => {
          const spellsAtLevel = char.spells?.spellsKnown?.filter((s: any) => s.level === level) || [];
          if (spellsAtLevel.length === 0) return null;
          return `### Level ${level} ${level === 0 ? '(Cantrips)' : 'Spells'}\n${spellsAtLevel.map((s: any) => `- ${s.name} (${s.school})`).join('\n')}`;
        })
        .filter(Boolean)
        .join('\n\n')
    : 'No spells known'
}

---

*Generated on ${new Date().toLocaleString()}*
`;

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${character.name.replace(/\s+/g, '_')}_character.md"`);
  res.status(200).send(markdown);
});

export default router;
