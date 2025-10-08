export type GameRuleType = 'race' | 'class' | 'feat' | 'spell' | 'equipment' | 'ability';

export interface GameRule {
  _id: string;
  type: GameRuleType;
  id: string;
  name: string;
  source: string;
  data: Record<string, any>;
}

export interface RaceData {
  size: string;
  speed: number;
  languages: string[];
  traits?: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  abilityAdjustments?: {
    str?: number;
    dex?: number;
    con?: number;
    int?: number;
    wis?: number;
    cha?: number;
  };
}

export interface ClassData {
  hitDie: 'd6' | 'd8' | 'd10' | 'd12';
  baseAttackBonusProgression: 'poor' | 'moderate' | 'good';
  savingThrows: {
    fort: string;
    ref: string;
    will: string;
  };
  skillsPerLevel: number;
  classAbilities?: Array<{
    id: string;
    name: string;
    level: number;
    description: string;
  }>;
}

export interface FeatData {
  prerequisites?: string[];
  benefit: string;
  normal?: string;
  special?: string;
  type?: 'Combat' | 'Teamwork' | 'Metamagic' | 'General';
}

export interface SpellData {
  level: number;
  school: string;
  descriptor?: string[];
  castingTime: string;
  range: string;
  target?: string;
  duration: string;
  savingThrow?: string;
  spellResistance?: boolean;
  description: string;
}

export interface EquipmentData {
  cost: string;
  weight: number;
  type?: string;
  armor?: {
    armorBonus?: number;
    maxDexBonus?: number;
    armorCheckPenalty?: number;
  };
  weapon?: {
    damageSmall?: string;
    damageMedium?: string;
    criticalRange?: string;
    criticalMultiplier?: number;
    type?: string[];
    special?: string[];
  };
  description?: string;
}
