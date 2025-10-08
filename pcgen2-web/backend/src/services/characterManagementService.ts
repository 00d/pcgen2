/**
 * Phase 5: Character Management Service
 * Handles character duplication, versioning, notes, and bulk operations
 */

import { Character as CharacterType } from '../types/character';
import { Character } from '../models/Character';

interface CharacterVersion {
  version: number;
  timestamp: Date;
  changes: string;
  snapshot: any;
}

interface CharacterNote {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export class CharacterManagementService {
  /**
   * Duplicate a character
   */
  async duplicateCharacter(
    characterId: string,
    userId: string,
    newName?: string
  ): Promise<CharacterType | null> {
    try {
      const originalCharacter = await Character.findOne({
        _id: characterId,
        userId,
      });

      if (!originalCharacter) {
        return null;
      }

      // Create new character from original
      const characterData = (originalCharacter as any).toObject?.() || originalCharacter;

      // Remove ID to allow MongoDB to generate new one
      delete characterData._id;
      delete characterData.__v;

      // Update name if provided
      if (newName) {
        characterData.name = newName;
      } else {
        characterData.name = `${characterData.name} (Copy)`;
      }

      // Create new character
      const newCharacter = new Character(characterData);
      newCharacter.userId = userId;

      await newCharacter.save();

      return newCharacter as unknown as CharacterType;
    } catch (error) {
      console.error('Character duplication error:', error);
      return null;
    }
  }

  /**
   * Get character version history
   */
  async getCharacterHistory(characterId: string, userId: string): Promise<any[]> {
    try {
      const character = await Character.findOne({
        _id: characterId,
        userId,
      });

      if (!character) {
        return [];
      }

      const charData = character as any;
      return charData.history || [];
    } catch (error) {
      console.error('Get history error:', error);
      return [];
    }
  }

  /**
   * Create character snapshot for versioning
   */
  async createCharacterSnapshot(
    characterId: string,
    userId: string,
    changes: string
  ): Promise<boolean> {
    try {
      const character = await Character.findOne({
        _id: characterId,
        userId,
      });

      if (!character) {
        return false;
      }

      const charData = character as any;
      const history = charData.history || [];

      // Create snapshot
      const snapshot = {
        version: history.length + 1,
        timestamp: new Date(),
        changes,
        snapshot: {
          name: character.name,
          class: charData.class,
          race: charData.race,
          level: charData.derivedStats?.totalLevel || 1,
          experience: charData.experience || 0,
        },
      };

      history.push(snapshot);

      // Keep only last 50 snapshots
      if (history.length > 50) {
        history.shift();
      }

      charData.history = history;
      await character.save();

      return true;
    } catch (error) {
      console.error('Create snapshot error:', error);
      return false;
    }
  }

  /**
   * Add a note to character
   */
  async addCharacterNote(
    characterId: string,
    userId: string,
    content: string,
    tags: string[] = []
  ): Promise<CharacterNote | null> {
    try {
      const character = await Character.findOne({
        _id: characterId,
        userId,
      });

      if (!character) {
        return null;
      }

      const charData = character as any;
      const notes = charData.characterNotes || [];

      const note: CharacterNote = {
        id: `note-${Date.now()}`,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags,
      };

      notes.push(note);
      charData.characterNotes = notes;

      await character.save();

      return note;
    } catch (error) {
      console.error('Add note error:', error);
      return null;
    }
  }

  /**
   * Update a character note
   */
  async updateCharacterNote(
    characterId: string,
    userId: string,
    noteId: string,
    content?: string,
    tags?: string[]
  ): Promise<CharacterNote | null> {
    try {
      const character = await Character.findOne({
        _id: characterId,
        userId,
      });

      if (!character) {
        return null;
      }

      const charData = character as any;
      const notes = charData.characterNotes || [];
      const note = notes.find((n: CharacterNote) => n.id === noteId);

      if (!note) {
        return null;
      }

      if (content !== undefined) {
        note.content = content;
      }
      if (tags !== undefined) {
        note.tags = tags;
      }
      note.updatedAt = new Date();

      charData.characterNotes = notes;
      await character.save();

      return note;
    } catch (error) {
      console.error('Update note error:', error);
      return null;
    }
  }

  /**
   * Delete a character note
   */
  async deleteCharacterNote(
    characterId: string,
    userId: string,
    noteId: string
  ): Promise<boolean> {
    try {
      const character = await Character.findOne({
        _id: characterId,
        userId,
      });

      if (!character) {
        return false;
      }

      const charData = character as any;
      const notes = charData.characterNotes || [];

      const filteredNotes = notes.filter((n: CharacterNote) => n.id !== noteId);

      if (filteredNotes.length === notes.length) {
        return false; // Note not found
      }

      charData.characterNotes = filteredNotes;
      await character.save();

      return true;
    } catch (error) {
      console.error('Delete note error:', error);
      return false;
    }
  }

  /**
   * Get all character notes
   */
  async getCharacterNotes(characterId: string, userId: string): Promise<CharacterNote[]> {
    try {
      const character = await Character.findOne({
        _id: characterId,
        userId,
      });

      if (!character) {
        return [];
      }

      const charData = character as any;
      return charData.characterNotes || [];
    } catch (error) {
      console.error('Get notes error:', error);
      return [];
    }
  }

  /**
   * Get characters by campaign
   */
  async getCharactersByCampaign(campaignId: string, userId: string): Promise<CharacterType[]> {
    try {
      const characters = await Character.find({
        userId,
        'campaign._id': campaignId,
      });

      return characters as unknown as CharacterType[];
    } catch (error) {
      console.error('Get characters by campaign error:', error);
      return [];
    }
  }

  /**
   * Bulk delete characters
   */
  async bulkDeleteCharacters(characterIds: string[], userId: string): Promise<number> {
    try {
      const result = await Character.deleteMany({
        _id: { $in: characterIds },
        userId,
      });

      return result.deletedCount || 0;
    } catch (error) {
      console.error('Bulk delete error:', error);
      return 0;
    }
  }

  /**
   * Search characters
   */
  async searchCharacters(
    userId: string,
    query: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<CharacterType[]> {
    try {
      const { limit = 20, offset = 0 } = options;
      const lowerQuery = query.toLowerCase();

      const characters = await Character.find({
        userId,
        $or: [
          { name: { $regex: lowerQuery, $options: 'i' } },
          { description: { $regex: lowerQuery, $options: 'i' } },
          { notes: { $regex: lowerQuery, $options: 'i' } },
        ],
      })
        .limit(limit)
        .skip(offset);

      return characters as unknown as CharacterType[];
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * Get character statistics
   */
  async getCharacterStatistics(userId: string): Promise<{
    totalCharacters: number;
    charactersByClass: Record<string, number>;
    charactersByRace: Record<string, number>;
    averageLevel: number;
    totalExperience: number;
  }> {
    try {
      const characters = await Character.find({ userId });

      const stats = {
        totalCharacters: characters.length,
        charactersByClass: {} as Record<string, number>,
        charactersByRace: {} as Record<string, number>,
        averageLevel: 0,
        totalExperience: 0,
      };

      let totalLevel = 0;

      characters.forEach((character) => {
        const charData = character as any;

        // Count by class
        const charClass = charData.class || 'Unknown';
        stats.charactersByClass[charClass] = (stats.charactersByClass[charClass] || 0) + 1;

        // Count by race
        const charRace = charData.race || 'Unknown';
        stats.charactersByRace[charRace] = (stats.charactersByRace[charRace] || 0) + 1;

        // Sum levels and experience
        const level = charData.derivedStats?.totalLevel || 1;
        totalLevel += level;
        stats.totalExperience += charData.experience || 0;
      });

      stats.averageLevel = characters.length > 0 ? Math.round(totalLevel / characters.length) : 0;

      return stats;
    } catch (error) {
      console.error('Statistics error:', error);
      return {
        totalCharacters: 0,
        charactersByClass: {},
        charactersByRace: {},
        averageLevel: 0,
        totalExperience: 0,
      };
    }
  }

  /**
   * Export character to format
   */
  async transferCharacter(
    characterId: string,
    fromUserId: string,
    toUserId: string
  ): Promise<CharacterType | null> {
    try {
      const character = await Character.findOne({
        _id: characterId,
        userId: fromUserId,
      });

      if (!character) {
        return null;
      }

      // Check if target user already has this character
      const existing = await Character.findOne({
        name: character.name,
        userId: toUserId,
      });

      if (existing) {
        return null; // Character with same name already exists
      }

      // Transfer ownership
      character.userId = toUserId;
      await character.save();

      return character as unknown as CharacterType;
    } catch (error) {
      console.error('Transfer error:', error);
      return null;
    }
  }

  /**
   * Get character activity log
   */
  async getCharacterActivityLog(
    characterId: string,
    userId: string,
    limit: number = 20
  ): Promise<any[]> {
    try {
      const character = await Character.findOne({
        _id: characterId,
        userId,
      });

      if (!character) {
        return [];
      }

      const charData = character as any;
      const history = charData.history || [];

      return history.slice(-limit).reverse();
    } catch (error) {
      console.error('Activity log error:', error);
      return [];
    }
  }
}

export default new CharacterManagementService();
