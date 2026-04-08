/**
 * Unit Tests — Orchestrator intent classification (UT-03, UT-04)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classifyIntent } from '../../src/orchestrator/intent.js';
import { initFlow, advanceFlow, retreatFlow, getCurrentStep, isFlowComplete } from '../../src/orchestrator/flow-engine.js';
import type { FlowDefinition } from '../../src/orchestrator/flow-engine.js';

describe('Intent classification (UT-03)', () => {
  it('classifies data query intent', () => {
    const result = classifyIntent('cuantos procesos tiene la entidad MSP?');
    assert.equal(result.type, 'data_query');
    assert.ok(result.confidence > 0.5);
  });

  it('classifies navigate intent', () => {
    const result = classifyIntent('ir a procesos');
    assert.equal(result.type, 'navigate');
  });

  it('classifies guided flow intent', () => {
    const result = classifyIntent('guíame para crear un proceso nuevo');
    assert.equal(result.type, 'guided_flow');
  });

  it('classifies question intent', () => {
    const result = classifyIntent('qué es la subasta inversa electrónica?');
    assert.equal(result.type, 'question');
  });

  it('classifies task intent', () => {
    const result = classifyIntent('exportar el informe');
    assert.equal(result.type, 'task');
  });
});

describe('Flow engine (UT-04)', () => {
  const flow: FlowDefinition = {
    id: 'test_flow',
    name: 'test flow',
    steps: [
      { id: 's1', label: 'Step 1', instructions: 'Do step 1' },
      { id: 's2', label: 'Step 2', instructions: 'Do step 2' },
      { id: 's3', label: 'Step 3', instructions: 'Do step 3' },
    ],
  };

  it('initializes flow at step 0', () => {
    const state = initFlow(flow);
    assert.equal(state.currentStep, 0);
    assert.equal(state.completedSteps.length, 0);
  });

  it('advances flow to next step', () => {
    const state = initFlow(flow);
    const next = advanceFlow(state, flow);
    assert.equal(next.currentStep, 1);
    assert.equal(next.completedSteps.length, 1);
    assert.equal(next.completedSteps[0], 's1');
  });

  it('retreats flow to previous step', () => {
    const state = initFlow(flow);
    const next = advanceFlow(state, flow);
    const prev = retreatFlow(next);
    assert.equal(prev.currentStep, 0);
    assert.equal(prev.completedSteps.length, 0);
  });

  it('gets current step', () => {
    const state = initFlow(flow);
    const step = getCurrentStep(state, flow);
    assert.equal(step?.id, 's1');
  });

  it('detects flow completion', () => {
    let state = initFlow(flow);
    state = advanceFlow(state, flow);
    state = advanceFlow(state, flow);
    state = advanceFlow(state, flow);
    assert.equal(isFlowComplete(state, flow), true);
  });

  it('does not complete before all steps done', () => {
    let state = initFlow(flow);
    state = advanceFlow(state, flow);
    assert.equal(isFlowComplete(state, flow), false);
  });
});
