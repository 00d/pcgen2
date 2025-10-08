import MulticlassService from '../multiclassService';

describe('MulticlassService', () => {
  const mockClasses = [
    {
      classId: 'fighter',
      className: 'Fighter',
      level: 5,
      hitDie: 'd10',
      baseAttackBonusProgression: 'good',
    },
    {
      classId: 'rogue',
      className: 'Rogue',
      level: 3,
      hitDie: 'd8',
      baseAttackBonusProgression: 'moderate',
    },
    {
      classId: 'wizard',
      className: 'Wizard',
      level: 2,
      hitDie: 'd6',
      baseAttackBonusProgression: 'poor',
    },
  ];

  describe('calculateMulticlassBAB', () => {
    it('should calculate BAB for single good progression class', () => {
      const classes = [mockClasses[0]]; // Fighter Level 5
      const result = MulticlassService.calculateMulticlassBAB(classes);

      expect(result.totalBAB).toBe(5); // 5 * 1.0
      expect(result.perClass['fighter']).toBe(5);
    });

    it('should calculate BAB for single moderate progression class', () => {
      const classes = [mockClasses[1]]; // Rogue Level 3
      const result = MulticlassService.calculateMulticlassBAB(classes);

      expect(result.totalBAB).toBe(2); // floor(3 * 0.75)
      expect(result.perClass['rogue']).toBe(2);
    });

    it('should calculate BAB for single poor progression class', () => {
      const classes = [mockClasses[2]]; // Wizard Level 2
      const result = MulticlassService.calculateMulticlassBAB(classes);

      expect(result.totalBAB).toBe(1); // floor(2 * 0.5)
      expect(result.perClass['wizard']).toBe(1);
    });

    it('should use highest BAB for multiclass', () => {
      const result = MulticlassService.calculateMulticlassBAB(mockClasses);

      expect(result.totalBAB).toBe(5); // Fighter's BAB is highest
      expect(result.perClass['fighter']).toBe(5);
      expect(result.perClass['rogue']).toBe(2);
      expect(result.perClass['wizard']).toBe(1);
    });

    it('should handle empty class array', () => {
      const result = MulticlassService.calculateMulticlassBAB([]);

      expect(result.totalBAB).toBe(0);
      expect(Object.keys(result.perClass).length).toBe(0);
    });
  });

  describe('calculateMulticlassSaves', () => {
    it('should calculate saves for single class', () => {
      const classes = [mockClasses[0]]; // Fighter
      const result = MulticlassService.calculateMulticlassSaves(classes);

      expect(result.fort).toBeGreaterThanOrEqual(0);
      expect(result.ref).toBeGreaterThanOrEqual(0);
      expect(result.will).toBeGreaterThanOrEqual(0);
    });

    it('should use best saves for multiclass', () => {
      const result = MulticlassService.calculateMulticlassSaves(mockClasses);

      // Should have saves for all three classes
      expect(result.perClass['fighter']).toBeDefined();
      expect(result.perClass['rogue']).toBeDefined();
      expect(result.perClass['wizard']).toBeDefined();

      // Total should be best of each
      expect(result.fort).toBe(
        Math.max(
          result.perClass['fighter'].fort,
          result.perClass['rogue'].fort,
          result.perClass['wizard'].fort
        )
      );
    });

    it('should apply bonus modifiers', () => {
      const classes = [mockClasses[0]];
      const bonus = { fort: 2, ref: 1, will: 0 };
      const result = MulticlassService.calculateMulticlassSaves(classes, bonus);

      // Base save + bonus
      expect(result.fort).toBe(result.perClass['fighter'].fort + 2);
      expect(result.ref).toBe(result.perClass['fighter'].ref + 1);
    });
  });

  describe('calculateMulticlassHP', () => {
    it('should calculate HP for single class', () => {
      const classes = [mockClasses[0]]; // Fighter d10 Level 5
      const conMod = 2;
      const result = MulticlassService.calculateMulticlassHP(classes, conMod);

      // 5 * (10 + 2) = 60
      expect(result.totalHP).toBe(60);
      expect(result.perClass['fighter']).toBe(60);
    });

    it('should sum HP from multiple classes', () => {
      const conMod = 1;
      const result = MulticlassService.calculateMulticlassHP(mockClasses, conMod);

      // Fighter: 5 * (10 + 1) = 55
      // Rogue: 3 * (8 + 1) = 27
      // Wizard: 2 * (6 + 1) = 14
      // Total: 96
      expect(result.perClass['fighter']).toBe(55);
      expect(result.perClass['rogue']).toBe(27);
      expect(result.perClass['wizard']).toBe(14);
      expect(result.totalHP).toBe(96);
    });

    it('should enforce minimum HP', () => {
      const classes = [
        {
          classId: 'wizard',
          className: 'Wizard',
          level: 5,
          hitDie: 'd6',
          baseAttackBonusProgression: 'poor',
        },
      ];
      const conMod = -3; // Very low CON
      const result = MulticlassService.calculateMulticlassHP(classes, conMod);

      // Should be at least 1 HP per level
      expect(result.totalHP).toBeGreaterThanOrEqual(5);
    });

    it('should handle zero CON modifier', () => {
      const classes = [mockClasses[0]];
      const result = MulticlassService.calculateMulticlassHP(classes, 0);

      // 5 * 10 = 50
      expect(result.totalHP).toBe(50);
    });
  });

  describe('calculateMulticlassSkillPoints', () => {
    it('should calculate skill points for single class', () => {
      const classes = [
        {
          classId: 'fighter',
          className: 'Fighter',
          level: 5,
          hitDie: 'd10',
          baseAttackBonusProgression: 'good',
        },
      ];
      const intMod = 1;
      const result = MulticlassService.calculateMulticlassSkillPoints(classes, intMod);

      // Fighter: 5 * (2 + 1) = 15
      expect(result).toBe(15);
    });

    it('should sum skill points from multiple classes', () => {
      const intMod = 2;
      const result = MulticlassService.calculateMulticlassSkillPoints(mockClasses, intMod);

      // Fighter: 5 * (2 + 2) = 20
      // Rogue: 3 * (8 + 2) = 30
      // Wizard: 2 * (2 + 2) = 8
      // Total: 58
      expect(result).toBe(58);
    });

    it('should handle zero INT modifier', () => {
      const classes = [mockClasses[0]];
      const result = MulticlassService.calculateMulticlassSkillPoints(classes, 0);

      // Fighter: 5 * 2 = 10
      expect(result).toBe(10);
    });

    it('should handle negative INT modifier (use 0 as minimum)', () => {
      const classes = [mockClasses[0]];
      const result = MulticlassService.calculateMulticlassSkillPoints(classes, -2);

      // Fighter: 5 * (2 + 0) = 10 (bonus capped at 0)
      expect(result).toBeGreaterThanOrEqual(10);
    });
  });

  describe('calculateTotalLevel', () => {
    it('should calculate single class level', () => {
      const classes = [mockClasses[0]];
      const result = MulticlassService.calculateTotalLevel(classes);

      expect(result).toBe(5);
    });

    it('should sum multiclass levels', () => {
      const result = MulticlassService.calculateTotalLevel(mockClasses);

      expect(result).toBe(10); // 5 + 3 + 2
    });

    it('should handle empty array', () => {
      const result = MulticlassService.calculateTotalLevel([]);

      expect(result).toBe(0);
    });
  });

  describe('validateMulticlass', () => {
    it('should accept single valid class', () => {
      const classes = [mockClasses[0]];
      const result = MulticlassService.validateMulticlass(classes);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept multiclass with different classes', () => {
      const result = MulticlassService.validateMulticlass(mockClasses);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty array', () => {
      const result = MulticlassService.validateMulticlass([]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least one class');
    });

    it('should reject too many classes', () => {
      const manyClasses = [
        mockClasses[0],
        mockClasses[1],
        mockClasses[2],
        { ...mockClasses[0], classId: 'barbarian' },
        { ...mockClasses[0], classId: 'ranger' },
        { ...mockClasses[0], classId: 'cleric' },
      ];

      const result = MulticlassService.validateMulticlass(manyClasses);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('more than 5');
    });

    it('should reject duplicate classes', () => {
      const duplicateClasses = [
        mockClasses[0],
        mockClasses[0], // Same class twice
      ];

      const result = MulticlassService.validateMulticlass(duplicateClasses);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('duplicate');
    });

    it('should allow exactly 5 classes', () => {
      const fiveClasses = [
        mockClasses[0],
        mockClasses[1],
        mockClasses[2],
        { ...mockClasses[0], classId: 'barbarian' },
        { ...mockClasses[0], classId: 'ranger' },
      ];

      const result = MulticlassService.validateMulticlass(fiveClasses);

      expect(result.valid).toBe(true);
    });
  });

  describe('recalculateMulticlassStats', () => {
    it('should return zeros for character with no classes', () => {
      const character = {
        attributes: {
          classes: [],
          abilityScores: {
            con: { base: 10 },
            int: { base: 10 },
          },
        },
      } as any;

      const result = MulticlassService.recalculateMulticlassStats(character);

      expect(result.totalLevel).toBe(0);
      expect(result.baseAttackBonus).toBe(0);
      expect(result.hitPoints.totalHP).toBe(0);
    });

    it('should calculate all stats for multiclass character', () => {
      const character = {
        attributes: {
          classes: mockClasses,
          abilityScores: {
            con: { base: 12 },
            int: { base: 14 },
          },
        },
      } as any;

      const result = MulticlassService.recalculateMulticlassStats(character);

      expect(result.totalLevel).toBe(10);
      expect(result.baseAttackBonus).toBe(5);
      expect(result.hitPoints.totalHP).toBeGreaterThan(0);
      expect(result.skillPoints).toBeGreaterThan(0);
      expect(result.savingThrows.fort).toBeGreaterThanOrEqual(0);
    });

    it('should include per-class breakdown', () => {
      const character = {
        attributes: {
          classes: mockClasses,
          abilityScores: {
            con: { base: 10 },
            int: { base: 10 },
          },
        },
      } as any;

      const result = MulticlassService.recalculateMulticlassStats(character);

      expect(result.baseAttackBonusByClass['fighter']).toBeDefined();
      expect(result.baseAttackBonusByClass['rogue']).toBeDefined();
      expect(result.baseAttackBonusByClass['wizard']).toBeDefined();
      expect(result.hitPoints.perClass['fighter']).toBeDefined();
    });
  });
});
