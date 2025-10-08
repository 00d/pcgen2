'use client';

import { useState } from 'react';
import { Feat as FeatType } from '../types/gameRules';

interface Props {
  feats: FeatType[];
  selectedFeats: string[];
  maxFeats: number;
  onFeatSelect: (featId: string) => void;
  onFeatDeselect: (featId: string) => void;
}

export default function FeatSelector({ feats, selectedFeats, maxFeats, onFeatSelect, onFeatDeselect }: Props) {
  const [expandedFeatId, setExpandedFeatId] = useState<string | null>(null);

  const isSelected = (featId: string): boolean => selectedFeats.includes(featId);

  const canSelectMore = (): boolean => selectedFeats.length < maxFeats;

  const toggleFeat = (feat: FeatType) => {
    if (isSelected(feat.id)) {
      onFeatDeselect(feat.id);
    } else if (canSelectMore()) {
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
                      disabled={!selected && !canSelectMore()}
                      className="mr-3"
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

                      {feat.data.prerequisites && feat.data.prerequisites.length > 0 && (
                        <div>
                          <p className="font-bold text-gray-700 mb-1">Prerequisites:</p>
                          <ul className="list-disc list-inside text-gray-600">
                            {feat.data.prerequisites.map((prereq, idx) => (
                              <li key={idx}>{prereq}</li>
                            ))}
                          </ul>
                        </div>
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
