/**
 * Equipment LST file parser
 * Converts equipment LST files to JSON (weapons, armor, general equipment)
 */

import * as fs from 'fs';
import type { PF1EWeapon, PF1EArmor, PF1EEquipment } from '../../../types/pathfinder1e';
import { LSTParser, tokenValueToString, tokenValueToArray } from '../parser';
import type { LSTFile } from '../types';

export class EquipmentParser {
  private parser: LSTParser;

  constructor() {
    this.parser = new LSTParser({
      verbose: false,
      skipComments: true,
      skipBlankLines: true,
    });
  }

  /**
   * Parse an equipment LST file and categorize into weapons, armor, and general items
   */
  parseEquipmentFile(filePath: string): {
    weapons: PF1EWeapon[];
    armor: PF1EArmor[];
    equipment: PF1EEquipment[];
  } {
    const lstFile = this.parser.parseLSTFile(filePath);
    const weapons: PF1EWeapon[] = [];
    const armor: PF1EArmor[] = [];
    const equipment: PF1EEquipment[] = [];

    // First pass: Build base item map
    const baseItems = new Map<string, any>();
    for (const line of lstFile.lines) {
      if (line.tokens.length === 0) continue;
      const firstToken = line.tokens[0];
      if (firstToken.key.includes('.MOD') || firstToken.key.includes('.COPY=')) continue;
      if (firstToken.key.includes('SOURCE')) continue;

      const tokenMap = this.parser.extractTokensFromLines([line]);
      const keyToken = tokenMap.get('KEY')?.[0];
      if (keyToken) {
        const key = tokenValueToString(keyToken.value);
        baseItems.set(key, { line, tokenMap });
      }
    }

    // Second pass: Process items (including .COPY= entries)
    for (const line of lstFile.lines) {
      if (line.tokens.length === 0) continue;

      const firstToken = line.tokens[0];

      // Skip continuation lines, .MOD, SOURCE
      if (firstToken.key.match(/^\d+$/)) continue;
      if (firstToken.key.includes('.MOD')) continue;
      if (firstToken.key.includes('SOURCE')) continue;

      // Handle .COPY= entries
      let itemName = firstToken.key;
      let tokenMap = this.parser.extractTokensFromLines([line]);

      if (firstToken.key.includes('.COPY=')) {
        const parts = firstToken.key.split('.COPY=');
        itemName = parts[1];

        // Get base item data
        const baseItemToken = tokenMap.get('BASEITEM')?.[0];
        if (baseItemToken) {
          const baseKey = tokenValueToString(baseItemToken.value);
          const baseData = baseItems.get(baseKey);
          if (baseData) {
            // Merge base item tokens with current item tokens (current overrides base)
            const baseTokenMap = baseData.tokenMap as Map<string, any[]>;
            const mergedTokenMap = new Map<string, any[]>(baseTokenMap);
            for (const [key, tokens] of tokenMap) {
              mergedTokenMap.set(key, tokens);
            }
            tokenMap = mergedTokenMap;
          }
        }
      }

      const typeToken = tokenMap.get('TYPE')?.[0];
      const typeStr = typeToken ? tokenValueToString(typeToken.value) : '';

      // Skip base items (VISIBLE:NO) unless overridden
      const visibleToken = tokenMap.get('VISIBLE')?.[0];
      if (visibleToken && tokenValueToString(visibleToken.value) === 'NO') continue;

      // Categorize by type
      if (typeStr.includes('Weapon')) {
        const weapon = this.parseWeaponFromTokens(itemName, tokenMap, lstFile);
        if (weapon) weapons.push(weapon);
      } else if (typeStr.includes('Armor') || typeStr.includes('Shield')) {
        const armorItem = this.parseArmorFromTokens(itemName, tokenMap, lstFile);
        if (armorItem) armor.push(armorItem);
      } else if (typeStr.includes('Goods') || typeStr.includes('Equipment')) {
        const equipItem = this.parseGeneralEquipmentFromTokens(itemName, tokenMap, lstFile);
        if (equipItem) equipment.push(equipItem);
      }
    }

    return { weapons, armor, equipment };
  }

  /**
   * Parse a weapon from token map
   */
  private parseWeaponFromTokens(
    itemName: string,
    tokenMap: Map<string, any[]>,
    lstFile: LSTFile
  ): PF1EWeapon | null {

    // Extract type info
    const typeToken = tokenMap.get('TYPE')?.[0];
    const typeStr = typeToken ? tokenValueToString(typeToken.value) : '';
    const types = typeStr.split('.');

    // Determine weapon type (proficiency level)
    let weaponType: 'simple' | 'martial' | 'exotic' = 'simple';
    if (types.includes('Martial')) weaponType = 'martial';
    if (types.includes('Exotic')) weaponType = 'exotic';

    // Determine damage type
    const damageTypes: string[] = [];
    if (types.includes('Bludgeoning')) damageTypes.push('bludgeoning');
    if (types.includes('Piercing')) damageTypes.push('piercing');
    if (types.includes('Slashing')) damageTypes.push('slashing');

    // Extract cost and weight
    const costToken = tokenMap.get('COST')?.[0];
    const cost = costToken ? parseFloat(tokenValueToString(costToken.value)) : 0;

    const weightToken = tokenMap.get('WT')?.[0];
    const weight = weightToken ? parseFloat(tokenValueToString(weightToken.value)) : 0;

    // Extract damage for medium size (most common)
    const damageToken = tokenMap.get('DAMAGE')?.[0];
    const damageMedium = damageToken ? tokenValueToString(damageToken.value) : '1d4';

    // For simplicity, use medium damage for small as well (could parse DAMAGE formula for proper scaling)
    const damageSmall = damageMedium;

    // Extract critical
    const critMultToken = tokenMap.get('CRITMULT')?.[0];
    const critRangeToken = tokenMap.get('CRITRANGE')?.[0];
    const critMult = critMultToken
      ? tokenValueToString(critMultToken.value).replace('x', '')
      : '2';
    const critRange = critRangeToken ? parseInt(tokenValueToString(critRangeToken.value), 10) : 1;

    const critical = critRange > 1 ? `${20 - critRange + 1}-20/x${critMult}` : `x${critMult}`;

    // Extract range (for ranged weapons)
    const rangeToken = tokenMap.get('RANGE')?.[0];
    const range = rangeToken ? parseInt(tokenValueToString(rangeToken.value), 10) : undefined;

    // Extract description
    const descToken = tokenMap.get('DESC')?.[0];
    const description = descToken ? this.cleanDescription(tokenValueToString(descToken.value)) : '';

    // Extract source page
    const sourcePageToken = tokenMap.get('SOURCEPAGE')?.[0];
    const sourcePage = sourcePageToken ? tokenValueToString(sourcePageToken.value) : '';

    // Generate ID
    const id = itemName.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');

    return {
      id,
      name: itemName,
      category: 'weapon' as const,
      weaponType,
      cost,
      weight,
      damageSmall,
      damageMedium,
      critical,
      range,
      damageType: damageTypes.length > 0 ? damageTypes : ['bludgeoning'],
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
   * Parse armor from token map
   */
  private parseArmorFromTokens(
    itemName: string,
    tokenMap: Map<string, any[]>,
    lstFile: LSTFile
  ): PF1EArmor | null {

    // Extract type info
    const typeToken = tokenMap.get('TYPE')?.[0];
    const typeStr = typeToken ? tokenValueToString(typeToken.value) : '';
    const types = typeStr.split('.');

    // Determine armor type
    let armorType: 'light' | 'medium' | 'heavy' | 'shield' = 'light';
    if (types.includes('Medium')) armorType = 'medium';
    else if (types.includes('Heavy')) armorType = 'heavy';
    else if (types.includes('Shield')) armorType = 'shield';

    // Extract cost and weight
    const costToken = tokenMap.get('COST')?.[0];
    const cost = costToken ? parseFloat(tokenValueToString(costToken.value)) : 0;

    const weightToken = tokenMap.get('WT')?.[0];
    const weight = weightToken ? parseFloat(tokenValueToString(weightToken.value)) : 0;

    // Extract AC bonus - from BONUS:COMBAT|AC token
    let acBonus = 0;
    const bonusTokens = tokenMap.get('BONUS') || [];
    for (const token of bonusTokens) {
      const values = tokenValueToArray(token.value);
      if (values.length >= 3 && values[0] === 'COMBAT' && values[1] === 'AC') {
        acBonus = parseInt(values[2], 10) || 0;
        break;
      }
    }

    // Extract AC check penalty
    const acCheckToken = tokenMap.get('ACCHECK')?.[0];
    const armorCheckPenalty = acCheckToken
      ? parseInt(tokenValueToString(acCheckToken.value), 10)
      : 0;

    // Extract max dex bonus
    const maxDexToken = tokenMap.get('MAXDEX')?.[0];
    const maxDexBonus = maxDexToken ? parseInt(tokenValueToString(maxDexToken.value), 10) : null;

    // Extract spell failure
    const spellFailToken = tokenMap.get('SPELLFAILURE')?.[0];
    const spellFailure = spellFailToken
      ? parseInt(tokenValueToString(spellFailToken.value), 10)
      : 0;

    // Extract speed modifiers (default to 30/20 for no speed reduction)
    // TODO: Parse MOVE tokens if present
    const speed30 = armorType === 'heavy' ? 20 : 30;
    const speed20 = armorType === 'heavy' ? 15 : 20;

    // Extract description
    const descToken = tokenMap.get('DESC')?.[0];
    const description = descToken ? this.cleanDescription(tokenValueToString(descToken.value)) : '';

    // Extract source page
    const sourcePageToken = tokenMap.get('SOURCEPAGE')?.[0];
    const sourcePage = sourcePageToken ? tokenValueToString(sourcePageToken.value) : '';

    // Generate ID
    const id = itemName.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');

    return {
      id,
      name: itemName,
      category: 'armor' as const,
      armorType,
      cost,
      weight,
      armorBonus: acBonus,
      maxDexBonus,
      armorCheckPenalty,
      arcaneSpellFailure: spellFailure,
      speed30,
      speed20,
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
   * Parse general equipment from token map
   */
  private parseGeneralEquipmentFromTokens(
    itemName: string,
    tokenMap: Map<string, any[]>,
    lstFile: LSTFile
  ): PF1EEquipment | null {

    // Extract cost and weight
    const costToken = tokenMap.get('COST')?.[0];
    const cost = costToken ? parseFloat(tokenValueToString(costToken.value)) : 0;

    const weightToken = tokenMap.get('WT')?.[0];
    const weight = weightToken ? parseFloat(tokenValueToString(weightToken.value)) : 0;

    // Extract description
    const descToken = tokenMap.get('DESC')?.[0];
    const description = descToken ? this.cleanDescription(tokenValueToString(descToken.value)) : '';

    // Extract source page
    const sourcePageToken = tokenMap.get('SOURCEPAGE')?.[0];
    const sourcePage = sourcePageToken ? tokenValueToString(sourcePageToken.value) : '';

    // Generate ID
    const id = itemName.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');

    return {
      id,
      name: itemName,
      category: 'goods' as const,
      cost,
      weight,
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
   * Clean up description text
   */
  private cleanDescription(desc: string): string {
    return desc.replace(/&nl;/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

// CLI execution
if (require.main === module) {
  const equipmentParser = new EquipmentParser();
  const pathfinderEquipPath =
    process.argv[2] ||
    '../data/pathfinder/paizo/roleplaying_game/core_rulebook/cr_equip_arms_armor.lst';

  try {
    console.log(`Parsing equipment from: ${pathfinderEquipPath}`);
    const { weapons, armor, equipment } = equipmentParser.parseEquipmentFile(pathfinderEquipPath);

    console.log(`\nParsed ${weapons.length} weapons:`);
    weapons.slice(0, 5).forEach((weapon) => {
      console.log(
        `  - ${weapon.name} (${weapon.weaponType}): ${weapon.damageMedium}, ${weapon.critical}`
      );
    });

    console.log(`\nParsed ${armor.length} armor pieces:`);
    armor.slice(0, 5).forEach((armorItem) => {
      console.log(
        `  - ${armorItem.name} (${armorItem.armorType}): AC +${armorItem.armorBonus}, Max Dex ${armorItem.maxDexBonus}`
      );
    });

    console.log(`\nParsed ${equipment.length} general equipment items`);

    // Output JSON
    const weaponsPath = process.argv[3] || './weapons.json';
    const armorPath = process.argv[4] || './armor.json';
    const equipPath = process.argv[5] || './equipment.json';

    fs.writeFileSync(weaponsPath, JSON.stringify(weapons, null, 2));
    fs.writeFileSync(armorPath, JSON.stringify(armor, null, 2));
    fs.writeFileSync(equipPath, JSON.stringify(equipment, null, 2));

    console.log(`\nOutput written to: ${weaponsPath}, ${armorPath}, ${equipPath}`);
  } catch (error) {
    console.error('Error parsing equipment:', error);
    process.exit(1);
  }
}
