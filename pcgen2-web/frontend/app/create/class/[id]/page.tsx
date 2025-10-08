'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { addCharacterClass } from '../../../../redux/slices/characterSlice';
import { fetchClasses } from '../../../../redux/slices/gameDataSlice';
import type { PClass } from '../../../../types/gameRules';

export default function SelectClassPage() {
  const params = useParams();
  const characterId = params.id as string;
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { token } = useAppSelector((state) => state.auth);
  const { currentCharacter, isLoading, error: characterError } = useAppSelector((state) => state.character);
  const { classes, isLoading: classesLoading, error: classesError } = useAppSelector((state) => state.gameData);

  const [selectedClass, setSelectedClass] = useState<PClass | null>(null);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch game data
    dispatch(fetchClasses());
  }, [token, dispatch, router]);

  const handleSelectClass = async () => {
    if (!selectedClass) return;

    const result = await dispatch(
      addCharacterClass({
        characterId,
        classId: selectedClass.id,
      })
    );

    if (addCharacterClass.fulfilled.match(result)) {
      // For now, redirect to dashboard. Later we'll go to abilities/feats/etc
      router.push('/dashboard');
    }
  };

  if (classesLoading) {
    return (
      <div className="text-center py-12">
        <div className="loading inline-block" style={{ width: '40px', height: '40px' }}></div>
        <p className="text-gray-600 mt-4">Loading classes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Select Class</h1>
      <p className="text-gray-600 mb-8">Step 2 of 2: Choose your character's class</p>

      {currentCharacter && (
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-8">
          <p className="text-blue-900">
            <strong>{currentCharacter.name}</strong> the <strong>{currentCharacter.attributes.race?.name}</strong>
          </p>
        </div>
      )}

      {classesError && <div className="text-error bg-red-50 p-3 rounded mb-6">{classesError}</div>}
      {characterError && <div className="text-error bg-red-50 p-3 rounded mb-6">{characterError}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {classes.map((pClass: PClass) => (
          <div
            key={pClass.id}
            onClick={() => setSelectedClass(pClass)}
            className={`p-6 rounded-lg cursor-pointer border-2 transition-all ${
              selectedClass?.id === pClass.id
                ? 'border-blue-600 bg-blue-50 shadow-lg'
                : 'border-gray-300 bg-white hover:border-gray-400'
            }`}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-3">{pClass.name}</h3>

            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <span className="font-medium">Hit Die:</span> {pClass.data.hitDie}
              </p>
              <p>
                <span className="font-medium">BAB:</span> {pClass.data.baseAttackBonusProgression}
              </p>
              <p>
                <span className="font-medium">Skills/Level:</span> {pClass.data.skillsPerLevel}
              </p>

              <div>
                <p className="font-medium">Saving Throws:</p>
                <ul className="space-y-1 mt-1">
                  <li>Fortitude: {pClass.data.savingThrows.fort}</li>
                  <li>Reflex: {pClass.data.savingThrows.ref}</li>
                  <li>Will: {pClass.data.savingThrows.will}</li>
                </ul>
              </div>

              {pClass.data.classAbilities && pClass.data.classAbilities.length > 0 && (
                <div>
                  <p className="font-medium">Class Abilities:</p>
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    {pClass.data.classAbilities.slice(0, 3).map((ability) => (
                      <li key={ability.id} className="text-xs">
                        {ability.name} (level {ability.level})
                      </li>
                    ))}
                    {pClass.data.classAbilities.length > 3 && (
                      <li className="text-xs text-gray-500">
                        +{pClass.data.classAbilities.length - 3} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => router.back()}
          className="btn btn-secondary"
        >
          Back
        </button>
        <button
          onClick={handleSelectClass}
          disabled={!selectedClass || isLoading}
          className="btn btn-primary"
        >
          {isLoading ? 'Creating...' : 'Create Character'}
        </button>
      </div>
    </div>
  );
}
