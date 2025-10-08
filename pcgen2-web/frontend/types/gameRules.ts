export type GameRuleType = 'race' | 'class' | 'feat' | 'spell' | 'equipment' | 'ability';

export interface GameRule {
  _id: string;
  type: GameRuleType;
  id: string;
  name: string;
  source: string;
  data: Record<string, any>;
}

export interface Race extends GameRule {
  type: 'race';
  data: {
    size: string;
    speed: number;
    languages: string[];
    traits?: Array<{
      id: string;
      name: string;
      description: string;
    }>;
    abilityAdjustments?: Record<string, number>;
  };
}

export interface PClass extends GameRule {
  type: 'class';
  data: {
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
  };
}

export interface Feat extends GameRule {
  type: 'feat';
  data: {
    type: 'General' | 'Combat' | 'Bonus';
    prerequisites: string[];
    benefit: string;
    normal?: string;
  };
}

export interface Spell extends GameRule {
  type: 'spell';
  data: {
    level: number;
    school: string;
    descriptor: string[];
    castingTime: string;
    range: string;
    description: string;
  };
}

export interface Equipment extends GameRule {
  type: 'equipment';
  data: {
    cost: string;
    weight: number;
    type: string;
    armor?: {
      armorBonus: number;
      maxDexBonus: number;
      armorCheckPenalty: number;
    };
    weapon?: {
      damageSmall: string;
      damageMedium: string;
      criticalRange: string;
      type: string[];
    };
  };
}

export interface Skill {
  id: string;
  name: string;
  ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
  armorPenalty: boolean;
  description: string;
}

export interface GameDataState {
  races: Race[];
  classes: PClass[];
  feats: Feat[];
  spells: Spell[];
  equipment: Equipment[];
  skills: Skill[];
  isLoading: boolean;
  error: string | null;
}
