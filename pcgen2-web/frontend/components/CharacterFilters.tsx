'use client';

import React from 'react';

interface CharacterFilters {
  searchTerm: string;
  campaignFilter: string;
  sortBy: 'name' | 'date' | 'level';
}

interface Props {
  onFilterChange: (filters: CharacterFilters) => void;
  campaigns: string[];
}

export default function CharacterFilters({ onFilterChange, campaigns }: Props) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [campaignFilter, setCampaignFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState<'name' | 'date' | 'level'>('date');

  React.useEffect(() => {
    onFilterChange({
      searchTerm,
      campaignFilter: campaignFilter === 'all' ? '' : campaignFilter,
      sortBy,
    });
  }, [searchTerm, campaignFilter, sortBy, onFilterChange]);

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            type="text"
            placeholder="Character name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Campaign Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Campaign</label>
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Campaigns</option>
            {campaigns.map((campaign) => (
              <option key={campaign} value={campaign}>
                {campaign}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'level')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="date">Date Created (Newest)</option>
            <option value="name">Name (A-Z)</option>
            <option value="level">Level (Highest)</option>
          </select>
        </div>

        {/* Clear Filters */}
        <div className="flex items-end">
          <button
            onClick={() => {
              setSearchTerm('');
              setCampaignFilter('all');
              setSortBy('date');
            }}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}
