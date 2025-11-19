'use client';

import { Check } from 'lucide-react';

export interface WizardStep {
  id: number;
  name: string;
  description: string;
}

interface WizardStepperProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
}

export function WizardStepper({ steps, currentStep, onStepClick }: WizardStepperProps) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isComplete = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isClickable = isComplete || isCurrent;

          return (
            <li key={step.id} className="relative flex-1">
              {/* Connector Line */}
              {index !== steps.length - 1 && (
                <div
                  className={`absolute left-1/2 top-5 hidden h-0.5 w-full sm:block ${
                    isComplete ? 'bg-primary' : 'bg-surface'
                  }`}
                  aria-hidden="true"
                />
              )}

              {/* Step Button */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={`group relative flex flex-col items-center ${
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
              >
                {/* Step Circle */}
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    isComplete
                      ? 'border-primary bg-primary text-white'
                      : isCurrent
                        ? 'border-primary bg-background text-primary'
                        : 'border-surface bg-background text-muted'
                  } ${isClickable ? 'group-hover:border-primary' : ''}`}
                >
                  {isComplete ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </span>

                {/* Step Text */}
                <span className="mt-2 text-center">
                  <span
                    className={`block text-sm font-medium ${
                      isCurrent ? 'text-primary' : isComplete ? 'text-text' : 'text-muted'
                    }`}
                  >
                    {step.name}
                  </span>
                  <span className="hidden text-xs text-muted sm:block">{step.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
