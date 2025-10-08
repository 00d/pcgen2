'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { addFeat, setSkillRanks, getCharacterById } from '@/redux/slices/characterSlice';
import { fetchFeats, fetchSkills } from '@/redux/slices/gameDataSlice';
import FeatSelector from '@/components/FeatSelector';
import SkillAllocator from '@/components/SkillAllocator';

export default function FeatsPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentCharacter, isLoading, error } = useAppSelector((state) => state.character);
  const { feats, skills } = useAppSelector((state) => state.gameData);
  const [selectedFeats, setSelectedFeats] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'feats' | 'skills'>('feats');

  const characterId = params.id as string;

  // Load character, feats, and skills on mount
  useEffect(() => {
    if (characterId) {
      dispatch(getCharacterById(characterId));
    }
    dispatch(fetchFeats());
    dispatch(fetchSkills());
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
  const skillsPerLevel = characterClass?.baseSkillsPerLevel || 2;
  const classSkillCount = skillsPerLevel;
  const intMod = currentCharacter.attributes.abilityScores?.int?.total || 10;
  const intModifier = Math.floor((intMod - 10) / 2);
  const totalSkillPoints = classSkillCount + intModifier;

  const abilityModifiers: Record<string, number> = {};
  ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach((ability) => {
    const score = currentCharacter.attributes.abilityScores?.[ability as any]?.total || 10;
    abilityModifiers[ability] = Math.floor((score - 10) / 2);
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Note: In a real implementation, you would also handle skill rank submission
      // For now, this just moves to the next step
      router.push(`/create/equipment/${characterId}`);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Step 4: Feats & Skills</h1>
        <p className="text-gray-600">
          Select your character feats and allocate skill ranks
        </p>
        <div className="mt-4 bg-blue-50 p-4 rounded border border-blue-200 text-sm">
          <strong>Character:</strong> {currentCharacter.name}
          <br />
          <strong>Class:</strong> {characterClass?.name}
          <br />
          <strong>Skill Points:</strong> {totalSkillPoints} ({classSkillCount} class + {intModifier} INT modifier)
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('feats')}
          className={`px-4 py-2 font-bold ${
            activeTab === 'feats'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Feats
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`px-4 py-2 font-bold ${
            activeTab === 'skills'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Skills
        </button>
      </div>

      {/* Content */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        {activeTab === 'feats' && (
          <FeatSelector
            feats={feats}
            selectedFeats={selectedFeats}
            maxFeats={1} // 1 feat at 1st level
            onFeatSelect={(featId) => setSelectedFeats([...selectedFeats, featId])}
            onFeatDeselect={(featId) => setSelectedFeats(selectedFeats.filter((id) => id !== featId))}
          />
        )}

        {activeTab === 'skills' && (
          <SkillAllocator
            skills={skills}
            classSkills={[]} // TODO: Get from class definition
            abilityModifiers={abilityModifiers}
            maxRanksPerSkill={1} // 1st level character
            totalSkillPoints={totalSkillPoints}
            onSkillsChange={(skillAllocations) => {
              // Skills will be submitted with the form
            }}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-4 justify-between mt-8">
        <button
          onClick={() => router.push(`/create/abilities/${characterId}`)}
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
