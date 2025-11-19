/**
 * Pathfinder 1E stat calculations
 */

import type { PF1ECharacter, PF1EClass, PF1ECharacterSkill, PF1ESkill } from '@/types/pathfinder1e';
import type { AbilityScore, AbilityScores } from '@/types';

/**
 * Calculate ability modifier from ability score
 */
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Get all ability modifiers
 */
export function getAbilityModifiers(abilityScores: AbilityScores): Record<AbilityScore, number> {
  return {
    STR: getAbilityModifier(abilityScores.STR),
    DEX: getAbilityModifier(abilityScores.DEX),
    CON: getAbilityModifier(abilityScores.CON),
    INT: getAbilityModifier(abilityScores.INT),
    WIS: getAbilityModifier(abilityScores.WIS),
    CHA: getAbilityModifier(abilityScores.CHA),
  };
}

/**
 * Calculate Base Attack Bonus
 */
export function calculateBAB(character: PF1ECharacter, classes: PF1EClass[]): number {
  let totalBAB = 0;

  for (const charClass of character.classes) {
    const classData = classes.find((c) => c.id === charClass.classId);
    if (!classData) continue;

    const level = charClass.level;

    switch (classData.baseAttackBonus) {
      case 'full':
        totalBAB += level;
        break;
      case 'medium':
        totalBAB += Math.floor((level * 3) / 4);
        break;
      case 'poor':
        totalBAB += Math.floor(level / 2);
        break;
    }
  }

  return totalBAB;
}

/**
 * Calculate saving throw bonus
 */
export function calculateSave(
  character: PF1ECharacter,
  classes: PF1EClass[],
  saveType: 'fortitude' | 'reflex' | 'will'
): number {
  let baseSave = 0;

  for (const charClass of character.classes) {
    const classData = classes.find((c) => c.id === charClass.classId);
    if (!classData) continue;

    const level = charClass.level;
    const progression = classData.saves[saveType];

    if (progression === 'good') {
      baseSave += 2 + Math.floor(level / 2);
    } else {
      baseSave += Math.floor(level / 3);
    }
  }

  // Add ability modifier
  const abilityMods = getAbilityModifiers(character.abilityScores);
  let abilityMod = 0;

  switch (saveType) {
    case 'fortitude':
      abilityMod = abilityMods.CON;
      break;
    case 'reflex':
      abilityMod = abilityMods.DEX;
      break;
    case 'will':
      abilityMod = abilityMods.WIS;
      break;
  }

  return baseSave + abilityMod;
}

/**
 * Calculate Armor Class
 */
export function calculateAC(
  character: PF1ECharacter,
  armorBonus: number = 0,
  shieldBonus: number = 0,
  naturalArmor: number = 0
): {
  total: number;
  touch: number;
  flatFooted: number;
  breakdown: {
    base: number;
    armor: number;
    shield: number;
    dex: number;
    natural: number;
    deflection: number;
    misc: number;
  };
} {
  const dexMod = getAbilityModifier(character.abilityScores.DEX);

  const breakdown = {
    base: 10,
    armor: armorBonus,
    shield: shieldBonus,
    dex: dexMod,
    natural: naturalArmor,
    deflection: 0,
    misc: 0,
  };

  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  const touch = breakdown.base + breakdown.dex + breakdown.deflection + breakdown.misc;
  const flatFooted = total - breakdown.dex;

  return {
    total,
    touch,
    flatFooted,
    breakdown,
  };
}

/**
 * Calculate skill modifier
 */
export function calculateSkillModifier(
  character: PF1ECharacter,
  skill: PF1ESkill,
  characterSkill?: PF1ECharacterSkill
): {
  total: number;
  breakdown: {
    ranks: number;
    abilityMod: number;
    classBonus: number;
    misc: number;
  };
} {
  const abilityMods = getAbilityModifiers(character.abilityScores);
  const abilityMod = abilityMods[skill.ability];

  const ranks = characterSkill?.ranks || 0;
  const classBonus = ranks > 0 && characterSkill?.isClassSkill ? 3 : 0;
  const misc = 0; // For future: racial bonuses, feat bonuses, etc.

  const total = ranks + abilityMod + classBonus + misc;

  return {
    total,
    breakdown: {
      ranks,
      abilityMod,
      classBonus,
      misc,
    },
  };
}

/**
 * Calculate initiative modifier
 */
export function calculateInitiative(character: PF1ECharacter): number {
  return getAbilityModifier(character.abilityScores.DEX);
}

/**
 * Calculate melee attack bonus
 */
export function calculateMeleeAttack(character: PF1ECharacter, classes: PF1EClass[]): number {
  const bab = calculateBAB(character, classes);
  const strMod = getAbilityModifier(character.abilityScores.STR);
  return bab + strMod;
}

/**
 * Calculate ranged attack bonus
 */
export function calculateRangedAttack(character: PF1ECharacter, classes: PF1EClass[]): number {
  const bab = calculateBAB(character, classes);
  const dexMod = getAbilityModifier(character.abilityScores.DEX);
  return bab + dexMod;
}

/**
 * Calculate Combat Maneuver Bonus (CMB)
 */
export function calculateCMB(character: PF1ECharacter, classes: PF1EClass[]): number {
  const bab = calculateBAB(character, classes);
  const strMod = getAbilityModifier(character.abilityScores.STR);
  const sizeMod = 0; // Medium = 0, adjust for other sizes
  return bab + strMod + sizeMod;
}

/**
 * Calculate Combat Maneuver Defense (CMD)
 */
export function calculateCMD(character: PF1ECharacter, classes: PF1EClass[]): number {
  const bab = calculateBAB(character, classes);
  const strMod = getAbilityModifier(character.abilityScores.STR);
  const dexMod = getAbilityModifier(character.abilityScores.DEX);
  const sizeMod = 0; // Medium = 0, adjust for other sizes
  return 10 + bab + strMod + dexMod + sizeMod;
}

/**
 * Format modifier for display (+X or -X)
 */
export function formatModifier(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

/**
 * Calculate max HP (using average method for now)
 */
export function calculateMaxHP(character: PF1ECharacter, classes: PF1EClass[]): number {
  let totalHP = 0;
  const conMod = getAbilityModifier(character.abilityScores.CON);

  for (const charClass of character.classes) {
    const classData = classes.find((c) => c.id === charClass.classId);
    if (!classData) continue;

    // First level: max hit die + CON mod
    // Subsequent levels: average (rounded down) + CON mod
    const firstLevelHP = classData.hitDie + conMod;
    const avgHitDie = Math.floor(classData.hitDie / 2) + 1;
    const subsequentLevels = charClass.level - 1;

    totalHP += firstLevelHP + subsequentLevels * (avgHitDie + conMod);

    // Add favored class bonuses (HP)
    const hpBonuses = charClass.favoredClassBonus?.filter((b) => b === 'hp').length || 0;
    totalHP += hpBonuses;
  }

  return Math.max(1, totalHP); // Minimum 1 HP
}

/**
 * Calculate carrying capacity (Light/Medium/Heavy load in lbs)
 */
export function calculateCarryingCapacity(character: PF1ECharacter): {
  light: number;
  medium: number;
  heavy: number;
  lift: number;
  drag: number;
} {
  const str = character.abilityScores.STR;

  // Simplified calculation for Medium creatures
  const light = str * 10;
  const medium = str * 20;
  const heavy = str * 30;
  const lift = heavy * 2;
  const drag = lift * 5;

  return {
    light,
    medium,
    heavy,
    lift,
    drag,
  };
}
