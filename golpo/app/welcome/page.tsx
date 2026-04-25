"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";


export default function WelcomePage() {
  const [showText, setShowText] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowText(true), 50);
    const t2 = setTimeout(() => setShowNext(true), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <PageShell videoSrc="/firstpage.mp4" brightness={0.7}>
      {/* Color overlay over video, below text */}
      <div
        className="absolute inset-0"
        style={{ background: "#DB62A0", mixBlendMode: "multiply", zIndex: 3, opacity: 0.8}}
      />

      {/* Decorative stars */}
      <Image
        src="/buttons/star-1.svg"
        alt=""
        width={130}
        height={0}
        className="absolute pointer-events-none"
        style={{ left: "18%", top: "10%", zIndex: 10, height: "auto"}}
      />
      <Image
        src="/buttons/star-2.svg"
        alt=""
        width={150}
        height={0}
        className="absolute pointer-events-none"
        style={{ left: "65%", top: "55%", zIndex: 10, height: "auto" }}
      />

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
          className="text-white text-center font-[var(--font-karla)]"
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
          snapshots of the life you tell
        </div>

        <div
          className="transition-opacity duration-200"
          style={{
            marginTop: "2rem",
            opacity: showNext ? 1 : 0,
            pointerEvents: showNext ? "auto" : "none",
          }}
        >
          <a
            href="/story"
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
            <Image src="/buttons/start-button.svg" alt="begin" width={110} height={42} />
          </a>
        </div>
      </div>
    </PageShell>
  );
}
