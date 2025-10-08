'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Character } from '@/types/character';

interface Props {
  character: Character;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export default function CharacterCard({ character, onDelete, onEdit }: Props) {
  const router = useRouter();
  const [showActions, setShowActions] = React.useState(false);

  const raceName = typeof character.attributes?.race === 'object'
    ? character.attributes.race.name
    : character.attributes?.race || 'No Race';

  const className = character.attributes?.classes?.[0]?.name || 'No Class';
  const classLevel = character.attributes?.classes?.[0]?.level || 1;

  const hp = character.derivedStats?.hitPoints?.max || 0;
  const ac = character.derivedStats?.armorClass?.total || 10;

  const handleView = () => {
    router.push(`/characters/${character._id}/view`);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(character._id);
    } else {
      router.push(`/characters/${character._id}/edit/abilities`);
    }
  };

  const handlePrint = () => {
    router.push(`/characters/${character._id}/print`);
  };

  const handleDelete = () => {
    if (onDelete && window.confirm(`Delete ${character.name}? This cannot be undone.`)) {
      onDelete(character._id);
    }
  };

  const formattedDate = new Date(character.createdAt || new Date()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{character.name}</h3>
          <p className="text-sm text-gray-600">{character.campaign || 'No Campaign'}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="text-gray-500 hover:text-gray-700 p-2"
            title="Actions"
          >
            ⋮
          </button>
          {showActions && (
            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-300 rounded shadow-lg z-10">
              <button
                onClick={() => {
                  handleView();
                  setShowActions(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
              >
                👁️ View
              </button>
              <button
                onClick={() => {
                  handleEdit();
                  setShowActions(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
              >
                ✎ Edit
              </button>
              <button
                onClick={() => {
                  handlePrint();
                  setShowActions(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
              >
                🖨️ Print
              </button>
              <div className="border-t border-gray-300" />
              <button
                onClick={() => {
                  handleDelete();
                  setShowActions(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                🗑️ Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Character Info */}
      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <p className="text-gray-600">Race</p>
          <p className="font-semibold text-gray-800">{raceName}</p>
        </div>
        <div>
          <p className="text-gray-600">Class</p>
          <p className="font-semibold text-gray-800">
            {className} {classLevel > 1 ? `(L${classLevel})` : ''}
          </p>
        </div>
        <div>
          <p className="text-gray-600">Hit Points</p>
          <p className="font-semibold text-gray-800">{hp}</p>
        </div>
        <div>
          <p className="text-gray-600">Armor Class</p>
          <p className="font-semibold text-gray-800">{ac}</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mb-3 p-2 bg-gray-50 rounded">
        <p className="text-xs text-gray-600 font-semibold mb-2">Ability Scores</p>
        <div className="grid grid-cols-6 gap-2 text-center text-xs">
          <div>
            <p className="text-gray-600">STR</p>
            <p className="font-bold text-gray-800">
              {character.attributes?.abilityScores?.str?.total || 10}
            </p>
          </div>
          <div>
            <p className="text-gray-600">DEX</p>
            <p className="font-bold text-gray-800">
              {character.attributes?.abilityScores?.dex?.total || 10}
            </p>
          </div>
          <div>
            <p className="text-gray-600">CON</p>
            <p className="font-bold text-gray-800">
              {character.attributes?.abilityScores?.con?.total || 10}
            </p>
          </div>
          <div>
            <p className="text-gray-600">INT</p>
            <p className="font-bold text-gray-800">
              {character.attributes?.abilityScores?.int?.total || 10}
            </p>
          </div>
          <div>
            <p className="text-gray-600">WIS</p>
            <p className="font-bold text-gray-800">
              {character.attributes?.abilityScores?.wis?.total || 10}
            </p>
          </div>
          <div>
            <p className="text-gray-600">CHA</p>
            <p className="font-bold text-gray-800">
              {character.attributes?.abilityScores?.cha?.total || 10}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-500 border-t border-gray-200 pt-2">
        Created {formattedDate}
      </div>
    </div>
  );
}
