'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { finishCharacter, getCharacterById } from '@/redux/slices/characterSlice';
import CharacterSummary from '@/components/CharacterSummary';

export default function FinishPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentCharacter, isLoading, error } = useAppSelector((state) => state.character);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const characterId = params.id as string;

  // Load character on mount
  useEffect(() => {
    if (characterId) {
      dispatch(getCharacterById(characterId));
    }
  }, [characterId, dispatch]);

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await dispatch(finishCharacter(characterId)).unwrap();
      setSaveSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Failed to finish character:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentCharacter) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">Loading character...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Step 6: Review & Finish</h1>
        <p className="text-gray-600">
          Review your character details and finish character creation
        </p>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          ✓ Character saved successfully! Redirecting to dashboard...
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Character Summary */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-8">
        <CharacterSummary
          character={currentCharacter}
          onEditSection={(section) => {
            // Navigate to the appropriate editing page
            const sectionRoutes: Record<string, string> = {
              race: `/create/race/${characterId}`,
              abilities: `/create/abilities/${characterId}`,
              feats: `/create/feats/${characterId}`,
              equipment: `/create/equipment/${characterId}`,
              spells: `/create/spells/${characterId}`,
            };
            if (sectionRoutes[section]) {
              router.push(sectionRoutes[section]);
            }
          }}
        />
      </div>

      {/* Navigation */}
      <div className="flex gap-4 justify-between">
        <button
          onClick={() => {
            // Determine which page to go back to
            const isSpellcaster = ['Cleric', 'Druid', 'Sorcerer', 'Wizard'].includes(
              currentCharacter.attributes.classes?.[0]?.name || ''
            );
            if (isSpellcaster) {
              router.push(`/create/spells/${characterId}`);
            } else {
              router.push(`/create/equipment/${characterId}`);
            }
          }}
          className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          disabled={isSubmitting || saveSuccess}
        >
          ← Previous
        </button>

        <button
          onClick={handleFinish}
          className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          disabled={isSubmitting || saveSuccess}
        >
          {isSubmitting ? 'Saving...' : '✓ Finish & Save Character'}
        </button>
      </div>

      {/* Character Creation Complete */}
      {saveSuccess && (
        <div className="mt-8 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <p className="text-xl font-bold text-green-600">Character Created Successfully!</p>
          <p className="text-gray-600 mt-2">Your character will appear on your dashboard.</p>
        </div>
      )}
    </div>
  );
}
