'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { getCharacterById, setAbilityScores } from '@/redux/slices/characterSlice';
import PointBuyCalculator from '@/components/PointBuyCalculator';
import Link from 'next/link';

export default function CharacterEditAbilitiesPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const characterId = params.id as string;

  const { currentCharacter: character, isLoading, error } = useAppSelector((state) => state.character);
  const { user } = useAppSelector((state) => state.auth);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (characterId && user?.id) {
      dispatch(getCharacterById({ characterId, userId: user.id }) as any);
    }
  }, [characterId, user?.id, dispatch]);

  const handleScoresChange = async (scores: Record<string, number>) => {
    setSaving(true);
    try {
      await dispatch(setAbilityScores({ characterId, scores }) as any).unwrap();
      router.push(`/characters/${characterId}/view`);
    } catch (err) {
      console.error('Failed to save ability scores:', err);
      alert('Failed to save ability scores. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading character...</div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-2xl text-red-600 mb-4">Error loading character</div>
        <div className="text-gray-600 mb-6">{error}</div>
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const raceName = typeof character.attributes?.race === 'object'
    ? character.attributes.race.name
    : 'No Race';

  const racialModifiers = typeof character.attributes?.race === 'object'
    ? character.attributes.race.baseAbilityModifiers
    : undefined;

  const className = character.attributes?.classes?.[0]?.name || 'No Class';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Edit Ability Scores</h1>
          <p className="text-blue-100">
            {character.name} — {raceName} {className}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <p className="text-gray-600 mb-6">
            Adjust your ability scores using the point buy system. You have 15 points to distribute
            across six abilities (8-15 each).
          </p>

          {character.attributes?.abilityScores && (
            <PointBuyCalculator
              racialModifiers={racialModifiers}
              onScoresChange={handleScoresChange}
            />
          )}

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> You can also use the standard array (15, 14, 13, 12, 10, 8)
              or adjust individual scores. Racial modifiers are applied automatically.
            </p>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-between">
            <Link
              href={`/characters/${characterId}/view`}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors"
            >
              ← Cancel
            </Link>
            <button
              disabled={saving}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                saving
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {saving ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
