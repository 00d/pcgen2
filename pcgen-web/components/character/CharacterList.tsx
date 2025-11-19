'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import { setCharacterList, setCurrentCharacter, deleteCharacter as deleteCharacterAction, addCharacter } from '@/store/slices/characterSlice';
import { loadAllCharacters, deleteCharacter, downloadCharacterAsFile, importCharacterFromJSON, saveCharacter } from '@/lib/storage/character-storage';
import type { PF1ECharacter } from '@/types/pathfinder1e';
import { Plus, User, Trash2, Download, Eye, Upload } from 'lucide-react';
import { useToast } from '@/lib/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';

export function CharacterList() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const characters = useAppSelector((state) => state.character.list);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toasts, removeToast, success, error } = useToast();

  useEffect(() => {
    // Load characters from IndexedDB
    loadAllCharacters()
      .then((loadedCharacters) => {
        dispatch(setCharacterList(loadedCharacters));
      })
      .catch((error) => {
        console.error('Failed to load characters:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [dispatch]);

  const handleCreateNew = () => {
    router.push('/character/new');
  };

  const handleViewCharacter = (characterId: string) => {
    dispatch(setCurrentCharacter(characterId));
    router.push(`/character/${characterId}`);
  };

  const handleDeleteCharacter = async (characterId: string, characterName: string) => {
    if (!confirm(`Are you sure you want to delete "${characterName}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(characterId);
    try {
      await deleteCharacter(characterId);
      dispatch(deleteCharacterAction(characterId));
      success(`Deleted "${characterName}" successfully`);
    } catch (err) {
      console.error('Failed to delete character:', err);
      error('Failed to delete character. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCharacter = (character: PF1ECharacter) => {
    try {
      downloadCharacterAsFile(character);
      success(`Exported "${character.name}" successfully`);
    } catch (err) {
      console.error('Failed to export character:', err);
      error('Failed to export character. Please try again.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const character = importCharacterFromJSON(text);

      // Save to IndexedDB
      await saveCharacter(character);

      // Update Redux state
      dispatch(addCharacter(character));

      success(`Successfully imported "${character.name}"!`);
    } catch (err) {
      console.error('Failed to import character:', err);
      error(err instanceof Error ? err.message : 'Failed to import character. Please check the file format.');
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getClassDisplay = (character: PF1ECharacter): string => {
    if (!character.classes || character.classes.length === 0) return 'No class';
    return character.classes
      .map((cls) => `${cls.classId} ${cls.level}`)
      .join(' / ');
  };

  const getRaceDisplay = (character: PF1ECharacter): string => {
    return character.race || 'No race';
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-center text-muted">Loading characters...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text">My Characters</h1>
          <p className="mt-2 text-muted">
            {characters.length === 0
              ? 'No characters yet. Create your first character!'
              : `${characters.length} character${characters.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleImportClick}
            disabled={importing}
            className="flex items-center gap-2 rounded-lg border border-surface bg-background px-4 py-2 font-medium text-text transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload size={20} />
            {importing ? 'Importing...' : 'Import'}
          </button>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Plus size={20} />
            Create New
          </button>
        </div>
      </div>

      {/* Character Grid */}
      {characters.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-surface bg-surface/20 p-12 text-center">
          <User size={48} className="mx-auto mb-4 text-muted" />
          <h2 className="mb-2 text-xl font-bold text-text">No Characters Yet</h2>
          <p className="mb-6 text-muted">
            Get started by creating your first Pathfinder character!
          </p>
          <button
            onClick={handleCreateNew}
            className="rounded-lg bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary/90"
          >
            Create Your First Character
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {characters.map((character) => {
            const pf1eChar = character as PF1ECharacter;
            return (
            <div
              key={character.id}
              className="rounded-lg border border-surface bg-background p-4 transition-colors hover:border-primary"
            >
              {/* Character Header */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-text">{pf1eChar.name}</h3>
                  <p className="text-sm text-muted capitalize">
                    {getRaceDisplay(pf1eChar)} • {getClassDisplay(pf1eChar)}
                  </p>
                </div>
                <div className="flex items-center justify-center rounded-full bg-primary/20 p-2">
                  <User size={20} className="text-primary" />
                </div>
              </div>

              {/* Character Stats */}
              <div className="mb-4 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded bg-surface/50 p-2">
                  <div className="text-xs text-muted">Level</div>
                  <div className="font-bold text-text">{pf1eChar.level}</div>
                </div>
                <div className="rounded bg-surface/50 p-2">
                  <div className="text-xs text-muted">HP</div>
                  <div className="font-bold text-text">{pf1eChar.hp?.max || 0}</div>
                </div>
                <div className="rounded bg-surface/50 p-2">
                  <div className="text-xs text-muted">Alignment</div>
                  <div className="font-bold text-text">{pf1eChar.alignment}</div>
                </div>
              </div>

              {/* Last Updated */}
              <div className="mb-4 text-xs text-muted">
                Updated: {new Date(pf1eChar.updatedAt).toLocaleDateString()}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewCharacter(pf1eChar.id)}
                  className="flex flex-1 items-center justify-center gap-2 rounded border border-surface bg-background px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-surface"
                >
                  <Eye size={16} />
                  View
                </button>
                <button
                  onClick={() => handleExportCharacter(pf1eChar)}
                  className="flex items-center justify-center gap-2 rounded border border-surface bg-background px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-surface"
                  title="Export as JSON"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => handleDeleteCharacter(pf1eChar.id, pf1eChar.name)}
                  disabled={deletingId === pf1eChar.id}
                  className="flex items-center justify-center gap-2 rounded border border-error/30 bg-background px-3 py-2 text-sm font-medium text-error transition-colors hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Delete character"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
