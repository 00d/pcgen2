/**
 * Phase 5: Spell Management Service
 * Handles spell loading, spell slots, and spell preparation/memorization
 */

import { Character as CharacterType } from '../types/character';
import spellData from '../data/spells.json';

interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  duration: string;
  savingThrow: string;
  spellResistance: string;
  description: string;
  classes: string[];
  domains: string[];
}

interface SpellSlot {
  level: number;
  used: number;
  total: number;
}

// Interfaces kept for documentation purposes
// Character spell data is structured with spellsKnown and spellSlots fields

export class SpellService {
  /**
   * Get all spells
   */
  getAllSpells(): Spell[] {
    return (spellData.spells as any) as Spell[];
  }

  /**
   * Get spells by level
   */
  getSpellsByLevel(level: number): Spell[] {
    const allSpells = this.getAllSpells();
    return allSpells.filter((spell) => spell.level === level);
  }

  /**
   * Get spells for a specific class
   */
  getSpellsByClass(className: string): Spell[] {
    const allSpells = this.getAllSpells();
    return allSpells.filter((spell) => spell.classes.includes(className));
  }

  /**
   * Get spells by school of magic
   */
  getSpellsBySchool(school: string): Spell[] {
    const allSpells = this.getAllSpells();
    return allSpells.filter((spell) => spell.school === school);
  }

  /**
   * Get a specific spell by ID
   */
  getSpellById(id: string): Spell | null {
    const allSpells = this.getAllSpells();
    return allSpells.find((spell) => spell.id === id) || null;
  }

  /**
   * Calculate spell slots for a caster
   * Pathfinder 1st Edition spell slot progression
   */
  calculateSpellSlots(
    className: string,
    characterLevel: number,
    abilityModifier: number
  ): SpellSlot[] {
    const slots: SpellSlot[] = [];

    // Wizard spell slots (by level)
    if (className === 'Wizard') {
      const maxSpellLevel = Math.min(Math.ceil(characterLevel / 2), 9);
      for (let i = 0; i <= maxSpellLevel; i++) {
        // Level 0 (cantrips) are unlimited
        if (i === 0) {
          slots.push({ level: i, used: 0, total: -1 }); // -1 means unlimited
          continue;
        }

        // For spell level 1 to maxSpellLevel
        // Start with 1 slot at level where you can cast it
        // Gain additional slots based on ability modifier
        const baseSlots = 1;
        const bonusSlots = Math.max(0, Math.floor((abilityModifier - (i - 1)) / 4) + 1);
        const totalSlots = baseSlots + bonusSlots;

        slots.push({ level: i, used: 0, total: totalSlots });
      }
    }
    // Cleric spell slots (prepared caster)
    else if (className === 'Cleric' || className === 'Druid') {
      const maxSpellLevel = Math.min(Math.ceil((characterLevel + 1) / 2), 9);
      for (let i = 0; i <= maxSpellLevel; i++) {
        // Level 0 (orisons) are unlimited
        if (i === 0) {
          slots.push({ level: i, used: 0, total: -1 });
          continue;
        }

        // Base slots at each spell level
        const baseSlots = 1 + Math.floor(characterLevel / (i + 1));
        const bonusSlots = Math.max(0, Math.floor((abilityModifier - (i - 1)) / 4) + 1);
        const totalSlots = baseSlots + bonusSlots;

        slots.push({ level: i, used: 0, total: totalSlots });
      }
    }
    // Sorcerer spell slots (spontaneous caster)
    else if (className === 'Sorcerer') {
      const maxSpellLevel = Math.min(Math.ceil(characterLevel / 2), 9);
      for (let i = 0; i <= maxSpellLevel; i++) {
        // Level 0 (cantrips) are unlimited
        if (i === 0) {
          slots.push({ level: i, used: 0, total: -1 });
          continue;
        }

        // Sorcerers gain 2 slots per spell level
        const baseSlots = 2;
        const bonusSlots = Math.max(0, Math.floor((abilityModifier - (i - 1)) / 4) + 1);
        const totalSlots = baseSlots + bonusSlots;

        slots.push({ level: i, used: 0, total: totalSlots });
      }
    }
    // Paladin and Ranger spell slots
    else if (className === 'Paladin' || className === 'Ranger') {
      if (characterLevel < 4) {
        return slots; // Can't cast spells yet
      }

      const maxSpellLevel = Math.min(Math.ceil((characterLevel - 1) / 4), 4);
      for (let i = 1; i <= maxSpellLevel; i++) {
        const baseSlots = 1 + Math.max(0, Math.floor((characterLevel - 3 - i) / 4));
        const bonusSlots = Math.max(0, Math.floor((abilityModifier - (i - 1)) / 4) + 1);
        const totalSlots = baseSlots + bonusSlots;

        slots.push({ level: i, used: 0, total: totalSlots });
      }
    }

    return slots;
  }

  /**
   * Add a spell to character's known spells (Sorcerer/Bard)
   */
  addKnownSpell(character: CharacterType, spellId: string): boolean {
    const spell = this.getSpellById(spellId);
    if (!spell) {
      return false;
    }

    const spells = character.spells as any;
    const knownSpells = spells?.spellsKnown || [];
    const exists = knownSpells.find((s: any) => s.id === spellId);
    if (exists) {
      return false; // Already known
    }

    knownSpells.push({
      id: spellId,
      name: spell.name,
      level: spell.level,
      description: spell.description,
    });

    if (!character.spells) {
      (character.spells as any) = {};
    }
    (character.spells as any).spellsKnown = knownSpells;

    return true;
  }

  /**
   * Remove a spell from known/prepared spells
   */
  removeKnownSpell(character: CharacterType, spellId: string): boolean {
    const spells = character.spells as any;
    const knownSpells = spells?.spellsKnown || [];
    const index = knownSpells.findIndex((s: any) => s.id === spellId);
    if (index === -1) {
      return false;
    }

    knownSpells.splice(index, 1);
    if (!character.spells) {
      (character.spells as any) = {};
    }
    (character.spells as any).spellsKnown = knownSpells;

    return true;
  }

  /**
   * Cast a spell (use a spell slot)
   */
  castSpell(character: CharacterType, spellLevel: number): boolean {
    const spells = character.spells as any;
    const spellSlots = spells?.spellSlots || [];
    const slot = spellSlots.find((s: any) => s.level === spellLevel);

    if (!slot) {
      return false; // No slots available
    }

    if (slot.perDay <= 0) {
      return false; // No slots remaining
    }

    if (slot.used >= slot.perDay) {
      return false; // No slots remaining
    }

    slot.used += 1;
    if (!character.spells) {
      (character.spells as any) = {};
    }
    (character.spells as any).spellSlots = spellSlots;

    return true;
  }

  /**
   * Rest and regain spell slots
   */
  restAndRegainSlots(character: CharacterType): void {
    const spells = character.spells as any;
    const spellSlots = spells?.spellSlots || [];
    for (const slot of spellSlots) {
      slot.used = 0;
    }

    if (!character.spells) {
      (character.spells as any) = {};
    }
    (character.spells as any).spellSlots = spellSlots;
  }

  /**
   * Search spells by name or description
   */
  searchSpells(query: string): Spell[] {
    const allSpells = this.getAllSpells();
    const lowerQuery = query.toLowerCase();
    return allSpells.filter(
      (spell) =>
        spell.name.toLowerCase().includes(lowerQuery) ||
        spell.description.toLowerCase().includes(lowerQuery) ||
        spell.school.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get spell schools
   */
  getSchools(): string[] {
    const allSpells = this.getAllSpells();
    const schools = new Set(allSpells.map((spell) => spell.school));
    return Array.from(schools).sort();
  }

  /**
   * Validate spell selection for character class
   */
  validateSpellForClass(spellId: string, className: string): boolean {
    const spell = this.getSpellById(spellId);
    if (!spell) {
      return false;
    }

    return spell.classes.includes(className);
  }

  /**
   * Get spell count available for character level
   */
  getAvailableSpellCount(className: string, characterLevel: number): number {
    // Wizards can learn one new spell per level (at maximum)
    if (className === 'Wizard') {
      return characterLevel; // Maximum spells known
    }
    // Sorcerers know a limited number of spells
    else if (className === 'Sorcerer') {
      if (characterLevel === 1) return 4;
      if (characterLevel <= 3) return 5;
      if (characterLevel <= 5) return 6;
      if (characterLevel <= 7) return 7;
      if (characterLevel <= 9) return 8;
      if (characterLevel <= 11) return 9;
      if (characterLevel <= 13) return 10;
      if (characterLevel <= 15) return 11;
      if (characterLevel <= 17) return 12;
      return 13; // Level 18+
    }

    // Other classes prepare spells
    return -1; // Unlimited
  }
}

export default new SpellService();
