/**
 * Feat LST file parser
 * Converts feat LST files to JSON
 */

import * as fs from 'fs';
import type { PF1EFeat } from '../../../types/pathfinder1e';
import { LSTParser, tokenValueToString, tokenValueToArray } from '../parser';
import type { LSTFile } from '../types';

export class FeatParser {
  private parser: LSTParser;

  constructor() {
    this.parser = new LSTParser({
      verbose: false,
      skipComments: true,
      skipBlankLines: true,
    });
  }

  /**
   * Parse a feats LST file and return array of PF1EFeat objects
   */
  parseFeatsFile(filePath: string): PF1EFeat[] {
    const lstFile = this.parser.parseLSTFile(filePath);
    const feats: PF1EFeat[] = [];

    for (const line of lstFile.lines) {
      if (line.tokens.length === 0) continue;

      const firstToken = line.tokens[0];

      // Skip if it's a continuation line (starts with number)
      if (firstToken.key.match(/^\d+$/)) continue;

      // Skip .MOD entries
      if (firstToken.key.includes('.MOD')) continue;

      // Skip SOURCE tokens
      if (firstToken.key.includes('SOURCE')) continue;

      // First token is the feat name
      const featName = firstToken.key;
      const feat = this.parseFeat(featName, [line], lstFile);

      if (feat) {
        feats.push(feat);
      }
    }

    return feats;
  }

  /**
   * Parse a single feat from a line
   */
  private parseFeat(featName: string, lines: any[], lstFile: LSTFile): PF1EFeat | null {
    const tokenMap = this.parser.extractTokensFromLines(lines);

    // Extract type
    const typeToken = tokenMap.get('TYPE')?.[0];
    const typeStr = typeToken ? tokenValueToString(typeToken.value) : '';
    const types = typeStr.split('.').filter((t) => t.trim() !== '');

    // Map to primary type
    const type = this.mapFeatType(types);

    // Extract description
    const descToken = tokenMap.get('DESC')?.[0];
    const description = descToken ? this.cleanDescription(tokenValueToString(descToken.value)) : '';

    // Extract benefit
    const benefitToken = tokenMap.get('BENEFIT')?.[0];
    const benefit = benefitToken ? this.cleanDescription(tokenValueToString(benefitToken.value)) : '';

    // Extract prerequisites
    const prerequisites = this.extractPrerequisites(tokenMap);

    // Extract source page
    const sourcePageToken = tokenMap.get('SOURCEPAGE')?.[0];
    const sourcePage = sourcePageToken ? tokenValueToString(sourcePageToken.value) : '';

    // Generate ID
    const id = featName.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');

    return {
      id,
      name: featName,
      type,
      description,
      benefit,
      prerequisites: Object.keys(prerequisites).length > 0 ? prerequisites : undefined,
      source: {
        name: lstFile.source.long,
        shortName: lstFile.source.short,
        page: sourcePage,
        url: lstFile.source.web,
      },
    };
  }

  /**
   * Clean up description text
   */
  private cleanDescription(desc: string): string {
    // Remove variable placeholders like %1, %2, |varname
    return desc
      .replace(/%\d+/g, '')
      .replace(/\|[^|]+$/g, '')
      .trim();
  }

  /**
   * Map feat types to primary type
   */
  private mapFeatType(types: string[]): PF1EFeat['type'] {
    const typeStr = types.join('.').toLowerCase();

    if (typeStr.includes('combat')) return 'combat';
    if (typeStr.includes('metamagic')) return 'metamagic';
    if (typeStr.includes('itemcreation')) return 'item creation';
    if (typeStr.includes('teamwork')) return 'teamwork';

    return 'general';
  }

  /**
   * Extract prerequisites from tokens
   */
  private extractPrerequisites(tokenMap: Map<string, any[]>): NonNullable<PF1EFeat['prerequisites']> {
    const prerequisites: NonNullable<PF1EFeat['prerequisites']> = {};

    // PREABILITY - feat prerequisites
    const preAbilityTokens = tokenMap.get('PREABILITY') || [];
    const featPrereqs: string[] = [];
    for (const token of preAbilityTokens) {
      const values = tokenValueToArray(token.value);
      if (values.length >= 2) {
        // Format: count|category|name
        const prereqName = values[2] || values[1];
        if (prereqName && !prereqName.includes('TYPE.')) {
          featPrereqs.push(prereqName.replace(/~/g, ' ').trim());
        }
      }
    }
    if (featPrereqs.length > 0) {
      prerequisites.feats = featPrereqs;
    }

    // PRETOTALAB - base attack bonus
    const preTotalABToken = tokenMap.get('PRETOTALAB')?.[0];
    if (preTotalABToken) {
      const bab = parseInt(tokenValueToString(preTotalABToken.value), 10);
      if (!isNaN(bab)) {
        prerequisites.baseAttackBonus = bab;
      }
    }

    // PREVARGTEQ - stat prerequisites
    const preVarTokens = tokenMap.get('PREVARGTEQ') || [];
    const abilityScores: Partial<Record<string, number>> = {};
    for (const token of preVarTokens) {
      const values = tokenValueToArray(token.value);
      if (values.length >= 2) {
        const varName = values[0];
        const varValue = parseInt(values[1], 10);

        if (varName.includes('PreStatScore')) {
          const stat = varName.replace('PreStatScore_', '');
          if (!isNaN(varValue)) {
            abilityScores[stat] = varValue;
          }
        } else if (varName.includes('CasterLevel') && !isNaN(varValue)) {
          prerequisites.spellcasterLevel = varValue;
        }
      }
    }
    if (Object.keys(abilityScores).length > 0) {
      prerequisites.abilityScores = abilityScores as any;
    }

    // PRESKILL - skill prerequisites
    const preSkillTokens = tokenMap.get('PRESKILL') || [];
    const skillPrereqs: Array<{ id: string; ranks: number }> = [];
    for (const token of preSkillTokens) {
      const values = tokenValueToArray(token.value);
      if (values.length >= 2) {
        const skillName = values[1];
        const ranks = parseInt(values[2] || '1', 10);
        if (skillName && !isNaN(ranks)) {
          const skillId = skillName.toLowerCase().replace(/\s+/g, '-');
          skillPrereqs.push({ id: skillId, ranks });
        }
      }
    }
    if (skillPrereqs.length > 0) {
      prerequisites.skills = skillPrereqs;
    }

    return prerequisites;
  }
}

// CLI execution
if (require.main === module) {
  const featParser = new FeatParser();
  const pathfinderFeatsPath =
    process.argv[2] || '../data/pathfinder/paizo/roleplaying_game/core_rulebook/cr_feats.lst';

  try {
    console.log(`Parsing feats from: ${pathfinderFeatsPath}`);
    const feats = featParser.parseFeatsFile(pathfinderFeatsPath);

    console.log(`\nParsed ${feats.length} feats:`);
    feats.slice(0, 10).forEach((feat) => {
      console.log(`  - ${feat.name} [${feat.type}]`);
      if (feat.prerequisites) {
        const prereqParts: string[] = [];
        if (feat.prerequisites.feats) {
          prereqParts.push(`Feats: ${feat.prerequisites.feats.join(', ')}`);
        }
        if (feat.prerequisites.baseAttackBonus) {
          prereqParts.push(`BAB +${feat.prerequisites.baseAttackBonus}`);
        }
        if (feat.prerequisites.abilityScores) {
          const scores = Object.entries(feat.prerequisites.abilityScores)
            .map(([ability, score]) => `${ability} ${score}`)
            .join(', ');
          prereqParts.push(scores);
        }
        if (feat.prerequisites.skills) {
          const skills = feat.prerequisites.skills
            .map((s) => `${s.id} ${s.ranks} ranks`)
            .join(', ');
          prereqParts.push(skills);
        }
        if (prereqParts.length > 0) {
          console.log(`    Prerequisites: ${prereqParts.join('; ')}`);
        }
      }
    });

    // Output JSON
    const outputPath = process.argv[3] || './feats.json';
    fs.writeFileSync(outputPath, JSON.stringify(feats, null, 2));
    console.log(`\nOutput written to: ${outputPath}`);
  } catch (error) {
    console.error('Error parsing feats:', error);
    process.exit(1);
  }
}
