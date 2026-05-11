import { useState, useEffect, useCallback, useRef } from 'react';

const COLS = 20;
const ROWS = 20;
const CELL = 24;
const TICK_MS = 150;
const BOARD_W = COLS * CELL;
const BOARD_H = ROWS * CELL;

const DIR = { UP: [0,-1], DOWN: [0,1], LEFT: [-1,0], RIGHT: [1,0] };
const OPPOSITE = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
const INIT_SNAKE = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];

function randomCell(snake) {
  while (true) {
    const cell = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    if (!snake.some(s => s.x === cell.x && s.y === cell.y)) return cell;
  }
}

const styles = {
  page: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '100vh', width: '100%',
    background: '#0f172a', userSelect: 'none', padding: '24px 0',
    boxSizing: 'border-box',
  },
  title: {
    fontSize: 28, fontWeight: 700, letterSpacing: '0.2em',
    color: '#4ade80', marginBottom: 20, textTransform: 'uppercase',
    fontFamily: 'monospace',
  },
  scoreBar: {
    display: 'flex', width: BOARD_W, marginBottom: 12,
    border: '1px solid #334155', borderRadius: 12, overflow: 'hidden',
  },
  scoreCell: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '10px 0', background: '#1e293b',
  },
  scoreDivider: { width: 1, background: '#334155' },
  scoreLabel: {
    fontSize: 10, fontWeight: 600, letterSpacing: '0.15em',
    color: '#64748b', textTransform: 'uppercase', marginBottom: 4,
    fontFamily: 'monospace',
  },
  scoreValue: { fontSize: 28, fontWeight: 700, lineHeight: 1, fontFamily: 'monospace' },
  board: {
    position: 'relative', width: BOARD_W, height: BOARD_H,
    background: '#071a09', border: '3px solid #166534', borderRadius: 8,
    overflow: 'hidden',
    boxShadow: '0 0 30px 6px rgba(22,101,52,0.35), inset 0 0 40px rgba(0,0,0,0.4)',
  },
  overlay: {
    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.78)',
  },
  overlayTitle: { fontWeight: 700, marginBottom: 8, fontFamily: 'monospace' },
  overlayHint: {
    fontSize: 13, color: '#94a3b8', fontFamily: 'monospace', textAlign: 'center',
  },
  kbd: {
    background: '#334155', color: '#e2e8f0', padding: '1px 6px',
    borderRadius: 4, fontSize: 12, fontFamily: 'monospace',
  },
  controls: {
    display: 'flex', gap: 10, marginTop: 14, width: BOARD_W,
  },
  btn: (color) => ({
    flex: 1, padding: '10px 0', fontWeight: 700, fontSize: 13,
    letterSpacing: '0.1em', textTransform: 'uppercase', border: 'none',
    borderRadius: 8, cursor: 'pointer', background: color, color: '#fff',
    fontFamily: 'monospace', transition: 'opacity 0.15s',
  }),
  dpad: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 48px)',
    gridTemplateRows: 'repeat(3, 48px)', gap: 4, marginTop: 16,
  },
  dBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#1e293b', border: '1px solid #334155', borderRadius: 8,
    color: '#94a3b8', fontSize: 18, cursor: 'pointer', fontWeight: 700,
  },
  dBtnCenter: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8,
    color: '#1e293b', fontSize: 18, cursor: 'pointer',
  },
  hint: {
    marginTop: 14, fontSize: 11, color: '#334155',
    fontFamily: 'monospace', letterSpacing: '0.08em',
  },
};

export default function SnakeGame() {
  const [snake, setSnake] = useState(INIT_SNAKE);
  const [food, setFood] = useState({ x: 15, y: 10 });
  const [dir, setDir] = useState('RIGHT');
  const [status, setStatus] = useState('idle');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  const dirRef = useRef(dir);
  const scoreRef = useRef(score);
  const statusRef = useRef(status);

  snakeRef.current = snake;
  foodRef.current = food;
  dirRef.current = dir;
  scoreRef.current = score;
  statusRef.current = status;

  const reset = useCallback(() => {
    const s = [...INIT_SNAKE];
    setSnake(s);
    setFood(randomCell(s));
    setDir('RIGHT');
    setScore(0);
    setStatus('running');
  }, []);

  useEffect(() => {
    const keyMap = {
      ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
      w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
      W: 'UP', S: 'DOWN', A: 'LEFT', D: 'RIGHT',
    };
    const handler = (e) => {
      const newDir = keyMap[e.key];
      if (newDir) {
        e.preventDefault();
        if (statusRef.current === 'running' && newDir !== OPPOSITE[dirRef.current]) {
          setDir(newDir);
          dirRef.current = newDir;
        }
      }
      if (e.key === ' ') {
        e.preventDefault();
        const st = statusRef.current;
        if (st === 'running') setStatus('paused');
        else if (st === 'paused') setStatus('running');
        else if (st === 'idle' || st === 'dead') reset();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [reset]);

  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => {
      const cur = snakeRef.current;
      const [dx, dy] = DIR[dirRef.current];
      const head = { x: cur[0].x + dx, y: cur[0].y + dy };

      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS ||
          cur.some(s => s.x === head.x && s.y === head.y)) {
        clearInterval(id);
        setStatus('dead');
        setBest(prev => Math.max(prev, scoreRef.current));
        return;
      }

      const ate = head.x === foodRef.current.x && head.y === foodRef.current.y;
      const next = ate ? [head, ...cur] : [head, ...cur.slice(0, -1)];
      if (ate) {
        const newScore = scoreRef.current + 10;
        setScore(newScore);
        scoreRef.current = newScore;
        setFood(randomCell(next));
      }
      setSnake(next);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [status]);

  const steer = useCallback((d) => {
    const st = statusRef.current;
    if (st === 'idle' || st === 'dead') { reset(); return; }
    if (st === 'paused') { setStatus('running'); return; }
    if (d !== OPPOSITE[dirRef.current]) {
      setDir(d);
      dirRef.current = d;
    }
  }, [reset]);

  return (
    <div style={styles.page}>
      <div style={styles.title}>🐍 Snake</div>

      {/* Score bar */}
      <div style={styles.scoreBar}>
        <div style={styles.scoreCell}>
          <span style={styles.scoreLabel}>Score</span>
          <span style={{ ...styles.scoreValue, color: '#f1f5f9' }}>{score}</span>
        </div>
        <div style={styles.scoreDivider} />
        <div style={styles.scoreCell}>
          <span style={styles.scoreLabel}>Best</span>
          <span style={{ ...styles.scoreValue, color: '#fbbf24' }}>{best}</span>
        </div>
      </div>

      {/* Game board */}
      <div style={styles.board}>
        {/* Grid */}
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.07 }}
             width={BOARD_W} height={BOARD_H}>
          {Array.from({ length: COLS + 1 }, (_, i) => (
            <line key={`v${i}`} x1={i*CELL} y1={0} x2={i*CELL} y2={BOARD_H}
                  stroke="#4ade80" strokeWidth={0.5} />
          ))}
          {Array.from({ length: ROWS + 1 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i*CELL} x2={BOARD_W} y2={i*CELL}
                  stroke="#4ade80" strokeWidth={0.5} />
          ))}
        </svg>

        {/* Food */}
        <div style={{
          position: 'absolute',
          left: food.x * CELL + 3, top: food.y * CELL + 3,
          width: CELL - 6, height: CELL - 6,
          background: '#f87171', borderRadius: '50%',
          boxShadow: '0 0 10px 3px rgba(248,113,113,0.8)',
        }} />

        {/* Snake */}
        {snake.map((seg, i) => (
          <div key={`${seg.x},${seg.y},${i}`} style={{
            position: 'absolute',
            left: seg.x * CELL + 1, top: seg.y * CELL + 1,
            width: CELL - 2, height: CELL - 2,
            borderRadius: i === 0 ? 6 : 3,
            background: i === 0
              ? '#4ade80'
              : `hsl(${142 - i*1.5}, 60%, ${46 - i*0.4}%)`,
            boxShadow: i === 0 ? '0 0 8px 3px rgba(74,222,128,0.7)' : undefined,
          }} />
        ))}

        {/* Overlay */}
        {status !== 'running' && (
          <div style={styles.overlay}>
            {status === 'idle' && (
              <>
                <div style={{ ...styles.overlayTitle, fontSize: 22, color: '#4ade80' }}>
                  Ready?
                </div>
                <div style={styles.overlayHint}>
                  Press <kbd style={styles.kbd}>Space</kbd> or tap Start
                </div>
              </>
            )}
            {status === 'paused' && (
              <>
                <div style={{ ...styles.overlayTitle, fontSize: 22, color: '#fbbf24' }}>
                  Paused
                </div>
                <div style={styles.overlayHint}>
                  Press <kbd style={styles.kbd}>Space</kbd> to resume
                </div>
              </>
            )}
            {status === 'dead' && (
              <>
                <div style={{ ...styles.overlayTitle, fontSize: 26, color: '#f87171' }}>
                  Game Over
                </div>
                <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 16,
                              marginBottom: 8, fontFamily: 'monospace' }}>
                  Score: {score}
                </div>
                <div style={styles.overlayHint}>
                  Press <kbd style={styles.kbd}>Space</kbd> or tap Restart
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={styles.controls}>
        {(status === 'idle' || status === 'dead') && (
          <button style={styles.btn('#16a34a')} onClick={reset}>
            {status === 'dead' ? 'Restart' : 'Start'}
          </button>
        )}
        {status === 'running' && (
          <button style={styles.btn('#ca8a04')} onClick={() => setStatus('paused')}>
            Pause
          </button>
        )}
        {status === 'paused' && (
          <>
            <button style={styles.btn('#16a34a')} onClick={() => setStatus('running')}>
              Resume
            </button>
            <button style={styles.btn('#475569')} onClick={reset}>
              Restart
            </button>
          </>
        )}
      </div>

      {/* D-pad */}
      <div style={styles.dpad}>
        <span />
        <button style={styles.dBtn} onPointerDown={() => steer('UP')}>▲</button>
        <span />
        <button style={styles.dBtn} onPointerDown={() => steer('LEFT')}>◀</button>
        <button style={styles.dBtnCenter} onPointerDown={reset}>●</button>
        <button style={styles.dBtn} onPointerDown={() => steer('RIGHT')}>▶</button>
        <span />
        <button style={styles.dBtn} onPointerDown={() => steer('DOWN')}>▼</button>
        <span />
      </div>

      <p style={styles.hint}>WASD / Arrow keys · Space = pause</p>
    </div>
  );
}
