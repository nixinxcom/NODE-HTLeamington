"use client";

import React, { useEffect, useRef, useState } from "react";
import FM from "@/complements/i18n/FM";

const TENANT_NAME =
  process.env.NEXT_PUBLIC_NIXINX_TENANT_ID ?? "NIXINX";

  const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 720;

// Barra
const PADDLE_BASE_WIDTH = 120;
const PADDLE_HEIGHT = 16;
const PADDLE_BASE_SPEED = 8;
const MIN_PADDLE_WIDTH = 60;

// Bola
const BALL_BASE_RADIUS = 10;
const MIN_BALL_RADIUS = 4;
const BALL_BASE_SPEED_Y = 5;
const BALL_BASE_SPEED_X = 3;

// Dificultad progresiva
const MAX_SPEED_FACTOR = 2.5;       // hasta 2.5x más rápido
const SPEED_GROWTH_RATE = 0.01;     // incremento por segundo
const PADDLE_SHRINK_PER_SEC = 0.5;  // px/seg
const BALL_SHRINK_PER_SEC = 0.1;    // px/seg

// Bloques (config base)
const BRICK_PADDING = 6;
const INITIAL_BRICK_COUNT = 15;       // 5x3 aprox
const MIN_BRICK_WIDTH = 18;
const MIN_BRICK_HEIGHT = 10;

// Área base para bloques (se puede escalar por oleada)
const BASE_BRICKS_AREA_WIDTH = CANVAS_WIDTH * 0.6;
const BASE_BRICKS_AREA_HEIGHT = CANVAS_HEIGHT * 0.25;

type Brick = {
  x: number;
  y: number;
  w: number;
  h: number;
  destroyed: boolean;
};

type BricksArea = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type GameState = {
  paddleX: number;
  paddleWidth: number;
  leftPressed: boolean;
  rightPressed: boolean;

  ballX: number;
  ballY: number;
  ballVX: number;
  ballVY: number;
  ballRadius: number;

  speedFactor: number;

  bricks: Brick[];
  brickCount: number;
  bricksArea: BricksArea;
  bricksTooSmall: boolean;
  waveIndex: number;
};

function createBricksForWave(
  totalBricks: number,
  waveIndex: number,
): { bricks: Brick[]; area: BricksArea; tooSmall: boolean } {
  // Escala de área (1x, 1.5x, 2x… pero max 2x)
  const scale = Math.min(1 + waveIndex * 0.5, 2);
  const areaW = BASE_BRICKS_AREA_WIDTH * scale;
  const areaH = BASE_BRICKS_AREA_HEIGHT * scale;
  const areaX = (CANVAS_WIDTH - areaW) / 2;
  const areaY = (CANVAS_HEIGHT - areaH) / 2;

  const clampedTotal = Math.max(1, Math.floor(totalBricks));

  // Distribución casi cuadrada: filas y columnas
  const cols = Math.ceil(Math.sqrt(clampedTotal));
  const rows = Math.ceil(clampedTotal / cols);

  const cellW = areaW / cols;
  const cellH = areaH / rows;

  const brickW = cellW - BRICK_PADDING;
  const brickH = cellH - BRICK_PADDING;

  const tooSmall =
    brickW < MIN_BRICK_WIDTH || brickH < MIN_BRICK_HEIGHT;

  const bricks: Brick[] = [];
  let placed = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (placed >= clampedTotal) break;
      const x =
        areaX +
        col * cellW +
        BRICK_PADDING / 2;
      const y =
        areaY +
        row * cellH +
        BRICK_PADDING / 2;

      bricks.push({
        x,
        y,
        w: Math.max(MIN_BRICK_WIDTH, brickW),
        h: Math.max(MIN_BRICK_HEIGHT, brickH),
        destroyed: false,
      });
      placed++;
    }
  }

  return {
    bricks,
    area: { x: areaX, y: areaY, w: areaW, h: areaH },
    tooSmall,
  };
}

export default function OfflinePongPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const stateRef = useRef<GameState | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const [completed, setCompleted] = useState(false);
  const completedRef = useRef(false);

  const resetBall = () => {
    if (!stateRef.current) return;
    const s = stateRef.current;
    s.ballX = CANVAS_WIDTH / 2;
    s.ballY = CANVAS_HEIGHT / 3;

    const dirX = Math.random() > 0.5 ? 1 : -1;
    s.ballVX = dirX * BALL_BASE_SPEED_X * s.speedFactor;
    s.ballVY = BALL_BASE_SPEED_Y * s.speedFactor;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const initialWaveIndex = 0;
    const {
      bricks,
      area,
      tooSmall,
    } = createBricksForWave(
      INITIAL_BRICK_COUNT,
      initialWaveIndex,
    );

    stateRef.current = {
      paddleX: (CANVAS_WIDTH - PADDLE_BASE_WIDTH) / 2,
      paddleWidth: PADDLE_BASE_WIDTH,
      leftPressed: false,
      rightPressed: false,

      ballX: CANVAS_WIDTH / 2,
      ballY: CANVAS_HEIGHT / 3,
      ballVX: BALL_BASE_SPEED_X,
      ballVY: BALL_BASE_SPEED_Y,
      ballRadius: BALL_BASE_RADIUS,

      speedFactor: 1,

      bricks,
      brickCount: bricks.length,
      bricksArea: area,
      bricksTooSmall: tooSmall,
      waveIndex: initialWaveIndex,
    };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (!stateRef.current) return;

        if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
          stateRef.current.leftPressed = true;
        }
        if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
          stateRef.current.rightPressed = true;
        }

        // DEBUG: toggle overlay con la tecla "c"
        if (e.key.toLowerCase() === "c") {
          setCompleted(prev => !prev);
        }
      };

    const handleKeyUp = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (!s) return;
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        s.leftPressed = false;
      }
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        s.rightPressed = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const loop = (time: number) => {
      const s = stateRef.current;
      if (!s) return;

      if (lastTimeRef.current == null) {
        lastTimeRef.current = time;
      }
      const deltaSec = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      // --- Dificultad progresiva ---
      s.speedFactor = Math.min(
        MAX_SPEED_FACTOR,
        s.speedFactor + SPEED_GROWTH_RATE * deltaSec,
      );

      s.paddleWidth = Math.max(
        MIN_PADDLE_WIDTH,
        s.paddleWidth - PADDLE_SHRINK_PER_SEC * deltaSec,
      );
      s.ballRadius = Math.max(
        MIN_BALL_RADIUS,
        s.ballRadius - BALL_SHRINK_PER_SEC * deltaSec,
      );

      const paddleSpeed = PADDLE_BASE_SPEED * s.speedFactor;

      // --- Movimiento de barra ---
      if (s.leftPressed) {
        s.paddleX -= paddleSpeed;
      }
      if (s.rightPressed) {
        s.paddleX += paddleSpeed;
      }
      if (s.paddleX < 0) s.paddleX = 0;
      if (s.paddleX > CANVAS_WIDTH - s.paddleWidth) {
        s.paddleX = CANVAS_WIDTH - s.paddleWidth;
      }

      // --- Movimiento de bola ---
      const speedScale = 1 + SPEED_GROWTH_RATE * deltaSec;
      s.ballVX *= speedScale;
      s.ballVY *= speedScale;

      const maxVX = BALL_BASE_SPEED_X * MAX_SPEED_FACTOR;
      const maxVY = BALL_BASE_SPEED_Y * MAX_SPEED_FACTOR;
      s.ballVX = Math.max(-maxVX, Math.min(maxVX, s.ballVX));
      s.ballVY = Math.max(-maxVY, Math.min(maxVY, s.ballVY));

      s.ballX += s.ballVX;
      s.ballY += s.ballVY;

      const r = s.ballRadius;

      // Paredes laterales
      if (s.ballX - r <= 0 || s.ballX + r >= CANVAS_WIDTH) {
        s.ballVX *= -1;
      }

      // Techo
      if (s.ballY - r <= 0) {
        s.ballVY *= -1;
      }

      // Fondo: barra o pérdida
      if (s.ballY + r >= CANVAS_HEIGHT) {
        const paddleTop = CANVAS_HEIGHT - PADDLE_HEIGHT - 10;
        const withinPaddle =
          s.ballX >= s.paddleX &&
          s.ballX <= s.paddleX + s.paddleWidth &&
          s.ballY + r >= paddleTop;

        if (withinPaddle) {
          s.ballVY *= -1;
          const hitPos =
            (s.ballX - s.paddleX - s.paddleWidth / 2) /
            (s.paddleWidth / 2);
          s.ballVX =
            BALL_BASE_SPEED_X *
            s.speedFactor *
            hitPos *
            1.5;
        } else {
          resetBall();
        }
      }

      // --- Colisiones con bloques ---
      for (const brick of s.bricks) {
        if (brick.destroyed) continue;

        const closestX = Math.max(
          brick.x,
          Math.min(s.ballX, brick.x + brick.w),
        );
        const closestY = Math.max(
          brick.y,
          Math.min(s.ballY, brick.y + brick.h),
        );

        const dx = s.ballX - closestX;
        const dy = s.ballY - closestY;
        const distSq = dx * dx + dy * dy;

        if (distSq <= r * r) {
          brick.destroyed = true;
          s.ballVY *= -1;
          break;
        }
      }

      const bricksRemaining = s.bricks.filter(
        (b) => !b.destroyed,
      ).length;

      if (bricksRemaining === 0) {
        // ¿Ya llegamos a “modo infierno”?
        const reachedMaxDifficulty =
          s.speedFactor >= MAX_SPEED_FACTOR - 0.01 &&
          s.paddleWidth <= MIN_PADDLE_WIDTH + 0.5 &&
          s.ballRadius <= MIN_BALL_RADIUS + 0.5;

        if (s.bricksTooSmall || reachedMaxDifficulty) {
          // Fin del juego
          if (!completedRef.current) {
            completedRef.current = true;
            setCompleted(true);
          }
        } else {
          // Nueva oleada, el doble de bloques
          const nextWaveIndex = s.waveIndex + 1;
          const nextBrickCount = s.brickCount * 2;
          const {
            bricks: newBricks,
            area: newArea,
            tooSmall: newTooSmall,
          } = createBricksForWave(
            nextBrickCount,
            nextWaveIndex,
          );

          s.bricks = newBricks;
          s.brickCount = newBricks.length;
          s.bricksArea = newArea;
          s.bricksTooSmall = newTooSmall;
          s.waveIndex = nextWaveIndex;

          resetBall();
        }
      }

      // --- Dibujo ---
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Fondo general
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Textos
      ctx.fillStyle = "#e5e7eb";
      ctx.font =
        "14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("Sin conexión", 16, 26);
      ctx.fillText(
        "← → o A / D para mover la barra",
        16,
        46,
      );

      // Fondo de logo en el área de bloques (se va descubriendo)
      const area = s.bricksArea;
      ctx.save();
      const gradient = ctx.createLinearGradient(
        area.x,
        area.y,
        area.x + area.w,
        area.y + area.h,
      );
      gradient.addColorStop(0, "#0f172a");
      gradient.addColorStop(1, "#4f46e5");
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.4;
      ctx.fillRect(area.x, area.y, area.w, area.h);
      ctx.globalAlpha = 1;

      // Aquí podrías dibujar el logo real de la empresa.
      // De momento dejamos un texto "LOGO".
      ctx.fillStyle = "#e5e7eb";
      ctx.font =
        "bold 32px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        TENANT_NAME,
        area.x + area.w / 2,
        area.y + area.h / 2,
      );
      ctx.textAlign = "start";
      ctx.textBaseline = "alphabetic";
      ctx.restore();

      // Bloques
      for (const brick of s.bricks) {
        if (brick.destroyed) continue;
        ctx.fillStyle = "#f97316";
        ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
      }

      // Barra
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(
        s.paddleX,
        CANVAS_HEIGHT - PADDLE_HEIGHT - 10,
        s.paddleWidth,
        PADDLE_HEIGHT,
      );

      // Bola
      ctx.beginPath();
      ctx.arc(s.ballX, s.ballY, s.ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#38bdf8";
      ctx.fill();
      ctx.closePath();

      if (!completedRef.current) {
        frameRef.current = requestAnimationFrame(loop);
      }
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="w-full max-w-md relative">
        <div className="mb-3 text-center text-sm text-zinc-300">
          <div className="font-semibold text-base">
            <FM
              id="offline.title"
              defaultMessage="You’re offline"
            />
          </div>
          <div className="text-xs text-zinc-400">
            <FM
              id="offline.subtitle"
              defaultMessage="Play a little while the connection comes back."
            />
          </div>
        </div>

        <div className="border border-zinc-700 rounded-2xl overflow-hidden shadow-lg bg-black">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-auto block"
          />
        </div>

        {completed && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/80 rounded-2xl px-4 py-3 text-center text-xs md:text-sm">
              <div className="font-semibold mb-1">
                <FM
                  id="offline.congrats.title"
                  defaultMessage="Well done!"
                />
              </div>
              <div className="text-zinc-300">
                <FM
                  id="offline.congrats.body"
                  defaultMessage="You cleared all the waves. We hope you enjoyed."
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
