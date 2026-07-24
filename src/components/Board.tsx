import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import type { EngineState, Position, Stage } from '../engine/types';
import type { TrailPoint } from '../hooks/useGameRunner';
import { FrogSprite, GameIcon } from './GameIcons';

type BoardProps = {
  stage: Stage;
  position: Position;
  trail: TrailPoint[];
  status: EngineState['status'];
  speed: 1 | 2;
};

type JumpMotion = {
  from: Position;
  to: Position;
  duration: number;
  key: number;
};

type BoardStyle = CSSProperties & {
  '--board-columns': number;
  '--board-rows': number;
};

type FrogStyle = CSSProperties & {
  '--jump-duration': string;
  '--jump-height': string;
  '--jump-tilt': string;
  '--jump-x': string;
  '--jump-y': string;
};

function gridOffset(steps: number) {
  if (steps === 0) return '0px';

  const gapOperator = steps > 0 ? ' + ' : ' - ';
  const gaps = Array.from(
    { length: Math.abs(steps) },
    () => 'var(--board-gap)',
  ).join(gapOperator);

  return `calc(${steps * 100}%${gapOperator}${gaps})`;
}

export function Board({ stage, position, trail, status, speed }: BoardProps) {
  const cells = [];
  const latestVisit = new Map<string, TrailPoint>();
  const previousPosition = useRef(position);
  const [jumpMotion, setJumpMotion] = useState<JumpMotion>();
  const latestTrailPoint = trail.at(-1);

  useLayoutEffect(() => {
    const from = previousPosition.current;
    const moved = from.x !== position.x || from.y !== position.y;
    const isRecordedJump =
      latestTrailPoint?.kind === 'jump' &&
      latestTrailPoint.x === position.x &&
      latestTrailPoint.y === position.y;

    if (moved && isRecordedJump) {
      setJumpMotion({
        from,
        to: position,
        duration: 420 / speed,
        key: latestTrailPoint.order,
      });
    } else if (moved) {
      setJumpMotion(undefined);
    }

    previousPosition.current = position;
  }, [
    latestTrailPoint?.kind,
    latestTrailPoint?.order,
    latestTrailPoint?.x,
    latestTrailPoint?.y,
    position,
    speed,
  ]);

  useEffect(() => {
    if (!jumpMotion) return;

    const timer = window.setTimeout(
      () => setJumpMotion(undefined),
      jumpMotion.duration,
    );
    return () => window.clearTimeout(timer);
  }, [jumpMotion]);

  for (const point of trail) {
    latestVisit.set(`${point.x},${point.y}`, point);
  }

  for (let y = stage.height - 1; y >= 0; y -= 1) {
    for (let x = 0; x < stage.width; x += 1) {
      const key = `${x},${y}`;
      const isGoal = stage.goal.x === x && stage.goal.y === y;
      const hazard = stage.hazards.find(
        (item) => item.x === x && item.y === y,
      );
      const hasFrog = position.x === x && position.y === y;
      const visit = latestVisit.get(key);
      const hazardType = hazard?.kind === '가시' ? 'spikes' : 'hole';

      cells.push(
        <div
          className={[
            'tile',
            isGoal ? 'tile--goal' : '',
            hazard ? `tile--hazard tile--${hazardType}` : '',
            hasFrog ? 'tile--occupied' : '',
            status === 'success' && isGoal ? 'tile--success' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          key={key}
          style={{
            gridColumn: x + 1,
            gridRow: stage.height - y,
          }}
          aria-label={`좌표 ${x}, ${y}${isGoal ? ', 목표' : ''}${hazard ? `, ${hazard.kind}` : ''}${hasFrog ? ', 개구리 위치' : ''}`}
        >
          <div className="tile__surface">
            {isGoal && (
              <span className="goal-marker" aria-hidden="true">
                <span />
              </span>
            )}
            {hazard && (
              <span className={`hazard-marker hazard-marker--${hazardType}`}>
                {hazardType === 'spikes' && <GameIcon name="spikes" size={42} />}
              </span>
            )}
            {visit && visit.order > 0 && !hasFrog && (
              <span
                className={`visit-marker visit-marker--${visit.kind}`}
                title={`${visit.order}번째 행동`}
              >
                {visit.kind === 'wait' ? (
                  <GameIcon name="pause" size={10} />
                ) : (
                  visit.order
                )}
              </span>
            )}
            <span className="tile__coordinate">
              {x},{y}
            </span>
          </div>
        </div>,
      );
    }
  }

  return (
    <div
      className={`board-stage ${stage.height === 1 ? 'board-stage--compact' : ''}`}
    >
      <div className="board-stage__topline">
        <span>
          MAP {stage.width} × {stage.height}
        </span>
        <span>착지 지점만 판정</span>
      </div>
      <div
        className="board-grid"
        style={
          {
            '--board-columns': stage.width,
            '--board-rows': stage.height,
          } as BoardStyle
        }
      >
        {cells}
        <span
          key={`frog-${jumpMotion?.key ?? 'idle'}`}
          className={[
            'frog-jump-track',
            jumpMotion ? 'frog-jump-track--jumping' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={
            {
              gridColumn: position.x + 1,
              gridRow: stage.height - position.y,
              '--jump-duration': `${jumpMotion?.duration ?? 0}ms`,
              '--jump-height': `${Math.min(
                68,
                34 +
                  (jumpMotion
                    ? Math.abs(jumpMotion.to.x - jumpMotion.from.x) +
                      Math.abs(jumpMotion.to.y - jumpMotion.from.y)
                    : 0) *
                    9,
              )}px`,
              '--jump-tilt': jumpMotion
                ? `${Math.sign(jumpMotion.to.x - jumpMotion.from.x) * 7}deg`
                : '0deg',
              '--jump-x': jumpMotion
                ? gridOffset(jumpMotion.from.x - jumpMotion.to.x)
                : '0px',
              '--jump-y': jumpMotion
                ? gridOffset(jumpMotion.to.y - jumpMotion.from.y)
                : '0px',
            } as FrogStyle
          }
          role="img"
          aria-label={`개구리 위치 ${position.x}, ${position.y}${jumpMotion ? ', 점프 중' : ''}`}
        >
          <span
            className={[
              'frog',
              jumpMotion ? 'frog--jumping' : '',
              status === 'success' && !jumpMotion ? 'frog--success' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <FrogSprite />
          </span>
        </span>
      </div>
      <div className="board-legend" aria-label="맵 범례">
        <span>
          <i className="legend-swatch legend-swatch--safe" /> 안전
        </span>
        <span>
          <i className="legend-swatch legend-swatch--goal" /> 목표
        </span>
        {stage.hazards.length > 0 && (
          <span>
            <i className="legend-swatch legend-swatch--hazard" /> 착지 위험
          </span>
        )}
      </div>
    </div>
  );
}
