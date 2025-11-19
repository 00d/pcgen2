import { Suspense } from 'react';
import { CharacterWizard } from '@/components/character-wizard/CharacterWizard';

function WizardWrapper() {
  return <CharacterWizard />;
}

export default function NewCharacterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="text-xl text-text">Loading...</div></div>}>
      <WizardWrapper />
    </Suspense>
  );
}
