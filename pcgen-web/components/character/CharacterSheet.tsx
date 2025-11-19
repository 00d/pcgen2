'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PF1ECharacter, PF1EClass, PF1ERace, PF1ESkill } from '@/types/pathfinder1e';
import { loadClasses, loadRaces, loadSkills } from '@/lib/data-loaders';
import {
  getAbilityModifiers,
  calculateBAB,
  calculateSave,
  calculateAC,
  calculateSkillModifier,
  calculateInitiative,
  calculateMeleeAttack,
  calculateRangedAttack,
  calculateCMB,
  calculateCMD,
  calculateMaxHP,
  calculateCarryingCapacity,
  formatModifier,
} from '@/lib/calculations/pf1e-stats';
import {
  User,
  Heart,
  Shield,
  Zap,
  BookOpen,
  Star,
  ShoppingBag,
  Edit,
  Download,
  ArrowLeft,
} from 'lucide-react';
import { downloadCharacterAsFile } from '@/lib/storage/character-storage';

interface CharacterSheetProps {
  character: PF1ECharacter;
}

const ABILITY_NAMES: Record<string, string> = {
  STR: 'Strength',
  DEX: 'Dexterity',
  CON: 'Constitution',
  INT: 'Intelligence',
  WIS: 'Wisdom',
  CHA: 'Charisma',
};

export function CharacterSheet({ character }: CharacterSheetProps) {
  const router = useRouter();
  const [classes, setClasses] = useState<PF1EClass[]>([]);
  const [race, setRace] = useState<PF1ERace | null>(null);
  const [skills, setSkills] = useState<PF1ESkill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadClasses(), loadRaces(), loadSkills()])
      .then(([classesData, racesData, skillsData]) => {
        setClasses(classesData);
        setRace(racesData.find((r) => r.id === character.race) || null);
        setSkills(skillsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [character.race]);

  const handleBack = () => {
    router.push('/');
  };

  const handleEdit = () => {
    // Load character data into wizard
    router.push(`/character/new?edit=${character.id}`);
  };

  const handleExport = () => {
    downloadCharacterAsFile(character);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-center text-muted">Loading character sheet...</div>
      </div>
    );
  }

  const abilityMods = getAbilityModifiers(character.abilityScores);
  const bab = calculateBAB(character, classes);
  const fortSave = calculateSave(character, classes, 'fortitude');
  const refSave = calculateSave(character, classes, 'reflex');
  const willSave = calculateSave(character, classes, 'will');
  const ac = calculateAC(character);
  const initiative = calculateInitiative(character);
  const meleeAttack = calculateMeleeAttack(character, classes);
  const rangedAttack = calculateRangedAttack(character, classes);
  const cmb = calculateCMB(character, classes);
  const cmd = calculateCMD(character, classes);
  const maxHP = calculateMaxHP(character, classes);
  const carrying = calculateCarryingCapacity(character);

  const characterClass = character.classes[0];
  const classData = classes.find((c) => c.id === characterClass?.classId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 rounded-lg border border-surface bg-background px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface"
        >
          <ArrowLeft size={16} />
          Back to List
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 rounded-lg border border-surface bg-background px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface"
          >
            <Edit size={16} />
            Edit
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border border-surface bg-background px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Character Name & Basic Info */}
      <div className="mb-6 rounded-lg border border-surface bg-background p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-text">{character.name}</h1>
            <p className="text-lg text-muted">
              {race?.name} {classData?.name} {character.level}
            </p>
          </div>
          <div className="flex items-center justify-center rounded-full bg-primary/20 p-4">
            <User size={32} className="text-primary" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <span className="text-muted">Alignment:</span>
            <span className="ml-2 font-medium text-text">{character.alignment}</span>
          </div>
          {character.player && (
            <div>
              <span className="text-muted">Player:</span>
              <span className="ml-2 font-medium text-text">{character.player}</span>
            </div>
          )}
          {character.deity && (
            <div>
              <span className="text-muted">Deity:</span>
              <span className="ml-2 font-medium text-text">{character.deity}</span>
            </div>
          )}
          <div>
            <span className="text-muted">Size:</span>
            <span className="ml-2 font-medium text-text">{race?.size || 'Medium'}</span>
          </div>
        </div>
      </div>

      {/* Combat Stats Row */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {/* HP */}
        <div className="rounded-lg border border-surface bg-background p-4">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Heart size={20} />
            <span className="font-bold">Hit Points</span>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-text">{character.hp.current}</div>
            <div className="text-sm text-muted">/ {maxHP} max</div>
          </div>
        </div>

        {/* AC */}
        <div className="rounded-lg border border-surface bg-background p-4">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Shield size={20} />
            <span className="font-bold">Armor Class</span>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-text">{ac.total}</div>
            <div className="text-xs text-muted">
              Touch: {ac.touch} / FF: {ac.flatFooted}
            </div>
          </div>
        </div>

        {/* Initiative */}
        <div className="rounded-lg border border-surface bg-background p-4">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Zap size={20} />
            <span className="font-bold">Initiative</span>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-text">{formatModifier(initiative)}</div>
            <div className="text-xs text-muted">DEX modifier</div>
          </div>
        </div>

        {/* Speed */}
        <div className="rounded-lg border border-surface bg-background p-4">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Zap size={20} />
            <span className="font-bold">Speed</span>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-text">{race?.speed || 30}</div>
            <div className="text-xs text-muted">feet</div>
          </div>
        </div>
      </div>

      {/* Ability Scores */}
      <div className="mb-6 rounded-lg border border-surface bg-background p-6">
        <h2 className="mb-4 text-xl font-bold text-text">Ability Scores</h2>
        <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
          {Object.entries(character.abilityScores).map(([ability, score]) => (
            <div key={ability} className="rounded-lg bg-surface/50 p-4 text-center">
              <div className="text-sm font-medium text-muted">{ability}</div>
              <div className="text-3xl font-bold text-text">{score}</div>
              <div className="text-sm text-muted">{formatModifier(abilityMods[ability as keyof typeof abilityMods])}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Saves & Combat Stats */}
      <div className="mb-6 grid gap-6 md:grid-cols-2">
        {/* Saving Throws */}
        <div className="rounded-lg border border-surface bg-background p-6">
          <h2 className="mb-4 text-xl font-bold text-text">Saving Throws</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-surface/50 p-3">
              <span className="font-medium text-text">Fortitude</span>
              <span className="text-2xl font-bold text-text">{formatModifier(fortSave)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-surface/50 p-3">
              <span className="font-medium text-text">Reflex</span>
              <span className="text-2xl font-bold text-text">{formatModifier(refSave)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-surface/50 p-3">
              <span className="font-medium text-text">Will</span>
              <span className="text-2xl font-bold text-text">{formatModifier(willSave)}</span>
            </div>
          </div>
        </div>

        {/* Combat Stats */}
        <div className="rounded-lg border border-surface bg-background p-6">
          <h2 className="mb-4 text-xl font-bold text-text">Combat</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-surface/50 p-3">
              <div className="text-sm text-muted">Base Attack</div>
              <div className="text-xl font-bold text-text">{formatModifier(bab)}</div>
            </div>
            <div className="rounded-lg bg-surface/50 p-3">
              <div className="text-sm text-muted">Melee</div>
              <div className="text-xl font-bold text-text">{formatModifier(meleeAttack)}</div>
            </div>
            <div className="rounded-lg bg-surface/50 p-3">
              <div className="text-sm text-muted">Ranged</div>
              <div className="text-xl font-bold text-text">{formatModifier(rangedAttack)}</div>
            </div>
            <div className="rounded-lg bg-surface/50 p-3">
              <div className="text-sm text-muted">CMB</div>
              <div className="text-xl font-bold text-text">{formatModifier(cmb)}</div>
            </div>
            <div className="rounded-lg bg-surface/50 p-3">
              <div className="text-sm text-muted">CMD</div>
              <div className="text-xl font-bold text-text">{cmd}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      {character.skills.length > 0 && (
        <div className="mb-6 rounded-lg border border-surface bg-background p-6">
          <div className="mb-4 flex items-center gap-2 text-xl font-bold text-text">
            <BookOpen size={24} />
            <span>Skills</span>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {character.skills.map((charSkill) => {
              const skill = skills.find((s) => s.id === charSkill.skillId);
              if (!skill) return null;

              const skillMod = calculateSkillModifier(character, skill, charSkill);

              return (
                <div
                  key={charSkill.skillId}
                  className="flex items-center justify-between rounded-lg bg-surface/50 p-3"
                >
                  <div>
                    <span className="font-medium text-text">{skill.name}</span>
                    {charSkill.isClassSkill && (
                      <span className="ml-2 rounded bg-primary/20 px-2 py-0.5 text-xs text-primary">
                        Class
                      </span>
                    )}
                    <div className="text-xs text-muted">
                      {ABILITY_NAMES[skill.ability]} ({charSkill.ranks} ranks)
                    </div>
                  </div>
                  <div className="text-xl font-bold text-text">{formatModifier(skillMod.total)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Feats */}
      {character.feats.length > 0 && (
        <div className="mb-6 rounded-lg border border-surface bg-background p-6">
          <div className="mb-4 flex items-center gap-2 text-xl font-bold text-text">
            <Star size={24} />
            <span>Feats</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {character.feats.map((feat) => (
              <div
                key={feat.featId}
                className="rounded-lg border border-surface bg-surface/50 px-4 py-2 text-sm font-medium text-text"
              >
                {feat.featId}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equipment */}
      {character.equipment.length > 0 && (
        <div className="mb-6 rounded-lg border border-surface bg-background p-6">
          <div className="mb-4 flex items-center gap-2 text-xl font-bold text-text">
            <ShoppingBag size={24} />
            <span>Equipment</span>
          </div>
          <div className="space-y-2">
            {character.equipment.map((item) => (
              <div
                key={item.itemId}
                className="flex items-center justify-between rounded-lg bg-surface/50 p-3"
              >
                <span className="font-medium text-text">{item.itemId}</span>
                <div className="flex items-center gap-4 text-sm text-muted">
                  <span>Qty: {item.quantity}</span>
                  {item.equipped && (
                    <span className="rounded bg-primary/20 px-2 py-1 text-xs font-medium text-primary">
                      Equipped
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Currency */}
          <div className="mt-4 rounded-lg border-t border-surface pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Gold:</span>
              <span className="font-bold text-text">{character.currency.gp} gp</span>
            </div>
          </div>

          {/* Carrying Capacity */}
          <div className="mt-4 text-xs text-muted">
            Carrying Capacity: Light {carrying.light} lbs, Medium {carrying.medium} lbs, Heavy{' '}
            {carrying.heavy} lbs
          </div>
        </div>
      )}

      {/* Notes */}
      {character.notes && (
        <div className="mb-6 rounded-lg border border-surface bg-background p-6">
          <h2 className="mb-4 text-xl font-bold text-text">Notes</h2>
          <p className="whitespace-pre-wrap text-muted">{character.notes}</p>
        </div>
      )}
    </div>
  );
}
