/**
 * Phase 5: Character Leveling Service
 * Handles character leveling, advancement, and experience tracking
 * Pathfinder 1st Edition compliant
 */

import { Character as CharacterType } from '../types/character';

// Interfaces used for type safety (kept for documentation)

/**
 * Experience Table for Pathfinder (1st Edition)
 * Levels 1-20
 */
const EXPERIENCE_TABLE: Record<number, number> = {
  1: 0,
  2: 1000,
  3: 3000,
  4: 6000,
  5: 10000,
  6: 15000,
  7: 21000,
  8: 28000,
  9: 36000,
  10: 45000,
  11: 55000,
  12: 66000,
  13: 78000,
  14: 91000,
  15: 105000,
  16: 120000,
  17: 136000,
  18: 153000,
  19: 171000,
  20: 190000,
};

export class LevelingService {
  /**
   * Calculate hit dice bonus for a level
   * d10 = 10, d8 = 8, d6 = 6, d4 = 4
   */
  private parseHitDie(hitDie: string): number {
    const match = hitDie.match(/d(\d+)/);
    return match ? parseInt(match[1]) : 6;
  }

  /**
   * Calculate HP gained for a new level
   * HP = hit die + CON modifier (minimum 1)
   */
  calculateHPGain(hitDie: string, conModifier: number): number {
    const hitDieValue = this.parseHitDie(hitDie);
    const hp = hitDieValue + conModifier;
    return Math.max(1, hp);
  }

  /**
   * Calculate skill points gained for a new level
   * Base = class skill points per level
   * Added bonus = INT modifier (minimum 0)
   */
  calculateSkillPointsGain(baseSkillPoints: number, intModifier: number): number {
    const bonus = Math.max(0, intModifier);
    return baseSkillPoints + bonus;
  }

  /**
   * Get feats available at a level
   * Pathfinder: Bonus feats at levels 1, 5, 9, 13, 17
   * Plus ability score improvement slots at 4, 8, 12, 16, 20
   */
  getFeatsForLevel(currentLevel: number): {
    bonusFeats: boolean;
    abilityScoreImprovement: boolean;
    levelUp: boolean;
  } {
    return {
      bonusFeats: [1, 5, 9, 13, 17].includes(currentLevel),
      abilityScoreImprovement: [4, 8, 12, 16, 20].includes(currentLevel),
      levelUp: true,
    };
  }

  /**
   * Get experience points required for next level
   */
  getExperienceForLevel(level: number): number {
    if (level < 1 || level > 20) {
      return 0;
    }
    return EXPERIENCE_TABLE[level] || 0;
  }

  /**
   * Get the next level based on experience points
   */
  getLevelFromExperience(experience: number): number {
    for (let level = 20; level >= 1; level--) {
      if (experience >= EXPERIENCE_TABLE[level]) {
        return level;
      }
    }
    return 1;
  }

  /**
   * Get experience needed for next level
   */
  getNextLevelExperience(currentLevel: number): number {
    const nextLevel = Math.min(currentLevel + 1, 20);
    return EXPERIENCE_TABLE[nextLevel] || EXPERIENCE_TABLE[20];
  }

  /**
   * Get experience progress to next level (0-100%)
   */
  getExperienceProgress(experience: number, currentLevel: number): number {
    const currentExp = EXPERIENCE_TABLE[currentLevel];
    const nextExp = this.getNextLevelExperience(currentLevel);
    const progress = experience - currentExp;
    const required = nextExp - currentExp;
    return Math.floor((progress / required) * 100);
  }

  /**
   * Apply ability score improvement at level up
   */
  applyAbilityScoreImprovement(
    character: CharacterType,
    level: number,
    ability: string
  ): boolean {
    // Ability score improvements occur at levels 4, 8, 12, 16, 20
    const improvementLevels = [4, 8, 12, 16, 20];

    if (!improvementLevels.includes(level)) {
      return false;
    }

    // Check if already applied
    const abilityScores = character.attributes.abilityScores as any;
    if (
      abilityScores &&
      abilityScores[ability] &&
      abilityScores[ability].base
    ) {
      // Increment ability score by 1
      abilityScores[ability].base += 1;
      abilityScores[ability].total = abilityScores[ability].base;
      return true;
    }

    return false;
  }

  /**
   * Validate level (must be 1-20)
   */
  validateLevel(level: number): { valid: boolean; error?: string } {
    if (level < 1 || level > 20) {
      return { valid: false, error: 'Level must be between 1 and 20' };
    }
    if (!Number.isInteger(level)) {
      return { valid: false, error: 'Level must be an integer' };
    }
    return { valid: true };
  }

  /**
   * Calculate total HP for multiclass character at given levels
   */
  calculateTotalHP(
    character: CharacterType,
    conModifier: number
  ): number {
    let totalHP = 0;

    const classes = character.attributes.classes as any[];
    if (classes && Array.isArray(classes)) {
      for (const charClass of classes) {
        const hitDieValue = this.parseHitDie(charClass.hitDie || 'd6');
        const classHP = charClass.level * (hitDieValue + conModifier);
        totalHP += classHP;
      }
    }

    // Minimum 1 HP per character level
    const derivedStats = character.derivedStats as any;
    const totalLevel = derivedStats?.totalLevel || 1;
    return Math.max(totalHP, totalLevel);
  }

  /**
   * Create advancement record for level up
   */
  createAdvancementRecord(
    level: number,
    hitPointsGained: number,
    skillPointsGained: number,
    featsGained?: string[],
    abilitiesGained?: string[]
  ) {
    return {
      level,
      date: new Date(),
      hitPointsGained,
      skillPointsGained,
      featsGained: featsGained || [],
      abilitiesGained: abilitiesGained || [],
    };
  }

  /**
   * Get advancement options for next level
   */
  getAdvancementOptions(
    _character: CharacterType,
    nextLevel: number
  ): {
    level: number;
    bonusFeats: boolean;
    abilityScoreImprovement: boolean;
    feats?: string[];
  } {
    const { bonusFeats, abilityScoreImprovement } =
      this.getFeatsForLevel(nextLevel);

    return {
      level: nextLevel,
      bonusFeats,
      abilityScoreImprovement,
    };
  }

  /**
   * Calculate spell slots for new level (for spellcasters)
   * Simplified: Each level gains one slot of each accessible level
   */
  calculateSpellSlotGain(
    spellcastingClass: string,
    characterLevel: number
  ): { level: number; count: number }[] {
    // Pathfinder spell slot progression
    // This is simplified; actual implementation would reference class data
    const slots: { level: number; count: number }[] = [];

    // Clerics, Druids: Can cast up to level (characterLevel+1)/2 spells
    if (['cleric', 'druid'].includes(spellcastingClass)) {
      const maxSpellLevel = Math.ceil(characterLevel / 2);
      for (let slotLevel = 0; slotLevel <= maxSpellLevel; slotLevel++) {
        if (slotLevel <= 9) {
          slots.push({ level: slotLevel, count: 1 });
        }
      }
    }
    // Wizards: Can prepare one new spell per level
    else if (spellcastingClass === 'wizard') {
      slots.push({ level: 1, count: 1 });
    }
    // Sorcerers: Can know one new spell per level
    else if (spellcastingClass === 'sorcerer') {
      slots.push({ level: 1, count: 1 });
    }

    return slots;
  }

  /**
   * Validate leveling request
   */
  validateLevelingRequest(
    character: CharacterType,
    targetLevel: number
  ): { valid: boolean; error?: string; warnings?: string[] } {
    const derivedStats = character.derivedStats as any;
    const currentLevel = derivedStats?.totalLevel || 1;

    if (targetLevel === currentLevel) {
      return {
        valid: false,
        error: `Character is already level ${currentLevel}`,
      };
    }

    if (targetLevel < currentLevel) {
      return {
        valid: false,
        error: 'Cannot decrease character level',
      };
    }

    if (targetLevel > 20) {
      return {
        valid: false,
        error: 'Maximum character level is 20',
      };
    }

    if (targetLevel < 1) {
      return {
        valid: false,
        error: 'Minimum character level is 1',
      };
    }

    return { valid: true };
  }
}

export default new LevelingService();
