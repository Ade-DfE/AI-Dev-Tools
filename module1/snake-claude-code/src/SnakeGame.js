import { useState, useEffect, useCallback, useRef } from 'react';

const COLS = 20;
const ROWS = 20;
const TICK_MS = 150;

const Direction = { UP: 'UP', DOWN: 'DOWN', LEFT: 'LEFT', RIGHT: 'RIGHT' };

const opposite = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };

function randomCell(snake) {
  let cell;
  do {
    cell = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some(s => s.x === cell.x && s.y === cell.y));
  return cell;
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

  const snakeSet = new Set(snake.map(s => `${s.x},${s.y}`));

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 select-none">
      <h1 className="text-4xl font-bold text-green-400 mb-2 tracking-widest uppercase">
        Snake
      </h1>

      {/* Scoreboard */}
      <div className="flex gap-8 mb-4">
        <div className="text-center">
          <div className="text-xs text-gray-400 uppercase tracking-widest">Score</div>
          <div className="text-2xl font-bold text-white">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-400 uppercase tracking-widest">Best</div>
          <div className="text-2xl font-bold text-yellow-400">{highScore}</div>
        </div>
      </div>

      {/* Game board */}
      <div
        className="relative border-2 border-green-700 bg-gray-800"
        style={{ width: COLS * 24, height: ROWS * 24 }}
      >
        {/* Grid lines */}
        <svg
          className="absolute inset-0 opacity-10"
          width={COLS * 24}
          height={ROWS * 24}
        >
          {Array.from({ length: COLS + 1 }, (_, i) => (
            <line key={`v${i}`} x1={i * 24} y1={0} x2={i * 24} y2={ROWS * 24} stroke="#4ade80" strokeWidth={0.5} />
          ))}
          {Array.from({ length: ROWS + 1 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 24} x2={COLS * 24} y2={i * 24} stroke="#4ade80" strokeWidth={0.5} />
          ))}
        </svg>

        {/* Food */}
        <div
          className="absolute rounded-full bg-red-500 shadow-lg"
          style={{
            left: food.x * 24 + 3,
            top: food.y * 24 + 3,
            width: 18,
            height: 18,
            boxShadow: '0 0 8px 2px rgba(239,68,68,0.7)',
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
                backgroundColor: isHead ? '#4ade80' : `hsl(${140 - i * 2}, 70%, ${50 - i * 0.5}%)`,
                boxShadow: isHead ? '0 0 6px 2px rgba(74,222,128,0.6)' : undefined,
                transition: 'left 0.05s, top 0.05s',
              }}
            />
          );
        })}

        {/* Overlay for idle / paused / dead */}
        {status !== 'running' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded">
            {status === 'idle' && (
              <>
                <p className="text-green-400 text-2xl font-bold mb-2">Ready?</p>
                <p className="text-gray-300 text-sm">Press <kbd className="bg-gray-700 px-1 rounded">Space</kbd> or tap Start</p>
              </>
            )}
            {status === 'paused' && (
              <>
                <p className="text-yellow-400 text-2xl font-bold mb-2">Paused</p>
                <p className="text-gray-300 text-sm">Press <kbd className="bg-gray-700 px-1 rounded">Space</kbd> to resume</p>
              </>
            )}
            {status === 'dead' && (
              <>
                <p className="text-red-400 text-3xl font-bold mb-1">Game Over</p>
                <p className="text-white text-lg mb-3">Score: {score}</p>
                <p className="text-gray-300 text-sm">Press <kbd className="bg-gray-700 px-1 rounded">Space</kbd> or tap Restart</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-5">
        {(status === 'idle' || status === 'dead') && (
          <button
            onClick={reset}
            className="px-6 py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded-lg transition-colors"
          >
            {status === 'dead' ? 'Restart' : 'Start'}
          </button>
        )}
        {status === 'running' && (
          <button
            onClick={() => setStatus('paused')}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors"
          >
            Pause
          </button>
        )}
        {status === 'paused' && (
          <button
            onClick={() => setStatus('running')}
            className="px-6 py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded-lg transition-colors"
          >
            Resume
          </button>
        )}
      </div>

      {/* Mobile D-pad */}
      <div className="mt-6 grid grid-cols-3 gap-1">
        <div />
        <button
          onPointerDown={() => dir !== Direction.DOWN && setDir(Direction.UP)}
          className="p-3 bg-gray-700 hover:bg-gray-600 rounded text-white text-xl active:bg-gray-500"
        >▲</button>
        <div />
        <button
          onPointerDown={() => dir !== Direction.RIGHT && setDir(Direction.LEFT)}
          className="p-3 bg-gray-700 hover:bg-gray-600 rounded text-white text-xl active:bg-gray-500"
        >◀</button>
        <button
          onPointerDown={() => { if (status === 'idle' || status === 'dead') reset(); }}
          className="p-3 bg-gray-800 rounded text-gray-500 text-xs"
        >●</button>
        <button
          onPointerDown={() => dir !== Direction.LEFT && setDir(Direction.RIGHT)}
          className="p-3 bg-gray-700 hover:bg-gray-600 rounded text-white text-xl active:bg-gray-500"
        >▶</button>
        <div />
        <button
          onPointerDown={() => dir !== Direction.UP && setDir(Direction.DOWN)}
          className="p-3 bg-gray-700 hover:bg-gray-600 rounded text-white text-xl active:bg-gray-500"
        >▼</button>
        <div />
      </div>

      <p className="mt-4 text-gray-600 text-xs">WASD or Arrow keys · Space = pause</p>
    </div>
  );
}
