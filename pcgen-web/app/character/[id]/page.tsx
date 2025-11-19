'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store';
import { setCurrentCharacter, setCharacterList } from '@/store/slices/characterSlice';
import { loadCharacter, loadAllCharacters } from '@/lib/storage/character-storage';
import { CharacterSheet } from '@/components/character/CharacterSheet';
import type { PF1ECharacter } from '@/types/pathfinder1e';

export default function CharacterPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const characterId = params.id as string;

  const [character, setCharacter] = useState<PF1ECharacter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCharacterData = async () => {
      try {
        // Load the specific character
        const loadedCharacter = await loadCharacter(characterId);

        if (!loadedCharacter) {
          setError('Character not found');
          return;
        }

        // Cast to PF1ECharacter (since we only support PF1E for now)
        const pf1eChar = loadedCharacter as PF1ECharacter;
        setCharacter(pf1eChar);

        // Update Redux state
        dispatch(setCurrentCharacter(characterId));

        // Also load all characters to ensure Redux list is in sync
        const allCharacters = await loadAllCharacters();
        dispatch(setCharacterList(allCharacters));
      } catch (err) {
        console.error('Failed to load character:', err);
        setError('Failed to load character');
      } finally {
        setLoading(false);
      }
    };

    loadCharacterData();
  }, [characterId, dispatch]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium text-text">Loading character...</div>
        </div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-xl font-medium text-error">{error || 'Character not found'}</div>
          <button
            onClick={() => router.push('/')}
            className="rounded-lg bg-primary px-6 py-2 font-medium text-white transition-colors hover:bg-primary/90"
          >
            Back to Characters
          </button>
        </div>
      </div>
    );
  }

  return <CharacterSheet character={character} />;
}
