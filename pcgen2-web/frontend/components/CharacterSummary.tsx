'use client';

import { Character } from '../types/character';

interface Props {
  character: Character;
  onEditSection?: (section: string) => void;
}

const getModifier = (score: number): number => {
  return Math.floor((score - 10) / 2);
};

export default function CharacterSummary({ character, onEditSection }: Props) {
  if (!character) {
    return <div className="text-center text-gray-500">No character data available</div>;
  }

  const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const abilityNames: Record<string, string> = {
    str: 'STR',
    dex: 'DEX',
    con: 'CON',
    int: 'INT',
    wis: 'WIS',
    cha: 'CHA',
  };

  const race = character.attributes.race;
  const mainClass = character.attributes.classes?.[0];
  const totalWeight = (character.equipment || []).reduce(
    (sum, item) => sum + item.weight * item.quantity,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">{character.name}</h1>
        <p className="text-lg opacity-90">{character.campaign}</p>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 bg-white">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">Race & Class</h3>
            {onEditSection && (
              <button
                onClick={() => onEditSection('race')}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            )}
          </div>
          <div className="space-y-2 text-sm">
            {race && (
              <div>
                <span className="text-gray-600">Race:</span>
                <p className="font-bold">{race.name}</p>
              </div>
            )}
            {mainClass && (
              <div>
                <span className="text-gray-600">Class:</span>
                <p className="font-bold">{mainClass.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        {character.derivedStats && (
          <div className="border rounded-lg p-4 bg-white">
            <h3 className="font-bold text-lg mb-3">Core Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Hit Points:</span>
                <span className="font-bold">
                  {character.derivedStats.hitPoints?.current}/{character.derivedStats.hitPoints?.max}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Armor Class:</span>
                <span className="font-bold">{character.derivedStats.armorClass?.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">BAB:</span>
                <span className="font-bold">+{character.derivedStats.baseAttackBonus}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ability Scores */}
      <div className="border rounded-lg p-4 bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Ability Scores</h3>
          {onEditSection && (
            <button
              onClick={() => onEditSection('abilities')}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {abilities.map((ability) => {
            const abilityData = character.attributes.abilityScores?.[ability as keyof typeof character.attributes.abilityScores];
            if (!abilityData) return null;

            const total = abilityData.total || abilityData.base;
            const modifier = getModifier(total);

            return (
              <div key={ability} className="border rounded p-3 bg-blue-50 text-center">
                <div className="font-bold uppercase text-sm mb-2">{abilityNames[ability]}</div>
                <div className="text-2xl font-bold text-blue-600 mb-1">{total}</div>
                <div className="text-sm text-gray-600">
                  {modifier >= 0 ? '+' : ''}{modifier}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feats */}
      {character.feats && character.feats.length > 0 && (
        <div className="border rounded-lg p-4 bg-white">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">Feats ({character.feats.length})</h3>
            {onEditSection && (
              <button
                onClick={() => onEditSection('feats')}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            )}
          </div>
          <ul className="space-y-2">
            {character.feats.map((feat, idx) => (
              <li key={idx} className="text-sm p-2 bg-gray-50 rounded">
                <span className="font-bold">{feat.name}</span>
                {feat.type && <span className="text-xs text-gray-500 ml-2">({feat.type})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Skills */}
      {character.skills && character.skills.length > 0 && (
        <div className="border rounded-lg p-4 bg-white">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">Skills ({character.skills.length})</h3>
            {onEditSection && (
              <button
                onClick={() => onEditSection('skills')}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            )}
          </div>
          <div className="space-y-1 text-sm">
            {character.skills.map((skill, idx) => (
              <div key={idx} className="flex justify-between p-1">
                <span>{skill.skillName}</span>
                <span className="font-bold">
                  {skill.total >= 0 ? '+' : ''}{skill.total} ({skill.ranks} ranks)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equipment */}
      {character.equipment && character.equipment.length > 0 && (
        <div className="border rounded-lg p-4 bg-white">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">Equipment</h3>
            {onEditSection && (
              <button
                onClick={() => onEditSection('equipment')}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            )}
          </div>
          <div className="space-y-2 text-sm">
            {character.equipment.map((item, idx) => (
              <div key={idx} className="flex justify-between p-2 bg-gray-50 rounded">
                <span>
                  {item.name} {item.quantity > 1 ? `x${item.quantity}` : ''}
                </span>
                <span className="text-gray-600">{item.weight * item.quantity} lbs</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 font-bold flex justify-between">
              <span>Total Weight:</span>
              <span>{totalWeight} lbs</span>
            </div>
          </div>
        </div>
      )}

      {/* Spells */}
      {character.spells && character.spells.length > 0 && (
        <div className="border rounded-lg p-4 bg-white">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">Spells ({character.spells.length})</h3>
            {onEditSection && (
              <button
                onClick={() => onEditSection('spells')}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            )}
          </div>
          <div className="space-y-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => {
              const spellsAtLevel = character.spells!.filter((s) => s.level === level);
              if (spellsAtLevel.length === 0) return null;

              return (
                <div key={level} className="text-sm">
                  <p className="font-bold text-gray-700 mb-1">
                    {level === 0 ? 'Cantrips' : `Level ${level}`}
                  </p>
                  <div className="pl-4 space-y-1">
                    {spellsAtLevel.map((spell, idx) => (
                      <div key={idx} className="text-gray-600">
                        {spell.name}
                        <span className="text-xs text-gray-500 ml-2">({spell.school})</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Saving Throws */}
      {character.derivedStats?.savingThrows && (
        <div className="border rounded-lg p-4 bg-white">
          <h3 className="font-bold text-lg mb-3">Saving Throws</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-gray-600 text-sm">Fortitude</p>
              <p className="text-2xl font-bold text-red-600">
                +{character.derivedStats.savingThrows.fortitude}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Reflex</p>
              <p className="text-2xl font-bold text-green-600">
                +{character.derivedStats.savingThrows.reflex}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Will</p>
              <p className="text-2xl font-bold text-blue-600">
                +{character.derivedStats.savingThrows.will}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
