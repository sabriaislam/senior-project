"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getLastEntry, type ResponseEntry } from "@/lib/firebase/user-db";

export default function StoryPage() {
  const [entry, setEntry] = useState<ResponseEntry | null>(null);
  const [showNav, setShowNav] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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


  return (
    <main className="relative w-screen h-screen overflow-hidden flex" style={{ flexDirection: isMobile ? "column" : "row" }}>
      {/* Film grain overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 30, imageRendering: "pixelated", width: "100%", height: "100%" }}
      />

      {/* Left panel — solid off-white grey */}
      <div
        className="relative flex flex-col justify-end"
        style={{
          width: isMobile ? "100%" : "50%",
          height: isMobile ? "55%" : "100%",
          backgroundColor: "#EDEDED",
          paddingLeft: "6%",
          paddingRight: "6%",
          paddingBottom: isMobile ? "6%" : "10%",
          paddingTop: isMobile ? "6%" : "0",
          zIndex: 10,
          opacity: entry ? 1 : 0,
          transition: "opacity 0.4s ease",
          overflowY: "auto",
        }}
      >
        <h1 className="text-left leading-tight mb-2" style={{ fontSize: "clamp(1.8rem, 6vw, 3rem)", color:"#000000"}}>
          <span className="font-pixel" style={{ fontSize: "clamp(1.8rem, 6vw, 3rem)" }}>T</span>
          <span className="font-gayatri" style={{ fontStyle: "italic" }}>his is </span>
          <span className="font-gayatri" style={{ fontStyle: "italic", color: "#255085 " }}>{entry?.name ?? ""}</span>
          <span className="font-gayatri" style={{ fontStyle: "italic" }}>{`${entry?.name ? "'s" : ""} story`}</span>
        </h1>

        {entry?.chosenQuestion ? (
          <p
            className="font-roboto-mono font-bold leading-relaxed mb-4"
            style={{ fontSize: "0.95rem", color: "#000000", maxWidth: "100%" }}
          >
            {entry.chosenQuestion}
          </p>
        ) : null}

        {entry?.answerText ? (
          <p
            className="font-roboto-mono leading-relaxed mb-4"
            style={{ fontSize: "0.85rem", color: "#1a1a1a", maxWidth: "100%" }}
          >
            {entry.answerText}
          </p>
        ) : null}

      </div>

      {/* Right panel */}
      <div className="relative flex-1" style={{ backgroundColor: "#0e3d77", minHeight: isMobile ? "45%" : undefined }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <video
          src="/bg/world-spin-clear.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{ position: "absolute", top: isMobile ? 0 : -45, left: isMobile ? "50%" : 120, transform: isMobile ? "translateX(-50%)" : "none", width: isMobile ? "100%" : "70%", height: "auto", display: "block" }}
        />
        {/* Nav button */}
        <div
          className="absolute transition-opacity duration-3000"
          style={{
            bottom: "5%",
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
              width={200}
              height={64}
            />
          </Link>
        </div>
      </div>
    </main>
  );
}
