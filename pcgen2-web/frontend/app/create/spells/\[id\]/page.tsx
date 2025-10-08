'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { addSpell, getCharacterById } from '@/redux/slices/characterSlice';
import { fetchSpells } from '@/redux/slices/gameDataSlice';
import { SpellSelection } from '@/types/character';
import SpellSelector from '@/components/SpellSelector';

export default function SpellsPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentCharacter, isLoading, error } = useAppSelector((state) => state.character);
  const { spells } = useAppSelector((state) => state.gameData);
  const [selectedSpells, setSelectedSpells] = useState<SpellSelection[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const characterId = params.id as string;

  // Load character and spells on mount
  useEffect(() => {
    if (characterId) {
      dispatch(getCharacterById(characterId));
    }
    dispatch(fetchSpells());
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

  const characterClass = currentCharacter.attributes.classes?.[0];

  // Determine spell slots based on class and level
  // For 1st level characters:
  // - Cantrips (level 0): Unlimited
  // - 1st level spells: 1 + (CHA/WIS mod if applicable)
  const chaScore = currentCharacter.attributes.abilityScores?.cha?.total || 10;
  const wisScore = currentCharacter.attributes.abilityScores?.wis?.total || 10;
  const spellMod = Math.max(0, Math.floor((chaScore - 10) / 2)) || Math.floor((wisScore - 10) / 2);

  const maxSpellsPerLevel: Record<number, number> = {
    0: 999, // Unlimited cantrips
    1: 1 + Math.max(0, spellMod),
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await dispatch(addSpell({ characterId, spells: selectedSpells })).unwrap();
      router.push(`/create/finish/${characterId}`);
    } catch (err) {
      console.error('Failed to save spells:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Step 5b: Spells</h1>
        <p className="text-gray-600">
          Select spells for your spellcasting abilities
        </p>
        <div className="mt-4 bg-blue-50 p-4 rounded border border-blue-200 text-sm">
          <strong>Character:</strong> {currentCharacter.name}
          <br />
          <strong>Class:</strong> {characterClass?.name}
          <br />
          <strong>Spell Modifier:</strong> {spellMod >= 0 ? '+' : ''}{spellMod}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Spell Selector */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <SpellSelector
          spells={spells}
          selectedSpells={selectedSpells}
          maxSpellsPerLevel={maxSpellsPerLevel}
          onSpellsChange={setSelectedSpells}
        />
      </div>

      {/* Navigation */}
      <div className="flex gap-4 justify-between mt-8">
        <button
          onClick={() => router.push(`/create/equipment/${characterId}`)}
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
          {isSubmitting ? 'Saving...' : 'Next (Review) →'}
        </button>
      </div>
    </div>
  );
}
