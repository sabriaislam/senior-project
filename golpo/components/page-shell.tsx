"use client";

import { FilmGrain } from "./film-grain";

interface PageShellProps {
  /** Path to the looping background video in /public */
  videoSrc: string;
  /** CSS brightness filter on the video (default 0.45) */
  brightness?: number;
  children: React.ReactNode;
}

export function PageShell({ videoSrc, brightness = 0.45, children }: PageShellProps) {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      <video
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: `brightness(${brightness})`, zIndex: 2 }}
      />
      <FilmGrain />
      {children}
    </main>
  );
}
