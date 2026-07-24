import { useEffect, useMemo, useState } from 'react';
import {
  cloneBlockWithNewIds,
  makeAvailable,
} from '../data/stages';
import {
  compareText,
  exprText,
  lineCount,
  validate,
} from '../engine/engine';
import type {
  Block,
  BlockOffer,
  EngineState,
  Stage,
} from '../engine/types';
import {
  containerDepth,
  containerName,
  getContainer,
  sourceUsage,
  updateContainer,
  type ContainerId,
} from '../editor/blockTree';
import { GameIcon } from './GameIcons';

type BlockEditorProps = {
  stage: Stage;
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  editable: boolean;
  activeBlockId?: string;
  activeBranch?: EngineState['activeBranch'];
};

type ProgramBlockProps = {
  block: Block;
  index: number;
  containerId: ContainerId;
  selectedTarget: ContainerId;
  onSelectTarget: (target: ContainerId) => void;
  onMove: (containerId: ContainerId, index: number, direction: -1 | 1) => void;
  onDelete: (containerId: ContainerId, index: number) => void;
  onDuplicate: (containerId: ContainerId, index: number) => void;
  canDuplicate: (block: Block) => boolean;
  editable: boolean;
  activeBlockId?: string;
  activeBranch?: EngineState['activeBranch'];
};

function ProgramBlock({
  block,
  index,
  containerId,
  selectedTarget,
  onSelectTarget,
  onMove,
  onDelete,
  onDuplicate,
  canDuplicate,
  editable,
  activeBlockId,
  activeBranch,
}: ProgramBlockProps) {
  const isActive = activeBlockId === block.id;

  if (block.type === 'move') {
    return (
      <article
        className={`program-block program-block--move ${isActive ? 'program-block--active' : ''}`}
      >
        <div className="program-block__index">{index + 1}</div>
        <div className="program-block__body">
          <span className="program-block__eyebrow">좌표 대입</span>
          <strong>
            <span className={`axis-token axis-token--${block.axis}`}>
              {block.axis}
            </span>
            를 <span className="value-token">{exprText(block.expr)}</span>로
          </strong>
        </div>
        <BlockActions
          onMove={(direction) => onMove(containerId, index, direction)}
          onDelete={() => onDelete(containerId, index)}
          onDuplicate={() => onDuplicate(containerId, index)}
          duplicateEnabled={canDuplicate(block)}
          editable={editable}
        />
      </article>
    );
  }

  const thenTarget = `${block.id}:then` as ContainerId;
  const elseTarget = `${block.id}:else` as ContainerId;
  const thenChosen =
    activeBranch?.blockId === block.id && activeBranch.branch === 'then';
  const elseChosen =
    activeBranch?.blockId === block.id && activeBranch.branch === 'else';

  return (
    <article
      className={`program-block program-block--condition ${isActive ? 'program-block--active' : ''}`}
    >
      <div className="condition-header">
        <div className="condition-symbol">IF</div>
        <div>
          <span className="program-block__eyebrow">조건</span>
          <strong>
            E가 {exprText(block.right)}와 {compareText(block.compare)}
          </strong>
        </div>
        <BlockActions
          onMove={(direction) => onMove(containerId, index, direction)}
          onDelete={() => onDelete(containerId, index)}
          onDuplicate={() => onDuplicate(containerId, index)}
          duplicateEnabled={canDuplicate(block)}
          editable={editable}
        />
      </div>

      <BranchArea
        label="조건이 맞을 때"
        badge="THEN"
        blocks={block.then}
        containerId={thenTarget}
        selected={selectedTarget === thenTarget}
        chosen={thenChosen}
        {...{
          selectedTarget,
          onSelectTarget,
          onMove,
          onDelete,
          onDuplicate,
          canDuplicate,
          editable,
          activeBlockId,
          activeBranch,
        }}
      />
      <BranchArea
        label="그 밖에는"
        badge="ELSE"
        blocks={block.else ?? []}
        containerId={elseTarget}
        selected={selectedTarget === elseTarget}
        chosen={elseChosen}
        {...{
          selectedTarget,
          onSelectTarget,
          onMove,
          onDelete,
          onDuplicate,
          canDuplicate,
          editable,
          activeBlockId,
          activeBranch,
        }}
      />
    </article>
  );
}

type BranchAreaProps = Omit<
  ProgramBlockProps,
  'block' | 'index' | 'containerId'
> & {
  label: string;
  badge: string;
  blocks: Block[];
  containerId: ContainerId;
  selected: boolean;
  chosen: boolean;
};

function BranchArea({
  label,
  badge,
  blocks,
  containerId,
  selected,
  chosen,
  selectedTarget,
  onSelectTarget,
  ...blockProps
}: BranchAreaProps) {
  return (
    <section
      className={`branch-area ${selected ? 'branch-area--selected' : ''} ${chosen ? 'branch-area--chosen' : ''}`}
    >
      <button
        className="branch-area__target"
        type="button"
        onClick={() => onSelectTarget(containerId)}
        disabled={!blockProps.editable}
      >
        <span>{badge}</span>
        {label}
        <i>{selected ? '추가 위치 선택됨' : '여기에 블록 추가'}</i>
      </button>
      <div className="branch-area__blocks">
        {blocks.length === 0 ? (
          <button
            className="empty-branch"
            type="button"
            onClick={() => onSelectTarget(containerId)}
            disabled={!blockProps.editable}
          >
            + 팔레트에서 실행할 블록을 고르세요
          </button>
        ) : (
          blocks.map((child, childIndex) => (
            <ProgramBlock
              key={child.id}
              block={child}
              index={childIndex}
              containerId={containerId}
              selectedTarget={selectedTarget}
              onSelectTarget={onSelectTarget}
              {...blockProps}
            />
          ))
        )}
      </div>
    </section>
  );
}

function BlockActions({
  onMove,
  onDelete,
  onDuplicate,
  duplicateEnabled,
  editable,
}: {
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  duplicateEnabled: boolean;
  editable: boolean;
}) {
  return (
    <div className="block-actions">
      <button
        type="button"
        onClick={() => onMove(-1)}
        disabled={!editable}
        aria-label="블록 위로 이동"
        title="위로"
      >
        <GameIcon name="arrow-up" size={13} />
      </button>
      <button
        type="button"
        onClick={() => onMove(1)}
        disabled={!editable}
        aria-label="블록 아래로 이동"
        title="아래로"
      >
        <GameIcon name="arrow-down" size={13} />
      </button>
      <button
        type="button"
        onClick={onDuplicate}
        disabled={!editable || !duplicateEnabled}
        aria-label="블록 복제"
        title="남은 같은 블록이 있을 때 복제"
      >
        <GameIcon name="copy" size={12} />
      </button>
      <button
        className="block-actions__delete"
        type="button"
        onClick={onDelete}
        disabled={!editable}
        aria-label="블록 삭제"
        title="삭제"
      >
        <GameIcon name="close" size={13} />
      </button>
    </div>
  );
}

export function BlockEditor({
  stage,
  blocks,
  onChange,
  editable,
  activeBlockId,
  activeBranch,
}: BlockEditorProps) {
  const [selectedTarget, setSelectedTarget] =
    useState<ContainerId>('root');
  const usage = useMemo(() => sourceUsage(blocks), [blocks]);
  const errors = validate(blocks);

  useEffect(() => {
    if (!getContainer(blocks, selectedTarget)) setSelectedTarget('root');
  }, [blocks, selectedTarget]);

  const remaining = (offer: BlockOffer) =>
    offer.count - (usage[offer.templateId] ?? 0);

  const canAddOffer = (offer: BlockOffer) => {
    if (remaining(offer) <= 0) return false;
    if (
      offer.templateId === 'condition-eq-two' &&
      containerDepth(blocks, selectedTarget) >= 2
    ) {
      return false;
    }
    return true;
  };

  const addBlock = (offer: BlockOffer) => {
    if (!editable || !canAddOffer(offer)) return;
    onChange(
      updateContainer(blocks, selectedTarget, (container) => {
        container.push(makeAvailable(offer.templateId));
      }),
    );
  };

  const moveBlock = (
    containerId: ContainerId,
    index: number,
    direction: -1 | 1,
  ) => {
    onChange(
      updateContainer(blocks, containerId, (container) => {
        const destination = index + direction;
        if (destination < 0 || destination >= container.length) return;
        [container[index], container[destination]] = [
          container[destination],
          container[index],
        ];
      }),
    );
  };

  const deleteBlock = (containerId: ContainerId, index: number) => {
    onChange(
      updateContainer(blocks, containerId, (container) => {
        container.splice(index, 1);
      }),
    );
  };

  const canDuplicate = (block: Block) => {
    const duplicatedUsage = sourceUsage([block]);
    return stage.available.every((offer) => {
      const extra = duplicatedUsage[offer.templateId] ?? 0;
      return (usage[offer.templateId] ?? 0) + extra <= offer.count;
    });
  };

  const duplicateBlock = (containerId: ContainerId, index: number) => {
    const container = getContainer(blocks, containerId);
    const block = container?.[index];
    if (!block || !canDuplicate(block)) return;

    onChange(
      updateContainer(blocks, containerId, (nextContainer) => {
        nextContainer.splice(index + 1, 0, cloneBlockWithNewIds(block));
      }),
    );
  };

  return (
    <section className={`editor-panel ${!editable ? 'editor-panel--locked' : ''}`}>
      <div className="panel-heading">
        <div>
          <span className="section-kicker">PROGRAM</span>
          <h2>점프 규칙 조립</h2>
        </div>
        <div className="line-counter">
          <strong>{lineCount(blocks)}</strong>
          <span>줄</span>
        </div>
      </div>

      <div className="target-bar">
        <span>추가 위치</span>
        <strong>{containerName(selectedTarget)}</strong>
        {selectedTarget !== 'root' && (
          <button type="button" onClick={() => setSelectedTarget('root')}>
            루트로
          </button>
        )}
      </div>

      <div className="palette" aria-label="제공 블록">
        <div className="palette__heading">
          <h3>제공 블록</h3>
          <span>선택한 위치에 추가됩니다</span>
        </div>
        <div className="palette__grid">
          {stage.available.map((offer) => {
            const left = remaining(offer);
            return (
              <button
                className={`palette-card palette-card--${offer.tone}`}
                key={offer.templateId}
                type="button"
                onClick={() => addBlock(offer)}
                disabled={!editable || !canAddOffer(offer)}
              >
                <span className="palette-card__count">
                  {left} / {offer.count}
                </span>
                <strong>{offer.label}</strong>
                <small>{offer.description}</small>
                <span className="palette-card__action">
                  {left > 0 ? (
                    <>
                      <GameIcon name="add" size={11} /> 추가
                    </>
                  ) : (
                    '사용 중'
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="program-canvas">
        <button
          className={`root-target ${selectedTarget === 'root' ? 'root-target--selected' : ''}`}
          type="button"
          onClick={() => setSelectedTarget('root')}
          disabled={!editable}
        >
          <span>START</span>
          위에서 아래로 반복 실행
          <i>
            {selectedTarget === 'root' ? '추가 위치 선택됨' : '루트에 추가'}
          </i>
        </button>

        {errors.map((error) => (
          <p className="editor-error" key={error}>
            {error}
          </p>
        ))}

        {blocks.length === 0 ? (
          <div className="empty-program">
            <span>
              <GameIcon name="add" size={22} />
            </span>
            <strong>아직 프로그램이 비어 있어요</strong>
            <p>위의 제공 블록을 눌러 첫 규칙을 추가하세요.</p>
          </div>
        ) : (
          <div className="program-list">
            {blocks.map((block, index) => (
              <ProgramBlock
                key={block.id}
                block={block}
                index={index}
                containerId="root"
                selectedTarget={selectedTarget}
                onSelectTarget={setSelectedTarget}
                onMove={moveBlock}
                onDelete={deleteBlock}
                onDuplicate={duplicateBlock}
                canDuplicate={canDuplicate}
                editable={editable}
                activeBlockId={activeBlockId}
                activeBranch={activeBranch}
              />
            ))}
          </div>
        )}
      </div>

      {!editable && (
        <div className="editor-lock-note">
          실행을 관찰하고 있어요. 편집하려면 <b>편집으로 돌아가기</b>를
          누르세요.
        </div>
      )}
    </section>
  );
}
