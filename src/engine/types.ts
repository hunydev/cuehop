export type Axis = 'x' | 'y';

export type Expr =
  | { type: 'E' }
  | { type: 'num'; value: number }
  | { type: 'op'; op: '+' | '-' | '*'; left: Expr; right: Expr };

export type Compare = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte';

export type BlockTemplateId =
  | 'move-x-e'
  | 'move-y-e'
  | 'move-x-double-e'
  | 'move-x-e-plus-one'
  | 'condition-eq-two';

type BlockBase = {
  id: string;
  sourceId: BlockTemplateId;
};

export type MoveBlock = BlockBase & {
  type: 'move';
  axis: Axis;
  expr: Expr;
};

export type ConditionBlock = BlockBase & {
  type: 'condition';
  left: Expr;
  compare: Compare;
  right: Expr;
  then: Block[];
  else?: Block[];
};

export type Block = MoveBlock | ConditionBlock;

export type BlockOffer = {
  templateId: BlockTemplateId;
  label: string;
  description: string;
  count: number;
  tone: 'blue' | 'violet' | 'amber';
};

export type Tile = 'safe' | 'hazard' | 'goal';

export type Stage = {
  id: string;
  number: number;
  name: string;
  koName: string;
  objective: string;
  width: number;
  height: number;
  goal: { x: number; y: number };
  hazards: { x: number; y: number; kind: string }[];
  energy: number;
  available: BlockOffer[];
  starter: Block[];
  targetTicks: number;
  starLineLimit: number;
  guide: string[];
};

export type RunStatus = 'idle' | 'running' | 'paused' | 'success' | 'failed';

export type FailureReason =
  | 'out-of-bounds'
  | 'hazard'
  | 'energy'
  | 'stopped'
  | 'incomplete';

export type Position = { x: number; y: number };

export type StepEvent =
  | { kind: 'tick-start'; tick: number; E: number; energy: number }
  | { kind: 'block'; blockId: string }
  | { kind: 'branch'; blockId: string; branch: 'then' | 'else' }
  | {
      kind: 'jump' | 'wait';
      blockId: string;
      from: Position;
      to: Position;
    }
  | { kind: 'success'; blockId?: string }
  | {
      kind: 'failure';
      reason: FailureReason;
      blockId?: string;
      at: Position;
    };

export type EngineState = {
  E: number;
  x: number;
  y: number;
  energyLeft: number;
  status: RunStatus;
  tick: number;
  message: string;
  events: StepEvent[];
  activeBlockId?: string;
  activeBranch?: { blockId: string; branch: 'then' | 'else' };
  failureReason?: FailureReason;
  jumps: number;
  waits: number;
  usedLines: number;
  stars: number;
};
