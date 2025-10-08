/**
 * Phase 5: Equipment Management Service
 * Handles equipment loading, AC calculation, weight tracking, and encumbrance
 */

import { Character as CharacterType } from '../types/character';
import equipmentData from '../data/equipment.json';

interface Equipment {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'shield' | 'gear';
  cost: string;
  weight: number;
  description: string;
  [key: string]: any;
}

interface EquippedItem {
  equipmentId: string;
  name: string;
  type: string;
  weight: number;
  equipped: boolean;
  quantity: number;
  acBonus?: number;
  armorCheckPenalty?: number;
  maxDexBonus?: number;
}

/**
 * Encumbrance limits based on STR score
 * Light Load: STR x 10 lbs
 * Medium Load: STR x 20 lbs
 * Heavy Load: STR x 30 lbs
 */
const getEncumbranceLimits = (strAbility: number): {
  lightLoad: number;
  mediumLoad: number;
  heavyLoad: number;
} => {
  return {
    lightLoad: strAbility * 10,
    mediumLoad: strAbility * 20,
    heavyLoad: strAbility * 30,
  };
};

export class EquipmentService {
  /**
   * Get all equipment by category
   */
  getEquipmentByCategory(category: string): Equipment[] {
    const categoryMap: Record<string, any[]> = {
      weapons: equipmentData.weapons as any,
      armor: equipmentData.armor as any,
      shields: equipmentData.shields as any,
      gear: equipmentData['adventuring-gear'] as any,
    };

    return (categoryMap[category] || []) as Equipment[];
  }

  /**
   * Get specific equipment by ID
   */
  getEquipmentById(id: string): Equipment | null {
    const allEquipment = [
      ...(equipmentData.weapons as any),
      ...(equipmentData.armor as any),
      ...(equipmentData.shields as any),
      ...(equipmentData['adventuring-gear'] as any),
    ];

    return (allEquipment.find((eq) => eq.id === id) || null) as Equipment | null;
  }

  /**
   * Get all available equipment
   */
  getAllEquipment(): Equipment[] {
    return [
      ...(equipmentData.weapons as any),
      ...(equipmentData.armor as any),
      ...(equipmentData.shields as any),
      ...(equipmentData['adventuring-gear'] as any),
    ] as Equipment[];
  }

  /**
   * Calculate total weight of character equipment
   */
  calculateTotalWeight(equipment: EquippedItem[]): number {
    return equipment.reduce((total, item) => total + item.weight * item.quantity, 0);
  }

  /**
   * Determine encumbrance level
   */
  getEncumbranceLevel(
    totalWeight: number,
    strAbility: number
  ): 'unencumbered' | 'lightly-encumbered' | 'heavily-encumbered' {
    const limits = getEncumbranceLimits(strAbility);

    if (totalWeight <= limits.lightLoad) {
      return 'unencumbered';
    } else if (totalWeight <= limits.mediumLoad) {
      return 'lightly-encumbered';
    } else {
      return 'heavily-encumbered';
    }
  }

  /**
   * Get encumbrance penalties
   */
  getEncumbrancePenalties(encumbranceLevel: string): {
    armorCheckPenalty: number;
    movementReduction: number;
  } {
    switch (encumbranceLevel) {
      case 'lightly-encumbered':
        return {
          armorCheckPenalty: 0,
          movementReduction: 0,
        };
      case 'heavily-encumbered':
        return {
          armorCheckPenalty: -1,
          movementReduction: -10, // Feet per move
        };
      default:
        return {
          armorCheckPenalty: 0,
          movementReduction: 0,
        };
    }
  }

  /**
   * Calculate AC from equipped armor and shields
   */
  calculateAC(equipment: EquippedItem[], dexModifier: number): {
    baseAC: number;
    dexBonus: number;
    armorBonus: number;
    shieldBonus: number;
    armorCheckPenalty: number;
    maxDexBonus: number | null;
    totalAC: number;
  } {
    let armorBonus = 0;
    let shieldBonus = 0;
    let armorCheckPenalty = 0;
    let maxDexBonus: number | null = null;

    // Find equipped armor and shields
    const equippedItems = equipment.filter((item) => item.equipped);

    for (const item of equippedItems) {
      if (item.type === 'armor') {
        armorBonus += item.acBonus || 0;
        if (item.armorCheckPenalty) {
          armorCheckPenalty += item.armorCheckPenalty;
        }
        if (item.maxDexBonus !== null && item.maxDexBonus !== undefined) {
          if (maxDexBonus === null) {
            maxDexBonus = item.maxDexBonus;
          } else {
            maxDexBonus = Math.min(maxDexBonus, item.maxDexBonus);
          }
        }
      }

      if (item.type === 'shield') {
        shieldBonus += item.acBonus || 0;
        if (item.armorCheckPenalty) {
          armorCheckPenalty += item.armorCheckPenalty;
        }
      }
    }

    // Apply DEX modifier (capped by armor max DEX bonus if any)
    let dexBonus = dexModifier;
    if (maxDexBonus !== null) {
      dexBonus = Math.min(dexModifier, maxDexBonus);
    }

    const baseAC = 10;
    const totalAC = baseAC + armorBonus + shieldBonus + dexBonus;

    return {
      baseAC,
      dexBonus,
      armorBonus,
      shieldBonus,
      armorCheckPenalty,
      maxDexBonus,
      totalAC,
    };
  }

  /**
   * Validate equipment addition
   */
  validateEquipment(equipment: EquippedItem[]): { valid: boolean; error?: string } {
    // Can't equip multiple armor pieces
    const equippedArmor = equipment.filter(
      (item) => item.equipped && item.type === 'armor'
    );
    if (equippedArmor.length > 1) {
      return { valid: false, error: 'Cannot equip multiple armor pieces' };
    }

    // Can't equip more than 2 shields
    const equippedShields = equipment.filter(
      (item) => item.equipped && item.type === 'shield'
    );
    if (equippedShields.length > 2) {
      return {
        valid: false,
        error: 'Cannot equip more than 2 shields (one in each hand)',
      };
    }

    return { valid: true };
  }

  /**
   * Get equipment summary for character
   */
  getEquipmentSummary(equipment: EquippedItem[], character: CharacterType): {
    totalWeight: number;
    encumbranceLevel: string;
    acCalculation: any;
    equipment: EquippedItem[];
  } {
    const strAbility = (character.attributes.abilityScores.str as any)?.total || 10;
    const dexAbility = (character.attributes.abilityScores.dex as any)?.total || 10;
    const dexModifier = Math.floor((dexAbility - 10) / 2);

    const totalWeight = this.calculateTotalWeight(equipment);
    const encumbranceLevel = this.getEncumbranceLevel(totalWeight, strAbility);
    const acCalculation = this.calculateAC(equipment, dexModifier);

    return {
      totalWeight,
      encumbranceLevel,
      acCalculation,
      equipment,
    };
  }

  /**
   * Get equipment by type
   */
  getEquipmentByType(type: string): Equipment[] {
    const allEquipment = this.getAllEquipment();
    return allEquipment.filter((eq) => eq.type === type);
  }

  /**
   * Search equipment by name
   */
  searchEquipment(query: string): Equipment[] {
    const allEquipment = this.getAllEquipment();
    const lowerQuery = query.toLowerCase();
    return allEquipment.filter((eq) =>
      eq.name.toLowerCase().includes(lowerQuery) ||
      eq.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get weapon damage information
   */
  getWeaponDamage(weaponId: string, strModifier: number): {
    baseDamage: string;
    totalDamage: string;
    diceCount: number;
    diceSize: number;
    modifier: number;
  } | null {
    const weapon = this.getEquipmentById(weaponId);
    if (!weapon || weapon.type !== 'weapon') {
      return null;
    }

    // Parse damage dice (e.g., "1d8" -> diceCount: 1, diceSize: 8)
    const damageMatch = (weapon.damage as string).match(/(\d+)d(\d+)/);
    if (!damageMatch) {
      return null;
    }

    const diceCount = parseInt(damageMatch[1]);
    const diceSize = parseInt(damageMatch[2]);

    return {
      baseDamage: weapon.damage,
      totalDamage: `${diceCount}d${diceSize} + ${strModifier}`,
      diceCount,
      diceSize,
      modifier: strModifier,
    };
  }

  /**
   * Get equipment load status
   */
  getLoadStatus(
    totalWeight: number,
    strAbility: number
  ): {
    lightLoad: number;
    mediumLoad: number;
    heavyLoad: number;
    currentLoad: number;
    percentOfCapacity: number;
    status: string;
  } {
    const limits = getEncumbranceLimits(strAbility);
    const percentOfCapacity = Math.floor((totalWeight / limits.heavyLoad) * 100);

    let status = 'Unencumbered';
    if (totalWeight > limits.mediumLoad) {
      status = 'Heavily Encumbered';
    } else if (totalWeight > limits.lightLoad) {
      status = 'Lightly Encumbered';
    }

    return {
      lightLoad: limits.lightLoad,
      mediumLoad: limits.mediumLoad,
      heavyLoad: limits.heavyLoad,
      currentLoad: totalWeight,
      percentOfCapacity,
      status,
    };
  }
}

export default new EquipmentService();
