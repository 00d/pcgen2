'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WizardStepper, type WizardStep } from './WizardStepper';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { RaceSelectionStep } from './steps/RaceSelectionStep';
import { ClassSelectionStep } from './steps/ClassSelectionStep';
import { AbilityScoresStep } from './steps/AbilityScoresStep';
import { SkillsSelectionStep } from './steps/SkillsSelectionStep';
import { FeatsSelectionStep } from './steps/FeatsSelectionStep';
import { EquipmentSelectionStep } from './steps/EquipmentSelectionStep';
import { ReviewStep } from './steps/ReviewStep';
import { useAppDispatch, useAppSelector } from '@/store';
import { setCreationStep, resetCreation, addCharacter, setCurrentCharacter, updateCreationData } from '@/store/slices/characterSlice';
import { saveCharacter, generateCharacterId, loadCharacter } from '@/lib/storage/character-storage';
import type { PF1ECharacter } from '@/types/pathfinder1e';
import { Save, X } from 'lucide-react';

const WIZARD_STEPS: WizardStep[] = [
  { id: 1, name: 'Basic Info', description: 'Name & Details' },
  { id: 2, name: 'Race', description: 'Choose Race' },
  { id: 3, name: 'Class', description: 'Choose Class' },
  { id: 4, name: 'Abilities', description: 'Point Buy' },
  { id: 5, name: 'Skills', description: 'Assign Ranks' },
  { id: 6, name: 'Feats', description: 'Select Feats' },
  { id: 7, name: 'Equipment', description: 'Buy Gear' },
  { id: 8, name: 'Review', description: 'Finalize' },
];

export function CharacterWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const currentStep = useAppSelector((state) => state.character.creation.step);
  const creationData = useAppSelector((state) => state.character.creation.data);
  const [saving, setSaving] = useState(false);
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Load character data if in edit mode
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      setEditingCharacterId(editId);
      setIsEditMode(true);

      loadCharacter(editId).then((character) => {
        if (character) {
          const pf1eChar = character as PF1ECharacter;
          // Populate wizard with existing character data
          dispatch(updateCreationData({
            name: pf1eChar.name,
            gameSystem: pf1eChar.gameSystem,
            race: pf1eChar.race,
            classes: pf1eChar.classes,
            abilityScores: pf1eChar.abilityScores,
            skills: pf1eChar.skills,
            feats: pf1eChar.feats,
            equipment: pf1eChar.equipment,
            currency: pf1eChar.currency,
            alignment: pf1eChar.alignment,
            player: pf1eChar.player,
            deity: pf1eChar.deity,
            notes: pf1eChar.notes,
          }));
        }
      }).catch(console.error);
    }
  }, [searchParams, dispatch]);

  const canProceed = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(creationData.name && creationData.gameSystem);
      case 2:
        return !!(creationData as any).race;
      case 3:
        return !!((creationData as any).classes && (creationData as any).classes.length > 0);
      case 4:
        return true; // Ability scores are optional for draft
      case 5:
        return true; // Skills are optional for draft
      case 6:
        return true; // Feats are optional for draft
      case 7:
        return true; // Equipment is optional for draft
      case 8:
        return true; // Ready to complete
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length && canProceed(currentStep)) {
      dispatch(setCreationStep(currentStep + 1));
    }
  };

  const handleComplete = async () => {
    if (!canProceed(currentStep)) return;

    setSaving(true);
    try {
      const now = new Date().toISOString();
      let characterId: string;
      let createdAt: string;

      // If editing, use existing ID and creation date
      if (isEditMode && editingCharacterId) {
        characterId = editingCharacterId;
        const existingChar = await loadCharacter(editingCharacterId);
        createdAt = existingChar ? (existingChar as PF1ECharacter).createdAt : now;
      } else {
        characterId = generateCharacterId();
        createdAt = now;
      }

      const character: PF1ECharacter = {
        id: characterId,
        gameSystem: 'pathfinder1e',
        name: creationData.name || 'Unnamed Character',
        alignment: (creationData as any).alignment || 'TN',
        race: (creationData as any).race || '',
        classes: (creationData as any).classes || [],
        level: 1,
        abilityScores: creationData.abilityScores || {
          STR: 10,
          DEX: 10,
          CON: 10,
          INT: 10,
          WIS: 10,
          CHA: 10,
        },
        skills: (creationData as any).skills || [],
        feats: (creationData as any).feats || [],
        equipment: (creationData as any).equipment || [],
        currency: (creationData as any).currency || { cp: 0, sp: 0, gp: 0, pp: 0 },
        hp: {
          max: ((creationData as any).classes?.[0]?.hitPoints?.[0] || 0),
          current: ((creationData as any).classes?.[0]?.hitPoints?.[0] || 0),
          temp: 0,
        },
        player: (creationData as any).player,
        deity: (creationData as any).deity,
        notes: (creationData as any).notes,
        createdAt,
        updatedAt: now,
      };

      // Save to IndexedDB
      await saveCharacter(character);

      // Update Redux state
      dispatch(addCharacter(character));
      dispatch(setCurrentCharacter(characterId));

      // Reset creation state
      dispatch(resetCreation());

      // Navigate to character sheet if editing, otherwise to list
      if (isEditMode) {
        router.push(`/character/${characterId}`);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to save character:', error);
      alert('Failed to save character. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      dispatch(setCreationStep(currentStep - 1));
    }
  };

  const handleStepClick = (stepId: number) => {
    // Allow navigation to completed steps
    if (stepId <= currentStep) {
      dispatch(setCreationStep(stepId));
    }
  };

  const handleSaveDraft = () => {
    // TODO: Implement save draft to IndexedDB
    console.log('Saving draft...', creationData);
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? All progress will be lost.')) {
      dispatch(resetCreation());
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep />;
      case 2:
        return <RaceSelectionStep />;
      case 3:
        return <ClassSelectionStep />;
      case 4:
        return <AbilityScoresStep />;
      case 5:
        return <SkillsSelectionStep />;
      case 6:
        return <FeatsSelectionStep />;
      case 7:
        return <EquipmentSelectionStep />;
      case 8:
        return <ReviewStep />;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text">
          {isEditMode ? 'Edit Character' : 'Create New Character'}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-2 rounded-lg border border-surface bg-background px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 rounded-lg border border-error/30 bg-background px-4 py-2 text-sm font-medium text-error transition-colors hover:bg-error/10"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        </div>
      </div>

      {/* Stepper */}
      <WizardStepper steps={WIZARD_STEPS} currentStep={currentStep} onStepClick={handleStepClick} />

      {/* Step Content */}
      <div className="rounded-lg border border-surface bg-background p-6">{renderStep()}</div>

      {/* Navigation Buttons */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="rounded-lg border border-surface bg-background px-6 py-2 font-medium text-text transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={currentStep === WIZARD_STEPS.length ? handleComplete : handleNext}
          disabled={!canProceed(currentStep) || saving}
          className="rounded-lg bg-primary px-6 py-2 font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving...' : currentStep === WIZARD_STEPS.length ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  );
}
