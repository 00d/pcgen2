import { GameDataService } from './gameDataService';
import { Character as CharacterType } from '../types/character';

/**
 * Phase 4: Multiclass Support Service
 * Handles all multiclass character calculations including:
 * - Base Attack Bonus (BAB) calculation per progression type
 * - Saving throw calculation
 * - Hit points calculation
 * - Skill points calculation
 * - Spell slot determination
 */

interface CharacterClass {
  classId: string;
  className: string;
  level: number;
  hitDie: string;
  baseAttackBonusProgression: string; // 'good', 'moderate', 'poor'
}

interface BABResult {
  totalBAB: number;
  perClass: Record<string, number>;
}

interface SaveResult {
  fort: number;
  ref: number;
  will: number;
  perClass: Record<string, { fort: number; ref: number; will: number }>;
}

interface HPResult {
  totalHP: number;
  perClass: Record<string, number>;
}

export class MulticlassService {
  private gameDataService = GameDataService;

  /**
   * Calculate Base Attack Bonus for multiclass character
   * Pathfinder rule: Use the highest BAB from all classes
   */
  calculateMulticlassBAB(classes: CharacterClass[], conModifier: number = 0): BABResult {
    const perClass: Record<string, number> = {};

    for (const charClass of classes) {
      const bab = this.calculateBABForClass(charClass.level, charClass.baseAttackBonusProgression);
      perClass[charClass.classId] = bab;
    }

    // Total BAB is the highest
    const totalBAB = Math.max(...Object.values(perClass));

    return { totalBAB, perClass };
  }

  /**
   * Calculate BAB for a single class based on progression type
   */
  private calculateBABForClass(level: number, progression: string): number {
    switch (progression) {
      case 'good':
        // +1 per level
        return level;
      case 'moderate':
        // +3/4 per level
        return Math.floor(level * 0.75);
      case 'poor':
        // +1/2 per level
        return Math.floor(level * 0.5);
      default:
        return 0;
    }
  }

  /**
   * Calculate saving throws for multiclass character
   * Pathfinder rule: Take the best save from all classes for each type
   */
  calculateMulticlassSaves(
    classes: CharacterClass[],
    saveBonus: Record<string, number> = {}
  ): SaveResult {
    const saves = { fort: 0, ref: 0, will: 0 };
    const perClass: Record<string, { fort: number; ref: number; will: number }> = {};

    for (const charClass of classes) {
      const classSaves = this.calculateSavesForClass(charClass.level);
      perClass[charClass.classId] = classSaves;

      // Keep best saves
      saves.fort = Math.max(saves.fort, classSaves.fort);
      saves.ref = Math.max(saves.ref, classSaves.ref);
      saves.will = Math.max(saves.will, classSaves.will);
    }

    // Add any bonuses from feats, items, etc.
    if (saveBonus) {
      saves.fort += saveBonus.fort || 0;
      saves.ref += saveBonus.ref || 0;
      saves.will += saveBonus.will || 0;
    }

    return { ...saves, perClass };
  }

  /**
   * Calculate saves for a single class
   * Pathfinder progression:
   * - Good saves: +2, then +1 every 3 levels
   * - Poor saves: +0, then +1 every 3 levels
   */
  private calculateSavesForClass(level: number): { fort: number; ref: number; will: number } {
    // Simplified save calculation (can be enhanced with actual class save progressions)
    // Good save: +2 at level 1, +1 per 3 levels
    // Poor save: +0 at level 1, +1 per 3 levels

    // This would be enhanced by looking up the actual class data
    const baseGoodSave = 2;
    const bonusPerThreeLevel = Math.floor((level - 1) / 3);

    return {
      fort: baseGoodSave + bonusPerThreeLevel,
      ref: baseGoodSave + bonusPerThreeLevel,
      will: baseGoodSave + bonusPerThreeLevel,
    };
  }

  /**
   * Calculate total hit points for multiclass character
   */
  calculateMulticlassHP(classes: CharacterClass[], conModifier: number = 0): HPResult {
    let totalHP = 0;
    const perClass: Record<string, number> = {};

    for (const charClass of classes) {
      const hitDieValue = parseInt(charClass.hitDie.replace('d', ''));
      // HP = hitDie per level + CON modifier per level
      const classHP = charClass.level * (hitDieValue + conModifier);
      perClass[charClass.classId] = classHP;
      totalHP += classHP;
    }

    // Minimum 1 HP per level
    totalHP = Math.max(totalHP, classes.reduce((sum, c) => sum + c.level, 0));

    return { totalHP, perClass };
  }

  /**
   * Calculate total skill points for multiclass character
   */
  calculateMulticlassSkillPoints(classes: CharacterClass[], intModifier: number = 0): number {
    let totalSkillPoints = 0;

    for (const charClass of classes) {
      // This should look up the actual class data for skills per level
      // For now, use a simplified calculation
      const skillsPerLevel = this.getSkillsPerLevel(charClass.classId);
      const intBonus = Math.max(0, intModifier);

      // Skills = (base + INT modifier) * levels
      const classSkillPoints = (skillsPerLevel + intBonus) * charClass.level;
      totalSkillPoints += classSkillPoints;
    }

    return totalSkillPoints;
  }

  /**
   * Get skills per level for a class (to be enhanced with actual class data)
   */
  private getSkillsPerLevel(classId: string): number {
    // Simplified mapping (should be looked up from game data)
    const skillMap: Record<string, number> = {
      barbarian: 4,
      bard: 6,
      cleric: 2,
      druid: 4,
      fighter: 2,
      monk: 4,
      paladin: 2,
      ranger: 6,
      rogue: 8,
      sorcerer: 2,
      wizard: 2,
    };

    return skillMap[classId] || 2;
  }

  /**
   * Calculate total character level
   */
  calculateTotalLevel(classes: CharacterClass[]): number {
    return classes.reduce((sum, c) => sum + c.level, 0);
  }

  /**
   * Validate multiclass combination (for future enhancement)
   */
  validateMulticlass(
    classes: CharacterClass[]
  ): { valid: boolean; error?: string } {
    // Currently, Pathfinder allows any multiclass combination
    // This can be enhanced to check for restrictions like:
    // - Prestige classes requiring specific prerequisites
    // - Some class restrictions by race

    if (classes.length === 0) {
      return { valid: false, error: 'Character must have at least one class' };
    }

    if (classes.length > 5) {
      return { valid: false, error: 'Character cannot have more than 5 classes' };
    }

    // Check for duplicate classes
    const classIds = classes.map((c) => c.classId);
    const uniqueIds = new Set(classIds);
    if (classIds.length !== uniqueIds.size) {
      return { valid: false, error: 'Character cannot have duplicate classes' };
    }

    return { valid: true };
  }

  /**
   * Recalculate all multiclass statistics
   */
  recalculateMulticlassStats(
    character: CharacterType
  ): {
    totalLevel: number;
    baseAttackBonus: number;
    baseAttackBonusByClass: Record<string, number>;
    savingThrows: { fort: number; ref: number; will: number };
    savingThrowsByClass: Record<string, { fort: number; ref: number; will: number }>;
    hitPoints: { totalHP: number; perClass: Record<string, number> };
    skillPoints: number;
  } {
    if (!character.attributes.classes || character.attributes.classes.length === 0) {
      return {
        totalLevel: 0,
        baseAttackBonus: 0,
        baseAttackBonusByClass: {},
        savingThrows: { fort: 0, ref: 0, will: 0 },
        savingThrowsByClass: {},
        hitPoints: { totalHP: 0, perClass: {} },
        skillPoints: 0,
      };
    }

    const classes = character.attributes.classes as CharacterClass[];
    const conMod = character.attributes.abilityScores.con.base - 10;
    const intMod = character.attributes.abilityScores.int.base - 10;

    const totalLevel = this.calculateTotalLevel(classes);
    const babResult = this.calculateMulticlassBAB(classes);
    const savesResult = this.calculateMulticlassSaves(classes);
    const hpResult = this.calculateMulticlassHP(classes, conMod);
    const skillPoints = this.calculateMulticlassSkillPoints(classes, intMod);

    return {
      totalLevel,
      baseAttackBonus: babResult.totalBAB,
      baseAttackBonusByClass: babResult.perClass,
      savingThrows: {
        fort: savesResult.fort,
        ref: savesResult.ref,
        will: savesResult.will,
      },
      savingThrowsByClass: savesResult.perClass,
      hitPoints: {
        totalHP: hpResult.totalHP,
        perClass: hpResult.perClass,
      },
      skillPoints,
    };
  }
}

export default new MulticlassService();
