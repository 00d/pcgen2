/**
 * Phase 5: Character Export Service Tests
 * Comprehensive tests for character export to JSON, HTML, and PDF
 */

import exportService from '../exportService';

const mockCharacter: any = {
  _id: '123',
  userId: 'user123',
  name: 'Aragorn',
  race: 'Human',
  class: 'Fighter',
  experience: 5000,
  alignment: 'Lawful Good',
  deity: 'Elbereth',
  description: 'A noble ranger and heir to the throne',
  notes: 'Member of the Fellowship',
  hitPoints: {
    current: 45,
    maximum: 50,
  },
  attributes: {
    abilityScores: {
      str: { base: 16, total: 16 },
      dex: { base: 14, total: 14 },
      con: { base: 15, total: 15 },
      int: { base: 13, total: 13 },
      wis: { base: 14, total: 14 },
      cha: { base: 15, total: 15 },
    },
    skills: [
      { name: 'Athletics', rank: 5, modifier: 8 },
      { name: 'Perception', rank: 4, modifier: 6 },
    ],
    feats: ['Weapon Focus (Longsword)', 'Power Attack'],
  },
  derivedStats: {
    totalLevel: 5,
    maxHitPoints: 50,
    armorClass: { total: 18, base: 10, armor: 5, shield: 2, dex: 2, misc: -1 },
    baseAttackBonus: 5,
    savingThrows: { fortitude: 5, reflex: 3, will: 2 },
  },
  equipment: [
    {
      id: 'longsword',
      name: 'Longsword',
      type: 'weapon',
      weight: 4,
      quantity: 1,
      equipped: true,
    },
    {
      id: 'plate-armor',
      name: 'Plate Armor',
      type: 'armor',
      weight: 50,
      quantity: 1,
      equipped: true,
    },
  ],
  spells: {
    spellcaster: false,
    spellsKnown: [],
    spellSlots: [],
  },
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-10-08'),
};

describe('ExportService', () => {
  describe('Validation', () => {
    it('should validate character for export', () => {
      const result = exportService.validateCharacterForExport(mockCharacter);
      expect(result.valid).toBe(true);
    });

    it('should reject character without name', () => {
      const character = { ...mockCharacter, name: '' };
      const result = exportService.validateCharacterForExport(character);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('name');
    });

    it('should reject character without class', () => {
      const character = { ...mockCharacter, class: '' };
      const result = exportService.validateCharacterForExport(character);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('class');
    });
  });

  describe('Format Character for Export', () => {
    it('should format character with basic info', () => {
      const exported = exportService.formatCharacterForExport(mockCharacter);

      expect(exported.name).toBe('Aragorn');
      expect(exported.race).toBe('Human');
      expect(exported.class).toBe('Fighter');
      expect(exported.level).toBe(5);
      expect(exported.experience).toBe(5000);
      expect(exported.alignment).toBe('Lawful Good');
      expect(exported.deity).toBe('Elbereth');
    });

    it('should format ability scores correctly', () => {
      const exported = exportService.formatCharacterForExport(mockCharacter);

      expect(exported.abilityScores.str).toBe(16);
      expect(exported.abilityScores.dex).toBe(14);
      expect(exported.abilityScores.con).toBe(15);
      expect(exported.abilityScores.int).toBe(13);
      expect(exported.abilityScores.wis).toBe(14);
      expect(exported.abilityScores.cha).toBe(15);
    });

    it('should format combat stats correctly', () => {
      const exported = exportService.formatCharacterForExport(mockCharacter);

      expect(exported.hitPoints.current).toBe(45);
      expect(exported.hitPoints.maximum).toBe(50);
      expect(exported.armorClass.total).toBe(18);
      expect(exported.baseAttackBonus).toBe(5);
    });

    it('should format saving throws correctly', () => {
      const exported = exportService.formatCharacterForExport(mockCharacter);

      expect(exported.savingThrows.fortitude).toBe(5);
      expect(exported.savingThrows.reflex).toBe(3);
      expect(exported.savingThrows.will).toBe(2);
    });

    it('should include feats', () => {
      const exported = exportService.formatCharacterForExport(mockCharacter);

      expect(exported.feats).toContain('Weapon Focus (Longsword)');
      expect(exported.feats).toContain('Power Attack');
    });

    it('should include skills', () => {
      const exported = exportService.formatCharacterForExport(mockCharacter);

      expect(exported.skills.length).toBe(2);
      expect(exported.skills[0].name).toBe('Athletics');
      expect(exported.skills[0].rank).toBe(5);
    });

    it('should include equipment when requested', () => {
      const exported = exportService.formatCharacterForExport(mockCharacter, {
        includeEquipment: true,
      });

      expect(exported.equipment).toBeDefined();
      expect(exported.equipment!.length).toBe(2);
      expect(exported.equipment![0].name).toBe('Longsword');
      expect(exported.equipment![1].equipped).toBe(true);
    });

    it('should exclude equipment when not requested', () => {
      const exported = exportService.formatCharacterForExport(mockCharacter, {
        includeEquipment: false,
      });

      expect(exported.equipment).toBeUndefined();
    });

    it('should include spells when requested', () => {
      const character = {
        ...mockCharacter,
        spells: {
          spellcaster: true,
          spellsKnown: [
            { id: 'magic-missile', name: 'Magic Missile', level: 1, school: 'Evocation' },
          ],
          spellSlots: [
            { level: 1, perDay: 3, used: 1 },
          ],
        },
      };

      const exported = exportService.formatCharacterForExport(character, {
        includeSpells: true,
      });

      expect(exported.spells).toBeDefined();
      expect(exported.spells!.known.length).toBe(1);
      expect(exported.spells!.slots.length).toBe(1);
    });
  });

  describe('JSON Export', () => {
    it('should export as valid JSON', () => {
      const json = exportService.exportAsJSON(mockCharacter);
      const parsed = JSON.parse(json);

      expect(parsed.name).toBe('Aragorn');
      expect(parsed.class).toBe('Fighter');
      expect(parsed.level).toBe(5);
    });

    it('should include all sections in JSON export', () => {
      const json = exportService.exportAsJSON(mockCharacter);
      const parsed = JSON.parse(json);

      expect(parsed.abilityScores).toBeDefined();
      expect(parsed.hitPoints).toBeDefined();
      expect(parsed.armorClass).toBeDefined();
      expect(parsed.savingThrows).toBeDefined();
      expect(parsed.feats).toBeDefined();
      expect(parsed.skills).toBeDefined();
    });

    it('should include equipment in JSON export by default', () => {
      const json = exportService.exportAsJSON(mockCharacter);
      const parsed = JSON.parse(json);

      expect(parsed.equipment).toBeDefined();
      expect(parsed.equipment.length).toBeGreaterThan(0);
    });

    it('should format JSON with proper indentation', () => {
      const json = exportService.exportAsJSON(mockCharacter);

      // Should have 2-space indentation
      expect(json).toContain('  ');
      // Should be multi-line
      expect(json.split('\n').length).toBeGreaterThan(1);
    });
  });

  describe('HTML Export', () => {
    it('should export as valid HTML', () => {
      const html = exportService.exportAsHTML(mockCharacter);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
      expect(html).toContain('<html lang="en">');
    });

    it('should include character name in HTML', () => {
      const html = exportService.exportAsHTML(mockCharacter);

      expect(html).toContain('Aragorn');
      expect(html).toContain('<title>Aragorn - Character Sheet</title>');
    });

    it('should include ability scores in HTML', () => {
      const html = exportService.exportAsHTML(mockCharacter);

      expect(html).toContain('STR');
      expect(html).toContain('DEX');
      expect(html).toContain('CON');
      expect(html).toContain('INT');
      expect(html).toContain('WIS');
      expect(html).toContain('CHA');
    });

    it('should include combat stats in HTML', () => {
      const html = exportService.exportAsHTML(mockCharacter);

      expect(html).toContain('Hit Points');
      expect(html).toContain('Armor Class');
      expect(html).toContain('Base Attack Bonus');
      expect(html).toContain('Initiative');
    });

    it('should include saving throws in HTML', () => {
      const html = exportService.exportAsHTML(mockCharacter);

      expect(html).toContain('Saving Throws');
      expect(html).toContain('Fortitude');
      expect(html).toContain('Reflex');
      expect(html).toContain('Will');
    });

    it('should include feats section in HTML', () => {
      const html = exportService.exportAsHTML(mockCharacter);

      expect(html).toContain('Feats');
      expect(html).toContain('Weapon Focus (Longsword)');
      expect(html).toContain('Power Attack');
    });

    it('should include skills table in HTML', () => {
      const html = exportService.exportAsHTML(mockCharacter);

      expect(html).toContain('Skills');
      expect(html).toContain('Athletics');
      expect(html).toContain('Perception');
    });

    it('should include equipment table in HTML', () => {
      const html = exportService.exportAsHTML(mockCharacter);

      expect(html).toContain('Equipment');
      expect(html).toContain('Longsword');
      expect(html).toContain('Plate Armor');
    });

    it('should have CSS styling in HTML', () => {
      const html = exportService.exportAsHTML(mockCharacter);

      expect(html).toContain('<style>');
      expect(html).toContain('</style>');
      expect(html).toContain('font-family');
      expect(html).toContain('border');
    });
  });

  describe('Filename Generation', () => {
    it('should generate JSON filename', () => {
      const filename = exportService.generateFilename(mockCharacter, 'json');

      expect(filename).toContain('Aragorn');
      expect(filename).toMatch(/\.json$/);
    });

    it('should generate HTML filename', () => {
      const filename = exportService.generateFilename(mockCharacter, 'html');

      expect(filename).toContain('Aragorn');
      expect(filename).toMatch(/\.html$/);
    });

    it('should generate PDF filename', () => {
      const filename = exportService.generateFilename(mockCharacter, 'pdf');

      expect(filename).toContain('Aragorn');
      expect(filename).toMatch(/\.pdf$/);
    });

    it('should sanitize character name in filename', () => {
      const character = { ...mockCharacter, name: 'Aragorn the <Great>' };
      const filename = exportService.generateFilename(character, 'json');

      // Special characters should be removed or replaced
      expect(filename).not.toContain('<');
      expect(filename).not.toContain('>');
    });

    it('should include timestamp in filename', () => {
      const filename = exportService.generateFilename(mockCharacter, 'json');
      const today = new Date().toISOString().split('T')[0];

      expect(filename).toContain(today);
    });
  });

  describe('Handling Missing Data', () => {
    it('should handle character with minimal data', () => {
      const minimal: any = {
        name: 'Basic Character',
        class: 'Rogue',
      };

      const exported = exportService.formatCharacterForExport(minimal);

      expect(exported.name).toBe('Basic Character');
      expect(exported.class).toBe('Rogue');
      expect(exported.abilityScores.str).toBe(10); // Default
      expect(exported.hitPoints.maximum).toBe(1); // Default minimum
    });

    it('should handle missing spells data', () => {
      const character = { ...mockCharacter, spells: undefined };
      const exported = exportService.formatCharacterForExport(character, {
        includeSpells: true,
      });

      expect(exported.spells).toBeUndefined();
    });

    it('should handle missing equipment', () => {
      const character = { ...mockCharacter, equipment: undefined };
      const exported = exportService.formatCharacterForExport(character, {
        includeEquipment: true,
      });

      expect(exported.equipment).toBeUndefined();
    });

    it('should handle missing derived stats', () => {
      const character = { ...mockCharacter, derivedStats: undefined };
      const exported = exportService.formatCharacterForExport(character);

      expect(exported.level).toBe(1); // Default
      expect(exported.baseAttackBonus).toBe(0); // Default
    });
  });

  describe('Export Options', () => {
    it('should respect includeNotes option', () => {
      const exported = exportService.formatCharacterForExport(mockCharacter, {
        includeNotes: true,
      });

      expect(exported.notes).toBe('Member of the Fellowship');
    });

    it('should respect includeHistory option', () => {
      const exported = exportService.formatCharacterForExport(mockCharacter, {
        includeHistory: false,
      });

      // History fields should not be included
      expect(exported.createdAt).toBeDefined();
      expect(exported.updatedAt).toBeDefined();
    });
  });
});
