'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateCreationData } from '@/store/slices/characterSlice';
import { loadRaces } from '@/lib/data-loaders';
import type { PF1ERace } from '@/types/pathfinder1e';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function RaceSelectionStep() {
  const dispatch = useAppDispatch();
  const creationData = useAppSelector((state) => state.character.creation.data);
  const selectedRaceId = (creationData as any).race;

  const [races, setRaces] = useState<PF1ERace[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRaceId, setExpandedRaceId] = useState<string | null>(null);

  useEffect(() => {
    loadRaces()
      .then(setRaces)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSelectRace = (raceId: string) => {
    dispatch(updateCreationData({ race: raceId }));
  };

  const toggleExpanded = (raceId: string) => {
    setExpandedRaceId(expandedRaceId === raceId ? null : raceId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="mb-4 text-2xl font-bold text-text">Choose Your Race</h2>
          <p className="text-muted">Select your character's race.</p>
        </div>
        <div className="text-center text-muted">Loading races...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-text">Choose Your Race</h2>
        <p className="text-muted">
          Select your character's race. Each race has unique traits and abilities.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {races.map((race) => {
          const isSelected = selectedRaceId === race.id;
          const isExpanded = expandedRaceId === race.id;

          // Get ability score modifiers
          const abilityMods = Object.entries(race.abilityScoreModifiers || {})
            .map(([ability, modifier]) => `${modifier > 0 ? '+' : ''}${modifier} ${ability}`)
            .join(', ');

          return (
            <div
              key={race.id}
              className={`rounded-lg border-2 p-4 transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-surface bg-background hover:border-primary/50'
              }`}
            >
              {/* Header */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-text">{race.name}</h3>
                  <p className="text-sm text-muted">
                    {race.size} {race.type} • {race.speed}ft speed
                  </p>
                </div>
                <button
                  onClick={() => handleSelectRace(race.id)}
                  className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-primary text-white'
                      : 'border border-surface bg-background text-text hover:border-primary'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Select'}
                </button>
              </div>

              {/* Quick Info */}
              <div className="space-y-2 text-sm">
                {abilityMods && (
                  <div>
                    <span className="font-medium text-text">Ability Scores: </span>
                    <span className="text-muted">{abilityMods}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-text">Vision: </span>
                  <span className="text-muted">
                    {race.vision === 'darkvision'
                      ? `Darkvision ${race.visionRange || 60}ft`
                      : race.vision === 'low-light'
                        ? 'Low-Light Vision'
                        : 'Normal'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-text">Languages: </span>
                  <span className="text-muted">
                    {race.languages.starting.length > 0
                      ? race.languages.starting.join(', ')
                      : 'Common'}
                  </span>
                </div>
              </div>

              {/* Expandable Details */}
              <button
                onClick={() => toggleExpanded(race.id)}
                className="mt-3 flex w-full items-center justify-between rounded border border-surface px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-surface"
              >
                <span>
                  {isExpanded ? 'Hide' : 'Show'} Racial Traits ({race.racialTraits.length})
                </span>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {isExpanded && (
                <div className="mt-3 max-h-64 space-y-3 overflow-y-auto rounded border border-surface bg-surface/50 p-3">
                  {race.racialTraits.map((trait) => (
                    <div key={trait.id} className="text-sm">
                      <div className="font-medium text-text">{trait.name}</div>
                      <div className="mt-1 text-muted">{trait.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
