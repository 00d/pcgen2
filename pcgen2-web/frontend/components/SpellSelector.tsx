'use client';

import { useState } from 'react';
import { Spell as SpellType } from '../types/gameRules';
import { SpellSelection } from '../types/character';

interface Props {
  spells: SpellType[];
  selectedSpells: SpellSelection[];
  maxSpellsPerLevel: Record<number, number>;
  onSpellsChange: (spells: SpellSelection[]) => void;
}

export default function SpellSelector({
  spells,
  selectedSpells,
  maxSpellsPerLevel,
  onSpellsChange,
}: Props) {
  const [expandedSpellId, setExpandedSpellId] = useState<string | null>(null);

  // Group spells by level
  const spellsByLevel = spells.reduce(
    (acc, spell) => {
      const level = spell.data.level;
      if (!acc[level]) acc[level] = [];
      acc[level].push(spell);
      return acc;
    },
    {} as Record<number, SpellType[]>
  );

  const isSelected = (spellId: string): boolean =>
    selectedSpells.some((s) => s.spellId === spellId);

  const handleSpellToggle = (spell: SpellType) => {
    const selected = isSelected(spell.id);
    const spellLevel = spell.data.level;
    const selectedAtLevel = selectedSpells.filter((s) => {
      const spell = spells.find((sp) => sp.id === s.spellId);
      return spell?.data.level === spellLevel;
    }).length;

    if (!selected && selectedAtLevel >= (maxSpellsPerLevel[spellLevel] || 0)) {
      return; // Can't add more spells at this level
    }

    if (selected) {
      onSpellsChange(selectedSpells.filter((s) => s.spellId !== spell.id));
    } else {
      onSpellsChange([
        ...selectedSpells,
        {
          spellId: spell.id,
          name: spell.name,
          level: spell.data.level,
          school: spell.data.school,
          prepared: false,
          known: true,
        },
      ]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="bg-blue-50 p-4 rounded border border-blue-200">
        <p className="text-sm font-bold mb-2">Spell Selection</p>
        <div className="space-y-1 text-sm">
          {Object.entries(maxSpellsPerLevel).map(([level, max]) => {
            const selected = selectedSpells.filter(
              (s) => s.level === parseInt(level)
            ).length;
            return (
              <p key={level}>
                Level {level}: {selected}/{max}
              </p>
            );
          })}
        </div>
      </div>

      {/* Spells by Level */}
      {Object.entries(spellsByLevel)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([level, levelSpells]) => {
          const levelNum = parseInt(level);
          const maxAtLevel = maxSpellsPerLevel[levelNum] || 0;
          const selectedAtLevel = selectedSpells.filter((s) => s.level === levelNum).length;
          const canSelectMore = selectedAtLevel < maxAtLevel;

          return (
            <div key={level}>
              <h3 className="font-bold text-lg mb-3 uppercase text-gray-700">
                Level {level} Spells
                {levelNum === 0 ? ' (Cantrips - Unlimited)' : `  (${selectedAtLevel}/${maxAtLevel})`}
              </h3>

              <div className="space-y-2">
                {levelSpells.map((spell) => {
                  const selected = isSelected(spell.id);
                  const expanded = expandedSpellId === spell.id;

                  return (
                    <div
                      key={spell.id}
                      className={`border rounded overflow-hidden transition-all ${
                        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center p-3">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => handleSpellToggle(spell)}
                          disabled={!selected && !canSelectMore && levelNum !== 0}
                          className="mr-3"
                        />

                        <div className="flex-1">
                          <button
                            onClick={() =>
                              setExpandedSpellId(expanded ? null : spell.id)
                            }
                            className="font-bold text-left hover:text-blue-600 flex items-center gap-2"
                          >
                            {spell.name}
                            <span className="text-xs text-gray-500">({spell.data.school})</span>
                            <span className="ml-auto text-gray-400">
                              {expanded ? '▼' : '▶'}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expanded && (
                        <div className="border-t p-3 bg-gray-50 text-sm space-y-2">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-gray-600">School</p>
                              <p className="font-bold">{spell.data.school}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Casting Time</p>
                              <p className="font-bold">{spell.data.castingTime}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Range</p>
                              <p className="font-bold">{spell.data.range}</p>
                            </div>
                            {spell.data.descriptor && spell.data.descriptor.length > 0 && (
                              <div>
                                <p className="text-gray-600">Descriptor</p>
                                <p className="font-bold">{spell.data.descriptor.join(', ')}</p>
                              </div>
                            )}
                          </div>

                          <div className="border-t pt-2 mt-2">
                            <p className="font-bold text-gray-700 mb-1">Description</p>
                            <p className="text-gray-600">{spell.data.description}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedAtLevel === maxAtLevel && maxAtLevel > 0 && levelNum !== 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  Maximum spells selected for this level
                </div>
              )}
            </div>
          );
        })}

      {selectedSpells.length === 0 && (
        <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-sm text-yellow-800">
          Select at least one spell to continue.
        </div>
      )}
    </div>
  );
}
