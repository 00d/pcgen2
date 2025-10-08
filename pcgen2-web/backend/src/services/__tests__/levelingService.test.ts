/**
 * Phase 5: Leveling Service Tests
 * Comprehensive tests for character leveling and advancement
 */

import levelingService from '../levelingService';

describe('LevelingService', () => {
  describe('Experience Table', () => {
    it('should return correct experience for level 1', () => {
      expect(levelingService.getExperienceForLevel(1)).toBe(0);
    });

    it('should return correct experience for level 5', () => {
      expect(levelingService.getExperienceForLevel(5)).toBe(10000);
    });

    it('should return correct experience for level 10', () => {
      expect(levelingService.getExperienceForLevel(10)).toBe(45000);
    });

    it('should return correct experience for level 20', () => {
      expect(levelingService.getExperienceForLevel(20)).toBe(190000);
    });

    it('should return 0 for invalid levels', () => {
      expect(levelingService.getExperienceForLevel(21)).toBe(0);
      expect(levelingService.getExperienceForLevel(0)).toBe(0);
    });
  });

  describe('Hit Point Calculation', () => {
    it('should calculate HP gain for d10 hit die with positive CON', () => {
      const hp = levelingService.calculateHPGain('d10', 2);
      expect(hp).toBe(12); // 10 + 2
    });

    it('should calculate HP gain for d8 hit die', () => {
      const hp = levelingService.calculateHPGain('d8', 1);
      expect(hp).toBe(9); // 8 + 1
    });

    it('should calculate HP gain for d6 hit die', () => {
      const hp = levelingService.calculateHPGain('d6', 0);
      expect(hp).toBe(6); // 6 + 0
    });

    it('should enforce minimum 1 HP per level', () => {
      const hp = levelingService.calculateHPGain('d4', -5);
      expect(hp).toBe(1); // 4 - 5 = -1, but minimum is 1
    });

    it('should handle d12 hit die', () => {
      const hp = levelingService.calculateHPGain('d12', 0);
      expect(hp).toBe(12);
    });
  });

  describe('Skill Points Calculation', () => {
    it('should calculate skill points with positive INT modifier', () => {
      const points = levelingService.calculateSkillPointsGain(4, 2);
      expect(points).toBe(6); // 4 + 2
    });

    it('should calculate skill points with no INT modifier', () => {
      const points = levelingService.calculateSkillPointsGain(2, 0);
      expect(points).toBe(2);
    });

    it('should not apply negative INT modifier', () => {
      const points = levelingService.calculateSkillPointsGain(4, -3);
      expect(points).toBe(4); // -3 becomes 0, so 4 + 0
    });

    it('should handle high INT modifiers', () => {
      const points = levelingService.calculateSkillPointsGain(2, 5);
      expect(points).toBe(7); // 2 + 5
    });
  });

  describe('Feat Advancement', () => {
    it('should grant bonus feat at level 1', () => {
      const feats = levelingService.getFeatsForLevel(1);
      expect(feats.bonusFeats).toBe(true);
    });

    it('should grant bonus feat at level 5', () => {
      const feats = levelingService.getFeatsForLevel(5);
      expect(feats.bonusFeats).toBe(true);
    });

    it('should grant bonus feat at level 9', () => {
      const feats = levelingService.getFeatsForLevel(9);
      expect(feats.bonusFeats).toBe(true);
    });

    it('should grant bonus feat at level 13', () => {
      const feats = levelingService.getFeatsForLevel(13);
      expect(feats.bonusFeats).toBe(true);
    });

    it('should grant bonus feat at level 17', () => {
      const feats = levelingService.getFeatsForLevel(17);
      expect(feats.bonusFeats).toBe(true);
    });

    it('should not grant bonus feat at level 2', () => {
      const feats = levelingService.getFeatsForLevel(2);
      expect(feats.bonusFeats).toBe(false);
    });

    it('should grant ability score improvement at level 4', () => {
      const feats = levelingService.getFeatsForLevel(4);
      expect(feats.abilityScoreImprovement).toBe(true);
    });

    it('should grant ability score improvement at level 8', () => {
      const feats = levelingService.getFeatsForLevel(8);
      expect(feats.abilityScoreImprovement).toBe(true);
    });

    it('should grant ability score improvement at level 12', () => {
      const feats = levelingService.getFeatsForLevel(12);
      expect(feats.abilityScoreImprovement).toBe(true);
    });

    it('should grant ability score improvement at level 16', () => {
      const feats = levelingService.getFeatsForLevel(16);
      expect(feats.abilityScoreImprovement).toBe(true);
    });

    it('should grant ability score improvement at level 20', () => {
      const feats = levelingService.getFeatsForLevel(20);
      expect(feats.abilityScoreImprovement).toBe(true);
    });

    it('should not grant ability score improvement at level 5', () => {
      const feats = levelingService.getFeatsForLevel(5);
      expect(feats.abilityScoreImprovement).toBe(false);
    });
  });

  describe('Level Validation', () => {
    it('should accept level 1', () => {
      const validation = levelingService.validateLevel(1);
      expect(validation.valid).toBe(true);
    });

    it('should accept level 10', () => {
      const validation = levelingService.validateLevel(10);
      expect(validation.valid).toBe(true);
    });

    it('should accept level 20', () => {
      const validation = levelingService.validateLevel(20);
      expect(validation.valid).toBe(true);
    });

    it('should reject level 0', () => {
      const validation = levelingService.validateLevel(0);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('between 1 and 20');
    });

    it('should reject level 21', () => {
      const validation = levelingService.validateLevel(21);
      expect(validation.valid).toBe(false);
    });

    it('should reject negative levels', () => {
      const validation = levelingService.validateLevel(-5);
      expect(validation.valid).toBe(false);
    });

    it('should reject non-integer levels', () => {
      const validation = levelingService.validateLevel(5.5);
      expect(validation.valid).toBe(false);
    });
  });

  describe('Experience Progression', () => {
    it('should get next level experience for level 1', () => {
      const nextExp = levelingService.getNextLevelExperience(1);
      expect(nextExp).toBe(1000);
    });

    it('should get next level experience for level 10', () => {
      const nextExp = levelingService.getNextLevelExperience(10);
      expect(nextExp).toBe(55000);
    });

    it('should cap at level 20', () => {
      const nextExp = levelingService.getNextLevelExperience(20);
      expect(nextExp).toBe(levelingService.getExperienceForLevel(20));
    });

    it('should calculate level from experience correctly', () => {
      expect(levelingService.getLevelFromExperience(0)).toBe(1);
      expect(levelingService.getLevelFromExperience(1000)).toBe(2);
      expect(levelingService.getLevelFromExperience(3000)).toBe(3);
      expect(levelingService.getLevelFromExperience(10000)).toBe(5);
      expect(levelingService.getLevelFromExperience(45000)).toBe(10);
      expect(levelingService.getLevelFromExperience(190000)).toBe(20);
    });

    it('should calculate experience progress to next level', () => {
      const progress = levelingService.getExperienceProgress(500, 1);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
    });

    it('should return 0% progress at level start', () => {
      const progress = levelingService.getExperienceProgress(0, 1);
      expect(progress).toBe(0);
    });
  });

  describe('Advancement Records', () => {
    it('should create advancement record with all fields', () => {
      const record = levelingService.createAdvancementRecord(
        5,
        12,
        6,
        ['Feat1', 'Feat2'],
        ['Ability1']
      );

      expect(record.level).toBe(5);
      expect(record.hitPointsGained).toBe(12);
      expect(record.skillPointsGained).toBe(6);
      expect(record.featsGained).toEqual(['Feat1', 'Feat2']);
      expect(record.abilitiesGained).toEqual(['Ability1']);
      expect(record.date).toBeDefined();
    });

    it('should create advancement record with default arrays', () => {
      const record = levelingService.createAdvancementRecord(3, 8, 4);

      expect(record.level).toBe(3);
      expect(record.featsGained).toEqual([]);
      expect(record.abilitiesGained).toEqual([]);
    });
  });

  describe('Advancement Options', () => {
    it('should provide options for level up with bonus feats', () => {
      const mockCharacter = { derivedStats: { totalLevel: 4 } };
      const options = levelingService.getAdvancementOptions(mockCharacter as any, 5);

      expect(options.level).toBe(5);
      expect(options.bonusFeats).toBe(true);
    });

    it('should provide options for ability score improvement level', () => {
      const mockCharacter = { derivedStats: { totalLevel: 3 } };
      const options = levelingService.getAdvancementOptions(mockCharacter as any, 4);

      expect(options.level).toBe(4);
      expect(options.abilityScoreImprovement).toBe(true);
    });

    it('should provide options for regular level up', () => {
      const mockCharacter = { derivedStats: { totalLevel: 2 } };
      const options = levelingService.getAdvancementOptions(mockCharacter as any, 3);

      expect(options.level).toBe(3);
      expect(options.bonusFeats).toBe(false);
      expect(options.abilityScoreImprovement).toBe(false);
    });
  });

  describe('Leveling Request Validation', () => {
    it('should reject leveling to same level', () => {
      const mockCharacter = { derivedStats: { totalLevel: 5 } };
      const validation = levelingService.validateLevelingRequest(mockCharacter as any, 5);

      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('already level');
    });

    it('should reject decreasing level', () => {
      const mockCharacter = { derivedStats: { totalLevel: 10 } };
      const validation = levelingService.validateLevelingRequest(mockCharacter as any, 5);

      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('decrease');
    });

    it('should reject level above 20', () => {
      const mockCharacter = { derivedStats: { totalLevel: 5 } };
      const validation = levelingService.validateLevelingRequest(mockCharacter as any, 25);

      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('Maximum');
    });

    it('should accept valid level up', () => {
      const mockCharacter = { derivedStats: { totalLevel: 5 } };
      const validation = levelingService.validateLevelingRequest(mockCharacter as any, 10);

      expect(validation.valid).toBe(true);
    });

    it('should accept level up to 20', () => {
      const mockCharacter = { derivedStats: { totalLevel: 19 } };
      const validation = levelingService.validateLevelingRequest(mockCharacter as any, 20);

      expect(validation.valid).toBe(true);
    });
  });

  describe('Spell Slot Calculation', () => {
    it('should calculate spell slots for cleric', () => {
      const slots = levelingService.calculateSpellSlotGain('cleric', 5);
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0].count).toBe(1);
    });

    it('should calculate spell slots for wizard', () => {
      const slots = levelingService.calculateSpellSlotGain('wizard', 1);
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0].level).toBe(1);
    });

    it('should calculate spell slots for sorcerer', () => {
      const slots = levelingService.calculateSpellSlotGain('sorcerer', 3);
      expect(slots.length).toBeGreaterThan(0);
    });

    it('should handle non-spellcaster classes', () => {
      const slots = levelingService.calculateSpellSlotGain('fighter', 5);
      expect(slots.length).toBe(0);
    });
  });
});
