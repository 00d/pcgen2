'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateCreationData } from '@/store/slices/characterSlice';
import { loadRaces } from '@/lib/data-loaders';
import type { AbilityScores, AbilityScore } from '@/types';
import type { PF1ERace } from '@/types/pathfinder1e';
import { ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';

const ABILITY_NAMES: Record<AbilityScore, string> = {
  STR: 'Strength',
  DEX: 'Dexterity',
  CON: 'Constitution',
  INT: 'Intelligence',
  WIS: 'Wisdom',
  CHA: 'Charisma',
};

const POINT_BUY_COSTS: Record<number, number> = {
  7: -4,
  8: -2,
  9: -1,
  10: 0,
  11: 1,
  12: 2,
  13: 3,
  14: 5,
  15: 7,
  16: 10,
  17: 13,
  18: 17,
};

const MAX_POINTS = 25; // Standard Point Buy

export function AbilityScoresStep() {
  const dispatch = useAppDispatch();
  const creationData = useAppSelector((state) => state.character.creation.data);
  const selectedRaceId = (creationData as any).race;

  const [showHelp, setShowHelp] = useState(false);
  const [selectedRace, setSelectedRace] = useState<PF1ERace | null>(null);
  const [baseScores, setBaseScores] = useState<AbilityScores>({
    STR: 10,
    DEX: 10,
    CON: 10,
    INT: 10,
    WIS: 10,
    CHA: 10,
  });

  useEffect(() => {
    if (selectedRaceId) {
      loadRaces().then((races) => {
        const race = races.find((r) => r.id === selectedRaceId);
        if (race) {
          setSelectedRace(race);
        }
      });
    }
  }, [selectedRaceId]);

  useEffect(() => {
    // Update Redux store whenever scores change
    const finalScores = getFinalScores();
    dispatch(updateCreationData({ abilityScores: finalScores }));
  }, [baseScores, selectedRace, dispatch]);

  const calculatePointsSpent = (): number => {
    return Object.values(baseScores).reduce((total, score) => {
      return total + POINT_BUY_COSTS[score];
    }, 0);
  };

  const pointsRemaining = MAX_POINTS - calculatePointsSpent();

  const canIncrease = (ability: AbilityScore): boolean => {
    const currentScore = baseScores[ability];
    if (currentScore >= 18) return false;
    const nextScore = currentScore + 1;
    const cost = POINT_BUY_COSTS[nextScore] - POINT_BUY_COSTS[currentScore];
    return pointsRemaining >= cost;
  };

  const canDecrease = (ability: AbilityScore): boolean => {
    return baseScores[ability] > 7;
  };

  const handleIncrease = (ability: AbilityScore) => {
    if (canIncrease(ability)) {
      setBaseScores({
        ...baseScores,
        [ability]: baseScores[ability] + 1,
      });
    }
  };

  const handleDecrease = (ability: AbilityScore) => {
    if (canDecrease(ability)) {
      setBaseScores({
        ...baseScores,
        [ability]: baseScores[ability] - 1,
      });
    }
  };

  const getRacialModifier = (ability: AbilityScore): number => {
    if (!selectedRace) return 0;
    return selectedRace.abilityScoreModifiers[ability] || 0;
  };

  const getFinalScore = (ability: AbilityScore): number => {
    return baseScores[ability] + getRacialModifier(ability);
  };

  const getFinalScores = (): AbilityScores => {
    return {
      STR: getFinalScore('STR'),
      DEX: getFinalScore('DEX'),
      CON: getFinalScore('CON'),
      INT: getFinalScore('INT'),
      WIS: getFinalScore('WIS'),
      CHA: getFinalScore('CHA'),
    };
  };

  const getModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  const formatModifier = (mod: number): string => {
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-text">Ability Scores</h2>
        <p className="text-muted">
          Assign your character's ability scores using the Point Buy system (25 points).
        </p>
      </div>

      {/* Points Remaining */}
      <div className="rounded-lg border-2 border-primary bg-primary/10 p-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium text-text">Points Remaining</span>
          <span
            className={`text-2xl font-bold ${
              pointsRemaining < 0 ? 'text-red-500' : 'text-primary'
            }`}
          >
            {pointsRemaining} / {MAX_POINTS}
          </span>
        </div>
      </div>

      {/* Help Section */}
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="flex w-full items-center justify-between rounded border border-surface bg-background px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-surface"
      >
        <span>Point Buy Rules</span>
        {showHelp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {showHelp && (
        <div className="rounded border border-surface bg-surface/50 p-4 text-sm text-muted">
          <p className="mb-2">
            <strong className="text-text">Point Buy System:</strong> You have {MAX_POINTS} points
            to distribute among your ability scores.
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>All abilities start at 10</li>
            <li>Minimum score: 7, Maximum score: 18</li>
            <li>Higher scores cost more points (exponential cost)</li>
            <li>Racial modifiers are applied after point buy</li>
          </ul>
          <div className="mt-3">
            <strong className="text-text">Cost Table:</strong>
            <div className="mt-1 grid grid-cols-6 gap-1 text-xs">
              {Object.entries(POINT_BUY_COSTS).map(([score, cost]) => (
                <div key={score} className="rounded bg-background p-1 text-center">
                  <div className="font-medium text-text">{score}</div>
                  <div className="text-muted">{cost >= 0 ? cost : `${cost}`}pt</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ability Scores */}
      <div className="space-y-3">
        {(Object.keys(ABILITY_NAMES) as AbilityScore[]).map((ability) => {
          const baseScore = baseScores[ability];
          const racialMod = getRacialModifier(ability);
          const finalScore = getFinalScore(ability);
          const modifier = getModifier(finalScore);

          return (
            <div
              key={ability}
              className="flex items-center justify-between rounded-lg border border-surface bg-background p-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-bold text-text">{ABILITY_NAMES[ability]}</div>
                    <div className="text-xs text-muted">{ability}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDecrease(ability)}
                    disabled={!canDecrease(ability)}
                    className="rounded border border-surface bg-background p-2 text-text transition-colors hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus size={16} />
                  </button>
                  <div className="w-12 text-center text-xl font-bold text-text">{baseScore}</div>
                  <button
                    onClick={() => handleIncrease(ability)}
                    disabled={!canIncrease(ability)}
                    className="rounded border border-surface bg-background p-2 text-text transition-colors hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Racial Modifier */}
                {racialMod !== 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-muted">+</span>
                    <span className={`font-medium ${racialMod > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {racialMod > 0 ? `+${racialMod}` : racialMod}
                    </span>
                    <span className="text-muted">racial</span>
                  </div>
                )}

                {/* Final Score */}
                <div className="flex items-center gap-2 rounded bg-primary/20 px-4 py-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-text">{finalScore}</div>
                    <div className="text-sm text-muted">{formatModifier(modifier)}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Race Info */}
      {selectedRace && (
        <div className="rounded border border-surface bg-surface/50 p-3 text-sm">
          <span className="font-medium text-text">Selected Race: </span>
          <span className="text-muted">{selectedRace.name}</span>
          {Object.keys(selectedRace.abilityScoreModifiers).length > 0 && (
            <span className="text-muted">
              {' '}
              (
              {Object.entries(selectedRace.abilityScoreModifiers)
                .map(([ability, mod]) => `${mod > 0 ? '+' : ''}${mod} ${ability}`)
                .join(', ')}
              )
            </span>
          )}
        </div>
      )}

      {!selectedRaceId && (
        <div className="rounded border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-600">
          <strong>Note:</strong> You haven't selected a race yet. Racial ability modifiers will be
          applied when you choose a race.
        </div>
      )}
    </div>
  );
}
