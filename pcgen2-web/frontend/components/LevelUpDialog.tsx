'use client';

import { useState } from 'react';
import axios from 'axios';

interface LevelUpDialogProps {
  characterId: string;
  currentLevel: number;
  isOpen: boolean;
  onClose: () => void;
  onLevelUp: (newCharacter: any) => void;
}

export default function LevelUpDialog({
  characterId,
  currentLevel,
  isOpen,
  onClose,
  onLevelUp,
}: LevelUpDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);
  const [advancement, setAdvancement] = useState<any>(null);

  const abilities = [
    { id: 'str', name: 'Strength' },
    { id: 'dex', name: 'Dexterity' },
    { id: 'con', name: 'Constitution' },
    { id: 'int', name: 'Intelligence' },
    { id: 'wis', name: 'Wisdom' },
    { id: 'cha', name: 'Charisma' },
  ];

  const handleLevelUp = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `/api/characters/${characterId}/level-up`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      setAdvancement(response.data.advancement);

      // If ability improvement is available and none selected, wait for selection
      if (response.data.advancement.abilityScoreImprovement && !selectedAbility) {
        // Dialog stays open for ability selection
      } else {
        onLevelUp(response.data.character);
        onClose();
      }
    } catch (error) {
      console.error('Level up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbilitySelection = async (ability: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `/api/characters/${characterId}/ability-improvement`,
        {
          level: currentLevel + 1,
          ability,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      onLevelUp(response.data.character);
      onClose();
    } catch (error) {
      console.error('Ability improvement error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Level Up!</h2>

        {!advancement ? (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded border border-blue-200">
              <p className="text-gray-700">
                <strong>Current Level:</strong> {currentLevel}
              </p>
              <p className="text-gray-700 mt-2">
                <strong>New Level:</strong> {currentLevel + 1}
              </p>
            </div>

            <p className="text-gray-600 text-sm">
              Your character is ready to advance to the next level. Click below to confirm the
              level up and learn about new abilities!
            </p>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLevelUp}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Leveling...' : 'Level Up'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded border border-green-200">
              <h3 className="font-bold text-green-900 mb-2">Advancement Summary</h3>
              <div className="text-sm text-green-800 space-y-1">
                <p>
                  <strong>New Level:</strong> {advancement.newLevel}
                </p>
                <p>
                  <strong>Hit Points:</strong> +{advancement.hitPointsGained}
                </p>
                <p>
                  <strong>Skill Points:</strong> +{advancement.skillPointsGained}
                </p>
                {advancement.bonusFeats && (
                  <p className="text-orange-600 font-bold">You gained a bonus feat!</p>
                )}
              </div>
            </div>

            {advancement.abilityScoreImprovement && (
              <div className="bg-purple-50 p-4 rounded border border-purple-200">
                <h3 className="font-bold text-purple-900 mb-3">Ability Score Improvement</h3>
                <p className="text-sm text-purple-800 mb-3">
                  Choose one ability score to increase by 1:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {abilities.map((ability) => (
                    <button
                      key={ability.id}
                      onClick={() => handleAbilitySelection(ability.id)}
                      disabled={isLoading}
                      className={`p-2 rounded text-sm font-semibold transition ${
                        selectedAbility === ability.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-white border border-purple-300 text-purple-900 hover:border-purple-500'
                      } disabled:opacity-50`}
                    >
                      {ability.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {!advancement.abilityScoreImprovement ? (
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Done
                </button>
              ) : (
                <p className="text-sm text-gray-600 text-center w-full">
                  Please select an ability to improve
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
