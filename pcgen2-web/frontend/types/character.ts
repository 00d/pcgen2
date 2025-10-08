export interface AbilityScore {
  base: number;
  racial: number;
  items: number;
  enhancement: number;
  total: number;
}

export interface Feat {
  featId: string;
  name: string;
  type: 'General' | 'Combat' | 'Bonus';
  benefit: string;
}

export interface SkillAllocation {
  skillId: string;
  skillName: string;
  ranks: number;
  abilityModifier: number;
  total: number;
  isClassSkill: boolean;
}

export interface EquipmentSelection {
  equipmentId: string;
  name: string;
  type: string;
  quantity: number;
  weight: number;
  equipped: boolean;
}

export interface SpellSelection {
  spellId: string;
  name: string;
  level: number;
  school: string;
  prepared: boolean;
  known: boolean;
}

export interface Character {
  _id: string;
  userId: string;
  name: string;
  campaign: string;
  createdAt: string;
  updatedAt: string;
  attributes: {
    race?: {
      id: string;
      name: string;
      size: string;
      baseAbilityModifiers: Record<string, number>;
      baseSpeed: number;
      languages: string[];
      traits: Array<{
        id: string;
        name: string;
        description: string;
      }>;
    };
    classes: Array<{
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
    }>;
    abilityScores: {
      str: AbilityScore;
      dex: AbilityScore;
      con: AbilityScore;
      int: AbilityScore;
      wis: AbilityScore;
      cha: AbilityScore;
    };
  };
  derivedStats: {
    hitPoints: {
      current: number;
      max: number;
    };
    armorClass: {
      total: number;
    };
    baseAttackBonus: number;
    savingThrows: {
      fortitude: number;
      reflex: number;
      will: number;
    };
  };
  feats?: Feat[];
  skills?: SkillAllocation[];
  equipment?: EquipmentSelection[];
  spells?: SpellSelection[];
}

export interface CharacterState {
  characters: Character[];
  currentCharacter: Character | null;
  isLoading: boolean;
  error: string | null;
  step: 'race' | 'class' | 'abilities' | 'feats' | 'equipment' | 'spells' | 'finish';
}
