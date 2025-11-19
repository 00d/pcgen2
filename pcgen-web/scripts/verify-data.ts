/**
 * Data verification script
 * Checks completeness and integrity of parsed JSON data
 */

import * as fs from 'fs';
import * as path from 'path';

interface VerificationResult {
  file: string;
  valid: boolean;
  itemCount: number;
  issues: string[];
  warnings: string[];
}

const dataDir = path.join(__dirname, '../public/data/pathfinder1e');

function verifyClasses(): VerificationResult {
  const file = 'classes.json';
  const result: VerificationResult = {
    file,
    valid: true,
    itemCount: 0,
    issues: [],
    warnings: [],
  };

  try {
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    result.itemCount = data.length;

    // Check for required fields
    for (const cls of data) {
      if (!cls.id) result.issues.push(`Class missing id: ${cls.name}`);
      if (!cls.name) result.issues.push(`Class missing name: ${cls.id}`);
      if (!cls.key) result.issues.push(`Class ${cls.name} missing key`);
      if (!cls.hitDie || cls.hitDie < 4 || cls.hitDie > 12) {
        result.warnings.push(`Class ${cls.name} has unusual hit die: d${cls.hitDie}`);
      }
      if (cls.skillPointsPerLevel < 0 || cls.skillPointsPerLevel > 10) {
        result.warnings.push(`Class ${cls.name} has unusual skill points: ${cls.skillPointsPerLevel}`);
      }
      if (!['full', 'medium', 'poor'].includes(cls.baseAttackBonus)) {
        result.issues.push(`Class ${cls.name} has invalid BAB: ${cls.baseAttackBonus}`);
      }
      if (!cls.saves || !cls.saves.fortitude || !cls.saves.reflex || !cls.saves.will) {
        result.issues.push(`Class ${cls.name} missing saves`);
      }
      if (!cls.source || !cls.source.name) {
        result.issues.push(`Class ${cls.name} missing source`);
      }
    }

    // Check for expected core classes
    const expectedClasses = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Wizard'];
    for (const expected of expectedClasses) {
      if (!data.some((c: any) => c.name === expected)) {
        result.warnings.push(`Expected core class not found: ${expected}`);
      }
    }

    result.valid = result.issues.length === 0;
  } catch (error: any) {
    result.valid = false;
    result.issues.push(`Parse error: ${error.message}`);
  }

  return result;
}

function verifyRaces(): VerificationResult {
  const file = 'races.json';
  const result: VerificationResult = {
    file,
    valid: true,
    itemCount: 0,
    issues: [],
    warnings: [],
  };

  try {
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    result.itemCount = data.length;

    for (const race of data) {
      if (!race.id) result.issues.push(`Race missing id: ${race.name}`);
      if (!race.name) result.issues.push(`Race missing name: ${race.id}`);
      if (!race.size) result.issues.push(`Race ${race.name} missing size`);
      if (!race.type) result.issues.push(`Race ${race.name} missing type`);
      if (typeof race.speed !== 'number') result.issues.push(`Race ${race.name} missing/invalid speed`);
      if (!race.racialTraits || !Array.isArray(race.racialTraits)) {
        result.issues.push(`Race ${race.name} missing racial traits`);
      }
      if (!race.languages || !race.languages.starting) {
        result.warnings.push(`Race ${race.name} missing starting languages`);
      }
      if (!race.vision) result.issues.push(`Race ${race.name} missing vision`);
      if (!race.source || !race.source.name) {
        result.issues.push(`Race ${race.name} missing source`);
      }
    }

    // Check for expected core races
    const expectedRaces = ['Dwarf', 'Elf', 'Gnome', 'Half-Elf', 'Half-Orc', 'Halfling', 'Human'];
    for (const expected of expectedRaces) {
      if (!data.some((r: any) => r.name === expected)) {
        result.issues.push(`Expected core race not found: ${expected}`);
      }
    }

    result.valid = result.issues.length === 0;
  } catch (error: any) {
    result.valid = false;
    result.issues.push(`Parse error: ${error.message}`);
  }

  return result;
}

function verifyFeats(): VerificationResult {
  const file = 'feats.json';
  const result: VerificationResult = {
    file,
    valid: true,
    itemCount: 0,
    issues: [],
    warnings: [],
  };

  try {
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    result.itemCount = data.length;

    for (const feat of data) {
      if (!feat.id) result.issues.push(`Feat missing id: ${feat.name}`);
      if (!feat.name) result.issues.push(`Feat missing name: ${feat.id}`);
      if (!feat.type) result.issues.push(`Feat ${feat.name} missing type`);
      if (!['general', 'combat', 'metamagic', 'item creation', 'teamwork'].includes(feat.type)) {
        result.warnings.push(`Feat ${feat.name} has unusual type: ${feat.type}`);
      }
      if (!feat.description) result.warnings.push(`Feat ${feat.name} missing description`);
      if (!feat.benefit) result.warnings.push(`Feat ${feat.name} missing benefit`);
      if (!feat.source || !feat.source.name) {
        result.issues.push(`Feat ${feat.name} missing source`);
      }
    }

    if (data.length < 100) {
      result.warnings.push(`Only ${data.length} feats found, expected more from core rulebook`);
    }

    result.valid = result.issues.length === 0;
  } catch (error: any) {
    result.valid = false;
    result.issues.push(`Parse error: ${error.message}`);
  }

  return result;
}

function verifySkills(): VerificationResult {
  const file = 'skills.json';
  const result: VerificationResult = {
    file,
    valid: true,
    itemCount: 0,
    issues: [],
    warnings: [],
  };

  try {
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    result.itemCount = data.length;

    for (const skill of data) {
      if (!skill.id) result.issues.push(`Skill missing id: ${skill.name}`);
      if (!skill.name) result.issues.push(`Skill missing name: ${skill.id}`);
      if (!skill.ability) result.issues.push(`Skill ${skill.name} missing ability`);
      if (!['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].includes(skill.ability)) {
        result.issues.push(`Skill ${skill.name} has invalid ability: ${skill.ability}`);
      }
      if (typeof skill.trainedOnly !== 'boolean') {
        result.warnings.push(`Skill ${skill.name} missing trainedOnly flag`);
      }
      if (typeof skill.armorCheckPenalty !== 'boolean') {
        result.warnings.push(`Skill ${skill.name} missing armorCheckPenalty flag`);
      }
      if (!skill.source || !skill.source.name) {
        result.issues.push(`Skill ${skill.name} missing source`);
      }
    }

    // Check for expected core skills
    const expectedSkills = ['Acrobatics', 'Climb', 'Diplomacy', 'Perception', 'Stealth', 'Survival'];
    for (const expected of expectedSkills) {
      if (!data.some((s: any) => s.name === expected)) {
        result.warnings.push(`Expected core skill not found: ${expected}`);
      }
    }

    result.valid = result.issues.length === 0;
  } catch (error: any) {
    result.valid = false;
    result.issues.push(`Parse error: ${error.message}`);
  }

  return result;
}

function verifySpells(): VerificationResult {
  const file = 'spells.json';
  const result: VerificationResult = {
    file,
    valid: true,
    itemCount: 0,
    issues: [],
    warnings: [],
  };

  try {
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    result.itemCount = data.length;

    for (const spell of data.slice(0, 50)) { // Sample first 50 for performance
      if (!spell.id) result.issues.push(`Spell missing id: ${spell.name}`);
      if (!spell.name) result.issues.push(`Spell missing name: ${spell.id}`);
      if (!spell.school) result.issues.push(`Spell ${spell.name} missing school`);
      if (!spell.level || typeof spell.level !== 'object') {
        result.issues.push(`Spell ${spell.name} missing/invalid level`);
      }
      if (!spell.components) result.issues.push(`Spell ${spell.name} missing components`);
      if (typeof spell.spellResistance !== 'boolean') {
        result.warnings.push(`Spell ${spell.name} has invalid spellResistance`);
      }
      if (!spell.source || !spell.source.name) {
        result.issues.push(`Spell ${spell.name} missing source`);
      }
    }

    if (data.length < 500) {
      result.warnings.push(`Only ${data.length} spells found, expected more from core rulebook`);
    }

    result.valid = result.issues.length === 0;
  } catch (error: any) {
    result.valid = false;
    result.issues.push(`Parse error: ${error.message}`);
  }

  return result;
}

function verifyEquipment(): VerificationResult {
  const result: VerificationResult = {
    file: 'weapons.json, armor.json, equipment.json',
    valid: true,
    itemCount: 0,
    issues: [],
    warnings: [],
  };

  try {
    // Verify weapons
    const weapons = JSON.parse(fs.readFileSync(path.join(dataDir, 'weapons.json'), 'utf8'));
    result.itemCount += weapons.length;

    for (const weapon of weapons.slice(0, 20)) {
      if (!weapon.id) result.issues.push(`Weapon missing id: ${weapon.name}`);
      if (!weapon.name) result.issues.push(`Weapon missing name`);
      if (weapon.category !== 'weapon') result.issues.push(`Weapon ${weapon.name} has wrong category`);
      if (!weapon.weaponType) result.issues.push(`Weapon ${weapon.name} missing weaponType`);
      if (!weapon.damageMedium) result.issues.push(`Weapon ${weapon.name} missing damageMedium`);
      if (!weapon.critical) result.issues.push(`Weapon ${weapon.name} missing critical`);
      if (!weapon.source || !weapon.source.name) {
        result.issues.push(`Weapon ${weapon.name} missing source`);
      }
    }

    // Verify armor
    const armor = JSON.parse(fs.readFileSync(path.join(dataDir, 'armor.json'), 'utf8'));
    result.itemCount += armor.length;

    for (const piece of armor) {
      if (!piece.id) result.issues.push(`Armor missing id: ${piece.name}`);
      if (!piece.name) result.issues.push(`Armor missing name`);
      if (piece.category !== 'armor') result.issues.push(`Armor ${piece.name} has wrong category`);
      if (!piece.armorType) result.issues.push(`Armor ${piece.name} missing armorType`);
      if (typeof piece.armorBonus !== 'number') result.issues.push(`Armor ${piece.name} missing armorBonus`);
      if (!piece.source || !piece.source.name) {
        result.issues.push(`Armor ${piece.name} missing source`);
      }
    }

    // Check equipment file
    const equipment = JSON.parse(fs.readFileSync(path.join(dataDir, 'equipment.json'), 'utf8'));
    result.itemCount += equipment.length;
    if (equipment.length === 0) {
      result.warnings.push('No general equipment items found (expected from arms/armor file)');
    }

    if (weapons.length < 50) {
      result.warnings.push(`Only ${weapons.length} weapons found, expected more`);
    }
    if (armor.length < 10) {
      result.warnings.push(`Only ${armor.length} armor pieces found, expected more`);
    }

    result.valid = result.issues.length === 0;
  } catch (error: any) {
    result.valid = false;
    result.issues.push(`Parse error: ${error.message}`);
  }

  return result;
}

// Run all verifications
console.log('='.repeat(70));
console.log('PCGen Data Verification Report');
console.log('='.repeat(70));
console.log('');

const results = [
  verifyClasses(),
  verifyRaces(),
  verifyFeats(),
  verifySkills(),
  verifySpells(),
  verifyEquipment(),
];

let totalIssues = 0;
let totalWarnings = 0;

for (const result of results) {
  console.log(`📄 ${result.file}`);
  console.log(`   Items: ${result.itemCount}`);
  console.log(`   Status: ${result.valid ? '✅ VALID' : '❌ INVALID'}`);

  if (result.issues.length > 0) {
    console.log(`   Issues (${result.issues.length}):`);
    result.issues.slice(0, 5).forEach(issue => console.log(`     • ${issue}`));
    if (result.issues.length > 5) {
      console.log(`     ... and ${result.issues.length - 5} more`);
    }
    totalIssues += result.issues.length;
  }

  if (result.warnings.length > 0) {
    console.log(`   Warnings (${result.warnings.length}):`);
    result.warnings.slice(0, 5).forEach(warning => console.log(`     ⚠ ${warning}`));
    if (result.warnings.length > 5) {
      console.log(`     ... and ${result.warnings.length - 5} more`);
    }
    totalWarnings += result.warnings.length;
  }

  console.log('');
}

console.log('='.repeat(70));
console.log(`Summary: ${results.every(r => r.valid) ? '✅ ALL VALID' : '❌ SOME INVALID'}`);
console.log(`Total Items: ${results.reduce((sum, r) => sum + r.itemCount, 0)}`);
console.log(`Total Issues: ${totalIssues}`);
console.log(`Total Warnings: ${totalWarnings}`);
console.log('='.repeat(70));

process.exit(totalIssues > 0 ? 1 : 0);
