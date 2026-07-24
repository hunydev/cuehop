import { E, num, op } from '../engine/engine';
import type {
  Block,
  BlockOffer,
  BlockTemplateId,
  ConditionBlock,
  MoveBlock,
  Stage,
} from '../engine/types';

const createId = () =>
  crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

export const move = (
  axis: 'x' | 'y',
  expr = E,
  sourceId: BlockTemplateId = axis === 'x' ? 'move-x-e' : 'move-y-e',
): MoveBlock => ({
  id: createId(),
  sourceId,
  type: 'move',
  axis,
  expr,
});

export const condition = (filled = true): ConditionBlock => ({
  id: createId(),
  sourceId: 'condition-eq-two',
  type: 'condition',
  left: E,
  compare: 'eq',
  right: num(2),
  then: filled
    ? [move('x', op('+', E, num(1)), 'move-x-e-plus-one')]
    : [],
  else: filled ? [move('x', E, 'move-x-e')] : [],
});

export const answers: Record<string, Block[]> = {
  t1: [move('x', E, 'move-x-e')],
  t2: [move('y', E, 'move-y-e')],
  t3: [move('x', E, 'move-x-e'), move('y', E, 'move-y-e')],
  t4: [move('x', op('*', E, num(2)), 'move-x-double-e')],
  t5: [condition()],
};

const offer = (
  templateId: BlockTemplateId,
  label: string,
  description: string,
  tone: BlockOffer['tone'],
): BlockOffer => ({
  templateId,
  label,
  description,
  count: 1,
  tone,
});

export const stages: Stage[] = [
  {
    id: 't1',
    number: 1,
    name: 'First Cue',
    koName: '첫 번째 신호',
    objective: 'E의 박자에 맞춰 가로 좌표를 움직여 보세요.',
    width: 5,
    height: 1,
    goal: { x: 4, y: 0 },
    hazards: [],
    energy: 6,
    available: [
      offer(
        'move-x-e',
        'x를 E로',
        '현재 박자 E를 가로 좌표에 대입합니다.',
        'blue',
      ),
    ],
    starter: [],
    targetTicks: 4,
    starLineLimit: 1,
    guide: [
      'E는 한 박자마다 1씩 커져요.',
      'x를 E로 맞추면 개구리가 오른쪽으로 한 칸씩 점프해요.',
    ],
  },
  {
    id: 't2',
    number: 2,
    name: 'Look Up',
    koName: '위를 향해',
    objective: 'y 좌표가 세로 방향을 바꾼다는 것을 확인하세요.',
    width: 1,
    height: 5,
    goal: { x: 0, y: 4 },
    hazards: [],
    energy: 6,
    available: [
      offer(
        'move-y-e',
        'y를 E로',
        '현재 박자 E를 세로 좌표에 대입합니다.',
        'blue',
      ),
    ],
    starter: [],
    targetTicks: 4,
    starLineLimit: 1,
    guide: ['y가 커지면 위쪽으로 점프해요.'],
  },
  {
    id: 't3',
    number: 3,
    name: 'Order Makes the Path',
    koName: '순서가 만드는 길',
    objective: '두 블록의 순서를 바꾸며 한 틱의 이동 경로를 비교하세요.',
    width: 5,
    height: 5,
    goal: { x: 4, y: 4 },
    hazards: [],
    energy: 6,
    available: [
      offer(
        'move-x-e',
        'x를 E로',
        '먼저 실행하면 가로로 먼저 꺾입니다.',
        'blue',
      ),
      offer(
        'move-y-e',
        'y를 E로',
        '먼저 실행하면 세로로 먼저 꺾입니다.',
        'blue',
      ),
    ],
    starter: [],
    targetTicks: 4,
    starLineLimit: 2,
    guide: [
      '한 박자 안에서도 블록은 위에서 아래로 차례대로 실행돼요.',
      '블록의 순서를 바꾸면 점프 경로도 달라져요.',
    ],
  },
  {
    id: 't4',
    number: 4,
    name: 'Leap Ahead',
    koName: '멀리 뛰기',
    objective: '계산 결과로 위험 타일을 건너뛰어 보세요.',
    width: 5,
    height: 1,
    goal: { x: 4, y: 0 },
    hazards: [
      { x: 1, y: 0, kind: '구멍' },
      { x: 3, y: 0, kind: '구멍' },
    ],
    energy: 4,
    available: [
      offer(
        'move-x-double-e',
        'x를 E × 2로',
        'E를 두 배로 계산해 한 번에 멀리 점프합니다.',
        'violet',
      ),
    ],
    starter: [],
    targetTicks: 2,
    starLineLimit: 1,
    guide: [
      '좌표가 멀리 바뀌면 한 번에 멀리 점프해요.',
      '위험한 타일도 착지만 하지 않으면 뛰어넘을 수 있어요.',
    ],
  },
  {
    id: 't5',
    number: 5,
    name: 'Only Then',
    koName: '그때만 점프',
    objective: '조건과 그 밖에는 분기로 가시를 피하고 기다림을 만드세요.',
    width: 5,
    height: 1,
    goal: { x: 4, y: 0 },
    hazards: [{ x: 2, y: 0, kind: '가시' }],
    energy: 6,
    available: [
      offer(
        'condition-eq-two',
        'E가 2일 때',
        '참과 그 밖에는 두 실행 영역을 만듭니다.',
        'amber',
      ),
      offer(
        'move-x-e-plus-one',
        'x를 E + 1로',
        '조건이 맞을 때 가시 너머로 점프합니다.',
        'violet',
      ),
      offer(
        'move-x-e',
        'x를 E로',
        '그 밖의 박자에는 E를 그대로 사용합니다.',
        'blue',
      ),
    ],
    starter: [],
    targetTicks: 4,
    starLineLimit: 3,
    guide: [
      '조건이 맞을 때만 안쪽 블록을 실행해요.',
      '좌표가 그대로라면 점프하지 않고 한 박자 기다려요.',
    ],
  },
];

export function cloneBlocks(blocks: Block[]): Block[] {
  return JSON.parse(JSON.stringify(blocks)) as Block[];
}

export function cloneBlockWithNewIds(block: Block): Block {
  if (block.type === 'move') {
    return { ...cloneBlocks([block])[0], id: createId() } as MoveBlock;
  }

  return {
    ...block,
    id: createId(),
    then: block.then.map(cloneBlockWithNewIds),
    else: block.else?.map(cloneBlockWithNewIds),
  };
}

export function makeAvailable(templateId: BlockTemplateId): Block {
  switch (templateId) {
    case 'move-y-e':
      return move('y', E, templateId);
    case 'move-x-double-e':
      return move('x', op('*', E, num(2)), templateId);
    case 'move-x-e-plus-one':
      return move('x', op('+', E, num(1)), templateId);
    case 'condition-eq-two':
      return condition(false);
    case 'move-x-e':
      return move('x', E, templateId);
  }
}
