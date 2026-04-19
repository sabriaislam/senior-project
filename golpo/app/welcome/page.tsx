"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { GlassButton } from "@/components/glass-button";
import { PageShell } from "@/components/page-shell";


export default function WelcomePage() {
  const [showText, setShowText] = useState(false);
  const [showNext, setShowNext] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowText(true), 50);
    const t2 = setTimeout(() => setShowNext(true), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <PageShell videoSrc="/firstpage.mp4">
      {/* Intro content — GOLPO logo, subtitle, next button */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ zIndex: 20 }}
      >
        <Image
          src="/GOLPO-WHITE.svg"
          alt="GOLPO"
          width={680}
          height={340}
          priority
          style={{ filter: "drop-shadow(0px 6px 40px rgba(0,0,0,0.8))" }}
        />

        <div
          className="text-white text-center"
          style={{
            marginTop: "1rem",
            fontSize: "1.45rem",
            lineHeight: 1.5,
            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
            transition: "filter 2s ease, opacity 2s ease",
            filter: showText ? "blur(0px)" : "blur(18px)",
            opacity: showText ? 1 : 0,
          }}
        >
          The story of who you are and
          <br />
          where you came from
        </div>

        <div
          className="transition-opacity duration-200"
          style={{
            marginTop: "2rem",
            opacity: showNext ? 1 : 0,
            pointerEvents: showNext ? "auto" : "none",
          }}
        >
          <GlassButton href="/story" className="transition-all hover:scale-105">
            begin
          </GlassButton>
        </div>
      </div>
    </PageShell>
  );
}
