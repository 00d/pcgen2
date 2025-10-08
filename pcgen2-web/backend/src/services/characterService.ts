import { Character, ICharacter } from '../models/Character';
import { GameRule } from '../models/GameRule';
import { createApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { Character as CharacterType, AbilityScores } from '../types/character';

export class CharacterService {
  async createCharacter(userId: string, characterData: Partial<CharacterType>): Promise<ICharacter> {
    try {
      const character = new Character({
        userId,
        ...characterData,
      });

      // Initialize ability scores with default values
      if (!character.attributes.abilityScores) {
        character.attributes.abilityScores = this.initializeAbilityScores();
      }

      await character.save();
      logger.info(`Character created: ${character._id} for user ${userId}`);

      return character;
    } catch (error) {
      logger.error('Error creating character:', error);
      throw createApiError('Failed to create character', 500);
    }
  }

  async getCharacterById(characterId: string, userId: string): Promise<ICharacter> {
    try {
      const character = await Character.findOne({ _id: characterId, userId });

      if (!character) {
        throw createApiError('Character not found', 404, 'CHARACTER_NOT_FOUND');
      }

      return character;
    } catch (error) {
      if (error instanceof Error && (error as any).status) {
        throw error;
      }
      logger.error('Error fetching character:', error);
      throw createApiError('Failed to fetch character', 500);
    }
  }

  async getUserCharacters(userId: string): Promise<ICharacter[]> {
    try {
      const characters = await Character.find({ userId }).sort({ createdAt: -1 });
      return characters;
    } catch (error) {
      logger.error('Error fetching user characters:', error);
      throw createApiError('Failed to fetch characters', 500);
    }
  }

  async updateCharacter(characterId: string, userId: string, updates: Partial<CharacterType>): Promise<ICharacter> {
    try {
      const character = await Character.findOne({ _id: characterId, userId });

      if (!character) {
        throw createApiError('Character not found', 404, 'CHARACTER_NOT_FOUND');
      }

      // Update fields
      Object.assign(character, updates);

      // Recalculate derived stats
      this.recalculateDerivedStats(character);

      await character.save();
      logger.info(`Character updated: ${characterId}`);

      return character;
    } catch (error) {
      if (error instanceof Error && (error as any).status) {
        throw error;
      }
      logger.error('Error updating character:', error);
      throw createApiError('Failed to update character', 500);
    }
  }

  async deleteCharacter(characterId: string, userId: string): Promise<void> {
    try {
      const result = await Character.deleteOne({ _id: characterId, userId });

      if (result.deletedCount === 0) {
        throw createApiError('Character not found', 404, 'CHARACTER_NOT_FOUND');
      }

      logger.info(`Character deleted: ${characterId}`);
    } catch (error) {
      if (error instanceof Error && (error as any).status) {
        throw error;
      }
      logger.error('Error deleting character:', error);
      throw createApiError('Failed to delete character', 500);
    }
  }

  // Character calculation methods
  private initializeAbilityScores(): AbilityScores {
    return {
      str: { base: 10, racial: 0, items: 0, enhancement: 0, total: 10 },
      dex: { base: 10, racial: 0, items: 0, enhancement: 0, total: 10 },
      con: { base: 10, racial: 0, items: 0, enhancement: 0, total: 10 },
      int: { base: 10, racial: 0, items: 0, enhancement: 0, total: 10 },
      wis: { base: 10, racial: 0, items: 0, enhancement: 0, total: 10 },
      cha: { base: 10, racial: 0, items: 0, enhancement: 0, total: 10 },
    };
  }

  private getAbilityModifier(abilityScore: number): number {
    return Math.floor((abilityScore - 10) / 2);
  }

  private recalculateDerivedStats(character: ICharacter): void {
    const char = character as any;

    // Recalculate ability score totals
    if (char.attributes?.abilityScores) {
      for (const ability of Object.keys(char.attributes.abilityScores)) {
        const score = char.attributes.abilityScores[ability];
        if (score) {
          score.total = score.base + score.racial + score.items + score.enhancement;
        }
      }
    }

    // Recalculate hit points
    if (char.attributes?.classes && char.attributes.classes.length > 0) {
      let maxHp = 0;
      for (const pClass of char.attributes.classes) {
        const hdValue = parseInt(pClass.hitDie.replace('d', ''));
        const conMod = this.getAbilityModifier(char.attributes.abilityScores.con.total);

        // First level gets max hit die + CON mod
        if (char.attributes.classes.indexOf(pClass) === 0) {
          maxHp += hdValue + conMod;
        } else {
          // Subsequent levels roll average (rounded up)
          const avgRoll = Math.ceil((hdValue + 1) / 2);
          maxHp += avgRoll + conMod;
        }
      }
      if (char.derivedStats) {
        char.derivedStats.hitPoints = {
          current: Math.max(1, maxHp),
          max: Math.max(1, maxHp),
        };
      }
    }

    // Recalculate armor class
    if (char.derivedStats?.armorClass) {
      const dexMod = this.getAbilityModifier(char.attributes.abilityScores.dex.total);
      char.derivedStats.armorClass.dexBonus = dexMod;
      char.derivedStats.armorClass.total =
        10 + dexMod + char.derivedStats.armorClass.armorBonus + char.derivedStats.armorClass.shieldBonus;
    }

    // Recalculate saving throws
    if (char.derivedStats?.savingThrows && char.attributes?.classes) {
      const conMod = this.getAbilityModifier(char.attributes.abilityScores.con.total);
      const refMod = this.getAbilityModifier(char.attributes.abilityScores.dex.total);
      const willMod = this.getAbilityModifier(char.attributes.abilityScores.wis.total);

      let fortitudeBonus = 0;
      for (const pClass of char.attributes.classes) {
        if (pClass.savingThrowBonus?.fort) {
          fortitudeBonus += pClass.savingThrowBonus.fort;
        }
      }

      char.derivedStats.savingThrows.fortitude = fortitudeBonus + conMod;
      char.derivedStats.savingThrows.reflex = refMod;
      char.derivedStats.savingThrows.will = willMod;
    }

    // Recalculate initiative
    if (char.derivedStats) {
      const dexMod = this.getAbilityModifier(char.attributes.abilityScores.dex.total);
      char.derivedStats.initiative = dexMod;
    }

    // Recalculate BAB and CMB
    if (char.attributes?.classes) {
      let totalBab = 0;
      for (const pClass of char.attributes.classes) {
        const progression = pClass.baseAttackBonusProgression;
        const level = pClass.level || 1;

        if (progression === 'good') {
          totalBab += level;
        } else if (progression === 'moderate') {
          totalBab += Math.floor((level * 3) / 4);
        } else if (progression === 'poor') {
          totalBab += Math.floor(level / 2);
        }
      }

      if (char.derivedStats) {
        char.derivedStats.baseAttackBonus = totalBab;
        const strMod = this.getAbilityModifier(char.attributes.abilityScores.str.total);
        char.derivedStats.combatManeuverBonus = totalBab + strMod;
        char.derivedStats.combatManeuverDefense = 10 + totalBab + strMod + this.getAbilityModifier(char.attributes.abilityScores.dex.total);
      }
    }
  }

  async applyRaceToCharacter(characterId: string, userId: string, raceId: string): Promise<ICharacter> {
    try {
      const race = await GameRule.findOne({ type: 'race', id: raceId });

      if (!race) {
        throw createApiError('Race not found', 404, 'RACE_NOT_FOUND');
      }

      const character = await this.getCharacterById(characterId, userId);

      // Apply race data
      character.attributes.race = {
        id: race.id,
        name: race.name,
        size: race.data.size,
        baseAbilityModifiers: race.data.abilityAdjustments || {},
        baseSpeed: race.data.speed,
        languages: race.data.languages,
        traits: race.data.traits,
      };

      // Apply ability adjustments
      if (race.data.abilityAdjustments) {
        for (const [ability, mod] of Object.entries(race.data.abilityAdjustments)) {
          if (character.attributes.abilityScores[ability as any]) {
            character.attributes.abilityScores[ability as any].racial = mod as number;
          }
        }
      }

      this.recalculateDerivedStats(character);
      await character.save();

      logger.info(`Race applied to character ${characterId}: ${race.name}`);

      return character;
    } catch (error) {
      if (error instanceof Error && (error as any).status) {
        throw error;
      }
      logger.error('Error applying race:', error);
      throw createApiError('Failed to apply race', 500);
    }
  }

  async addClassToCharacter(characterId: string, userId: string, classId: string): Promise<ICharacter> {
    try {
      const pClass = await GameRule.findOne({ type: 'class', id: classId });

      if (!pClass) {
        throw createApiError('Class not found', 404, 'CLASS_NOT_FOUND');
      }

      const character = await this.getCharacterById(characterId, userId);

      // Add class
      character.attributes.classes.push({
        id: pClass.id,
        name: pClass.name,
        level: 1,
        hitDie: pClass.data.hitDie,
        baseAttackBonusProgression: pClass.data.baseAttackBonusProgression,
        savingThrowBonus: {
          fort: 0,
          ref: 0,
          will: 0,
        },
        baseSkillsPerLevel: pClass.data.skillsPerLevel,
        classAbilities: pClass.data.classAbilities || [],
      });

      this.recalculateDerivedStats(character);
      await character.save();

      logger.info(`Class added to character ${characterId}: ${pClass.name}`);

      return character;
    } catch (error) {
      if (error instanceof Error && (error as any).status) {
        throw error;
      }
      logger.error('Error adding class:', error);
      throw createApiError('Failed to add class', 500);
    }
  }
}

export default new CharacterService();
