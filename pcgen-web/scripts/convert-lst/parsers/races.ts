/**
 * Race LST file parser
 * Converts race LST files to JSON
 */

import * as fs from 'fs';
import * as path from 'path';
import type { PF1ERace } from '../../../types/pathfinder1e';
import type { Size } from '../../../types';
import { LSTParser, tokenValueToString, tokenValueToArray } from '../parser';
import type { LSTFile } from '../types';

export class RaceParser {
  private parser: LSTParser;

  constructor() {
    this.parser = new LSTParser({
      verbose: false,
      skipComments: true,
      skipBlankLines: true,
    });
  }

  /**
   * Parse all core races from the core_essentials directory structure
   */
  parseCoreRaces(baseDir: string): PF1ERace[] {
    const races: PF1ERace[] = [];
    const raceNames = ['dwarf', 'elf', 'gnome', 'half_elf', 'half_orc', 'halfling', 'human'];

    for (const raceName of raceNames) {
      // File names don't have underscores
      const fileName = raceName.replace(/_/g, '');
      const racePath = path.join(
        baseDir,
        'paizo/roleplaying_game/core_essentials/races',
        raceName,
        `${fileName}_races.lst`
      );

      if (fs.existsSync(racePath)) {
        try {
          const raceData = this.parseRaceFile(racePath, raceName);
          if (raceData) {
            // Read racial abilities
            const abilitiesPath = path.join(
              baseDir,
              'paizo/roleplaying_game/core_essentials/races',
              raceName,
              `${fileName}_abilities_race.lst`
            );

            if (fs.existsSync(abilitiesPath)) {
              this.enrichRaceWithAbilities(raceData, abilitiesPath);
            }

            races.push(raceData);
          }
        } catch (error) {
          console.error(`Error parsing race ${raceName}:`, error);
        }
      }
    }

    return races;
  }

  /**
   * Parse a single race file
   */
  parseRaceFile(filePath: string, raceName: string): PF1ERace | null {
    const lstFile = this.parser.parseLSTFile(filePath);

    // Find the race line (not .MOD)
    for (const line of lstFile.lines) {
      if (line.tokens.length === 0) continue;

      const firstToken = line.tokens[0];

      // Skip .MOD entries
      if (firstToken.key.includes('.MOD')) continue;

      // Skip if first token has SOURCE in it
      if (firstToken.key.includes('SOURCE')) continue;

      // First token is the race name
      const raceDisplayName = firstToken.key;
      const tokenMap = this.parser.extractTokensFromLines([line]);

      return this.buildRaceFromTokens(raceDisplayName, raceName, tokenMap, lstFile);
    }

    return null;
  }

  /**
   * Build race object from parsed tokens
   */
  private buildRaceFromTokens(
    displayName: string,
    raceName: string,
    tokenMap: Map<string, any[]>,
    lstFile: LSTFile
  ): PF1ERace {
    // Extract size from FACT:BaseSize
    const factToken = tokenMap.get('FACT:BaseSize')?.[0];
    const sizeStr = factToken ? tokenValueToString(factToken.value) : 'M';
    const size = this.mapSize(sizeStr);

    // Extract speed from MOVE token
    const moveToken = tokenMap.get('MOVE')?.[0];
    const speed = moveToken ? this.parseSpeed(tokenValueToString(moveToken.value)) : 30;

    // Extract source page
    const sourcePageToken = tokenMap.get('SOURCEPAGE')?.[0];
    const sourcePage = sourcePageToken ? tokenValueToString(sourcePageToken.value) : '';

    // Generate ID
    const id = raceName.toLowerCase().replace(/\s+/g, '-');

    // Initialize race with base data
    const race: PF1ERace = {
      id,
      name: displayName,
      size,
      type: 'Humanoid',
      speed,
      abilityScoreModifiers: {},
      racialTraits: [],
      languages: {
        starting: [],
        bonus: [],
      },
      vision: 'normal',
      source: {
        name: lstFile.source.long,
        shortName: lstFile.source.short,
        page: sourcePage,
        url: lstFile.source.web,
      },
    };

    return race;
  }

  /**
   * Enrich race with detailed abilities from abilities file
   */
  private enrichRaceWithAbilities(race: PF1ERace, abilitiesPath: string): void {
    const lstFile = this.parser.parseLSTFile(abilitiesPath);

    for (const line of lstFile.lines) {
      if (line.tokens.length === 0) continue;

      const firstToken = line.tokens[0];
      const tokenMap = this.parser.extractTokensFromLines([line]);

      // Parse ability score modifiers
      if (firstToken.key.includes('Ability Scores')) {
        this.parseAbilityScores(race, tokenMap);
      }

      // Parse languages
      if (firstToken.key === 'Languages') {
        this.parseLanguages(race, tokenMap);
      }

      // Parse vision
      if (firstToken.key.includes('Vision') || firstToken.key.includes('Darkvision')) {
        this.parseVision(race, tokenMap);
      }

      // Parse other racial traits
      this.parseRacialTrait(race, firstToken.key, tokenMap);
    }
  }

  /**
   * Parse ability score modifiers
   */
  private parseAbilityScores(race: PF1ERace, tokenMap: Map<string, any[]>): void {
    const bonusTokens = tokenMap.get('BONUS:STAT');
    if (!bonusTokens) return;

    for (const token of bonusTokens) {
      const values = tokenValueToArray(token.value);
      if (values.length < 2) continue;

      const stats = values[0].split(',');
      const modifierStr = values[1];
      const modifier = parseInt(modifierStr, 10);

      const validAbilityScores = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

      for (const stat of stats) {
        const cleanStat = stat.trim().toUpperCase();
        if (cleanStat && !isNaN(modifier) && validAbilityScores.includes(cleanStat)) {
          race.abilityScoreModifiers[cleanStat as 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'] = modifier;
        }
      }
    }
  }

  /**
   * Parse languages
   */
  private parseLanguages(race: PF1ERace, tokenMap: Map<string, any[]>): void {
    const autoLangTokens = tokenMap.get('AUTO:LANG');
    if (autoLangTokens) {
      for (const token of autoLangTokens) {
        const values = tokenValueToArray(token.value);
        for (const lang of values) {
          const cleanLang = lang.trim();
          if (cleanLang && !race.languages.starting.includes(cleanLang)) {
            race.languages.starting.push(cleanLang);
          }
        }
      }
    }

    // Bonus languages: extracted from description for now
    const descToken = tokenMap.get('DESC')?.[0];
    if (descToken) {
      const desc = tokenValueToString(descToken.value);
      const bonusMatch = desc.match(/can choose from the following: ([^.]+)/i);
      if (bonusMatch) {
        const bonusLangs = bonusMatch[1].split(/,\s*(?:and\s+)?/);
        for (const lang of bonusLangs) {
          const cleanLang = lang.trim().replace(/\.$/, '');
          if (cleanLang && !race.languages.bonus.includes(cleanLang)) {
            race.languages.bonus.push(cleanLang);
          }
        }
      }
    }
  }

  /**
   * Parse vision traits
   */
  private parseVision(race: PF1ERace, tokenMap: Map<string, any[]>): void {
    const visionToken = tokenMap.get('VISION')?.[0];
    if (visionToken) {
      const visionStr = tokenValueToString(visionToken.value);

      if (visionStr.includes('Darkvision')) {
        const match = visionStr.match(/\((\d+)\)/);
        const distance = match ? parseInt(match[1], 10) : 60;
        race.vision = 'darkvision';
        race.visionRange = distance;

        race.racialTraits.push({
          id: 'darkvision',
          name: 'Darkvision',
          description: `You can see in the dark up to ${distance} feet.`,
          type: 'Ex',
        });
      } else if (visionStr.includes('Low-Light')) {
        race.vision = 'low-light';

        race.racialTraits.push({
          id: 'low-light-vision',
          name: 'Low-Light Vision',
          description: 'You can see twice as far as humans in conditions of dim light.',
          type: 'Ex',
        });
      }
    }
  }

  /**
   * Parse individual racial trait
   */
  private parseRacialTrait(race: PF1ERace, traitName: string, tokenMap: Map<string, any[]>): void {
    // Skip internal traits and metadata
    if (traitName.includes('~') || traitName.includes('KEY:')) return;
    if (traitName.includes('Racial Traits')) return;
    if (traitName.includes('.MOD')) return;

    const descToken = tokenMap.get('DESC')?.[0];
    if (descToken) {
      const description = tokenValueToString(descToken.value);

      // Clean up description (remove variable placeholders for now)
      const cleanDesc = description.replace(/\|[^|]+$/g, '').replace(/%\d+/g, '');

      const traitId = traitName.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');

      race.racialTraits.push({
        id: traitId,
        name: traitName,
        description: cleanDesc,
        type: 'Ex',
      });
    }
  }

  /**
   * Map size string to Size enum
   */
  private mapSize(sizeStr: string): Size {
    const sizeMap: Record<string, Size> = {
      F: 'Fine',
      D: 'Diminutive',
      T: 'Tiny',
      S: 'Small',
      M: 'Medium',
      L: 'Large',
      H: 'Huge',
      G: 'Gargantuan',
      C: 'Colossal',
    };

    return sizeMap[sizeStr] || 'Medium';
  }

  /**
   * Parse speed from MOVE token value
   */
  private parseSpeed(moveStr: string): number {
    // Format: "Walk,30"
    const parts = moveStr.split(',');
    if (parts.length >= 2) {
      return parseInt(parts[1], 10) || 30;
    }
    return 30;
  }
}

// CLI execution
if (require.main === module) {
  const raceParser = new RaceParser();
  const pathfinderDataPath =
    process.argv[2] || '../../../data/pathfinder';

  try {
    console.log(`Parsing core races from: ${pathfinderDataPath}`);
    const races = raceParser.parseCoreRaces(pathfinderDataPath);

    console.log(`\nParsed ${races.length} races:`);
    races.forEach((race) => {
      console.log(`  - ${race.name} (${race.size}, ${race.speed}ft speed)`);
      const mods = Object.entries(race.abilityScoreModifiers);
      if (mods.length > 0) {
        const modStr = mods
          .map(([ability, modifier]) => `${modifier > 0 ? '+' : ''}${modifier} ${ability}`)
          .join(', ');
        console.log(`    Ability Mods: ${modStr}`);
      }
      console.log(`    Traits: ${race.racialTraits.length}`);
    });

    // Output JSON
    const outputPath = process.argv[3] || './races.json';
    fs.writeFileSync(outputPath, JSON.stringify(races, null, 2));
    console.log(`\nOutput written to: ${outputPath}`);
  } catch (error) {
    console.error('Error parsing races:', error);
    process.exit(1);
  }
}
