'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { getCharacterById, addFeat, setSkillRanks, fetchFeats, fetchSkills } from '@/redux/slices/characterSlice';
import FeatSelector from '@/components/FeatSelector';
import SkillAllocator from '@/components/SkillAllocator';
import Link from 'next/link';

export default function CharacterEditFeatsPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const characterId = params.id as string;

  const { currentCharacter: character, isLoading, error } = useAppSelector((state) => state.character);
  const { user } = useAppSelector((state) => state.auth);
  const { feats, skills } = useAppSelector((state) => state.gameData);
  const [activeTab, setActiveTab] = useState<'feats' | 'skills'>('feats');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (characterId && user?.id) {
      dispatch(getCharacterById({ characterId, userId: user.id }) as any);
      dispatch(fetchFeats() as any);
      dispatch(fetchSkills() as any);
    }
  }, [characterId, user?.id, dispatch]);

  const handleFeatSelect = (featId: string) => {
    const feat = feats.find((f) => f.id === featId);
    if (feat) {
      dispatch(
        addFeat({
          characterId,
          feat: {
            featId: feat.id,
            name: feat.name,
            type: feat.data.type,
            benefit: feat.data.benefit,
          },
        }) as any
      );
    }
  };

  const handleSkillsChange = async (allocations: any[]) => {
    setSaving(true);
    try {
      await dispatch(setSkillRanks({ characterId, skills: allocations }) as any).unwrap();
      router.push(`/characters/${characterId}/view`);
    } catch (err) {
      console.error('Failed to save skills:', err);
      alert('Failed to save skills. Please try again.');
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
  const skillsPerLevel = character.attributes?.classes?.[0]?.baseSkillsPerLevel || 2;
  const intMod = Math.floor(
    ((character.attributes?.abilityScores?.int?.total || 10) - 10) / 2
  );
  const totalSkillPoints = skillsPerLevel + Math.max(0, intMod);

  const selectedFeatIds = character.feats?.map((f) => f.featId) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Edit Feats & Skills</h1>
          <p className="text-blue-100">
            {character.name} — {raceName} {className}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('feats')}
              className={`py-4 px-2 font-medium border-b-2 transition-colors ${
                activeTab === 'feats'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Feats
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`py-4 px-2 font-medium border-b-2 transition-colors ${
                activeTab === 'skills'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Skills
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {activeTab === 'feats' && (
          <div className="bg-white rounded-lg shadow p-8">
            <p className="text-gray-600 mb-6">
              Select feats for your character. You can choose {1} feat at 1st level.
            </p>
            <FeatSelector
              feats={feats}
              selectedFeats={selectedFeatIds}
              maxFeats={1}
              onFeatSelect={handleFeatSelect}
              onFeatDeselect={() => {}}
            />
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="bg-white rounded-lg shadow p-8">
            <p className="text-gray-600 mb-6">
              You have {totalSkillPoints} skill points to allocate ({skillsPerLevel} base + {intMod} INT
              modifier).
            </p>
            <SkillAllocator
              skills={skills}
              classSkills={character.attributes?.classes?.[0]?.classAbilities || []}
              abilityModifiers={{
                str: Math.floor(((character.attributes?.abilityScores?.str?.total || 10) - 10) / 2),
                dex: Math.floor(((character.attributes?.abilityScores?.dex?.total || 10) - 10) / 2),
                con: Math.floor(((character.attributes?.abilityScores?.con?.total || 10) - 10) / 2),
                int: intMod,
                wis: Math.floor(((character.attributes?.abilityScores?.wis?.total || 10) - 10) / 2),
                cha: Math.floor(((character.attributes?.abilityScores?.cha?.total || 10) - 10) / 2),
              }}
              maxRanksPerSkill={1}
              totalSkillPoints={totalSkillPoints}
              onSkillsChange={handleSkillsChange}
            />
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex justify-between">
          <Link
            href={`/characters/${characterId}/view`}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors"
          >
            ← Cancel
          </Link>
          <button
            disabled={saving || activeTab === 'feats'}
            onClick={() => {
              setActiveTab('skills');
            }}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              saving || activeTab === 'feats'
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {activeTab === 'feats' ? 'Next: Skills →' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
