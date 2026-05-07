import { useState, useEffect, useRef, useCallback } from "react";

const COLS = 25, ROWS = 22, CELL = 22, SPEED = 110;

function rand(n) { return Math.floor(Math.random() * n); }

function spawnFood(snake) {
  const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
  let pos;
  do { pos = { x: rand(COLS), y: rand(ROWS) }; }
  while (occupied.has(`${pos.x},${pos.y}`));
  return pos;
}

export default function SnakeGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    snake: [], dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 },
    food: { x: 0, y: 0 }, phase: "idle",
  });
  const tickerRef = useRef(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [wrapMode, setWrapMode] = useState(false);
  const wrapRef = useRef(false);
  const [msg, setMsg] = useState("Press WASD / arrow keys or tap a d-pad button to start");

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { snake, dir, food, phase: p } = stateRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f5f4ee";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#e2e0d8";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, canvas.height); ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(canvas.width, y * CELL); ctx.stroke();
    }

    snake.forEach((s, i) => {
      const t = i / Math.max(snake.length - 1, 1);
      const r = Math.round(22 + (8 - 22) * t);
      const g = Math.round(158 + (80 - 158) * t);
      const b = Math.round(117 + (65 - 117) * t);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      ctx.roundRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2, i === 0 ? 6 : 3);
      ctx.fill();
      if (i === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        const h = dir.x !== 0;
        const eyes = h
          ? [[CELL * 0.65, CELL * 0.28], [CELL * 0.65, CELL * 0.68]]
          : [[CELL * 0.28, CELL * 0.65], [CELL * 0.68, CELL * 0.65]];
        eyes.forEach(([ex, ey]) => {
          ctx.beginPath(); ctx.arc(s.x * CELL + ex, s.y * CELL + ey, 3, 0, Math.PI * 2); ctx.fill();
        });
      }
    });

    ctx.fillStyle = "#D85A30";
    ctx.beginPath();
    ctx.roundRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4, 5);
    ctx.fill();
    ctx.fillStyle = "#F0997B";
    ctx.fillRect(food.x * CELL + CELL * 0.4, food.y * CELL + 1, 2, 5);

    if (p === "dead" || p === "paused") {
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff";
      ctx.font = `bold 20px 'Space Mono', monospace`;
      ctx.textAlign = "center";
      ctx.fillText(p === "dead" ? "GAME OVER" : "PAUSED", canvas.width / 2, canvas.height / 2 - 8);
      if (p === "dead") {
        ctx.font = `13px 'Space Mono', monospace`;
        ctx.fillText(`score: ${stateRef.current.scoreVal}`, canvas.width / 2, canvas.height / 2 + 16);
      }
    }
  }, []);

  const startGame = useCallback(() => {
    clearInterval(tickerRef.current);
    const snake = [{ x: 12, y: 11 }, { x: 11, y: 11 }, { x: 10, y: 11 }];
    stateRef.current = {
      snake, dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 },
      food: spawnFood(snake), phase: "running", scoreVal: 0,
    };
    setScore(0); setPhase("running"); setMsg("WASD or arrows to steer");
    tickerRef.current = setInterval(() => {
      const s = stateRef.current;
      if (s.phase !== "running") return;
      s.dir = s.nextDir;
      let head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };
      if (wrapRef.current) {
        head.x = (head.x + COLS) % COLS;
        head.y = (head.y + ROWS) % ROWS;
      } else if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        s.phase = "dead";
        clearInterval(tickerRef.current);
        setBest(prev => Math.max(prev, s.scoreVal));
        setPhase("dead");
        setMsg(`Game over! Score: ${s.scoreVal} — press New Game to retry`);
        draw(); return;
      }
      if (s.snake.some(b => b.x === head.x && b.y === head.y)) {
        s.phase = "dead";
        clearInterval(tickerRef.current);
        setBest(prev => Math.max(prev, s.scoreVal));
        setPhase("dead");
        setMsg(`Game over! Score: ${s.scoreVal} — press New Game to retry`);
        draw(); return;
      }
      s.snake.unshift(head);
      if (head.x === s.food.x && head.y === s.food.y) {
        s.scoreVal = (s.scoreVal || 0) + 1;
        setScore(s.scoreVal);
        s.food = spawnFood(s.snake);
      } else { s.snake.pop(); }
      draw();
    }, SPEED);
    draw();
  }, [draw]);

  const togglePause = useCallback(() => {
    const s = stateRef.current;
    if (s.phase === "running") {
      s.phase = "paused"; clearInterval(tickerRef.current);
      setPhase("paused"); setMsg("Paused — press Resume to continue"); draw();
    } else if (s.phase === "paused") {
      s.phase = "running";
      setPhase("running"); setMsg("WASD or arrows to steer");
      tickerRef.current = setInterval(() => {
        const cur = stateRef.current;
        if (cur.phase !== "running") return;
        cur.dir = cur.nextDir;
        let head = { x: cur.snake[0].x + cur.dir.x, y: cur.snake[0].y + cur.dir.y };
        if (wrapRef.current) {
          head.x = (head.x + COLS) % COLS;
          head.y = (head.y + ROWS) % ROWS;
        } else if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
          cur.phase = "dead"; clearInterval(tickerRef.current);
          setBest(prev => Math.max(prev, cur.scoreVal));
          setPhase("dead"); setMsg(`Game over! Score: ${cur.scoreVal} — press New Game to retry`);
          draw(); return;
        }
        if (cur.snake.some(b => b.x === head.x && b.y === head.y)) {
          cur.phase = "dead"; clearInterval(tickerRef.current);
          setBest(prev => Math.max(prev, cur.scoreVal));
          setPhase("dead"); setMsg(`Game over! Score: ${cur.scoreVal} — press New Game to retry`);
          draw(); return;
        }
        cur.snake.unshift(head);
        if (head.x === cur.food.x && head.y === cur.food.y) {
          cur.scoreVal = (cur.scoreVal || 0) + 1;
          setScore(cur.scoreVal);
          cur.food = spawnFood(cur.snake);
        } else { cur.snake.pop(); }
        draw();
      }, SPEED);
    }
  }, [draw]);

  const steer = useCallback((dx, dy) => {
    const s = stateRef.current;
    if (!(dx === -s.dir.x && dy === -s.dir.y)) s.nextDir = { x: dx, y: dy };
    if (s.phase === "idle" || s.phase === "dead") { startGame(); return; }
    if (s.phase === "paused") togglePause();
  }, [startGame, togglePause]);

  useEffect(() => {
    const onKey = e => {
      const map = {
        ArrowUp: [0,-1], ArrowDown: [0,1], ArrowLeft: [-1,0], ArrowRight: [1,0],
        w: [0,-1], s: [0,1], a: [-1,0], d: [1,0],
        W: [0,-1], S: [0,1], A: [-1,0], D: [1,0],
      };
      if (!map[e.key]) return;
      e.preventDefault();
      const [dx, dy] = map[e.key];
      steer(dx, dy);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [steer]);

  useEffect(() => { draw(); }, [draw]);
  useEffect(() => () => clearInterval(tickerRef.current), []);

  const W = COLS * CELL, H = ROWS * CELL;
  const btnStyle = { fontFamily: "'Space Mono', monospace", fontSize: 12, padding: "7px 18px",
    border: "1px solid #ccc", borderRadius: 8, background: "transparent", cursor: "pointer", letterSpacing: "0.06em" };
  const dBtn = (label, dx, dy) => (
    <button style={{ ...btnStyle, width: 44, height: 44, padding: 0, fontSize: 18 }}
      onClick={() => steer(dx, dy)} aria-label={label}>{label}</button>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"1.5rem 0",
      fontFamily:"'Space Mono', monospace", userSelect:"none" }}>
      <div style={{ fontSize:22, fontWeight:700, letterSpacing:"0.08em", marginBottom:16 }}>🐍 SNAKE</div>
      <div style={{ display:"flex", justifyContent:"space-between", width:W, marginBottom:8 }}>
        <div><div style={{ fontSize:11, color:"#888", letterSpacing:"0.1em" }}>SCORE</div>
          <div style={{ fontSize:22, fontWeight:700 }}>{score}</div></div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:11, color:"#888", letterSpacing:"0.1em", marginBottom:4 }}>MODE</div>
          <div style={{ display:"flex", gap:0, border:"1px solid #ccc", borderRadius:8, overflow:"hidden" }}>
            <button
              style={{ fontFamily:"'Space Mono', monospace", fontSize:11, padding:"4px 10px", border:"none",
                cursor:"pointer", background: !wrapMode ? "#222" : "transparent",
                color: !wrapMode ? "#fff" : "#888", letterSpacing:"0.04em" }}
              onClick={() => { setWrapMode(false); wrapRef.current = false; }}>
              WALL
            </button>
            <button
              style={{ fontFamily:"'Space Mono', monospace", fontSize:11, padding:"4px 10px", border:"none",
                cursor:"pointer", background: wrapMode ? "#222" : "transparent",
                color: wrapMode ? "#fff" : "#888", letterSpacing:"0.04em" }}
              onClick={() => { setWrapMode(true); wrapRef.current = true; }}>
              WRAP
            </button>
          </div>
        </div>
        <div style={{ textAlign:"right" }}><div style={{ fontSize:11, color:"#888", letterSpacing:"0.1em" }}>BEST</div>
          <div style={{ fontSize:22, fontWeight:700 }}>{best}</div></div>
      </div>
      <canvas ref={canvasRef} width={W} height={H}
        style={{ display:"block", border:"1px solid #ddd", borderRadius:4 }} />
      <div style={{ marginTop:12, fontSize:12, color:"#888", minHeight:18, textAlign:"center", maxWidth:W }}>{msg}</div>
      <div style={{ display:"flex", gap:8, marginTop:12 }}>
        <button style={btnStyle} onClick={startGame}>NEW GAME</button>
        <button style={btnStyle} onClick={togglePause}
          disabled={phase === "idle" || phase === "dead"}>
          {phase === "paused" ? "RESUME" : "PAUSE"}
        </button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 44px)", gap:4, marginTop:16 }}>
        <span />{dBtn("↑", 0, -1)}<span />
        {dBtn("←", -1, 0)}{dBtn("↓", 0, 1)}{dBtn("→", 1, 0)}
      </div>
    </div>
  );
}