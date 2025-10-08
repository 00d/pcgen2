/**
 * Phase 5: Character Export Service
 * Handles character sheet export to JSON, PDF, and HTML formats
 */

import { Character as CharacterType } from '../types/character';

interface ExportOptions {
  includeEquipment?: boolean;
  includeSpells?: boolean;
  includeNotes?: boolean;
  includeHistory?: boolean;
  format?: 'json' | 'html' | 'pdf';
}

interface CharacterExport {
  name: string;
  race: string;
  class: string;
  level: number;
  experience: number;
  alignment: string;
  deity: string;
  description: string;
  notes: string;
  abilityScores: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  skills: Array<{
    name: string;
    rank: number;
    modifier: number;
  }>;
  feats: string[];
  equipment?: Array<{
    name: string;
    type: string;
    weight: number;
    quantity: number;
    equipped: boolean;
  }>;
  spells?: {
    known: Array<{
      name: string;
      level: number;
      school: string;
    }>;
    slots: Array<{
      level: number;
      used: number;
      total: number;
    }>;
  };
  hitPoints: {
    current: number;
    maximum: number;
  };
  armorClass: {
    total: number;
    base: number;
    armor: number;
    shield: number;
    dex: number;
    misc: number;
  };
  savingThrows: {
    fortitude: number;
    reflex: number;
    will: number;
  };
  baseAttackBonus: number;
  createdAt: string;
  updatedAt: string;
}

export class ExportService {
  /**
   * Format character data for export
   */
  formatCharacterForExport(character: CharacterType, options: ExportOptions = {}): CharacterExport {
    const charData = character as any;
    const abilityScores = charData.attributes?.abilityScores || {};
    const derivedStats = charData.derivedStats || {};
    const skills = charData.attributes?.skills || [];
    const equipment = charData.equipment || [];
    const spells = charData.spells || {};

    const formattedAbilities = {
      str: abilityScores.str?.total || 10,
      dex: abilityScores.dex?.total || 10,
      con: abilityScores.con?.total || 10,
      int: abilityScores.int?.total || 10,
      wis: abilityScores.wis?.total || 10,
      cha: abilityScores.cha?.total || 10,
    };

    const createdAtStr = charData.createdAt
      ? (typeof charData.createdAt === 'string' ? charData.createdAt : charData.createdAt.toISOString())
      : new Date().toISOString();

    const updatedAtStr = charData.updatedAt
      ? (typeof charData.updatedAt === 'string' ? charData.updatedAt : charData.updatedAt.toISOString())
      : new Date().toISOString();

    const baseExport: CharacterExport = {
      name: character.name || 'Unnamed Character',
      race: charData.race || 'Unknown',
      class: charData.class || 'Unknown',
      level: derivedStats.totalLevel || 1,
      experience: charData.experience || 0,
      alignment: charData.alignment || 'Neutral',
      deity: charData.deity || 'None',
      description: charData.description || '',
      notes: charData.notes || '',
      abilityScores: formattedAbilities,
      skills: skills.map((skill: any) => ({
        name: skill.name,
        rank: skill.rank || 0,
        modifier: skill.modifier || 0,
      })),
      feats: charData.attributes?.feats || [],
      hitPoints: {
        current: charData.hitPoints?.current || derivedStats.maxHitPoints || 1,
        maximum: derivedStats.maxHitPoints || 1,
      },
      armorClass: {
        total: derivedStats.armorClass?.total || 10,
        base: 10,
        armor: 0,
        shield: 0,
        dex: (formattedAbilities.dex - 10) / 2,
        misc: 0,
      },
      savingThrows: {
        fortitude: derivedStats.savingThrows?.fortitude || 0,
        reflex: derivedStats.savingThrows?.reflex || 0,
        will: derivedStats.savingThrows?.will || 0,
      },
      baseAttackBonus: derivedStats.baseAttackBonus || 0,
      createdAt: createdAtStr,
      updatedAt: updatedAtStr,
    };

    // Add optional fields
    if (options.includeEquipment && equipment.length > 0) {
      baseExport.equipment = equipment.map((item: any) => ({
        name: item.name || item.id,
        type: item.type,
        weight: item.weight || 0,
        quantity: item.quantity || 1,
        equipped: item.equipped || false,
      }));
    }

    if (options.includeSpells && spells.spellsKnown) {
      baseExport.spells = {
        known: (spells.spellsKnown || []).map((spell: any) => ({
          name: spell.name,
          level: spell.level || 0,
          school: spell.school || 'Unknown',
        })),
        slots: (spells.spellSlots || []).map((slot: any) => ({
          level: slot.level || 0,
          used: slot.used || 0,
          total: slot.perDay || 0,
        })),
      };
    }

    return baseExport;
  }

  /**
   * Export character as JSON
   */
  exportAsJSON(character: CharacterType, options: ExportOptions = {}): string {
    const exported = this.formatCharacterForExport(character, {
      includeEquipment: true,
      includeSpells: true,
      ...options,
    });

    return JSON.stringify(exported, null, 2);
  }

  /**
   * Export character as HTML
   */
  exportAsHTML(character: CharacterType, options: ExportOptions = {}): string {
    const exported = this.formatCharacterForExport(character, {
      includeEquipment: true,
      includeSpells: true,
      ...options,
    });

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${exported.name} - Character Sheet</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .character-sheet {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            border-bottom: 3px solid #333;
            margin-bottom: 20px;
            padding-bottom: 15px;
        }
        h1 {
            margin: 0;
            color: #333;
        }
        .character-info {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .info-row {
            display: grid;
            grid-template-columns: 100px 1fr;
        }
        .info-label {
            font-weight: bold;
            color: #666;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            background: #f0f0f0;
            padding: 10px;
            font-weight: bold;
            margin-bottom: 10px;
            border-left: 4px solid #333;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #f9f9f9;
            font-weight: bold;
        }
        .ability-scores {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
        }
        .ability-box {
            border: 2px solid #999;
            padding: 15px;
            text-align: center;
            border-radius: 4px;
        }
        .ability-name {
            font-weight: bold;
            font-size: 12px;
            color: #666;
        }
        .ability-score {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .ability-mod {
            font-size: 12px;
            color: #666;
        }
        .grid-2 {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        .combat-box {
            border: 2px solid #666;
            padding: 15px;
            border-radius: 4px;
        }
        .combat-label {
            font-size: 12px;
            color: #666;
        }
        .combat-value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="character-sheet">
        <div class="header">
            <h1>${exported.name}</h1>
            <div class="character-info">
                <div class="info-row">
                    <span class="info-label">Race:</span>
                    <span>${exported.race}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Alignment:</span>
                    <span>${exported.alignment}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Class:</span>
                    <span>${exported.class}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Deity:</span>
                    <span>${exported.deity}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Level:</span>
                    <span>${exported.level}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Experience:</span>
                    <span>${exported.experience}</span>
                </div>
            </div>
        </div>

        <!-- Ability Scores -->
        <div class="section">
            <div class="section-title">Ability Scores</div>
            <div class="ability-scores">
                <div class="ability-box">
                    <div class="ability-name">STR</div>
                    <div class="ability-score">${exported.abilityScores.str}</div>
                    <div class="ability-mod">${this.formatModifier(Math.floor((exported.abilityScores.str - 10) / 2))}</div>
                </div>
                <div class="ability-box">
                    <div class="ability-name">DEX</div>
                    <div class="ability-score">${exported.abilityScores.dex}</div>
                    <div class="ability-mod">${this.formatModifier(Math.floor((exported.abilityScores.dex - 10) / 2))}</div>
                </div>
                <div class="ability-box">
                    <div class="ability-name">CON</div>
                    <div class="ability-score">${exported.abilityScores.con}</div>
                    <div class="ability-mod">${this.formatModifier(Math.floor((exported.abilityScores.con - 10) / 2))}</div>
                </div>
                <div class="ability-box">
                    <div class="ability-name">INT</div>
                    <div class="ability-score">${exported.abilityScores.int}</div>
                    <div class="ability-mod">${this.formatModifier(Math.floor((exported.abilityScores.int - 10) / 2))}</div>
                </div>
                <div class="ability-box">
                    <div class="ability-name">WIS</div>
                    <div class="ability-score">${exported.abilityScores.wis}</div>
                    <div class="ability-mod">${this.formatModifier(Math.floor((exported.abilityScores.wis - 10) / 2))}</div>
                </div>
                <div class="ability-box">
                    <div class="ability-name">CHA</div>
                    <div class="ability-score">${exported.abilityScores.cha}</div>
                    <div class="ability-mod">${this.formatModifier(Math.floor((exported.abilityScores.cha - 10) / 2))}</div>
                </div>
            </div>
        </div>

        <!-- Combat Stats -->
        <div class="section">
            <div class="section-title">Combat Statistics</div>
            <div class="grid-2">
                <div class="combat-box">
                    <div class="combat-label">Hit Points</div>
                    <div class="combat-value">${exported.hitPoints.current}/${exported.hitPoints.maximum}</div>
                </div>
                <div class="combat-box">
                    <div class="combat-label">Armor Class</div>
                    <div class="combat-value">${exported.armorClass.total}</div>
                </div>
                <div class="combat-box">
                    <div class="combat-label">Base Attack Bonus</div>
                    <div class="combat-value">${this.formatModifier(exported.baseAttackBonus)}</div>
                </div>
                <div class="combat-box">
                    <div class="combat-label">Initiative</div>
                    <div class="combat-value">${this.formatModifier(Math.floor((exported.abilityScores.dex - 10) / 2))}</div>
                </div>
            </div>
        </div>

        <!-- Saving Throws -->
        <div class="section">
            <div class="section-title">Saving Throws</div>
            <div class="grid-2">
                <div><strong>Fortitude:</strong> ${this.formatModifier(exported.savingThrows.fortitude)}</div>
                <div><strong>Reflex:</strong> ${this.formatModifier(exported.savingThrows.reflex)}</div>
                <div colspan="2"><strong>Will:</strong> ${this.formatModifier(exported.savingThrows.will)}</div>
            </div>
        </div>

        <!-- Feats -->
        ${exported.feats && exported.feats.length > 0 ? `
        <div class="section">
            <div class="section-title">Feats</div>
            <ul>
                ${exported.feats.map((feat: string) => `<li>${feat}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        <!-- Skills -->
        ${exported.skills && exported.skills.length > 0 ? `
        <div class="section">
            <div class="section-title">Skills</div>
            <table>
                <thead>
                    <tr>
                        <th>Skill</th>
                        <th>Rank</th>
                        <th>Modifier</th>
                    </tr>
                </thead>
                <tbody>
                    ${exported.skills.map((skill: any) => `
                    <tr>
                        <td>${skill.name}</td>
                        <td>${skill.rank}</td>
                        <td>${this.formatModifier(skill.modifier)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <!-- Equipment -->
        ${exported.equipment && exported.equipment.length > 0 ? `
        <div class="section">
            <div class="section-title">Equipment</div>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Weight</th>
                        <th>Qty</th>
                        <th>Equipped</th>
                    </tr>
                </thead>
                <tbody>
                    ${exported.equipment.map((item: any) => `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.type}</td>
                        <td>${item.weight}</td>
                        <td>${item.quantity}</td>
                        <td>${item.equipped ? 'Yes' : 'No'}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <!-- Spells -->
        ${exported.spells && exported.spells.known && exported.spells.known.length > 0 ? `
        <div class="section">
            <div class="section-title">Spells Known</div>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Level</th>
                        <th>School</th>
                    </tr>
                </thead>
                <tbody>
                    ${exported.spells.known.map((spell: any) => `
                    <tr>
                        <td>${spell.name}</td>
                        <td>${spell.level}</td>
                        <td>${spell.school}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <!-- Notes -->
        ${exported.notes ? `
        <div class="section">
            <div class="section-title">Notes</div>
            <p>${exported.notes.replace(/\n/g, '<br>')}</p>
        </div>
        ` : ''}

        <div class="footer">
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
    `;

    return html;
  }

  /**
   * Format numeric modifier for display
   */
  private formatModifier(modifier: number): string {
    if (modifier > 0) {
      return `+${modifier}`;
    }
    return `${modifier}`;
  }

  /**
   * Validate character can be exported
   */
  validateCharacterForExport(character: CharacterType): { valid: boolean; error?: string } {
    const charData = character as any;

    if (!character || !character.name) {
      return { valid: false, error: 'Character must have a name' };
    }

    if (!charData.class) {
      return { valid: false, error: 'Character must have a class' };
    }

    return { valid: true };
  }

  /**
   * Generate filename for export
   */
  generateFilename(character: CharacterType, format: 'json' | 'html' | 'pdf'): string {
    const sanitizedName = character.name?.replace(/[^a-zA-Z0-9-_]/g, '_') || 'character';
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = format === 'html' ? 'html' : format === 'pdf' ? 'pdf' : 'json';
    return `${sanitizedName}-${timestamp}.${extension}`;
  }
}

export default new ExportService();
