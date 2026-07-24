import type { CSSProperties } from 'react';
import type { EngineState, Position, Stage } from '../engine/types';
import type { TrailPoint } from '../hooks/useGameRunner';

type BoardProps = {
  stage: Stage;
  position: Position;
  trail: TrailPoint[];
  status: EngineState['status'];
};

export function Board({ stage, position, trail, status }: BoardProps) {
  const cells = [];
  const latestVisit = new Map<string, TrailPoint>();

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
                {hazardType === 'spikes' ? '▲▲' : ''}
              </span>
            )}
            {visit && visit.order > 0 && !hasFrog && (
              <span
                className={`visit-marker visit-marker--${visit.kind}`}
                title={`${visit.order}번째 행동`}
              >
                {visit.kind === 'wait' ? '•' : visit.order}
              </span>
            )}
            {hasFrog && (
              <span
                className={`frog ${status === 'success' ? 'frog--success' : ''}`}
                role="img"
                aria-label="개구리"
              >
                🐸
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
          } as CSSProperties
        }
      >
        {cells}
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
