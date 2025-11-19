/**
 * Main conversion script
 * Converts all PCGen LST data to JSON for Pathfinder 1E Core Rulebook
 */

import * as fs from 'fs';
import * as path from 'path';
import { SkillParser } from './parsers/skills';
import { RaceParser } from './parsers/races';
import { ClassParser } from './parsers/classes';
import { FeatParser } from './parsers/feats';
import { EquipmentParser } from './parsers/equipment';
import { SpellParser } from './parsers/spells';

const DATA_DIR = '../data/pathfinder/paizo/roleplaying_game/core_rulebook';
const OUTPUT_DIR = './public/data/pathfinder1e';

interface ConversionResult {
  success: boolean;
  name: string;
  count: number;
  error?: string;
}

async function ensureOutputDirectory() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function convertSkills(): ConversionResult {
  try {
    console.log('Converting skills...');
    const parser = new SkillParser();
    const skills = parser.parseSkillsFile(`${DATA_DIR}/cr_skills.lst`);
    fs.writeFileSync(`${OUTPUT_DIR}/skills.json`, JSON.stringify(skills, null, 2));
    return { success: true, name: 'Skills', count: skills.length };
  } catch (error) {
    return { success: false, name: 'Skills', count: 0, error: String(error) };
  }
}

function convertRaces(): ConversionResult {
  try {
    console.log('Converting races...');
    const parser = new RaceParser();
    const races = parser.parseCoreRaces('../data/pathfinder');
    fs.writeFileSync(`${OUTPUT_DIR}/races.json`, JSON.stringify(races, null, 2));
    return { success: true, name: 'Races', count: races.length };
  } catch (error) {
    return { success: false, name: 'Races', count: 0, error: String(error) };
  }
}

function convertClasses(): ConversionResult {
  try {
    console.log('Converting classes...');
    const parser = new ClassParser();
    const classes = parser.parseClassesFile(`${DATA_DIR}/cr_classes.lst`);
    fs.writeFileSync(`${OUTPUT_DIR}/classes.json`, JSON.stringify(classes, null, 2));
    return { success: true, name: 'Classes', count: classes.length };
  } catch (error) {
    return { success: false, name: 'Classes', count: 0, error: String(error) };
  }
}

function convertFeats(): ConversionResult {
  try {
    console.log('Converting feats...');
    const parser = new FeatParser();
    const feats = parser.parseFeatsFile(`${DATA_DIR}/cr_feats.lst`);
    fs.writeFileSync(`${OUTPUT_DIR}/feats.json`, JSON.stringify(feats, null, 2));
    return { success: true, name: 'Feats', count: feats.length };
  } catch (error) {
    return { success: false, name: 'Feats', count: 0, error: String(error) };
  }
}

function convertEquipment(): ConversionResult {
  try {
    console.log('Converting equipment...');
    const parser = new EquipmentParser();
    const { weapons, armor, equipment } = parser.parseEquipmentFile(
      `${DATA_DIR}/cr_equip_arms_armor.lst`
    );
    fs.writeFileSync(`${OUTPUT_DIR}/weapons.json`, JSON.stringify(weapons, null, 2));
    fs.writeFileSync(`${OUTPUT_DIR}/armor.json`, JSON.stringify(armor, null, 2));
    fs.writeFileSync(`${OUTPUT_DIR}/equipment.json`, JSON.stringify(equipment, null, 2));
    return {
      success: true,
      name: 'Equipment',
      count: weapons.length + armor.length + equipment.length,
    };
  } catch (error) {
    return { success: false, name: 'Equipment', count: 0, error: String(error) };
  }
}

function convertSpells(): ConversionResult {
  try {
    console.log('Converting spells...');
    const parser = new SpellParser();
    const spells = parser.parseSpellsFile(`${DATA_DIR}/cr_spells.lst`);
    fs.writeFileSync(`${OUTPUT_DIR}/spells.json`, JSON.stringify(spells, null, 2));
    return { success: true, name: 'Spells', count: spells.length };
  } catch (error) {
    return { success: false, name: 'Spells', count: 0, error: String(error) };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('PCGen to JSON Conversion - Pathfinder 1E Core Rulebook');
  console.log('='.repeat(60));
  console.log('');

  await ensureOutputDirectory();

  const results: ConversionResult[] = [];

  // Run all conversions
  results.push(convertSkills());
  results.push(convertRaces());
  results.push(convertClasses());
  results.push(convertFeats());
  results.push(convertEquipment());
  results.push(convertSpells());

  // Print summary
  console.log('');
  console.log('='.repeat(60));
  console.log('CONVERSION SUMMARY');
  console.log('='.repeat(60));
  console.log('');

  let totalSuccess = 0;
  let totalFailed = 0;
  let totalItems = 0;

  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.count} items`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.success) {
      totalSuccess++;
      totalItems += result.count;
    } else {
      totalFailed++;
    }
  }

  console.log('');
  console.log('-'.repeat(60));
  console.log(`Total: ${totalSuccess} successful, ${totalFailed} failed`);
  console.log(`Total items converted: ${totalItems}`);
  console.log('-'.repeat(60));
  console.log('');
  console.log(`Output directory: ${path.resolve(OUTPUT_DIR)}`);
  console.log('');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

// Run the conversion
main().catch((error) => {
  console.error('Fatal error during conversion:', error);
  process.exit(1);
});
