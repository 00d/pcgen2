import { GameRule, IGameRule } from '../models/GameRule';
import { getCachedData, setCachedData, deleteCachedData } from '../config/redis';
import { createApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { EXTENDED_SPELLS, CLASS_SKILLS, FEAT_PREREQUISITES } from './gameData3cService';

const CACHE_TTL = 86400; // 24 hours

export class GameDataService {
  async getRaces(): Promise<IGameRule[]> {
    const cacheKey = 'game_rules:races';

    try {
      // Try cache first
      const cached = await getCachedData<IGameRule[]>(cacheKey);
      if (cached) {
        logger.debug('Returning cached races');
        return cached;
      }

      // Fetch from database
      const races = await GameRule.find({ type: 'race' }).sort({ name: 1 });

      // Cache the result
      await setCachedData(cacheKey, races, CACHE_TTL);

      return races;
    } catch (error) {
      logger.error('Error fetching races:', error);
      throw createApiError('Failed to fetch races', 500);
    }
  }

  async getRaceById(id: string): Promise<IGameRule> {
    try {
      const race = await GameRule.findOne({ type: 'race', id });

      if (!race) {
        throw createApiError('Race not found', 404, 'RACE_NOT_FOUND');
      }

      return race;
    } catch (error) {
      if (error instanceof Error && (error as any).status) {
        throw error;
      }
      logger.error('Error fetching race:', error);
      throw createApiError('Failed to fetch race', 500);
    }
  }

  async getClasses(): Promise<IGameRule[]> {
    const cacheKey = 'game_rules:classes';

    try {
      // Try cache first
      const cached = await getCachedData<IGameRule[]>(cacheKey);
      if (cached) {
        logger.debug('Returning cached classes');
        return cached;
      }

      // Fetch from database
      const classes = await GameRule.find({ type: 'class' }).sort({ name: 1 });

      // Cache the result
      await setCachedData(cacheKey, classes, CACHE_TTL);

      return classes;
    } catch (error) {
      logger.error('Error fetching classes:', error);
      throw createApiError('Failed to fetch classes', 500);
    }
  }

  async getClassById(id: string): Promise<IGameRule> {
    try {
      const pClass = await GameRule.findOne({ type: 'class', id });

      if (!pClass) {
        throw createApiError('Class not found', 404, 'CLASS_NOT_FOUND');
      }

      return pClass;
    } catch (error) {
      if (error instanceof Error && (error as any).status) {
        throw error;
      }
      logger.error('Error fetching class:', error);
      throw createApiError('Failed to fetch class', 500);
    }
  }

  async getFeats(): Promise<IGameRule[]> {
    const cacheKey = 'game_rules:feats';

    try {
      const cached = await getCachedData<IGameRule[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const feats = await GameRule.find({ type: 'feat' }).sort({ name: 1 });
      await setCachedData(cacheKey, feats, CACHE_TTL);

      return feats;
    } catch (error) {
      logger.error('Error fetching feats:', error);
      throw createApiError('Failed to fetch feats', 500);
    }
  }

  async getFeatById(id: string): Promise<IGameRule> {
    try {
      const feat = await GameRule.findOne({ type: 'feat', id });

      if (!feat) {
        throw createApiError('Feat not found', 404, 'FEAT_NOT_FOUND');
      }

      return feat;
    } catch (error) {
      if (error instanceof Error && (error as any).status) {
        throw error;
      }
      logger.error('Error fetching feat:', error);
      throw createApiError('Failed to fetch feat', 500);
    }
  }

  async getSpells(): Promise<IGameRule[]> {
    const cacheKey = 'game_rules:spells';

    try {
      const cached = await getCachedData<IGameRule[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const spells = await GameRule.find({ type: 'spell' }).sort({ name: 1 });
      await setCachedData(cacheKey, spells, CACHE_TTL);

      return spells;
    } catch (error) {
      logger.error('Error fetching spells:', error);
      throw createApiError('Failed to fetch spells', 500);
    }
  }

  async getEquipment(): Promise<IGameRule[]> {
    const cacheKey = 'game_rules:equipment';

    try {
      const cached = await getCachedData<IGameRule[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const equipment = await GameRule.find({ type: 'equipment' }).sort({ name: 1 });
      await setCachedData(cacheKey, equipment, CACHE_TTL);

      return equipment;
    } catch (error) {
      logger.error('Error fetching equipment:', error);
      throw createApiError('Failed to fetch equipment', 500);
    }
  }

  async getSkills(): Promise<any[]> {
    // Skills don't need to be in the database, they're static
    // Return them directly with caching
    const cacheKey = 'game_rules:skills';

    try {
      const cached = await getCachedData<any[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const skills = this.getPathfinderSkills();
      await setCachedData(cacheKey, skills, CACHE_TTL);

      return skills;
    } catch (error) {
      logger.error('Error fetching skills:', error);
      throw createApiError('Failed to fetch skills', 500);
    }
  }

  async seedPathfinderData(): Promise<void> {
    try {
      // Check if data already exists
      const existingCount = await GameRule.countDocuments();
      if (existingCount > 0) {
        logger.info('Game rules already seeded, skipping');
        return;
      }

      logger.info('Seeding Pathfinder game rules...');

      const races = this.getPathfinderRaces();
      const classes = this.getPathfinderClasses();
      const feats = this.getPathfinderFeats();
      const spells = this.getPathfinderSpells();
      const equipment = this.getPathfinderEquipment();

      // Insert all data
      await GameRule.insertMany(races);
      logger.info(`Inserted ${races.length} races`);

      await GameRule.insertMany(classes);
      logger.info(`Inserted ${classes.length} classes`);

      await GameRule.insertMany(feats);
      logger.info(`Inserted ${feats.length} feats`);

      await GameRule.insertMany(spells);
      logger.info(`Inserted ${spells.length} spells`);

      await GameRule.insertMany(equipment);
      logger.info(`Inserted ${equipment.length} equipment items`);

      // Clear all caches
      await deleteCachedData('game_rules:races');
      await deleteCachedData('game_rules:classes');
      await deleteCachedData('game_rules:feats');
      await deleteCachedData('game_rules:spells');
      await deleteCachedData('game_rules:equipment');

      logger.info('Pathfinder data seeding complete');
    } catch (error) {
      logger.error('Error seeding Pathfinder data:', error);
      throw createApiError('Failed to seed game data', 500);
    }
  }

  private getPathfinderRaces() {
    return [
      {
        type: 'race',
        id: 'human',
        name: 'Human',
        source: 'Core Rulebook',
        data: {
          size: 'Medium',
          speed: 30,
          languages: ['Common'],
          traits: [
            {
              id: 'bonus_feat',
              name: 'Bonus Feat',
              description: 'Humans gain one bonus feat at 1st level.',
            },
            {
              id: 'bonus_skill_points',
              name: 'Bonus Skill Points',
              description: 'Humans gain one extra skill point per level.',
            },
          ],
          abilityAdjustments: {},
        },
      },
      {
        type: 'race',
        id: 'dwarf',
        name: 'Dwarf',
        source: 'Core Rulebook',
        data: {
          size: 'Medium',
          speed: 20,
          languages: ['Common', 'Dwarven'],
          traits: [
            {
              id: 'darkvision',
              name: 'Darkvision',
              description: 'Dwarves can see in the dark up to 60 feet.',
            },
            {
              id: 'stonecunning',
              name: 'Stonecunning',
              description: 'Dwarves gain +2 to Perception checks related to stone.',
            },
          ],
          abilityAdjustments: {
            con: 2,
            cha: -2,
          },
        },
      },
      {
        type: 'race',
        id: 'elf',
        name: 'Elf',
        source: 'Core Rulebook',
        data: {
          size: 'Medium',
          speed: 30,
          languages: ['Common', 'Elven'],
          traits: [
            {
              id: 'darkvision',
              name: 'Darkvision',
              description: 'Elves can see in the dark up to 60 feet.',
            },
            {
              id: 'keen_senses',
              name: 'Keen Senses',
              description: 'Elves gain +2 to Perception checks.',
            },
          ],
          abilityAdjustments: {
            dex: 2,
            con: -2,
          },
        },
      },
      {
        type: 'race',
        id: 'gnome',
        name: 'Gnome',
        source: 'Core Rulebook',
        data: {
          size: 'Small',
          speed: 20,
          languages: ['Common', 'Gnome'],
          traits: [
            {
              id: 'darkvision',
              name: 'Darkvision',
              description: 'Gnomes can see in the dark up to 60 feet.',
            },
          ],
          abilityAdjustments: {
            con: 2,
            cha: 1,
          },
        },
      },
      {
        type: 'race',
        id: 'half-elf',
        name: 'Half-Elf',
        source: 'Core Rulebook',
        data: {
          size: 'Medium',
          speed: 30,
          languages: ['Common', 'Elven'],
          traits: [
            {
              id: 'low_light_vision',
              name: 'Low-Light Vision',
              description: 'Half-elves can see twice as far as humans in dim light.',
            },
          ],
          abilityAdjustments: {},
        },
      },
      {
        type: 'race',
        id: 'half-orc',
        name: 'Half-Orc',
        source: 'Core Rulebook',
        data: {
          size: 'Medium',
          speed: 30,
          languages: ['Common', 'Orc'],
          traits: [
            {
              id: 'darkvision',
              name: 'Darkvision',
              description: 'Half-orcs can see in the dark up to 60 feet.',
            },
          ],
          abilityAdjustments: {
            str: 2,
            int: -2,
            cha: -2,
          },
        },
      },
      {
        type: 'race',
        id: 'halfling',
        name: 'Halfling',
        source: 'Core Rulebook',
        data: {
          size: 'Small',
          speed: 20,
          languages: ['Common', 'Halfling'],
          traits: [
            {
              id: 'lucky',
              name: 'Lucky',
              description: 'Halflings gain +1 to all saving throws.',
            },
          ],
          abilityAdjustments: {
            dex: 2,
            str: -2,
          },
        },
      },
    ];
  }

  private getPathfinderClasses() {
    const baseClasses = [
      {
        type: 'class',
        id: 'barbarian',
        name: 'Barbarian',
        source: 'Core Rulebook',
        data: {
          hitDie: 'd12',
          baseAttackBonusProgression: 'good',
          savingThrows: {
            fort: 'good',
            ref: 'poor',
            will: 'poor',
          },
          skillsPerLevel: 4,
        },
      },
      {
        type: 'class',
        id: 'bard',
        name: 'Bard',
        source: 'Core Rulebook',
        data: {
          hitDie: 'd8',
          baseAttackBonusProgression: 'moderate',
          savingThrows: {
            fort: 'poor',
            ref: 'good',
            will: 'good',
          },
          skillsPerLevel: 6,
        },
      },
      {
        type: 'class',
        id: 'cleric',
        name: 'Cleric',
        source: 'Core Rulebook',
        data: {
          hitDie: 'd8',
          baseAttackBonusProgression: 'moderate',
          savingThrows: {
            fort: 'good',
            ref: 'poor',
            will: 'good',
          },
          skillsPerLevel: 2,
        },
      },
      {
        type: 'class',
        id: 'druid',
        name: 'Druid',
        source: 'Core Rulebook',
        data: {
          hitDie: 'd8',
          baseAttackBonusProgression: 'moderate',
          savingThrows: {
            fort: 'good',
            ref: 'poor',
            will: 'good',
          },
          skillsPerLevel: 4,
        },
      },
      {
        type: 'class',
        id: 'fighter',
        name: 'Fighter',
        source: 'Core Rulebook',
        data: {
          hitDie: 'd10',
          baseAttackBonusProgression: 'good',
          savingThrows: {
            fort: 'good',
            ref: 'poor',
            will: 'poor',
          },
          skillsPerLevel: 2,
        },
      },
      {
        type: 'class',
        id: 'monk',
        name: 'Monk',
        source: 'Core Rulebook',
        data: {
          hitDie: 'd8',
          baseAttackBonusProgression: 'moderate',
          savingThrows: {
            fort: 'good',
            ref: 'good',
            will: 'good',
          },
          skillsPerLevel: 4,
        },
      },
      {
        type: 'class',
        id: 'paladin',
        name: 'Paladin',
        source: 'Core Rulebook',
        data: {
          hitDie: 'd10',
          baseAttackBonusProgression: 'good',
          savingThrows: {
            fort: 'good',
            ref: 'poor',
            will: 'good',
          },
          skillsPerLevel: 2,
        },
      },
      {
        type: 'class',
        id: 'ranger',
        name: 'Ranger',
        source: 'Core Rulebook',
        data: {
          hitDie: 'd10',
          baseAttackBonusProgression: 'good',
          savingThrows: {
            fort: 'good',
            ref: 'good',
            will: 'poor',
          },
          skillsPerLevel: 6,
        },
      },
      {
        type: 'class',
        id: 'rogue',
        name: 'Rogue',
        source: 'Core Rulebook',
        data: {
          hitDie: 'd8',
          baseAttackBonusProgression: 'moderate',
          savingThrows: {
            fort: 'poor',
            ref: 'good',
            will: 'poor',
          },
          skillsPerLevel: 8,
        },
      },
      {
        type: 'class',
        id: 'sorcerer',
        name: 'Sorcerer',
        source: 'Core Rulebook',
        data: {
          hitDie: 'd6',
          baseAttackBonusProgression: 'poor',
          savingThrows: {
            fort: 'poor',
            ref: 'poor',
            will: 'good',
          },
          skillsPerLevel: 2,
        },
      },
      {
        type: 'class',
        id: 'wizard',
        name: 'Wizard',
        source: 'Core Rulebook',
        data: {
          hitDie: 'd6',
          baseAttackBonusProgression: 'poor',
          savingThrows: {
            fort: 'poor',
            ref: 'poor',
            will: 'good',
          },
          skillsPerLevel: 2,
        },
      },
    ];

    // Add Phase 3c class skills to classes
    return baseClasses.map(pClass => {
      const classSkills = CLASS_SKILLS[pClass.id as keyof typeof CLASS_SKILLS];
      return {
        ...pClass,
        data: {
          ...pClass.data,
          ...(classSkills && { classSkills }),
        },
      };
    });
  }

  private getPathfinderFeats() {
    const baseFeats = [
      {
        type: 'feat',
        id: 'acrobatics',
        name: 'Acrobatics',
        source: 'Core Rulebook',
        data: {
          type: 'General',
          prerequisites: [],
          benefit: 'You gain a +2 bonus on Acrobatics checks.',
          normal: 'No bonus on Acrobatics checks.',
        },
      },
      {
        type: 'feat',
        id: 'alertness',
        name: 'Alertness',
        source: 'Core Rulebook',
        data: {
          type: 'General',
          prerequisites: [],
          benefit: 'You get a +2 bonus on Perception and Sense Motive checks.',
          normal: 'No bonus on these skills.',
        },
      },
      {
        type: 'feat',
        id: 'improved-initiative',
        name: 'Improved Initiative',
        source: 'Core Rulebook',
        data: {
          type: 'Combat',
          prerequisites: [],
          benefit: 'You gain a +4 bonus on initiative checks.',
          normal: 'No bonus on initiative.',
        },
      },
      {
        type: 'feat',
        id: 'iron-will',
        name: 'Iron Will',
        source: 'Core Rulebook',
        data: {
          type: 'General',
          prerequisites: [],
          benefit: 'You gain a +2 bonus on all Will saving throws.',
          normal: 'No bonus on Will saves.',
        },
      },
      {
        type: 'feat',
        id: 'lightning-reflexes',
        name: 'Lightning Reflexes',
        source: 'Core Rulebook',
        data: {
          type: 'General',
          prerequisites: [],
          benefit: 'You gain a +2 bonus on all Reflex saving throws.',
          normal: 'No bonus on Reflex saves.',
        },
      },
      {
        type: 'feat',
        id: 'power-attack',
        name: 'Power Attack',
        source: 'Core Rulebook',
        data: {
          type: 'Combat',
          prerequisites: ['Strength 13', 'Base attack bonus +1'],
          benefit: 'You can make a melee attack with a –1 penalty on the attack roll.',
          normal: 'You cannot get these extra damage values with melee weapons.',
        },
      },
    ];

    // Add Phase 3c prerequisites to feats
    return baseFeats.map(feat => {
      const featPrerequisites = FEAT_PREREQUISITES[feat.id as keyof typeof FEAT_PREREQUISITES];
      return {
        ...feat,
        data: {
          ...feat.data,
          ...(featPrerequisites && { prerequisites: featPrerequisites }),
        },
      };
    });
  }

  private getPathfinderSpells() {
    // Use extended spell database from Phase 3c (97 spells across all levels 0-9)
    return EXTENDED_SPELLS.map(spell => ({
      type: 'spell',
      id: spell.id,
      name: spell.name,
      source: spell.source,
      data: spell.data,
    }));
  }

  private getPathfinderEquipment() {
    return [
      {
        type: 'equipment',
        id: 'padded-armor',
        name: 'Padded Armor',
        source: 'Core Rulebook',
        data: {
          cost: '5 gp',
          weight: 10,
          type: 'Light Armor',
          armor: {
            armorBonus: 1,
            maxDexBonus: 8,
            armorCheckPenalty: 0,
          },
          description: 'Padded armor consists of quilted layers of cloth and batting.',
        },
      },
      {
        type: 'equipment',
        id: 'leather-armor',
        name: 'Leather Armor',
        source: 'Core Rulebook',
        data: {
          cost: '10 gp',
          weight: 15,
          type: 'Light Armor',
          armor: {
            armorBonus: 2,
            maxDexBonus: 6,
            armorCheckPenalty: 0,
          },
          description: 'Leather armor is made from hardened leather.',
        },
      },
      {
        type: 'equipment',
        id: 'chainmail',
        name: 'Chainmail',
        source: 'Core Rulebook',
        data: {
          cost: '150 gp',
          weight: 40,
          type: 'Heavy Armor',
          armor: {
            armorBonus: 5,
            maxDexBonus: 1,
            armorCheckPenalty: -5,
          },
          description: 'This armor consists of overlapping rings of iron sewn to a backing of leather or cloth.',
        },
      },
      {
        type: 'equipment',
        id: 'longsword',
        name: 'Longsword',
        source: 'Core Rulebook',
        data: {
          cost: '15 gp',
          weight: 4,
          type: 'Melee Weapon',
          weapon: {
            damageSmall: '1d6',
            damageMedium: '1d8',
            criticalRange: '19-20',
            criticalMultiplier: 2,
            type: ['Slashing'],
          },
          description: 'A classic long blade suitable for both cutting and thrusting.',
        },
      },
      {
        type: 'equipment',
        id: 'dagger',
        name: 'Dagger',
        source: 'Core Rulebook',
        data: {
          cost: '2 gp',
          weight: 1,
          type: 'Melee Weapon',
          weapon: {
            damageSmall: '1d4',
            damageMedium: '1d4',
            criticalRange: '19-20',
            criticalMultiplier: 2,
            type: ['Piercing', 'Slashing'],
          },
          description: 'A short-bladed weapon.',
        },
      },
    ];
  }

  private getPathfinderSkills() {
    return [
      {
        id: 'acrobatics',
        name: 'Acrobatics',
        ability: 'dex',
        armorPenalty: true,
        description: 'Balance, tumbling, and athletic movement.',
      },
      {
        id: 'appraise',
        name: 'Appraise',
        ability: 'int',
        armorPenalty: false,
        description: 'Value of items and goods.',
      },
      {
        id: 'bluff',
        name: 'Bluff',
        ability: 'cha',
        armorPenalty: false,
        description: 'Deceive and mislead others.',
      },
      {
        id: 'climb',
        name: 'Climb',
        ability: 'str',
        armorPenalty: true,
        description: 'Scale walls and ropes.',
      },
      {
        id: 'diplomacy',
        name: 'Diplomacy',
        ability: 'cha',
        armorPenalty: false,
        description: 'Negotiate and persuade.',
      },
      {
        id: 'heal',
        name: 'Heal',
        ability: 'wis',
        armorPenalty: false,
        description: 'Treat wounds and ailments.',
      },
      {
        id: 'intimidate',
        name: 'Intimidate',
        ability: 'cha',
        armorPenalty: false,
        description: 'Frighten and threaten others.',
      },
      {
        id: 'knowledge-arcana',
        name: 'Knowledge (Arcana)',
        ability: 'int',
        armorPenalty: false,
        description: 'Magical knowledge.',
      },
      {
        id: 'knowledge-local',
        name: 'Knowledge (Local)',
        ability: 'int',
        armorPenalty: false,
        description: 'Local knowledge and rumors.',
      },
      {
        id: 'knowledge-nature',
        name: 'Knowledge (Nature)',
        ability: 'int',
        armorPenalty: false,
        description: 'Nature and animals knowledge.',
      },
      {
        id: 'perception',
        name: 'Perception',
        ability: 'wis',
        armorPenalty: false,
        description: 'Notice details and listen.',
      },
      {
        id: 'perform',
        name: 'Perform',
        ability: 'cha',
        armorPenalty: false,
        description: 'Entertain through music, dance, etc.',
      },
      {
        id: 'ride',
        name: 'Ride',
        ability: 'dex',
        armorPenalty: true,
        description: 'Ride mounted creatures.',
      },
      {
        id: 'sense-motive',
        name: 'Sense Motive',
        ability: 'wis',
        armorPenalty: false,
        description: 'Understand motivations and lies.',
      },
      {
        id: 'stealth',
        name: 'Stealth',
        ability: 'dex',
        armorPenalty: true,
        description: 'Hide and move silently.',
      },
      {
        id: 'survival',
        name: 'Survival',
        ability: 'wis',
        armorPenalty: false,
        description: 'Survive in the wilderness.',
      },
      {
        id: 'swim',
        name: 'Swim',
        ability: 'str',
        armorPenalty: true,
        description: 'Swimming and diving.',
      },
      {
        id: 'use-magic-device',
        name: 'Use Magic Device',
        ability: 'cha',
        armorPenalty: false,
        description: 'Use magical items without training.',
      },
    ];
  }
}

export default new GameDataService();
