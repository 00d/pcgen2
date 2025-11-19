/**
 * Pathfinder 1E specific types
 */

import type { AbilityScore, AbilityScores, Alignment, Size, Source } from './index';

export type SaveProgression = 'good' | 'poor';
export type BABProgression = 'full' | 'medium' | 'poor';
export type SpellcastingType = 'arcane' | 'divine' | 'psychic';

export interface PF1EClass {
  id: string;
  name: string;
  key: string;
  hitDie: number;
  skillPointsPerLevel: number;
  classType: 'base' | 'prestige' | 'npc';
  baseAttackBonus: BABProgression;
  saves: {
    fortitude: SaveProgression;
    reflex: SaveProgression;
    will: SaveProgression;
  };
  classSkills: string[];
  proficiencies: {
    armor: string[];
    shields: string[];
    weapons: string[];
  };
  spellcasting?: {
    type: SpellcastingType;
    stat: AbilityScore;
    spellsPerDay: number[][]; // [level][spell_level]
    spellsKnown?: number[][]; // Only for spontaneous casters
    spellList: string; // Reference to spell list
  };
  classFeatures: PF1EClassFeature[];
  source: Source;
}

export interface PF1EClassFeature {
  id: string;
  name: string;
  level: number;
  description: string;
  type: 'Ex' | 'Su' | 'Sp'; // Extraordinary, Supernatural, Spell-like
}

export interface PF1ERace {
  id: string;
  name: string;
  size: Size;
  type: string;
  speed: number;
  abilityScoreModifiers: Partial<Record<AbilityScore, number>>;
  racialTraits: PF1ERacialTrait[];
  languages: {
    starting: string[];
    bonus: string[];
  };
  vision: 'normal' | 'darkvision' | 'low-light';
  visionRange?: number;
  source: Source;
}

export interface PF1ERacialTrait {
  id: string;
  name: string;
  description: string;
  type: string;
}

export interface PF1ESkill {
  id: string;
  name: string;
  ability: AbilityScore;
  trainedOnly: boolean;
  armorCheckPenalty: boolean;
  description: string;
  source: Source;
}

export interface PF1EFeat {
  id: string;
  name: string;
  type: 'general' | 'combat' | 'metamagic' | 'item creation' | 'teamwork';
  description: string;
  benefit: string;
  prerequisites?: {
    abilityScores?: Partial<Record<AbilityScore, number>>;
    baseAttackBonus?: number;
    feats?: string[];
    skills?: Array<{ id: string; ranks: number }>;
    spellcasterLevel?: number;
    other?: string;
  };
  source: Source;
}

export interface PF1ESpell {
  id: string;
  name: string;
  school: string;
  subschool?: string;
  descriptors: string[];
  level: Record<string, number>; // class/domain -> level
  castingTime: string;
  components: {
    verbal: boolean;
    somatic: boolean;
    material?: string;
    focus?: string;
    divineFocus: boolean;
  };
  range: string;
  area?: string;
  target?: string;
  effect?: string;
  duration: string;
  savingThrow: string;
  spellResistance: boolean;
  description: string;
  source: Source;
}

export interface PF1EEquipment {
  id: string;
  name: string;
  category: 'armor' | 'weapon' | 'goods' | 'magic';
  cost: number; // In gold pieces
  weight: number; // In pounds
  description: string;
  source: Source;
}

export interface PF1EArmor extends PF1EEquipment {
  category: 'armor';
  armorType: 'light' | 'medium' | 'heavy' | 'shield';
  armorBonus: number;
  maxDexBonus: number | null;
  armorCheckPenalty: number;
  arcaneSpellFailure: number;
  speed30: number;
  speed20: number;
}

export interface PF1EWeapon extends PF1EEquipment {
  category: 'weapon';
  weaponType: 'simple' | 'martial' | 'exotic';
  damageSmall: string;
  damageMedium: string;
  critical: string;
  range?: number;
  damageType: string[];
  special?: string[];
}

export interface PF1ECharacterClass {
  classId: string;
  level: number;
  hitPoints: number[];
  favoredClassBonus: Array<'hp' | 'skill'>;
}

export interface PF1ECharacterSkill {
  skillId: string;
  ranks: number;
  isClassSkill: boolean;
}

export interface PF1ECharacterFeat {
  featId: string;
  sourceType: 'level' | 'class' | 'race' | 'trait';
  sourceLevel?: number;
}

export interface PF1ECharacterEquipment {
  itemId: string;
  quantity: number;
  equipped: boolean;
  location?: string; // Equipment slot
}

export interface PF1ECharacter {
  id: string;
  gameSystem: 'pathfinder1e';
  name: string;
  player?: string;
  alignment: Alignment;
  deity?: string;

  // Core stats
  race: string; // Race ID
  classes: PF1ECharacterClass[];
  level: number; // Total level

  // Ability scores
  abilityScores: AbilityScores;

  // Skills
  skills: PF1ECharacterSkill[];

  // Feats
  feats: PF1ECharacterFeat[];

  // Equipment
  equipment: PF1ECharacterEquipment[];
  currency: {
    cp: number;
    sp: number;
    gp: number;
    pp: number;
  };

  // Spells (if applicable)
  spells?: {
    known: string[]; // Spell IDs
    prepared?: string[];
    spellsPerDay: number[];
  };

  // Hit Points
  hp: {
    max: number;
    current: number;
    temp: number;
  };

  // Metadata
  createdAt: string;
  updatedAt: string;
  notes?: string;
}
