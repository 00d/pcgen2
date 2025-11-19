'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateCreationData } from '@/store/slices/characterSlice';
import { loadSkills, loadClasses } from '@/lib/data-loaders';
import type { PF1ESkill, PF1EClass, PF1ECharacterSkill } from '@/types/pathfinder1e';
import type { AbilityScore } from '@/types';
import { Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';

const ABILITY_NAMES: Record<AbilityScore, string> = {
  STR: 'Strength',
  DEX: 'Dexterity',
  CON: 'Constitution',
  INT: 'Intelligence',
  WIS: 'Wisdom',
  CHA: 'Charisma',
};

export function SkillsSelectionStep() {
  const dispatch = useAppDispatch();
  const creationData = useAppSelector((state) => state.character.creation.data);
  const selectedClassData = (creationData as any).classes?.[0];
  const abilityScores = creationData.abilityScores;

  const [skills, setSkills] = useState<PF1ESkill[]>([]);
  const [selectedClass, setSelectedClass] = useState<PF1EClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [skillRanks, setSkillRanks] = useState<Record<string, number>>({});
  const [showHelp, setShowHelp] = useState(false);
  const [filterClassSkillsOnly, setFilterClassSkillsOnly] = useState(false);

  useEffect(() => {
    Promise.all([loadSkills(), loadClasses()])
      .then(([skillsData, classesData]) => {
        setSkills(skillsData);
        if (selectedClassData?.classId) {
          const cls = classesData.find((c) => c.id === selectedClassData.classId);
          if (cls) {
            setSelectedClass(cls);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedClassData?.classId]);

  useEffect(() => {
    // Initialize skill ranks from Redux if available
    const existingSkills = (creationData as any).skills as PF1ECharacterSkill[] | undefined;
    if (existingSkills) {
      const ranksMap: Record<string, number> = {};
      existingSkills.forEach((skill) => {
        ranksMap[skill.skillId] = skill.ranks;
      });
      setSkillRanks(ranksMap);
    }
  }, []);

  useEffect(() => {
    // Update Redux store whenever skill ranks change
    const characterSkills: PF1ECharacterSkill[] = Object.entries(skillRanks)
      .filter(([_, ranks]) => ranks > 0)
      .map(([skillId, ranks]) => ({
        skillId,
        ranks,
        isClassSkill: isClassSkill(skillId),
      }));
    dispatch(updateCreationData({ skills: characterSkills }));
  }, [skillRanks, selectedClass, dispatch]);

  const getAbilityModifier = (ability: AbilityScore): number => {
    if (!abilityScores) return 0;
    const score = abilityScores[ability];
    return Math.floor((score - 10) / 2);
  };

  const isClassSkill = (skillId: string): boolean => {
    if (!selectedClass) return false;
    return selectedClass.classSkills.includes(skillId);
  };

  const getMaxSkillRanks = (): number => {
    // At level 1, max ranks = 1
    const level = selectedClassData?.level || 1;
    return level;
  };

  const calculateSkillPointsAvailable = (): number => {
    if (!selectedClass || !abilityScores) return 0;
    const intMod = getAbilityModifier('INT');
    const basePoints = selectedClass.skillPointsPerLevel;
    // Minimum 1 skill point per level even with negative INT
    return Math.max(1, basePoints + intMod);
  };

  const calculateSkillPointsSpent = (): number => {
    return Object.values(skillRanks).reduce((sum, ranks) => sum + ranks, 0);
  };

  const skillPointsAvailable = calculateSkillPointsAvailable();
  const skillPointsSpent = calculateSkillPointsSpent();
  const skillPointsRemaining = skillPointsAvailable - skillPointsSpent;

  const canIncreaseSkill = (skillId: string): boolean => {
    const currentRanks = skillRanks[skillId] || 0;
    const maxRanks = getMaxSkillRanks();
    if (currentRanks >= maxRanks) return false;
    return skillPointsRemaining > 0;
  };

  const canDecreaseSkill = (skillId: string): boolean => {
    const currentRanks = skillRanks[skillId] || 0;
    return currentRanks > 0;
  };

  const handleIncreaseSkill = (skillId: string) => {
    if (canIncreaseSkill(skillId)) {
      setSkillRanks((prev) => ({
        ...prev,
        [skillId]: (prev[skillId] || 0) + 1,
      }));
    }
  };

  const handleDecreaseSkill = (skillId: string) => {
    if (canDecreaseSkill(skillId)) {
      const newRanks = (skillRanks[skillId] || 0) - 1;
      if (newRanks === 0) {
        const { [skillId]: _, ...rest } = skillRanks;
        setSkillRanks(rest);
      } else {
        setSkillRanks((prev) => ({
          ...prev,
          [skillId]: newRanks,
        }));
      }
    }
  };

  const getSkillBonus = (skill: PF1ESkill): number => {
    if (!abilityScores) return 0;
    const abilityMod = getAbilityModifier(skill.ability);
    const ranks = skillRanks[skill.id] || 0;
    const classSkillBonus = ranks > 0 && isClassSkill(skill.id) ? 3 : 0;
    return abilityMod + ranks + classSkillBonus;
  };

  const filteredSkills = useMemo(() => {
    if (filterClassSkillsOnly && selectedClass) {
      return skills.filter((skill) => selectedClass.classSkills.includes(skill.id));
    }
    return skills;
  }, [skills, filterClassSkillsOnly, selectedClass]);

  // Group skills by type
  const groupedSkills = useMemo(() => {
    const groups: Record<string, PF1ESkill[]> = {
      Core: [],
      Craft: [],
      Knowledge: [],
      Perform: [],
      Profession: [],
    };

    filteredSkills.forEach((skill) => {
      if (skill.id.startsWith('craft_')) {
        groups.Craft.push(skill);
      } else if (skill.id.startsWith('knowledge_')) {
        groups.Knowledge.push(skill);
      } else if (skill.id.startsWith('perform_')) {
        groups.Perform.push(skill);
      } else if (skill.id.startsWith('profession_')) {
        groups.Profession.push(skill);
      } else {
        groups.Core.push(skill);
      }
    });

    return groups;
  }, [filteredSkills]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="mb-4 text-2xl font-bold text-text">Assign Skill Ranks</h2>
          <p className="text-muted">Select your character's trained skills.</p>
        </div>
        <div className="text-center text-muted">Loading skills...</div>
      </div>
    );
  }

  if (!selectedClass) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="mb-4 text-2xl font-bold text-text">Assign Skill Ranks</h2>
          <p className="text-error">Please select a class first (Step 3).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-text">Assign Skill Ranks</h2>
        <p className="text-muted">
          Assign your skill ranks. You gain {skillPointsAvailable} skill points per level (
          {selectedClass.skillPointsPerLevel} base
          {abilityScores && getAbilityModifier('INT') !== 0
            ? ` ${getAbilityModifier('INT') > 0 ? '+' : ''}${getAbilityModifier('INT')} INT`
            : ''}
          ).
        </p>
      </div>

      {/* Skill Points Remaining */}
      <div className="rounded-lg border-2 border-primary bg-primary/10 p-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium text-text">Skill Points Remaining</span>
          <span
            className={`text-2xl font-bold ${
              skillPointsRemaining < 0 ? 'text-red-500' : 'text-primary'
            }`}
          >
            {skillPointsRemaining} / {skillPointsAvailable}
          </span>
        </div>
      </div>

      {/* Filter and Help */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterClassSkillsOnly(!filterClassSkillsOnly)}
          className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
            filterClassSkillsOnly
              ? 'bg-primary text-white'
              : 'border border-surface bg-background text-text hover:border-primary'
          }`}
        >
          {filterClassSkillsOnly ? 'Show All Skills' : 'Show Class Skills Only'}
        </button>

        <button
          onClick={() => setShowHelp(!showHelp)}
          className="flex flex-1 items-center justify-between rounded border border-surface bg-background px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface"
        >
          <span>Skill Rules</span>
          {showHelp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {showHelp && (
        <div className="rounded border border-surface bg-surface/50 p-4 text-sm text-muted">
          <p className="mb-2">
            <strong className="text-text">Skill Ranks:</strong> At level 1, you can put a maximum
            of 1 rank in any skill.
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong className="text-text">Class Skills:</strong> Receive a +3 bonus when you put
              at least 1 rank in them
            </li>
            <li>
              <strong className="text-text">Ability Modifier:</strong> Added to all skill checks
              using that ability
            </li>
            <li>
              <strong className="text-text">Trained Only:</strong> Some skills can only be used if
              you have at least 1 rank
            </li>
            <li>
              <strong className="text-text">Armor Check Penalty:</strong> Some skills are penalized
              when wearing armor
            </li>
          </ul>
        </div>
      )}

      {/* Skills by Group */}
      <div className="space-y-6">
        {Object.entries(groupedSkills).map(([groupName, groupSkills]) => {
          if (groupSkills.length === 0) return null;

          return (
            <div key={groupName}>
              <h3 className="mb-3 text-lg font-bold text-text">{groupName} Skills</h3>
              <div className="space-y-2">
                {groupSkills.map((skill) => {
                  const ranks = skillRanks[skill.id] || 0;
                  const bonus = getSkillBonus(skill);
                  const classSkill = isClassSkill(skill.id);

                  return (
                    <div
                      key={skill.id}
                      className={`flex items-center justify-between rounded-lg border p-3 ${
                        classSkill
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-surface bg-background'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-text">{skill.name}</div>
                          {classSkill && (
                            <span className="rounded bg-primary px-2 py-0.5 text-xs font-medium text-white">
                              Class Skill
                            </span>
                          )}
                          {skill.trainedOnly && (
                            <span className="rounded bg-surface px-2 py-0.5 text-xs text-muted">
                              Trained Only
                            </span>
                          )}
                          {skill.armorCheckPenalty && (
                            <span className="rounded bg-surface px-2 py-0.5 text-xs text-muted">
                              ACP
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted">
                          {ABILITY_NAMES[skill.ability]} (
                          {getAbilityModifier(skill.ability) >= 0 ? '+' : ''}
                          {getAbilityModifier(skill.ability)})
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Rank Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDecreaseSkill(skill.id)}
                            disabled={!canDecreaseSkill(skill.id)}
                            className="rounded border border-surface bg-background p-1.5 text-text transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Minus size={14} />
                          </button>
                          <div className="w-10 text-center text-sm font-bold text-text">
                            {ranks}
                          </div>
                          <button
                            onClick={() => handleIncreaseSkill(skill.id)}
                            disabled={!canIncreaseSkill(skill.id)}
                            className="rounded border border-surface bg-background p-1.5 text-text transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        {/* Total Bonus */}
                        <div className="min-w-[60px] rounded bg-surface/50 px-3 py-1.5 text-center">
                          <div className="text-sm text-muted">Total</div>
                          <div className="font-bold text-text">
                            {bonus >= 0 ? '+' : ''}
                            {bonus}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {selectedClass && (
        <div className="rounded border border-surface bg-surface/50 p-3 text-sm">
          <span className="font-medium text-text">Class: </span>
          <span className="text-muted">
            {selectedClass.name} ({selectedClass.skillPointsPerLevel} skill points/level)
          </span>
          <br />
          <span className="font-medium text-text">Class Skills: </span>
          <span className="text-muted">
            {skills
              .filter((s) => selectedClass.classSkills.includes(s.id))
              .map((s) => s.name)
              .join(', ')}
          </span>
        </div>
      )}
    </div>
  );
}
