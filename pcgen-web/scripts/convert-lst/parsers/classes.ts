/**
 * Class LST file parser
 * Converts class LST files to JSON
 */

import * as fs from 'fs';
import type {
  PF1EClass,
  BABProgression,
  SaveProgression,
} from '../../../types/pathfinder1e';
import { LSTParser, tokenValueToString, tokenValueToArray } from '../parser';
import type { LSTFile, LSTLine } from '../types';

export class ClassParser {
  private parser: LSTParser;

  constructor() {
    this.parser = new LSTParser({
      verbose: false,
      skipComments: true,
      skipBlankLines: true,
    });
  }

  /**
   * Parse a classes LST file and return array of PF1EClass objects
   */
  parseClassesFile(filePath: string): PF1EClass[] {
    const lstFile = this.parser.parseLSTFile(filePath);
    const classes: PF1EClass[] = [];

    // Group lines by CLASS: token
    const classGroups = this.parser.groupByObject(lstFile, 'CLASS');

    for (const [className, lines] of classGroups) {
      // Skip Ex- classes and .MOD entries
      if (className.startsWith('Ex-') || className.includes('.MOD')) continue;

      const parsedClass = this.parseClass(className, lines, lstFile);
      if (parsedClass) {
        classes.push(parsedClass);
      }
    }

    return classes;
  }

  /**
   * Parse a single class from grouped lines
   */
  private parseClass(
    className: string,
    lines: LSTLine[],
    lstFile: LSTFile
  ): PF1EClass | null {
    const tokenMap = this.parser.extractTokensFromLines(lines);

    // Extract hit die
    const hdToken = tokenMap.get('HD')?.[0];
    const hitDie = hdToken ? parseInt(tokenValueToString(hdToken.value), 10) : 8;

    // Extract skill points per level
    const skillPtsToken = tokenMap.get('STARTSKILLPTS')?.[0];
    let skillPointsPerLevel = 2; // default
    if (skillPtsToken) {
      const skillPtsStr = tokenValueToString(skillPtsToken.value);
      const parsed = parseInt(skillPtsStr, 10);
      // If it's a valid number, use it; otherwise look for BONUS that sets it
      if (!isNaN(parsed)) {
        skillPointsPerLevel = parsed;
      } else {
        // Look for BONUS:VAR that sets the skill points (e.g., Fighter)
        const bonusTokens = tokenMap.get('BONUS') || [];
        for (const token of bonusTokens) {
          const values = tokenValueToArray(token.value);
          if (values.length >= 3 && values[0] === 'VAR' && values[1].includes('SkillPoints')) {
            const points = parseInt(values[2], 10);
            if (!isNaN(points)) {
              skillPointsPerLevel = points;
              break;
            }
          }
        }
      }
    }

    // Determine class type
    const typeToken = tokenMap.get('TYPE')?.[0];
    const typeStr = typeToken ? tokenValueToString(typeToken.value) : '';
    const classType = this.determineClassType(typeStr);

    // Extract BAB progression
    const babProgression = this.extractBABProgression(tokenMap);

    // Extract save progressions
    const saves = this.extractSaveProgressions(tokenMap);

    // Extract spell casting info (if spellcaster)
    const spellcasting = this.extractSpellProgression(lines, tokenMap);

    // Extract source page
    const sourcePageToken = tokenMap.get('SOURCEPAGE')?.[0];
    const sourcePage = sourcePageToken ? tokenValueToString(sourcePageToken.value) : '';

    // Generate ID
    const id = className.toLowerCase().replace(/\s+/g, '-');

    // Extract abbreviation
    const abbToken = tokenMap.get('FACT:Abb')?.[0];
    const key = abbToken ? tokenValueToString(abbToken.value) : className.substring(0, 3);

    const classData: PF1EClass = {
      id,
      name: className,
      key,
      hitDie,
      skillPointsPerLevel,
      classType,
      baseAttackBonus: babProgression,
      saves,
      classSkills: [], // TODO: Parse class skills from separate file
      proficiencies: {
        armor: [],
        shields: [],
        weapons: [],
      },
      classFeatures: [],
      source: {
        name: lstFile.source.long,
        shortName: lstFile.source.short,
        page: sourcePage,
        url: lstFile.source.web,
      },
    };

    if (spellcasting) {
      classData.spellcasting = spellcasting;
    }

    return classData;
  }

  /**
   * Determine class type from TYPE token
   */
  private determineClassType(typeStr: string): 'base' | 'prestige' | 'npc' {
    if (typeStr.includes('Prestige')) return 'prestige';
    if (typeStr.includes('NPC') || typeStr.includes('Monster')) return 'npc';
    return 'base';
  }

  /**
   * Extract BAB progression from tokens
   */
  private extractBABProgression(tokenMap: Map<string, any[]>): BABProgression {
    // BONUS tokens have structure: ["VAR", "ClassBABFull", ...] or ["VAR", "ClassBABModerate", ...]
    const bonusTokens = tokenMap.get('BONUS') || [];

    for (const token of bonusTokens) {
      const values = tokenValueToArray(token.value);
      if (values.length >= 2 && values[0] === 'VAR') {
        if (values[1].includes('ClassBABFull')) {
          return 'full';
        } else if (values[1].includes('ClassBABModerate')) {
          return 'medium';
        }
      }
    }

    return 'poor';
  }

  /**
   * Extract save progressions from tokens
   */
  private extractSaveProgressions(tokenMap: Map<string, any[]>): {
    fortitude: SaveProgression;
    reflex: SaveProgression;
    will: SaveProgression;
  } {
    // BONUS tokens have structure: ["VAR", "ClassSaveGood_Fortitude", ...]
    const bonusTokens = tokenMap.get('BONUS') || [];

    const saves = {
      fortitude: 'poor' as SaveProgression,
      reflex: 'poor' as SaveProgression,
      will: 'poor' as SaveProgression,
    };

    for (const token of bonusTokens) {
      const values = tokenValueToArray(token.value);
      if (values.length >= 2 && values[0] === 'VAR') {
        const varName = values[1];

        if (varName.includes('ClassSaveGood_Fortitude')) {
          saves.fortitude = 'good';
        } else if (varName.includes('ClassSavePoor_Fortitude')) {
          saves.fortitude = 'poor';
        }

        if (varName.includes('ClassSaveGood_Reflex')) {
          saves.reflex = 'good';
        } else if (varName.includes('ClassSavePoor_Reflex')) {
          saves.reflex = 'poor';
        }

        if (varName.includes('ClassSaveGood_Will')) {
          saves.will = 'good';
        } else if (varName.includes('ClassSavePoor_Will')) {
          saves.will = 'poor';
        }
      }
    }

    return saves;
  }

  /**
   * Extract spell progression from lines
   */
  private extractSpellProgression(
    lines: LSTLine[],
    tokenMap: Map<string, any[]>
  ): PF1EClass['spellcasting'] | undefined {
    // Check if class has SPELLSTAT token
    const spellStatToken = tokenMap.get('SPELLSTAT')?.[0];
    if (!spellStatToken) return undefined;

    const spellStat = tokenValueToString(spellStatToken.value);

    // Extract CAST lines to build spells per day table
    const spellsPerDayTable: number[][] = [];

    for (const line of lines) {
      const levelToken = line.tokens[0];
      if (!levelToken || !levelToken.key.match(/^\d+$/)) continue;

      const level = parseInt(levelToken.key, 10);

      // Extract CAST
      const castToken = line.tokens.find((t) => t.key === 'CAST');
      if (castToken) {
        const castValues = tokenValueToArray(castToken.value);
        spellsPerDayTable[level - 1] = castValues.map((v) => parseInt(v, 10) || 0);
      }
    }

    // Check for KNOWN (spontaneous casters)
    const hasKnown = lines.some((line) => line.tokens.some((t) => t.key === 'KNOWN'));
    const spellsKnownTable: number[][] | undefined = hasKnown ? [] : undefined;

    if (hasKnown) {
      for (const line of lines) {
        const levelToken = line.tokens[0];
        if (!levelToken || !levelToken.key.match(/^\d+$/)) continue;

        const level = parseInt(levelToken.key, 10);

        const knownToken = line.tokens.find((t) => t.key === 'KNOWN');
        if (knownToken && spellsKnownTable) {
          const knownValues = tokenValueToArray(knownToken.value);
          spellsKnownTable[level - 1] = knownValues.map((v) => parseInt(v, 10) || 0);
        }
      }
    }

    // Determine spell type (arcane/divine)
    const typeToken = tokenMap.get('TYPE')?.[0];
    const typeStr = typeToken ? tokenValueToString(typeToken.value) : '';
    const spellType = typeStr.includes('Divine') ? 'divine' : 'arcane';

    return {
      type: spellType,
      stat: spellStat as any,
      spellsPerDay: spellsPerDayTable,
      spellsKnown: spellsKnownTable,
      spellList: 'default', // TODO: Extract actual spell list
    };
  }
}

// CLI execution
if (require.main === module) {
  const classParser = new ClassParser();
  const pathfinderClassesPath =
    process.argv[2] ||
    '../data/pathfinder/paizo/roleplaying_game/core_rulebook/cr_classes.lst';

  try {
    console.log(`Parsing classes from: ${pathfinderClassesPath}`);
    const classes = classParser.parseClassesFile(pathfinderClassesPath);

    console.log(`\nParsed ${classes.length} classes:`);
    classes.forEach((cls) => {
      console.log(`  - ${cls.name} (${cls.key})`);
      console.log(`    HD: d${cls.hitDie}, Skills: ${cls.skillPointsPerLevel}/level`);
      console.log(`    BAB: ${cls.baseAttackBonus}`);
      console.log(
        `    Saves: Fort ${cls.saves.fortitude}, Ref ${cls.saves.reflex}, Will ${cls.saves.will}`
      );
      if (cls.spellcasting) {
        console.log(`    Spellcaster: ${cls.spellcasting.type} (${cls.spellcasting.stat})`);
      }
    });

    // Output JSON
    const outputPath = process.argv[3] || './classes.json';
    fs.writeFileSync(outputPath, JSON.stringify(classes, null, 2));
    console.log(`\nOutput written to: ${outputPath}`);
  } catch (error) {
    console.error('Error parsing classes:', error);
    process.exit(1);
  }
}
