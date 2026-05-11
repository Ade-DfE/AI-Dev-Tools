import { useState, useEffect, useCallback, useRef } from 'react';

const COLS = 20;
const ROWS = 20;
const TICK_MS = 150;

const Direction = { UP: 'UP', DOWN: 'DOWN', LEFT: 'LEFT', RIGHT: 'RIGHT' };

const opposite = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };

function randomCell(snake) {
  while (true) {
    const cell = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    if (!snake.some(s => s.x === cell.x && s.y === cell.y)) return cell;
  }
}

function move(head, dir) {
  const d = { UP: [0, -1], DOWN: [0, 1], LEFT: [-1, 0], RIGHT: [1, 0] }[dir];
  return { x: head.x + d[0], y: head.y + d[1] };
}

function inBounds(cell) {
  return cell.x >= 0 && cell.x < COLS && cell.y >= 0 && cell.y < ROWS;
}

const INIT_SNAKE = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];

export default function SnakeGame() {
  const [snake, setSnake] = useState(INIT_SNAKE);
  const [food, setFood] = useState({ x: 15, y: 10 });
  const [dir, setDir] = useState(Direction.RIGHT);
  const [status, setStatus] = useState('idle'); // idle | running | paused | dead
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const dirRef = useRef(dir);
  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  const statusRef = useRef(status);

  dirRef.current = dir;
  snakeRef.current = snake;
  foodRef.current = food;
  statusRef.current = status;

  const reset = useCallback(() => {
    const initSnake = INIT_SNAKE;
    setSnake(initSnake);
    setFood(randomCell(initSnake));
    setDir(Direction.RIGHT);
    setScore(0);
    setStatus('running');
  }, []);

  // Keyboard controls
  useEffect(() => {
    const keyMap = {
      ArrowUp: Direction.UP,
      ArrowDown: Direction.DOWN,
      ArrowLeft: Direction.LEFT,
      ArrowRight: Direction.RIGHT,
      w: Direction.UP,
      s: Direction.DOWN,
      a: Direction.LEFT,
      d: Direction.RIGHT,
    };

    const handler = (e) => {
      const newDir = keyMap[e.key];
      if (newDir) {
        e.preventDefault();
        if (statusRef.current === 'running' && newDir !== opposite[dirRef.current]) {
          setDir(newDir);
        }
      }
      if (e.key === ' ') {
        e.preventDefault();
        if (statusRef.current === 'running') setStatus('paused');
        else if (statusRef.current === 'paused') setStatus('running');
        else if (statusRef.current === 'idle' || statusRef.current === 'dead') reset();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [reset]);

  // Game tick
  useEffect(() => {
    if (status !== 'running') return;

    const interval = setInterval(() => {
      const currentSnake = snakeRef.current;
      const currentFood = foodRef.current;
      const currentDir = dirRef.current;

      const newHead = move(currentSnake[0], currentDir);

      // Wall or self collision
      const hitWall = !inBounds(newHead);
      const hitSelf = currentSnake.some(s => s.x === newHead.x && s.y === newHead.y);

      if (hitWall || hitSelf) {
        setStatus('dead');
        setHighScore(prev => Math.max(prev, score));
        return;
      }

      const ateFood = newHead.x === currentFood.x && newHead.y === currentFood.y;
      const newSnake = ateFood
        ? [newHead, ...currentSnake]
        : [newHead, ...currentSnake.slice(0, -1)];

      if (ateFood) {
        setScore(prev => prev + 10);
        setFood(randomCell(newSnake));
      }

      setSnake(newSnake);
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [status, score]);

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-950 py-8 select-none">

      {/* Title */}
      <h1 className="text-3xl font-bold tracking-widest uppercase mb-5"
          style={{ color: '#4ade80', letterSpacing: '0.2em' }}>
        🐍 SNAKE
      </h1>

      {/* Scoreboard — clearly separated from the game board */}
      <div className="flex items-stretch gap-0 mb-5 rounded-xl overflow-hidden border border-slate-700"
           style={{ width: COLS * 24 }}>
        <div className="flex-1 flex flex-col items-center justify-center py-3 bg-slate-800">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Score</span>
          <span className="text-3xl font-bold text-white">{score}</span>
        </div>
        <div className="w-px bg-slate-700" />
        <div className="flex-1 flex flex-col items-center justify-center py-3 bg-slate-800">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Best</span>
          <span className="text-3xl font-bold text-yellow-400">{highScore}</span>
        </div>
      </div>

      {/* Game board — distinct dark-green background, strong border */}
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          width: COLS * 24,
          height: ROWS * 24,
          background: '#0a1f0d',
          border: '3px solid #166534',
          boxShadow: '0 0 24px 4px rgba(22,101,52,0.4)',
        }}
      >
        {/* Grid lines */}
        <svg className="absolute inset-0" width={COLS * 24} height={ROWS * 24} style={{ opacity: 0.08 }}>
          {Array.from({ length: COLS + 1 }, (_, i) => (
            <line key={`v${i}`} x1={i * 24} y1={0} x2={i * 24} y2={ROWS * 24} stroke="#4ade80" strokeWidth={0.5} />
          ))}
          {Array.from({ length: ROWS + 1 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 24} x2={COLS * 24} y2={i * 24} stroke="#4ade80" strokeWidth={0.5} />
          ))}
        </svg>

        {/* Food */}
        <div
          className="absolute rounded-full"
          style={{
            left: food.x * 24 + 3,
            top: food.y * 24 + 3,
            width: 18,
            height: 18,
            background: '#f87171',
            boxShadow: '0 0 10px 3px rgba(248,113,113,0.7)',
          }}
        />

        {/* Snake */}
        {snake.map((seg, i) => {
          const isHead = i === 0;
          return (
            <div
              key={`${seg.x},${seg.y},${i}`}
              className="absolute rounded-sm"
              style={{
                left: seg.x * 24 + 1,
                top: seg.y * 24 + 1,
                width: 22,
                height: 22,
                backgroundColor: isHead ? '#4ade80' : `hsl(${140 - i * 2}, 65%, ${48 - i * 0.4}%)`,
                boxShadow: isHead ? '0 0 8px 3px rgba(74,222,128,0.7)' : undefined,
              }}
            />
          );
        })}

        {/* Overlay for idle / paused / dead */}
        {status !== 'running' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center"
               style={{ background: 'rgba(0,0,0,0.75)' }}>
            {status === 'idle' && (
              <>
                <p className="text-2xl font-bold mb-2" style={{ color: '#4ade80' }}>Ready?</p>
                <p className="text-sm text-slate-300">
                  Press <kbd className="bg-slate-700 text-white px-2 py-0.5 rounded text-xs">Space</kbd> or tap Start
                </p>
              </>
            )}
            {status === 'paused' && (
              <>
                <p className="text-2xl font-bold mb-2 text-yellow-400">Paused</p>
                <p className="text-sm text-slate-300">
                  Press <kbd className="bg-slate-700 text-white px-2 py-0.5 rounded text-xs">Space</kbd> to resume
                </p>
              </>
            )}
            {status === 'dead' && (
              <>
                <p className="text-3xl font-bold mb-1 text-red-400">Game Over</p>
                <p className="text-lg font-semibold text-white mb-3">Score: {score}</p>
                <p className="text-sm text-slate-300">
                  Press <kbd className="bg-slate-700 text-white px-2 py-0.5 rounded text-xs">Space</kbd> or tap Restart
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Action buttons — full width of board, clearly separate from game */}
      <div className="flex gap-3 mt-4" style={{ width: COLS * 24 }}>
        {(status === 'idle' || status === 'dead') && (
          <button
            onClick={reset}
            className="flex-1 py-2.5 font-bold rounded-lg text-sm uppercase tracking-wider transition-colors"
            style={{ background: '#16a34a', color: '#fff' }}
            onMouseEnter={e => e.currentTarget.style.background = '#15803d'}
            onMouseLeave={e => e.currentTarget.style.background = '#16a34a'}
          >
            {status === 'dead' ? 'Restart' : 'Start'}
          </button>
        )}
        {status === 'running' && (
          <button
            onClick={() => setStatus('paused')}
            className="flex-1 py-2.5 font-bold rounded-lg text-sm uppercase tracking-wider transition-colors"
            style={{ background: '#ca8a04', color: '#fff' }}
            onMouseEnter={e => e.currentTarget.style.background = '#a16207'}
            onMouseLeave={e => e.currentTarget.style.background = '#ca8a04'}
          >
            Pause
          </button>
        )}
        {status === 'paused' && (
          <button
            onClick={() => setStatus('running')}
            className="flex-1 py-2.5 font-bold rounded-lg text-sm uppercase tracking-wider transition-colors"
            style={{ background: '#16a34a', color: '#fff' }}
            onMouseEnter={e => e.currentTarget.style.background = '#15803d'}
            onMouseLeave={e => e.currentTarget.style.background = '#16a34a'}
          >
            Resume
          </button>
        )}
      </div>

      {/* Mobile D-pad */}
      <div className="mt-5 grid grid-cols-3 gap-2" style={{ width: 148 }}>
        <div />
        <button
          onPointerDown={() => dir !== Direction.DOWN && setDir(Direction.UP)}
          className="flex items-center justify-center rounded-lg text-lg font-bold transition-colors"
          style={{ height: 44, background: '#1e293b', color: '#94a3b8' }}
        >▲</button>
        <div />
        <button
          onPointerDown={() => dir !== Direction.RIGHT && setDir(Direction.LEFT)}
          className="flex items-center justify-center rounded-lg text-lg font-bold"
          style={{ height: 44, background: '#1e293b', color: '#94a3b8' }}
        >◀</button>
        <button
          onPointerDown={() => { if (status === 'idle' || status === 'dead') reset(); }}
          className="flex items-center justify-center rounded-lg"
          style={{ height: 44, background: '#0f172a', color: '#334155', fontSize: 10 }}
        >●</button>
        <button
          onPointerDown={() => dir !== Direction.LEFT && setDir(Direction.RIGHT)}
          className="flex items-center justify-center rounded-lg text-lg font-bold"
          style={{ height: 44, background: '#1e293b', color: '#94a3b8' }}
        >▶</button>
        <div />
        <button
          onPointerDown={() => dir !== Direction.UP && setDir(Direction.DOWN)}
          className="flex items-center justify-center rounded-lg text-lg font-bold"
          style={{ height: 44, background: '#1e293b', color: '#94a3b8' }}
        >▼</button>
        <div />
      </div>

      <p className="mt-5 text-xs text-slate-600 tracking-wide">WASD / Arrow keys · Space = pause</p>
    </div>
  );
}
