import { describe, expect, it } from 'vitest';
import { E, initialState, num, op, runTick, runToEnd } from './engine';
import type { Block, Stage } from './types';
import { answers, stages } from '../data/stages';

const base = (stage: Partial<Stage> = {}): Stage => ({
  id: 'test',
  number: 0,
  name: '',
  koName: '',
  objective: '',
  width: 5,
  height: 5,
  goal: { x: 4, y: 0 },
  hazards: [],
  energy: 6,
  available: [],
  starter: [],
  targetTicks: 4,
  starLineLimit: 9,
  guide: [],
  ...stage,
});

const move = (
  id: string,
  axis: 'x' | 'y',
  expr = E,
): Block => ({
  id,
  sourceId: axis === 'x' ? 'move-x-e' : 'move-y-e',
  type: 'move',
  axis,
  expr,
});

describe('CueHop engine core rules', () => {
  it('first tick advances E from 0 to 1', () => {
    const stage = base();
    const state = runTick(stage, [], initialState(stage));
    expect(state.E).toBe(1);
  });

  it('energy decreases by exactly 1 per tick', () => {
    const stage = base();
    let state = initialState(stage);
    state = runTick(stage, [], state);
    expect(state.energyLeft).toBe(5);
    state = runTick(stage, [], state);
    expect(state.energyLeft).toBe(4);
  });

  it('multiple movement blocks execute in order in one tick', () => {
    const stage = base({ goal: { x: 9, y: 9 } });
    const state = runTick(
      stage,
      [
        move('a', 'x', num(1)),
        move('b', 'x', num(2)),
        move('c', 'x', num(4)),
      ],
      initialState(stage),
    );
    expect(state.x).toBe(4);
    expect(state.events.filter((event) => event.kind === 'jump')).toHaveLength(3);
  });

  it('x/y order changes path', () => {
    const stage = base({ goal: { x: 9, y: 9 } });
    const xFirst = runTick(
      stage,
      [move('x', 'x'), move('y', 'y')],
      initialState(stage),
    ).events.filter((event) => event.kind === 'jump');
    const yFirst = runTick(
      stage,
      [move('y', 'y'), move('x', 'x')],
      initialState(stage),
    ).events.filter((event) => event.kind === 'jump');

    expect(xFirst[0]).toMatchObject({ to: { x: 1, y: 0 } });
    expect(yFirst[0]).toMatchObject({ to: { x: 0, y: 1 } });
  });

  it('same coordinate waits but continues', () => {
    const stage = base({ goal: { x: 9, y: 9 } });
    const state = runTick(
      stage,
      [move('wait', 'x', num(0)), move('move', 'x', num(1))],
      initialState(stage),
    );
    expect(state.events.some((event) => event.kind === 'wait')).toBe(true);
    expect(state.x).toBe(1);
  });

  it('multi-cell jump ignores intermediate hazards', () => {
    const stage = base({
      height: 1,
      hazards: [{ x: 1, y: 0, kind: 'hole' }],
      goal: { x: 2, y: 0 },
    });
    const state = runTick(
      stage,
      [move('move', 'x', num(2))],
      initialState(stage),
    );
    expect(state.status).toBe('success');
  });

  it('landing on hazard fails', () => {
    const stage = base({
      height: 1,
      hazards: [{ x: 1, y: 0, kind: 'hole' }],
    });
    const state = runTick(
      stage,
      [move('move', 'x', num(1))],
      initialState(stage),
    );
    expect(state.failureReason).toBe('hazard');
  });

  it('landing outside map fails', () => {
    const stage = base({ height: 1 });
    const state = runTick(
      stage,
      [move('move', 'x', num(5))],
      initialState(stage),
    );
    expect(state.failureReason).toBe('out-of-bounds');
  });

  it('passing over goal is not success', () => {
    const stage = base({ height: 1, goal: { x: 1, y: 0 } });
    const state = runTick(
      stage,
      [move('move', 'x', num(2))],
      initialState(stage),
    );
    expect(state.status).toBe('running');
  });

  it('landing on goal stops remaining blocks', () => {
    const stage = base({ height: 1, goal: { x: 1, y: 0 } });
    const state = runTick(
      stage,
      [move('goal', 'x', num(1)), move('bad', 'x', num(2))],
      initialState(stage),
    );
    expect(state.status).toBe('success');
    expect(state.x).toBe(1);
  });

  it('condition true and else branches execute accurately', () => {
    const stage = base({ height: 1, goal: { x: 9, y: 0 } });
    const condition: Block = {
      id: 'condition',
      sourceId: 'condition-eq-two',
      type: 'condition',
      left: E,
      compare: 'eq',
      right: num(1),
      then: [move('true', 'x', num(1))],
      else: [move('false', 'x', num(3))],
    };

    let state = runTick(stage, [condition], initialState(stage));
    expect(state.x).toBe(1);
    state = runTick(stage, [condition], state);
    expect(state.x).toBe(3);
  });

  it('last energy tick fully executes before exhaustion', () => {
    const stage = base({
      height: 1,
      energy: 1,
      goal: { x: 2, y: 0 },
    });
    const state = runTick(
      stage,
      [move('a', 'x', num(1)), move('b', 'x', num(2))],
      initialState(stage),
    );
    expect(state.status).toBe('success');
  });

  it('tutorial answers 1-5 succeed on expected ticks', () => {
    const expected: Record<string, number> = {
      t1: 4,
      t2: 4,
      t3: 4,
      t4: 2,
      t5: 4,
    };

    for (const stage of stages) {
      const state = runToEnd(stage, answers[stage.id]);
      expect(state.status, stage.id).toBe('success');
      expect(state.tick, stage.id).toBe(expected[stage.id]);
    }
  });
});
