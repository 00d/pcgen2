'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateCreationData } from '@/store/slices/characterSlice';
import { loadClasses } from '@/lib/data-loaders';
import type { PF1EClass } from '@/types/pathfinder1e';
import { ChevronDown, ChevronUp, Sword, Shield, Wand } from 'lucide-react';

export function ClassSelectionStep() {
  const dispatch = useAppDispatch();
  const creationData = useAppSelector((state) => state.character.creation.data);
  const selectedClasses = (creationData as any).classes || [];

  const [classes, setClasses] = useState<PF1EClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'base' | 'prestige'>('base');

  useEffect(() => {
    loadClasses()
      .then(setClasses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSelectClass = (classId: string) => {
    // For now, single class selection (level 1 character)
    dispatch(
      updateCreationData({
        classes: [
          {
            classId,
            level: 1,
            hitPoints: [],
            favoredClassBonus: [],
          },
        ],
      })
    );
  };

  const toggleExpanded = (classId: string) => {
    setExpandedClassId(expandedClassId === classId ? null : classId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="mb-4 text-2xl font-bold text-text">Choose Your Class</h2>
          <p className="text-muted">Select your character's class.</p>
        </div>
        <div className="text-center text-muted">Loading classes...</div>
      </div>
    );
  }

  const filteredClasses = classes.filter(
    (cls) => filterType === 'all' || cls.classType === filterType
  );

  const selectedClassId = selectedClasses[0]?.classId;

  const getClassIcon = (cls: PF1EClass) => {
    if (cls.spellcasting) return <Wand size={20} />;
    if (cls.baseAttackBonus === 'full') return <Sword size={20} />;
    return <Shield size={20} />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-text">Choose Your Class</h2>
        <p className="text-muted">
          Select your character's class. This defines your role, abilities, and progression.
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterType('base')}
          className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
            filterType === 'base'
              ? 'bg-primary text-white'
              : 'border border-surface bg-background text-text hover:border-primary'
          }`}
        >
          Core Classes
        </button>
        <button
          onClick={() => setFilterType('prestige')}
          className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
            filterType === 'prestige'
              ? 'bg-primary text-white'
              : 'border border-surface bg-background text-text hover:border-primary'
          }`}
        >
          Prestige Classes
        </button>
        <button
          onClick={() => setFilterType('all')}
          className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
            filterType === 'all'
              ? 'bg-primary text-white'
              : 'border border-surface bg-background text-text hover:border-primary'
          }`}
        >
          All Classes
        </button>
      </div>

      {/* Class Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredClasses.map((cls) => {
          const isSelected = selectedClassId === cls.id;
          const isExpanded = expandedClassId === cls.id;

          return (
            <div
              key={cls.id}
              className={`rounded-lg border-2 p-4 transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-surface bg-background hover:border-primary/50'
              }`}
            >
              {/* Header */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex flex-1 items-start gap-2">
                  <div className="text-primary">{getClassIcon(cls)}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-text">{cls.name}</h3>
                    <p className="text-sm text-muted">
                      {cls.classType === 'prestige' ? 'Prestige Class' : 'Base Class'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleSelectClass(cls.id)}
                  className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-primary text-white'
                      : 'border border-surface bg-background text-text hover:border-primary'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Select'}
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium text-text">Hit Die: </span>
                  <span className="text-muted">d{cls.hitDie}</span>
                </div>
                <div>
                  <span className="font-medium text-text">Skills: </span>
                  <span className="text-muted">{cls.skillPointsPerLevel}/level</span>
                </div>
                <div>
                  <span className="font-medium text-text">BAB: </span>
                  <span className="text-muted capitalize">{cls.baseAttackBonus}</span>
                </div>
                <div>
                  <span className="font-medium text-text">Saves: </span>
                  <span className="text-muted">
                    {cls.saves.fortitude === 'good' && 'Fort'}
                    {cls.saves.reflex === 'good' &&
                      (cls.saves.fortitude === 'good' ? ', Ref' : 'Ref')}
                    {cls.saves.will === 'good' &&
                      (cls.saves.fortitude === 'good' || cls.saves.reflex === 'good'
                        ? ', Will'
                        : 'Will')}
                  </span>
                </div>
              </div>

              {cls.spellcasting && (
                <div className="mt-2 rounded bg-surface/50 px-2 py-1 text-sm text-muted">
                  <span className="font-medium text-text">Spellcaster: </span>
                  {cls.spellcasting.type} ({cls.spellcasting.stat})
                </div>
              )}

              {/* Expandable Details */}
              <button
                onClick={() => toggleExpanded(cls.id)}
                className="mt-3 flex w-full items-center justify-between rounded border border-surface px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-surface"
              >
                <span>{isExpanded ? 'Hide' : 'Show'} Details</span>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {isExpanded && (
                <div className="mt-3 space-y-2 rounded border border-surface bg-surface/50 p-3 text-sm">
                  <div>
                    <div className="font-medium text-text">Hit Die:</div>
                    <div className="text-muted">d{cls.hitDie} per level</div>
                  </div>
                  <div>
                    <div className="font-medium text-text">Skill Ranks:</div>
                    <div className="text-muted">
                      {cls.skillPointsPerLevel} + Intelligence modifier per level
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-text">Base Attack Bonus:</div>
                    <div className="text-muted capitalize">{cls.baseAttackBonus} progression</div>
                  </div>
                  <div>
                    <div className="font-medium text-text">Saving Throws:</div>
                    <div className="text-muted">
                      Fortitude: {cls.saves.fortitude}, Reflex: {cls.saves.reflex}, Will:{' '}
                      {cls.saves.will}
                    </div>
                  </div>
                  {cls.spellcasting && (
                    <div>
                      <div className="font-medium text-text">Spellcasting:</div>
                      <div className="text-muted">
                        {cls.spellcasting.type} spells using {cls.spellcasting.stat}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredClasses.length === 0 && (
        <div className="text-center text-muted">No classes found for this filter.</div>
      )}
    </div>
  );
}
