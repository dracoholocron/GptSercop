import { useState, useCallback } from 'react';
import type { GuidanceAction, HostAdapter } from '../types/index.js';
import { executeAction, removeHighlightDOM, hideTooltipDOM } from '../actions/ActionBridge.js';

interface GuidedFlowState {
  active: boolean;
  currentStep: number;
  totalSteps: number;
  currentStepId: string | null;
  currentFieldId: string | null;
}

export function useGuidedFlow(adapter?: HostAdapter) {
  const [flowState, setFlowState] = useState<GuidedFlowState>({
    active: false,
    currentStep: 0,
    totalSteps: 0,
    currentStepId: null,
    currentFieldId: null,
  });

  const handleGuidance = useCallback(
    (action: GuidanceAction) => {
      if (flowState.currentFieldId) {
        removeHighlightDOM(flowState.currentFieldId);
        hideTooltipDOM(flowState.currentFieldId);
        if (adapter) {
          adapter.removeHighlight(flowState.currentFieldId);
          adapter.hideTooltip(flowState.currentFieldId);
        }
      }

      executeAction(action, adapter);

      setFlowState({
        active: true,
        currentStep: action.stepId ? parseInt(action.stepId, 10) || flowState.currentStep + 1 : flowState.currentStep + 1,
        totalSteps: action.totalSteps ?? flowState.totalSteps,
        currentStepId: action.stepId ?? null,
        currentFieldId: action.fieldId ?? null,
      });
    },
    [adapter, flowState],
  );

  const cancelFlow = useCallback(() => {
    if (flowState.currentFieldId) {
      removeHighlightDOM(flowState.currentFieldId);
      hideTooltipDOM(flowState.currentFieldId);
    }
    setFlowState({
      active: false,
      currentStep: 0,
      totalSteps: 0,
      currentStepId: null,
      currentFieldId: null,
    });
  }, [flowState.currentFieldId]);

  return { flowState, handleGuidance, cancelFlow };
}
