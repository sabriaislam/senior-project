"use client";

import { useEffect, useRef } from "react";

export function FilmGrain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const GRAIN_SIZE = 1.7;
    let animFrame: number;

    function resize() {
      canvas!.width = Math.ceil(window.innerWidth / GRAIN_SIZE);
      canvas!.height = Math.ceil(window.innerHeight / GRAIN_SIZE);
    }

    function drawGrain() {
      const w = canvas!.width;
      const h = canvas!.height;
      const imageData = ctx!.createImageData(w, h);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 38;
      }
      ctx!.putImageData(imageData, 0, 0);
      animFrame = requestAnimationFrame(drawGrain);
    }

    resize();
    drawGrain();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        width: "100%",
        height: "100%",
        imageRendering: "pixelated",
        mixBlendMode: "overlay",
        opacity: 0.22,
        zIndex: 10,
      }}
    />
  );
}
