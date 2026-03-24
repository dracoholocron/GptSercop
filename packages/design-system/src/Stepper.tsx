import * as React from 'react';

export interface StepperProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className = '' }: StepperProps) {
  return (
    <nav aria-label="Progress" className={className}>
      <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const status = currentStep > stepNumber ? 'complete' : currentStep === stepNumber ? 'current' : 'upcoming';

          return (
            <li key={step} className="md:flex-1">
              {status === 'complete' ? (
                <div className="group flex flex-col border-l-4 border-primary py-2 pl-4 hover:border-blue-800 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4 transition-colors">
                  <span className="text-sm font-medium text-primary group-hover:text-blue-800">Paso {stepNumber}</span>
                  <span className="text-sm font-medium">{step}</span>
                </div>
              ) : status === 'current' ? (
                <div className="flex flex-col border-l-4 border-primary py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4" aria-current="step">
                  <span className="text-sm font-medium text-primary">Paso {stepNumber}</span>
                  <span className="text-sm font-medium text-text-primary">{step}</span>
                </div>
              ) : (
                <div className="group flex flex-col border-l-4 border-neutral-200 py-2 pl-4 hover:border-neutral-300 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4 transition-colors">
                  <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary">Paso {stepNumber}</span>
                  <span className="text-sm font-medium text-text-secondary">{step}</span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
