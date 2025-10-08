'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchCharacters } from '../../redux/slices/characterSlice';

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);
  const { characters, isLoading } = useAppSelector((state) => state.character);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    dispatch(fetchCharacters());
  }, [token, dispatch, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">My Characters</h1>
        <Link href="/create" className="btn btn-primary">
          Create New Character
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="loading inline-block" style={{ width: '40px', height: '40px' }}></div>
          <p className="text-gray-600 mt-4">Loading characters...</p>
        </div>
      ) : characters.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 text-lg mb-6">No characters yet. Let's create one!</p>
          <Link href="/create" className="btn btn-primary">
            Create Your First Character
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((character) => (
            <Link
              key={character._id}
              href={`/character/${character._id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">{character.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{character.campaign}</p>

              <div className="space-y-1 text-sm text-gray-600">
                {character.attributes.race && (
                  <p>
                    <span className="font-medium">Race:</span> {character.attributes.race.name}
                  </p>
                )}
                {character.attributes.classes.length > 0 && (
                  <p>
                    <span className="font-medium">Classes:</span>{' '}
                    {character.attributes.classes.map((c) => `${c.name} ${c.level}`).join(', ')}
                  </p>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Created: {formatDate(character.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
