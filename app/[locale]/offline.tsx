"use client";

import { useEffect, useRef } from "react";

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 720;

const PADDLE_WIDTH = 120;
const PADDLE_HEIGHT = 16;
const PADDLE_SPEED = 8;

const BALL_RADIUS = 10;
const BALL_SPEED_Y = 5;
const BALL_SPEED_X = 3;

type GameState = {
  paddleX: number;
  leftPressed: boolean;
  rightPressed: boolean;
  ballX: number;
  ballY: number;
  ballVX: number;
  ballVY: number;
};

export default function OfflinePongPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const stateRef = useRef<GameState | null>(null);

  // Inicializa / reinicia la pelota
  const resetBall = () => {
    if (!stateRef.current) return;
    stateRef.current.ballX = CANVAS_WIDTH / 2;
    stateRef.current.ballY = CANVAS_HEIGHT / 3;
    stateRef.current.ballVX =
      (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED_X;
    stateRef.current.ballVY = BALL_SPEED_Y;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Estado inicial
    stateRef.current = {
      paddleX: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
      leftPressed: false,
      rightPressed: false,
      ballX: CANVAS_WIDTH / 2,
      ballY: CANVAS_HEIGHT / 3,
      ballVX: BALL_SPEED_X,
      ballVY: BALL_SPEED_Y,
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!stateRef.current) return;
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        stateRef.current.leftPressed = true;
      }
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        stateRef.current.rightPressed = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!stateRef.current) return;
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        stateRef.current.leftPressed = false;
      }
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        stateRef.current.rightPressed = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const loop = () => {
      const state = stateRef.current;
      if (!state) return;

      // --- Update paddle ---
      if (state.leftPressed) {
        state.paddleX -= PADDLE_SPEED;
      }
      if (state.rightPressed) {
        state.paddleX += PADDLE_SPEED;
      }
      if (state.paddleX < 0) state.paddleX = 0;
      if (state.paddleX > CANVAS_WIDTH - PADDLE_WIDTH) {
        state.paddleX = CANVAS_WIDTH - PADDLE_WIDTH;
      }

      // --- Update ball ---
      state.ballX += state.ballVX;
      state.ballY += state.ballVY;

      // Paredes laterales
      if (
        state.ballX - BALL_RADIUS <= 0 ||
        state.ballX + BALL_RADIUS >= CANVAS_WIDTH
      ) {
        state.ballVX *= -1;
      }

      // Techo
      if (state.ballY - BALL_RADIUS <= 0) {
        state.ballVY *= -1;
      }

      // Fondo: checamos si pega barra o se pierde
      if (state.ballY + BALL_RADIUS >= CANVAS_HEIGHT) {
        const paddleTop = CANVAS_HEIGHT - PADDLE_HEIGHT;
        const withinPaddle =
          state.ballX >= state.paddleX &&
          state.ballX <= state.paddleX + PADDLE_WIDTH &&
          state.ballY + BALL_RADIUS >= paddleTop;

        if (withinPaddle) {
          // Rebote en la barra
          state.ballVY *= -1;

          // Pequeño efecto según dónde pega
          const hitPos =
            (state.ballX - state.paddleX - PADDLE_WIDTH / 2) /
            (PADDLE_WIDTH / 2);
          state.ballVX = BALL_SPEED_X * hitPos * 1.5;
        } else {
          // Se perdió: reiniciamos pelota
          resetBall();
        }
      }

      // --- Draw ---
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Fondo
      ctx.fillStyle = "#020617"; // slate-950
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Texto
      ctx.fillStyle = "#e5e7eb"; // gray-200
      ctx.font = "14px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("Sin conexión", 16, 26);
      ctx.fillText("Usa ← → o A / D para mover la barra", 16, 46);

      // Barra
      ctx.fillStyle = "#22c55e"; // emerald-500
      ctx.fillRect(
        state.paddleX,
        CANVAS_HEIGHT - PADDLE_HEIGHT - 10,
        PADDLE_WIDTH,
        PADDLE_HEIGHT,
      );

      // Pelota
      ctx.beginPath();
      ctx.arc(
        state.ballX,
        state.ballY,
        BALL_RADIUS,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = "#38bdf8"; // sky-400
      ctx.fill();
      ctx.closePath();

      frameRef.current = requestAnimationFrame(loop);
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
      <div className="w-full max-w-md">
        <div className="mb-3 text-center text-sm text-zinc-300">
          <div className="font-semibold text-base">
            Estás sin conexión
          </div>
          <div className="text-xs text-zinc-400">
            Mientras vuelve el internet, juega un rato 🙂
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
      </div>
    </main>
  );
}
