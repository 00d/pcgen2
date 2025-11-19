/**
 * Spell LST file parser
 * Converts spell LST files to JSON
 */

import * as fs from 'fs';
import type { PF1ESpell } from '../../../types/pathfinder1e';
import { LSTParser, tokenValueToString } from '../parser';
import type { LSTFile } from '../types';

export class SpellParser {
  private parser: LSTParser;

  constructor() {
    this.parser = new LSTParser({
      verbose: false,
      skipComments: true,
      skipBlankLines: true,
    });
  }

  /**
   * Parse a spells LST file and return array of PF1ESpell objects
   */
  parseSpellsFile(filePath: string): PF1ESpell[] {
    const lstFile = this.parser.parseLSTFile(filePath);
    const spells: PF1ESpell[] = [];

    for (const line of lstFile.lines) {
      if (line.tokens.length === 0) continue;

      const firstToken = line.tokens[0];

      // Skip continuation lines, .MOD, SOURCE
      if (firstToken.key.match(/^\d+$/)) continue;
      if (firstToken.key.includes('.MOD')) continue;
      if (firstToken.key.includes('SOURCE')) continue;

      // First token is the spell name
      const spellName = firstToken.key;
      const spell = this.parseSpell(spellName, [line], lstFile);

      if (spell) {
        spells.push(spell);
      }
    }

    return spells;
  }

  /**
   * Parse a single spell from a line
   */
  private parseSpell(spellName: string, lines: any[], lstFile: LSTFile): PF1ESpell | null {
    const tokenMap = this.parser.extractTokensFromLines(lines);

    // Extract school and subschool
    const schoolToken = tokenMap.get('SCHOOL')?.[0];
    const school = schoolToken ? tokenValueToString(schoolToken.value) : 'Universal';

    const subschoolToken = tokenMap.get('SUBSCHOOL')?.[0];
    const subschool = subschoolToken ? tokenValueToString(subschoolToken.value) : undefined;

    // Extract descriptors
    const descriptorToken = tokenMap.get('DESCRIPTOR')?.[0];
    const descriptorStr = descriptorToken ? tokenValueToString(descriptorToken.value) : '';
    const descriptors = descriptorStr ? descriptorStr.split('|').map((d) => d.trim()) : [];

    // Extract class levels - CLASSES token format: "Class1,Class2=Level|Class3=Level"
    const classLevels: Record<string, number> = {};
    const classesToken = tokenMap.get('CLASSES')?.[0];
    if (classesToken) {
      const classesStr = tokenValueToString(classesToken.value);
      const classPairs = classesStr.split('|');
      for (const pair of classPairs) {
        const parts = pair.split('=');
        if (parts.length === 2) {
          const classes = parts[0].split(',');
          const level = parseInt(parts[1], 10);
          for (const className of classes) {
            classLevels[className.trim()] = level;
          }
        }
      }
    }

    // Extract components
    const compsToken = tokenMap.get('COMPS')?.[0];
    const compsStr = compsToken ? tokenValueToString(compsToken.value) : '';
    const components = {
      verbal: compsStr.includes('V'),
      somatic: compsStr.includes('S'),
      material: compsStr.includes('M') ? 'See text' : undefined,
      focus: compsStr.includes('F') ? 'See text' : undefined,
      divineFocus: compsStr.includes('DF'),
    };

    // Extract casting time
    const castTimeToken = tokenMap.get('CASTTIME')?.[0];
    const castingTime = castTimeToken ? tokenValueToString(castTimeToken.value) : '1 standard action';

    // Extract range
    const rangeToken = tokenMap.get('RANGE')?.[0];
    const range = rangeToken ? tokenValueToString(rangeToken.value) : 'Personal';

    // Extract duration
    const durationToken = tokenMap.get('DURATION')?.[0];
    const duration = durationToken ? this.cleanDuration(tokenValueToString(durationToken.value)) : 'Instantaneous';

    // Extract saving throw
    const saveToken = tokenMap.get('SAVEINFO')?.[0];
    const savingThrow = saveToken ? tokenValueToString(saveToken.value) : 'None';

    // Extract spell resistance
    const srToken = tokenMap.get('SPELLRES')?.[0];
    const srStr = srToken ? tokenValueToString(srToken.value) : 'No';
    const spellResistance = srStr.toLowerCase() === 'yes' || srStr.toLowerCase() === 'true';

    // Extract description
    const descToken = tokenMap.get('DESC')?.[0];
    let description = descToken ? tokenValueToString(descToken.value) : '';
    // Clean up description - remove conditional text
    description = description.split('|')[0].trim();

    // Extract source page
    const sourcePageToken = tokenMap.get('SOURCEPAGE')?.[0];
    const sourcePage = sourcePageToken ? tokenValueToString(sourcePageToken.value) : '';

    // Generate ID
    const id = spellName.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');

    return {
      id,
      name: spellName,
      school,
      subschool,
      descriptors,
      level: classLevels,
      components,
      castingTime,
      range,
      duration,
      savingThrow,
      spellResistance,
      description,
      source: {
        name: lstFile.source.long,
        shortName: lstFile.source.short,
        page: sourcePage,
        url: lstFile.source.web,
      },
    };
  }

  /**
   * Clean up duration string
   */
  private cleanDuration(duration: string): string {
    // Remove formula syntax like (CASTERLEVEL)
    return duration
      .replace(/\(CASTERLEVEL[^)]*\)/g, 'CL')
      .replace(/\(\)/g, '')
      .trim();
  }
}

// CLI execution
if (require.main === module) {
  const spellParser = new SpellParser();
  const pathfinderSpellsPath =
    process.argv[2] || '../data/pathfinder/paizo/roleplaying_game/core_rulebook/cr_spells.lst';

  try {
    console.log(`Parsing spells from: ${pathfinderSpellsPath}`);
    const spells = spellParser.parseSpellsFile(pathfinderSpellsPath);

    console.log(`\nParsed ${spells.length} spells:`);
    spells.slice(0, 10).forEach((spell) => {
      const levels = Object.entries(spell.level)
        .map(([cls, lvl]) => `${cls} ${lvl}`)
        .join(', ');
      console.log(`  - ${spell.name} [${spell.school}]`);
      if (levels) console.log(`    Levels: ${levels}`);
    });

    // Output JSON
    const outputPath = process.argv[3] || './spells.json';
    fs.writeFileSync(outputPath, JSON.stringify(spells, null, 2));
    console.log(`\nOutput written to: ${outputPath}`);
  } catch (error) {
    console.error('Error parsing spells:', error);
    process.exit(1);
  }
}
