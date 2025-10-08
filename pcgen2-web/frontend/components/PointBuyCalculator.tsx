'use client';

import { useState, useEffect } from 'react';

interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

interface RacialModifiers {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

interface Props {
  racialModifiers?: RacialModifiers;
  onScoresChange: (scores: AbilityScores) => void;
  onPointsChange?: (remainingPoints: number) => void;
}

// Point buy cost table (Pathfinder standard)
const POINT_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 6,
  15: 7,
};

const STANDARD_ARRAY = { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 };
const TOTAL_POINTS = 15;

export default function PointBuyCalculator({ racialModifiers = {}, onScoresChange, onPointsChange }: Props) {
  const [scores, setScores] = useState<AbilityScores>({
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  });

  const [useStandardArray, setUseStandardArray] = useState(false);

  const defaultMods: RacialModifiers = {
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0,
    ...racialModifiers,
  };

  // Calculate total points spent
  const calculatePointsSpent = (currentScores: AbilityScores): number => {
    return Object.values(currentScores).reduce((sum, score) => sum + (POINT_COSTS[score] || 0), 0);
  };

  const pointsSpent = calculatePointsSpent(scores);
  const remainingPoints = TOTAL_POINTS - pointsSpent;

  // Calculate ability modifiers
  const getModifier = (ability: number): number => {
    return Math.floor((ability - 10) / 2);
  };

  const getTotalScore = (ability: keyof AbilityScores): number => {
    return scores[ability] + (defaultMods[ability] || 0);
  };

  // Handle score change
  const handleScoreChange = (ability: keyof AbilityScores, newScore: number) => {
    if (newScore < 8 || newScore > 15) return;

    const newScores = { ...scores, [ability]: newScore };
    const newPointsSpent = calculatePointsSpent(newScores);

    // Only allow if we have enough points
    if (newPointsSpent <= TOTAL_POINTS) {
      setScores(newScores);
      onScoresChange(newScores);
      onPointsChange?.(TOTAL_POINTS - newPointsSpent);
    }
  };

  // Apply standard array
  const applyStandardArray = () => {
    setScores(STANDARD_ARRAY);
    setUseStandardArray(true);
    onScoresChange(STANDARD_ARRAY);
    onPointsChange?.(0);
  };

  // Reset to defaults
  const reset = () => {
    const defaults: AbilityScores = {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    };
    setScores(defaults);
    setUseStandardArray(false);
    onScoresChange(defaults);
    onPointsChange?.(TOTAL_POINTS);
  };

  const abilities: (keyof AbilityScores)[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
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
      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={applyStandardArray}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Use Standard Array
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reset
        </button>
        <div className={`px-4 py-2 rounded font-bold ${remainingPoints >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          Points Remaining: {remainingPoints}
        </div>
      </div>

      {/* Point Buy Info */}
      <div className="bg-gray-100 p-4 rounded text-sm">
        <p className="font-bold mb-2">Point Buy Costs:</p>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(POINT_COSTS).map(([score, cost]) => (
            <div key={score} className="text-center">
              <div className="font-bold">{score}</div>
              <div className="text-gray-600">{cost} pts</div>
            </div>
          ))}
        </div>
      </div>

      {/* Ability Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {abilities.map((ability) => (
          <div key={ability} className="border rounded p-4 bg-white">
            <label className="block font-bold mb-3 uppercase text-sm">{abilityNames[ability]}</label>

            <div className="space-y-3">
              {/* Base Score Input */}
              <div>
                <label className="text-sm text-gray-600">Base Score</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleScoreChange(ability, scores[ability] - 1)}
                    disabled={scores[ability] <= 8}
                    className="px-2 py-1 bg-gray-300 rounded disabled:opacity-50"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="8"
                    max="15"
                    value={scores[ability]}
                    onChange={(e) => handleScoreChange(ability, parseInt(e.target.value))}
                    className="flex-1 text-center border rounded py-1 px-2"
                  />
                  <button
                    onClick={() => handleScoreChange(ability, scores[ability] + 1)}
                    disabled={scores[ability] >= 15}
                    className="px-2 py-1 bg-gray-300 rounded disabled:opacity-50"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-600 ml-2">({POINT_COSTS[scores[ability]] || 0} pts)</span>
                </div>
              </div>

              {/* Racial Modifier */}
              {defaultMods[ability] !== 0 && (
                <div>
                  <label className="text-sm text-gray-600">Racial Bonus</label>
                  <div className="text-center text-sm font-bold text-blue-600">
                    {defaultMods[ability] > 0 ? '+' : ''}{defaultMods[ability]}
                  </div>
                </div>
              )}

              {/* Total Score and Modifier */}
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Score:</span>
                  <span className="text-lg font-bold">{getTotalScore(ability)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-600">Modifier:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {getModifier(getTotalScore(ability)) >= 0 ? '+' : ''}{getModifier(getTotalScore(ability))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 p-4 rounded border border-blue-200">
        <h3 className="font-bold mb-3">Score Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          {abilities.map((ability) => (
            <div key={ability} className="flex justify-between">
              <span className="font-bold uppercase">{ability}:</span>
              <span>
                {getTotalScore(ability)} ({getModifier(getTotalScore(ability)) >= 0 ? '+' : ''}{getModifier(getTotalScore(ability))})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
