import { useCallback, useEffect, useMemo, useState } from 'react';
import { failureText, initialState, runTick } from '../engine/engine';
import type {
  Block,
  EngineState,
  Position,
  Stage,
  StepEvent,
} from '../engine/types';

export type TrailPoint = Position & {
  order: number;
  kind: 'start' | 'jump' | 'wait';
};

const eventDelay = (event: StepEvent, speed: number) => {
  const base =
    event.kind === 'jump'
      ? 420
      : event.kind === 'wait'
        ? 340
        : event.kind === 'block' || event.kind === 'branch'
          ? 230
          : 160;
  return base / speed;
};

export function useGameRunner(stage: Stage, blocks: Block[]) {
  const [engine, setEngine] = useState<EngineState>(() =>
    initialState(stage),
  );
  const [visualPosition, setVisualPosition] = useState<Position>({
    x: 0,
    y: 0,
  });
  const [trail, setTrail] = useState<TrailPoint[]>([
    { x: 0, y: 0, order: 0, kind: 'start' },
  ]);
  const [timeline, setTimeline] = useState<StepEvent[]>([]);
  const [eventIndex, setEventIndex] = useState(0);
  const [activeBlockId, setActiveBlockId] = useState<string>();
  const [activeBranch, setActiveBranch] =
    useState<EngineState['activeBranch']>();
  const [statusMessage, setStatusMessage] = useState(
    '블록을 조립하고 실행해 보세요.',
  );
  const [autoRun, setAutoRun] = useState(false);
  const [timelinePaused, setTimelinePaused] = useState(false);
  const [speed, setSpeed] = useState<1 | 2>(1);

  const isAnimating = timeline.length > 0;

  const queueTick = useCallback(
    (base: EngineState) => {
      const next = runTick(stage, blocks, base);
      setEngine(next);
      setTimeline(next.events);
      setEventIndex(0);
    },
    [blocks, stage],
  );

  const reset = useCallback(
    (message = '블록을 조립하고 실행해 보세요.') => {
      setEngine(initialState(stage));
      setVisualPosition({ x: 0, y: 0 });
      setTrail([{ x: 0, y: 0, order: 0, kind: 'start' }]);
      setTimeline([]);
      setEventIndex(0);
      setActiveBlockId(undefined);
      setActiveBranch(undefined);
      setStatusMessage(message);
      setAutoRun(false);
      setTimelinePaused(false);
    },
    [stage],
  );

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    if (timelinePaused) return;

    if (timeline.length === 0 || eventIndex >= timeline.length) {
      if (timeline.length > 0 && eventIndex >= timeline.length) {
        setTimeline([]);
        setEventIndex(0);
        setVisualPosition({ x: engine.x, y: engine.y });
      }
      return;
    }

    const event = timeline[eventIndex];
    const timer = window.setTimeout(() => {
      if (event.kind === 'tick-start') {
        setStatusMessage(
          `틱 ${event.tick} 시작 · 에너지 1개를 쓰고 E가 ${event.E}이 되었어요.`,
        );
      } else if (event.kind === 'block') {
        setActiveBlockId(event.blockId);
        setStatusMessage('강조된 블록을 실행하고 있어요.');
      } else if (event.kind === 'branch') {
        setActiveBlockId(event.blockId);
        setActiveBranch({ blockId: event.blockId, branch: event.branch });
        setStatusMessage(
          event.branch === 'then'
            ? '조건이 맞아 안쪽 블록을 실행해요.'
            : '조건이 달라 그 밖에는 블록을 실행해요.',
        );
      } else if (event.kind === 'jump') {
        setActiveBlockId(event.blockId);
        setVisualPosition(event.to);
        setTrail((current) => [
          ...current,
          {
            ...event.to,
            order: current.length,
            kind: 'jump',
          },
        ]);
        setStatusMessage(
          `(${event.from.x}, ${event.from.y})에서 (${event.to.x}, ${event.to.y})로 점프!`,
        );
      } else if (event.kind === 'wait') {
        setActiveBlockId(event.blockId);
        setVisualPosition(event.to);
        setTrail((current) => [
          ...current,
          {
            ...event.to,
            order: current.length,
            kind: 'wait',
          },
        ]);
        setStatusMessage('좌표가 같아 이 박자는 제자리에서 기다려요.');
      } else if (event.kind === 'success') {
        setStatusMessage('목표 타일에 정확히 착지했어요!');
        setAutoRun(false);
      } else if (event.kind === 'failure') {
        setStatusMessage(failureText(event.reason));
        if (event.blockId) setActiveBlockId(event.blockId);
        setAutoRun(false);
      }

      setEventIndex((index) => index + 1);
    }, eventDelay(event, speed));

    return () => window.clearTimeout(timer);
  }, [
    engine.x,
    engine.y,
    eventIndex,
    speed,
    timeline,
    timelinePaused,
  ]);

  useEffect(() => {
    if (
      !autoRun ||
      isAnimating ||
      engine.status !== 'running'
    ) {
      return;
    }

    const timer = window.setTimeout(() => queueTick(engine), 320 / speed);
    return () => window.clearTimeout(timer);
  }, [autoRun, engine, isAnimating, queueTick, speed]);

  const run = useCallback(() => {
    const fresh = initialState(stage);
    setVisualPosition({ x: 0, y: 0 });
    setTrail([{ x: 0, y: 0, order: 0, kind: 'start' }]);
    setActiveBlockId(undefined);
    setActiveBranch(undefined);
    setStatusMessage('첫 번째 틱을 준비하고 있어요.');
    setAutoRun(true);
    setTimelinePaused(false);
    queueTick(fresh);
  }, [queueTick, stage]);

  const step = useCallback(() => {
    if (isAnimating || engine.status === 'success' || engine.status === 'failed') {
      return;
    }
    setAutoRun(false);
    setTimelinePaused(false);
    queueTick(engine);
  }, [engine, isAnimating, queueTick]);

  const restart = useCallback(() => {
    run();
  }, [run]);

  const pause = useCallback(() => {
    setAutoRun(false);
    setTimelinePaused(true);
    setStatusMessage('현재 실행 위치에서 일시정지했어요.');
  }, []);

  const resume = useCallback(() => {
    if (engine.status === 'running') {
      setTimelinePaused(false);
      setAutoRun(true);
      setStatusMessage('실행을 계속합니다.');
    }
  }, [engine.status]);

  const phase = useMemo(() => {
    if (timelinePaused) return 'paused';
    if (isAnimating) return autoRun ? 'running' : 'paused';
    if (engine.status === 'success') return 'success';
    if (engine.status === 'failed') return 'failed';
    if (autoRun) return 'running';
    if (engine.tick > 0) return 'paused';
    return 'editing';
  }, [autoRun, engine.status, engine.tick, isAnimating, timelinePaused]);

  return {
    engine,
    visualPosition,
    trail,
    activeBlockId,
    activeBranch,
    statusMessage,
    speed,
    phase,
    isAnimating,
    run,
    step,
    restart,
    pause,
    resume,
    reset,
    setSpeed,
  };
}
