'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateCreationData } from '@/store/slices/characterSlice';
import { loadFeats } from '@/lib/data-loaders';
import type { PF1EFeat, PF1ECharacterFeat } from '@/types/pathfinder1e';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';

export function FeatsSelectionStep() {
  const dispatch = useAppDispatch();
  const creationData = useAppSelector((state) => state.character.creation.data);
  const abilityScores = creationData.abilityScores;
  const characterSkills = (creationData as any).skills || [];

  const [feats, setFeats] = useState<PF1EFeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeats, setSelectedFeats] = useState<string[]>([]);
  const [expandedFeatId, setExpandedFeatId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'general' | 'combat' | 'metamagic'>(
    'general'
  );
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFeats()
      .then((featsData) => {
        // Filter out internal feats with empty descriptions
        const validFeats = featsData.filter((feat) => feat.description && feat.benefit);
        setFeats(validFeats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Initialize selected feats from Redux if available
    const existingFeats = (creationData as any).feats as PF1ECharacterFeat[] | undefined;
    if (existingFeats) {
      setSelectedFeats(existingFeats.map((f) => f.featId));
    }
  }, []);

  useEffect(() => {
    // Update Redux store whenever selected feats change
    const characterFeats: PF1ECharacterFeat[] = selectedFeats.map((featId) => ({
      featId,
      sourceType: 'level',
      sourceLevel: 1,
    }));
    dispatch(updateCreationData({ feats: characterFeats }));
  }, [selectedFeats, dispatch]);

  const getSkillRanks = (skillId: string): number => {
    const skill = characterSkills.find((s: any) => s.skillId === skillId);
    return skill?.ranks || 0;
  };

  const meetsPrerequisites = (feat: PF1EFeat): boolean => {
    if (!feat.prerequisites) return true;

    const prereqs = feat.prerequisites;

    // Check ability score prerequisites
    if (prereqs.abilityScores && abilityScores) {
      for (const [ability, required] of Object.entries(prereqs.abilityScores)) {
        const current = (abilityScores as any)[ability];
        if (!current || current < required) {
          return false;
        }
      }
    }

    // Check BAB prerequisites (assume BAB = level at level 1)
    if (prereqs.baseAttackBonus && prereqs.baseAttackBonus > 1) {
      return false;
    }

    // Check feat prerequisites
    if (prereqs.feats && prereqs.feats.length > 0) {
      for (const requiredFeat of prereqs.feats) {
        if (!selectedFeats.includes(requiredFeat)) {
          return false;
        }
      }
    }

    // Check skill prerequisites
    if (prereqs.skills && prereqs.skills.length > 0) {
      for (const skillReq of prereqs.skills) {
        const currentRanks = getSkillRanks(skillReq.id);
        if (currentRanks < skillReq.ranks) {
          return false;
        }
      }
    }

    return true;
  };

  const getFeatsAvailable = (): number => {
    // Level 1 characters get 1 feat
    // Humans get an extra feat
    const race = (creationData as any).race;
    return race === 'human' ? 2 : 1;
  };

  const featsAvailable = getFeatsAvailable();
  const featsRemaining = featsAvailable - selectedFeats.length;

  const canSelectFeat = (featId: string): boolean => {
    if (selectedFeats.includes(featId)) return true; // Already selected
    if (featsRemaining <= 0) return false;
    const feat = feats.find((f) => f.id === featId);
    if (!feat) return false;
    return meetsPrerequisites(feat);
  };

  const handleToggleFeat = (featId: string) => {
    if (selectedFeats.includes(featId)) {
      setSelectedFeats(selectedFeats.filter((id) => id !== featId));
    } else if (canSelectFeat(featId)) {
      setSelectedFeats([...selectedFeats, featId]);
    }
  };

  const toggleExpanded = (featId: string) => {
    setExpandedFeatId(expandedFeatId === featId ? null : featId);
  };

  const filteredFeats = useMemo(() => {
    let filtered = feats;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((feat) => feat.type === filterType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (feat) =>
          feat.name.toLowerCase().includes(query) ||
          feat.description.toLowerCase().includes(query) ||
          feat.benefit.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [feats, filterType, searchQuery]);

  const renderPrerequisites = (feat: PF1EFeat): React.ReactElement | null => {
    if (!feat.prerequisites) return null;

    const prereqs = feat.prerequisites;
    const parts: string[] = [];

    if (prereqs.abilityScores) {
      for (const [ability, value] of Object.entries(prereqs.abilityScores)) {
        parts.push(`${ability} ${value}`);
      }
    }

    if (prereqs.baseAttackBonus) {
      parts.push(`BAB +${prereqs.baseAttackBonus}`);
    }

    if (prereqs.feats && prereqs.feats.length > 0) {
      parts.push(...prereqs.feats.map((f) => feats.find((feat) => feat.id === f)?.name || f));
    }

    if (prereqs.skills && prereqs.skills.length > 0) {
      parts.push(
        ...prereqs.skills.map((s) => {
          const skill = s.id.replace(/_/g, ' ');
          return `${skill} ${s.ranks} ranks`;
        })
      );
    }

    if (prereqs.other) {
      parts.push(prereqs.other);
    }

    if (parts.length === 0) return null;

    return (
      <div className="text-xs text-muted">
        <strong>Prerequisites:</strong> {parts.join(', ')}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="mb-4 text-2xl font-bold text-text">Select Feats</h2>
          <p className="text-muted">Choose your starting feats.</p>
        </div>
        <div className="text-center text-muted">Loading feats...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-text">Select Feats</h2>
        <p className="text-muted">
          Choose your starting feats. At level 1, you get {featsAvailable} feat
          {featsAvailable > 1 ? 's' : ''}.
        </p>
      </div>

      {/* Feats Remaining */}
      <div className="rounded-lg border-2 border-primary bg-primary/10 p-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium text-text">Feats Remaining</span>
          <span
            className={`text-2xl font-bold ${
              featsRemaining < 0 ? 'text-red-500' : 'text-primary'
            }`}
          >
            {featsRemaining} / {featsAvailable}
          </span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('general')}
            className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'general'
                ? 'bg-primary text-white'
                : 'border border-surface bg-background text-text hover:border-primary'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setFilterType('combat')}
            className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'combat'
                ? 'bg-primary text-white'
                : 'border border-surface bg-background text-text hover:border-primary'
            }`}
          >
            Combat
          </button>
          <button
            onClick={() => setFilterType('metamagic')}
            className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'metamagic'
                ? 'bg-primary text-white'
                : 'border border-surface bg-background text-text hover:border-primary'
            }`}
          >
            Metamagic
          </button>
          <button
            onClick={() => setFilterType('all')}
            className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-primary text-white'
                : 'border border-surface bg-background text-text hover:border-primary'
            }`}
          >
            All Feats
          </button>
        </div>

        <input
          type="text"
          placeholder="Search feats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded border border-surface bg-background px-4 py-2 text-text placeholder-muted focus:border-primary focus:outline-none"
        />
      </div>

      {/* Feats List */}
      <div className="space-y-2">
        {filteredFeats.map((feat) => {
          const isSelected = selectedFeats.includes(feat.id);
          const isExpanded = expandedFeatId === feat.id;
          const canSelect = canSelectFeat(feat.id);
          const meetsPrereqs = meetsPrerequisites(feat);

          return (
            <div
              key={feat.id}
              className={`rounded-lg border-2 p-4 transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : !meetsPrereqs
                    ? 'border-surface bg-surface/30 opacity-60'
                    : 'border-surface bg-background hover:border-primary/50'
              }`}
            >
              {/* Header */}
              <div className="mb-2 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-text">{feat.name}</h3>
                    <span className="rounded bg-surface px-2 py-0.5 text-xs font-medium text-muted capitalize">
                      {feat.type}
                    </span>
                    {!meetsPrereqs && (
                      <span className="rounded bg-error/20 px-2 py-0.5 text-xs font-medium text-error">
                        Prerequisites not met
                      </span>
                    )}
                  </div>
                  {renderPrerequisites(feat)}
                </div>
                <button
                  onClick={() => handleToggleFeat(feat.id)}
                  disabled={!canSelect && !isSelected}
                  className={`ml-4 rounded px-4 py-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : canSelect
                        ? 'border border-surface bg-background text-text hover:border-primary'
                        : 'cursor-not-allowed border border-surface bg-surface/30 text-muted opacity-50'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check size={16} className="inline" /> Selected
                    </>
                  ) : (
                    'Select'
                  )}
                </button>
              </div>

              {/* Short Description */}
              <p className="mb-2 text-sm text-muted">{feat.description}</p>

              {/* Expandable Details */}
              <button
                onClick={() => toggleExpanded(feat.id)}
                className="flex w-full items-center justify-between rounded border border-surface px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-surface"
              >
                <span>{isExpanded ? 'Hide' : 'Show'} Details</span>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {isExpanded && (
                <div className="mt-3 rounded border border-surface bg-surface/50 p-3 text-sm">
                  <div>
                    <div className="font-medium text-text">Benefit:</div>
                    <div className="mt-1 text-muted">{feat.benefit}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredFeats.length === 0 && (
        <div className="text-center text-muted">
          No feats found matching your search criteria.
        </div>
      )}

      {/* Selected Feats Summary */}
      {selectedFeats.length > 0 && (
        <div className="rounded border border-surface bg-surface/50 p-3 text-sm">
          <span className="font-medium text-text">Selected Feats: </span>
          <span className="text-muted">
            {selectedFeats
              .map((id) => feats.find((f) => f.id === id)?.name || id)
              .join(', ')}
          </span>
        </div>
      )}
    </div>
  );
}
