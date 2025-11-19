/**
 * Core TypeScript types for PCGen Web
 */

export type GameSystem = 'pathfinder1e' | 'pathfinder2e';

export type AbilityScore = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export interface AbilityScores {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
}

export type Alignment =
  | 'LG'
  | 'NG'
  | 'CG'
  | 'LN'
  | 'TN'
  | 'CN'
  | 'LE'
  | 'NE'
  | 'CE';

export type Size =
  | 'Fine'
  | 'Diminutive'
  | 'Tiny'
  | 'Small'
  | 'Medium'
  | 'Large'
  | 'Huge'
  | 'Gargantuan'
  | 'Colossal';

export interface Source {
  name: string;
  shortName: string;
  page?: string;
  url?: string;
}

// Re-export from specific game systems
export type { PF1ECharacter, PF1EClass, PF1ERace } from './pathfinder1e';
export type { PF2ECharacter, PF2EClass, PF2EAncestry } from './pathfinder2e';
