/**
 * Phase 5: Equipment Service Tests
 * Comprehensive tests for equipment management, AC calculation, and encumbrance
 */

import equipmentService from '../equipmentService';

describe('EquipmentService', () => {
  describe('Equipment Loading', () => {
    it('should get all equipment', () => {
      const equipment = equipmentService.getAllEquipment();
      expect(equipment.length).toBeGreaterThan(0);
    });

    it('should get weapons by category', () => {
      const weapons = equipmentService.getEquipmentByCategory('weapons');
      expect(weapons.length).toBeGreaterThan(0);
      expect(weapons[0].type).toBe('weapon');
    });

    it('should get armor by category', () => {
      const armor = equipmentService.getEquipmentByCategory('armor');
      expect(armor.length).toBeGreaterThan(0);
      expect(armor[0].type).toBe('armor');
    });

    it('should get shields by category', () => {
      const shields = equipmentService.getEquipmentByCategory('shields');
      expect(shields.length).toBeGreaterThan(0);
      expect(shields[0].type).toBe('shield');
    });

    it('should get gear by category', () => {
      const gear = equipmentService.getEquipmentByCategory('gear');
      expect(gear.length).toBeGreaterThan(0);
    });

    it('should get specific equipment by ID', () => {
      const equipment = equipmentService.getEquipmentById('longsword');
      expect(equipment).not.toBeNull();
      expect(equipment?.name).toBe('Longsword');
    });

    it('should return null for non-existent equipment', () => {
      const equipment = equipmentService.getEquipmentById('fake-equipment');
      expect(equipment).toBeNull();
    });
  });

  describe('Weight Calculation', () => {
    it('should calculate total weight for single item', () => {
      const equipment = [
        {
          equipmentId: 'longsword',
          name: 'Longsword',
          type: 'weapon',
          weight: 4,
          equipped: true,
          quantity: 1,
        },
      ];

      const weight = equipmentService.calculateTotalWeight(equipment as any);
      expect(weight).toBe(4);
    });

    it('should calculate total weight for multiple items', () => {
      const equipment = [
        {
          equipmentId: 'longsword',
          name: 'Longsword',
          type: 'weapon',
          weight: 4,
          equipped: true,
          quantity: 1,
        },
        {
          equipmentId: 'dagger',
          name: 'Dagger',
          type: 'weapon',
          weight: 1,
          equipped: true,
          quantity: 2,
        },
      ];

      const weight = equipmentService.calculateTotalWeight(equipment as any);
      expect(weight).toBe(6); // 4 + (1 * 2)
    });

    it('should handle zero quantity items', () => {
      const equipment = [
        {
          equipmentId: 'longsword',
          name: 'Longsword',
          type: 'weapon',
          weight: 4,
          equipped: true,
          quantity: 0,
        },
      ];

      const weight = equipmentService.calculateTotalWeight(equipment as any);
      expect(weight).toBe(0);
    });
  });

  describe('Encumbrance Calculation', () => {
    it('should return unencumbered for light load', () => {
      const encumbrance = equipmentService.getEncumbranceLevel(50, 15);
      expect(encumbrance).toBe('unencumbered');
    });

    it('should return lightly-encumbered for medium load', () => {
      const encumbrance = equipmentService.getEncumbranceLevel(200, 15);
      expect(encumbrance).toBe('lightly-encumbered');
    });

    it('should return heavily-encumbered for heavy load', () => {
      const encumbrance = equipmentService.getEncumbranceLevel(500, 15);
      expect(encumbrance).toBe('heavily-encumbered');
    });

    it('should scale with STR ability', () => {
      const weakEncumbrance = equipmentService.getEncumbranceLevel(150, 10);
      const strongEncumbrance = equipmentService.getEncumbranceLevel(150, 18);

      expect(weakEncumbrance).not.toBe(strongEncumbrance);
    });
  });

  describe('Encumbrance Penalties', () => {
    it('should have no penalty for unencumbered', () => {
      const penalties = equipmentService.getEncumbrancePenalties('unencumbered');
      expect(penalties.armorCheckPenalty).toBe(0);
      expect(penalties.movementReduction).toBe(0);
    });

    it('should have no penalty for lightly-encumbered', () => {
      const penalties = equipmentService.getEncumbrancePenalties('lightly-encumbered');
      expect(penalties.armorCheckPenalty).toBe(0);
      expect(penalties.movementReduction).toBe(0);
    });

    it('should have penalty for heavily-encumbered', () => {
      const penalties = equipmentService.getEncumbrancePenalties('heavily-encumbered');
      expect(penalties.armorCheckPenalty).toBe(-1);
      expect(penalties.movementReduction).toBe(-10);
    });
  });

  describe('AC Calculation', () => {
    it('should calculate base AC without equipment', () => {
      const equipment: any = [];
      const ac = equipmentService.calculateAC(equipment, 0);

      expect(ac.baseAC).toBe(10);
      expect(ac.totalAC).toBe(10);
    });

    it('should add leather armor AC', () => {
      const equipment = [
        {
          equipmentId: 'leather-armor',
          name: 'Leather Armor',
          type: 'armor',
          weight: 10,
          equipped: true,
          quantity: 1,
          acBonus: 1,
          maxDexBonus: null,
          armorCheckPenalty: 0,
        },
      ];

      const ac = equipmentService.calculateAC(equipment as any, 2);
      expect(ac.baseAC).toBe(10);
      expect(ac.armorBonus).toBe(1);
      expect(ac.dexBonus).toBe(2);
      expect(ac.totalAC).toBe(13); // 10 + 1 + 2
    });

    it('should add shield AC', () => {
      const equipment = [
        {
          equipmentId: 'shield-light-wooden',
          name: 'Light Wooden Shield',
          type: 'shield',
          weight: 5,
          equipped: true,
          quantity: 1,
          acBonus: 1,
          armorCheckPenalty: 0,
        },
      ];

      const ac = equipmentService.calculateAC(equipment as any, 0);
      expect(ac.shieldBonus).toBe(1);
      expect(ac.totalAC).toBe(11); // 10 + 1
    });

    it('should cap DEX bonus by armor max DEX', () => {
      const equipment = [
        {
          equipmentId: 'chainmail',
          name: 'Chainmail',
          type: 'armor',
          weight: 55,
          equipped: true,
          quantity: 1,
          acBonus: 5,
          maxDexBonus: 1,
          armorCheckPenalty: -5,
        },
      ];

      const ac = equipmentService.calculateAC(equipment as any, 5); // DEX mod of 5
      expect(ac.dexBonus).toBe(1); // Capped at 1
      expect(ac.totalAC).toBe(16); // 10 + 5 + 1
    });

    it('should accumulate armor check penalties', () => {
      const equipment = [
        {
          equipmentId: 'chainmail',
          name: 'Chainmail',
          type: 'armor',
          weight: 55,
          equipped: true,
          quantity: 1,
          acBonus: 5,
          maxDexBonus: 1,
          armorCheckPenalty: -5,
        },
        {
          equipmentId: 'shield-heavy-wooden',
          name: 'Heavy Wooden Shield',
          type: 'shield',
          weight: 15,
          equipped: true,
          quantity: 1,
          acBonus: 2,
          armorCheckPenalty: -2,
        },
      ];

      const ac = equipmentService.calculateAC(equipment as any, 0);
      expect(ac.armorCheckPenalty).toBe(-7); // -5 + -2
    });

    it('should not allow no DEX bonus cap', () => {
      const equipment = [
        {
          equipmentId: 'leather-armor',
          name: 'Leather Armor',
          type: 'armor',
          weight: 10,
          equipped: true,
          quantity: 1,
          acBonus: 1,
          maxDexBonus: null,
          armorCheckPenalty: 0,
        },
      ];

      const ac = equipmentService.calculateAC(equipment as any, 5);
      expect(ac.dexBonus).toBe(5); // No cap
      expect(ac.totalAC).toBe(16); // 10 + 1 + 5
    });
  });

  describe('Equipment Validation', () => {
    it('should allow single armor piece', () => {
      const equipment = [
        {
          equipmentId: 'leather-armor',
          name: 'Leather Armor',
          type: 'armor',
          weight: 10,
          equipped: true,
          quantity: 1,
          acBonus: 1,
        },
      ];

      const validation = equipmentService.validateEquipment(equipment as any);
      expect(validation.valid).toBe(true);
    });

    it('should reject multiple armor pieces', () => {
      const equipment = [
        {
          equipmentId: 'leather-armor',
          name: 'Leather Armor',
          type: 'armor',
          weight: 10,
          equipped: true,
          quantity: 1,
        },
        {
          equipmentId: 'chainmail',
          name: 'Chainmail',
          type: 'armor',
          weight: 55,
          equipped: true,
          quantity: 1,
        },
      ];

      const validation = equipmentService.validateEquipment(equipment as any);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('multiple armor');
    });

    it('should allow two shields', () => {
      const equipment = [
        {
          equipmentId: 'shield-light-wooden',
          name: 'Light Wooden Shield',
          type: 'shield',
          weight: 5,
          equipped: true,
          quantity: 1,
        },
        {
          equipmentId: 'shield-heavy-wooden',
          name: 'Heavy Wooden Shield',
          type: 'shield',
          weight: 15,
          equipped: true,
          quantity: 1,
        },
      ];

      const validation = equipmentService.validateEquipment(equipment as any);
      expect(validation.valid).toBe(true);
    });

    it('should reject more than two shields', () => {
      const equipment = [
        {
          equipmentId: 'shield-light-wooden',
          name: 'Light Wooden Shield',
          type: 'shield',
          weight: 5,
          equipped: true,
          quantity: 1,
        },
        {
          equipmentId: 'shield-heavy-wooden',
          name: 'Heavy Wooden Shield',
          type: 'shield',
          weight: 15,
          equipped: true,
          quantity: 1,
        },
        {
          equipmentId: 'shield-tower',
          name: 'Tower Shield',
          type: 'shield',
          weight: 45,
          equipped: true,
          quantity: 1,
        },
      ];

      const validation = equipmentService.validateEquipment(equipment as any);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('more than 2 shields');
    });
  });

  describe('Equipment Search', () => {
    it('should search by name', () => {
      const results = equipmentService.searchEquipment('longsword');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name.toLowerCase()).toContain('longsword');
    });

    it('should search case-insensitively', () => {
      const results1 = equipmentService.searchEquipment('sword');
      const results2 = equipmentService.searchEquipment('SWORD');
      expect(results1.length).toBe(results2.length);
    });

    it('should search by description', () => {
      const results = equipmentService.searchEquipment('metal');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty for no matches', () => {
      const results = equipmentService.searchEquipment('fakequipment123');
      expect(results.length).toBe(0);
    });
  });

  describe('Weapon Damage', () => {
    it('should get weapon damage for longsword', () => {
      const damage = equipmentService.getWeaponDamage('longsword', 2);
      expect(damage).not.toBeNull();
      expect(damage?.baseDamage).toBe('1d8');
      expect(damage?.modifier).toBe(2);
    });

    it('should return null for non-weapon', () => {
      const damage = equipmentService.getWeaponDamage('leather-armor', 2);
      expect(damage).toBeNull();
    });

    it('should parse dice correctly', () => {
      const damage = equipmentService.getWeaponDamage('greataxe', 0);
      expect(damage?.diceCount).toBe(1);
      expect(damage?.diceSize).toBe(12);
    });
  });

  describe('Load Status', () => {
    it('should show unencumbered status', () => {
      const status = equipmentService.getLoadStatus(50, 15);
      expect(status.status).toBe('Unencumbered');
      expect(status.percentOfCapacity).toBeLessThan(100);
    });

    it('should show lightly encumbered status', () => {
      const status = equipmentService.getLoadStatus(200, 15);
      expect(status.status).toBe('Lightly Encumbered');
    });

    it('should show heavily encumbered status', () => {
      const status = equipmentService.getLoadStatus(500, 15);
      expect(status.status).toBe('Heavily Encumbered');
    });

    it('should calculate percentage of capacity', () => {
      const status = equipmentService.getLoadStatus(150, 15);
      expect(status.percentOfCapacity).toBeGreaterThan(0);
      expect(status.percentOfCapacity).toBeLessThanOrEqual(100);
    });
  });
});
