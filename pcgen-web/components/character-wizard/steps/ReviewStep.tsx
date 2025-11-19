'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store';
import { loadRaces, loadClasses, loadSkills, loadFeats, loadWeapons, loadArmor } from '@/lib/data-loaders';
import type {
  PF1ERace,
  PF1EClass,
  PF1ESkill,
  PF1EFeat,
  PF1EWeapon,
  PF1EArmor,
  PF1ECharacterSkill,
  PF1ECharacterFeat,
  PF1ECharacterEquipment,
} from '@/types/pathfinder1e';
import type { AbilityScore, AbilityScores } from '@/types';
import { User, Users, Sword, Star, Zap, BookOpen, ShoppingBag, CheckCircle } from 'lucide-react';

const ABILITY_NAMES: Record<AbilityScore, string> = {
  STR: 'Strength',
  DEX: 'Dexterity',
  CON: 'Constitution',
  INT: 'Intelligence',
  WIS: 'Wisdom',
  CHA: 'Charisma',
};

export function ReviewStep() {
  const creationData = useAppSelector((state) => state.character.creation.data);

  const [race, setRace] = useState<PF1ERace | null>(null);
  const [characterClass, setCharacterClass] = useState<PF1EClass | null>(null);
  const [skills, setSkills] = useState<PF1ESkill[]>([]);
  const [feats, setFeats] = useState<PF1EFeat[]>([]);
  const [weapons, setWeapons] = useState<PF1EWeapon[]>([]);
  const [armor, setArmor] = useState<PF1EArmor[]>([]);
  const [loading, setLoading] = useState(true);

  const characterSkills = (creationData as any).skills as PF1ECharacterSkill[] || [];
  const characterFeats = (creationData as any).feats as PF1ECharacterFeat[] || [];
  const characterEquipment = (creationData as any).equipment as PF1ECharacterEquipment[] || [];
  const abilityScores = creationData.abilityScores as AbilityScores;
  const selectedRaceId = (creationData as any).race;
  const selectedClassData = (creationData as any).classes?.[0];
  const currency = (creationData as any).currency || { gp: 0 };

  useEffect(() => {
    Promise.all([
      loadRaces(),
      loadClasses(),
      loadSkills(),
      loadFeats(),
      loadWeapons(),
      loadArmor(),
    ])
      .then(([racesData, classesData, skillsData, featsData, weaponsData, armorData]) => {
        setRace(racesData.find((r) => r.id === selectedRaceId) || null);
        setCharacterClass(classesData.find((c) => c.id === selectedClassData?.classId) || null);
        setSkills(skillsData);
        setFeats(featsData);
        setWeapons(weaponsData);
        setArmor(armorData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedRaceId, selectedClassData?.classId]);

  const getAbilityModifier = (ability: AbilityScore): number => {
    if (!abilityScores) return 0;
    const score = abilityScores[ability];
    return Math.floor((score - 10) / 2);
  };

  const formatModifier = (mod: number): string => {
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const getSkillName = (skillId: string): string => {
    return skills.find((s) => s.id === skillId)?.name || skillId;
  };

  const getFeatName = (featId: string): string => {
    return feats.find((f) => f.id === featId)?.name || featId;
  };

  const getItemName = (itemId: string): string => {
    const weapon = weapons.find((w) => w.id === itemId);
    if (weapon) return weapon.name;
    const armorItem = armor.find((a) => a.id === itemId);
    if (armorItem) return armorItem.name;
    return itemId;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="mb-4 text-2xl font-bold text-text">Review Your Character</h2>
          <p className="text-muted">Review your character before finalizing.</p>
        </div>
        <div className="text-center text-muted">Loading character data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-text">Review Your Character</h2>
        <p className="text-muted">
          Review your character sheet. Use the Back button to make changes or click Complete to
          finalize.
        </p>
      </div>

      {/* Basic Info */}
      <div className="rounded-lg border border-surface bg-background p-4">
        <div className="mb-3 flex items-center gap-2 text-lg font-bold text-text">
          <User size={20} />
          <span>Basic Information</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-text">Name:</span>
            <span className="ml-2 text-muted">{creationData.name || 'Unnamed Character'}</span>
          </div>
          <div>
            <span className="font-medium text-text">Game System:</span>
            <span className="ml-2 text-muted capitalize">
              {creationData.gameSystem?.replace('pathfinder', 'Pathfinder ').replace('1e', '1E')}
            </span>
          </div>
        </div>
      </div>

      {/* Race */}
      {race && (
        <div className="rounded-lg border border-surface bg-background p-4">
          <div className="mb-3 flex items-center gap-2 text-lg font-bold text-text">
            <Users size={20} />
            <span>Race</span>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-text">{race.name}</span>
              <span className="ml-2 text-muted">
                ({race.size} {race.type})
              </span>
            </div>
            <div>
              <span className="font-medium text-text">Ability Modifiers:</span>
              <span className="ml-2 text-muted">
                {Object.entries(race.abilityScoreModifiers)
                  .map(([ability, mod]) => `${ability} ${mod > 0 ? '+' : ''}${mod}`)
                  .join(', ')}
              </span>
            </div>
            <div>
              <span className="font-medium text-text">Speed:</span>
              <span className="ml-2 text-muted">{race.speed} ft</span>
            </div>
            <div>
              <span className="font-medium text-text">Vision:</span>
              <span className="ml-2 text-muted">
                {race.vision === 'darkvision'
                  ? `Darkvision ${race.visionRange || 60} ft`
                  : race.vision === 'low-light'
                    ? 'Low-Light Vision'
                    : 'Normal'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Class */}
      {characterClass && (
        <div className="rounded-lg border border-surface bg-background p-4">
          <div className="mb-3 flex items-center gap-2 text-lg font-bold text-text">
            <Sword size={20} />
            <span>Class</span>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-text">{characterClass.name}</span>
              <span className="ml-2 text-muted">Level {selectedClassData?.level || 1}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium text-text">Hit Die:</span>
                <span className="ml-2 text-muted">d{characterClass.hitDie}</span>
              </div>
              <div>
                <span className="font-medium text-text">BAB:</span>
                <span className="ml-2 text-muted capitalize">{characterClass.baseAttackBonus}</span>
              </div>
              <div>
                <span className="font-medium text-text">Skills/Level:</span>
                <span className="ml-2 text-muted">{characterClass.skillPointsPerLevel}</span>
              </div>
              <div>
                <span className="font-medium text-text">Good Saves:</span>
                <span className="ml-2 text-muted">
                  {Object.entries(characterClass.saves)
                    .filter(([_, prog]) => prog === 'good')
                    .map(([save]) => save.charAt(0).toUpperCase() + save.slice(1, 4))
                    .join(', ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ability Scores */}
      {abilityScores && (
        <div className="rounded-lg border border-surface bg-background p-4">
          <div className="mb-3 flex items-center gap-2 text-lg font-bold text-text">
            <Zap size={20} />
            <span>Ability Scores</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm md:grid-cols-6">
            {(Object.keys(ABILITY_NAMES) as AbilityScore[]).map((ability) => {
              const score = abilityScores[ability];
              const modifier = getAbilityModifier(ability);

              return (
                <div key={ability} className="rounded bg-surface/50 p-3 text-center">
                  <div className="text-xs font-medium text-muted">{ability}</div>
                  <div className="text-2xl font-bold text-text">{score}</div>
                  <div className="text-xs text-muted">{formatModifier(modifier)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Skills */}
      {characterSkills.length > 0 && (
        <div className="rounded-lg border border-surface bg-background p-4">
          <div className="mb-3 flex items-center gap-2 text-lg font-bold text-text">
            <BookOpen size={20} />
            <span>Skills ({characterSkills.length})</span>
          </div>
          <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
            {characterSkills.map((skill) => (
              <div key={skill.skillId} className="flex justify-between rounded bg-surface/30 px-3 py-2">
                <span className="text-text">{getSkillName(skill.skillId)}</span>
                <div className="flex gap-2">
                  <span className="text-muted">{skill.ranks} rank{skill.ranks !== 1 ? 's' : ''}</span>
                  {skill.isClassSkill && (
                    <span className="rounded bg-primary/20 px-2 text-xs font-medium text-primary">
                      Class
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feats */}
      {characterFeats.length > 0 && (
        <div className="rounded-lg border border-surface bg-background p-4">
          <div className="mb-3 flex items-center gap-2 text-lg font-bold text-text">
            <Star size={20} />
            <span>Feats ({characterFeats.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {characterFeats.map((feat) => (
              <div
                key={feat.featId}
                className="rounded border border-surface bg-surface/50 px-3 py-2 text-sm text-text"
              >
                {getFeatName(feat.featId)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equipment */}
      {characterEquipment.length > 0 && (
        <div className="rounded-lg border border-surface bg-background p-4">
          <div className="mb-3 flex items-center gap-2 text-lg font-bold text-text">
            <ShoppingBag size={20} />
            <span>Equipment</span>
          </div>
          <div className="space-y-2 text-sm">
            {characterEquipment.map((item) => (
              <div key={item.itemId} className="flex justify-between rounded bg-surface/30 px-3 py-2">
                <span className="text-text">{getItemName(item.itemId)}</span>
                <span className="text-muted">Qty: {item.quantity}</span>
              </div>
            ))}
            <div className="border-t border-surface pt-2 font-medium">
              <div className="flex justify-between text-text">
                <span>Gold Remaining:</span>
                <span>{currency.gp?.toFixed(2) || '0.00'} gp</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completion Notice */}
      <div className="rounded-lg border-2 border-primary bg-primary/10 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle size={24} className="mt-0.5 flex-shrink-0 text-primary" />
          <div>
            <h3 className="mb-1 font-bold text-text">Ready to Finalize</h3>
            <p className="text-sm text-muted">
              Your character is ready! Click the <strong>Complete</strong> button below to save your
              character. You can always edit it later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
