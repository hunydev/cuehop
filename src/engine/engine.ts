import type {
  Block,
  Compare,
  EngineState,
  Expr,
  FailureReason,
  Stage,
  StepEvent,
} from './types';

export const num = (value: number): Expr => ({ type: 'num', value });
export const E: Expr = { type: 'E' };
export const op = (
  operator: '+' | '-' | '*',
  left: Expr,
  right: Expr,
): Expr => ({ type: 'op', op: operator, left, right });

export function evalExpr(expr: Expr, state: EngineState): number {
  switch (expr.type) {
    case 'E':
      return state.E;
    case 'num':
      return expr.value;
    case 'op': {
      const left = evalExpr(expr.left, state);
      const right = evalExpr(expr.right, state);

      if (expr.op === '+') return left + right;
      if (expr.op === '-') return left - right;
      return left * right;
    }
  }
}

export function exprText(expr: Expr): string {
  switch (expr.type) {
    case 'E':
      return 'E';
    case 'num':
      return String(expr.value);
    case 'op':
      return `${exprText(expr.left)} ${expr.op === '*' ? '×' : expr.op} ${exprText(expr.right)}`;
  }
}

export function compareText(compare: Compare): string {
  return {
    eq: '같다',
    neq: '같지 않다',
    gt: '크다',
    lt: '작다',
    gte: '크거나 같다',
    lte: '작거나 같다',
  }[compare];
}

function compare(left: number, operator: Compare, right: number): boolean {
  if (operator === 'eq') return left === right;
  if (operator === 'neq') return left !== right;
  if (operator === 'gt') return left > right;
  if (operator === 'lt') return left < right;
  if (operator === 'gte') return left >= right;
  return left <= right;
}

export function initialState(stage: Stage): EngineState {
  return {
    E: 0,
    x: 0,
    y: 0,
    energyLeft: stage.energy,
    status: 'idle',
    tick: 0,
    message: '블록을 조립하고 실행해 보세요.',
    events: [],
    jumps: 0,
    waits: 0,
    usedLines: 0,
    stars: 0,
  };
}

export function lineCount(blocks: Block[]): number {
  return blocks.reduce(
    (count, block) =>
      count +
      1 +
      (block.type === 'condition'
        ? lineCount(block.then) + lineCount(block.else ?? [])
        : 0),
    0,
  );
}

export function validate(blocks: Block[], depth = 0): string[] {
  const errors: string[] = [];

  for (const block of blocks) {
    if (!block.id) errors.push('식별자가 없는 블록이 있습니다.');

    if (block.type === 'move') {
      if (!block.axis || !block.expr) {
        errors.push('값이 비어 있는 이동 블록이 있습니다.');
      }
      continue;
    }

    if (depth >= 2) {
      errors.push('조건 중첩은 최대 2단계까지 가능합니다.');
    }
    if (!block.left || !block.right || !block.compare) {
      errors.push('값이 비어 있는 조건 블록이 있습니다.');
    }

    errors.push(
      ...validate(block.then, depth + 1),
      ...validate(block.else ?? [], depth + 1),
    );
  }

  return errors;
}

function landingFailure(
  stage: Stage,
  x: number,
  y: number,
): FailureReason | undefined {
  if (x < 0 || y < 0 || x >= stage.width || y >= stage.height) {
    return 'out-of-bounds';
  }
  if (stage.hazards.some((hazard) => hazard.x === x && hazard.y === y)) {
    return 'hazard';
  }
}

function finishStars(
  stage: Stage,
  state: EngineState,
  blocks: Block[],
): void {
  state.stars =
    1 +
    (state.tick <= stage.targetTicks ? 1 : 0) +
    (lineCount(blocks) <= stage.starLineLimit ? 1 : 0);
  state.usedLines = lineCount(blocks);
}

function record(state: EngineState, event: StepEvent): void {
  state.events.push(event);
}

export function failureText(reason?: FailureReason): string {
  if (reason === 'out-of-bounds') return '맵 밖으로 착지해 절벽에서 떨어졌어요.';
  if (reason === 'hazard') return '위험 타일에 착지했어요.';
  if (reason === 'energy') return '마지막 에너지를 모두 사용했어요.';
  if (reason === 'incomplete') return '완성되지 않은 블록이 있어요.';
  return '실행을 멈췄어요.';
}

function fail(
  state: EngineState,
  reason: FailureReason,
  blockId: string | undefined,
  at: { x: number; y: number },
): void {
  state.status = 'failed';
  state.failureReason = reason;
  state.message = failureText(reason);
  record(state, { kind: 'failure', reason, blockId, at });
}

function succeed(
  stage: Stage,
  state: EngineState,
  blocks: Block[],
  blockId?: string,
): void {
  state.status = 'success';
  state.message = '목표 타일에 정확히 착지했어요!';
  finishStars(stage, state, blocks);
  record(state, { kind: 'success', blockId });
}

function runBlocks(
  stage: Stage,
  blocks: Block[],
  state: EngineState,
  rootBlocks: Block[],
): void {
  for (const block of blocks) {
    if (state.status === 'success' || state.status === 'failed') return;

    state.activeBlockId = block.id;
    record(state, { kind: 'block', blockId: block.id });

    if (block.type === 'condition') {
      const branch = compare(
        evalExpr(block.left, state),
        block.compare,
        evalExpr(block.right, state),
      )
        ? 'then'
        : 'else';

      state.activeBranch = { blockId: block.id, branch };
      record(state, { kind: 'branch', blockId: block.id, branch });
      runBlocks(
        stage,
        branch === 'then' ? block.then : (block.else ?? []),
        state,
        rootBlocks,
      );
      continue;
    }

    const from = { x: state.x, y: state.y };
    const value = evalExpr(block.expr, state);
    const to = {
      x: block.axis === 'x' ? value : state.x,
      y: block.axis === 'y' ? value : state.y,
    };

    if (to.x === from.x && to.y === from.y) {
      state.waits += 1;
      record(state, { kind: 'wait', blockId: block.id, from, to });
      continue;
    }

    state.x = to.x;
    state.y = to.y;
    state.jumps += 1;
    record(state, { kind: 'jump', blockId: block.id, from, to });

    const reason = landingFailure(stage, to.x, to.y);
    if (reason) {
      fail(state, reason, block.id, to);
      return;
    }

    if (to.x === stage.goal.x && to.y === stage.goal.y) {
      succeed(stage, state, rootBlocks, block.id);
      return;
    }
  }
}

export function runTick(
  stage: Stage,
  blocks: Block[],
  previous: EngineState,
): EngineState {
  const state: EngineState = {
    ...previous,
    events: [],
    activeBlockId: undefined,
    activeBranch: undefined,
    usedLines: lineCount(blocks),
  };

  if (validate(blocks).length > 0) {
    fail(state, 'incomplete', undefined, { x: state.x, y: state.y });
    return state;
  }
  if (state.energyLeft <= 0) {
    fail(state, 'energy', undefined, { x: state.x, y: state.y });
    return state;
  }

  state.status = 'running';
  state.energyLeft -= 1;
  state.E += 1;
  state.tick += 1;
  state.message = '프로그램을 위에서 아래로 실행하고 있어요.';
  record(state, {
    kind: 'tick-start',
    tick: state.tick,
    E: state.E,
    energy: state.energyLeft,
  });

  runBlocks(stage, blocks, state, blocks);

  if (state.status === 'running' && state.energyLeft === 0) {
    fail(state, 'energy', undefined, { x: state.x, y: state.y });
  }

  return state;
}

export function runToEnd(stage: Stage, blocks: Block[]): EngineState {
  let state = initialState(stage);

  while (state.status !== 'success' && state.status !== 'failed') {
    state = runTick(stage, blocks, state);
  }

  return state;
}
