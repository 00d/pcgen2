'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { getCharacterById } from '@/redux/slices/characterSlice';
import Link from 'next/link';

export default function CharacterPrintPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const characterId = params.id as string;

  const { currentCharacter: character, isLoading, error } = useAppSelector((state) => state.character);
  const { user } = useAppSelector((state) => state.auth);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'json' | 'markdown'>('pdf');

  useEffect(() => {
    if (characterId && user?.id) {
      dispatch(getCharacterById({ characterId, userId: user.id }) as any);
    }
  }, [characterId, user?.id, dispatch]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    if (!character) return;

    const dataStr = JSON.stringify(character, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${character.name.replace(/\s+/g, '_')}_character.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    if (!character) return;

    const raceName = typeof character.attributes?.race === 'object'
      ? character.attributes.race.name
      : 'No Race';

    const className = character.attributes?.classes?.[0]?.name || 'No Class';
    const classLevel = character.attributes?.classes?.[0]?.level || 1;

    const abilities = character.attributes?.abilityScores || {};
    const getModifier = (ability: string) => {
      const score = abilities[ability as keyof typeof abilities]?.total || 10;
      return Math.floor((score - 10) / 2);
    };

    const hp = character.derivedStats?.hitPoints?.max || 0;
    const ac = character.derivedStats?.armorClass?.total || 10;
    const bab = character.derivedStats?.baseAttackBonus || 0;
    const initiative = character.derivedStats?.initiative || 0;

    const savingThrows = character.derivedStats?.savingThrows || {};

    const markdown = `# ${character.name}

## Character Information
- **Race:** ${raceName}
- **Class:** ${className} (Level ${classLevel})
- **Campaign:** ${character.campaign || 'No Campaign'}
- **Created:** ${new Date(character.createdAt || new Date()).toLocaleDateString()}

---

## Ability Scores
| Ability | Score | Modifier |
|---------|-------|----------|
| Strength (STR) | ${abilities.str?.total || 10} | ${getModifier('str') >= 0 ? '+' : ''}${getModifier('str')} |
| Dexterity (DEX) | ${abilities.dex?.total || 10} | ${getModifier('dex') >= 0 ? '+' : ''}${getModifier('dex')} |
| Constitution (CON) | ${abilities.con?.total || 10} | ${getModifier('con') >= 0 ? '+' : ''}${getModifier('con')} |
| Intelligence (INT) | ${abilities.int?.total || 10} | ${getModifier('int') >= 0 ? '+' : ''}${getModifier('int')} |
| Wisdom (WIS) | ${abilities.wis?.total || 10} | ${getModifier('wis') >= 0 ? '+' : ''}${getModifier('wis')} |
| Charisma (CHA) | ${abilities.cha?.total || 10} | ${getModifier('cha') >= 0 ? '+' : ''}${getModifier('cha')} |

---

## Combat Statistics
- **Hit Points:** ${hp}
- **Armor Class:** ${ac}
- **Base Attack Bonus:** ${bab >= 0 ? '+' : ''}${bab}
- **Initiative:** ${initiative >= 0 ? '+' : ''}${initiative}

### Saving Throws
- **Fortitude:** ${(savingThrows.fortitude || 0) >= 0 ? '+' : ''}${savingThrows.fortitude || 0}
- **Reflex:** ${(savingThrows.reflex || 0) >= 0 ? '+' : ''}${savingThrows.reflex || 0}
- **Will:** ${(savingThrows.will || 0) >= 0 ? '+' : ''}${savingThrows.will || 0}

---

## Skills
${character.skills && character.skills.length > 0
  ? `| Skill | Ability | Ranks | Modifier | Total |
|-------|---------|-------|----------|-------|
${character.skills
  .map(
    (skill) =>
      `| ${skill.skillName} | ${skill.abilityModifier} | ${skill.ranks} | ${skill.abilityModifier >= 0 ? '+' : ''}${skill.abilityModifier} ${skill.isClassSkill ? '+3' : ''} | ${skill.total || 0} |`
  )
  .join('\n')}`
  : 'No skills allocated'}

---

## Feats
${character.feats && character.feats.length > 0
  ? character.feats.map((feat) => `- **${feat.name}** (${feat.type}): ${feat.benefit}`).join('\n')
  : 'No feats selected'}

---

## Equipment
${character.equipment && character.equipment.length > 0
  ? character.equipment
      .map((item) => `- ${item.name} (${item.quantity}x @ ${item.weight} lb${item.weight !== 1 ? 's' : ''})`)
      .join('\n')
  : 'No equipment'}

---

## Spells
${character.spells?.spellsKnown && character.spells.spellsKnown.length > 0
  ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
      .map((level) => {
        const spellsAtLevel = character.spells?.spellsKnown?.filter((s) => s.level === level) || [];
        if (spellsAtLevel.length === 0) return null;
        return `### Level ${level} ${level === 0 ? '(Cantrips)' : 'Spells'}\n${spellsAtLevel.map((s) => `- ${s.name} (${s.school})`).join('\n')}`;
      })
      .filter(Boolean)
      .join('\n\n')
  : 'No spells known'}

---

*Generated on ${new Date().toLocaleString()}*
`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${character.name.replace(/\s+/g, '_')}_character.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    if (!character) return;

    try {
      // Dynamically import html2pdf only when needed
      const html2pdf = (await import('html2pdf.js')).default;

      const element = document.getElementById('print-content');
      if (!element) return;

      const options = {
        margin: 10,
        filename: `${character.name.replace(/\s+/g, '_')}_character.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      };

      html2pdf().set(options).from(element).save();
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading character...</div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-2xl text-red-600 mb-4">Error loading character</div>
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const raceName = typeof character.attributes?.race === 'object'
    ? character.attributes.race.name
    : 'No Race';

  const className = character.attributes?.classes?.[0]?.name || 'No Class';
  const classLevel = character.attributes?.classes?.[0]?.level || 1;

  const abilities = character.attributes?.abilityScores || {};
  const getModifier = (ability: string) => {
    const score = abilities[ability as keyof typeof abilities]?.total || 10;
    return Math.floor((score - 10) / 2);
  };

  const hp = character.derivedStats?.hitPoints?.max || 0;
  const ac = character.derivedStats?.armorClass?.total || 10;
  const bab = character.derivedStats?.baseAttackBonus || 0;
  const initiative = character.derivedStats?.initiative || 0;

  const savingThrows = character.derivedStats?.savingThrows || {};

  return (
    <div className="bg-white">
      {/* Control Bar (Hide on Print) */}
      <div className="print:hidden sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{character.name}</h1>
            <p className="text-blue-100 text-sm">{raceName} {className} L{classLevel}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="bg-white text-blue-600 px-4 py-2 rounded font-medium hover:bg-blue-50 transition-colors"
            >
              🖨️ Print
            </button>
            <button
              onClick={handleExportPDF}
              className="bg-white text-blue-600 px-4 py-2 rounded font-medium hover:bg-blue-50 transition-colors"
            >
              📄 PDF
            </button>
            <button
              onClick={handleExportJSON}
              className="bg-white text-blue-600 px-4 py-2 rounded font-medium hover:bg-blue-50 transition-colors"
            >
              💾 JSON
            </button>
            <button
              onClick={handleExportMarkdown}
              className="bg-white text-blue-600 px-4 py-2 rounded font-medium hover:bg-blue-50 transition-colors"
            >
              📝 Markdown
            </button>
            <Link
              href={`/characters/${character._id}/view`}
              className="bg-white text-blue-600 px-4 py-2 rounded font-medium hover:bg-blue-50 transition-colors"
            >
              ← Back
            </Link>
          </div>
        </div>
      </div>

      {/* Print Content */}
      <div id="print-content" className="print:p-0 p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-gray-800 pb-6">
          <h1 className="text-4xl font-bold text-gray-900">{character.name}</h1>
          <p className="text-xl text-gray-600 mt-2">
            {raceName} {className} (Level {classLevel})
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Campaign: {character.campaign || 'No Campaign'} | Created: {new Date(character.createdAt || new Date()).toLocaleDateString()}
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Left Column: Abilities and Combat */}
          <div>
            {/* Ability Scores */}
            <div className="mb-6">
              <h2 className="text-xl font-bold border-b-2 border-gray-800 mb-3">Ability Scores</h2>
              <div className="space-y-2 text-sm">
                {['str', 'dex', 'con', 'int', 'wis', 'cha'].map((ability) => {
                  const score = abilities[ability as keyof typeof abilities]?.total || 10;
                  const mod = getModifier(ability);
                  const abbr = ability.toUpperCase();
                  return (
                    <div key={ability} className="flex justify-between border-b border-gray-300 pb-1">
                      <span className="font-semibold">{abbr}</span>
                      <span>{score}</span>
                      <span className="font-semibold">({mod >= 0 ? '+' : ''}{mod})</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Combat Stats */}
            <div>
              <h2 className="text-xl font-bold border-b-2 border-gray-800 mb-3">Combat</h2>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span>Hit Points:</span>
                  <span className="font-bold text-lg">{hp}</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span>Armor Class:</span>
                  <span className="font-bold text-lg">{ac}</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span>Base Attack Bonus:</span>
                  <span className="font-bold">{bab >= 0 ? '+' : ''}{bab}</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span>Initiative:</span>
                  <span className="font-bold">{initiative >= 0 ? '+' : ''}{initiative}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Saving Throws and Basic Info */}
          <div>
            {/* Saving Throws */}
            <div className="mb-6">
              <h2 className="text-xl font-bold border-b-2 border-gray-800 mb-3">Saving Throws</h2>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span>Fortitude:</span>
                  <span className="font-bold">{(savingThrows.fortitude || 0) >= 0 ? '+' : ''}{savingThrows.fortitude || 0}</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span>Reflex:</span>
                  <span className="font-bold">{(savingThrows.reflex || 0) >= 0 ? '+' : ''}{savingThrows.reflex || 0}</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span>Will:</span>
                  <span className="font-bold">{(savingThrows.will || 0) >= 0 ? '+' : ''}{savingThrows.will || 0}</span>
                </div>
              </div>
            </div>

            {/* Feats */}
            <div>
              <h2 className="text-xl font-bold border-b-2 border-gray-800 mb-3">Feats</h2>
              {character.feats && character.feats.length > 0 ? (
                <div className="space-y-2 text-sm">
                  {character.feats.map((feat, idx) => (
                    <div key={idx} className="border-b border-gray-300 pb-1">
                      <p className="font-semibold">{feat.name}</p>
                      <p className="text-xs text-gray-600">{feat.benefit}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No feats selected</p>
              )}
            </div>
          </div>
        </div>

        {/* Skills Section */}
        {character.skills && character.skills.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold border-b-2 border-gray-800 mb-3">Skills</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {character.skills.map((skill, idx) => (
                <div key={idx} className="border border-gray-300 p-2 rounded">
                  <p className="font-semibold">{skill.skillName}</p>
                  <p className="text-xs text-gray-600">
                    Ranks: {skill.ranks} | Mod: {skill.abilityModifier >= 0 ? '+' : ''}
                    {skill.abilityModifier} {skill.isClassSkill ? '| Class Skill: +3' : ''}
                  </p>
                  <p className="font-bold text-center mt-1">Total: {skill.total || 0}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Equipment Section */}
        {character.equipment && character.equipment.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold border-b-2 border-gray-800 mb-3">Equipment</h2>
            <div className="text-sm">
              {character.equipment.map((item, idx) => (
                <div key={idx} className="flex justify-between border-b border-gray-300 py-1">
                  <span>{item.name}</span>
                  <span className="font-mono">
                    {item.quantity}x @ {item.weight} lb{item.weight !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
              <div className="flex justify-between font-bold mt-2 pt-2 border-t-2 border-gray-800">
                <span>Total Weight</span>
                <span className="font-mono">
                  {character.equipment.reduce((sum, item) => sum + (item.weight * (item.quantity || 1)), 0)} lbs
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Spells Section */}
        {character.spells?.spellsKnown && character.spells.spellsKnown.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold border-b-2 border-gray-800 mb-3">Spells</h2>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => {
              const spellsAtLevel = character.spells?.spellsKnown?.filter((s) => s.level === level) || [];
              if (spellsAtLevel.length === 0) return null;
              return (
                <div key={level} className="mb-4">
                  <h3 className="font-bold text-sm border-b border-gray-600 mb-2">
                    Level {level} {level === 0 ? '(Cantrips)' : ''}
                  </h3>
                  <div className="text-sm space-y-1">
                    {spellsAtLevel.map((spell, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{spell.name}</span>
                        <span className="text-gray-600 text-xs">{spell.school}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-600 border-t-2 border-gray-800 pt-4 mt-8">
          <p>Generated on {new Date().toLocaleString()}</p>
          <p>Pathfinder Character Sheet - PCGen 2.0</p>
        </div>
      </div>
    </div>
  );
}
