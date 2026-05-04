"use client";

import { FilmGrain } from "./film-grain";

interface PageShellProps {
  /** Path to the looping background video in /public */
  videoSrc: string;
  /** CSS brightness filter on the video (default 1) */
  brightness?: number;
  /** Show film grain overlay (default true) */
  grain?: boolean;
  children: React.ReactNode;
}

export function PageShell({ videoSrc, brightness = 1, grain = true, children }: PageShellProps) {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      <video
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: `brightness(${brightness})`, zIndex: 2, transform: "scale(1.3) translateX(10%)" }}
      />
      {grain && <FilmGrain />}
      {children}
    </main>
  );
}
