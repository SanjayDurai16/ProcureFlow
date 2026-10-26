import React from 'react';
import type { RFQStatus } from '../types';
import { Check } from 'lucide-react';

interface WorkflowProgressProps {
  status: RFQStatus;
}

export const WorkflowProgress: React.FC<WorkflowProgressProps> = ({ status }) => {
  const steps = [
    { key: 'DRAFT', label: '1. Draft' },
    { key: 'OPEN', label: '2. Bidding Open' },
    { key: 'UNDER_REVIEW', label: '3. Under Review' },
    { key: 'APPROVED', label: '4. Approved' },
    { key: 'PO_ISSUED', label: '5. PO Issued' },
  ];

  const getStepState = (stepKey: string): 'completed' | 'current' | 'upcoming' => {
    if (status === 'CANCELLED') return 'upcoming';

    const order = ['DRAFT', 'OPEN', 'UNDER_REVIEW', 'APPROVED', 'PO_ISSUED'];

    let currentIndex = 0;
    if (status === 'DRAFT') currentIndex = 0;
    else if (status === 'OPEN') currentIndex = 1;
    else if (status === 'UNDER_REVIEW') currentIndex = 2;
    else if (status === 'APPROVED') currentIndex = 3;
    else if (status === 'PO_ISSUED') currentIndex = 4;

    const stepIndex = order.indexOf(stepKey);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="py-2.5 px-3 rounded-[6px] bg-[#FAFAF9] border border-[#E5E7E4]">
      <div className="flex items-center justify-between text-xs">
        {steps.map((step, idx) => {
          const state = getStepState(step.key);
          const isLast = idx === steps.length - 1;

          return (
            <React.Fragment key={step.key}>
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-semibold transition-colors ${
                    state === 'completed'
                      ? 'bg-[#245C46] text-white'
                      : state === 'current'
                      ? 'border border-[#245C46] text-[#245C46] bg-[#EDF4EF]'
                      : 'border border-[#E5E7E4] text-[#8E948F] bg-white'
                  }`}
                >
                  {state === 'completed' ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : idx + 1}
                </span>

                <span
                  className={`text-[12px] ${
                    state === 'current'
                      ? 'font-semibold text-[#202522]'
                      : state === 'completed'
                      ? 'text-[#202522] font-medium'
                      : 'text-[#8E948F]'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {!isLast && (
                <div
                  className={`h-px flex-1 mx-2 transition-colors ${
                    state === 'completed' ? 'bg-[#245C46]' : 'bg-[#E5E7E4]'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
