/**
 * Simple test script for LST parser
 */

import * as path from 'path';
import { LSTParser } from './parser';

const parser = new LSTParser({
  verbose: true,
  skipComments: true,
  skipBlankLines: true,
});

// Test with skills file
const skillsPath = path.join(__dirname, '../../../data/pathfinder/paizo/roleplaying_game/core_rulebook/cr_skills.lst');

console.log('Testing LST Parser');
console.log('==================');
console.log(`File: ${skillsPath}`);
console.log('');

try {
  const lstFile = parser.parseLSTFile(skillsPath);

  console.log(`Source: ${lstFile.source.long} (${lstFile.source.short})`);
  console.log(`Lines parsed: ${lstFile.lines.length}`);
  console.log('');

  // Show first few lines
  console.log('First 5 lines:');
  lstFile.lines.slice(0, 5).forEach((line, i) => {
    console.log(`\nLine ${i + 1}:`);
    line.tokens.forEach(token => {
      console.log(`  ${token.key}: ${JSON.stringify(token.value)}`);
    });
  });

  // Test grouping by object
  console.log('\n\nGrouping by "Skill Name":');
  const groups = parser.groupByObject(lstFile, 'Skill Name');
  console.log(`Found ${groups.size} skill groups`);

  // Show first 3 groups
  let count = 0;
  for (const [name, lines] of groups) {
    if (count >= 3) break;
    console.log(`\n  ${name}: ${lines.length} lines`);
    count++;
  }

  console.log('\n✓ Parser test successful!');
} catch (error) {
  console.error('✗ Parser test failed:', error);
  process.exit(1);
}
