'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { createCharacter } from '../../redux/slices/characterSlice';

export default function CreateCharacterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);
  const { isLoading, error } = useAppSelector((state) => state.character);

  const [characterName, setCharacterName] = useState('');

  if (!token) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!characterName.trim()) {
      return;
    }

    const result = await dispatch(
      createCharacter({
        name: characterName,
        campaign: 'Pathfinder 1e',
      })
    );

    if (createCharacter.fulfilled.match(result)) {
      router.push(`/create/race/${result.payload._id}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Create New Character</h1>

      <div className="bg-white rounded-lg shadow p-8">
        {error && <div className="text-error bg-red-50 p-3 rounded mb-6">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Character Name
            </label>
            <input
              id="name"
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              className="form-input"
              placeholder="Enter character name"
              maxLength={100}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Campaign</label>
            <p className="text-gray-600">Pathfinder 1e</p>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Next: Select Race'}
          </button>
        </form>
      </div>
    </div>
  );
}
