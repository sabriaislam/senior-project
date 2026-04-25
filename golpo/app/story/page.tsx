"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getLastEntry, type ResponseEntry } from "@/lib/firebase/user-db";

export default function StoryPage() {
  const [entry, setEntry] = useState<ResponseEntry | null>(null);
  const [showNav, setShowNav] = useState(false);
  const [pressed, setPressed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let mounted = true;
    void getLastEntry().then((e) => {
      if (!mounted) return;
      setEntry(e);
      setTimeout(() => { if (mounted) setShowNav(true); }, 1000);
    });
    return () => { mounted = false; };
  }, []);

  // Film grain canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const GRAIN_SIZE = 0.5;
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
        data[i + 3] = 30;
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

  const heading = `this is ${entry?.name ?? ""}${entry?.name ? "’s" : ""} story`;
  const firstChar = "t";
  const rest = heading.slice(1);

  return (
    <main className="relative w-screen h-screen overflow-hidden flex">
      {/* Film grain overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 30, imageRendering: "pixelated", width: "100%", height: "100%" }}
      />

      {/* Left panel — solid green */}
      <div
        className="relative flex flex-col justify-end"
        style={{
          width: "50%",
          backgroundColor: "#93D892",
          paddingLeft: "8%",
          paddingRight: "6%",
          paddingBottom: "10%",
          zIndex: 10,
          opacity: entry ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      >
        <h1 className="text-left leading-tight mb-6" style={{ fontSize: "3rem", color:"#003330"}}>
          <span className="font-pixel" style={{ fontSize: "3rem" }}>{firstChar.toUpperCase()}</span>
          <span className="font-gayatri" style={{ fontStyle: "italic" }}>{rest}</span>
        </h1>

        {entry?.storyCategory ? (
          <p className="font-gayatri text-sm mb-2" style={{ color: "#1a3a1a", opacity: 0.75, fontSize: "1rem"}}>
            {entry.storyCategory}
          </p>
        ) : null}

        {entry?.chosenQuestion ? (
          <p
            className="font-roboto-mono font-bold leading-relaxed mb-4"
            style={{ fontSize: "0.95rem", color: "#1a3a1a", maxWidth: "90%" }}
          >
            {entry.chosenQuestion}
          </p>
        ) : null}

        {entry?.answerText ? (
          <p
            className="font-roboto-mono leading-relaxed mb-4"
            style={{ fontSize: "0.85rem", color: "#1a1a1a", maxWidth: "90%" }}
          >
            {entry.answerText}
          </p>
        ) : null}

      </div>

      {/* Right panel — gray placeholder for video */}
      <div className="relative flex-1" style={{ backgroundColor: "#9E9E9E" }}>
        {/* Nav button */}
        <div
          className="absolute transition-opacity duration-1000"
          style={{
            bottom: "10%",
            right: "8%",
            opacity: showNav ? 1 : 0,
            pointerEvents: showNav ? "auto" : "none",
            zIndex: 20,
          }}
        >
          <Link
            href="/name"
            onMouseDown={() => setPressed(true)}
            onMouseUp={() => setPressed(false)}
            onMouseLeave={() => setPressed(false)}
            onTouchStart={() => setPressed(true)}
            onTouchEnd={() => setPressed(false)}
            style={{
              display: "inline-block",
              transform: pressed ? "scale(0.88)" : "scale(1)",
              filter: pressed ? "brightness(0.8)" : "brightness(1)",
              transition: pressed
                ? "transform 0.08s ease, filter 0.08s ease"
                : "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), filter 0.25s ease",
            }}
          >
            <Image
              src="/buttons/whats-yours.svg"
              alt="What's yours?"
              width={170}
              height={64}
            />
          </Link>
        </div>
      </div>
    </main>
  );
}
