'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchCharacters } from '../../redux/slices/characterSlice';
import CharacterCard from '@/components/CharacterCard';
import CharacterFilters from '@/components/CharacterFilters';
import { Character } from '@/types/character';

interface CharacterFilters {
  searchTerm: string;
  campaignFilter: string;
  sortBy: 'name' | 'date' | 'level';
}

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);
  const { characters, isLoading } = useAppSelector((state) => state.character);
  const [filters, setFilters] = React.useState<CharacterFilters>({
    searchTerm: '',
    campaignFilter: '',
    sortBy: 'date',
  });

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    dispatch(fetchCharacters());
  }, [token, dispatch, router]);

  // Get unique campaigns
  const campaigns = useMemo(() => {
    const campaignSet = new Set<string>();
    characters.forEach((char) => {
      if (char.campaign) {
        campaignSet.add(char.campaign);
      }
    });
    return Array.from(campaignSet).sort();
  }, [characters]);

  // Filter and sort characters
  const filteredCharacters = useMemo(() => {
    let filtered = characters.filter((char) => {
      // Search filter
      if (filters.searchTerm && !char.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      // Campaign filter
      if (filters.campaignFilter && char.campaign !== filters.campaignFilter) {
        return false;
      }
      return true;
    });

    // Sort
    switch (filters.sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'level':
        filtered.sort((a, b) => {
          const aLevel = a.attributes?.classes?.[0]?.level || 1;
          const bLevel = b.attributes?.classes?.[0]?.level || 1;
          return bLevel - aLevel;
        });
        break;
      case 'date':
      default:
        filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    return filtered;
  }, [characters, filters]);

  const handleDelete = (characterId: string) => {
    // TODO: Implement delete functionality
    console.log('Delete character:', characterId);
  };

  const handleEdit = (characterId: string) => {
    router.push(`/characters/${characterId}/edit/abilities`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">My Characters</h1>
            <p className="text-gray-600 mt-2">Manage and view your Pathfinder characters</p>
          </div>
          <Link
            href="/create"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            + Create New Character
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading your characters...</p>
          </div>
        ) : characters.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-600 text-lg mb-6">No characters yet. Let's create your first one!</p>
            <Link
              href="/create"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create Your First Character
            </Link>
          </div>
        ) : (
          <>
            {/* Filters */}
            <CharacterFilters onFilterChange={setFilters} campaigns={campaigns} />

            {/* Character Grid */}
            {filteredCharacters.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-600 text-lg">No characters match your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCharacters.map((character) => (
                  <CharacterCard
                    key={character._id}
                    character={character}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            )}

            {/* Stats Summary */}
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-gray-600">Total Characters</p>
                  <p className="text-3xl font-bold text-blue-600">{characters.length}</p>
                </div>
                <div>
                  <p className="text-gray-600">Campaigns</p>
                  <p className="text-3xl font-bold text-green-600">{campaigns.length}</p>
                </div>
                <div>
                  <p className="text-gray-600">Max Level</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {Math.max(...characters.map((c) => c.attributes?.classes?.[0]?.level || 1), 1)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Filtered Results</p>
                  <p className="text-3xl font-bold text-orange-600">{filteredCharacters.length}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
