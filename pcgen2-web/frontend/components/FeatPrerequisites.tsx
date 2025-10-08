'use client';

import React, { useState, useEffect } from 'react';

interface Prerequisite {
  minBAB?: number;
  minAbilityScores?: Record<string, number>;
  requiredFeats?: string[];
  description?: string;
}

interface Props {
  featId: string;
  characterBAB: number;
  abilityScores: Record<string, number>;
  selectedFeats: string[];
  prerequisites?: Prerequisite;
}

export default function FeatPrerequisites({
  featId,
  characterBAB,
  abilityScores,
  selectedFeats,
  prerequisites,
}: Props) {
  const [unmetPrerequisites, setUnmetPrerequisites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    validatePrerequisites();
  }, [characterBAB, abilityScores, selectedFeats]);

  const validatePrerequisites = async () => {
    if (!prerequisites) return;

    setLoading(true);
    const unmet: string[] = [];

    // Check BAB
    if (prerequisites.minBAB && characterBAB < prerequisites.minBAB) {
      unmet.push(`BAB +${prerequisites.minBAB} (you have +${characterBAB})`);
    }

    // Check ability scores
    if (prerequisites.minAbilityScores) {
      for (const [ability, minScore] of Object.entries(prerequisites.minAbilityScores)) {
        const score = abilityScores[ability] || 10;
        if (score < minScore) {
          unmet.push(`${ability.toUpperCase()} ${minScore}+ (you have ${score})`);
        }
      }
    }

    // Check required feats
    if (prerequisites.requiredFeats) {
      for (const reqFeat of prerequisites.requiredFeats) {
        if (!selectedFeats.includes(reqFeat)) {
          unmet.push(`Feat: ${reqFeat.replace(/_/g, ' ')}`);
        }
      }
    }

    setUnmetPrerequisites(unmet);
    setLoading(false);
  };

  const isMet = unmetPrerequisites.length === 0;

  if (!prerequisites) {
    return null;
  }

  return (
    <div className={`mt-2 p-3 rounded border-l-4 ${isMet ? 'bg-green-50 border-green-500' : 'bg-yellow-50 border-yellow-500'}`}>
      <p className={`text-sm font-semibold ${isMet ? 'text-green-700' : 'text-yellow-700'}`}>
        {isMet ? '✓ Prerequisites Met' : '⚠ Unmet Prerequisites'}
      </p>

      {prerequisites.description && (
        <p className="text-xs text-gray-600 mt-1">{prerequisites.description}</p>
      )}

      {unmetPrerequisites.length > 0 && (
        <ul className="text-xs text-gray-700 mt-2 space-y-1">
          {unmetPrerequisites.map((prereq, idx) => (
            <li key={idx} className="flex items-center">
              <span className="text-red-500 mr-2">•</span>
              {prereq}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
