'use client';

import { useState, useEffect } from 'react';
import { Skill } from '../types/gameRules';
import { SkillAllocation } from '../types/character';

interface Props {
  skills: Skill[];
  classSkills: string[];
  abilityModifiers: Record<string, number>;
  maxRanksPerSkill: number;
  totalSkillPoints: number;
  onSkillsChange: (skills: SkillAllocation[]) => void;
}

export default function SkillAllocator({
  skills,
  classSkills,
  abilityModifiers,
  maxRanksPerSkill,
  totalSkillPoints,
  onSkillsChange,
}: Props) {
  const [skillRanks, setSkillRanks] = useState<Record<string, number>>({});

  // Initialize skill ranks
  useEffect(() => {
    const initial: Record<string, number> = {};
    skills.forEach((skill) => {
      initial[skill.id] = 0;
    });
    setSkillRanks(initial);
  }, [skills]);

  // Calculate used points
  const usedPoints = Object.values(skillRanks).reduce((sum, ranks) => sum + ranks, 0);
  const remainingPoints = totalSkillPoints - usedPoints;

  // Handle rank change
  const handleRankChange = (skillId: string, newRanks: number) => {
    if (newRanks < 0 || newRanks > maxRanksPerSkill) return;

    const currentRanks = skillRanks[skillId] || 0;
    const pointsDifference = newRanks - currentRanks;

    // Check if we have enough points
    if (pointsDifference > remainingPoints && pointsDifference > 0) return;

    const updated = { ...skillRanks, [skillId]: newRanks };
    setSkillRanks(updated);

    // Convert to SkillAllocation format for parent
    const skillAllocations: SkillAllocation[] = skills
      .map((skill) => {
        const ranks = updated[skill.id] || 0;
        const abilityMod = abilityModifiers[skill.ability] || 0;
        const isClassSkill = classSkills.includes(skill.id);
        const classSkillBonus = isClassSkill ? 3 : 0;

        return {
          skillId: skill.id,
          skillName: skill.name,
          ranks,
          abilityModifier: abilityMod,
          total: ranks + abilityMod + classSkillBonus,
          isClassSkill,
        };
      })
      .filter((s) => s.ranks > 0);

    onSkillsChange(skillAllocations);
  };

  // Group skills by ability
  const groupedSkills = skills.reduce(
    (acc, skill) => {
      if (!acc[skill.ability]) acc[skill.ability] = [];
      acc[skill.ability].push(skill);
      return acc;
    },
    {} as Record<string, Skill[]>
  );

  const abilityNames: Record<string, string> = {
    str: 'Strength',
    dex: 'Dexterity',
    con: 'Constitution',
    int: 'Intelligence',
    wis: 'Wisdom',
    cha: 'Charisma',
  };

  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="bg-blue-50 p-4 rounded border border-blue-200">
        <p className="text-sm mb-2">
          <strong>Total Skill Points:</strong> {totalSkillPoints}
        </p>
        <p className="text-sm mb-2">
          <strong>Used Points:</strong> {usedPoints}
        </p>
        <p className={`text-sm font-bold ${remainingPoints >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          Remaining Points: {remainingPoints}
        </p>
      </div>

      {/* Skill Groups */}
      <div className="space-y-6">
        {Object.entries(groupedSkills).map(([ability, abilitySkills]) => (
          <div key={ability}>
            <h3 className="font-bold text-lg mb-3 uppercase text-gray-700">
              {abilityNames[ability]} ({abilityModifiers[ability] >= 0 ? '+' : ''}{abilityModifiers[ability]})
            </h3>

            <div className="space-y-2">
              {abilitySkills.map((skill) => {
                const ranks = skillRanks[skill.id] || 0;
                const abilityMod = abilityModifiers[skill.ability] || 0;
                const isClassSkill = classSkills.includes(skill.id);
                const classSkillBonus = isClassSkill ? 3 : 0;
                const totalBonus = ranks + abilityMod + classSkillBonus;

                return (
                  <div key={skill.id} className="border rounded p-3 bg-white hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      {/* Skill Name */}
                      <div className="flex-1">
                        <div className="font-bold">{skill.name}</div>
                        {skill.description && (
                          <div className="text-xs text-gray-500">{skill.description}</div>
                        )}
                        {isClassSkill && (
                          <div className="text-xs text-blue-600 font-bold">Class Skill (+3)</div>
                        )}
                        {skill.armorPenalty && (
                          <div className="text-xs text-orange-600">Armor Check Penalty</div>
                        )}
                      </div>

                      {/* Rank Input */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRankChange(skill.id, ranks - 1)}
                          disabled={ranks <= 0}
                          className="px-2 py-1 bg-gray-300 rounded disabled:opacity-50"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="0"
                          max={maxRanksPerSkill}
                          value={ranks}
                          onChange={(e) => handleRankChange(skill.id, parseInt(e.target.value) || 0)}
                          className="w-12 text-center border rounded py-1"
                        />
                        <button
                          onClick={() => handleRankChange(skill.id, ranks + 1)}
                          disabled={ranks >= maxRanksPerSkill}
                          className="px-2 py-1 bg-gray-300 rounded disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>

                      {/* Ability Modifier */}
                      <div className="text-center min-w-[3rem]">
                        <div className="text-xs text-gray-500">Mod</div>
                        <div className="font-bold text-blue-600">
                          {abilityMod >= 0 ? '+' : ''}{abilityMod}
                        </div>
                      </div>

                      {/* Total Bonus */}
                      <div className="text-center min-w-[4rem] border-l pl-3">
                        <div className="text-xs text-gray-500">Total</div>
                        <div className="text-lg font-bold">
                          {totalBonus >= 0 ? '+' : ''}{totalBonus}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {remainingPoints === 0 && usedPoints > 0 && (
        <div className="bg-green-50 p-4 rounded border border-green-200 text-sm text-green-800">
          All skill points allocated! You can proceed to the next step.
        </div>
      )}

      {remainingPoints > 0 && (
        <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-sm text-yellow-800">
          You have {remainingPoints} skill points remaining. Allocate them to continue.
        </div>
      )}
    </div>
  );
}
