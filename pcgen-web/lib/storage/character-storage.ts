/**
 * Character storage using IndexedDB via LocalForage
 */

import localforage from 'localforage';
import type { PF1ECharacter } from '@/types/pathfinder1e';

// Configure LocalForage
const characterStore = localforage.createInstance({
  name: 'pcgen-web',
  storeName: 'characters',
  description: 'Character storage for PCGen Web',
});

/**
 * Generate a unique character ID
 */
export function generateCharacterId(): string {
  return `char_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Save a character to IndexedDB
 */
export async function saveCharacter(character: PF1ECharacter): Promise<void> {
  try {
    const now = new Date().toISOString();
    const characterToSave: PF1ECharacter = {
      ...character,
      updatedAt: now,
      createdAt: character.createdAt || now,
    };

    await characterStore.setItem(character.id, characterToSave);
  } catch (error) {
    console.error('Failed to save character:', error);
    throw new Error('Failed to save character to storage');
  }
}

/**
 * Load a character from IndexedDB
 */
export async function loadCharacter(characterId: string): Promise<PF1ECharacter | null> {
  try {
    const character = await characterStore.getItem<PF1ECharacter>(characterId);
    return character;
  } catch (error) {
    console.error('Failed to load character:', error);
    throw new Error('Failed to load character from storage');
  }
}

/**
 * Delete a character from IndexedDB
 */
export async function deleteCharacter(characterId: string): Promise<void> {
  try {
    await characterStore.removeItem(characterId);
  } catch (error) {
    console.error('Failed to delete character:', error);
    throw new Error('Failed to delete character from storage');
  }
}

/**
 * Load all characters from IndexedDB
 */
export async function loadAllCharacters(): Promise<PF1ECharacter[]> {
  try {
    const characters: PF1ECharacter[] = [];

    await characterStore.iterate<PF1ECharacter, void>((value) => {
      characters.push(value);
    });

    // Sort by updated date (most recent first)
    characters.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return characters;
  } catch (error) {
    console.error('Failed to load characters:', error);
    throw new Error('Failed to load characters from storage');
  }
}

/**
 * Export character as JSON
 */
export function exportCharacterToJSON(character: PF1ECharacter): string {
  return JSON.stringify(character, null, 2);
}

/**
 * Validate character data structure
 */
function validateCharacter(character: any): character is PF1ECharacter {
  // Check required fields
  if (!character.id || typeof character.id !== 'string') {
    throw new Error('Missing or invalid character ID');
  }
  if (!character.name || typeof character.name !== 'string') {
    throw new Error('Missing or invalid character name');
  }
  if (character.gameSystem !== 'pathfinder1e') {
    throw new Error('Invalid game system (must be pathfinder1e)');
  }
  if (!character.abilityScores || typeof character.abilityScores !== 'object') {
    throw new Error('Missing or invalid ability scores');
  }
  if (!Array.isArray(character.classes)) {
    throw new Error('Missing or invalid classes array');
  }
  if (!Array.isArray(character.skills)) {
    throw new Error('Missing or invalid skills array');
  }
  if (!Array.isArray(character.feats)) {
    throw new Error('Missing or invalid feats array');
  }
  if (!Array.isArray(character.equipment)) {
    throw new Error('Missing or invalid equipment array');
  }

  return true;
}

/**
 * Import character from JSON
 */
export function importCharacterFromJSON(jsonString: string): PF1ECharacter {
  try {
    const character = JSON.parse(jsonString);

    // Validate structure
    validateCharacter(character);

    // Ensure timestamps exist
    const now = new Date().toISOString();
    return {
      ...character,
      createdAt: character.createdAt || now,
      updatedAt: now, // Update to current time on import
    } as PF1ECharacter;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    if (error instanceof Error) {
      throw new Error(`Failed to import character: ${error.message}`);
    }
    throw new Error('Failed to import character: unknown error');
  }
}

/**
 * Download character as JSON file
 */
export function downloadCharacterAsFile(character: PF1ECharacter): void {
  const json = exportCharacterToJSON(character);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${character.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${character.id}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Get character count
 */
export async function getCharacterCount(): Promise<number> {
  try {
    return await characterStore.length();
  } catch (error) {
    console.error('Failed to get character count:', error);
    return 0;
  }
}

/**
 * Clear all characters (use with caution!)
 */
export async function clearAllCharacters(): Promise<void> {
  try {
    await characterStore.clear();
  } catch (error) {
    console.error('Failed to clear characters:', error);
    throw new Error('Failed to clear all characters from storage');
  }
}
