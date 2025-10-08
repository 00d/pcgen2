'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { getCharacterById, addEquipment, fetchEquipment } from '@/redux/slices/characterSlice';
import EquipmentSelector from '@/components/EquipmentSelector';
import Link from 'next/link';

export default function CharacterEditEquipmentPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const characterId = params.id as string;

  const { currentCharacter: character, isLoading, error } = useAppSelector((state) => state.character);
  const { user } = useAppSelector((state) => state.auth);
  const { equipment } = useAppSelector((state) => state.gameData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (characterId && user?.id) {
      dispatch(getCharacterById({ characterId, userId: user.id }) as any);
      dispatch(fetchEquipment() as any);
    }
  }, [characterId, user?.id, dispatch]);

  const handleEquipmentChange = async (selectedEquipment: any[]) => {
    setSaving(true);
    try {
      await dispatch(addEquipment({ characterId, equipment: selectedEquipment }) as any).unwrap();
      router.push(`/characters/${characterId}/view`);
    } catch (err) {
      console.error('Failed to save equipment:', err);
      alert('Failed to save equipment. Please try again.');
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
  const strScore = character.attributes?.abilityScores?.str?.total || 10;

  const selectedEquipment = character.equipment || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Edit Equipment</h1>
          <p className="text-blue-100">
            {character.name} — {raceName} {className}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <p className="text-gray-600 mb-6">
            Select and manage your character's equipment. Encumbrance is calculated based on your
            Strength score ({strScore}).
          </p>

          <EquipmentSelector
            equipment={equipment}
            selectedEquipment={selectedEquipment}
            strScore={strScore}
            onEquipmentChange={handleEquipmentChange}
          />

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-gray-700">
              <strong>Encumbrance Limits:</strong>
              <br />
              • Light Load: ≤ STR × 10 lbs ({strScore * 10} lbs for you)
              <br />
              • Medium Load: STR × 10 to × 20 ({strScore * 10}–{strScore * 20} lbs)
              <br />
              • Heavy Load: STR × 20 to × 30 ({strScore * 20}–{strScore * 30} lbs)
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
