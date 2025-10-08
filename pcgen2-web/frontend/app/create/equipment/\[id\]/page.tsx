'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { addEquipment, getCharacterById } from '@/redux/slices/characterSlice';
import { fetchEquipment } from '@/redux/slices/gameDataSlice';
import { EquipmentSelection } from '@/types/character';
import EquipmentSelector from '@/components/EquipmentSelector';

export default function EquipmentPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentCharacter, isLoading, error } = useAppSelector((state) => state.character);
  const { equipment } = useAppSelector((state) => state.gameData);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentSelection[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const characterId = params.id as string;

  // Load character and equipment on mount
  useEffect(() => {
    if (characterId) {
      dispatch(getCharacterById(characterId));
    }
    dispatch(fetchEquipment());
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

  const strScore = currentCharacter.attributes.abilityScores?.str?.total || 10;
  const isSpellcaster = ['Cleric', 'Druid', 'Sorcerer', 'Wizard'].includes(
    currentCharacter.attributes.classes?.[0]?.name || ''
  );

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await dispatch(addEquipment({ characterId, equipment: selectedEquipment })).unwrap();

      // If spellcaster, go to spells page; otherwise go to finish
      if (isSpellcaster) {
        router.push(`/create/spells/${characterId}`);
      } else {
        router.push(`/create/finish/${characterId}`);
      }
    } catch (err) {
      console.error('Failed to save equipment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Step 5: Equipment</h1>
        <p className="text-gray-600">
          Select your starting equipment and track your carrying capacity
        </p>
        <div className="mt-4 bg-blue-50 p-4 rounded border border-blue-200 text-sm">
          <strong>Character:</strong> {currentCharacter.name}
          <br />
          <strong>Class:</strong> {currentCharacter.attributes.classes?.[0]?.name}
          <br />
          <strong>STR Score:</strong> {strScore} (Carrying Capacity Limit: {strScore * 30} lbs)
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Equipment Selector */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <EquipmentSelector
          equipment={equipment}
          selectedEquipment={selectedEquipment}
          strScore={strScore}
          onEquipmentChange={setSelectedEquipment}
        />
      </div>

      {/* Navigation */}
      <div className="flex gap-4 justify-between mt-8">
        <button
          onClick={() => router.push(`/create/feats/${characterId}`)}
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
          {isSubmitting ? 'Saving...' : isSpellcaster ? 'Next (Spells) →' : 'Next (Review) →'}
        </button>
      </div>
    </div>
  );
}
