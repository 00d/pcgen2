'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { getCharacterById, addSpell, fetchSpells } from '@/redux/slices/characterSlice';
import SpellSelector from '@/components/SpellSelector';
import Link from 'next/link';

export default function CharacterEditSpellsPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const characterId = params.id as string;

  const { currentCharacter: character, isLoading, error } = useAppSelector((state) => state.character);
  const { user } = useAppSelector((state) => state.auth);
  const { spells } = useAppSelector((state) => state.gameData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (characterId && user?.id) {
      dispatch(getCharacterById({ characterId, userId: user.id }) as any);
      dispatch(fetchSpells() as any);
    }
  }, [characterId, user?.id, dispatch]);

  const handleSpellsChange = async (selectedSpells: any[]) => {
    setSaving(true);
    try {
      await dispatch(addSpell({ characterId, spells: selectedSpells }) as any).unwrap();
      router.push(`/characters/${characterId}/view`);
    } catch (err) {
      console.error('Failed to save spells:', err);
      alert('Failed to save spells. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-2xl text-red-600 mb-4">Error loading character</div>
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 font-medium">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const raceName = typeof character.attributes?.race === 'object'
    ? character.attributes.race.name
    : 'No Race';

  const className = character.attributes?.classes?.[0]?.name || 'No Class';

  // Check if character is a spellcaster
  const isSpellcaster = ['Cleric', 'Druid', 'Sorcerer', 'Wizard'].includes(className);

  if (!isSpellcaster) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-2xl text-gray-800 mb-4">Not a Spellcaster</div>
        <p className="text-gray-600 mb-6">{className} is not a spellcasting class.</p>
        <Link href={`/characters/${characterId}/view`} className="text-blue-600 hover:text-blue-800 font-medium">
          ← Back to Character
        </Link>
      </div>
    );
  }

  // Calculate spell slots
  const spellModifier = Math.floor(
    ((className === 'Sorcerer'
      ? character.attributes?.abilityScores?.cha?.total
      : character.attributes?.abilityScores?.wis?.total) || 10) - 10) / 2
  );

  const maxSpellsPerLevel: Record<number, number> = {
    0: Infinity, // Cantrips unlimited
    1: 1 + Math.max(0, spellModifier),
    2: 1 + Math.max(0, spellModifier),
    3: 1 + Math.max(0, spellModifier),
  };

  const selectedSpells = character.spells?.spellsKnown || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Edit Spells</h1>
          <p className="text-blue-100">
            {character.name} — {raceName} {className}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <p className="text-gray-600 mb-6">
            Select spells for your {className}. You can prepare/know the spells shown below based on
            your spell slots.
          </p>

          <SpellSelector
            spells={spells}
            selectedSpells={selectedSpells}
            maxSpellsPerLevel={maxSpellsPerLevel}
            onSpellsChange={handleSpellsChange}
          />

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-gray-700">
              <strong>Spell Slot Calculation:</strong>
              <br />
              You have spell slots based on your ability modifier. Cantrips are unlimited.
              <br />
              <strong>Your modifier:</strong> {spellModifier >= 0 ? '+' : ''}{spellModifier}
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
