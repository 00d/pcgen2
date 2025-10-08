/**
 * Phase 5: Spell Service Tests
 * Comprehensive tests for spell management, slots, preparation, and casting
 */

import spellService from '../spellService';

describe('SpellService', () => {
  describe('Spell Loading', () => {
    it('should get all spells', () => {
      const spells = spellService.getAllSpells();
      expect(spells.length).toBeGreaterThan(0);
    });

    it('should get spells by level', () => {
      const level1Spells = spellService.getSpellsByLevel(1);
      expect(level1Spells.length).toBeGreaterThan(0);
      expect(level1Spells[0].level).toBe(1);
    });

    it('should get spells by class', () => {
      const wizardSpells = spellService.getSpellsByClass('Wizard');
      expect(wizardSpells.length).toBeGreaterThan(0);
      expect(wizardSpells[0].classes).toContain('Wizard');
    });

    it('should get spells by school', () => {
      const evocationSpells = spellService.getSpellsBySchool('Evocation');
      expect(evocationSpells.length).toBeGreaterThan(0);
      expect(evocationSpells[0].school).toBe('Evocation');
    });

    it('should get specific spell by ID', () => {
      const spell = spellService.getSpellById('magic-missile');
      expect(spell).not.toBeNull();
      expect(spell?.name).toBe('Magic Missile');
    });

    it('should return null for non-existent spell', () => {
      const spell = spellService.getSpellById('fake-spell');
      expect(spell).toBeNull();
    });
  });

  describe('Spell Schools', () => {
    it('should get all schools', () => {
      const schools = spellService.getSchools();
      expect(schools.length).toBeGreaterThan(0);
      expect(schools).toContain('Evocation');
      expect(schools).toContain('Abjuration');
    });

    it('should return schools sorted', () => {
      const schools = spellService.getSchools();
      const sorted = [...schools].sort();
      expect(schools).toEqual(sorted);
    });
  });

  describe('Spell Slots - Wizard', () => {
    it('should calculate wizard spell slots at level 1', () => {
      const slots = spellService.calculateSpellSlots('Wizard', 1, 2);
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0].level).toBe(0); // Cantrips
      expect(slots[0].total).toBe(-1); // Unlimited
    });

    it('should calculate wizard spell slots at level 5', () => {
      const slots = spellService.calculateSpellSlots('Wizard', 5, 2);
      const level1Slots = slots.find((s) => s.level === 1);
      expect(level1Slots).toBeDefined();
      expect(level1Slots?.total).toBeGreaterThanOrEqual(1);
    });

    it('should increase wizard slots with ability modifier', () => {
      const slotsLowAbility = spellService.calculateSpellSlots('Wizard', 5, 0);
      const slotsHighAbility = spellService.calculateSpellSlots('Wizard', 5, 4);

      const level1Low = slotsLowAbility.find((s) => s.level === 1);
      const level1High = slotsHighAbility.find((s) => s.level === 1);

      expect(level1High!.total).toBeGreaterThanOrEqual(level1Low!.total);
    });
  });

  describe('Spell Slots - Cleric', () => {
    it('should calculate cleric spell slots at level 1', () => {
      const slots = spellService.calculateSpellSlots('Cleric', 1, 2);
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0].level).toBe(0); // Orisons
      expect(slots[0].total).toBe(-1); // Unlimited
    });

    it('should calculate cleric spell slots at level 5', () => {
      const slots = spellService.calculateSpellSlots('Cleric', 5, 2);
      const level1Slots = slots.find((s) => s.level === 1);
      expect(level1Slots).toBeDefined();
      expect(level1Slots?.total).toBeGreaterThanOrEqual(2);
    });

    it('should increase cleric slots with ability modifier', () => {
      const slotsLowAbility = spellService.calculateSpellSlots('Cleric', 5, 0);
      const slotsHighAbility = spellService.calculateSpellSlots('Cleric', 5, 4);

      const level1Low = slotsLowAbility.find((s) => s.level === 1);
      const level1High = slotsHighAbility.find((s) => s.level === 1);

      expect(level1High!.total).toBeGreaterThanOrEqual(level1Low!.total);
    });
  });

  describe('Spell Slots - Sorcerer', () => {
    it('should calculate sorcerer spell slots at level 1', () => {
      const slots = spellService.calculateSpellSlots('Sorcerer', 1, 2);
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0].level).toBe(0); // Cantrips
      expect(slots[0].total).toBe(-1); // Unlimited
    });

    it('should calculate sorcerer spell slots at level 5', () => {
      const slots = spellService.calculateSpellSlots('Sorcerer', 5, 2);
      const level1Slots = slots.find((s) => s.level === 1);
      expect(level1Slots).toBeDefined();
      expect(level1Slots?.total).toBeGreaterThanOrEqual(2);
    });

    it('should have same base slots regardless of ability', () => {
      const slotsLowAbility = spellService.calculateSpellSlots('Sorcerer', 5, 0);
      const slotsHighAbility = spellService.calculateSpellSlots('Sorcerer', 5, 4);

      const level1Low = slotsLowAbility.find((s) => s.level === 1);
      const level1High = slotsHighAbility.find((s) => s.level === 1);

      // High ability has more slots due to bonus
      expect(level1High!.total).toBeGreaterThanOrEqual(level1Low!.total);
    });
  });

  describe('Spell Slots - Paladin/Ranger', () => {
    it('should not allow spells before level 4', () => {
      const slots = spellService.calculateSpellSlots('Paladin', 1, 2);
      expect(slots.length).toBe(0);
    });

    it('should calculate paladin spell slots at level 4', () => {
      const slots = spellService.calculateSpellSlots('Paladin', 4, 2);
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0].level).toBe(1);
    });

    it('should calculate ranger spell slots at level 4', () => {
      const slots = spellService.calculateSpellSlots('Ranger', 4, 2);
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0].level).toBe(1);
    });
  });

  describe('Spell Validation', () => {
    it('should validate spell for class', () => {
      const valid = spellService.validateSpellForClass('magic-missile', 'Wizard');
      expect(valid).toBe(true);
    });

    it('should reject spell not for class', () => {
      const valid = spellService.validateSpellForClass('magic-missile', 'Cleric');
      expect(valid).toBe(false);
    });

    it('should return false for non-existent spell', () => {
      const valid = spellService.validateSpellForClass('fake-spell', 'Wizard');
      expect(valid).toBe(false);
    });
  });

  describe('Available Spell Count', () => {
    it('should return correct spell count for wizard', () => {
      const count = spellService.getAvailableSpellCount('Wizard', 5);
      expect(count).toBe(5);
    });

    it('should return correct spell count for sorcerer level 1', () => {
      const count = spellService.getAvailableSpellCount('Sorcerer', 1);
      expect(count).toBe(4);
    });

    it('should return correct spell count for sorcerer level 5', () => {
      const count = spellService.getAvailableSpellCount('Sorcerer', 5);
      expect(count).toBe(6);
    });

    it('should return unlimited for prepared casters', () => {
      const count = spellService.getAvailableSpellCount('Cleric', 5);
      expect(count).toBe(-1); // Unlimited
    });
  });

  describe('Spell Search', () => {
    it('should search by name', () => {
      const results = spellService.searchSpells('magic');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name.toLowerCase()).toContain('magic');
    });

    it('should search case-insensitively', () => {
      const results1 = spellService.searchSpells('missile');
      const results2 = spellService.searchSpells('MISSILE');
      expect(results1.length).toBe(results2.length);
    });

    it('should search by description', () => {
      const results = spellService.searchSpells('damage');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search by school', () => {
      const results = spellService.searchSpells('evocation');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty for no matches', () => {
      const results = spellService.searchSpells('fakespell123');
      expect(results.length).toBe(0);
    });
  });

  describe('Known Spells (Sorcerer/Bard)', () => {
    it('should add known spell', () => {
      const character: any = {
        spells: {
          spellsKnown: [],
        },
      };

      const success = spellService.addKnownSpell(character, 'magic-missile');
      expect(success).toBe(true);
      expect(character.spells.spellsKnown.length).toBe(1);
      expect(character.spells.spellsKnown[0].id).toBe('magic-missile');
    });

    it('should not add duplicate known spell', () => {
      const character: any = {
        spells: {
          spellsKnown: [{ id: 'magic-missile', name: 'Magic Missile', level: 1, description: 'Test' }],
        },
      };

      const success = spellService.addKnownSpell(character, 'magic-missile');
      expect(success).toBe(false);
      expect(character.spells.spellsKnown.length).toBe(1);
    });

    it('should not add non-existent spell', () => {
      const character: any = {
        spells: {
          spellsKnown: [],
        },
      };

      const success = spellService.addKnownSpell(character, 'fake-spell');
      expect(success).toBe(false);
    });

    it('should remove known spell', () => {
      const character: any = {
        spells: {
          spellsKnown: [{ id: 'magic-missile', name: 'Magic Missile', level: 1, description: 'Test' }],
        },
      };

      const success = spellService.removeKnownSpell(character, 'magic-missile');
      expect(success).toBe(true);
      expect(character.spells.spellsKnown.length).toBe(0);
    });

    it('should not remove non-existent spell', () => {
      const character: any = {
        spells: {
          spellsKnown: [{ id: 'magic-missile', name: 'Magic Missile', level: 1, description: 'Test' }],
        },
      };

      const success = spellService.removeKnownSpell(character, 'fake-spell');
      expect(success).toBe(false);
      expect(character.spells.spellsKnown.length).toBe(1);
    });
  });

  describe('Spell Casting', () => {
    it('should cast spell with available slots', () => {
      const character: any = {
        spells: {
          spellSlots: [
            { level: 1, perDay: 2, used: 0 },
            { level: 0, perDay: -1, used: 0 },
          ],
        },
      };

      const success = spellService.castSpell(character, 1);
      expect(success).toBe(true);
      expect(character.spells.spellSlots[0].used).toBe(1);
    });

    it('should not cast without available slots', () => {
      const character: any = {
        spells: {
          spellSlots: [
            { level: 1, perDay: 2, used: 2 },
            { level: 0, perDay: -1, used: 0 },
          ],
        },
      };

      const success = spellService.castSpell(character, 1);
      expect(success).toBe(false);
      expect(character.spells.spellSlots[0].used).toBe(2);
    });

    it('should not cast if no slot available', () => {
      const character: any = {
        spells: {
          spellSlots: [
            { level: 0, perDay: -1, used: 0 },
          ],
        },
      };

      const success = spellService.castSpell(character, 5); // No level 5 slots
      expect(success).toBe(false);
    });
  });

  describe('Rest and Regain', () => {
    it('should reset spell slots on rest', () => {
      const character: any = {
        spells: {
          spellSlots: [
            { level: 1, perDay: 2, used: 2 },
            { level: 2, perDay: 1, used: 1 },
          ],
        },
      };

      spellService.restAndRegainSlots(character);

      expect(character.spells.spellSlots[0].used).toBe(0);
      expect(character.spells.spellSlots[1].used).toBe(0);
    });
  });
});
