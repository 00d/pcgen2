import { LSTParser } from './convert-lst/parser';

const parser = new LSTParser({ verbose: false, skipComments: true, skipBlankLines: true });
const lstFile = parser.parseLSTFile('../data/pathfinder/paizo/roleplaying_game/core_rulebook/cr_classes.lst');

// Find Barbarian lines
const barbarianGroups = parser.groupByObject(lstFile, 'CLASS');
const barbarianLines = barbarianGroups.get('Barbarian');

if (barbarianLines) {
  console.log(`Found ${barbarianLines.length} lines for Barbarian`);

  const tokenMap = parser.extractTokensFromLines(barbarianLines);
  console.log('\nAll tokens:');
  for (const [key, tokens] of tokenMap) {
    console.log(`  ${key}: ${tokens.length} occurrences`);
  }

  console.log('\nBONUS tokens:');
  const bonusTokens = tokenMap.get('BONUS') || [];
  bonusTokens.forEach((t, i) => {
    const val = typeof t.value === 'string' ? t.value : JSON.stringify(t.value);
    console.log(`  [${i}]: ${val.substring(0, 100)}`);
  });
}
