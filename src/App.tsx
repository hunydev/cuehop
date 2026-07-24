import { useEffect, useMemo, useState } from 'react';
import { BlockEditor } from './components/BlockEditor';
import { Board } from './components/Board';
import { cloneBlocks, stages } from './data/stages';
import { failureText, lineCount, validate } from './engine/engine';
import type { Block, Stage } from './engine/types';
import { useGameRunner } from './hooks/useGameRunner';

const progressKey = 'cuehop-progress-v1';

type Screen = 'title' | 'select' | 'play';
type Progress = Record<string, number>;

function loadProgress(): Progress {
  try {
    return JSON.parse(localStorage.getItem(progressKey) ?? '{}') as Progress;
  } catch {
    return {};
  }
}

function Logo() {
  return (
    <div className="brand" aria-label="CueHop">
      <span className="brand__mark" aria-hidden="true">
        <b>🐸</b>
      </span>
      <span className="brand__word">
        Cue<strong>Hop</strong>
      </span>
    </div>
  );
}

function Stars({ count, compact = false }: { count: number; compact?: boolean }) {
  return (
    <span className={`stars ${compact ? 'stars--compact' : ''}`} aria-label={`별 ${count}개`}>
      {[1, 2, 3].map((star) => (
        <span className={star <= count ? 'stars__earned' : ''} key={star}>
          ★
        </span>
      ))}
    </span>
  );
}

function AppHeader({
  screen,
  totalStars,
  onHome,
  onStages,
}: {
  screen: Screen;
  totalStars: number;
  onHome: () => void;
  onStages: () => void;
}) {
  return (
    <header className="app-header">
      <button className="brand-button" type="button" onClick={onHome}>
        <Logo />
      </button>
      <nav>
        <button
          className={screen === 'select' ? 'nav-active' : ''}
          type="button"
          onClick={onStages}
        >
          튜토리얼
        </button>
        <span className="progress-pill">
          <b>★</b> {totalStars}
          <i>/ 15</i>
        </span>
      </nav>
    </header>
  );
}

function TitleScreen({ onStart }: { onStart: () => void }) {
  return (
    <section className="landing">
      <div className="landing__copy">
        <span className="landing__badge">LOGIC PUZZLE · TUTORIAL 01–05</span>
        <h1>
          신호를 조립하고,
          <br />
          <em>점프를 설계하세요.</em>
        </h1>
        <p>
          직접 움직이는 대신 규칙을 만드세요. 엔진 박자 <b>E</b>에 맞춰
          개구리가 당신의 프로그램을 그대로 실행합니다.
        </p>
        <div className="landing__actions">
          <button className="button button--primary button--large" onClick={onStart}>
            튜토리얼 시작
            <span>→</span>
          </button>
          <span>5개 스테이지 · 약 10분</span>
        </div>
      </div>
      <div className="landing-demo" aria-label="CueHop 게임 미리보기">
        <div className="landing-demo__glow" />
        <div className="demo-code">
          <div className="demo-code__header">
            <span />
            <span />
            <span />
            <b>RUNNING</b>
          </div>
          <div className="demo-code__line demo-code__line--active">
            <span>01</span>
            <strong>
              <i>x</i>를 <em>E</em>로
            </strong>
          </div>
          <div className="demo-code__line">
            <span>02</span>
            <strong>
              <i>y</i>를 <em>E</em>로
            </strong>
          </div>
        </div>
        <div className="demo-route">
          {[0, 1, 2, 3, 4].map((cell) => (
            <div className={cell === 4 ? 'demo-route__goal' : ''} key={cell}>
              {cell === 2 && <span>🐸</span>}
              {cell === 4 && <i />}
            </div>
          ))}
        </div>
        <div className="demo-engine">
          <span>ENGINE BEAT</span>
          <strong>E = 2</strong>
          <i>다음 좌표 (2, 2)</i>
        </div>
      </div>
      <div className="landing__principles">
        <div>
          <span>01</span>
          <strong>규칙을 조립</strong>
          <p>주어진 블록만으로 프로그램을 만듭니다.</p>
        </div>
        <div>
          <span>02</span>
          <strong>실행을 관찰</strong>
          <p>한 틱 안에서도 블록은 순서대로 움직입니다.</p>
        </div>
        <div>
          <span>03</span>
          <strong>정확히 착지</strong>
          <p>목표 위를 지나지 말고 타일에 착지하세요.</p>
        </div>
      </div>
    </section>
  );
}

function StageMiniMap({ stage }: { stage: Stage }) {
  const cells = [];
  for (let y = stage.height - 1; y >= 0; y -= 1) {
    for (let x = 0; x < stage.width; x += 1) {
      const isGoal = stage.goal.x === x && stage.goal.y === y;
      const isHazard = stage.hazards.some(
        (hazard) => hazard.x === x && hazard.y === y,
      );
      const isStart = x === 0 && y === 0;
      cells.push(
        <span
          className={[
            isGoal ? 'mini-tile--goal' : '',
            isHazard ? 'mini-tile--hazard' : '',
            isStart ? 'mini-tile--start' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          key={`${x},${y}`}
        />,
      );
    }
  }

  return (
    <div
      className="mini-map"
      style={{ gridTemplateColumns: `repeat(${stage.width}, 1fr)` }}
    >
      {cells}
    </div>
  );
}

function StageSelect({
  progress,
  onSelect,
}: {
  progress: Progress;
  onSelect: (stage: Stage) => void;
}) {
  return (
    <section className="stage-select">
      <div className="screen-heading">
        <span className="section-kicker">TUTORIAL ROUTE</span>
        <h1>
          다섯 번의 점프로
          <br />
          규칙을 익혀요
        </h1>
        <p>각 스테이지는 하나의 새로운 생각만 소개합니다.</p>
      </div>
      <div className="stage-grid">
        {stages.map((stage) => {
          const stars = progress[stage.id] ?? 0;
          return (
            <button
              className="stage-card"
              type="button"
              onClick={() => onSelect(stage)}
              key={stage.id}
            >
              <div className="stage-card__top">
                <span className="stage-number">
                  {String(stage.number).padStart(2, '0')}
                </span>
                <Stars count={stars} compact />
              </div>
              <StageMiniMap stage={stage} />
              <div className="stage-card__copy">
                <span>{stage.name}</span>
                <h2>{stage.koName}</h2>
                <p>{stage.objective}</p>
              </div>
              <div className="stage-card__meta">
                <span>⚡ {stage.energy}</span>
                <span>목표 {stage.targetTicks}틱</span>
                <b>{stars > 0 ? '다시 플레이' : '시작하기'} →</b>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function EnergyMeter({ left, total }: { left: number; total: number }) {
  return (
    <span className="energy-meter" aria-label={`남은 에너지 ${left}/${total}`}>
      {Array.from({ length: total }, (_, index) => (
        <i className={index < left ? 'energy-meter__filled' : ''} key={index} />
      ))}
    </span>
  );
}

function RunControls({
  phase,
  speed,
  disabled,
  isAnimating,
  onRun,
  onPause,
  onResume,
  onStep,
  onRestart,
  onEdit,
  onSpeed,
}: {
  phase: string;
  speed: 1 | 2;
  disabled: boolean;
  isAnimating: boolean;
  onRun: () => void;
  onPause: () => void;
  onResume: () => void;
  onStep: () => void;
  onRestart: () => void;
  onEdit: () => void;
  onSpeed: () => void;
}) {
  const hasStarted = phase !== 'editing';
  const isFinished = phase === 'success' || phase === 'failed';

  if (isFinished) {
    return (
      <div className="run-controls run-controls--finished">
        <div className="run-controls__secondary">
          <button type="button" onClick={onRestart} disabled={disabled}>
            ↻ 같은 프로그램 다시 실행
          </button>
          <button type="button" onClick={onSpeed}>
            속도 <b>×{speed}</b>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="run-controls">
      <div className="run-controls__primary">
        {phase === 'editing' && (
          <button
            className="button button--run"
            type="button"
            onClick={onRun}
            disabled={disabled}
          >
            <span>▶</span> 실행
          </button>
        )}
        {phase === 'running' && (
          <button className="button button--pause" type="button" onClick={onPause}>
            <span>Ⅱ</span> 일시정지
          </button>
        )}
        {phase === 'paused' && (
          <button className="button button--run" type="button" onClick={onResume}>
            <span>▶</span> 계속
          </button>
        )}
        <button
          className="button button--secondary"
          type="button"
          onClick={onStep}
          disabled={disabled || isAnimating}
        >
          다음 틱
        </button>
      </div>
      <div className="run-controls__secondary">
        <button type="button" onClick={onRestart} disabled={disabled || !hasStarted}>
          ↻ 처음부터
        </button>
        <button type="button" onClick={onEdit} disabled={!hasStarted}>
          ✎ 실행 중지
        </button>
        <button type="button" onClick={onSpeed}>
          속도 <b>×{speed}</b>
        </button>
      </div>
    </div>
  );
}

function ResultPanel({
  stage,
  state,
  onEdit,
  onNext,
}: {
  stage: Stage;
  state: ReturnType<typeof useGameRunner>['engine'];
  onEdit: () => void;
  onNext?: () => void;
}) {
  if (state.status !== 'success' && state.status !== 'failed') return null;

  if (state.status === 'failed') {
    return (
      <section className="result-panel result-panel--failed">
        <span className="result-panel__icon">!</span>
        <div>
          <span className="section-kicker">RUN STOPPED</span>
          <h3>{failureText(state.failureReason)}</h3>
          <p>
            틱 {state.tick} · 마지막 좌표 ({state.x}, {state.y})
          </p>
        </div>
        <button className="button button--light" type="button" onClick={onEdit}>
          원인 확인 후 편집
        </button>
      </section>
    );
  }

  const starChecks = [
    { label: '목표 타일 도착', earned: true },
    {
      label: `${stage.targetTicks}틱 이내 도착`,
      earned: state.tick <= stage.targetTicks,
    },
    {
      label: `코드 ${stage.starLineLimit}줄 이하`,
      earned: state.usedLines <= stage.starLineLimit,
    },
  ];

  return (
    <section className="result-panel result-panel--success">
      <div className="result-panel__celebration">
        <span>STAGE CLEAR</span>
        <Stars count={state.stars} />
      </div>
      <div className="result-panel__stats">
        <div>
          <span>사용한 틱</span>
          <strong>{state.tick}</strong>
        </div>
        <div>
          <span>코드 줄</span>
          <strong>{state.usedLines}</strong>
        </div>
        <div>
          <span>점프 / 기다림</span>
          <strong>
            {state.jumps} / {state.waits}
          </strong>
        </div>
      </div>
      <div className="star-checks">
        {starChecks.map((check) => (
          <span className={check.earned ? 'star-checks__earned' : ''} key={check.label}>
            <i>{check.earned ? '★' : '☆'}</i>
            {check.label}
          </span>
        ))}
      </div>
      <div className="result-panel__actions">
        <button className="button button--light" type="button" onClick={onEdit}>
          다시 편집
        </button>
        {onNext && (
          <button className="button button--primary" type="button" onClick={onNext}>
            다음 스테이지 →
          </button>
        )}
      </div>
    </section>
  );
}

function GameScreen({
  stage,
  blocks,
  onBlocksChange,
  onBack,
  onNext,
  onSuccess,
}: {
  stage: Stage;
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
  onBack: () => void;
  onNext?: () => void;
  onSuccess: (stars: number) => void;
}) {
  const runner = useGameRunner(stage, blocks);
  const errors = validate(blocks);
  const runDisabled = blocks.length === 0 || errors.length > 0;
  const editable = runner.phase === 'editing';

  useEffect(() => {
    if (runner.engine.status === 'success' && !runner.isAnimating) {
      onSuccess(runner.engine.stars);
    }
  }, [
    onSuccess,
    runner.engine.stars,
    runner.engine.status,
    runner.isAnimating,
  ]);

  const handleBlocksChange = (next: Block[]) => {
    runner.reset('프로그램이 바뀌었어요. 실행할 준비가 됐습니다.');
    onBlocksChange(next);
  };

  return (
    <section className="game-screen">
      <div className="game-breadcrumb">
        <button type="button" onClick={onBack}>
          ← 스테이지 선택
        </button>
        <span>튜토리얼 {String(stage.number).padStart(2, '0')} / 05</span>
      </div>

      <div className="mission-heading">
        <div>
          <span className="section-kicker">{stage.name}</span>
          <h1>{stage.koName}</h1>
          <p>{stage.objective}</p>
        </div>
        <div className="mission-goal">
          <span>이번 목표</span>
          <strong>{stage.targetTicks}틱 · {stage.starLineLimit}줄</strong>
        </div>
      </div>

      <div className="game-workspace">
        <section className="arena-panel">
          <div className="engine-hud">
            <div className="engine-beat">
              <span>ENGINE BEAT</span>
              <strong>E = {runner.engine.E}</strong>
            </div>
            <div className="hud-stat">
              <span>현재 좌표</span>
              <strong>
                ({runner.visualPosition.x}, {runner.visualPosition.y})
              </strong>
            </div>
            <div className="hud-stat hud-stat--energy">
              <span>남은 에너지</span>
              <EnergyMeter left={runner.engine.energyLeft} total={stage.energy} />
            </div>
            <span className={`phase-badge phase-badge--${runner.phase}`}>
              <i />
              {runner.phase === 'editing'
                ? 'EDITING'
                : runner.phase === 'running'
                  ? 'RUNNING'
                  : runner.phase === 'paused'
                    ? 'PAUSED'
                    : runner.phase.toUpperCase()}
            </span>
          </div>

          <Board
            stage={stage}
            position={runner.visualPosition}
            trail={runner.trail}
            status={runner.engine.status}
          />

          <div className="status-console" role="status" aria-live="polite">
            <span className="status-console__icon">
              {runner.phase === 'running' ? '↳' : runner.phase === 'failed' ? '!' : '•'}
            </span>
            <div>
              <span>STATUS · TICK {runner.engine.tick}</span>
              <strong>{runner.statusMessage}</strong>
            </div>
          </div>

          {!runner.isAnimating && (
            <ResultPanel
              stage={stage}
              state={runner.engine}
              onEdit={() =>
                runner.reset('실패 원인을 반영해 블록을 수정해 보세요.')
              }
              onNext={onNext}
            />
          )}

          <RunControls
            phase={runner.phase}
            speed={runner.speed}
            disabled={runDisabled}
            isAnimating={runner.isAnimating}
            onRun={runner.run}
            onPause={runner.pause}
            onResume={runner.resume}
            onStep={runner.step}
            onRestart={runner.restart}
            onEdit={() => runner.reset('편집 모드로 돌아왔어요.')}
            onSpeed={() => runner.setSpeed(runner.speed === 1 ? 2 : 1)}
          />

          {runDisabled && (
            <p className="run-hint">
              {blocks.length === 0
                ? '제공 블록을 프로그램에 추가하면 실행할 수 있어요.'
                : errors[0]}
            </p>
          )}

          <details className="guide-card" open>
            <summary>
              <span>?</span>
              이번 스테이지 힌트
            </summary>
            <div>
              {stage.guide.map((tip) => (
                <p key={tip}>{tip}</p>
              ))}
            </div>
          </details>
        </section>

        <BlockEditor
          stage={stage}
          blocks={blocks}
          onChange={handleBlocksChange}
          editable={editable}
          activeBlockId={runner.activeBlockId}
          activeBranch={runner.activeBranch}
        />
      </div>
    </section>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [stage, setStage] = useState<Stage>(stages[0]);
  const [blocks, setBlocks] = useState<Block[]>(() =>
    cloneBlocks(stages[0].starter),
  );
  const [progress, setProgress] = useState<Progress>(loadProgress);

  const totalStars = useMemo(
    () => stages.reduce((total, item) => total + (progress[item.id] ?? 0), 0),
    [progress],
  );

  const selectStage = (nextStage: Stage) => {
    setStage(nextStage);
    setBlocks(cloneBlocks(nextStage.starter));
    setScreen('play');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveSuccess = (stars: number) => {
    setProgress((current) => {
      if ((current[stage.id] ?? 0) >= stars) return current;
      const next = { ...current, [stage.id]: stars };
      localStorage.setItem(progressKey, JSON.stringify(next));
      return next;
    });
  };

  const nextStage = stages[stage.number];

  return (
    <div className="app-shell">
      <AppHeader
        screen={screen}
        totalStars={totalStars}
        onHome={() => setScreen('title')}
        onStages={() => setScreen('select')}
      />
      <main>
        {screen === 'title' && (
          <TitleScreen onStart={() => setScreen('select')} />
        )}
        {screen === 'select' && (
          <StageSelect progress={progress} onSelect={selectStage} />
        )}
        {screen === 'play' && (
          <GameScreen
            stage={stage}
            blocks={blocks}
            onBlocksChange={setBlocks}
            onBack={() => setScreen('select')}
            onNext={nextStage ? () => selectStage(nextStage) : undefined}
            onSuccess={saveSuccess}
          />
        )}
      </main>
      <footer>
        <Logo />
        <span>Set the cue. Watch the frog hop.</span>
        <span>Core rules · MVP 1.0</span>
      </footer>
    </div>
  );
}
