'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Character {
  _id: string;
  name: string;
  attributes?: {
    race?: { name: string };
    classes?: Array<{ className: string; level: number }>;
  };
}

interface Campaign {
  _id: string;
  name: string;
  description?: string;
  setting?: string;
  dungeon_master?: string;
  characters?: Character[];
  createdAt?: string;
  updatedAt?: string;
}

interface Props {
  campaign: Campaign;
  onEdit?: (campaign: Campaign) => void;
  onDelete?: (campaignId: string) => void;
  onViewCharacters?: (campaignId: string) => void;
}

export default function CampaignCard({
  campaign,
  onEdit,
  onDelete,
  onViewCharacters,
}: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const characterCount = campaign.characters?.length || 0;

  const getTotalLevel = (): number => {
    if (!campaign.characters) return 0;
    return campaign.characters.reduce((sum, char) => {
      const classes = char.attributes?.classes || [];
      return sum + classes.reduce((classSum, cls) => classSum + (cls.level || 0), 0);
    }, 0);
  };

  const getHighestLevel = (): number => {
    if (!campaign.characters) return 0;
    return Math.max(
      ...campaign.characters.map((char) => {
        const classes = char.attributes?.classes || [];
        return classes.reduce((max, cls) => Math.max(max, cls.level || 0), 0);
      }),
      0
    );
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <Link href={`/campaigns/${campaign._id}`}>
              <h3 className="font-bold text-lg hover:text-blue-100 cursor-pointer">
                {campaign.name}
              </h3>
            </Link>
            {campaign.setting && (
              <p className="text-sm text-blue-100">{campaign.setting}</p>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-white hover:bg-blue-700 p-2 rounded"
              title="More options"
            >
              ⋮
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded shadow-lg z-10">
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit(campaign);
                      setShowMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    ✎ Edit Campaign
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      if (confirm('Delete this campaign?')) {
                        onDelete(campaign._id);
                        setShowMenu(false);
                      }
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600"
                  >
                    🗑 Delete Campaign
                  </button>
                )}
                <Link
                  href={`/campaigns/${campaign._id}`}
                  className="block px-4 py-2 hover:bg-gray-100"
                >
                  👁 View Details
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {campaign.description && (
        <div className="px-4 pt-3 pb-2">
          <p className="text-sm text-gray-600 line-clamp-2">{campaign.description}</p>
        </div>
      )}

      {/* DM Info */}
      {campaign.dungeon_master && (
        <div className="px-4 py-2 bg-gray-50 border-t border-b border-gray-200">
          <p className="text-sm text-gray-700">
            <strong>Dungeon Master:</strong> {campaign.dungeon_master}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="px-4 py-3 grid grid-cols-3 gap-3 bg-gray-50 border-t">
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">Characters</p>
          <p className="text-2xl font-bold text-blue-600">{characterCount}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">Avg Level</p>
          <p className="text-2xl font-bold text-green-600">
            {characterCount > 0 ? Math.round(getTotalLevel() / characterCount) : 0}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">Max Level</p>
          <p className="text-2xl font-bold text-orange-600">{getHighestLevel()}</p>
        </div>
      </div>

      {/* Characters Preview */}
      {characterCount > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t">
          <p className="text-xs font-bold text-gray-700 mb-2 uppercase">Characters</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {campaign.characters?.slice(0, 5).map((char) => {
              const classes = char.attributes?.classes || [];
              const classStr =
                classes.length > 0
                  ? classes.map((c) => `${c.className} ${c.level}`).join('/')
                  : 'No class';

              return (
                <div key={char._id} className="text-sm text-gray-700">
                  <span className="font-semibold">{char.name}</span>
                  <span className="text-gray-500 ml-2">({classStr})</span>
                </div>
              );
            })}
            {characterCount > 5 && (
              <p className="text-xs text-gray-500 mt-2">
                +{characterCount - 5} more characters
              </p>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t flex gap-2">
        {onViewCharacters && (
          <button
            onClick={() => onViewCharacters(campaign._id)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-semibold text-sm transition-colors"
          >
            View Characters
          </button>
        )}
        <Link
          href={`/campaigns/${campaign._id}`}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded font-semibold text-sm transition-colors text-center"
        >
          Details
        </Link>
      </div>

      {/* Metadata */}
      {campaign.createdAt && (
        <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t">
          Created {new Date(campaign.createdAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
