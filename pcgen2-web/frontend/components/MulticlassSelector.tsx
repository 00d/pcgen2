'use client';

import { useState } from 'react';
import { PClass as PClassType } from '../types/gameRules';

interface CharacterClass {
  classId: string;
  className: string;
  level: number;
}

interface Props {
  classes: PClassType[];
  selectedClasses: CharacterClass[];
  maxClasses?: number;
  onAddClass: (classId: string) => void;
  onRemoveClass: (classId: string) => void;
  onLevelChange: (classId: string, level: number) => void;
  characterLevel?: number;
  abilityScores?: Record<string, number>;
}

export default function MulticlassSelector({
  classes,
  selectedClasses,
  maxClasses = 5,
  onAddClass,
  onRemoveClass,
  onLevelChange,
  characterLevel = 1,
  abilityScores = {},
}: Props) {
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

  const totalLevel = selectedClasses.reduce((sum, c) => sum + c.level, 0);
  const availableClasses = classes.filter(
    (c) => !selectedClasses.some((sc) => sc.classId === c.id)
  );

  const calculateBAB = (classId: string, level: number): number => {
    const classData = classes.find((c) => c.id === classId);
    if (!classData) return 0;

    const progression = classData.data.baseAttackBonusProgression;
    switch (progression) {
      case 'good':
        return level;
      case 'moderate':
        return Math.floor(level * 0.75);
      case 'poor':
        return Math.floor(level * 0.5);
      default:
        return 0;
    }
  };

  const calculateMulticlassBAB = (): number => {
    const babs = selectedClasses.map((sc) => calculateBAB(sc.classId, sc.level));
    return Math.max(...babs, 0);
  };

  const calculateHP = (classId: string, level: number, conMod: number = 0): number => {
    const classData = classes.find((c) => c.id === classId);
    if (!classData) return 0;

    const hitDie = parseInt(classData.data.hitDie.replace('d', ''));
    return level * (hitDie + conMod);
  };

  const getTotalHP = (): number => {
    const conMod = Math.floor((abilityScores.con || 10) / 2) - 5;
    return selectedClasses.reduce((sum, sc) => sum + calculateHP(sc.classId, sc.level, conMod), 0);
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-blue-50 p-4 rounded border border-blue-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-600">Total Level</p>
            <p className="text-2xl font-bold text-blue-600">{totalLevel}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Classes</p>
            <p className="text-2xl font-bold text-blue-600">{selectedClasses.length}/{maxClasses}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Base Attack Bonus</p>
            <p className="text-2xl font-bold text-green-600">+{calculateMulticlassBAB()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Hit Points</p>
            <p className="text-2xl font-bold text-red-600">{getTotalHP()}</p>
          </div>
        </div>
      </div>

      {/* Selected Classes */}
      {selectedClasses.length > 0 && (
        <div>
          <h3 className="font-bold text-lg mb-3 uppercase text-gray-700">Selected Classes</h3>
          <div className="space-y-2">
            {selectedClasses.map((selectedClass) => {
              const classData = classes.find((c) => c.id === selectedClass.classId);
              if (!classData) return null;

              const bab = calculateBAB(selectedClass.classId, selectedClass.level);
              const hp = calculateHP(selectedClass.classId, selectedClass.level);
              const expanded = expandedClassId === selectedClass.classId;

              return (
                <div
                  key={selectedClass.classId}
                  className="border border-green-500 bg-green-50 rounded overflow-hidden"
                >
                  <div className="flex items-center justify-between p-3">
                    <div className="flex-1">
                      <button
                        onClick={() =>
                          setExpandedClassId(
                            expanded ? null : selectedClass.classId
                          )
                        }
                        className="font-bold text-left hover:text-blue-600 flex items-center gap-2"
                      >
                        {selectedClass.className}
                        <span className="text-xs text-gray-500">
                          (Level {selectedClass.level}, BAB +{bab}, HP {hp})
                        </span>
                        <span className="ml-auto text-gray-400">
                          {expanded ? '▼' : '▶'}
                        </span>
                      </button>
                    </div>
                    <button
                      onClick={() => onRemoveClass(selectedClass.classId)}
                      className="ml-2 text-red-600 hover:text-red-800 font-bold px-3 py-1 rounded hover:bg-red-100"
                      title="Remove this class"
                    >
                      ×
                    </button>
                  </div>

                  {expanded && (
                    <div className="border-t p-3 bg-gray-50 text-sm space-y-3">
                      <div>
                        <label className="block text-gray-700 font-bold mb-2">
                          Level: {selectedClass.level}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max={totalLevel}
                          value={selectedClass.level}
                          onChange={(e) =>
                            onLevelChange(selectedClass.classId, parseInt(e.target.value))
                          }
                          className="w-full"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded">
                        <div>
                          <p className="text-gray-600 text-xs">BAB</p>
                          <p className="font-bold">+{bab}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs">HP</p>
                          <p className="font-bold">{hp}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs">Skills/Lvl</p>
                          <p className="font-bold">{classData.data.skillsPerLevel}</p>
                        </div>
                      </div>

                      {classData.data.classAbilities && classData.data.classAbilities.length > 0 && (
                        <div>
                          <p className="font-bold text-gray-700 mb-2">Class Abilities:</p>
                          <ul className="space-y-1">
                            {classData.data.classAbilities
                              .filter((ab) => ab.level <= selectedClass.level)
                              .map((ability) => (
                                <li key={ability.id} className="text-gray-600 text-xs">
                                  <strong>Level {ability.level}:</strong> {ability.name}
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Class */}
      {selectedClasses.length < maxClasses && availableClasses.length > 0 && (
        <div>
          <h3 className="font-bold text-lg mb-3 uppercase text-gray-700">Add Class</h3>

          <div className="space-y-2">
            {availableClasses.map((classData) => (
              <div
                key={classData.id}
                className="border border-gray-300 bg-white hover:border-gray-400 rounded p-3 flex items-start gap-3"
              >
                <button
                  onClick={() => onAddClass(classData.id)}
                  className="mt-1 text-blue-600 hover:text-blue-800 font-bold"
                  title="Add this class"
                >
                  +
                </button>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800">{classData.name}</h4>
                  <p className="text-sm text-gray-600">
                    Hit Die: {classData.data.hitDie} | Skills: {classData.data.skillsPerLevel}/level
                  </p>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="inline-block mr-3">
                      BAB: <strong>{classData.data.baseAttackBonusProgression}</strong>
                    </span>
                    <span className="inline-block">
                      Fort: <strong>{classData.data.savingThrows.fort}</strong>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Message */}
      {selectedClasses.length === 0 && (
        <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-sm text-yellow-800">
          <p className="font-bold mb-1">Multiclass Rules</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Characters can have up to {maxClasses} classes</li>
            <li>Base Attack Bonus is the highest from all classes</li>
            <li>Saving throws are the best from all classes</li>
            <li>Hit points are the sum of all classes</li>
            <li>Each class contributes its own feats and abilities</li>
          </ul>
        </div>
      )}
    </div>
  );
}
