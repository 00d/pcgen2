'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setAbilityScores, getCharacterById } from '@/redux/slices/characterSlice';
import PointBuyCalculator from '@/components/PointBuyCalculator';

export default function AbilitiesPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentCharacter, isLoading, error } = useAppSelector((state) => state.character);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentScores, setCurrentScores] = useState<Record<string, number>>({
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  });

  const characterId = params.id as string;

  // Load character on mount
  useEffect(() => {
    if (characterId) {
      dispatch(getCharacterById(characterId));
    }
  }, [characterId, dispatch]);

  if (!currentCharacter) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">Loading character...</p>
        </div>
      </div>
    );
  }

  const handleScoresChange = (scores: Record<string, number>) => {
    setCurrentScores(scores);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await dispatch(setAbilityScores({ characterId, scores: currentScores })).unwrap();
      router.push(`/create/feats/${characterId}`);
    } catch (err) {
      console.error('Failed to set ability scores:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const racialMods = currentCharacter.attributes.race
    ? currentCharacter.attributes.race.baseAbilityModifiers || {}
    : {};

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Step 3: Ability Scores</h1>
        <p className="text-gray-600">
          Customize your character's ability scores using the point buy system
        </p>
        <div className="mt-4 bg-blue-50 p-4 rounded border border-blue-200 text-sm">
          <strong>Character:</strong> {currentCharacter.name}
          <br />
          <strong>Race:</strong> {currentCharacter.attributes.race?.name}
          <br />
          <strong>Class:</strong> {currentCharacter.attributes.classes?.[0]?.name}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Point Buy Calculator */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <PointBuyCalculator
          racialModifiers={racialMods}
          onScoresChange={handleScoresChange}
        />
      </div>

      {/* Navigation */}
      <div className="flex gap-4 justify-between mt-8">
        <button
          onClick={() => router.push(`/create/class/${characterId}`)}
          className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          disabled={isSubmitting}
        >
          ← Previous
        </button>

        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
