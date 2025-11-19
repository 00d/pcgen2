'use client';

import { useAppDispatch, useAppSelector } from '@/store';
import { updateCreationData } from '@/store/slices/characterSlice';
import type { GameSystem } from '@/types';

const ALIGNMENTS = [
  { value: 'LG', label: 'Lawful Good', description: 'Crusader' },
  { value: 'NG', label: 'Neutral Good', description: 'Benefactor' },
  { value: 'CG', label: 'Chaotic Good', description: 'Rebel' },
  { value: 'LN', label: 'Lawful Neutral', description: 'Judge' },
  { value: 'N', label: 'True Neutral', description: 'Undecided' },
  { value: 'CN', label: 'Chaotic Neutral', description: 'Free Spirit' },
  { value: 'LE', label: 'Lawful Evil', description: 'Dominator' },
  { value: 'NE', label: 'Neutral Evil', description: 'Malefactor' },
  { value: 'CE', label: 'Chaotic Evil', description: 'Destroyer' },
];

export function BasicInfoStep() {
  const dispatch = useAppDispatch();
  const creationData = useAppSelector((state) => state.character.creation.data);

  const handleInputChange = (field: string, value: string) => {
    dispatch(updateCreationData({ [field]: value }));
  };

  const handleGameSystemChange = (system: GameSystem) => {
    dispatch(updateCreationData({ gameSystem: system }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-text">Basic Information</h2>
        <p className="text-muted">Let's start with the basics of your character.</p>
      </div>

      {/* Character Name */}
      <div>
        <label htmlFor="character-name" className="mb-2 block text-sm font-medium text-text">
          Character Name <span className="text-error">*</span>
        </label>
        <input
          type="text"
          id="character-name"
          value={creationData.name || ''}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Enter your character's name"
          className="w-full rounded-lg border border-surface bg-background px-4 py-2 text-text placeholder-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Game System */}
      <div>
        <label className="mb-2 block text-sm font-medium text-text">
          Game System <span className="text-error">*</span>
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleGameSystemChange('pathfinder1e')}
            className={`rounded-lg border-2 p-4 text-left transition-colors ${
              creationData.gameSystem === 'pathfinder1e'
                ? 'border-primary bg-primary/10'
                : 'border-surface bg-background hover:border-surface-hover'
            }`}
          >
            <div className="font-semibold text-text">Pathfinder 1st Edition</div>
            <div className="mt-1 text-sm text-muted">Classic d20 system with rich customization</div>
          </button>
          <button
            type="button"
            onClick={() => handleGameSystemChange('pathfinder2e')}
            className={`rounded-lg border-2 p-4 text-left transition-colors ${
              creationData.gameSystem === 'pathfinder2e'
                ? 'border-primary bg-primary/10'
                : 'border-surface bg-background hover:border-surface-hover'
            }`}
          >
            <div className="font-semibold text-text">Pathfinder 2nd Edition</div>
            <div className="mt-1 text-sm text-muted">
              Streamlined rules with three-action economy
            </div>
          </button>
        </div>
      </div>

      {/* Alignment */}
      <div>
        <label className="mb-2 block text-sm font-medium text-text">Alignment</label>
        <div className="grid grid-cols-3 gap-2">
          {ALIGNMENTS.map((alignment) => (
            <button
              key={alignment.value}
              type="button"
              onClick={() => handleInputChange('alignment', alignment.value)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                creationData.alignment === alignment.value
                  ? 'border-primary bg-primary/10'
                  : 'border-surface bg-background hover:border-surface-hover'
              }`}
            >
              <div className="text-sm font-semibold text-text">{alignment.label}</div>
              <div className="mt-1 text-xs text-muted">{alignment.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Player Name (Optional) */}
      <div>
        <label htmlFor="player-name" className="mb-2 block text-sm font-medium text-text">
          Player Name (Optional)
        </label>
        <input
          type="text"
          id="player-name"
          value={(creationData as any).player || ''}
          onChange={(e) => handleInputChange('player', e.target.value)}
          placeholder="Your name"
          className="w-full rounded-lg border border-surface bg-background px-4 py-2 text-text placeholder-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
  );
}
