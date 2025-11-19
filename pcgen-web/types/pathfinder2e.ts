/**
 * Pathfinder 2E specific types (placeholder for future implementation)
 */

import type { AbilityScore, AbilityScores, Alignment, Size, Source } from './index';

export interface PF2EAncestry {
  id: string;
  name: string;
  hitPoints: number;
  size: Size;
  speed: number;
  abilityBoosts: AbilityScore[];
  abilityFlaws?: AbilityScore[];
  languages: string[];
  traits: string[];
  source: Source;
}

export interface PF2EClass {
  id: string;
  name: string;
  keyAbility: AbilityScore[];
  hitPoints: number;
  perception: 'trained' | 'expert';
  classDC: 'trained';
  source: Source;
}

export interface PF2ECharacter {
  id: string;
  gameSystem: 'pathfinder2e';
  name: string;
  player?: string;
  alignment: Alignment;
  deity?: string;

  // Core stats
  ancestry: string;
  heritage?: string;
  background?: string;
  class: string;
  level: number;

  // Ability scores
  abilityScores: AbilityScores;

  // Metadata
  createdAt: string;
  updatedAt: string;
  notes?: string;
}
