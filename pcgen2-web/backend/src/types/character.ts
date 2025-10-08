export interface AbilityScore {
  base: number;
  racial: number;
  items: number;
  enhancement: number;
  total: number;
}

export interface AbilityScores {
  str: AbilityScore;
  dex: AbilityScore;
  con: AbilityScore;
  int: AbilityScore;
  wis: AbilityScore;
  cha: AbilityScore;
}

export interface Race {
  id: string;
  name: string;
  size: string;
  baseAbilityModifiers: Partial<AbilityScores>;
  baseSpeed: number;
  languages: string[];
  traits: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

export interface PClassLevel {
  id: string;
  name: string;
  level: number;
  hitDie: string;
  baseAttackBonusProgression: 'poor' | 'moderate' | 'good';
  savingThrowBonus: {
    fort: number;
    ref: number;
    will: number;
  };
  baseSkillsPerLevel: number;
  classAbilities: Array<{
    id: string;
    name: string;
    level: number;
    description: string;
  }>;
}

export interface Character {
  _id: string;
  userId: string;
  name: string;
  campaign: string;
  createdAt: Date;
  updatedAt: Date;
  attributes: {
    race: Race;
    classes: PClassLevel[];
    abilityScores: AbilityScores;
  };
  derivedStats: {
    hitPoints: {
      current: number;
      max: number;
    };
    armorClass: {
      base: number;
      dexBonus: number;
      armorBonus: number;
      shieldBonus: number;
      deflectionBonus: number;
      naturalArmor: number;
      total: number;
    };
    baseAttackBonus: number;
    combatManeuverBonus: number;
    combatManeuverDefense: number;
    initiative: number;
    savingThrows: {
      fortitude: number;
      reflex: number;
      will: number;
    };
    skillPoints: {
      remaining: number;
      used: number;
    };
  };
  feats: Array<{
    id: string;
    name: string;
    type: string;
    prerequisites: string[];
    benefit: string;
    special?: string;
  }>;
  skills: Array<{
    name: string;
    ability: keyof AbilityScores;
    ranks: number;
    classSkill: boolean;
    bonus: {
      ranks: number;
      abilityModifier: number;
      armorPenalty: number;
      misc: number;
      total: number;
    };
  }>;
  equipment: Array<{
    id: string;
    name: string;
    type: string;
    cost: string;
    weight: number;
    equipped: boolean;
    quantity: number;
    description: string;
  }>;
  spells: {
    spellcaster: boolean;
    spellcastingClass?: string;
    spellcastingAbility?: keyof AbilityScores;
    spellsKnown: Array<{
      id: string;
      name: string;
      level: number;
      description: string;
    }>;
    spellSlots: Array<{
      level: number;
      perDay: number;
      used: number;
    }>;
  };
  notes: string;
  description: string;
  alignment: string;
  deity: string;
  imageUrl?: string;
}
