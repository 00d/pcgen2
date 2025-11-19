/**
 * Data loading utilities for game data
 */

import type {
  PF1ERace,
  PF1EClass,
  PF1ESkill,
  PF1EFeat,
  PF1EWeapon,
  PF1EArmor,
} from '@/types/pathfinder1e';

/**
 * Load races data
 */
export async function loadRaces(): Promise<PF1ERace[]> {
  const response = await fetch('/data/pathfinder1e/races.json');
  if (!response.ok) {
    throw new Error('Failed to load races data');
  }
  const races = await response.json();

  // Fix empty source names for core races
  return races.map((race: PF1ERace) => ({
    ...race,
    source: {
      ...race.source,
      name: race.source.name || 'Core Essentials',
      shortName: race.source.shortName || 'CE',
    },
  }));
}

/**
 * Load classes data
 */
export async function loadClasses(): Promise<PF1EClass[]> {
  const response = await fetch('/data/pathfinder1e/classes.json');
  if (!response.ok) {
    throw new Error('Failed to load classes data');
  }
  return response.json();
}

/**
 * Load skills data
 */
export async function loadSkills(): Promise<PF1ESkill[]> {
  const response = await fetch('/data/pathfinder1e/skills.json');
  if (!response.ok) {
    throw new Error('Failed to load skills data');
  }
  return response.json();
}

/**
 * Load feats data
 */
export async function loadFeats(): Promise<PF1EFeat[]> {
  const response = await fetch('/data/pathfinder1e/feats.json');
  if (!response.ok) {
    throw new Error('Failed to load feats data');
  }
  return response.json();
}

/**
 * Load weapons data
 */
export async function loadWeapons(): Promise<PF1EWeapon[]> {
  const response = await fetch('/data/pathfinder1e/weapons.json');
  if (!response.ok) {
    throw new Error('Failed to load weapons data');
  }
  return response.json();
}

/**
 * Load armor data
 */
export async function loadArmor(): Promise<PF1EArmor[]> {
  const response = await fetch('/data/pathfinder1e/armor.json');
  if (!response.ok) {
    throw new Error('Failed to load armor data');
  }
  return response.json();
}
