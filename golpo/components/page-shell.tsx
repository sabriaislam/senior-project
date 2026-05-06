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
  const isGif = videoSrc.endsWith(".gif") || videoSrc.endsWith(".jpg") || videoSrc.endsWith(".png");
  const mediaStyle: React.CSSProperties = {
    filter: `brightness(${brightness})`,
    zIndex: 2,
    transform: "scale(1.3) translateX(10%)",
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {isGif ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={videoSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={mediaStyle}
        />
      ) : (
        <video
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={mediaStyle}
        />
      )}
      {grain && <FilmGrain />}
      {children}
    </main>
  );
}
