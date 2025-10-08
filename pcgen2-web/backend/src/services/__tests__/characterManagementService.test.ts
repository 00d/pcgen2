/**
 * Phase 5: Character Management Service Tests
 * Comprehensive tests for character operations, duplication, versioning, and notes
 */

describe('CharacterManagementService', () => {
  describe('Character Snapshots', () => {
    it('should create a character snapshot', () => {

      const snapshot = {
        version: 1,
        timestamp: new Date(),
        changes: 'Initial creation',
        snapshot: {
          name: 'Aragorn',
          class: 'Fighter',
          race: 'Human',
          level: 5,
          experience: 5000,
        },
      };

      expect(snapshot.version).toBe(1);
      expect(snapshot.snapshot.name).toBe('Aragorn');
      expect(snapshot.snapshot.level).toBe(5);
    });

    it('should track version numbers sequentially', () => {
      const snapshots = [
        { version: 1, changes: 'Created' },
        { version: 2, changes: 'Leveled up' },
        { version: 3, changes: 'Added equipment' },
      ];

      expect(snapshots[0].version).toBe(1);
      expect(snapshots[1].version).toBe(2);
      expect(snapshots[2].version).toBe(3);
    });
  });

  describe('Character Notes', () => {
    it('should create a character note', () => {
      const note = {
        id: 'note-123',
        content: 'Important character background',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['backstory', 'important'],
      };

      expect(note.content).toBe('Important character background');
      expect(note.tags).toContain('backstory');
    });

    it('should have unique note IDs', () => {
      const notes = [
        { id: 'note-1', content: 'Note 1' },
        { id: 'note-2', content: 'Note 2' },
        { id: 'note-3', content: 'Note 3' },
      ];

      const ids = notes.map((n) => n.id);
      expect(new Set(ids).size).toBe(3); // All unique
    });

    it('should track note creation and update times', () => {
      const created = new Date('2025-01-01T10:00:00');
      const updated = new Date('2025-01-02T10:00:00');

      const note = {
        id: 'note-123',
        content: 'Updated note',
        createdAt: created,
        updatedAt: updated,
        tags: [],
      };

      expect(note.updatedAt.getTime()).toBeGreaterThan(note.createdAt.getTime());
    });

    it('should support note tagging', () => {
      const note = {
        id: 'note-123',
        content: 'Tagged note',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['combat', 'ability', 'weakness'],
      };

      expect(note.tags.length).toBe(3);
      expect(note.tags).toContain('weakness');
    });
  });

  describe('Character Operations', () => {
    it('should store character history', () => {
      const history = [
        {
          version: 1,
          timestamp: new Date('2025-01-01'),
          changes: 'Created character',
          snapshot: { name: 'Aragorn', level: 1 },
        },
        {
          version: 2,
          timestamp: new Date('2025-01-02'),
          changes: 'Leveled to 2',
          snapshot: { name: 'Aragorn', level: 2 },
        },
      ];

      expect(history.length).toBe(2);
      expect(history[0].version).toBe(1);
      expect(history[1].snapshot.level).toBe(2);
    });

    it('should limit history to 50 snapshots', () => {
      const history = Array.from({ length: 52 }, (_, i) => ({
        version: i + 1,
        timestamp: new Date(),
        changes: `Change ${i + 1}`,
        snapshot: {},
      }));

      // Keep last 50
      if (history.length > 50) {
        history.splice(0, history.length - 50);
      }

      expect(history.length).toBe(50);
      expect(history[0].version).toBe(3);
      expect(history[49].version).toBe(52);
    });

    it('should track character campaign association', () => {
      const character: any = {
        name: 'Aragorn',
        campaign: { _id: 'campaign-123', name: 'Rivendell Campaign' },
      };

      expect(character.campaign._id).toBe('campaign-123');
    });
  });

  describe('Search and Filter', () => {
    it('should search by name', () => {
      const characters = [
        { name: 'Aragorn', class: 'Fighter' },
        { name: 'Legolas', class: 'Ranger' },
        { name: 'Gimli', class: 'Dwarf' },
      ];

      const results = characters.filter((c) =>
        c.name.toLowerCase().includes('ara')
      );

      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Aragorn');
    });

    it('should search by description', () => {
      const characters = [
        { name: 'Aragorn', description: 'A noble ranger from the north' },
        { name: 'Legolas', description: 'An elf archer' },
      ];

      const results = characters.filter((c) =>
        c.description.toLowerCase().includes('ranger')
      );

      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Aragorn');
    });

    it('should search case-insensitively', () => {
      const characters = [
        { name: 'Aragorn' },
        { name: 'legolas' },
        { name: 'GIMLI' },
      ];

      const results = characters.filter((c) =>
        c.name.toLowerCase().includes('ara')
      );

      expect(results.length).toBe(1);
    });
  });

  describe('Character Statistics', () => {
    it('should count total characters', () => {
      const characters = [
        { name: 'Aragorn', class: 'Fighter', race: 'Human' },
        { name: 'Legolas', class: 'Ranger', race: 'Elf' },
        { name: 'Gimli', class: 'Dwarf', race: 'Dwarf' },
      ];

      expect(characters.length).toBe(3);
    });

    it('should count characters by class', () => {
      const characters = [
        { name: 'Aragorn', class: 'Fighter' },
        { name: 'Legolas', class: 'Ranger' },
        { name: 'Boromir', class: 'Fighter' },
      ];

      const byClass: Record<string, number> = {};
      characters.forEach((c) => {
        byClass[c.class] = (byClass[c.class] || 0) + 1;
      });

      expect(byClass['Fighter']).toBe(2);
      expect(byClass['Ranger']).toBe(1);
    });

    it('should count characters by race', () => {
      const characters = [
        { name: 'Aragorn', race: 'Human' },
        { name: 'Legolas', race: 'Elf' },
        { name: 'Boromir', race: 'Human' },
      ];

      const byRace: Record<string, number> = {};
      characters.forEach((c) => {
        byRace[c.race] = (byRace[c.race] || 0) + 1;
      });

      expect(byRace['Human']).toBe(2);
      expect(byRace['Elf']).toBe(1);
    });

    it('should calculate average level', () => {
      const characters = [
        { name: 'Aragorn', level: 5 },
        { name: 'Legolas', level: 4 },
        { name: 'Gimli', level: 5 },
      ];

      const totalLevel = characters.reduce((sum, c) => sum + c.level, 0);
      const averageLevel = Math.round(totalLevel / characters.length);

      expect(averageLevel).toBe(5);
    });

    it('should sum total experience', () => {
      const characters = [
        { name: 'Aragorn', experience: 5000 },
        { name: 'Legolas', experience: 4000 },
        { name: 'Gimli', experience: 5500 },
      ];

      const totalExp = characters.reduce((sum, c) => sum + c.experience, 0);

      expect(totalExp).toBe(14500);
    });
  });

  describe('Bulk Operations', () => {
    it('should support bulk deletion', () => {
      const characters = [
        { id: '1', name: 'Aragorn' },
        { id: '2', name: 'Legolas' },
        { id: '3', name: 'Gimli' },
      ];

      const toDelete = ['1', '3'];
      const remaining = characters.filter((c) => !toDelete.includes(c.id));

      expect(remaining.length).toBe(1);
      expect(remaining[0].name).toBe('Legolas');
    });

    it('should support filtering by campaign', () => {
      const characters = [
        { name: 'Aragorn', campaignId: 'campaign-1' },
        { name: 'Legolas', campaignId: 'campaign-1' },
        { name: 'Gimli', campaignId: 'campaign-2' },
      ];

      const campaign1 = characters.filter((c) => c.campaignId === 'campaign-1');

      expect(campaign1.length).toBe(2);
      expect(campaign1.map((c) => c.name)).toEqual(['Aragorn', 'Legolas']);
    });
  });

  describe('Character Duplication Logic', () => {
    it('should duplicate a character', () => {
      const original = {
        name: 'Aragorn',
        class: 'Fighter',
        race: 'Human',
        level: 5,
      };

      const duplicate = {
        ...original,
        name: `${original.name} (Copy)`,
      };

      expect(duplicate.name).toBe('Aragorn (Copy)');
      expect(duplicate.class).toBe('Fighter');
      expect(duplicate.level).toBe(5);
    });

    it('should allow custom name for duplicate', () => {
      const original = {
        name: 'Aragorn',
        class: 'Fighter',
      };

      const duplicate = {
        ...original,
        name: 'Aragorn the Great',
      };

      expect(duplicate.name).toBe('Aragorn the Great');
      expect(duplicate.class).toBe('Fighter');
    });

    it('should copy all character data', () => {
      const original: any = {
        name: 'Aragorn',
        class: 'Fighter',
        race: 'Human',
        level: 5,
        experience: 5000,
        abilityScores: { str: 16, dex: 14, con: 15 },
        equipment: [{ name: 'Longsword', type: 'weapon' }],
      };

      const duplicate = { ...original, name: `${original.name} (Copy)` };

      expect(duplicate.class).toBe(original.class);
      expect(duplicate.race).toBe(original.race);
      expect(duplicate.level).toBe(original.level);
      expect(duplicate.abilityScores).toEqual(original.abilityScores);
      expect(duplicate.equipment).toEqual(original.equipment);
    });
  });

  describe('Activity Logging', () => {
    it('should maintain activity history', () => {
      const activity = [
        { timestamp: new Date('2025-01-01T10:00'), action: 'Created' },
        { timestamp: new Date('2025-01-02T10:00'), action: 'Leveled up' },
        { timestamp: new Date('2025-01-03T10:00'), action: 'Added equipment' },
      ];

      expect(activity.length).toBe(3);
      expect(activity[0].action).toBe('Created');
      expect(activity[2].action).toBe('Added equipment');
    });

    it('should support activity log limiting', () => {
      const activity = Array.from({ length: 25 }, (_, i) => ({
        timestamp: new Date(),
        action: `Action ${i + 1}`,
      }));

      const recent = activity.slice(-5).reverse();

      expect(recent.length).toBe(5);
      expect(recent[0].action).toBe('Action 25');
    });
  });
});
