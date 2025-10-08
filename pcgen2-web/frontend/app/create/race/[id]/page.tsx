'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { fetchRaces, setCharacterRace } from '../../../../redux/slices/characterSlice';
import { fetchRaces as fetchRacesGameData } from '../../../../redux/slices/gameDataSlice';
import type { Race } from '../../../../types/gameRules';

export default function SelectRacePage() {
  const params = useParams();
  const characterId = params.id as string;
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { token } = useAppSelector((state) => state.auth);
  const { currentCharacter, isLoading, error: characterError } = useAppSelector((state) => state.character);
  const { races, isLoading: racesLoading, error: racesError } = useAppSelector((state) => state.gameData);

  const [selectedRace, setSelectedRace] = useState<Race | null>(null);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch game data
    dispatch(fetchRacesGameData());
  }, [token, dispatch, router]);

  const handleSelectRace = async () => {
    if (!selectedRace) return;

    const result = await dispatch(
      setCharacterRace({
        characterId,
        raceId: selectedRace.id,
      })
    );

    if (setCharacterRace.fulfilled.match(result)) {
      router.push(`/create/class/${characterId}`);
    }
  };

  if (racesLoading) {
    return (
      <div className="text-center py-12">
        <div className="loading inline-block" style={{ width: '40px', height: '40px' }}></div>
        <p className="text-gray-600 mt-4">Loading races...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Select Race</h1>
      <p className="text-gray-600 mb-8">Step 1 of 2: Choose your character's race</p>

      {racesError && <div className="text-error bg-red-50 p-3 rounded mb-6">{racesError}</div>}
      {characterError && <div className="text-error bg-red-50 p-3 rounded mb-6">{characterError}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {races.map((race: Race) => (
          <div
            key={race.id}
            onClick={() => setSelectedRace(race)}
            className={`p-6 rounded-lg cursor-pointer border-2 transition-all ${
              selectedRace?.id === race.id
                ? 'border-blue-600 bg-blue-50 shadow-lg'
                : 'border-gray-300 bg-white hover:border-gray-400'
            }`}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-3">{race.name}</h3>

            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <span className="font-medium">Size:</span> {race.data.size}
              </p>
              <p>
                <span className="font-medium">Speed:</span> {race.data.speed} ft.
              </p>
              <p>
                <span className="font-medium">Languages:</span> {race.data.languages.join(', ')}
              </p>

              {race.data.traits && race.data.traits.length > 0 && (
                <div>
                  <p className="font-medium mb-1">Traits:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {race.data.traits.map((trait) => (
                      <li key={trait.id}>{trait.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {race.data.abilityAdjustments && Object.keys(race.data.abilityAdjustments).length > 0 && (
                <div>
                  <p className="font-medium">Ability Adjustments:</p>
                  <ul className="space-y-1">
                    {Object.entries(race.data.abilityAdjustments).map(([ability, bonus]) => (
                      <li key={ability}>
                        {ability.toUpperCase()}: {bonus > 0 ? '+' : ''}{bonus}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="btn btn-secondary"
        >
          Cancel
        </button>
        <button
          onClick={handleSelectRace}
          disabled={!selectedRace || isLoading}
          className="btn btn-primary"
        >
          {isLoading ? 'Loading...' : 'Next: Select Class'}
        </button>
      </div>
    </div>
  );
}
