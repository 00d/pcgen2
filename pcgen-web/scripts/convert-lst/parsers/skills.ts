/**
 * Skill LST file parser
 * Converts skill LST files to JSON
 */

import type { PF1ESkill } from '../../../types/pathfinder1e';
import { LSTParser, tokenValueToString } from '../parser';

export class SkillParser {
  private parser: LSTParser;

  constructor() {
    this.parser = new LSTParser({
      verbose: false,
      skipComments: true,
      skipBlankLines: true,
    });
  }

  /**
   * Parse a skills LST file and return array of PF1ESkill objects
   */
  parseSkillsFile(filePath: string): PF1ESkill[] {
    const lstFile = this.parser.parseLSTFile(filePath);
    const skills: PF1ESkill[] = [];

    // Skills format: First token is skill name (no KEY:), rest are KEY:VALUE
    for (const line of lstFile.lines) {
      if (line.tokens.length === 0) continue;

      const firstToken = line.tokens[0];

      // Skip if first token has a colon (it's metadata, not a skill)
      if (firstToken.key.includes('SOURCE')) continue;

      // Skip .MOD entries (modifications to existing skills)
      if (firstToken.key.includes('.MOD')) continue;

      // First token without colon is the skill name
      const skillName = firstToken.key;
      const skill = this.parseSkill(skillName, [line], lstFile.source);

      if (skill) {
        skills.push(skill);
      }
    }

    return skills;
  }

  /**
   * Parse a single skill from grouped lines
   */
  private parseSkill(
    skillName: string,
    lines: any[],
    source: any
  ): PF1ESkill | null {
    const tokenMap = this.parser.extractTokensFromLines(lines);

    // Extract key ability score
    const keyStatToken = tokenMap.get('KEYSTAT')?.[0];
    const ability = keyStatToken ? tokenValueToString(keyStatToken.value) : 'INT';

    // Map ability stat abbreviations
    const abilityMap: Record<string, any> = {
      STR: 'STR',
      DEX: 'DEX',
      CON: 'CON',
      INT: 'INT',
      WIS: 'WIS',
      CHA: 'CHA',
    };

    // Extract trained only flag
    const useUntrainedToken = tokenMap.get('USEUNTRAINED')?.[0];
    const trainedOnly = useUntrainedToken
      ? tokenValueToString(useUntrainedToken.value) === 'NO'
      : false;

    // Extract armor check penalty flag
    const acheckToken = tokenMap.get('ACHECK')?.[0];
    const armorCheckPenalty = acheckToken
      ? tokenValueToString(acheckToken.value) === 'YES'
      : false;

    // Extract source page
    const sourcePageToken = tokenMap.get('SOURCEPAGE')?.[0];
    const sourcePage = sourcePageToken
      ? tokenValueToString(sourcePageToken.value)
      : '';

    // Generate ID from skill name (lowercase, replace spaces with hyphens)
    const id = skillName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[()]/g, '');

    return {
      id,
      name: skillName,
      ability: abilityMap[ability] || 'INT',
      trainedOnly,
      armorCheckPenalty,
      description: `The ${skillName} skill represents training and expertise in ${skillName.toLowerCase()}.`,
      source: {
        name: source.long,
        shortName: source.short,
        page: sourcePage,
        url: source.web,
      },
    };
  }
}

// CLI execution
if (require.main === module) {
  const skillParser = new SkillParser();
  const pathfinderSkillsPath = process.argv[2] ||
    '../data/pathfinder/paizo/roleplaying_game/core_rulebook/cr_skills.lst';

  try {
    console.log(`Parsing skills from: ${pathfinderSkillsPath}`);
    const skills = skillParser.parseSkillsFile(pathfinderSkillsPath);

    console.log(`\nParsed ${skills.length} skills:`);
    skills.forEach(skill => {
      console.log(
        `  - ${skill.name} (${skill.ability})${skill.trainedOnly ? ' [Trained Only]' : ''}${skill.armorCheckPenalty ? ' [ACP]' : ''}`
      );
    });

    // Output JSON
    const outputPath = process.argv[3] || './skills.json';
    const fs = require('fs');
    fs.writeFileSync(outputPath, JSON.stringify(skills, null, 2));
    console.log(`\nOutput written to: ${outputPath}`);
  } catch (error) {
    console.error('Error parsing skills:', error);
    process.exit(1);
  }
}
