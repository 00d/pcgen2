'use client';

import { useState } from 'react';
import { Feat as FeatType } from '../types/gameRules';
import FeatPrerequisites from './FeatPrerequisites';

interface Prerequisite {
  minBAB?: number;
  minAbilityScores?: Record<string, number>;
  requiredFeats?: string[];
  description?: string;
}

interface Props {
  feats: FeatType[];
  selectedFeats: string[];
  maxFeats: number;
  characterBAB?: number;
  abilityScores?: Record<string, number>;
  onFeatSelect: (featId: string) => void;
  onFeatDeselect: (featId: string) => void;
}

export default function FeatSelector({
  feats,
  selectedFeats,
  maxFeats,
  characterBAB = 0,
  abilityScores = {},
  onFeatSelect,
  onFeatDeselect,
}: Props) {
  const [expandedFeatId, setExpandedFeatId] = useState<string | null>(null);

  const isSelected = (featId: string): boolean => selectedFeats.includes(featId);

  const canSelectMore = (): boolean => selectedFeats.length < maxFeats;

  // Check if feat prerequisites are met
  const hasMetPrerequisites = (feat: FeatType): boolean => {
    const prerequisites = feat.data.prerequisites as Prerequisite | undefined;

    if (!prerequisites) return true;

    // Check BAB requirement
    if (prerequisites.minBAB && characterBAB < prerequisites.minBAB) {
      return false;
    }

    // Check ability score requirements
    if (prerequisites.minAbilityScores) {
      for (const [ability, minScore] of Object.entries(prerequisites.minAbilityScores)) {
        const score = abilityScores[ability] || 10;
        if (score < minScore) {
          return false;
        }
      }
    }

    // Check required feats
    if (prerequisites.requiredFeats) {
      for (const reqFeat of prerequisites.requiredFeats) {
        if (!selectedFeats.includes(reqFeat)) {
          return false;
        }
      }
    }

    return true;
  };

  const toggleFeat = (feat: FeatType) => {
    if (isSelected(feat.id)) {
      onFeatDeselect(feat.id);
    } else if (canSelectMore() && hasMetPrerequisites(feat)) {
      onFeatSelect(feat.id);
    }
  };

  const groupedFeats = feats.reduce(
    (acc, feat) => {
      const type = feat.data.type || 'General';
      if (!acc[type]) acc[type] = [];
      acc[type].push(feat);
      return acc;
    },
    {} as Record<string, FeatType[]>
  );

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="bg-blue-50 p-4 rounded border border-blue-200">
        <p className="text-sm">
          <strong>Feats Remaining:</strong> {maxFeats - selectedFeats.length} / {maxFeats}
        </p>
        {selectedFeats.length > 0 && (
          <p className="text-sm mt-2">
            <strong>Selected:</strong> {selectedFeats.map((id) => feats.find((f) => f.id === id)?.name).filter(Boolean).join(', ')}
          </p>
        )}
      </div>

      {/* Feat Categories */}
      {Object.entries(groupedFeats).map(([category, categoryFeats]) => (
        <div key={category}>
          <h3 className="font-bold text-lg mb-3 uppercase text-gray-700">{category} Feats</h3>

          <div className="space-y-2">
            {categoryFeats.map((feat) => {
              const selected = isSelected(feat.id);
              const expanded = expandedFeatId === feat.id;

              return (
                <div
                  key={feat.id}
                  className={`border rounded overflow-hidden transition-all ${
                    selected ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center p-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleFeat(feat)}
                      disabled={!selected && (!canSelectMore() || !hasMetPrerequisites(feat))}
                      className="mr-3"
                      title={!hasMetPrerequisites(feat) ? 'Prerequisites not met' : undefined}
                    />

                    <div className="flex-1">
                      <button
                        onClick={() => setExpandedFeatId(expanded ? null : feat.id)}
                        className="font-bold text-left hover:text-blue-600 flex items-center gap-2"
                      >
                        {feat.name}
                        <span className="text-xs text-gray-500">({feat.data.type})</span>
                        <span className="ml-auto text-gray-400">{expanded ? '▼' : '▶'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expanded && (
                    <div className="border-t p-3 bg-gray-50 text-sm space-y-2">
                      <div>
                        <p className="font-bold text-gray-700 mb-1">Benefit:</p>
                        <p className="text-gray-600">{feat.data.benefit}</p>
                      </div>

                      {feat.data.normal && (
                        <div>
                          <p className="font-bold text-gray-700 mb-1">Normal:</p>
                          <p className="text-gray-600">{feat.data.normal}</p>
                        </div>
                      )}

                      {/* Phase 3c Prerequisites Validation */}
                      {feat.data.prerequisites && (
                        <FeatPrerequisites
                          featId={feat.id}
                          characterBAB={characterBAB}
                          abilityScores={abilityScores}
                          selectedFeats={selectedFeats}
                          prerequisites={feat.data.prerequisites as Prerequisite}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {selectedFeats.length === 0 && (
        <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-sm text-yellow-800">
          Select at least one feat to continue.
        </div>
      )}
    </div>
  );
}
