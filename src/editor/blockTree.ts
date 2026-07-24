import type {
  Block,
  BlockTemplateId,
  ConditionBlock,
} from '../engine/types';
import { cloneBlocks } from '../data/stages';

export type ContainerId = 'root' | `${string}:then` | `${string}:else`;

export function findCondition(
  blocks: Block[],
  conditionId: string,
): ConditionBlock | undefined {
  for (const block of blocks) {
    if (block.type !== 'condition') continue;
    if (block.id === conditionId) return block;

    const nested =
      findCondition(block.then, conditionId) ??
      findCondition(block.else ?? [], conditionId);
    if (nested) return nested;
  }
}

export function getContainer(
  blocks: Block[],
  containerId: ContainerId,
): Block[] | undefined {
  if (containerId === 'root') return blocks;

  const separator = containerId.lastIndexOf(':');
  const conditionId = containerId.slice(0, separator);
  const branch = containerId.slice(separator + 1) as 'then' | 'else';
  const condition = findCondition(blocks, conditionId);
  if (!condition) return;

  if (branch === 'then') return condition.then;
  return condition.else ?? (condition.else = []);
}

function conditionLevel(
  blocks: Block[],
  conditionId: string,
  level = 0,
): number | undefined {
  for (const block of blocks) {
    if (block.type !== 'condition') continue;
    if (block.id === conditionId) return level;

    const nested =
      conditionLevel(block.then, conditionId, level + 1) ??
      conditionLevel(block.else ?? [], conditionId, level + 1);
    if (nested !== undefined) return nested;
  }
}

export function containerDepth(
  blocks: Block[],
  containerId: ContainerId,
): number {
  if (containerId === 'root') return 0;
  const conditionId = containerId.slice(0, containerId.lastIndexOf(':'));
  return (conditionLevel(blocks, conditionId) ?? 0) + 1;
}

export function updateContainer(
  blocks: Block[],
  containerId: ContainerId,
  update: (container: Block[]) => void,
): Block[] {
  const next = cloneBlocks(blocks);
  const container = getContainer(next, containerId);
  if (container) update(container);
  return next;
}

export function sourceUsage(
  blocks: Block[],
): Partial<Record<BlockTemplateId, number>> {
  const usage: Partial<Record<BlockTemplateId, number>> = {};

  const visit = (items: Block[]) => {
    for (const block of items) {
      usage[block.sourceId] = (usage[block.sourceId] ?? 0) + 1;
      if (block.type === 'condition') {
        visit(block.then);
        visit(block.else ?? []);
      }
    }
  };

  visit(blocks);
  return usage;
}

export function containerName(containerId: ContainerId): string {
  if (containerId === 'root') return '프로그램 맨 아래';
  return containerId.endsWith(':then') ? '조건이 맞을 때' : '그 밖에는';
}
