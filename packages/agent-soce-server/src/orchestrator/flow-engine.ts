export interface FlowStep {
  id: string;
  label: string;
  screenRoute?: string;
  fieldId?: string;
  instructions: string;
  validationFn?: string;
}

export interface FlowDefinition {
  id: string;
  name: string;
  steps: FlowStep[];
}

export interface FlowState {
  flowId: string;
  currentStep: number;
  completedSteps: string[];
  data: Record<string, unknown>;
}

export function initFlow(flow: FlowDefinition): FlowState {
  return {
    flowId: flow.id,
    currentStep: 0,
    completedSteps: [],
    data: {},
  };
}

export function advanceFlow(state: FlowState, flow: FlowDefinition): FlowState {
  const step = flow.steps[state.currentStep];
  if (!step) return state;

  const next = state.currentStep + 1;
  return {
    ...state,
    currentStep: Math.min(next, flow.steps.length - 1),
    completedSteps: [...state.completedSteps, step.id],
  };
}

export function retreatFlow(state: FlowState): FlowState {
  return {
    ...state,
    currentStep: Math.max(0, state.currentStep - 1),
    completedSteps: state.completedSteps.slice(0, -1),
  };
}

export function getCurrentStep(state: FlowState, flow: FlowDefinition): FlowStep | null {
  return flow.steps[state.currentStep] ?? null;
}

export function isFlowComplete(state: FlowState, flow: FlowDefinition): boolean {
  return state.completedSteps.length >= flow.steps.length;
}
